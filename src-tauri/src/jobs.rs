//! Execução dos runs: uma task por célula, limitada por um semáforo compartilhado.
//! Fluxo de cada célula: enviar → consultar status até terminar → baixar a imagem.
//! Regra de ouro: um envio que pode ter sido cobrado nunca é repetido às cegas.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use rand::Rng;
use serde::Serialize;
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::Semaphore;

use crate::error::{AppError, AppResult, ErrorKind};
use crate::providers::{Provider, RemoteState, RemoteStatus, Submitted};
use crate::state::AppState;
use crate::storage::{self, CellAttempt, CellError, CellImage, CellState, CellStatus, Manifest, RunStatus, RunSummary};

const MAX_POLL: Duration = Duration::from_secs(20 * 60);
const SUBMIT_ATTEMPTS: u32 = 4;

pub struct RunHandle {
    pub id: String,
    pub dir: PathBuf,
    manifest: Mutex<Manifest>,
    stopped: AtomicBool,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct CellUpdate<'a> {
    run_id: &'a str,
    cell: &'a CellState,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct RunUpdate {
    run_id: String,
    summary: RunSummary,
    paused_reason: Option<String>,
}

impl RunHandle {
    pub fn new(manifest: Manifest, dir: PathBuf) -> Self {
        Self { id: manifest.id.clone(), dir, manifest: Mutex::new(manifest), stopped: AtomicBool::new(false) }
    }

    pub fn snapshot(&self) -> Manifest {
        self.manifest.lock().unwrap().clone()
    }

    pub fn is_stopped(&self) -> bool {
        self.stopped.load(Ordering::SeqCst)
    }

    /// Altera uma célula, grava o manifest e avisa o front.
    pub fn update_cell(&self, app: &AppHandle, cell_id: &str, f: impl FnOnce(&mut CellState)) -> Option<CellState> {
        let mut m = self.manifest.lock().unwrap();
        let cell = m.cell_mut(cell_id)?;
        f(cell);
        let copy = cell.clone();
        if let Err(e) = storage::write_manifest(&self.dir, &m) {
            eprintln!("[ui-forge] falha ao gravar manifest {}: {e}", self.id);
        }
        let _ = app.emit("job://update", CellUpdate { run_id: &self.id, cell: &copy });
        Some(copy)
    }

    pub fn update_manifest(&self, app: &AppHandle, f: impl FnOnce(&mut Manifest)) -> Manifest {
        let mut m = self.manifest.lock().unwrap();
        f(&mut m);
        if let Err(e) = storage::write_manifest(&self.dir, &m) {
            eprintln!("[ui-forge] falha ao gravar manifest {}: {e}", self.id);
        }
        emit_run(app, &m);
        m.clone()
    }

    pub fn log(&self, app: &AppHandle, cell_id: Option<&str>, kind: &str, title: impl Into<String>, body: Value) {
        let entry = json!({
            "runId": self.id,
            "cellId": cell_id,
            "ts": now(),
            "kind": kind,
            "title": title.into(),
            "body": body,
        });
        let _ = storage::append_log(&self.dir, &entry);
        let _ = app.emit("log://entry", entry);
    }

    /// Para de enviar jobs novos (os que já foram enviados continuam sendo acompanhados:
    /// já foram cobrados e a imagem vai chegar).
    pub fn stop(&self, app: &AppHandle, reason: Option<String>) {
        self.stopped.store(true, Ordering::SeqCst);
        self.update_manifest(app, |m| {
            if let Some(r) = reason {
                m.status = RunStatus::Paused;
                m.paused_reason = Some(r);
            } else if m.status == RunStatus::Running {
                m.status = RunStatus::Stopped;
            }
            for c in m.cells.iter_mut().filter(|c| c.status == CellStatus::Pending) {
                c.status = CellStatus::Canceled;
            }
        });
    }

    fn finish_if_done(&self, app: &AppHandle) {
        let mut m = self.manifest.lock().unwrap();
        if m.cells.iter().all(|c| c.status.is_terminal()) && m.status == RunStatus::Running {
            m.status = RunStatus::Completed;
            let _ = storage::write_manifest(&self.dir, &m);
        }
        emit_run(app, &m);
    }

