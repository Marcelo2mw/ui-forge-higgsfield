import { describe, expect, it } from "vitest";
import type { ForgeConfig, HandoffStack } from "@/domain/types";
import { SCREENS } from "@/presets/options";
import { SEGMENTS } from "@/presets/segments";
import { STYLES } from "@/presets/styles";
import { DEFAULT_CONFIG } from "@/store/config";
import { buildHandoff, handoffImageFile, type HandoffOptions } from "./handoff";

const cfg: ForgeConfig = { ...DEFAULT_CONFIG, segmentId: "bakery", screen: "dashboard", accent: "#e11d74", palette: ["#F9C5A0"] };
const pt: HandoffOptions = { lang: "pt-BR", stack: "html", includeImagePrompt: true };
const src = { config: cfg, styleId: "glass", imagePrompt: "High-fidelity UI design of a desktop web app dashboard." };

describe("buildHandoff", () => {
  it("monta as seções com o contexto, o estilo, os tokens e a estrutura da imagem", () => {
    const md = buildHandoff(src, pt);
    expect(md).toMatch(/^# Handoff de design: Doce Encanto · Dashboard/);
    expect(md).toContain("a imagem anexada");
    expect(md).toContain("um protótipo funcional em HTML, CSS e JavaScript");
    expect(md).toContain("## 3. Estilo de design: Glassmorfismo");
    expect(md).toContain("backdrop-filter: blur(24px)");
    expect(md).toContain("Cor de destaque: `#E11D74`");
    expect(md).toContain("Paleta da marca: `#F9C5A0`");
    // Glass no automático usa a tipografia "Moderna".
    expect(md).toContain("**Plus Jakarta Sans** em títulos e textos");
    expect(md).toContain('"Faturamento do mês R$ 18.450"');
    expect(md).toContain("Painel, Pedidos, Encomendas");
    expect(md).toContain("`index.html`, `styles.css` e `app.js`");
    expect(md).toContain("## Anexo: prompt que gerou a imagem");
    expect(md).toContain("```text\nHigh-fidelity UI design");
  });

  it("em inglês, com a stack React e sem o prompt da imagem", () => {
    const md = buildHandoff(src, { lang: "en", stack: "react", includeImagePrompt: false });
    expect(md).toMatch(/^# Design handoff: Doce Encanto · Dashboard/);
    expect(md).toContain("React + Tailwind CSS");
    expect(md).toContain("Recharts");
    expect(md).toContain("## 3. Design style: Glassmorphism");
    // Os textos da tela continuam no idioma da imagem (PT-BR).
    expect(md).toContain("Interface language: Brazilian Portuguese");
    expect(md).toContain('"Faturamento do mês R$ 18.450"');
    expect(md).not.toContain("Appendix");
  });

  it("no pacote, cita a imagem pelo nome do arquivo", () => {
    const md = buildHandoff(src, { ...pt, imageFile: handoffImageFile("webp") });
    expect(md).toContain("a imagem `design-reference.webp` (nesta mesma pasta)");
    expect(md).not.toContain("a imagem anexada");
  });

  it("usa a tipografia escolhida, o tema forçado pelo estilo e a variante", () => {
    const md = buildHandoff(
      { ...src, config: { ...cfg, fontPairing: "technical" }, styleId: "darkpremium", variantText: "cores vibrantes." },
      pt,
    );
    expect(md).toContain("títulos em **Space Grotesk**, textos em **IBM Plex Sans**, números e códigos em **JetBrains Mono**");
    expect(md).toContain("Tema: escuro (o próprio estilo pede tema escuro).");
    expect(md).toContain("Ênfase desta versão: cores vibrantes.");
  });

  it("celular troca a barra lateral pelas abas inferiores", () => {
    const md = buildHandoff({ ...src, config: { ...cfg, device: "mobile" } }, pt);
    expect(md).toContain("Barra de abas inferior: Painel, Pedidos, Produtos, Estoque, Mais");
    expect(md).toContain('a saudação "Olá, Ana"');
    expect(md).not.toContain("Barra lateral esquerda");
    expect(md).toContain("390 × 844");
  });

  it("negócio personalizado não inventa conteúdo", () => {
    const md = buildHandoff({ ...src, config: { ...cfg, segmentId: "custom", customSegment: "clínica veterinária", brand: "" } }, pt);
    expect(md).toContain("sistema de gestão para clínica veterinária.");
    expect(md).toContain("conforme a imagem");
    expect(md).not.toContain("Doce Encanto");
  });

  it("configuração de um run antigo (sem tipografia nem paleta) ainda funciona", () => {
    const old = { ...cfg } as Partial<ForgeConfig>;
    delete old.fontPairing;
    delete old.palette;
    const md = buildHandoff({ ...src, config: old as ForgeConfig }, pt);
    expect(md).toContain("Plus Jakarta Sans");
    expect(md).not.toContain("Paleta da marca");
  });

  it("gera texto para todo segmento × tela × formato × estilo × stack sem 'undefined'", () => {
    const stacks: HandoffStack[] = ["html", "react", "existing"];
    for (const seg of [...SEGMENTS.map((s) => s.id), "custom"]) {
      for (const screen of SCREENS) {
        for (const device of ["desktop", "tablet", "mobile"] as const) {
          for (const style of STYLES) {
            for (const lang of ["pt-BR", "en"] as const) {
              const config = { ...cfg, segmentId: seg, screen: screen.id, device, lang, customScreen: "controle de validade" };
              const md = buildHandoff(
                { config, styleId: style.id, imagePrompt: "x" },
                { lang, stack: stacks[(screen.id.length + style.id.length) % 3], includeImagePrompt: true },
              );
              expect(md, `${seg}/${screen.id}/${device}/${style.id}/${lang}`).not.toMatch(/undefined|null|\[object|NaN/);
            }
          }
        }
      }
    }
  });
});
