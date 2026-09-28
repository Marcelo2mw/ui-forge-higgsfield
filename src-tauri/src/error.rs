use serde::{Deserialize, Serialize};

/// Categoria do erro: decide se a célula falha, se tenta de novo ou se o run inteiro pausa.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ErrorKind {
    Validation,
    Auth,
    InsufficientCredits,
    Concurrency,
    RateLimited,
    ModelUnavailable,
    ContentPolicy,
    Network,
    Timeout,
    Download,
    NotFound,
    Io,
    Internal,
}

#[derive(Debug, Clone, Serialize, thiserror::Error)]
#[error("{message}")]
pub struct AppError {
    pub kind: ErrorKind,
    pub message: String,
}

impl AppError {
    pub fn new(kind: ErrorKind, message: impl Into<String>) -> Self {
        Self { kind, message: message.into() }
    }

    pub fn internal(message: impl Into<String>) -> Self {
        Self::new(ErrorKind::Internal, message)
    }

    /// Vale a pena tentar de novo (com espera) sem mudar nada no pedido.
    pub fn retryable(&self) -> bool {
        matches!(self.kind, ErrorKind::Concurrency | ErrorKind::RateLimited | ErrorKind::Network)
    }

    /// Problema da conta: não adianta mandar os próximos jobs.
    pub fn blocks_run(&self) -> bool {
        matches!(self.kind, ErrorKind::Auth | ErrorKind::InsufficientCredits)
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        Self::new(ErrorKind::Io, e.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        Self::internal(format!("JSON inválido: {e}"))
    }
}

impl From<reqwest::Error> for AppError {
    fn from(e: reqwest::Error) -> Self {
        let kind = if e.is_timeout() { ErrorKind::Timeout } else { ErrorKind::Network };
        Self::new(kind, e.to_string())
    }
}

impl From<tauri::Error> for AppError {
    fn from(e: tauri::Error) -> Self {
        Self::internal(e.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