    /// Reabre um run parado para refazer células.
    pub fn reopen(&self) {
        self.stopped.store(false, Ordering::SeqCst);
        let mut m = self.manifest.lock().unwrap();
        m.status = RunStatus::Running;
        m.paused_reason = None;
    }
}

fn emit_run(app: &AppHandle, m: &Manifest) {
    let _ = app.emit(
        "run://update",
        RunUpdate { run_id: m.id.clone(), summary: RunSummary::from(m), paused_reason: m.paused_reason.clone() },
    );
}

#[derive(Default)]
pub struct RunManager {
    runs: Mutex<HashMap<String, Arc<RunHandle>>>,
}

impl RunManager {
    pub fn get(&self, id: &str) -> Option<Arc<RunHandle>> {
        self.runs.lock().unwrap().get(id).cloned()
    }

    pub fn insert(&self, handle: Arc<RunHandle>) {
        self.runs.lock().unwrap().insert(handle.id.clone(), handle);
    }

    pub fn remove(&self, id: &str) -> Option<Arc<RunHandle>> {
        self.runs.lock().unwrap().remove(id)
    }

    /// Handle em memória, ou carregado do disco (histórico).
    pub fn load(&self, runs_dir: &Path, id: &str) -> AppResult<Arc<RunHandle>> {
        if let Some(h) = self.get(id) {
            return Ok(h);
        }
        let dir = runs_dir.join(id);
        let manifest = storage::read_manifest(&dir)
            .map_err(|e| AppError::new(ErrorKind::NotFound, format!("run {id} não encontrado: {e}")))?;
        let handle = Arc::new(RunHandle::new(manifest, dir));
        self.insert(handle.clone());
        Ok(handle)
    }
}

pub fn now() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}

fn elapsed_since(iso: Option<&str>) -> Option<u64> {
    let start = chrono::DateTime::parse_from_rfc3339(iso?).ok()?;
    let ms = chrono::Utc::now().signed_duration_since(start).num_milliseconds();
    (ms >= 0).then_some(ms as u64)
}

/// Dispara as tasks de todas as células ainda não terminadas de um run.
pub fn spawn_pending(app: &AppHandle, run: &Arc<RunHandle>, provider: Arc<Provider>, limiter: Arc<Semaphore>) {
    let cells: Vec<String> = run
        .snapshot()
        .cells
        .iter()
        .filter(|c| !c.status.is_terminal())
        .map(|c| c.spec.cell_id.clone())
        .collect();
    for cell_id in cells {
        spawn_cell(app, run, provider.clone(), limiter.clone(), cell_id);
    }
}

pub fn spawn_cell(app: &AppHandle, run: &Arc<RunHandle>, provider: Arc<Provider>, limiter: Arc<Semaphore>, cell_id: String) {
    let (app, run) = (app.clone(), run.clone());
    tauri::async_runtime::spawn(async move {
        run_cell(&app, &run, &provider, limiter, &cell_id).await;
        run.finish_if_done(&app);
    });
}

