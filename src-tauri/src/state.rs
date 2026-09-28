use std::path::PathBuf;
use std::sync::{Arc, Mutex, RwLock};

use tokio::sync::Semaphore;

use crate::error::{AppError, AppResult, ErrorKind};
use crate::jobs::RunManager;
use crate::providers::{api::ApiProvider, cli, mock::MockProvider, Provider};
use crate::secrets;
use crate::settings::{ProviderKind, Settings};

pub struct AppState {
    pub settings: RwLock<Settings>,
    pub settings_path: PathBuf,
    pub runs_dir: PathBuf,
    pub http: reqwest::Client,
    pub runs: RunManager,
    mock: Arc<MockProvider>,
    cli_processes: Arc<Semaphore>,
    /// (limite atual, semáforo). Troca quando o usuário muda a concorrência.
    limiter: Mutex<(u32, Arc<Semaphore>)>,
}

impl AppState {
    pub fn new(settings_path: PathBuf, runs_dir: PathBuf) -> Self {
        let first_run = !settings_path.exists();
        let mut settings = Settings::load(&settings_path);
        if first_run {
            // Primeira abertura: API se já houver chave; senão o CLI, se estiver instalado.
            settings.provider = if matches!(secrets::load(), Ok(Some(_))) {
                ProviderKind::Api
            } else if cli::locate(None).is_some() {
                ProviderKind::Cli
            } else {
                ProviderKind::Api
            };
            let _ = settings.save(&settings_path);
        }
        let limit = settings.concurrency.max(1);
        let http = reqwest::Client::builder()
            .user_agent(concat!("UI-Forge/", env!("CARGO_PKG_VERSION")))
            .connect_timeout(std::time::Duration::from_secs(20))
            .timeout(std::time::Duration::from_secs(180))
            .build()
            .expect("cliente HTTP");
        Self {
            settings: RwLock::new(settings),
            settings_path,
            runs_dir,
            http,
            runs: RunManager::default(),
            mock: Arc::new(MockProvider::default()),
            cli_processes: Arc::new(Semaphore::new(6)),
            limiter: Mutex::new((limit, Arc::new(Semaphore::new(limit as usize)))),
        }
    }

    pub fn settings(&self) -> Settings {
        self.settings.read().unwrap().clone()
    }

    /// Semáforo de jobs simultâneos (fila + processando), compartilhado entre runs.
    pub fn limiter(&self) -> Arc<Semaphore> {
        let wanted = self.settings().concurrency.max(1);
        let mut guard = self.limiter.lock().unwrap();
        if guard.0 != wanted {
            *guard = (wanted, Arc::new(Semaphore::new(wanted as usize)));
        }
        guard.1.clone()
    }

    pub fn provider(&self) -> AppResult<Arc<Provider>> {
        self.provider_for(self.settings().provider)
    }

    pub fn provider_for(&self, kind: ProviderKind) -> AppResult<Arc<Provider>> {
        match kind {
            ProviderKind::Mock => Ok(Arc::new(Provider::Mock(self.mock.clone()))),
            ProviderKind::Cli => {
                let settings = self.settings();
                let exe = cli::locate(settings.cli_path.as_deref()).ok_or_else(|| {
                    AppError::new(
                        ErrorKind::Auth,
                        "Higgsfield CLI não encontrado. Instale com `npm i -g @higgsfield/cli` e faça login com `higgsfield auth login`.",
                    )
                })?;
                Ok(Arc::new(Provider::Cli(cli::CliProvider::new(exe, self.cli_processes.clone()))))
            }
            ProviderKind::Api => {
                let creds = secrets::require()?;
                Ok(Arc::new(Provider::Api(ApiProvider::new(&self.settings().api_base_url, creds, self.http.clone()))))
            }
        }
    }
}
