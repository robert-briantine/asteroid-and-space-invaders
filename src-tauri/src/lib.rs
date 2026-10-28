use tauri::Manager;
use std::net::TcpListener;
use std::thread;
use std::io::{Read, Write};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

// Fichiers statiques embeddés dans le binaire
const INDEX_HTML: &str = include_str!("../../public/index.html");
const MAIN_JS: &str = include_str!("../../public/main.js");
const CONFIG_JSON: &str = include_str!("../../public/config.json");

// Structure pour les scores
#[derive(Serialize, Deserialize, Clone)]
struct ScoreData {
  best_score: u32,
  history: Vec<ScoreEntry>,
}

#[derive(Serialize, Deserialize, Clone)]
struct ScoreEntry {
  score: u32,
  level: u32,
  date: String,
}

fn get_scores_path() -> PathBuf {
  // Utiliser le répertoire de configuration de l'application
  let app_dir = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
  app_dir.join("space-invaders-bis").join("scores.json")
}

fn load_scores_from_file() -> ScoreData {
  let path = get_scores_path();
  if path.exists() {
    if let Ok(content) = fs::read_to_string(&path) {
      if let Ok(data) = serde_json::from_str::<ScoreData>(&content) {
        return data;
      }
    }
  }
  // Valeurs par défaut
  ScoreData {
    best_score: 0,
    history: vec![],
  }
}

fn save_scores_to_file(data: &ScoreData) -> Result<(), String> {
  let path = get_scores_path();
  let json = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
  fs::write(&path, json).map_err(|e| e.to_string())?;
  Ok(())
}

// Commande Tauri pour charger les scores
#[tauri::command]
fn load_scores() -> Result<serde_json::Value, String> {
  let data = load_scores_from_file();
  Ok(serde_json::json!({
    "bestScore": data.best_score,
    "history": data.history,
  }))
}

// Commande Tauri pour sauvegarder les scores
#[tauri::command]
fn save_scores(best_score: u32, history: Vec<ScoreEntry>) -> Result<(), String> {
  let data = ScoreData {
    best_score,
    history,
  };
  save_scores_to_file(&data)
}

fn get_content(path: &str) -> Option<(&'static str, &'static str)> {
  match path {
    "/" | "/index.html" => Some((INDEX_HTML, "text/html")),
    "/main.js" => Some((MAIN_JS, "application/javascript")),
    "/config.json" => Some((CONFIG_JSON, "application/json")),
    _ => None,
  }
}

fn serve_static_files(port: u16) {
  let listener = TcpListener::bind(("127.0.0.1", port)).expect("Cannot bind to port");
  eprintln!("Embedded file server on http://127.0.0.1:{}", port);

  for stream in listener.incoming() {
    let _ = thread::spawn(move || {
      let mut stream = match stream { Ok(s) => s, Err(_) => return };
      let mut buf = [0u8; 4096];
      let n = match stream.read(&mut buf) { Ok(n) => n, Err(_) => return };
      if n == 0 { return; }

      let request = String::from_utf8_lossy(&buf[..n]);
      let path = request
        .lines()
        .next()
        .unwrap_or("")
        .split_whitespace()
        .nth(1)
        .unwrap_or("/");

      match get_content(path) {
        Some((content, content_type)) => {
          let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: {}\r\nContent-Length: {}\r\nAccess-Control-Allow-Origin: *\r\n\r\n{}",
            content_type,
            content.len(),
            content
          );
          let _ = stream.write_all(response.as_bytes());
        }
        None => {
          let response = "HTTP/1.1 404 Not Found\r\nContent-Length: 9\r\n\r\nNot found";
          let _ = stream.write_all(response.as_bytes());
        }
      }
    });
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let port: u16 = 34567;
  thread::spawn(move || serve_static_files(port));

  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![load_scores, save_scores])
    .setup(move |app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Attendre que le serveur soit prêt puis charger la page
      let window = app.get_webview_window("main").unwrap();
      let _ = window.eval(&format!(
        "setTimeout(() => {{ window.location.href = 'http://127.0.0.1:{}/'; }}, 100);",
        port
      ));

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