async fn run_cell(app: &AppHandle, run: &RunHandle, provider: &Provider, limiter: Arc<Semaphore>, cell_id: &str) {
    let Ok(permit) = limiter.acquire_owned().await else { return };
    let Some(cell) = run.snapshot().cell(cell_id).cloned() else { return };

    let remote_id = match (cell.status, cell.remote_id.clone()) {
        // Retomada depois de reiniciar o app: o job já existe no servidor.
        (CellStatus::Queued | CellStatus::InProgress | CellStatus::Downloading, Some(id)) => id,
        // Caiu no meio do envio: talvez o job exista. Procura pelo prompt antes de qualquer coisa.
        (CellStatus::Submitting, None) => match adopt_orphan(run, provider, &cell).await {
            Some(id) => {
                run.update_cell(app, cell_id, |c| {
                    c.remote_id = Some(id.clone());
                    c.status = CellStatus::Queued;
                });
                id
            }
            None => {
                fail(app, run, cell_id, CellStatus::Unknown, &AppError::new(ErrorKind::Internal, "o app fechou durante o envio e o job não foi encontrado"));
                return;
            }
        },
        _ => {
            if run.is_stopped() {
                run.update_cell(app, cell_id, |c| c.status = CellStatus::Canceled);
                return;
            }
            match submit(app, run, provider, &cell).await {
                Some(id) => id,
                None => return,
            }
        }
    };

    let final_state = poll_until_done(app, run, provider, cell_id, &remote_id).await;
    drop(permit); // o download não ocupa vaga de geração
    let Some(state) = final_state else { return };

    match state.status {
        RemoteStatus::Completed => {
            run.update_cell(app, cell_id, |c| c.status = CellStatus::Downloading);
            let attempt = run.snapshot().cell(cell_id).map(|c| c.attempt).unwrap_or(1);
            match save_image(app, run, cell_id, attempt, &state).await {
                Ok(image) => {
                    run.update_cell(app, cell_id, |c| {
                        c.status = CellStatus::Completed;
                        c.raw_status = Some(state.raw_status.clone());
                        c.finished_at = Some(now());
                        c.elapsed_ms = elapsed_since(c.submitted_at.as_deref());
                        c.image = Some(image);
                        c.error = None;
                    });
                }
                Err(e) => fail(app, run, cell_id, CellStatus::Failed, &AppError::new(ErrorKind::Download, e.message)),
            }
        }
        RemoteStatus::Nsfw => fail(
            app,
            run,
            cell_id,
            CellStatus::Nsfw,
            &AppError::new(ErrorKind::ContentPolicy, "bloqueado pela moderação do modelo (não é cobrado)"),
        ),
        RemoteStatus::Canceled => {
            run.update_cell(app, cell_id, |c| c.status = CellStatus::Canceled);
        }
        _ => fail(
            app,
            run,
            cell_id,
            CellStatus::Failed,
            &AppError::new(ErrorKind::Internal, state.error.clone().unwrap_or_else(|| format!("status '{}'", state.raw_status))),
        ),
    }
}

async fn submit(app: &AppHandle, run: &RunHandle, provider: &Provider, cell: &CellState) -> Option<String> {
    let cell_id = cell.spec.cell_id.as_str();
    run.update_cell(app, cell_id, |c| {
        c.status = CellStatus::Submitting;
        c.attempt += 1;
        c.submitted_at = Some(now());
        c.finished_at = None;
        c.error = None;
    });

    let mut attempt = 0;
    loop {
        attempt += 1;
        match provider.submit(&cell.spec).await {
            Ok(Submitted { remote_id, request, response }) => {
                run.log(app, Some(cell_id), "request", format!("Enviado para {}", cell.spec.target), request);
                run.log(app, Some(cell_id), "response", format!("Job criado: {remote_id}"), response);
                run.update_cell(app, cell_id, |c| {
                    c.remote_id = Some(remote_id.clone());
                    c.status = CellStatus::Queued;
                });
                return Some(remote_id);
            }
            Err(e) if e.retryable() && attempt < SUBMIT_ATTEMPTS => {
                let wait = backoff(attempt);
                run.log(app, Some(cell_id), "error", format!("Tentativa {attempt}: {} (nova tentativa em {}s)", e.message, wait.as_secs()), json!(e));
                tokio::time::sleep(wait).await;
            }
            Err(e) => {
                run.log(app, Some(cell_id), "error", format!("Falha no envio: {}", e.message), json!(e));
                // Resposta sem id ou tempo esgotado: o job pode ter sido criado (e cobrado).
                if matches!(e.kind, ErrorKind::Internal | ErrorKind::Timeout) {
                    if let Some(id) = adopt_orphan(run, provider, cell).await {
                        run.log(app, Some(cell_id), "info", format!("Job encontrado pelo prompt: {id}"), Value::Null);
                        run.update_cell(app, cell_id, |c| {
                            c.remote_id = Some(id.clone());
                            c.status = CellStatus::Queued;
                        });
                        return Some(id);
                    }
                }
                fail(app, run, cell_id, CellStatus::Failed, &e);
                if e.blocks_run() {
                    let reason = match e.kind {
                        ErrorKind::InsufficientCredits => "Créditos insuficientes.",
                        _ => "Problema de autenticação no provider.",
                    };
                    run.stop(app, Some(format!("{reason} {}", e.message)));
                }
                return None;
            }
        }
    }
}

