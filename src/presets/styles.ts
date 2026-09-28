import type { StylePreset } from "@/domain/types";

/**
 * Estilos de design. Os cinco primeiros (calibrated: true) foram validados no estudo de
 * calibração com GPT Image 2.5, Nano Banana Pro, Grok 2.0 e Marketing Studio Image.
 */
export const STYLES: StylePreset[] = [
  {
    id: "glass",
    label: { "pt-BR": "Glassmorfismo", en: "Glassmorphism" },
    hint: { "pt-BR": "Vidro fosco translúcido com desfoque", en: "Frosted translucent glass with blur" },
    fragment:
      "Design style: glassmorphism, frosted translucent glass panels with strong background blur, thin semi-transparent white borders, soft colorful gradient blobs glowing behind the panels in tints of the accent color, soft diffused shadows, generous rounded corners.",
    swatch: "sw-glass",
    calibrated: true,
  },
  {
    id: "neumorphism",
    label: { "pt-BR": "Neumorfismo", en: "Neumorphism" },
    hint: { "pt-BR": "Relevo suave da mesma cor do fundo", en: "Soft extruded surfaces, same color as the background" },
    fragment:
      "Design style: neumorphism, the whole interface shares one single soft base color for the background and every panel; cards, buttons, inputs and the sidebar are extruded from that same surface using paired soft shadows, a light highlight on the top-left and a darker soft shadow on the bottom-right; the active menu item and toggles look pressed in (inset); no borders, no gradients on panels, low contrast, rounded corners, the accent color used sparingly on icons, active states and chart lines.",
    swatch: "sw-neu",
    calibrated: true,
  },
  {
    id: "claymorphism",
    label: { "pt-BR": "Claymorfismo", en: "Claymorphism" },
    hint: { "pt-BR": "Elementos 3D inflados de massinha", en: "Puffy inflated 3D clay elements" },
    fragment:
      "Design style: claymorphism, chunky puffy inflated 3D clay-like cards, buttons and pills with thick rounded corners, soft pastel colors, smooth matte clay texture, a bright inner highlight along the top edge and a soft inner shadow along the bottom edge, soft outer drop shadows that make every element float above a pastel background, playful 3D clay icons, friendly rounded typography.",
    swatch: "sw-clay",
    calibrated: true,
  },
  {
    id: "softui",
    label: { "pt-BR": "Soft UI", en: "Soft UI" },
    hint: { "pt-BR": "Cartões brancos, sombras amplas e suaves", en: "White cards, wide soft shadows" },
    fragment:
      "Design style: soft UI, a clean airy modern dashboard with white cards floating on a very light warm off-white background, large corner radius, very soft wide diffuse shadows, small rounded icon badges filled with gentle gradients, pastel tints in the charts, generous whitespace, thin light dividers, calm low-contrast palette, elegant and minimal.",
    swatch: "sw-soft",
    calibrated: true,
  },
  {
    id: "flat",
    label: { "pt-BR": "Flat", en: "Flat" },
    hint: { "pt-BR": "Blocos de cor sólida, sem sombras", en: "Solid color blocks, no shadows" },
    fragment:
      "Design style: flat design, solid flat color blocks with no shadows, no gradients, no textures and no blur; the sidebar is a solid block of the accent color with white text and icons; simple geometric shapes, crisp flat line icons, color-coded KPI cards in solid colors, strong contrast, clean grid alignment, small corner radius.",
    swatch: "sw-flat",
    calibrated: true,
  },
  {
    id: "material3",
    label: { "pt-BR": "Material 3", en: "Material 3" },
    hint: { "pt-BR": "Superfícies tonais, botões em pílula", en: "Tonal surfaces, pill buttons" },
    fragment:
      "Design style: Material Design 3, tonal surface colors derived from the accent color, large rounded cards, a navigation rail with a pill-shaped active indicator, filled and tonal buttons, a large floating action button, subtle elevation, clean geometric sans-serif typography.",
    swatch: "sw-material",
    calibrated: false,
  },
  {
    id: "minimal",
    label: { "pt-BR": "Minimalista", en: "Minimalist" },
    hint: { "pt-BR": "Muito espaço em branco, linhas finas", en: "Lots of whitespace, hairlines" },
    fragment:
      "Design style: minimalist Swiss-inspired interface, lots of whitespace, a strict grid, thin 1px hairline dividers, a monochrome palette with a single accent color, no shadows, crisp typographic hierarchy with large numbers, understated line icons.",
    swatch: "sw-minimal",
    calibrated: false,
  },
  {
    id: "darkpremium",
    label: { "pt-BR": "Dark Premium", en: "Dark Premium" },
    hint: { "pt-BR": "Fundo quase preto, brilho sutil no destaque", en: "Near-black, subtle accent glow" },
    fragment:
      "Design style: premium dark mode SaaS, near-black charcoal background, panels separated by subtle 1px low-opacity borders, a soft glow on accent elements, fine gradients inside the charts, crisp high-contrast typography, sleek and modern.",
    swatch: "sw-dark",
    forcesTheme: "dark",
    calibrated: false,
  },
  {
    id: "bento",
    label: { "pt-BR": "Bento Grid", en: "Bento Grid" },
    hint: { "pt-BR": "Blocos de tamanhos variados, como marmita japonesa", en: "Tiles of varied sizes, bento-box layout" },
    fragment:
      "Design style: bento grid, the content is composed of rounded rectangular tiles of different sizes arranged like a bento box, each tile focused on one piece of information with a large number or a small chart, subtle tinted tile backgrounds, playful but orderly composition.",
    swatch: "sw-bento",
    calibrated: false,
  },
  {
    id: "neubrutalism",
    label: { "pt-BR": "Neubrutalismo", en: "Neubrutalism" },
    hint: { "pt-BR": "Contornos pretos grossos, sombra dura", en: "Thick black outlines, hard shadows" },
    fragment:
      "Design style: neo-brutalism, thick bold black outlines on every card, button and input, hard offset black drop shadows with no blur, saturated flat colors (yellow, pink, cyan, lime) mixed with the accent color, chunky heavy typography, raw playful look.",
    swatch: "sw-brutal",
    calibrated: false,
  },
  {
    id: "aurora",
    label: { "pt-BR": "Aurora / Gradiente", en: "Aurora Gradient" },
    hint: { "pt-BR": "Degradê vibrante fluindo ao fundo", en: "Vibrant flowing mesh gradient" },
    fragment:
      "Design style: aurora gradient UI, a vibrant flowing mesh-gradient background inspired by the northern lights blending into the accent color, translucent cards floating above it, soft glows around highlights, luminous modern feel.",
    swatch: "sw-aurora",
    calibrated: false,
  },
  {
    id: "skeuomorphism",
    label: { "pt-BR": "Skeuomorfismo", en: "Skeuomorphism" },
    hint: { "pt-BR": "Materiais realistas: couro, papel, metal", en: "Realistic materials: leather, paper, metal" },
    fragment:
      "Design style: modern skeuomorphism, realistic tactile materials such as a stitched leather sidebar, paper-textured cards, brushed-metal toggles and glossy buttons with realistic highlights, rich lighting and depth, physical-object metaphors.",
    swatch: "sw-skeuo",
    calibrated: false,
  },
];

export function findStyle(id: string): StylePreset | undefined {
  return STYLES.find((s) => s.id === id);
}
