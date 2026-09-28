//! Provider da Higgsfield API (HTTP, carteira em dólar). Segue https://docs.higgsfield.ai:
//! `POST /{endpoint}` → `request_id`; `GET /requests/{id}/status`; `POST /estimate/{endpoint}`.
//! A chave fica só aqui no Rust; o log mostra o header mascarado.

use reqwest::{Method, StatusCode};
use serde_json::{json, Map, Value};

use super::{AccountInfo, JobSpec, RemoteState, Submitted};
use crate::error::{AppError, AppResult, ErrorKind};
use crate::providers::cli_parse::{clip, map_status};
use crate::secrets::ApiCredentials;

pub struct ApiProvider {
    base: String,
    creds: ApiCredentials,
    http: reqwest::Client,
}

impl ApiProvider {
    pub fn new(base: &str, creds: ApiCredentials, http: reqwest::Client) -> Self {
        Self { base: base.trim_end_matches('/').to_string(), creds, http }
    }

    fn url(&self, path: &str) -> String {
        format!("{}/{}", self.base, path.trim_start_matches('/'))
    }

    /// Versão do pedido que pode aparecer no log (e na tela do vídeo): sem a chave.
    fn loggable(&self, method: &Method, url: &str, body: Option<&Value>) -> Value {
        json!({
            "method": method.as_str(),
            "url": url,
            "headers": { "Authorization": "Key ****:****", "Content-Type": "application/json" },
            "body": body,
        })
    }

    async fn send(&self, method: Method, path: &str, body: Option<&Value>) -> AppResult<(Value, Value)> {
        let url = self.url(path);
        let request_log = self.loggable(&method, &url, body);
        let mut req = self
            .http
            .request(method, &url)
            .header("Authorization", format!("Key {}:{}", self.creds.key_id, self.creds.key_secret))
            .header("Accept", "application/json");
        if let Some(b) = body {
            req = req.json(b);
        }
        let resp = req.send().await?;
        let status = resp.status();
        let correlation = resp
            .headers()
            .get("x-correlation-id")
            .and_then(|v| v.to_str().ok())
            .map(str::to_string);
        let text = resp.text().await.unwrap_or_default();
        let parsed = serde_json::from_str::<Value>(&text).unwrap_or_else(|_| Value::String(clip(&text, 2000)));
        if status.is_success() {
            Ok((request_log, parsed))
        } else {
            Err(http_error(status, &parsed, correlation.as_deref()))
        }
    }

    pub async fn estimate(&self, endpoint: &str, params: &Map<String, Value>) -> AppResult<f64> {
        let (_, v) = self.send(Method::POST, &format!("estimate/{endpoint}"), Some(&Value::Object(params.clone()))).await?;
        find_number(&v, &["usd", "price_usd", "cost_usd", "amount_usd"])
            .ok_or_else(|| AppError::internal(format!("o /estimate não trouxe o preço em US$: {}", clip(&v.to_string(), 300))))
    }

    pub async fn submit(&self, spec: &JobSpec) -> AppResult<Submitted> {
        let body = Value::Object(spec.params.clone());
        let (request, response) = self.send(Method::POST, &spec.target, Some(&body)).await?;
        let remote_id = response
            .get("request_id")
            .or_else(|| response.get("id"))
            .and_then(Value::as_str)
            .map(str::to_string)
            .ok_or_else(|| AppError::internal(format!("resposta sem request_id: {}", clip(&response.to_string(), 300))))?;
        Ok(Submitted { remote_id, request, response })
    }

    pub async fn poll(&self, request_id: &str) -> AppResult<RemoteState> {
        let (_, v) = self.send(Method::GET, &format!("requests/{request_id}/status"), None).await?;
        Ok(parse_status(v))
    }

    /// Não há endpoint público de saldo: só confirma que a chave responde (o /estimate é grátis).
    pub async fn account(&self) -> AppResult<AccountInfo> {
        Ok(AccountInfo { plan: Some("pay-as-you-go".into()), ..Default::default() })
    }

    pub async fn check_key(&self) -> AppResult<f64> {
        let mut params = Map::new();
        params.insert("prompt".into(), Value::String("UI Forge key check".into()));
        self.estimate("higgsfield-ai/soul/v2/standard", &params).await
    }
}

