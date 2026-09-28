use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::error::AppResult;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ProviderKind {
    /// Higgsfield CLI local (créditos do plano). Usado no desenvolvimento.
    Cli,
    /// API HTTP da Higgsfield (carteira em dólar). Usado no vídeo.
    Api,
    /// Gera imagens falsas, sem gastar nada.
    Mock,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    pub provider: ProviderKind,
    /// Caminho do hf.exe; vazio = detectar automaticamente.
    pub cli_path: Option<String>,
    /// Jobs em andamento ao mesmo tempo (fila + processando).
    pub concurrency: u32,
    pub api_base_url: String,
    pub ui_lang: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            provider: ProviderKind::Api,
            cli_path: None,
            concurrency: 4,
            api_base_url: "https://api.higgsfield.ai".into(),
            ui_lang: "pt-BR".into(),
        }
    }
}

impl Settings {
    pub fn load(path: &Path) -> Self {
        std::fs::read_to_string(path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    }

    pub fn save(&self, path: &Path) -> AppResult<()> {
        if let Some(dir) = path.parent() {
            std::fs::create_dir_all(dir)?;
        }
        std::fs::write(path, serde_json::to_vec_pretty(self)?)?;
        Ok(())
    }
}

/// Alterações parciais vindas da tela de configurações.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsPatch {
    pub provider: Option<ProviderKind>,
    pub cli_path: Option<Option<String>>,
    pub concurrency: Option<u32>,
    pub api_base_url: Option<String>,
    pub ui_lang: Option<String>,
}

impl Settings {
    pub fn apply(&mut self, p: SettingsPatch) {
        if let Some(v) = p.provider {
            self.provider = v;
        }
        if let Some(v) = p.cli_path {
            self.cli_path = v.filter(|s| !s.trim().is_empty());
        }
        if let Some(v) = p.concurrency {
            self.concurrency = v.clamp(1, 30);
        }
        if let Some(v) = p.api_base_url {
            let v = v.trim().trim_end_matches('/').to_string();
            if !v.is_empty() {
                self.api_base_url = v;
            }
        }
        if let Some(v) = p.ui_lang {
            self.ui_lang = v;
        }
    }
}
