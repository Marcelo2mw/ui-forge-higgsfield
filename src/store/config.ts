import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { ForgeConfig, PromptOverride } from "@/domain/types";
import { findSegment } from "@/presets/segments";
import { MODELS } from "@/registry/models";

export const MAX_VARIANTS = 3;

export const DEFAULT_CONFIG: ForgeConfig = {
  segmentId: "bakery",
  customSegment: "",
  screen: "dashboard",
  customScreen: "",
  styleIds: ["glass", "neumorphism", "claymorphism", "softui", "flat"],
  theme: "light",
  fontPairing: "auto",
  accent: "#E11D74",
  palette: [],
  paletteThumb: null,
  device: "desktop",
  presentation: "flat",
  lang: "pt-BR",
  brand: "",
  extra: "",
  promptVariants: ["", "", ""],
  modelIds: MODELS.filter((m) => m.defaultSelected).map((m) => m.id),
  variations: 1,
  quality: "draft",
  promptOverrides: {},
};

// localStorage pode falhar (modo privado, dados apagados): nunca deixa o app quebrar por isso.
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignora */
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignora */
    }
  },
};

interface ConfigStore {
  config: ForgeConfig;
  patch: (p: Partial<ForgeConfig>) => void;
  setSegment: (id: string) => void;
  toggleStyle: (id: string) => void;
  toggleModel: (id: string) => void;
  /** Salva (ou apaga, com `text = null`) a edição manual do prompt de um estilo. */
  setPromptOverride: (styleId: string, text: string | null, base?: string) => void;
  /** Mantém a edição e passa a considerá-la atualizada em relação ao prompt gerado atual. */
  acceptOverride: (styleId: string, base: string) => void;
  setPalette: (colors: string[], thumb: string | null) => void;
  setVariant: (index: number, text: string) => void;
  reset: () => void;
}

/** Converte configurações salvas por versões antigas do app. */
function migrate(saved: Partial<ForgeConfig> | undefined): ForgeConfig {
  const cfg = { ...DEFAULT_CONFIG, ...(saved ?? {}) } as ForgeConfig;
  // Versão 1 guardava a edição como texto puro; sem a base, ela aparece como desatualizada.
  const overrides: Record<string, PromptOverride> = {};
  for (const [id, o] of Object.entries(cfg.promptOverrides ?? {})) {
    overrides[id] = typeof o === "string" ? { text: o, base: "" } : o;
  }
  cfg.promptOverrides = overrides;
  cfg.promptVariants = [...(cfg.promptVariants ?? []), "", "", ""].slice(0, MAX_VARIANTS);
  cfg.palette = Array.isArray(cfg.palette) ? cfg.palette : [];
  return cfg;
}

export const useConfig = create<ConfigStore>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      patch: (p) => set(({ config }) => ({ config: { ...config, ...p } })),
      setSegment: (id) =>
        set(({ config }) => {
          const seg = findSegment(id);
          return { config: { ...config, segmentId: id, accent: seg?.accent ?? config.accent, brand: "" } };
        }),
      toggleStyle: (id) =>
        set(({ config }) => {
          const has = config.styleIds.includes(id);
          return { config: { ...config, styleIds: has ? config.styleIds.filter((s) => s !== id) : [...config.styleIds, id] } };
        }),
      toggleModel: (id) =>
        set(({ config }) => {
          const has = config.modelIds.includes(id);
          return { config: { ...config, modelIds: has ? config.modelIds.filter((m) => m !== id) : [...config.modelIds, id] } };
        }),
      setPromptOverride: (styleId, text, base) =>
        set(({ config }) => {
          const next = { ...config.promptOverrides };
          if (text === null) delete next[styleId];
          else next[styleId] = { text, base: base ?? next[styleId]?.base ?? "" };
          return { config: { ...config, promptOverrides: next } };
        }),
      acceptOverride: (styleId, base) =>
        set(({ config }) => {
          const current = config.promptOverrides[styleId];
          if (!current) return {};
          return { config: { ...config, promptOverrides: { ...config.promptOverrides, [styleId]: { ...current, base } } } };
        }),
      setPalette: (colors, thumb) => set(({ config }) => ({ config: { ...config, palette: colors, paletteThumb: thumb } })),
      setVariant: (index, text) =>
        set(({ config }) => {
          const variants = [...config.promptVariants];
          variants[index] = text;
          return { config: { ...config, promptVariants: variants } };
        }),
      reset: () => set({ config: DEFAULT_CONFIG }),
    }),
    {
      name: "ui-forge.config",
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      migrate: (persisted) => ({ config: migrate((persisted as Partial<ConfigStore>)?.config) }) as ConfigStore,
      merge: (persisted, current) => ({
        ...current,
        config: migrate((persisted as Partial<ConfigStore>)?.config),
      }),
    },
  ),
);
