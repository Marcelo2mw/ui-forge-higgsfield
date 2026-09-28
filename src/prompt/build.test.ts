import { describe, expect, it } from "vitest";
import { activeVariants, buildPlan, generatedPrompt, staleOverrides } from "@/domain/plan";
import { DEFAULT_CONFIG } from "@/store/config";
import { findSegment, SEGMENTS } from "@/presets/segments";
import { findStyle, STYLES } from "@/presets/styles";
import { SCREENS } from "@/presets/options";
import { buildPrompt, withVariant, type PromptContext } from "./build";
import { colorName } from "./colors";

const bakery = findSegment("bakery")!;
const glass = findStyle("glass")!;

const base: PromptContext = {
  segment: bakery,
  screen: "dashboard",
  device: "desktop",
  presentation: "flat",
  theme: "light",
  accent: "#E11D74",
  lang: "pt-BR",
  brand: "",
  extra: "",
};

describe("buildPrompt", () => {
  it("reproduz a estrutura validada no estudo (Doceria, dashboard, glass, PT-BR)", () => {
    const p = buildPrompt(base, glass);
    expect(p).toMatch(/^High-fidelity UI design of a desktop web app dashboard for a bakery and confectionery management system called "Doce Encanto"\./);
    expect(p).toContain("Full-bleed straight-on screenshot of the app screen filling the whole 16:9 frame, no device, no perspective.");
    expect(p).toContain("menu items Painel, Pedidos, Encomendas, Produtos, Receitas, Estoque, Clientes, Financeiro");
    expect(p).toContain('"Faturamento do mês R$ 18.450"');
    expect(p).toContain('a donut chart "Mais vendidos" (Bolo de chocolate, Brigadeiro, Torta de limão, Brownie)');
    expect(p).toContain("colored status pills (Em preparo, Pronto, Entregue)");
    expect(p).toContain("Design style: glassmorphism");
    expect(p).toContain("Theme: light theme with raspberry pink (#E11D74) as the accent color");
    expect(p).toContain("All interface text in Brazilian Portuguese");
  });

  it("troca idioma do conteúdo e mantém as instruções em inglês", () => {
    const p = buildPrompt({ ...base, lang: "en" }, glass);
    expect(p).toContain("menu items Dashboard, Orders");
    expect(p).toContain('"Monthly revenue $18,450"');
    expect(p).toContain("All interface text in English");
    expect(p).not.toContain("Faturamento");
  });

  it("usa o layout de celular e reforça 'sem moldura'", () => {
    const p = buildPrompt({ ...base, device: "mobile" }, glass);
    expect(p).toContain("mobile app home screen (dashboard)");
    expect(p).toContain("9:16 frame edge to edge, no phone frame, no bezel, no device outline");
    expect(p).toContain('the greeting "Olá, Ana"');
    expect(p).toContain("a bottom tab bar with icons and labels Painel, Pedidos, Produtos, Estoque, Mais");
    expect(p).toContain("active tab");
  });

  it("estilo com tema forçado ignora o tema escolhido", () => {
    const dark = findStyle("darkpremium")!;
    expect(buildPrompt(base, dark)).toContain("Theme: dark theme with deep charcoal backgrounds");
  });

  it("negócio personalizado não inventa conteúdo fixo", () => {
    const p = buildPrompt({ ...base, segment: undefined, customBusiness: "clínica veterinária" }, glass);
    expect(p).toContain('a management system for this business: "clínica veterinária"');
    expect(p).toContain("that fit this business");
    expect(p).not.toContain("Doce Encanto");
  });

  it("tela personalizada usa a descrição do usuário (desktop e celular)", () => {
    const desc = "controle de validade dos produtos, com alertas e filtro por categoria";
    const wide = buildPrompt({ ...base, screen: "custom", customScreen: desc }, glass);
    expect(wide).toMatch(/^High-fidelity UI design of a desktop web app screen for a bakery/);
    expect(wide).toContain("menu items Painel, Pedidos");
    expect(wide).toContain(`Main area: this screen, as described by the user: "${desc}".`);
    const mobile = buildPrompt({ ...base, screen: "custom", customScreen: `${desc}.`, device: "mobile" }, glass);
    expect(mobile).toContain(`a header with the screen title; this screen, as described by the user: "${desc}"`);
    expect(mobile).toContain("a bottom tab bar with icons and labels Painel, Pedidos");
  });

  it("marca e detalhes extras entram no prompt", () => {
    const p = buildPrompt({ ...base, brand: "Açúcar & Arte", extra: "incluir mapa de entregas." }, glass);
    expect(p).toContain('called "Açúcar & Arte"');
    expect(p).toMatch(/Additional details: incluir mapa de entregas\.$/);
  });

  it("gera prompt para todo segmento × tela × formato sem 'undefined'", () => {
    for (const seg of SEGMENTS) {
      for (const screen of SCREENS) {
        for (const device of ["desktop", "tablet", "mobile"] as const) {
          for (const lang of ["pt-BR", "en"] as const) {
            const p = buildPrompt({ ...base, segment: seg, screen: screen.id, device, lang }, STYLES[0]);
            expect(p, `${seg.id}/${screen.id}/${device}/${lang}`).not.toMatch(/undefined|null|\[object/);
          }
        }
      }
    }
  });
});

describe("colorName", () => {
  it("dá nomes em inglês às cores comuns", () => {
    expect(colorName("#E11D74")).toBe("raspberry pink");
    expect(colorName("#2563eb")).toBe("royal blue");
    expect(colorName("#059669")).toBe("emerald green");
  });
});

describe("buildPlan", () => {
  it("monta estilos × modelos × variações e pula formatos não suportados", () => {
    const cfg = { ...DEFAULT_CONFIG, styleIds: ["glass", "flat"], modelIds: ["gpt-image-2.5", "grok-image-2.0"], variations: 2 };
    const plan = buildPlan(cfg, "cli");
    expect(plan.cells).toHaveLength(8);
    expect(plan.cells.every((c) => c.params.aspect_ratio === "16:9")).toBe(true);
    // Todas as v1 antes das v2.
    expect(plan.cells.slice(0, 4).every((c) => c.variation === 1)).toBe(true);
    expect(plan.cells[0].target).toBe("gpt_image_2_5");
    expect(plan.cells[0].params.quality).toBe("medium");

    const tablet = buildPlan({ ...cfg, device: "tablet", modelIds: ["grok-image-2.0", "flux-2"] }, "cli");
    expect(tablet.cells.every((c) => c.params.aspect_ratio === "4:3")).toBe(true);
  });

  it("no provider da API usa os endpoints da documentação e pula o que não existe lá", () => {
    const cfg = { ...DEFAULT_CONFIG, styleIds: ["glass"], modelIds: ["soul-2", "gpt-image-2.5", "nano-banana-pro", "ideogram-4"] };
    const plan = buildPlan(cfg, "api");
    expect(plan.cells.map((c) => c.target)).toEqual([
      "higgsfield-ai/soul/v2/standard",
      "marketing-studio/image/flare",
      "ideogram/v4.0",
    ]);
    expect(plan.cells[0].params.resolution).toBe("720p");
    expect(plan.cells[1].params).toMatchObject({ quality: "medium", resolution: "1k", enhance_prompt: false });
    expect(plan.skipped).toEqual([{ modelId: "nano-banana-pro", reason: "not-on-api" }]);
  });

  it("modelos só da API ficam de fora no CLI", () => {
    const plan = buildPlan({ ...DEFAULT_CONFIG, styleIds: ["glass"], modelIds: ["qwen-image-3"] }, "cli");
    expect(plan.cells).toHaveLength(0);
    expect(plan.skipped).toEqual([{ modelId: "qwen-image-3", reason: "not-on-cli" }]);
  });

  it("prompt acima do limite do modelo pula a célula (Z-Image aceita 800 caracteres na API)", () => {
    const plan = buildPlan({ ...DEFAULT_CONFIG, styleIds: ["glass", "flat"], modelIds: ["z-image"] }, "api");
    expect(plan.cells).toHaveLength(0);
    expect(plan.skipped.map((s) => s.reason)).toEqual(["prompt-too-long", "prompt-too-long"]);
    const short = buildPlan({ ...DEFAULT_CONFIG, styleIds: ["glass"], modelIds: ["z-image"], promptOverrides: { glass: { text: "short prompt", base: "" } } }, "api");
    expect(short.cells).toHaveLength(1);
  });

  it("Recraft recebe a paleta nativa no formato de cada provider", () => {
    const cfg = { ...DEFAULT_CONFIG, styleIds: ["glass"], modelIds: ["recraft-v4.1"], accent: "#2563eb" };
    expect(buildPlan(cfg, "cli").cells[0].params.colors).toEqual(["#2563EB"]);
    expect(buildPlan(cfg, "api").cells[0].params.colors).toEqual([{ rgb: [37, 99, 235] }]);
  });

  it("prompt editado à mão substitui o gerado", () => {
    const plan = buildPlan({ ...DEFAULT_CONFIG, styleIds: ["glass"], promptOverrides: { glass: { text: "meu prompt", base: "" } } }, "cli");
    expect(plan.cells.every((c) => c.params.prompt === "meu prompt")).toBe(true);
  });
});

describe("paleta da marca", () => {
  it("entra no bloco de tema, sem repetir a cor de destaque", () => {
    const p = buildPrompt({ ...base, palette: ["#E11D74", "#F9C5A0", "#2B2B2B"] }, glass);
    expect(p).toContain("Use this brand color palette throughout the interface, together with the accent:");
    expect(p).toContain("(#F9C5A0)");
    expect(p).toContain("(#2B2B2B)");
    expect(p.match(/#E11D74/g)).toHaveLength(1);
  });

  it("o Recraft recebe a cor de destaque + a paleta", () => {
    const cfg = { ...DEFAULT_CONFIG, styleIds: ["glass"], modelIds: ["recraft-v4.1"], accent: "#2563EB", palette: ["#F9C5A0"] };
    expect(buildPlan(cfg, "cli").cells[0].params.colors).toEqual(["#2563EB", "#F9C5A0"]);
    expect(buildPlan(cfg, "api").cells[0].params.colors).toEqual([{ rgb: [37, 99, 235] }, { rgb: [249, 197, 160] }]);
  });
});

describe("variantes do prompt", () => {
  const cfg = {
    ...DEFAULT_CONFIG,
    styleIds: ["glass", "flat"],
    modelIds: ["gpt-image-2.5"],
    promptVariants: ["mais espaço em branco", "", "cores vibrantes."],
  };

  it("A (original) + as frases preenchidas, com as letras certas", () => {
    expect(activeVariants(cfg)).toEqual([
      { key: "A", text: "" },
      { key: "B", text: "mais espaço em branco" },
      { key: "D", text: "cores vibrantes." },
    ]);
    expect(activeVariants(DEFAULT_CONFIG)).toEqual([]);
  });

  it("cada estilo × variante vira uma linha da grade", () => {
    const plan = buildPlan(cfg, "cli");
    expect(plan.cells).toHaveLength(6);
    expect(Object.keys(plan.prompts)).toEqual(["glass@A", "glass@B", "glass@D", "flat@A", "flat@B", "flat@D"]);
    const b = plan.cells.find((c) => c.styleId === "glass" && c.variantKey === "B")!;
    expect(b.cellId).toBe("glass__B__gpt-image-2.5__v1");
    expect(b.params.prompt).toMatch(/Extra emphasis for this version: mais espaço em branco\.$/);
    const a = plan.cells.find((c) => c.styleId === "glass" && c.variantKey === "A")!;
    expect(a.params.prompt).not.toContain("Extra emphasis");
  });

  it("sem variantes, nada muda (sem variantKey)", () => {
    const plan = buildPlan({ ...cfg, promptVariants: ["", "", ""] }, "cli");
    expect(plan.cells.every((c) => c.variantKey === undefined)).toBe(true);
    expect(Object.keys(plan.prompts)).toEqual(["glass", "flat"]);
  });

  it("withVariant limpa o ponto final da frase", () => {
    expect(withVariant("P.", "  cores vibrantes...  ")).toBe("P. Extra emphasis for this version: cores vibrantes.");
    expect(withVariant("P.", "   ")).toBe("P.");
  });
});

describe("edição manual do prompt", () => {
  it("fica desatualizada quando a configuração muda, mas continua valendo", () => {
    const style = findStyle("glass")!;
    const base = generatedPrompt(DEFAULT_CONFIG, style);
    const edited = { ...DEFAULT_CONFIG, styleIds: ["glass"], promptOverrides: { glass: { text: "minha versão", base } } };
    expect(staleOverrides(edited)).toEqual([]);
    const changed = { ...edited, accent: "#2563EB" };
    expect(staleOverrides(changed)).toEqual(["glass"]);
    expect(buildPlan(changed, "cli").cells[0].params.prompt).toBe("minha versão");
  });
});
