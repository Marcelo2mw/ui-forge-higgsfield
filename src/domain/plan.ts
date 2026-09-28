import type { ForgeConfig, PromptVariant, ProviderId, StylePreset } from "@/domain/types";
import type { JobSpec } from "@/lib/backend";
import { ratioFor } from "@/presets/options";
import { findSegment } from "@/presets/segments";
import { findStyle } from "@/presets/styles";
import { buildPrompt, withVariant, type PromptContext } from "@/prompt/build";
import { normalizeHex } from "@/prompt/colors";
import { findModel, maxPromptFor, paramsFor, supportsRatio, targetFor } from "@/registry/models";

export type SkipReason = "ratio" | "not-on-api" | "not-on-cli" | "prompt-too-long";

export interface Plan {
  cells: JobSpec[];
  /** Prompt final de cada linha da grade (estilo, ou estilo@variante). */
  prompts: Record<string, string>;
  /** Modelos (ou combinações modelo × linha) que ficaram de fora, e por quê. */
  skipped: { modelId: string; styleId?: string; reason: SkipReason }[];
  /** Soma dos custos de referência (a estimativa exata vem do provider). */
  refCredits: number;
}

export function promptContext(cfg: ForgeConfig): PromptContext {
  const segment = cfg.segmentId === "custom" ? undefined : findSegment(cfg.segmentId);
  return {
    segment,
    customBusiness: cfg.customSegment,
    screen: cfg.screen,
    customScreen: cfg.customScreen,
    device: cfg.device,
    presentation: cfg.presentation,
    theme: cfg.theme,
    fontPairing: cfg.fontPairing,
    accent: cfg.accent,
    palette: cfg.palette,
    lang: cfg.lang,
    brand: cfg.brand,
    extra: cfg.extra,
  };
}

export function generatedPrompt(cfg: ForgeConfig, style: StylePreset): string {
  return buildPrompt(promptContext(cfg), style);
}

export function finalPrompt(cfg: ForgeConfig, style: StylePreset): string {
  return cfg.promptOverrides[style.id]?.text.trim() || generatedPrompt(cfg, style);
}

/** Edições manuais cujo prompt gerado mudou depois (a configuração foi alterada). */
export function staleOverrides(cfg: ForgeConfig): string[] {
  return Object.entries(cfg.promptOverrides)
    .filter(([styleId, o]) => {
      const style = findStyle(styleId);
      return style && cfg.styleIds.includes(styleId) && o.base !== generatedPrompt(cfg, style);
    })
    .map(([styleId]) => styleId);
}

/** Variantes ativas: A (original) + cada frase preenchida (B, C, D). Sem frases, só A implícito. */
export function activeVariants(cfg: ForgeConfig): PromptVariant[] {
  const extras = cfg.promptVariants
    .map((text, i) => ({ key: String.fromCharCode(66 + i), text: text.trim() }))
    .filter((v) => v.text);
  return extras.length ? [{ key: "A", text: "" }, ...extras] : [];
}

/** Chave da linha da grade: o estilo, ou estilo@variante quando há variantes. */
export function rowKey(styleId: string, variantKey?: string | null): string {
  return variantKey ? `${styleId}@${variantKey}` : styleId;
}

/** Paleta nativa do Recraft: hex no CLI, `{rgb:[r,g,b]}` na API. */
function recraftColors(colors: string[], provider: ProviderId): unknown[] {
  const hexes = colors.map(normalizeHex);
  if (provider !== "api") return hexes;
  return hexes.map((hex) => {
    const n = parseInt(hex.slice(1), 16);
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255] };
  });
}

export function buildPlan(cfg: ForgeConfig, provider: ProviderId): Plan {
  const ratio = ratioFor(cfg.device);
  const styles = cfg.styleIds.map(findStyle).filter((s): s is StylePreset => !!s);
  const variants: (PromptVariant | null)[] = activeVariants(cfg);
  if (variants.length === 0) variants.push(null);

  // Uma linha por estilo × variante.
  const rows = styles.flatMap((style) =>
    variants.map((variant) => ({
      style,
      variant,
      key: rowKey(style.id, variant?.key),
      prompt: withVariant(finalPrompt(cfg, style), variant?.text ?? ""),
    })),
  );
  const prompts: Record<string, string> = {};
  for (const r of rows) prompts[r.key] = r.prompt;

  const palette = [cfg.accent, ...cfg.palette.filter((c) => normalizeHex(c) !== normalizeHex(cfg.accent))].slice(0, 5);
  const cells: JobSpec[] = [];
  const skipped: Plan["skipped"] = [];
  let refCredits = 0;

  for (const modelId of cfg.modelIds) {
    const model = findModel(modelId);
    if (!model) continue;
    const target = targetFor(model, provider);
    if (!target) {
      skipped.push({ modelId, reason: provider === "api" ? "not-on-api" : "not-on-cli" });
      continue;
    }
    if (!supportsRatio(model, ratio, provider)) {
      skipped.push({ modelId, reason: "ratio" });
      continue;
    }
    const maxChars = maxPromptFor(model, provider);
    // Variações por "rodada": todas as v1 antes das v2, para a grade encher por igual.
    for (let v = 1; v <= cfg.variations; v++) {
      for (const row of rows) {
        if (maxChars && row.prompt.length > maxChars) {
          if (v === 1) skipped.push({ modelId, styleId: row.key, reason: "prompt-too-long" });
          continue;
        }
        const params: Record<string, unknown> = {
          prompt: row.prompt,
          aspect_ratio: ratio,
          ...paramsFor(model, provider, cfg.quality),
        };
        // Recraft aceita paleta nativa em todos os modos da API; no CLI só com model_type standard
        // (utility + colors falhou no estudo).
        if (model.id.startsWith("recraft-v4.1") && (provider === "api" || params.model_type === "standard")) {
          params.colors = recraftColors(palette, provider);
        }
        cells.push({
          cellId: `${row.key.replace("@", "__")}__${model.id}__v${v}`,
          styleId: row.style.id,
          ...(row.variant ? { variantKey: row.variant.key } : {}),
          modelId: model.id,
          variation: v,
          target,
          params,
        });
        refCredits += model.refCredits[cfg.quality];
      }
    }
  }
  cells.sort((a, b) => a.variation - b.variation);
  return { cells, prompts, skipped, refCredits };
}
