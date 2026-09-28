//! Providers de geração. O front monta os pedidos completos (`JobSpec`); aqui só executamos.

pub mod api;
pub mod cli;
pub mod cli_parse;
pub mod mock;

use std::sync::Arc;

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::error::AppResult;
use crate::settings::ProviderKind;

/// Um pedido de geração (uma célula da grade), montado pelo front.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobSpec {
    pub cell_id: String,
    pub style_id: String,
    /// Variante do prompt (A, B, C, D) quando o run compara variantes.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub variant_key: Option<String>,
    pub model_id: String,
    pub variation: u32,
    /// job_type (CLI/mock) ou endpoint (API).
    pub target: String,
    /// Parâmetros do modelo, incluindo `prompt` e `aspect_ratio`.
    pub params: Map<String, Value>,
}

impl JobSpec {
    pub fn prompt(&self) -> &str {
        self.params.get("prompt").and_then(Value::as_str).unwrap_or_default()
    }
}

/// Preço de uma imagem: fixo, ou cobrado pelo uso depois de gerar (ex.: tokens), quando o
/// /estimate só devolve a descrição da tabela de preços.
#[derive(Debug, Clone, PartialEq)]
pub enum Price {
    Fixed(f64),
    ByUsage(String),
}

#[derive(Debug, Clone)]
pub struct Submitted {
    pub remote_id: String,
    /// O que foi enviado e o que voltou, para o log (sem segredos).
    pub request: Value,
    pub response: Value,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RemoteStatus {
    Queued,
    InProgress,
    Completed,
    Failed,
    Nsfw,
    Canceled,
    Unknown,
}

impl RemoteStatus {
    pub fn is_terminal(&self) -> bool {
        matches!(self, Self::Completed | Self::Failed | Self::Nsfw | Self::Canceled)
    }
}

/// Imagem gerada localmente (provider mock), sem download.
#[derive(Debug, Clone)]
pub struct InlineImage {
    pub bytes: Vec<u8>,
    pub ext: &'static str,
}

#[derive(Debug, Clone)]
pub struct RemoteState {
    pub status: RemoteStatus,
    pub raw_status: String,
    pub result_url: Option<String>,
    pub thumb_url: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub error: Option<String>,
    pub inline: Option<InlineImage>,
    pub raw: Value,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AccountInfo {
    pub provider: Option<ProviderKind>,
    pub email: Option<String>,
    pub plan: Option<String>,
    pub credits: Option<f64>,
    pub usd: Option<f64>,
}

pub enum Provider {
    Cli(cli::CliProvider),
    Api(api::ApiProvider),
    Mock(Arc<mock::MockProvider>),
}

impl Provider {
    pub fn kind(&self) -> ProviderKind {
        match self {
            Self::Cli(_) => ProviderKind::Cli,
            Self::Api(_) => ProviderKind::Api,
            Self::Mock(_) => ProviderKind::Mock,
        }
    }

    /// Unidade dos custos devolvidos por `estimate`.
    pub fn unit(&self) -> &'static str {
        match self {
            Self::Api(_) => "usd",
            _ => "credits",
        }
    }

    pub async fn estimate(&self, target: &str, params: &Map<String, Value>) -> AppResult<Price> {
        match self {
            Self::Cli(p) => p.estimate(target, params).await.map(Price::Fixed),
            Self::Api(p) => p.estimate(target, params).await,
            Self::Mock(p) => Ok(Price::Fixed(p.estimate(target))),
        }
    }

    pub async fn submit(&self, spec: &JobSpec) -> AppResult<Submitted> {
        match self {
            Self::Cli(p) => p.submit(spec).await,
            Self::Api(p) => p.submit(spec).await,
            Self::Mock(p) => p.submit(spec),
        }
    }

    pub async fn poll(&self, remote_id: &str) -> AppResult<RemoteState> {
        match self {
            Self::Cli(p) => p.poll(remote_id).await,
            Self::Api(p) => p.poll(remote_id).await,
            Self::Mock(p) => p.poll(remote_id),
        }
    }

    pub async fn account(&self) -> AppResult<AccountInfo> {
        let mut info = match self {
            Self::Cli(p) => p.account().await?,
            Self::Api(p) => p.account().await?,
            Self::Mock(p) => p.account(),
        };
        info.provider = Some(self.kind());
        Ok(info)
    }

    /// Depois de um crash entre o `create` e a gravação do id: procura o job pelo prompt.
    pub async fn find_orphan(&self, spec: &JobSpec, exclude: &[String]) -> AppResult<Option<String>> {
        match self {
            Self::Cli(p) => p.find_orphan(&spec.target, spec.prompt(), exclude).await,
            // A API não lista requests: sem o id, não há como achar o job (nunca reenviamos).
            Self::Api(_) | Self::Mock(_) => Ok(None),
        }
    }
}
