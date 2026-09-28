//! Runs no disco: `<app_local_data>/runs/<id>/{manifest.json, log.jsonl, images/, thumbs/}`.

use std::collections::BTreeMap;
use std::io::Write;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::error::{AppError, AppResult, ErrorKind};
use crate::providers::JobSpec;
use crate::settings::ProviderKind;

pub const SCHEMA_VERSION: u32 = 1;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CellStatus {
    Pending,
    Submitting,
    Queued,
    InProgress,
    Downloading,
    Completed,
    Failed,
    Nsfw,
    Canceled,
    Unknown,
}

impl CellStatus {
    pub fn is_terminal(self) -> bool {
        matches!(self, Self::Completed | Self::Failed | Self::Nsfw | Self::Canceled | Self::Unknown)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CellError {
    pub kind: ErrorKind,
    pub message: String,
}

impl From<&AppError> for CellError {
    fn from(e: &AppError) -> Self {
        Self { kind: e.kind, message: e.message.clone() }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CellImage {
    /// Relativo à pasta do run.
    pub file: String,
    /// Caminho absoluto (recalculado ao ler).
    #[serde(default)]
    pub path: String,
    pub thumb_file: Option<String>,
    #[serde(default)]
    pub thumb_path: Option<String>,
    pub result_url: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

/// Tentativas anteriores de uma célula (refazer guarda o histórico).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CellAttempt {
    pub attempt: u32,
    pub status: CellStatus,
    pub remote_id: Option<String>,
    pub image: Option<CellImage>,
    pub error: Option<CellError>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CellState {
    #[serde(flatten)]
    pub spec: JobSpec,
    pub status: CellStatus,
    pub raw_status: Option<String>,
    pub remote_id: Option<String>,
    pub attempt: u32,
    pub submitted_at: Option<String>,
    pub finished_at: Option<String>,
    pub elapsed_ms: Option<u64>,
    /// Custo estimado (na unidade do provider).
    pub cost: Option<f64>,
    pub error: Option<CellError>,
    pub image: Option<CellImage>,
    #[serde(default)]
    pub history: Vec<CellAttempt>,
}

impl CellState {
    pub fn new(spec: JobSpec, cost: Option<f64>) -> Self {
        Self {
            spec,
            status: CellStatus::Pending,
            raw_status: None,
            remote_id: None,
            attempt: 0,
            submitted_at: None,
            finished_at: None,
            elapsed_ms: None,
            cost,
            error: None,
            image: None,
            history: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RunStatus {
    Running,
    Completed,
    Stopped,
    Paused,
    Interrupted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Manifest {
    pub schema_version: u32,
    pub id: String,
    pub created_at: String,
    pub provider: ProviderKind,
    pub unit: String,
    pub status: RunStatus,
    pub paused_reason: Option<String>,
    pub label: String,
    /// Configuração do formulário, como veio do front.
    pub config: Value,
    pub prompts: BTreeMap<String, String>,
    pub prompt_template_version: u32,
    pub cells: Vec<CellState>,
    /// Melhor imagem por estilo: styleId → cellId.
    #[serde(default)]
    pub best: BTreeMap<String, String>,
    /// Pasta do run (preenchida ao ler).
    #[serde(default)]
    pub dir: String,
}

impl Manifest {
    pub fn cell_mut(&mut self, cell_id: &str) -> Option<&mut CellState> {
        self.cells.iter_mut().find(|c| c.spec.cell_id == cell_id)
    }

    pub fn cell(&self, cell_id: &str) -> Option<&CellState> {
        self.cells.iter().find(|c| c.spec.cell_id == cell_id)
    }

    /// Preenche os caminhos absolutos a partir da pasta do run.
    pub fn resolve_paths(&mut self, dir: &Path) {
        self.dir = dir.to_string_lossy().into_owned();
        let fix = |img: &mut CellImage| {
            img.path = dir.join(&img.file).to_string_lossy().into_owned();
            img.thumb_path = img.thumb_file.as_ref().map(|t| dir.join(t).to_string_lossy().into_owned());
        };
        for cell in &mut self.cells {
            if let Some(img) = cell.image.as_mut() {
                fix(img);
            }
            for att in &mut cell.history {
                if let Some(img) = att.image.as_mut() {
                    fix(img);
                }
            }
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunSummary {
    pub id: String,
    pub created_at: String,
    pub label: String,
    pub provider: ProviderKind,
    pub status: RunStatus,
    pub total: usize,
    pub completed: usize,
    pub cost: f64,
    pub unit: String,
    /// Uma imagem para a miniatura do histórico.
    pub cover: Option<String>,
}

impl From<&Manifest> for RunSummary {
    fn from(m: &Manifest) -> Self {
        let done: Vec<&CellState> = m.cells.iter().filter(|c| c.status == CellStatus::Completed).collect();
        let cover = m
            .best
            .values()
            .find_map(|id| m.cell(id))
            .or_else(|| done.first().copied())
            .and_then(|c| c.image.as_ref())
            .map(|i| i.thumb_path.clone().unwrap_or_else(|| i.path.clone()));
        Self {
            id: m.id.clone(),
            created_at: m.created_at.clone(),
            label: m.label.clone(),
            provider: m.provider,
            status: m.status,
            total: m.cells.len(),
            completed: done.len(),
            cost: done.iter().filter_map(|c| c.cost).sum(),
            unit: m.unit.clone(),
            cover,
        }
    }
}

pub fn manifest_path(dir: &Path) -> PathBuf {
    dir.join("manifest.json")
}

pub fn read_manifest(dir: &Path) -> AppResult<Manifest> {
    let text = std::fs::read_to_string(manifest_path(dir))?;
    let mut m: Manifest = serde_json::from_str(&text)?;
    m.resolve_paths(dir);
    Ok(m)
}

/// Grava em arquivo temporário e renomeia (tenta de novo se o Windows estiver com o arquivo aberto).
pub fn write_manifest(dir: &Path, m: &Manifest) -> AppResult<()> {
    let tmp = dir.join("manifest.json.tmp");
    std::fs::write(&tmp, serde_json::to_vec_pretty(m)?)?;
    let target = manifest_path(dir);
    let mut last = None;
    for attempt in 0..5 {
        match std::fs::rename(&tmp, &target) {
            Ok(()) => return Ok(()),
            Err(e) => {
                last = Some(e);
                std::thread::sleep(std::time::Duration::from_millis(40 * (attempt + 1)));
            }
        }
    }
    Err(last.map(AppError::from).unwrap_or_else(|| AppError::internal("falha ao gravar manifest")))
}

pub fn append_log(dir: &Path, entry: &Value) -> AppResult<()> {
    let mut f = std::fs::OpenOptions::new().create(true).append(true).open(dir.join("log.jsonl"))?;
    writeln!(f, "{}", serde_json::to_string(entry)?)?;
    Ok(())
}

pub fn read_log(dir: &Path, cell_id: Option<&str>) -> AppResult<Vec<Value>> {
    let text = match std::fs::read_to_string(dir.join("log.jsonl")) {
        Ok(t) => t,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(e) => return Err(e.into()),
    };
    Ok(text
        .lines()
        .filter_map(|l| serde_json::from_str::<Value>(l).ok())
        .filter(|v| cell_id.is_none_or(|id| v.get("cellId").and_then(Value::as_str) == Some(id)))
        .collect())
}

pub fn list_runs(root: &Path) -> Vec<Manifest> {
    let Ok(entries) = std::fs::read_dir(root) else { return Vec::new() };
    let mut runs: Vec<Manifest> = entries
        .filter_map(Result::ok)
        .filter(|e| e.path().is_dir())
        .filter_map(|e| read_manifest(&e.path()).ok())
        .collect();
    runs.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    runs
}

/// Nome de arquivo seguro a partir de um texto qualquer.
pub fn slug(text: &str) -> String {
    let s: String = text
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c.to_ascii_lowercase() } else { '-' })
        .collect();
    let s = s.split('-').filter(|p| !p.is_empty()).collect::<Vec<_>>().join("-");
    if s.is_empty() { "run".into() } else { s.chars().take(40).collect() }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn slug_is_filesystem_safe() {
        assert_eq!(slug("Doceria / Dashboard"), "doceria-dashboard");
        assert_eq!(slug("  "), "run");
        assert_eq!(slug("glass__gpt-image-2.5__v1"), "glass-gpt-image-2-5-v1");
    }
}
