import { create } from "zustand";
import {
  api,
  asAppError,
  type AccountInfo,
  type CellState,
  type CliInfo,
  type LogEntry,
  type Manifest,
  type RunSummary,
  type Settings,
} from "@/lib/backend";

interface Panels {
  log: boolean;
  history: boolean;
  settings: boolean;
  compare: boolean;
}

export type TileSize = "s" | "m" | "l";

interface AppStore {
  tileSize: TileSize;
  setTileSize: (s: TileSize) => void;
  settings: Settings | null;
  cli: CliInfo | null;
  account: AccountInfo | null;
  accountError: string | null;
  run: Manifest | null;
  runs: RunSummary[];
  logs: LogEntry[];
  /** Células selecionadas (comparar / exportar). */
  selection: string[];
  lightbox: string | null;
  panels: Panels;

  init: () => Promise<void>;
  saveSettings: (patch: Partial<Settings>) => Promise<void>;
  refreshAccount: () => Promise<void>;
  refreshCli: () => Promise<void>;
  refreshRuns: () => Promise<void>;
  openRun: (id: string) => Promise<void>;
  setRun: (m: Manifest | null) => void;
  applyCell: (runId: string, cell: CellState) => void;
  applyRunSummary: (runId: string, s: RunSummary, pausedReason?: string | null) => void;
  pushLog: (e: LogEntry) => void;
  toggleSelect: (cellId: string) => void;
  clearSelection: () => void;
  setLightbox: (cellId: string | null) => void;
  setPanel: (p: keyof Panels, open: boolean) => void;
}

function savedTileSize(): TileSize {
  try {
    const v = localStorage.getItem("ui-forge.tileSize");
    return v === "s" || v === "l" ? v : "m";
  } catch {
    return "m";
  }
}

export const useApp = create<AppStore>()((set, get) => ({
  tileSize: savedTileSize(),
  setTileSize: (tileSize) => {
    try {
      localStorage.setItem("ui-forge.tileSize", tileSize);
    } catch {
      /* ignora */
    }
    set({ tileSize });
  },
  settings: null,
  cli: null,
  account: null,
  accountError: null,
  run: null,
  runs: [],
  logs: [],
  selection: [],
  lightbox: null,
  panels: { log: false, history: false, settings: false, compare: false },

  init: async () => {
    const settings = await api.getSettings();
    set({ settings });
    await Promise.all([get().refreshCli(), get().refreshAccount(), get().refreshRuns()]);
    // Reabre o último run (útil depois de reiniciar no meio de uma geração).
    const last = get().runs[0];
    if (last && !get().run) await get().openRun(last.id);
  },

  saveSettings: async (patch) => {
    const settings = await api.updateSettings(patch);
    set({ settings });
    if ("provider" in patch || "cliPath" in patch) {
      await Promise.all([get().refreshCli(), get().refreshAccount()]);
    }
  },

  refreshAccount: async () => {
    try {
      set({ account: await api.getAccount(), accountError: null });
    } catch (e) {
      set({ account: null, accountError: asAppError(e).message });
    }
  },

  refreshCli: async () => {
    try {
      set({ cli: await api.detectCli() });
    } catch {
      set({ cli: { found: false } });
    }
  },

  refreshRuns: async () => {
    try {
      set({ runs: await api.listRuns() });
    } catch {
      /* histórico é opcional */
    }
  },

  openRun: async (id) => {
    const [run, logs] = await Promise.all([api.getRun(id), api.getLog(id).catch(() => [])]);
    set({ run, logs, selection: [], lightbox: null });
  },

  setRun: (run) => set({ run, logs: [], selection: [], lightbox: null }),

  applyCell: (runId, cell) =>
    set(({ run }) => {
      if (!run || run.id !== runId) return {};
      return { run: { ...run, cells: run.cells.map((c) => (c.cellId === cell.cellId ? cell : c)) } };
    }),

  applyRunSummary: (runId, s, pausedReason) => {
    set(({ run, runs }) => ({
      run: run && run.id === runId ? { ...run, status: s.status, pausedReason: pausedReason ?? null } : run,
      runs: runs.some((r) => r.id === runId) ? runs.map((r) => (r.id === runId ? s : r)) : [s, ...runs],
    }));
    if (s.status !== "running") void get().refreshAccount();
  },

  pushLog: (e) =>
    set(({ run, logs }) => (run && e.runId === run.id ? { logs: [...logs.slice(-499), e] } : {})),

  toggleSelect: (cellId) =>
    set(({ selection }) => ({
      selection: selection.includes(cellId)
        ? selection.filter((c) => c !== cellId)
        : selection.length >= 4
          ? [...selection.slice(1), cellId]
          : [...selection, cellId],
    })),

  clearSelection: () => set({ selection: [] }),
  setLightbox: (lightbox) => set({ lightbox }),
  setPanel: (p, open) => set(({ panels }) => ({ panels: { ...panels, [p]: open } })),
}));
