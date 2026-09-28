//! Credenciais da Higgsfield API. Ficam no cofre do sistema (nunca no settings.json e nunca
//! são enviadas para o webview). `HF_API_KEY_ID` / `HF_API_KEY_SECRET` no ambiente servem de
//! alternativa para desenvolvimento.

use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult, ErrorKind};

#[cfg(any(windows, target_os = "macos"))]
const SERVICE: &str = "com.uiforge.app";
#[cfg(any(windows, target_os = "macos"))]
const ACCOUNT: &str = "higgsfield-api";

#[derive(Clone, Serialize, Deserialize)]
pub struct ApiCredentials {
    pub key_id: String,
    pub key_secret: String,
}

impl std::fmt::Debug for ApiCredentials {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "ApiCredentials({})", mask(&self.key_id))
    }
}

/// `abcd…wxyz` (ou só asteriscos se for curta).
pub fn mask(value: &str) -> String {
    let n = value.chars().count();
    if n <= 8 {
        "*".repeat(n.max(4))
    } else {
        let head: String = value.chars().take(4).collect();
        let tail: String = value.chars().skip(n - 4).collect();
        format!("{head}…{tail}")
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CredentialStatus {
    pub configured: bool,
    /// "keychain" ou "env".
    pub source: Option<String>,
    pub key_id_masked: Option<String>,
}

fn from_env() -> Option<ApiCredentials> {
    let key_id = std::env::var("HF_API_KEY_ID").ok().filter(|s| !s.trim().is_empty())?;
    let key_secret = std::env::var("HF_API_KEY_SECRET").ok().filter(|s| !s.trim().is_empty())?;
    Some(ApiCredentials { key_id, key_secret })
}

#[cfg(any(windows, target_os = "macos"))]
fn entry() -> AppResult<keyring::Entry> {
    keyring::Entry::new(SERVICE, ACCOUNT).map_err(|e| AppError::internal(format!("cofre de credenciais indisponível: {e}")))
}

#[cfg(any(windows, target_os = "macos"))]
fn from_keychain() -> AppResult<Option<ApiCredentials>> {
    match entry()?.get_password() {
        Ok(json) => Ok(serde_json::from_str(&json).ok()),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(AppError::internal(format!("falha ao ler a credencial: {e}"))),
    }
}

#[cfg(not(any(windows, target_os = "macos")))]
fn from_keychain() -> AppResult<Option<ApiCredentials>> {
    Ok(None)
}

pub fn load() -> AppResult<Option<(ApiCredentials, &'static str)>> {
    if let Some(c) = from_keychain()? {
        return Ok(Some((c, "keychain")));
    }
    Ok(from_env().map(|c| (c, "env")))
}

pub fn status() -> CredentialStatus {
    match load() {
        Ok(Some((c, source))) => CredentialStatus {
            configured: true,
            source: Some(source.into()),
            key_id_masked: Some(mask(&c.key_id)),
        },
        _ => CredentialStatus { configured: false, source: None, key_id_masked: None },
    }
}

#[cfg(any(windows, target_os = "macos"))]
pub fn save(creds: &ApiCredentials) -> AppResult<()> {
    let json = serde_json::to_string(creds)?;
    entry()?.set_password(&json).map_err(|e| AppError::internal(format!("falha ao salvar a credencial: {e}")))
}

#[cfg(not(any(windows, target_os = "macos")))]
pub fn save(_creds: &ApiCredentials) -> AppResult<()> {
    Err(AppError::new(
        ErrorKind::Validation,
        "cofre de credenciais indisponível neste sistema; use as variáveis HF_API_KEY_ID e HF_API_KEY_SECRET",
    ))
}

#[cfg(any(windows, target_os = "macos"))]
pub fn clear() -> AppResult<()> {
    match entry()?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(AppError::internal(format!("falha ao apagar a credencial: {e}"))),
    }
}

#[cfg(not(any(windows, target_os = "macos")))]
pub fn clear() -> AppResult<()> {
    Ok(())
}

pub fn require() -> AppResult<ApiCredentials> {
    load()?.map(|(c, _)| c).ok_or_else(|| {
        AppError::new(
            ErrorKind::Auth,
            "Chave da API não configurada. Abra Configurações e cole o Key ID e o Key Secret do console.higgsfield.ai.",
        )
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mask_hides_the_middle() {
        assert_eq!(mask("abcd1234efgh5678"), "abcd…5678");
        assert_eq!(mask("abc"), "****");
    }

    #[test]
    fn debug_never_prints_the_secret() {
        let c = ApiCredentials { key_id: "id-000011112222".into(), key_secret: "super-secret-value".into() };
        assert!(!format!("{c:?}").contains("super-secret"));
    }
}