async fn adopt_orphan(run: &RunHandle, provider: &Provider, cell: &CellState) -> Option<String> {
    let known: Vec<String> = run.snapshot().cells.iter().filter_map(|c| c.remote_id.clone()).collect();
    provider.find_orphan(&cell.spec, &known).await.ok().flatten()
}

async fn poll_until_done(app: &AppHandle, run: &RunHandle, provider: &Provider, cell_id: &str, remote_id: &str) -> Option<RemoteState> {
    let started = Instant::now();
    let mut failures = 0;
    loop {
        tokio::time::sleep(poll_interval(started.elapsed())).await;
        if started.elapsed() > MAX_POLL {
            fail(app, run, cell_id, CellStatus::Unknown, &AppError::new(ErrorKind::Timeout, "o job não terminou em 20 minutos"));
            return None;
        }
        match provider.poll(remote_id).await {
            Ok(state) if state.status.is_terminal() => {
                run.log(app, Some(cell_id), "status", format!("Status final: {}", state.raw_status), state.raw.clone());
                return Some(state);
            }
            Ok(state) => {
                failures = 0;
                let status = match state.status {
                    RemoteStatus::InProgress => CellStatus::InProgress,
                    _ => CellStatus::Queued,
                };
                let changed = run.snapshot().cell(cell_id).map(|c| c.status != status).unwrap_or(false);
                if changed {
                    run.update_cell(app, cell_id, |c| {
                        c.status = status;
                        c.raw_status = Some(state.raw_status.clone());
                    });
                }
            }
            Err(e) if e.kind == ErrorKind::NotFound => {
                fail(app, run, cell_id, CellStatus::Failed, &e);
                return None;
            }
            Err(e) => {
                failures += 1;
                if failures >= 6 {
                    fail(app, run, cell_id, CellStatus::Unknown, &e);
                    return None;
                }
            }
        }
    }
}

fn poll_interval(elapsed: Duration) -> Duration {
    match elapsed.as_secs() {
        0..=30 => Duration::from_millis(2_500),
        31..=120 => Duration::from_secs(4),
        _ => Duration::from_secs(7),
    }
}

fn backoff(attempt: u32) -> Duration {
    let base = 3_000u64 * 2u64.pow(attempt.saturating_sub(1));
    Duration::from_millis(base + rand::rng().random_range(0..1_000))
}

fn fail(app: &AppHandle, run: &RunHandle, cell_id: &str, status: CellStatus, e: &AppError) {
    run.update_cell(app, cell_id, |c| {
        c.status = status;
        c.error = Some(CellError::from(e));
        c.finished_at = Some(now());
        c.elapsed_ms = elapsed_since(c.submitted_at.as_deref());
    });
}

