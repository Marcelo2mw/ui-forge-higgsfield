//! Funções puras para conversar com o Higgsfield CLI (hf.exe): montar argumentos, ler a
//! saída JSON e classificar erros. Porte de `edu/higgsfield.py` (site-educativo).

use serde_json::{Map, Value};

use super::{RemoteState, RemoteStatus};
use crate::error::{AppError, ErrorKind};

/// Uma linha só, sem caracteres de controle e sem espaços repetidos.
pub fn sanitize_prompt(text: &str) -> String {
    let cleaned: String = text
        .chars()
        .map(|c| if c.is_control() { ' ' } else { c })
        .collect();
    cleaned.split_whitespace().collect::<Vec<_>>().join(" ")
}

/// Parâmetros viram `--chave valor`. Arrays/objetos vão como JSON literal (`--colors ["#E11D74"]`).
pub fn build_flags(params: &Map<String, Value>) -> Vec<String> {
    let mut args = Vec::new();
    for (key, value) in params {
        let text = match value {
            Value::Null => continue,
            Value::Bool(b) => b.to_string(),
            Value::Number(n) => n.to_string(),
            Value::String(s) if key == "prompt" => sanitize_prompt(s),
            Value::String(s) => s.clone(),
            other => other.to_string(),
        };
        args.push(format!("--{key}"));
        args.push(text);
    }
    args
}

/// Extrai o id do job da saída do `generate create --json`.
/// Formatos aceitos: `["id"]`, `[{"id":..}]`, `{"id":..}`, `{"jobs":[..]}`, `{"job_ids":[..]}`,
/// `{"job_id":".."}`, `{"job":{..}}` ou só o id em texto puro.
pub fn parse_create_id(stdout: &str) -> Option<String> {
    let trimmed = stdout.trim();
    if trimmed.is_empty() {
        return None;
    }
    match serde_json::from_str::<Value>(trimmed) {
        Ok(v) => first_id(&v),
        Err(_) => {
            // Alguns comandos imprimem só o id.
            let token = trimmed.split_whitespace().next()?;
            looks_like_id(token).then(|| token.to_string())
        }
    }
}

fn first_id(v: &Value) -> Option<String> {
    match v {
        Value::String(s) if !s.trim().is_empty() => Some(s.trim().to_string()),
        Value::Array(items) => items.iter().find_map(first_id),
        Value::Object(map) => {
            for key in ["jobs", "job_ids", "ids", "data", "results"] {
                if let Some(inner @ Value::Array(_)) = map.get(key) {
                    return first_id(inner);
                }
            }
            if let Some(Value::String(id)) = map.get("id") {
                return Some(id.clone());
            }
            for key in ["job_id", "job", "request_id"] {
                if let Some(inner) = map.get(key) {
                    return first_id(inner);
                }
            }
            None
        }
        _ => None,
    }
}

