// Ponte com o Rust: tipos espelhados de src-tauri/src/{providers,storage,commands}.rs e wrappers.
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { ForgeConfig, Lang, ProviderId } from "@/domain/types";

export interface JobSpec {
  cellId: string;
  styleId: string;
  /** Variante do prompt (A, B, C, D), quando o run compara variantes. */
  variantKey?: string;
  modelId: string;
  variation: number;
  target: string;
  params: Record<string, unknown>;
}

export type CellStatus =
  | "pending"
  | "submitting"
  | "queued"
  | "in_progress"
  | "downloading"
  | "completed"
  | "failed"
  | "nsfw"
  | "canceled"
  | "unknown";

export const TERMINAL: CellStatus[] = ["completed", "failed", "nsfw", "canceled", "unknown"];

export type ErrorKind =
  | "validation"
  | "auth"
  | "insufficient_credits"
  | "concurrency"
  | "rate_limited"
  | "model_unavailable"
  | "content_policy"
  | "network"
  | "timeout"
  | "download"
  | "not_found"
  | "io"
  | "internal";

export interface AppError {
  kind: ErrorKind;
  message: string;
}

export interface CellImage {
  file: string;
  path: string;
  thumbFile?: string | null;
  thumbPath?: string | null;
  resultUrl?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface CellAttempt {
  attempt: number;
  status: CellStatus;
  remoteId?: string | null;
  image?: CellImage | null;
  error?: AppError | null;
}

export interface CellState extends JobSpec {
  status: CellStatus;
  rawStatus?: string | null;
  remoteId?: string | null;
  attempt: number;
  submittedAt?: string | null;
  finishedAt?: string | null;
  elapsedMs?: number | null;
  cost?: number | null;
  error?: AppError | null;
  image?: CellImage | null;
  history: CellAttempt[];
}

export type RunStatus = "running" | "completed" | "stopped" | "paused" | "interrupted";

export interface Manifest {
  schemaVersion: number;
  id: string;
  createdAt: string;
  provider: ProviderId;
  unit: string;
  status: RunStatus;
  pausedReason?: string | null;
  label: string;
  config: ForgeConfig;
  prompts: Record<string, string>;
  promptTemplateVersion: number;
  cells: CellState[];
  best: Record<string, string>;
  dir: string;
}

export interface RunSummary {
  id: string;
  createdAt: string;
  label: string;
  provider: ProviderId;
  status: RunStatus;
  total: number;
  completed: number;
  cost: number;
  unit: string;
  cover?: string | null;
}

export interface Settings {
  provider: ProviderId;
  cliPath: string | null;
  concurrency: number;
  apiBaseUrl: string;
  uiLang: Lang;
  checkUpdates: boolean;
}

export interface UpdateInfo {
  current: string;
  /** Última versão publicada; null quando ainda não há release. */
  latest: string | null;
  available: boolean;
  pageUrl: string | null;
  downloadUrl: string | null;
  publishedAt: string | null;
}

export interface CliInfo {
  found: boolean;
  path?: string | null;
  version?: string | null;
}

export interface AccountInfo {
  provider?: ProviderId | null;
  email?: string | null;
  plan?: string | null;
  credits?: number | null;
  usd?: number | null;
}

export interface Estimate {
  total: number;
  unit: string;
  perCell: Record<string, number>;
  errors: { cellId: string; modelId: string; kind: ErrorKind; message: string }[];
}

export interface LogEntry {
  runId: string;
  cellId?: string | null;
  ts: string;
  kind: "request" | "response" | "status" | "error" | "info";
  title: string;
  body?: unknown;
}

export interface CredentialStatus {
  configured: boolean;
  /** "keychain" (cofre do sistema) ou "env" (variáveis de ambiente). */
  source?: string | null;
  keyIdMasked?: string | null;
}

export interface StartRunRequest {
  label: string;
  config: ForgeConfig;
  prompts: Record<string, string>;
  promptTemplateVersion: number;
  cells: JobSpec[];
  costs: Record<string, number>;
}

/** Erro vindo do Rust (`AppError`) ou qualquer outra coisa lançada. */
export function asAppError(e: unknown): AppError {
  if (e && typeof e === "object" && "message" in e) {
    const o = e as { kind?: ErrorKind; message: string };
    return { kind: o.kind ?? "internal", message: String(o.message) };
  }
  return { kind: "internal", message: String(e) };
}

export const api = {
  getSettings: () => invoke<Settings>("get_settings"),
  updateSettings: (patch: Partial<Settings>) => invoke<Settings>("update_settings", { patch }),
  detectCli: () => invoke<CliInfo>("detect_cli"),
  getAccount: () => invoke<AccountInfo>("get_account"),
  estimateRun: (cells: JobSpec[]) => invoke<Estimate>("estimate_run", { cells }),
  startRun: (req: StartRunRequest) => invoke<Manifest>("start_run", { req }),
  stopRun: (runId: string) => invoke<Manifest>("stop_run", { runId }),
  rerunCells: (runId: string, cellIds: string[]) => invoke<Manifest>("rerun_cells", { runId, cellIds }),
  listRuns: () => invoke<RunSummary[]>("list_runs"),
  getRun: (runId: string) => invoke<Manifest>("get_run", { runId }),
  deleteRun: (runId: string) => invoke<void>("delete_run", { runId }),
  setBest: (runId: string, styleId: string, cellId: string | null) =>
    invoke<Manifest>("set_best", { runId, styleId, cellId }),
  getLog: (runId: string, cellId?: string) => invoke<LogEntry[]>("get_log", { runId, cellId: cellId ?? null }),
  revealPath: (path: string) => invoke<void>("reveal_path", { path }),
  runsDir: () => invoke<string>("runs_dir"),
  exportImages: (runId: string, cellIds: string[], dest: string) =>
    invoke<number>("export_images", { runId, cellIds, dest }),
  /** Salva a imagem + o texto de handoff numa pasta; devolve o caminho do texto. */
  exportHandoff: (runId: string, cellId: string, dest: string, imageName: string, textName: string, text: string) =>
    invoke<string>("export_handoff", { runId, cellId, dest, imageName, textName, text }),
  /** Última release no GitHub comparada com a versão instalada. */
  checkUpdate: () => invoke<UpdateInfo>("check_update"),
  credentialStatus: () => invoke<CredentialStatus>("credential_status"),
  setApiCredentials: (keyId: string, keySecret: string) =>
    invoke<CredentialStatus>("set_api_credentials", { keyId, keySecret }),
  clearApiCredentials: () => invoke<CredentialStatus>("clear_api_credentials"),
  /** Testa a chave com o /estimate (grátis); devolve o preço de 1 imagem Soul 2 em US$. */
  testApiCredentials: () => invoke<number>("test_api_credentials"),
};

export const events = {
  onCell: (cb: (runId: string, cell: CellState) => void): Promise<UnlistenFn> =>
    listen<{ runId: string; cell: CellState }>("job://update", (e) => cb(e.payload.runId, e.payload.cell)),
  onRun: (cb: (runId: string, summary: RunSummary, pausedReason?: string | null) => void): Promise<UnlistenFn> =>
    listen<{ runId: string; summary: RunSummary; pausedReason?: string | null }>("run://update", (e) =>
      cb(e.payload.runId, e.payload.summary, e.payload.pausedReason),
    ),
  onLog: (cb: (entry: LogEntry) => void): Promise<UnlistenFn> => listen<LogEntry>("log://entry", (e) => cb(e.payload)),
};