async fn save_image(app: &AppHandle, run: &RunHandle, cell_id: &str, attempt: u32, state: &RemoteState) -> AppResult<CellImage> {
    let base = if attempt > 1 { format!("{cell_id}.a{attempt}") } else { cell_id.to_string() };
    let images = run.dir.join("images");
    tokio::fs::create_dir_all(&images).await?;

    let (bytes, ext) = if let Some(inline) = &state.inline {
        (inline.bytes.clone(), inline.ext.to_string())
    } else {
        let url = state
            .result_url
            .as_deref()
            .ok_or_else(|| AppError::new(ErrorKind::Download, "o job terminou sem URL de resultado"))?;
        (download(app, url).await?, ext_from_url(url, "png"))
    };
    let file = format!("images/{base}.{ext}");
    write_atomic(&run.dir.join(&file), &bytes).await?;

    // Miniatura pronta do CDN (a grade carrega bem mais rápido).
    let mut thumb_file = None;
    if let Some(url) = &state.thumb_url {
        if let Ok(bytes) = download(app, url).await {
            let rel = format!("thumbs/{base}.{}", ext_from_url(url, "webp"));
            tokio::fs::create_dir_all(run.dir.join("thumbs")).await?;
            if write_atomic(&run.dir.join(&rel), &bytes).await.is_ok() {
                thumb_file = Some(rel);
            }
        }
    }
    Ok(CellImage {
        path: run.dir.join(&file).to_string_lossy().into_owned(),
        thumb_path: thumb_file.as_ref().map(|t| run.dir.join(t).to_string_lossy().into_owned()),
        file,
        thumb_file,
        result_url: state.result_url.clone(),
        width: state.width,
        height: state.height,
    })
}

async fn download(app: &AppHandle, url: &str) -> AppResult<Vec<u8>> {
    let http = app.state::<AppState>().http.clone();
    let mut last = None;
    for attempt in 1..=3 {
        match http.get(url).send().await.and_then(|r| r.error_for_status()) {
            Ok(resp) => return Ok(resp.bytes().await?.to_vec()),
            Err(e) => {
                last = Some(e);
                tokio::time::sleep(Duration::from_millis(800 * attempt)).await;
            }
        }
    }
    Err(AppError::new(ErrorKind::Download, format!("falha ao baixar a imagem: {}", last.map(|e| e.to_string()).unwrap_or_default())))
}

fn ext_from_url(url: &str, fallback: &str) -> String {
    let path = url.split(['?', '#']).next().unwrap_or(url);
    Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .filter(|e| e.len() <= 5 && e.chars().all(|c| c.is_ascii_alphanumeric()))
        .map(|e| e.to_ascii_lowercase())
        .unwrap_or_else(|| fallback.to_string())
}

async fn write_atomic(path: &Path, bytes: &[u8]) -> AppResult<()> {
    let tmp = path.with_extension("part");
    tokio::fs::write(&tmp, bytes).await?;
    tokio::fs::rename(&tmp, path).await?;
    Ok(())
}

/// Guarda a tentativa atual no histórico e deixa a célula pronta para ser refeita.
pub fn reset_for_retry(cell: &mut CellState) {
    if cell.attempt > 0 {
        cell.history.push(CellAttempt {
            attempt: cell.attempt,
            status: cell.status,
            remote_id: cell.remote_id.take(),
            image: cell.image.take(),
            error: cell.error.take(),
        });
    }
    cell.status = CellStatus::Pending;
    cell.raw_status = None;
    cell.remote_id = None;
    cell.submitted_at = None;
    cell.finished_at = None;
    cell.elapsed_ms = None;
    cell.error = None;
    cell.image = None;
}

/// Ao abrir o app: retoma os runs que estavam rodando quando ele fechou.
pub fn resume_all(app: &AppHandle) {
    let state = app.state::<AppState>();
    for manifest in storage::list_runs(&state.runs_dir) {
        if manifest.status != RunStatus::Running {
            continue;
        }
        let Ok(provider) = state.provider_for(manifest.provider) else { continue };
        let dir = state.runs_dir.join(&manifest.id);
        let handle = Arc::new(RunHandle::new(manifest, dir));
        state.runs.insert(handle.clone());
        handle.log(app, None, "info", "Run retomado após reabrir o app", Value::Null);
        spawn_pending(app, &handle, provider, state.limiter());
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extension_comes_from_url_path() {
        assert_eq!(ext_from_url("https://cdn/x/hf_1.png?sig=abc", "bin"), "png");
        assert_eq!(ext_from_url("https://cdn/x/hf_1_min.webp", "bin"), "webp");
        assert_eq!(ext_from_url("https://cdn/x/noext", "png"), "png");
    }

    #[test]
    fn backoff_grows() {
        assert!(backoff(1) < Duration::from_secs(5));
        assert!(backoff(3) >= Duration::from_secs(12));
    }
}