pub fn parse_status(v: Value) -> RemoteState {
    let raw_status = v.get("status").and_then(Value::as_str).unwrap_or("").to_string();
    let first_image = v
        .get("images")
        .and_then(Value::as_array)
        .and_then(|a| a.first())
        .and_then(|i| i.get("url"))
        .and_then(Value::as_str)
        .map(str::to_string);
    RemoteState {
        status: map_status(&raw_status),
        result_url: first_image,
        thumb_url: None,
        width: None,
        height: None,
        error: v.get("error").and_then(Value::as_str).map(str::to_string),
        inline: None,
        raw_status,
        raw: v,
    }
}

fn find_number(v: &Value, keys: &[&str]) -> Option<f64> {
    match v {
        Value::Object(map) => {
            for k in keys {
                if let Some(n) = map.get(*k).and_then(Value::as_f64) {
                    return Some(n);
                }
            }
            map.values().find_map(|inner| find_number(inner, keys))
        }
        Value::Array(items) => items.iter().find_map(|i| find_number(i, keys)),
        _ => None,
    }
}

fn http_error(status: StatusCode, body: &Value, correlation: Option<&str>) -> AppError {
    let detail = body
        .get("detail")
        .map(|d| if let Value::String(s) = d { s.clone() } else { d.to_string() })
        .unwrap_or_else(|| body.to_string());
    let lower = detail.to_lowercase();
    let kind = match status.as_u16() {
        400 if lower.contains("concurren") => ErrorKind::Concurrency,
        400 | 422 => ErrorKind::Validation,
        401 => ErrorKind::Auth,
        403 => ErrorKind::InsufficientCredits,
        404 => ErrorKind::ModelUnavailable,
        423 | 503 => ErrorKind::ModelUnavailable,
        429 => ErrorKind::RateLimited,
        500..=599 => ErrorKind::Network,
        _ => ErrorKind::Internal,
    };
    let reference = correlation.map(|c| format!(" (ref {c})")).unwrap_or_default();
    AppError::new(kind, format!("HTTP {}: {}{}", status.as_u16(), clip(&detail, 400), reference))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::providers::RemoteStatus;

    #[test]
    fn status_response_is_parsed() {
        let done = parse_status(json!({
            "status": "completed",
            "request_id": "d7e6c0f3-6699-4f6c-bb45-2ad7fd9158ff",
            "images": [{ "url": "https://cdn.example/out.png" }],
            "error": null
        }));
        assert_eq!(done.status, RemoteStatus::Completed);
        assert_eq!(done.result_url.as_deref(), Some("https://cdn.example/out.png"));

        let queued = parse_status(json!({ "status": "queued", "request_id": "x" }));
        assert_eq!(queued.status, RemoteStatus::Queued);
        assert!(queued.result_url.is_none());
    }

    #[test]
    fn http_errors_follow_the_docs() {
        let e = |code: u16, detail: &str| http_error(StatusCode::from_u16(code).unwrap(), &json!({ "detail": detail }), None).kind;
        assert_eq!(e(401, "Missing or invalid credentials"), ErrorKind::Auth);
        assert_eq!(e(403, "Insufficient credits"), ErrorKind::InsufficientCredits);
        assert_eq!(e(400, "Maximum number of concurrent requests (4) has been reached"), ErrorKind::Concurrency);
        assert_eq!(e(400, "invalid aspect_ratio"), ErrorKind::Validation);
        assert_eq!(e(404, "model not found"), ErrorKind::ModelUnavailable);
        assert_eq!(e(503, "disabled"), ErrorKind::ModelUnavailable);
        assert!(http_error(StatusCode::BAD_GATEWAY, &json!({}), None).retryable());
    }

    #[test]
    fn usd_is_found_anywhere_in_the_estimate() {
        assert_eq!(find_number(&json!({ "credits": 3, "usd": 0.0032 }), &["usd"]), Some(0.0032));
        assert_eq!(find_number(&json!({ "estimate": { "credits": 3, "usd": 0.5 } }), &["usd"]), Some(0.5));
        assert_eq!(find_number(&json!({ "credits": 3 }), &["usd"]), None);
    }

    #[test]
    fn log_never_contains_the_key() {
        let p = ApiProvider::new(
            "https://api.higgsfield.ai/",
            ApiCredentials { key_id: "KEYID123".into(), key_secret: "SECRET456".into() },
            reqwest::Client::new(),
        );
        let log = p.loggable(&Method::POST, &p.url("higgsfield-ai/soul/v2/standard"), Some(&json!({ "prompt": "x" })));
        let text = log.to_string();
        assert!(!text.contains("KEYID123") && !text.contains("SECRET456"));
        assert_eq!(log["url"], "https://api.higgsfield.ai/higgsfield-ai/soul/v2/standard");
    }
}
