use std::collections::{BTreeMap, HashMap};
use std::path::PathBuf;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use tauri::{AppHandle, State};
use tauri_plugin_opener::OpenerExt;

use crate::error::{AppError, AppResult, ErrorKind};
use crate::jobs::{self, RunHandle};
use crate::providers::{cli, AccountInfo, JobSpec};
use crate::secrets;
use crate::settings::{Settings, SettingsPatch};
use crate::state::AppState;
use crate::storage::{self, CellState, CellStatus, Manifest, RunStatus, RunSummary};

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Settings {
    state.settings()
}

#[tauri::command]
pub fn update_settings(state: State<'_, AppState>, patch: SettingsPatch) -> AppResult<Settings> {
    let mut s = state.settings.write().unwrap();
    s.apply(patch);
    s.save(&state.settings_path)?;
    Ok(s.clone())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CliInfo {
    found: bool,
    path: Option<String>,
    version: Option<String>,
}

#[tauri::command]
pub async fn detect_cli(state: State<'_, AppState>) -> AppResult<CliInfo> {
    let settings = state.settings();
    let Some(exe) = cli::locate(settings.cli_path.as_deref()) else {
        return Ok(CliInfo { found: false, path: None, version: None });
    };
    let provider = cli::CliProvider::new(exe.clone(), Arc::new(tokio::sync::Semaphore::new(1)));
    Ok(CliInfo { found: true, path: Some(exe.to_string_lossy().into_owned()), version: provider.version().await })
}

#[tauri::command]
pub async fn get_account(state: State<'_, AppState>) -> AppResult<AccountInfo> {
    state.provider()?.account().await
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Estimate {
    total: f64,
    unit: String,
    per_cell: BTreeMap<String, f64>,
    errors: Vec<EstimateError>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EstimateError {
    cell_id: String,
    model_id: String,
    kind: ErrorKind,
    message: String,
}

/// Estima o custo de todas as células. Parâmetros iguais (fora o prompt) custam igual, então
/// cada combinação é consultada uma vez só. A consulta também valida os parâmetros.
#[tauri::command]
pub async fn estimate_run(state: State<'_, AppState>, cells: Vec<JobSpec>) -> AppResult<Estimate> {
    let provider = state.provider()?;
    let mut groups: HashMap<String, Vec<&JobSpec>> = HashMap::new();
    for cell in &cells {
        let mut key_params: Map<String, Value> = cell.params.clone();
        key_params.remove("prompt");
        let key = format!("{}|{}", cell.target, Value::Object(key_params));
        groups.entry(key).or_default().push(cell);
    }

    let groups: Vec<Vec<&JobSpec>> = groups.into_values().collect();
    let lookups: Vec<_> = groups
        .iter()
        .map(|group| {
            let provider = provider.clone();
            let (target, params) = (group[0].target.clone(), group[0].params.clone());
            async move { provider.estimate(&target, &params).await }
        })
        .collect();
    let results = futures_join(lookups).await;

    let mut per_cell = BTreeMap::new();
    let mut errors = Vec::new();
    for (group, result) in groups.iter().zip(results) {
        for cell in group {
            match &result {
                Ok(cost) => {
                    per_cell.insert(cell.cell_id.clone(), *cost);
                }
                Err(e) => errors.push(EstimateError {
                    cell_id: cell.cell_id.clone(),
                    model_id: cell.model_id.clone(),
                    kind: e.kind,
                    message: e.message.clone(),
                }),
            }
        }
    }
    Ok(Estimate { total: per_cell.values().sum(), unit: provider.unit().into(), per_cell, errors })
}

/// Executa as consultas em paralelo (o limite de processos fica no próprio provider).
async fn futures_join<F: std::future::Future>(futures: Vec<F>) -> Vec<F::Output>
where
    F: Send + 'static,
    F::Output: Send + 'static,
{
    let handles: Vec<_> = futures.into_iter().map(tauri::async_runtime::spawn).collect();
    let mut out = Vec::with_capacity(handles.len());
    for h in handles {
        out.push(h.await.expect("tarefa de estimativa"));
    }
    out
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartRunRequest {
    label: String,
    config: Value,
    prompts: BTreeMap<String, String>,
    prompt_template_version: u32,
    cells: Vec<JobSpec>,
    #[serde(default)]
    costs: BTreeMap<String, f64>,
}

#[tauri::command]
pub async fn start_run(app: AppHandle, state: State<'_, AppState>, req: StartRunRequest) -> AppResult<Manifest> {
    if req.cells.is_empty() {
        return Err(AppError::new(ErrorKind::Validation, "nada para gerar: escolha ao menos um estilo e um modelo"));
    }
    let provider = state.provider()?;
    let id = format!(
        "{}-{}-{}",
        chrono::Local::now().format("%Y%m%d-%H%M%S"),
        storage::slug(&req.label),
        &uuid::Uuid::new_v4().simple().to_string()[..4]
    );
    let dir = state.runs_dir.join(&id);
    std::fs::create_dir_all(dir.join("images"))?;

    let cells = req
        .cells
        .into_iter()
        .map(|spec| {
            let cost = req.costs.get(&spec.cell_id).copied();
            CellState::new(spec, cost)
        })
        .collect();
    let mut manifest = Manifest {
        schema_version: storage::SCHEMA_VERSION,
        id: id.clone(),
        created_at: jobs::now(),
        provider: provider.kind(),
        unit: provider.unit().into(),
        status: RunStatus::Running,
        paused_reason: None,
        label: req.label,
        config: req.config,
        prompts: req.prompts,
        prompt_template_version: req.prompt_template_version,
        cells,
        best: BTreeMap::new(),
        dir: String::new(),
    };
    manifest.resolve_paths(&dir);
    storage::write_manifest(&dir, &manifest)?;

    let handle = Arc::new(RunHandle::new(manifest.clone(), dir));
    state.runs.insert(handle.clone());
    jobs::spawn_pending(&app, &handle, provider, state.limiter());
    Ok(manifest)
}

#[tauri::command]
pub fn stop_run(app: AppHandle, state: State<'_, AppState>, run_id: String) -> AppResult<Manifest> {
    let handle = state.runs.load(&state.runs_dir, &run_id)?;
    handle.stop(&app, None);
    Ok(handle.snapshot())
}

/// Refaz células (guarda a tentativa anterior no histórico da célula).
#[tauri::command]
pub fn rerun_cells(app: AppHandle, state: State<'_, AppState>, run_id: String, cell_ids: Vec<String>) -> AppResult<Manifest> {
    let handle = state.runs.load(&state.runs_dir, &run_id)?;
    let provider = state.provider_for(handle.snapshot().provider)?;
    handle.reopen();
    for cell_id in &cell_ids {
        let busy = handle
            .snapshot()
            .cell(cell_id)
            .map(|c| !c.status.is_terminal() && c.status != CellStatus::Pending)
            .unwrap_or(true);
        if busy {
            continue;
        }
        handle.update_cell(&app, cell_id, jobs::reset_for_retry);
        jobs::spawn_cell(&app, &handle, provider.clone(), state.limiter(), cell_id.clone());
    }
    Ok(handle.update_manifest(&app, |_| {}))
}

#[tauri::command]
pub fn list_runs(state: State<'_, AppState>) -> Vec<RunSummary> {
    storage::list_runs(&state.runs_dir)
        .iter()
        .map(|m| state.runs.get(&m.id).map(|h| RunSummary::from(&h.snapshot())).unwrap_or_else(|| RunSummary::from(m)))
        .collect()
}

#[tauri::command]
pub fn get_run(state: State<'_, AppState>, run_id: String) -> AppResult<Manifest> {
    Ok(state.runs.load(&state.runs_dir, &run_id)?.snapshot())
}

#[tauri::command]
pub fn delete_run(state: State<'_, AppState>, run_id: String) -> AppResult<()> {
    if let Some(h) = state.runs.get(&run_id) {
        if h.snapshot().status == RunStatus::Running {
            return Err(AppError::new(ErrorKind::Validation, "pare o run antes de apagar"));
        }
    }
    state.runs.remove(&run_id);
    let dir = state.runs_dir.join(&run_id);
    if dir.starts_with(&state.runs_dir) && dir.is_dir() {
        std::fs::remove_dir_all(dir)?;
    }
    Ok(())
}

/// Marca (ou desmarca, com `cell_id = null`) a melhor imagem de um estilo.
#[tauri::command]
/// `style_id` é a chave da linha da grade: o estilo, ou `estilo@variante` quando há variantes.
pub fn set_best(app: AppHandle, state: State<'_, AppState>, run_id: String, style_id: String, cell_id: Option<String>) -> AppResult<Manifest> {
    let handle = state.runs.load(&state.runs_dir, &run_id)?;
    Ok(handle.update_manifest(&app, |m| match cell_id {
        Some(id) => {
            m.best.insert(style_id, id);
        }
        None => {
            m.best.remove(&style_id);
        }
    }))
}

#[tauri::command]
pub fn get_log(state: State<'_, AppState>, run_id: String, cell_id: Option<String>) -> AppResult<Vec<Value>> {
    storage::read_log(&state.runs_dir.join(&run_id), cell_id.as_deref())
}

#[tauri::command]
pub fn reveal_path(app: AppHandle, path: String) -> AppResult<()> {
    app.opener()
        .reveal_item_in_dir(PathBuf::from(path))
        .map_err(|e| AppError::internal(e.to_string()))
}

#[tauri::command]
pub fn runs_dir(state: State<'_, AppState>) -> String {
    state.runs_dir.to_string_lossy().into_owned()
}

#[tauri::command]
pub fn credential_status() -> secrets::CredentialStatus {
    secrets::status()
}

/// Salva Key ID + Secret no cofre do sistema. O secret nunca volta para o webview.
#[tauri::command]
pub fn set_api_credentials(key_id: String, key_secret: String) -> AppResult<secrets::CredentialStatus> {
    let (key_id, key_secret) = (key_id.trim().to_string(), key_secret.trim().to_string());
    if key_id.is_empty() || key_secret.is_empty() {
        return Err(AppError::new(ErrorKind::Validation, "preencha o Key ID e o Key Secret"));
    }
    secrets::save(&secrets::ApiCredentials { key_id, key_secret })?;
    Ok(secrets::status())
}

#[tauri::command]
pub fn clear_api_credentials() -> AppResult<secrets::CredentialStatus> {
    secrets::clear()?;
    Ok(secrets::status())
}

/// Testa a chave com o /estimate (grátis). Devolve o preço de uma imagem Soul 2 em US$.
#[tauri::command]
pub async fn test_api_credentials(state: State<'_, AppState>) -> AppResult<f64> {
    let creds = secrets::require()?;
    let provider = crate::providers::api::ApiProvider::new(&state.settings().api_base_url, creds, state.http.clone());
    provider.check_key().await
}

/// Copia as imagens escolhidas para uma pasta, com nomes legíveis.
#[tauri::command]
pub fn export_images(state: State<'_, AppState>, run_id: String, cell_ids: Vec<String>, dest: String) -> AppResult<usize> {
    let m = state.runs.load(&state.runs_dir, &run_id)?.snapshot();
    let dest = PathBuf::from(dest);
    std::fs::create_dir_all(&dest)?;
    let mut count = 0;
    for cell in m.cells.iter().filter(|c| cell_ids.contains(&c.spec.cell_id)) {
        let Some(img) = &cell.image else { continue };
        let src = PathBuf::from(&img.path);
        let ext = src.extension().and_then(|e| e.to_str()).unwrap_or("png");
        let variant = cell.spec.variant_key.as_deref().map(|k| format!("-{k}")).unwrap_or_default();
        let name = format!(
            "{}-{}{}-{}-v{}.{ext}",
            storage::slug(&m.label),
            cell.spec.style_id,
            variant,
            storage::slug(&cell.spec.model_id),
            cell.spec.variation
        );
        std::fs::copy(&src, dest.join(name))?;
        count += 1;
    }
    Ok(count)
}
