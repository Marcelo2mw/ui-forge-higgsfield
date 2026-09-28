//! Provider de mentira: simula fila, processamento, falhas e devolve um SVG com um esqueleto
//! de dashboard. Serve para desenvolver e gravar a interface sem gastar créditos.

use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use rand::Rng;
use serde_json::{json, Value};

use super::{AccountInfo, InlineImage, JobSpec, RemoteState, RemoteStatus, Submitted};
use crate::error::{AppError, AppResult, ErrorKind};

struct MockJob {
    spec: JobSpec,
    started: Instant,
    duration: Duration,
    fails: bool,
}

#[derive(Default)]
pub struct MockProvider {
    jobs: Mutex<HashMap<String, MockJob>>,
}

impl MockProvider {
    pub fn estimate(&self, target: &str) -> f64 {
        match target {
            "gpt_image_2_5" | "kling_omni_image" | "seedream_5_0_flash" => 0.5,
            "text2image_soul_v2" => 0.12,
            "z_image" => 0.15,
            "flux_2" => 1.0,
            "recraft_v4_1" => 1.25,
            "seedream_v5_pro" => 2.5,
            _ => 2.0,
        }
    }

    pub fn submit(&self, spec: &JobSpec) -> AppResult<Submitted> {
        let mut rng = rand::rng();
        let id = format!("mock-{}", uuid::Uuid::new_v4());
        let job = MockJob {
            spec: spec.clone(),
            started: Instant::now(),
            duration: Duration::from_millis(rng.random_range(2_500..8_000)),
            fails: rng.random_bool(0.08),
        };
        self.jobs.lock().unwrap().insert(id.clone(), job);
        Ok(Submitted {
            remote_id: id.clone(),
            request: json!({ "mock": true, "target": spec.target, "params": spec.params }),
            response: json!([id]),
        })
    }

    pub fn poll(&self, remote_id: &str) -> AppResult<RemoteState> {
        let jobs = self.jobs.lock().unwrap();
        let job = jobs
            .get(remote_id)
            .ok_or_else(|| AppError::new(ErrorKind::NotFound, format!("job {remote_id} não existe (o mock perde os jobs ao reiniciar)")))?;
        let elapsed = job.started.elapsed();
        let (status, raw) = if elapsed < job.duration.mul_f32(0.3) {
            (RemoteStatus::Queued, "queued")
        } else if elapsed < job.duration {
            (RemoteStatus::InProgress, "in_progress")
        } else if job.fails {
            (RemoteStatus::Failed, "failed")
        } else {
            (RemoteStatus::Completed, "completed")
        };
        let (w, h) = dims(job.spec.params.get("aspect_ratio").and_then(Value::as_str).unwrap_or("16:9"));
        let inline = (status == RemoteStatus::Completed).then(|| InlineImage {
            bytes: render_svg(&job.spec, w, h).into_bytes(),
            ext: "svg",
        });
        Ok(RemoteState {
            status,
            raw_status: raw.into(),
            result_url: None,
            thumb_url: None,
            width: Some(w),
            height: Some(h),
            error: job.fails.then(|| "falha simulada pelo mock".to_string()),
            inline,
            raw: json!({ "id": remote_id, "status": raw }),
        })
    }

    pub fn account(&self) -> AccountInfo {
        AccountInfo {
            email: Some("mock@uiforge.local".into()),
            plan: Some("mock".into()),
            credits: Some(9999.0),
            ..Default::default()
        }
    }
}

fn dims(ratio: &str) -> (u32, u32) {
    let (a, b) = ratio.split_once(':').unwrap_or(("16", "9"));
    let (a, b): (f32, f32) = (a.parse().unwrap_or(16.0), b.parse().unwrap_or(9.0));
    if a >= b {
        (1344, (1344.0 * b / a).round() as u32)
    } else {
        ((1344.0 * a / b).round() as u32, 1344)
    }
}

/// Primeira cor `#RRGGBB` que aparece no prompt (a cor de destaque).
fn accent_from_prompt(prompt: &str) -> String {
    let bytes = prompt.as_bytes();
    for (i, &b) in bytes.iter().enumerate() {
        if b == b'#' && i + 7 <= bytes.len() && bytes[i + 1..i + 7].iter().all(u8::is_ascii_hexdigit) {
            return prompt[i..i + 7].to_string();
        }
    }
    "#E11D74".into()
}