fn looks_like_id(s: &str) -> bool {
    s.len() >= 8 && s.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

pub fn map_status(raw: &str) -> RemoteStatus {
    match raw.to_ascii_lowercase().as_str() {
        "queued" | "pending" | "waiting" | "created" => RemoteStatus::Queued,
        "in_progress" | "processing" | "running" | "started" => RemoteStatus::InProgress,
        "completed" | "succeeded" | "success" | "done" => RemoteStatus::Completed,
        "failed" | "error" => RemoteStatus::Failed,
        "nsfw" | "ip_detected" | "moderated" => RemoteStatus::Nsfw,
        "canceled" | "cancelled" => RemoteStatus::Canceled,
        _ => RemoteStatus::Unknown,
    }
}

/// Lê o objeto de `generate get <id> --json`.
pub fn parse_job(stdout: &str) -> Result<RemoteState, AppError> {
    let raw: Value = serde_json::from_str(stdout.trim())
        .map_err(|_| AppError::internal(format!("resposta inesperada do CLI: {}", clip(stdout, 300))))?;
    // `get` devolve o job; por garantia aceita também uma lista com um job.
    let job = match &raw {
        Value::Array(items) => items.first().cloned().unwrap_or(Value::Null),
        other => other.clone(),
    };
    let raw_status = job.get("status").and_then(Value::as_str).unwrap_or("").to_string();
    let params = job.get("params");
    let dim = |k: &str| params.and_then(|p| p.get(k)).and_then(Value::as_u64).map(|n| n as u32);
    Ok(RemoteState {
        status: map_status(&raw_status),
        result_url: job.get("result_url").and_then(Value::as_str).map(str::to_string),
        thumb_url: job.get("min_result_url").and_then(Value::as_str).map(str::to_string),
        width: dim("width"),
        height: dim("height"),
        error: job.get("error").and_then(Value::as_str).map(str::to_string),
        inline: None,
        raw_status,
        raw,
    })
}

/// Lê `{"credits": 1.25}` do `generate cost --json`.
pub fn parse_cost(stdout: &str) -> Result<f64, AppError> {
    let v: Value = serde_json::from_str(stdout.trim())
        .map_err(|_| AppError::internal(format!("resposta inesperada do CLI: {}", clip(stdout, 300))))?;
    v.get("credits")
        .and_then(Value::as_f64)
        .ok_or_else(|| AppError::internal(format!("custo ausente na resposta: {}", clip(stdout, 300))))
}

/// Transforma a saída de erro do CLI (stderr + código de saída) num erro categorizado.
pub fn classify_error(stderr: &str, stdout: &str, code: Option<i32>) -> AppError {
    let text = if stderr.trim().is_empty() { stdout } else { stderr };
    let message = text
        .lines()
        .map(str::trim)
        .filter(|l| !l.is_empty())
        .collect::<Vec<_>>()
        .join(" · ");
    let message = if message.is_empty() { format!("o CLI terminou com código {code:?}") } else { clip(&message, 600) };
    let lower = message.to_lowercase();
    let has = |needles: &[&str]| needles.iter().any(|n| lower.contains(n));

    let kind = if has(&["not authenticated", "not logged", "auth login", "session expired", "unauthorized", "401"]) {
        ErrorKind::Auth
    } else if has(&["not enough credits", "not_enough_credits", "insufficient", "no credits", "top up", "403"]) {
        ErrorKind::InsufficientCredits
    } else if has(&["concurrent", "too many requests in progress", "concurrency"]) {
        ErrorKind::Concurrency
    } else if has(&["429", "rate limit", "too many requests", "captcha"]) {
        ErrorKind::RateLimited
    } else if has(&["nsfw", "moderation", "content policy", "ip_detected"]) {
        ErrorKind::ContentPolicy
    } else if has(&["no model with job_type", "model is disabled", "not available", "423", "503"]) {
        ErrorKind::ModelUnavailable
    } else if has(&["not found"]) || code == Some(3) {
        ErrorKind::NotFound
    } else if has(&["422", "validation", "invalid", "should be", "must be", "unprocessable"]) || code == Some(4) {
        ErrorKind::Validation
    } else if has(&["timeout", "timed out", "deadline"]) {
        ErrorKind::Timeout
    } else if has(&["connection", "network", "dns", "tls", "unreachable", "eof"]) {
        ErrorKind::Network
    } else {
        ErrorKind::Internal
    };
    AppError::new(kind, message)
}

pub fn clip(s: &str, max: usize) -> String {
    let s = s.trim();
    if s.chars().count() <= max {
        s.to_string()
    } else {
        format!("{}…", s.chars().take(max).collect::<String>())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    const CREATE: &str = include_str!("../../tests/fixtures/cli_create.stdout.txt");
    const GET_IN_PROGRESS: &str = include_str!("../../tests/fixtures/cli_get_in_progress.json");
    const GET_COMPLETED: &str = include_str!("../../tests/fixtures/cli_get_completed.json");
    const NOT_FOUND: &str = include_str!("../../tests/fixtures/cli_get_notfound.stderr.txt");

    #[test]
    fn sanitize_keeps_one_line() {
        assert_eq!(sanitize_prompt("  um\r\ndois\ttrês\u{0}  "), "um dois três");
    }

    #[test]
    fn flags_cover_all_value_types() {
        let params = json!({
            "prompt": "a  sofa\n& a lamp",
            "resolution": "4k",
            "seed": null,
            "hd": true,
            "count": 2,
            "colors": ["#E11D74"]
        });
        let flags = build_flags(params.as_object().unwrap());
        let pairs: Vec<(String, String)> = flags.chunks(2).map(|c| (c[0].clone(), c[1].clone())).collect();
        assert!(pairs.contains(&("--prompt".into(), "a sofa & a lamp".into())));
        assert!(pairs.contains(&("--resolution".into(), "4k".into())));
        assert!(pairs.contains(&("--hd".into(), "true".into())));
        assert!(pairs.contains(&("--count".into(), "2".into())));
        assert!(pairs.contains(&("--colors".into(), "[\"#E11D74\"]".into())));
        assert!(!flags.contains(&"--seed".to_string()));
    }

    #[test]
    fn create_real_fixture_is_an_id_list() {
        assert_eq!(parse_create_id(CREATE).as_deref(), Some("da9071ba-dbcf-4c02-bc3d-117f95e0f451"));
    }

    #[test]
    fn create_accepts_every_known_shape() {
        for out in [
            r#"{"id":"j1"}"#,
            r#"[{"id":"j1"}]"#,
            r#"["j1"]"#,
            "j1-abcdef",
            r#"{"jobs":[{"id":"j1"}]}"#,
            r#"{"job_ids":["j1"]}"#,
            r#"{"job_id":"j1"}"#,
            r#"{"job":{"id":"j1"}}"#,
        ] {
            let id = parse_create_id(out).unwrap_or_default();
            assert!(id.starts_with("j1"), "falhou em {out}: {id}");
        }
        assert_eq!(parse_create_id(r#"{"unexpected":true}"#), None);
        assert_eq!(parse_create_id("   "), None);
    }

    #[test]
    fn get_fixtures_map_status_and_urls() {
        let running = parse_job(GET_IN_PROGRESS).unwrap();
        assert_eq!(running.status, RemoteStatus::InProgress);
        assert!(running.result_url.is_none());

        let done = parse_job(GET_COMPLETED).unwrap();
        assert_eq!(done.status, RemoteStatus::Completed);
        assert!(done.result_url.unwrap().ends_with(".png"));
        assert!(done.thumb_url.unwrap().ends_with("_min.webp"));
        assert_eq!((done.width, done.height), (Some(1536), Some(1536)));
        // O prompt com aspas, %, & e acentos voltou intacto (chamando o hf.exe direto, sem cmd.exe).
        assert_eq!(
            done.raw["params"]["prompt"].as_str().unwrap(),
            "UI Forge fixture: \"aspas\", 100% & acentuação ç ã"
        );
    }

    #[test]
    fn statuses_map_to_terminal_states() {
        assert!(map_status("completed").is_terminal());
        assert!(map_status("NSFW").is_terminal());
        assert!(map_status("ip_detected").is_terminal());
        assert!(!map_status("queued").is_terminal());
        assert_eq!(map_status("whatever"), RemoteStatus::Unknown);
    }

    #[test]
    fn errors_are_classified() {
        assert_eq!(classify_error(NOT_FOUND, "", Some(3)).kind, ErrorKind::NotFound);
        assert_eq!(classify_error("Error: Not authenticated. Hint: run higgsfield auth login", "", Some(1)).kind, ErrorKind::Auth);
        assert_eq!(classify_error("Error: not enough credits", "", Some(1)).kind, ErrorKind::InsufficientCredits);
        assert_eq!(classify_error("Error: request failed (422): Unprocessable Entity", "", Some(1)).kind, ErrorKind::Validation);
        assert_eq!(classify_error("Error: No model with job_type \"soul_v2\".", "", Some(1)).kind, ErrorKind::ModelUnavailable);
        assert_eq!(classify_error("HTTP 429 Too Many Requests", "", Some(1)).kind, ErrorKind::RateLimited);
        assert_eq!(classify_error("aspect_ratio should be one of 1:1, 16:9", "", Some(4)).kind, ErrorKind::Validation);
    }

    #[test]
    fn cost_is_parsed() {
        assert_eq!(parse_cost("{\n \"credits\": 1.25\n}").unwrap(), 1.25);
        assert!(parse_cost("oops").is_err());
    }
}
