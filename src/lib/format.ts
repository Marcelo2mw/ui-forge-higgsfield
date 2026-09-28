import { convertFileSrc } from "@tauri-apps/api/core";
import type { Lang } from "@/domain/types";

export function formatCost(value: number | null | undefined, unit: string, lang: Lang): string {
  if (value == null) return "—";
  if (unit === "usd") {
    return new Intl.NumberFormat(lang, { style: "currency", currency: "USD", maximumFractionDigits: 4 }).format(value);
  }
  const n = new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(value);
  return lang === "en" ? `${n} cr` : `${n} cr`;
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return "—";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${String(s % 60).padStart(2, "0")}s`;
}

export function formatDate(iso: string, lang: Lang): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(lang, { dateStyle: "short", timeStyle: "short" }).format(d);
}

/** Caminho local → URL que o webview consegue carregar (protocolo asset). */
export function fileSrc(path: string | null | undefined): string | undefined {
  return path ? convertFileSrc(path) : undefined;
}
