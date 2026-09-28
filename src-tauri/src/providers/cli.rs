//! Provider que usa o Higgsfield CLI instalado localmente (gasta créditos do plano).
//! Chama o `hf.exe` direto: o atalho `higgsfield.cmd` passa pelo cmd.exe, que estraga
//! prompts com `& | ^ % "`.

use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Arc;
use std::time::Duration;

use serde_json::{json, Map, Value};
use tokio::sync::Semaphore;

use super::cli_parse::{build_flags, classify_error, parse_cost, parse_create_id, parse_job};
use super::{AccountInfo, JobSpec, RemoteState, Submitted};
use crate::error::{AppError, AppResult, ErrorKind};

const CREATE_TIMEOUT: Duration = Duration::from_secs(5 * 60);
const QUICK_TIMEOUT: Duration = Duration::from_secs(90);

pub struct CliProvider {
    exe: PathBuf,
    /// Limita quantos hf.exe rodam ao mesmo tempo (cost/get são rápidos, mas somam).
    processes: Arc<Semaphore>,
}

/// Onde procurar o hf.exe: configuração → instalação global do npm → PATH.
pub fn locate(override_path: Option<&str>) -> Option<PathBuf> {
    if let Some(p) = override_path.map(str::trim).filter(|p| !p.is_empty()) {
        let p = PathBuf::from(p);
        return p.is_file().then_some(p);
    }
    if let Ok(appdata) = std::env::var("APPDATA") {
        let vendored = Path::new(&appdata).join(r"npm\node_modules\@higgsfield\cli\vendor\hf.exe");
        if vendored.is_file() {
            return Some(vendored);
        }
    }
    let path = std::env::var_os("PATH")?;
    for dir in std::env::split_paths(&path) {
        for name in ["hf.exe", "hf", "higgsfield.exe"] {
            let candidate = dir.join(name);
            if candidate.is_file() {
                return Some(candidate);
            }
        }
        // Instalação npm em outro prefixo: o atalho .cmd fica ao lado de node_modules.
        let shim_target = dir.join(r"node_modules\@higgsfield\cli\vendor\hf.exe");
        if dir.join("higgsfield.cmd").is_file() && shim_target.is_file() {
            return Some(shim_target);
        }
    }
    None
}

impl CliProvider {
    /// `processes` é compartilhado pelo app inteiro (vários runs usam o mesmo limite).
    pub fn new(exe: PathBuf, processes: Arc<Semaphore>) -> Self {
        Self { exe, processes }
    }

    /// Roda o CLI e devolve o stdout. Erros viram `AppError` categorizado.
    async fn run(&self, args: &[String], timeout: Duration) -> AppResult<String> {
        let _permit = self.processes.acquire().await.map_err(|e| AppError::internal(e.to_string()))?;
        let mut cmd = tokio::process::Command::new(&self.exe);
        cmd.args(args)
            .arg("--no-color")
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);
        #[cfg(windows)]
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW: sem janela de console piscando.

        let output = tokio::time::timeout(timeout, cmd.output())
            .await
            .map_err(|_| AppError::new(ErrorKind::Timeout, format!("o CLI não respondeu em {}s", timeout.as_secs())))?
            .map_err(|e| AppError::new(ErrorKind::Internal, format!("não consegui executar {}: {e}", self.exe.display())))?;

        let stdout = String::from_utf8_lossy(&output.stdout).into_owned();
        if output.status.success() {
            Ok(stdout)
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(classify_error(&stderr, &stdout, output.status.code()))
        }
    }

    pub async fn version(&self) -> Option<String> {
        let out = self.run(&["version".into()], QUICK_TIMEOUT).await.ok()?;
        out.lines().next().map(str::to_string)
    }

    pub async fn estimate(&self, target: &str, params: &Map<String, Value>) -> AppResult<f64> {
        let mut args = vec!["generate".into(), "cost".into(), target.to_string()];
        args.extend(build_flags(params));
        args.push("--json".into());
        parse_cost(&self.run(&args, QUICK_TIMEOUT).await?)
    }

    pub async fn submit(&self, spec: &JobSpec) -> AppResult<Submitted> {
        let mut args = vec!["generate".into(), "create".into(), spec.target.clone()];
        args.extend(build_flags(&spec.params));
        args.push("--json".into());
        let request = json!({ "command": "hf", "args": args });
        let stdout = self.run(&args, CREATE_TIMEOUT).await?;
        let response = serde_json::from_str::<Value>(stdout.trim()).unwrap_or_else(|_| Value::String(stdout.clone()));
        match parse_create_id(&stdout) {
            Some(remote_id) => Ok(Submitted { remote_id, request, response }),
            // O job pode ter sido criado (e cobrado): quem chama tenta achá-lo pelo prompt.
            None => Err(AppError::new(
                ErrorKind::Internal,
                format!("o CLI não devolveu o id do job: {}", super::cli_parse::clip(&stdout, 300)),
            )),
        }
    }

    pub async fn poll(&self, remote_id: &str) -> AppResult<RemoteState> {
        let args = ["generate".into(), "get".into(), remote_id.to_string(), "--json".into()];
        parse_job(&self.run(&args, QUICK_TIMEOUT).await?)
    }

    pub async fn account(&self) -> AppResult<AccountInfo> {
        let out = self.run(&["account".into(), "status".into(), "--json".into()], QUICK_TIMEOUT).await?;
        let v: Value = serde_json::from_str(out.trim())?;
        Ok(AccountInfo {
            email: v.get("email").and_then(Value::as_str).map(str::to_string),
            plan: v.get("subscription_plan_type").and_then(Value::as_str).map(str::to_string),
            credits: v.get("credits").and_then(Value::as_f64),
            ..Default::default()
        })
    }

    /// Procura, entre os jobs recentes, um com o mesmo modelo e prompt que ainda não conhecemos.
    pub async fn find_orphan(&self, job_type: &str, prompt: &str, exclude: &[String]) -> AppResult<Option<String>> {
        let args = ["generate".into(), "list".into(), "--size".into(), "40".into(), "--json".into()];
        let out = self.run(&args, QUICK_TIMEOUT).await?;
        let jobs: Value = serde_json::from_str(out.trim())?;
        let wanted = super::cli_parse::sanitize_prompt(prompt);
        let found = jobs.as_array().into_iter().flatten().find_map(|job| {
            let id = job.get("id")?.as_str()?;
            let same_type = job.get("job_type")?.as_str()? == job_type;
            let same_prompt = job.get("params")?.get("prompt")?.as_str()? == wanted;
            (same_type && same_prompt && !exclude.iter().any(|e| e == id)).then(|| id.to_string())
        });
        Ok(found)
    }
}
