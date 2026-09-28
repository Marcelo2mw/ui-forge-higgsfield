import type { ModelDef, ProviderId, QualityTier } from "@/domain/types";

const R_WIDE = ["1:1", "3:2", "2:3", "4:3", "3:4", "4:5", "5:4", "16:9", "9:16", "21:9"];
const R_MSI_API = ["1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "21:9"];
const R_RECRAFT_API = ["1:1", "2:1", "1:2", "3:2", "2:3", "4:3", "3:4", "5:4", "4:5", "16:9", "9:16"];
const R_SOUL = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"];

/**
 * Modelos de imagem.
 * - `fit` e `refCredits` vêm do estudo de calibração (2026-09-28): dashboard com texto em PT-BR,
 *   16:9, créditos do plano via CLI (`hf generate cost`, rascunho e final medidos).
 * - Os modelos só da API foram avaliados no mesmo dia, pela própria API: dashboard de escola,
 *   PT-BR, 16:9, rascunho, em glassmorfismo, claymorfismo e flat, com o Marketing Studio 2.0 de referência.
 * - Endpoints e parâmetros da API vêm das páginas de cada modelo em docs.higgsfield.ai/docs/models
 *   (consultadas em 2026-09-28).
 * - `api.priceFromUsd`: "a partir de" da tabela "Models API Pricing" do console (2026-09-28), que é a
 *   configuração MAIS BARATA de cada modelo. Só aparece quando não dá para consultar o /estimate (sem chave).
 * - Preço real (sondado no /estimate em 2026-09-28): a qualidade pesa mais que a resolução. Marketing
 *   Studio 2.0, US$/imagem — low/medium/high: 1k 0,014/0,04/0,128 · 2k 0,017/0,07/0,247 · 4k 0,022/0,111/0,411.
 *   Ideogram: TURBO 0,03 · DEFAULT 0,06 · QUALITY 0,10. Grok só aceita quality low/medium.
 *   Por isso o "Final" dos três Marketing Studio na API é 2k com quality medium, não high:
 *   high custaria ~3,5x mais só pelo refinamento (decisão de 2026-09-28).
 */
export const MODELS: ModelDef[] = [
  {
    id: "gpt-image-2.5",
    label: "GPT Image 2.5",
    vendor: "OpenAI",
    fit: "recommended",
    defaultSelected: true,
    aspectRatios: [...R_WIDE, "27:16", "16:27"],
    refCredits: { draft: 0.5, final: 2.75 },
    note: { "pt-BR": "Melhor custo-benefício no estudo (fora da API)", en: "Best value in the study (not on the API)" },
    cli: {
      jobType: "gpt_image_2_5",
      params: { draft: { quality: "medium", resolution: "1k" }, final: { quality: "high", resolution: "2k" } },
    },
    api: { availability: "no", endpoint: null, params: { draft: {}, final: {} } },
  },
  {
    // Endpoint próprio da API. Tem os mesmos níveis de qualidade do GPT Image 2.5, mas não é o
    // mesmo modelo confirmado (o GPT Image 2.5 não está no catálogo da API).
    id: "marketing-studio-image-flare",
    label: "Marketing Studio Image 2.5 Flare",
    vendor: "Higgsfield",
    fit: "recommended",
    defaultSelected: true,
    aspectRatios: R_MSI_API,
    refCredits: { draft: 0, final: 0 },
    note: {
      "pt-BR": "Só na API. No teste: texto em português quase perfeito, os 3 estilos certos e o mais rápido (~20 s). Cobrado por uso (tokens).",
      en: "API only. In the test: near-perfect Portuguese text, all 3 styles right and the fastest (~20 s). Billed by usage (tokens).",
    },
    cli: null,
    api: {
      availability: "yes",
      endpoint: "marketing-studio/image/flare",
      aspectRatios: R_MSI_API,
      maxPromptChars: 5000,
      priceFromUsd: 0.0126,
      params: {
        draft: { quality: "medium", resolution: "1k", enhance_prompt: false },
        final: { quality: "medium", resolution: "2k", enhance_prompt: false },
      },
    },
  },
  {
    id: "marketing-studio-image-sunburst",
    label: "Marketing Studio Image 2.5 Sunburst",
    vendor: "Higgsfield",
    fit: "recommended",
    defaultSelected: false,
    aspectRatios: R_MSI_API,
    refCredits: { draft: 0, final: 0 },
    note: {
      "pt-BR": "Só na API. No teste: no nível do Flare, com deslizes raros de texto (~22 s). Cobrado por uso (tokens).",
      en: "API only. In the test: on par with Flare, with rare text slips (~22 s). Billed by usage (tokens).",
    },
    cli: null,
    api: {
      availability: "yes",
      endpoint: "marketing-studio/image/sunburst",
      aspectRatios: R_MSI_API,
      maxPromptChars: 5000,
      priceFromUsd: 0.0126,
      params: {
        draft: { quality: "medium", resolution: "1k", enhance_prompt: false },
        final: { quality: "medium", resolution: "2k", enhance_prompt: false },
      },
    },
  },
  {
    id: "grok-image-2.0",
    label: "Grok Image 2.0",
    vendor: "xAI",
    fit: "recommended",
    defaultSelected: true,
    aspectRatios: ["1:1", "1:2", "2:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16"],
    refCredits: { draft: 2, final: 2.5 },
    cli: {
      jobType: "grok_image_2_0",
      params: { draft: { resolution: "1k", quality: "medium" }, final: { resolution: "2k", quality: "medium" } },
    },
    api: {
      availability: "yes",
      endpoint: "xai/grok-imagine-image-2.0",
      label: "Grok Imagine Image 2.0",
      priceFromUsd: 0.04,
      params: { draft: { resolution: "1k", quality: "medium" }, final: { resolution: "2k", quality: "medium" } },
    },
  },
  {
    id: "marketing-studio-image",
    label: "Marketing Studio Image",
    vendor: "Higgsfield",
    fit: "recommended",
    defaultSelected: true,
    aspectRatios: R_WIDE,
    refCredits: { draft: 2, final: 2 },
    note: { "pt-BR": "Modelo da própria Higgsfield", en: "Higgsfield's own model" },
    cli: {
      jobType: "marketing_studio_image",
      params: { draft: { resolution: "1k" }, final: { resolution: "2k" } },
    },
    api: {
      availability: "yes",
      endpoint: "marketing-studio/image",
      label: "Marketing Studio Image 2.0 Alpha",
      aspectRatios: R_MSI_API,
      maxPromptChars: 5000,
      priceFromUsd: 0.0162,
      params: {
        draft: { resolution: "1k", quality: "medium", enhance_prompt: false },
        final: { resolution: "2k", quality: "medium", enhance_prompt: false },
      },
    },
  },
  {
    id: "ideogram-4",
    label: "Ideogram 4.0",
    vendor: "Ideogram",
    fit: "weak",
    defaultSelected: false,
    aspectRatios: ["1:1", "2:1", "1:2", "3:2", "2:3", "4:5", "5:4", "4:3", "3:4", "16:9", "9:16"],
    refCredits: { draft: 0, final: 0 },
    note: {
      "pt-BR": "Só na API. No teste: visual bonito e em alta resolução, mas embaralha menus e tabelas.",
      en: "API only. In the test: good-looking and high resolution, but garbles menus and tables.",
    },
    cli: null,
    api: {
      availability: "yes",
      endpoint: "ideogram/v4.0",
      maxPromptChars: 2048,
      priceFromUsd: 0.03,
      params: { draft: { rendering_speed: "DEFAULT" }, final: { rendering_speed: "QUALITY" } },
    },
  },
  {
    id: "qwen-image-3",
    label: "Qwen Image 3",
    vendor: "Alibaba",
    fit: "good",
    defaultSelected: false,
    aspectRatios: ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"],
    refCredits: { draft: 0, final: 0 },
    note: {
      "pt-BR": "Só na API. No teste: tabelas e KPIs certos e bom claymorfismo; às vezes embaralha legendas. Lento (~2 min).",
      en: "API only. In the test: correct tables and KPIs, good claymorphism; sometimes garbles legends. Slow (~2 min).",
    },
    cli: null,
    api: {
      availability: "yes",
      endpoint: "alibaba/qwen-image-3/text-to-image",
      priceFromUsd: 0.04,
      // A API só aceita prompt_extend = true (false volta 400 "True was expected"), então o
      // parâmetro fica de fora: o Qwen pode reescrever o prompt, e com ele os textos da tela.
      params: {
        draft: { resolution: "1k" },
        final: { resolution: "2k" },
      },
    },
  },
  {
    id: "nano-banana-pro",
    label: "Nano Banana Pro",
    vendor: "Google",
    fit: "recommended",
    defaultSelected: false,
    aspectRatios: R_WIDE,
    refCredits: { draft: 2, final: 2 },
    note: { "pt-BR": "O melhor em claymorfismo e 3D (fora da API)", en: "Best at claymorphism and 3D (not on the API)" },
    cli: {
      jobType: "nano_banana_pro",
      params: { draft: { resolution: "1k" }, final: { resolution: "2k" } },
    },
    api: { availability: "no", endpoint: null, params: { draft: {}, final: {} } },
  },
  {
    id: "seedream-5-pro",
    label: "Seedream 5.0 Pro",
    vendor: "ByteDance",
    fit: "good",
    defaultSelected: false,
    aspectRatios: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
    refCredits: { draft: 2.5, final: 2.5 },
    note: { "pt-BR": "Alta resolução; às vezes erra datas e números", en: "High resolution; sometimes garbles dates" },
    cli: {
      jobType: "seedream_v5_pro",
      params: { draft: { resolution: "2k" }, final: { resolution: "2k" } },
    },
    api: { availability: "no", endpoint: null, params: { draft: {}, final: {} } },
  },
  {
    id: "recraft-v4.1",
    label: "Recraft V4.1",
    vendor: "Recraft",
    fit: "good",
    defaultSelected: false,
    aspectRatios: ["1:1", "3:4", "4:3", "4:5", "5:4", "3:2", "2:3", "16:9", "9:16"],
    refCredits: { draft: 1.25, final: 8 },
    note: { "pt-BR": "Texto correto, estilo menos consistente", en: "Correct text, less consistent style" },
    cli: {
      jobType: "recraft_v4_1",
      params: { draft: { resolution: "1k", model_type: "standard" }, final: { resolution: "2k", model_type: "standard" } },
    },
    api: {
      availability: "yes",
      endpoint: "recraft/v4.1/text-to-image",
      aspectRatios: R_RECRAFT_API,
      maxPromptChars: 10000,
      priceFromUsd: 0.035,
      params: { draft: { resolution: "1k", output_format: "png" }, final: { resolution: "1k", output_format: "png" } },
    },
  },
  // Modos do Recraft V4.1 que só existem na API (páginas em open.higgsfield.ai/models/recraft/v4.1/...).
  // Os Pro geram só em 2k e custam bem mais (US$ 0,21 contra 0,035 por imagem).
  recraftApiMode("recraft-v4.1-utility", "Recraft V4.1 Utility", "recraft/v4.1/utility/text-to-image", "1k", 0.035),
  recraftApiMode("recraft-v4.1-pro", "Recraft V4.1 Pro", "recraft/v4.1/pro/text-to-image", "2k", 0.21),
  recraftApiMode("recraft-v4.1-utility-pro", "Recraft V4.1 Utility Pro", "recraft/v4.1/utility/pro/text-to-image", "2k", 0.21),
  {
    id: "soul-2",
    label: "Higgsfield Soul 2",
    vendor: "Higgsfield",
    fit: "weak",
    defaultSelected: false,
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
    refCredits: { draft: 0.12, final: 0.12 },
    note: { "pt-BR": "Modelo fotográfico: ótimo em pessoas, fraco em texto de UI", en: "Photo model: great for people, weak at UI text" },
    cli: {
      jobType: "text2image_soul_v2",
      params: { draft: { quality: "1.5k" }, final: { quality: "2k" } },
    },
    api: {
      availability: "yes",
      endpoint: "higgsfield-ai/soul/v2/standard",
      priceFromUsd: 0.0032,
      params: { draft: { resolution: "720p" }, final: { resolution: "1080p" } },
    },
  },
  {
    id: "soul-standard",
    label: "Soul Standard",
    vendor: "Higgsfield",
    fit: "weak",
    defaultSelected: false,
    aspectRatios: R_SOUL,
    refCredits: { draft: 0, final: 0 },
    note: {
      "pt-BR": "Só na API. Soul 1, modelo fotográfico: no teste, o texto da tela saiu ilegível.",
      en: "API only. Soul 1, a photo model: in the test, the screen text came out illegible.",
    },
    cli: null,
    api: {
      availability: "yes",
      endpoint: "higgsfield-ai/soul/standard",
      priceFromUsd: 0.0938,
      // enhance_prompt vem ligado por padrão e reescreveria o prompt (e os textos da tela).
      params: { draft: { resolution: "720p", enhance_prompt: false }, final: { resolution: "1080p", enhance_prompt: false } },
    },
  },
  {
    id: "flux-2",
    label: "FLUX.2",
    vendor: "Black Forest Labs",
    fit: "weak",
    defaultSelected: false,
    aspectRatios: ["1:1", "4:3", "3:4", "16:9", "9:16"],
    refCredits: { draft: 1, final: 1.5 },
    note: { "pt-BR": "Bom layout, texto embaralhado em tabelas", en: "Good layout, garbled table text" },
    cli: {
      jobType: "flux_2",
      params: { draft: { resolution: "1k", variant: "pro" }, final: { resolution: "2k", variant: "pro" } },
    },
    api: { availability: "no", endpoint: null, params: { draft: {}, final: {} } },
  },
  {
    id: "kling-o1-image",
    label: "Kling O1 Image",
    vendor: "Kling",
    fit: "weak",
    defaultSelected: false,
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"],
    refCredits: { draft: 0.5, final: 0.5 },
    note: { "pt-BR": "Texto ilegível no estudo", en: "Illegible text in the study" },
    cli: {
      jobType: "kling_omni_image",
      params: { draft: { resolution: "1k" }, final: { resolution: "2k" } },
    },
    api: { availability: "no", endpoint: null, params: { draft: {}, final: {} } },
  },
  {
    id: "z-image",
    label: "Z-Image Turbo",
    vendor: "Tongyi-MAI",
    fit: "unstable",
    defaultSelected: false,
    aspectRatios: ["1:1", "4:3", "3:4", "16:9", "9:16"],
    refCredits: { draft: 0.15, final: 0.15 },
    note: {
      "pt-BR": "Falhou na fila no estudo; na API aceita no máximo 800 caracteres de prompt",
      en: "Failed in the queue in the study; the API accepts at most 800 prompt characters",
    },
    cli: { jobType: "z_image", params: { draft: {}, final: {} } },
    api: {
      availability: "yes",
      endpoint: "z-image/turbo",
      maxPromptChars: 800,
      priceFromUsd: 0.015,
      params: { draft: { resolution: "1k" }, final: { resolution: "2k" } },
    },
  },
  {
    id: "seedream-5-flash",
    label: "Seedream 5.0 Flash",
    vendor: "ByteDance",
    fit: "unstable",
    defaultSelected: false,
    aspectRatios: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
    refCredits: { draft: 0.5, final: 0.5 },
    note: { "pt-BR": "Recusado pelo servidor (422) no estudo", en: "Rejected by the server (422) in the study" },
    cli: { jobType: "seedream_5_0_flash", params: { draft: {}, final: {} } },
    api: { availability: "no", endpoint: null, params: { draft: {}, final: {} } },
  },
];

/**
 * Um modo do Recraft V4.1 que só existe na API; cada um aceita uma única resolução.
 * No teste de 2026-09-28 (3 estilos pela API) os três ficaram fracos para UI: KPIs certos, mas
 * eixos, meses e tabelas embaralhados.
 */
function recraftApiMode(id: string, label: string, endpoint: string, resolution: "1k" | "2k", priceFromUsd: number): ModelDef {
  const params = { resolution, output_format: "png" };
  return {
    id,
    label,
    vendor: "Recraft",
    fit: "weak",
    defaultSelected: false,
    aspectRatios: R_RECRAFT_API,
    refCredits: { draft: 0, final: 0 },
    note: {
      "pt-BR": `Só na API (${resolution}). No teste: KPIs certos, mas eixos, meses e tabelas embaralhados.`,
      en: `API only (${resolution}). In the test: correct KPIs, but garbled axes, months and tables.`,
    },
    cli: null,
    api: { availability: "yes", endpoint, aspectRatios: R_RECRAFT_API, maxPromptChars: 10000, priceFromUsd, params: { draft: params, final: params } },
  };
}

export function findModel(id: string): ModelDef | undefined {
  return MODELS.find((m) => m.id === id);
}

/** Alvo do provider: job_type (CLI/simulação) ou endpoint (API). `null` = não existe nesse provider. */
export function targetFor(model: ModelDef, provider: ProviderId): string | null {
  return provider === "api" ? model.api.endpoint : (model.cli?.jobType ?? null);
}

export function paramsFor(model: ModelDef, provider: ProviderId, quality: QualityTier) {
  return (provider === "api" ? model.api.params[quality] : model.cli?.params[quality]) ?? {};
}

export function ratiosFor(model: ModelDef, provider: ProviderId): string[] {
  return provider === "api" ? (model.api.aspectRatios ?? model.aspectRatios) : model.aspectRatios;
}

export function supportsRatio(model: ModelDef, ratio: string, provider: ProviderId = "cli"): boolean {
  return ratiosFor(model, provider).includes(ratio);
}

export function maxPromptFor(model: ModelDef, provider: ProviderId): number | undefined {
  return provider === "api" ? model.api.maxPromptChars : model.maxPromptChars;
}

export function labelFor(model: ModelDef, provider: ProviderId): string {
  return provider === "api" ? (model.api.label ?? model.label) : model.label;
}
