//! Aviso de versão nova: consulta a última release publicada no GitHub e compara com a
//! versão instalada. Não baixa nem instala nada; o usuário decide se atualiza.

use std::time::Duration;

use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult, ErrorKind};

/// Repositório das releases. Num fork, troque pelo seu.
const REPO: &str = "Marcelo2mw/ui-forge-higgsfield";
/// Nome fixo do instalador em toda release (o link direto do README depende dele).
const SETUP_ASSET: &str = "UI-Forge-Setup-x64.exe";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub current: String,
    /// Última versão publicada; `None` quando o repositório ainda não tem release.
    pub latest: Option<String>,
    pub available: bool,
    /// Página da release (novidades).
    pub page_url: Option<String>,
    /// Link direto do instalador, quando a release tem um.
    pub download_url: Option<String>,
    pub published_at: Option<String>,
}

#[derive(Deserialize)]
struct Release {
    tag_name: String,
    html_url: String,
    published_at: Option<String>,
    #[serde(default)]
    assets: Vec<Asset>,
}

#[derive(Deserialize)]
struct Asset {
    name: String,
    browser_download_url: String,
}

pub async fn check(http: &reqwest::Client, current: &str) -> AppResult<UpdateInfo> {
    // `/releases/latest` já ignora rascunhos e pré-lançamentos. Sem chave: a API pública basta.
    let res = http
        .get(format!("https://api.github.com/repos/{REPO}/releases/latest"))
        .header("Accept", "application/vnd.github+json")
        .timeout(Duration::from_secs(15))
        .send()
        .await?;
    let none = || UpdateInfo {
        current: current.to_string(),
        latest: None,
        available: false,
        page_url: None,
        download_url: None,
        published_at: None,
    };
    if res.status() == reqwest::StatusCode::NOT_FOUND {
        return Ok(none());
    }
    if !res.status().is_success() {
        return Err(AppError::new(ErrorKind::Network, format!("GitHub respondeu {}", res.status())));
    }
    let release: Release = res.json().await?;
    let latest = release.tag_name.trim_start_matches(['v', 'V']).to_string();
    Ok(UpdateInfo {
        available: is_newer(&latest, current),
        download_url: release.assets.iter().find(|a| a.name == SETUP_ASSET).map(|a| a.browser_download_url.clone()),
        page_url: Some(release.html_url),
        published_at: release.published_at,
        latest: Some(latest),
        ..none()
    })
}

/// `1.2.3` → (1, 2, 3). Aceita "v" na frente e ignora o sufixo de pré-lançamento ("-beta").
fn parse(version: &str) -> Option<(u64, u64, u64)> {
    let core = version.trim().trim_start_matches(['v', 'V']).split(['-', '+']).next()?;
    let mut parts = core.split('.').map(|p| p.parse::<u64>());
    let major = parts.next()?.ok()?;
    let minor = parts.next().unwrap_or(Ok(0)).ok()?;
    let patch = parts.next().unwrap_or(Ok(0)).ok()?;
    Some((major, minor, patch))
}

fn is_newer(latest: &str, current: &str) -> bool {
    matches!((parse(latest), parse(current)), (Some(l), Some(c)) if l > c)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compares_versions() {
        assert!(is_newer("0.1.1", "0.1.0"));
        assert!(is_newer("v0.2.0", "0.1.9"));
        assert!(is_newer("1.0", "0.9.9"));
        assert!(is_newer("0.10.0", "0.9.0"));
        assert!(!is_newer("0.1.0", "0.1.0"));
        assert!(!is_newer("0.1.0", "0.1.1"));
        assert!(!is_newer("0.2.0-beta", "0.2.0"));
        assert!(!is_newer("lixo", "0.1.0"));
    }
}
