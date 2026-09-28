//! Credenciais da Higgsfield API. Ficam no cofre do sistema (nunca no settings.json e nunca
//! são enviadas para o webview). No ambiente, para desenvolvimento: `HF_CREDENTIALS` ou `HF_KEY`
//! (formato `key-id:key-secret`, como nos SDKs oficiais) ou `HF_API_KEY_ID` + `HF_API_KEY_SECRET`.

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

/// Chave como o console da Higgsfield entrega no campo "Higgsfield API Key": uma string só,
/// `key-id:key-secret`. Tolera o que costuma vir junto na colagem: aspas, `Key ` na frente,
/// `HF_CREDENTIALS=`, quebras de linha e a chave colada duas vezes. Quando recusa, descreve a
/// estrutura (tamanho e quantidade de ":") sem nunca repetir o conteúdo.
pub fn parse_key(raw: &str) -> AppResult<ApiCredentials> {
    let mut s = raw.trim();
    // `NOME=valor` de um .env (o nome não tem ":", o que não confunde com um secret terminado em "=").
    if let Some((name, value)) = s.split_once('=') {
        if !name.is_empty() && name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
            s = value.trim();
        }
    }
    s = s.trim_matches(|c| c == '"' || c == '\'').trim();
    if let Some(rest) = s.strip_prefix("Key ").or_else(|| s.strip_prefix("key ")) {
        s = rest.trim();
    }
    // A chave não tem espaços: um espaço ou quebra de linha no meio vem da cópia.
    let mut key: String = s.chars().filter(|c| !c.is_whitespace()).collect();
    // O campo é de senha e esconde o que já estava nele: colar de novo duplica a chave.
    let half = key.len() / 2;
    if key.len() % 2 == 0 && key.is_char_boundary(half) && key[..half] == key[half..] && key[..half].contains(':') {
        key.truncate(half);
    }

    let colons = key.matches(':').count();
    let chars = key.chars().count();
    let fail = |msg: String| Err(AppError::new(ErrorKind::Validation, msg));
    if colons == 0 {
        return fail(format!(
            "A chave colada tem uma parte só ({chars} caracteres, nenhum \":\"). A Higgsfield API precisa do Key ID e do \
             Secret juntos, no formato key-id:key-secret: copie pelo botão de copiar do campo \"Higgsfield API Key\" no console."
        ));
    }
    if colons > 1 {
        return fail(format!(
            "A chave colada tem {colons} \":\" ({chars} caracteres), mas deveria ter só um, entre o Key ID e o Secret. \
             Parece que foi colada mais de uma vez: cole só uma vez no campo vazio."
        ));
    }
    let (id, secret) = key.split_once(':').expect("tem exatamente um ':'");
    if id.is_empty() || secret.is_empty() {
        return fail(format!(
            "Falta {} antes ou depois do \":\" ({chars} caracteres). O formato é key-id:key-secret.",
            if id.is_empty() { "o Key ID" } else { "o Secret" }
        ));
    }
    Ok(ApiCredentials { key_id: id.into(), key_secret: secret.into() })
}

fn from_env() -> Option<ApiCredentials> {
    let var = |k: &str| std::env::var(k).ok().filter(|s| !s.trim().is_empty());
    if let (Some(key_id), Some(key_secret)) = (var("HF_API_KEY_ID"), var("HF_API_KEY_SECRET")) {
        return Some(ApiCredentials { key_id, key_secret });
    }
    ["HF_CREDENTIALS", "HF_KEY"].iter().find_map(|k| var(k)).and_then(|v| parse_key(&v).ok())
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
        "cofre de credenciais indisponível neste sistema; use a variável HF_CREDENTIALS (key-id:key-secret)",
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
            "Chave da API não configurada. Abra Configurações e cole a chave do console.higgsfield.ai (key-id:key-secret).",
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
    fn parses_the_key_as_the_console_shows_it() {
        let ok = |raw: &str| {
            let c = parse_key(raw).unwrap();
            (c.key_id, c.key_secret)
        };
        let expected = ("id-123".to_string(), "s3cr3t".to_string());
        assert_eq!(ok("id-123:s3cr3t"), expected);
        assert_eq!(ok("  id-123:s3cr3t \n"), expected);
        assert_eq!(ok("\"id-123:s3cr3t\""), expected);
        assert_eq!(ok("Key id-123:s3cr3t"), expected);
        assert_eq!(ok("HF_CREDENTIALS=\"id-123:s3cr3t\""), expected);
        // Secret em base64 pode terminar em "=": não é confundido com NOME=valor.
        assert_eq!(ok("id-123:abc=="), ("id-123".to_string(), "abc==".to_string()));
        // Quebra de linha no meio (vinda da cópia) e a chave colada duas vezes seguidas.
        assert_eq!(ok("id-123:s3cr\n3t"), expected);
        assert_eq!(ok("id-123:s3cr3tid-123:s3cr3t"), expected);
    }

    #[test]
    fn rejects_keys_in_the_wrong_format() {
        for raw in ["", "so-o-id", ":s3cr3t", "id-123:", "id-123:s3cr3t:outra:coisa"] {
            assert!(parse_key(raw).is_err(), "{raw:?} deveria ser recusada");
        }
    }

    #[test]
    fn the_error_describes_the_key_without_showing_it() {
        let msg = parse_key("abcdef0123456789").unwrap_err().message;
        assert!(msg.contains("16 caracteres") && msg.contains("nenhum"), "{msg}");
        assert!(!msg.contains("abcdef"));
        let msg = parse_key("id-123:s3cr3t:x").unwrap_err().message;
        assert!(msg.contains("2 \":\""), "{msg}");
    }

    #[test]
    fn debug_never_prints_the_secret() {
        let c = ApiCredentials { key_id: "id-000011112222".into(), key_secret: "super-secret-value".into() };
        assert!(!format!("{c:?}").contains("super-secret"));
    }
}
