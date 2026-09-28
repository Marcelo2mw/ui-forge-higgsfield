import type { FontPairing, FontPairingId, Lang, StylePreset } from "@/domain/types";

/**
 * Pares de fontes do Google Fonts. O nome das fontes vai para o texto de handoff (a IA de código
 * importa exatamente essas); para o modelo de imagem vai a aparência + "similar to ...".
 */
export const FONT_PAIRINGS: FontPairing[] = [
  {
    id: "neutral",
    label: { "pt-BR": "Neutra", en: "Neutral" },
    heading: "Inter",
    body: "Inter",
    look: "clean neutral grotesque sans-serif, compact and highly legible",
  },
  {
    id: "geometric",
    label: { "pt-BR": "Geométrica", en: "Geometric" },
    heading: "Poppins",
    body: "Inter",
    look: "geometric sans-serif headings with round letterforms and a neutral sans-serif body",
  },
  {
    id: "modern",
    label: { "pt-BR": "Moderna", en: "Modern" },
    heading: "Plus Jakarta Sans",
    body: "Plus Jakarta Sans",
    look: "modern soft-geometric sans-serif, open and airy",
  },
  {
    id: "rounded",
    label: { "pt-BR": "Arredondada", en: "Rounded" },
    heading: "Nunito",
    body: "Nunito",
    look: "friendly rounded sans-serif with soft terminals",
  },
  {
    id: "editorial",
    label: { "pt-BR": "Editorial", en: "Editorial" },
    heading: "Fraunces",
    body: "Inter",
    look: "elegant high-contrast serif headings with a clean sans-serif body",
  },
  {
    id: "technical",
    label: { "pt-BR": "Técnica", en: "Technical" },
    heading: "Space Grotesk",
    body: "IBM Plex Sans",
    mono: "JetBrains Mono",
    look: "technical grotesque headings, a plain sans-serif body and numbers in a monospace font",
  },
  {
    id: "heavy",
    label: { "pt-BR": "Pesada", en: "Heavy" },
    heading: "Archivo Black",
    body: "Archivo",
    look: "chunky extra-bold display sans-serif headings with a bold sans-serif body",
  },
];

export function findFontPairing(id: string): FontPairing | undefined {
  return FONT_PAIRINGS.find((f) => f.id === id);
}

/** Par efetivo de um estilo: o escolhido, ou o do próprio estilo no modo automático. */
export function resolveFontPairing(choice: FontPairingId | "auto" | undefined, style: StylePreset): FontPairing {
  return (choice && choice !== "auto" && findFontPairing(choice)) || findFontPairing(style.font) || FONT_PAIRINGS[0];
}

/** Famílias distintas do par, na ordem títulos → corpo → mono. */
export function fontFamilies(f: FontPairing): string[] {
  return [...new Set([f.heading, f.body, f.mono].filter((x): x is string => !!x))];
}

export function fontPairingLabel(f: FontPairing, lang: Lang): string {
  return `${f.label[lang]} · ${fontFamilies(f).join(" + ")}`;
}

/** Frase de tipografia do prompt da imagem. */
export function typographySentence(f: FontPairing): string {
  const families = fontFamilies(f);
  const similar = families.length > 1 ? `${families.slice(0, -1).join(", ")} and ${families.at(-1)}` : families[0];
  return `Typography: ${f.look} (similar to ${similar}).`;
}
