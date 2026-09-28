mod commands;
mod error;
mod jobs;
mod providers;
mod secrets;
mod settings;
mod state;
mod storage;

use tauri::Manager;

use crate::state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // Uma instância só: duas abertas tentariam retomar os mesmos runs.
    #[cfg(desktop)]
    {
        builder = builder
            .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.unminimize();
                    let _ = w.set_focus();
                }
            }))
            .plugin(tauri_plugin_window_state::Builder::default().build());
    }

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let config_dir = app.path().app_config_dir()?;
            let runs_dir = app.path().app_local_data_dir()?.join("runs");
            std::fs::create_dir_all(&runs_dir)?;
            app.manage(AppState::new(config_dir.join("settings.json"), runs_dir));
            jobs::resume_all(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::update_settings,
            commands::detect_cli,
            commands::get_account,
            commands::estimate_run,
            commands::start_run,
            commands::stop_run,
            commands::rerun_cells,
            commands::list_runs,
            commands::get_run,
            commands::delete_run,
            commands::set_best,
            commands::get_log,
            commands::reveal_path,
            commands::runs_dir,
            commands::export_images,
            commands::credential_status,
            commands::set_api_credentials,
            commands::clear_api_credentials,
            commands::test_api_credentials,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