fn render_svg(spec: &JobSpec, w: u32, h: u32) -> String {
    let accent = accent_from_prompt(spec.prompt());
    let variant = spec.variant_key.as_deref().map(|k| format!(" · {k}")).unwrap_or_default();
    let label = format!("{}{} · {} · v{}", spec.style_id, variant, spec.model_id, spec.variation);
    let (wf, hf) = (w as f32, h as f32);
    let pad = wf.min(hf) * 0.04;
    let mobile = hf > wf;
    let mut shapes = String::new();
    if mobile {
        // Cabeçalho, grade 2x2, gráfico e barra de abas.
        let cw = (wf - pad * 3.0) / 2.0;
        for i in 0..4 {
            let (x, y) = (pad + (i % 2) as f32 * (cw + pad), hf * 0.14 + (i / 2) as f32 * (hf * 0.12 + pad));
            shapes += &format!(r#"<rect x="{x}" y="{y}" width="{cw}" height="{}" rx="18" fill="white" fill-opacity="0.75"/>"#, hf * 0.12);
        }
        shapes += &format!(r#"<rect x="{pad}" y="{}" width="{}" height="{}" rx="18" fill="white" fill-opacity="0.75"/>"#, hf * 0.43, wf - pad * 2.0, hf * 0.22);
        shapes += &format!(r#"<rect x="0" y="{}" width="{wf}" height="{}" fill="white" fill-opacity="0.9"/>"#, hf * 0.92, hf * 0.08);
    } else {
        let side = wf * 0.16;
        shapes += &format!(r#"<rect x="0" y="0" width="{side}" height="{hf}" fill="white" fill-opacity="0.8"/>"#);
        shapes += &format!(r#"<rect x="{}" y="{}" width="{}" height="28" rx="14" fill="{accent}"/>"#, pad, hf * 0.2, side - pad * 2.0);
        let area = wf - side - pad * 2.0;
        let kw = (area - pad * 3.0) / 4.0;
        for i in 0..4 {
            let x = side + pad + i as f32 * (kw + pad);
            shapes += &format!(r#"<rect x="{x}" y="{}" width="{kw}" height="{}" rx="16" fill="white" fill-opacity="0.8"/>"#, hf * 0.12, hf * 0.16);
        }
        shapes += &format!(r#"<rect x="{}" y="{}" width="{}" height="{}" rx="16" fill="white" fill-opacity="0.8"/>"#, side + pad, hf * 0.33, area * 0.58, hf * 0.58);
        shapes += &format!(r#"<rect x="{}" y="{}" width="{}" height="{}" rx="16" fill="white" fill-opacity="0.8"/>"#, side + pad * 2.0 + area * 0.58, hf * 0.33, area * 0.42 - pad, hf * 0.58);
        let (cx, cy, cw, ch) = (side + pad * 2.0, hf * 0.45, area * 0.58 - pad * 2.0, hf * 0.4);
        shapes += &format!(
            r#"<polyline points="{},{} {},{} {},{} {},{} {},{}" fill="none" stroke="{accent}" stroke-width="5" stroke-linejoin="round"/>"#,
            cx, cy + ch, cx + cw * 0.25, cy + ch * 0.6, cx + cw * 0.5, cy + ch * 0.75, cx + cw * 0.75, cy + ch * 0.3, cx + cw, cy + ch * 0.1
        );
    }
    format!(
        r##"<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{accent}" stop-opacity="0.35"/><stop offset="1" stop-color="#F5F3FF"/></linearGradient></defs>
<rect width="{w}" height="{h}" fill="url(#bg)"/>
{shapes}
<text x="{tx}" y="{ty}" font-family="Segoe UI, sans-serif" font-size="{fs}" font-weight="700" fill="#1F2937" text-anchor="middle">MOCK</text>
<text x="{tx}" y="{ty2}" font-family="Segoe UI, sans-serif" font-size="{fs2}" fill="#374151" text-anchor="middle">{label}</text>
</svg>"##,
        tx = wf / 2.0,
        ty = hf * 0.08,
        ty2 = hf * 0.08 + wf.min(hf) * 0.045,
        fs = wf.min(hf) * 0.05,
        fs2 = wf.min(hf) * 0.028,
    )
}
