import type { JobSpec } from "@/lib/backend";
import { MODELS, paramsFor, ratiosFor, targetFor } from "@/registry/models";
import type { ModelDef, QualityTier } from "./types";

/** A tabela de preços mostra o custo de um lote de imagens. */
export const PRICE_BATCH = 1000;

export type PriceProvider = "api" | "cli";

/**
 * Uma célula por modelo disponível no provider, com os parâmetros que o app manda de verdade
 * (qualidade e resolução do nível escolhido, 16:9 quando o modelo aceita). Nos modelos cobrados por
 * tokens o tamanho do prompt também conta, então a tabela manda um prompt de verdade quando tem um.
 */
export function priceCheckCells(provider: PriceProvider, quality: QualityTier, prompt = "UI Forge price check"): JobSpec[] {
  return MODELS.flatMap((m) => {
    const target = targetFor(m, provider);
    if (!target) return [];
    const ratios = ratiosFor(m, provider);
    const ratio = ratios.includes("16:9") ? "16:9" : ratios[0];
    return [
      {
        cellId: m.id,
        styleId: "price",
        modelId: m.id,
        variation: 1,
        target,
        params: { prompt, aspect_ratio: ratio, ...paramsFor(m, provider, quality) },
      },
    ];
  });
}

/** Os parâmetros que definem o preço, para mostrar junto do valor ("2k · qualidade high"). */
export function priceParams(model: ModelDef, provider: PriceProvider, quality: QualityTier, words: { quality: string; speed: string }): string {
  const p = paramsFor(model, provider, quality) as Record<string, unknown>;
  const parts: string[] = [];
  if (p.resolution) parts.push(String(p.resolution));
  if (p.quality) parts.push(`${words.quality} ${p.quality}`);
  if (p.rendering_speed) parts.push(`${words.speed} ${String(p.rendering_speed).toLowerCase()}`);
  return parts.join(" · ");
}
