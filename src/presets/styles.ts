import type { StylePreset } from "@/domain/types";

/**
 * Estilos de design. Os cinco primeiros (calibrated: true) foram validados no estudo de
 * calibração com GPT Image 2.5, Nano Banana Pro, Grok 2.0 e Marketing Studio Image.
 * A tipografia não entra no `fragment`: vem da opção "Tipografia" (ou de `font`, no automático).
 * `spec` são as regras de CSS que o texto de handoff passa para a IA de código.
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
    font: "modern",
    spec: {
      "pt-BR": [
        "Painéis de vidro fosco: fundo branco translúcido (`rgba(255,255,255,.45–.65)` no tema claro, `.08–.16` no escuro) com `backdrop-filter: blur(24px) saturate(140%)`.",
        "Borda de 1 px branca semitransparente (`rgba(255,255,255,.3–.5)`) e sombra difusa bem suave.",
        "Atrás dos painéis, manchas de gradiente coloridas e desfocadas nos tons da cor de destaque (`radial-gradient` ou elementos com `filter: blur(80px)`), para o vidro ter o que desfocar.",
        "Cantos bem arredondados: 20–24 px nos cartões, 12 px em botões e campos.",
        "Garanta contraste do texto sobre o vidro (AA), escurecendo ou clareando o painel se precisar.",
      ],
      en: [
        "Frosted glass panels: translucent white background (`rgba(255,255,255,.45–.65)` in light theme, `.08–.16` in dark) with `backdrop-filter: blur(24px) saturate(140%)`.",
        "1px semi-transparent white border (`rgba(255,255,255,.3–.5)`) and a very soft diffused shadow.",
        "Behind the panels, colorful blurred gradient blobs in tints of the accent color (`radial-gradient` or elements with `filter: blur(80px)`), so the glass has something to blur.",
        "Generous rounded corners: 20–24px on cards, 12px on buttons and inputs.",
        "Keep text on glass at AA contrast, darkening or lightening the panel if needed.",
      ],
    },
  },
  {
    id: "neumorphism",
    label: { "pt-BR": "Neumorfismo", en: "Neumorphism" },
    hint: { "pt-BR": "Relevo suave da mesma cor do fundo", en: "Soft extruded surfaces, same color as the background" },
    fragment:
      "Design style: neumorphism, the whole interface shares one single soft base color for the background and every panel; cards, buttons, inputs and the sidebar are extruded from that same surface using paired soft shadows, a light highlight on the top-left and a darker soft shadow on the bottom-right; the active menu item and toggles look pressed in (inset); no borders, no gradients on panels, low contrast, rounded corners, the accent color used sparingly on icons, active states and chart lines.",
    swatch: "sw-neu",
    calibrated: true,
    font: "geometric",
    spec: {
      "pt-BR": [
        "Uma única cor base para o fundo e para todos os painéis (tire da imagem). Nada de bordas nem gradientes nos painéis.",
        "Relevo com sombras em par: clara em cima à esquerda e escura embaixo à direita, ex.: `box-shadow: -6px -6px 14px rgba(255,255,255,.8), 6px 6px 14px rgba(0,0,0,.12)` (ajuste à cor base).",
        "Item ativo do menu, toggles e campos aparecem afundados: as mesmas sombras com `inset`.",
        "Contraste baixo no geral; a cor de destaque só em ícones, estados ativos e linhas dos gráficos.",
        "Cantos arredondados de 12–20 px.",
        "Mesmo com o visual suave, texto e foco precisam de contraste suficiente (AA).",
      ],
      en: [
        "One single base color for the background and every panel (pick it from the image). No borders and no gradients on panels.",
        "Extrusion with paired shadows: light on the top-left, dark on the bottom-right, e.g. `box-shadow: -6px -6px 14px rgba(255,255,255,.8), 6px 6px 14px rgba(0,0,0,.12)` (tune to the base color).",
        "Active menu item, toggles and inputs look pressed in: the same shadows with `inset`.",
        "Low overall contrast; the accent color only on icons, active states and chart lines.",
        "Rounded corners of 12–20px.",
        "Even with the soft look, text and focus rings need enough contrast (AA).",
      ],
    },
  },
  {
    id: "claymorphism",
    label: { "pt-BR": "Claymorfismo", en: "Claymorphism" },
    hint: { "pt-BR": "Elementos 3D inflados de massinha", en: "Puffy inflated 3D clay elements" },
    fragment:
      "Design style: claymorphism, chunky puffy inflated 3D clay-like cards, buttons and pills with thick rounded corners, soft pastel colors, smooth matte clay texture, a bright inner highlight along the top edge and a soft inner shadow along the bottom edge, soft outer drop shadows that make every element float above a pastel background, playful 3D clay icons.",
    swatch: "sw-clay",
    calibrated: true,
    font: "rounded",
    spec: {
      "pt-BR": [
        "Elementos \"inflados\" de massinha: cantos grossos e bem arredondados (24–32 px), cores pastel foscas.",
        "Volume com três sombras: brilho interno no topo (`inset 0 4px 8px rgba(255,255,255,.6)`), sombra interna embaixo (`inset 0 -6px 10px rgba(0,0,0,.08)`) e sombra externa suave que faz o elemento flutuar.",
        "Fundo pastel; botões, pílulas e campos na mesma linguagem inflada.",
        "Ícones com cara de massinha 3D: ícones preenchidos em cores pastel dentro de selos arredondados.",
        "No clique, o elemento afunda um pouco (`transform: scale(.97)`).",
      ],
      en: [
        "Puffy clay elements: thick, very rounded corners (24–32px), matte pastel colors.",
        "Volume from three shadows: inner highlight on top (`inset 0 4px 8px rgba(255,255,255,.6)`), inner shadow at the bottom (`inset 0 -6px 10px rgba(0,0,0,.08)`) and a soft outer shadow that makes the element float.",
        "Pastel background; buttons, pills and inputs in the same inflated language.",
        "3D clay-looking icons: filled pastel icons inside rounded badges.",
        "On click, elements squish slightly (`transform: scale(.97)`).",
      ],
    },
  },
  {
    id: "softui",
    label: { "pt-BR": "Soft UI", en: "Soft UI" },
    hint: { "pt-BR": "Cartões brancos, sombras amplas e suaves", en: "White cards, wide soft shadows" },
    fragment:
      "Design style: soft UI, a clean airy modern dashboard with white cards floating on a very light warm off-white background, large corner radius, very soft wide diffuse shadows, small rounded icon badges filled with gentle gradients, pastel tints in the charts, generous whitespace, thin light dividers, calm low-contrast palette, elegant and minimal.",
    swatch: "sw-soft",
    calibrated: true,
    font: "modern",
    spec: {
      "pt-BR": [
        "Cartões brancos sobre fundo off-white levemente quente; cantos grandes (16–24 px).",
        "Sombras amplas e muito suaves (ex.: `0 10px 30px rgba(0,0,0,.05)`), sem bordas marcadas.",
        "Ícones dentro de pequenos selos arredondados com gradiente suave.",
        "Gráficos em tons pastel, divisores finos e claros, muito espaço em branco.",
        "Paleta calma e de baixo contraste, com a cor de destaque só nos pontos-chave.",
      ],
      en: [
        "White cards on a slightly warm off-white background; large corners (16–24px).",
        "Wide, very soft shadows (e.g. `0 10px 30px rgba(0,0,0,.05)`), no strong borders.",
        "Icons inside small rounded badges with a gentle gradient.",
        "Pastel charts, thin light dividers, lots of whitespace.",
        "Calm low-contrast palette, with the accent color only at key points.",
      ],
    },
  },
  {
    id: "flat",
    label: { "pt-BR": "Flat", en: "Flat" },
    hint: { "pt-BR": "Blocos de cor sólida, sem sombras", en: "Solid color blocks, no shadows" },
    fragment:
      "Design style: flat design, solid flat color blocks with no shadows, no gradients, no textures and no blur; the sidebar is a solid block of the accent color with white text and icons; simple geometric shapes, crisp flat line icons, color-coded KPI cards in solid colors, strong contrast, clean grid alignment, small corner radius.",
    swatch: "sw-flat",
    calibrated: true,
    font: "geometric",
    spec: {
      "pt-BR": [
        "Só blocos de cor sólida: sem sombras, sem gradientes, sem texturas e sem desfoque.",
        "Barra lateral sólida na cor de destaque, com texto e ícones brancos.",
        "Cartões de KPI em cores sólidas diferentes; ícones de linha simples.",
        "Cantos pouco arredondados (4–8 px), alinhamento rigoroso à grade, contraste alto.",
        "Hierarquia feita só com cor, tamanho e peso da fonte.",
      ],
      en: [
        "Solid color blocks only: no shadows, no gradients, no textures and no blur.",
        "Solid sidebar in the accent color, with white text and icons.",
        "KPI cards in distinct solid colors; simple line icons.",
        "Small corner radius (4–8px), strict grid alignment, strong contrast.",
        "Hierarchy built only with color, size and font weight.",
      ],
    },
  },
  {
    id: "material3",
    label: { "pt-BR": "Material 3", en: "Material 3" },
    hint: { "pt-BR": "Superfícies tonais, botões em pílula", en: "Tonal surfaces, pill buttons" },
    fragment:
      "Design style: Material Design 3, tonal surface colors derived from the accent color, large rounded cards, a navigation rail with a pill-shaped active indicator, filled and tonal buttons, a large floating action button, subtle elevation.",
    swatch: "sw-material",
    calibrated: false,
    font: "neutral",
    spec: {
      "pt-BR": [
        "Siga o Material Design 3: superfícies tonais derivadas da cor de destaque (surface, surface-container, primary-container).",
        "Navigation rail com indicador em pílula no item ativo; botões filled e tonal com cantos totalmente arredondados; FAB grande.",
        "Elevação sutil, feita mais pelo tom da superfície do que por sombra; cartões com 12–16 px de raio.",
        "Estados por camada de opacidade: hover 8%, pressionado 12%.",
      ],
      en: [
        "Follow Material Design 3: tonal surfaces derived from the accent color (surface, surface-container, primary-container).",
        "Navigation rail with a pill-shaped active indicator; filled and tonal buttons with fully rounded corners; a large FAB.",
        "Subtle elevation, expressed more by surface tone than by shadow; cards with a 12–16px radius.",
        "State layers by opacity: hover 8%, pressed 12%.",
      ],
    },
  },
  {
    id: "minimal",
    label: { "pt-BR": "Minimalista", en: "Minimalist" },
    hint: { "pt-BR": "Muito espaço em branco, linhas finas", en: "Lots of whitespace, hairlines" },
    fragment:
      "Design style: minimalist Swiss-inspired interface, lots of whitespace, a strict grid, thin 1px hairline dividers, a monochrome palette with a single accent color, no shadows, crisp typographic hierarchy with large numbers, understated line icons.",
    swatch: "sw-minimal",
    calibrated: false,
    font: "neutral",
    spec: {
      "pt-BR": [
        "Muito espaço em branco e grade rígida; divisores de 1 px bem finos.",
        "Paleta monocromática com uma única cor de destaque; nenhuma sombra.",
        "Hierarquia pela tipografia: números grandes, rótulos pequenos em cinza ou caixa alta.",
        "Ícones de linha discretos; cantos retos ou quase retos (0–6 px).",
      ],
      en: [
        "Lots of whitespace and a strict grid; very thin 1px dividers.",
        "Monochrome palette with a single accent color; no shadows at all.",
        "Hierarchy through typography: large numbers, small gray or uppercase labels.",
        "Understated line icons; square or nearly square corners (0–6px).",
      ],
    },
  },
  {
    id: "darkpremium",
    label: { "pt-BR": "Dark Premium", en: "Dark Premium" },
    hint: { "pt-BR": "Fundo quase preto, brilho sutil no destaque", en: "Near-black, subtle accent glow" },
    fragment:
      "Design style: premium dark mode SaaS, near-black charcoal background, panels separated by subtle 1px low-opacity borders, a soft glow on accent elements, fine gradients inside the charts, crisp high-contrast text, sleek and modern.",
    swatch: "sw-dark",
    forcesTheme: "dark",
    calibrated: false,
    font: "neutral",
    spec: {
      "pt-BR": [
        "Fundo quase preto em tom carvão (tire da imagem); painéis um pouco mais claros, separados por bordas de 1 px de baixa opacidade (`rgba(255,255,255,.06–.1)`).",
        "Brilho suave nos elementos de destaque (`box-shadow: 0 0 24px` na cor de destaque com baixa opacidade).",
        "Gradientes finos dentro dos gráficos (área com degradê da cor de destaque até transparente).",
        "Texto principal quase branco, secundários em cinzas frios; contraste alto e nítido.",
      ],
      en: [
        "Near-black charcoal background (pick it from the image); slightly lighter panels separated by low-opacity 1px borders (`rgba(255,255,255,.06–.1)`).",
        "Soft glow on accent elements (`box-shadow: 0 0 24px` in the accent color at low opacity).",
        "Fine gradients inside the charts (area fading from the accent color to transparent).",
        "Near-white primary text, cool grays for secondary text; crisp high contrast.",
      ],
    },
  },
  {
    id: "bento",
    label: { "pt-BR": "Bento Grid", en: "Bento Grid" },
    hint: { "pt-BR": "Blocos de tamanhos variados, como marmita japonesa", en: "Tiles of varied sizes, bento-box layout" },
    fragment:
      "Design style: bento grid, the content is composed of rounded rectangular tiles of different sizes arranged like a bento box, each tile focused on one piece of information with a large number or a small chart, subtle tinted tile backgrounds, playful but orderly composition.",
    swatch: "sw-bento",
    calibrated: false,
    font: "modern",
    spec: {
      "pt-BR": [
        "Conteúdo em blocos retangulares arredondados (16–24 px) de tamanhos diferentes, montados como uma marmita bento com CSS Grid (`grid-template-areas` ou spans).",
        "Cada bloco com uma informação só: um número grande ou um gráfico pequeno.",
        "Fundos de bloco levemente tingidos, variando entre eles; espaço uniforme entre os blocos (12–16 px).",
        "No responsivo, os blocos se reorganizam em menos colunas sem perder a ordem de leitura.",
      ],
      en: [
        "Content in rounded rectangular tiles (16–24px) of different sizes, arranged like a bento box with CSS Grid (`grid-template-areas` or spans).",
        "Each tile holds a single piece of information: a large number or a small chart.",
        "Slightly tinted tile backgrounds that vary between tiles; uniform gaps between tiles (12–16px).",
        "When responsive, tiles reflow into fewer columns while keeping the reading order.",
      ],
    },
  },
  {
    id: "neubrutalism",
    label: { "pt-BR": "Neubrutalismo", en: "Neubrutalism" },
    hint: { "pt-BR": "Contornos pretos grossos, sombra dura", en: "Thick black outlines, hard shadows" },
    fragment:
      "Design style: neo-brutalism, thick bold black outlines on every card, button and input, hard offset black drop shadows with no blur, saturated flat colors (yellow, pink, cyan, lime) mixed with the accent color, raw playful look.",
    swatch: "sw-brutal",
    calibrated: false,
    font: "heavy",
    spec: {
      "pt-BR": [
        "Contorno preto grosso (2–3 px) em cartões, botões e campos.",
        "Sombra dura deslocada, sem desfoque (`box-shadow: 4px 4px 0 #000`); no clique, o elemento desce (`translate(4px, 4px)`) e a sombra some.",
        "Cores chapadas e saturadas (amarelo, rosa, ciano, limão) misturadas com a cor de destaque.",
        "Títulos pesados e grandes; cantos pouco arredondados (0–8 px); visual cru e divertido.",
      ],
      en: [
        "Thick black outline (2–3px) on cards, buttons and inputs.",
        "Hard offset shadow with no blur (`box-shadow: 4px 4px 0 #000`); on click the element moves down (`translate(4px, 4px)`) and the shadow disappears.",
        "Flat saturated colors (yellow, pink, cyan, lime) mixed with the accent color.",
        "Big heavy headings; small corner radius (0–8px); raw, playful look.",
      ],
    },
  },
  {
    id: "aurora",
    label: { "pt-BR": "Aurora / Gradiente", en: "Aurora Gradient" },
    hint: { "pt-BR": "Degradê vibrante fluindo ao fundo", en: "Vibrant flowing mesh gradient" },
    fragment:
      "Design style: aurora gradient UI, a vibrant flowing mesh-gradient background inspired by the northern lights blending into the accent color, translucent cards floating above it, soft glows around highlights, luminous modern feel.",
    swatch: "sw-aurora",
    calibrated: false,
    font: "geometric",
    spec: {
      "pt-BR": [
        "Fundo com gradiente de malha vibrante (vários `radial-gradient` sobrepostos) inspirado na aurora boreal, puxando para a cor de destaque; pode ter uma animação bem lenta.",
        "Cartões translúcidos flutuando por cima (fundo semitransparente + `backdrop-filter: blur(16px)`).",
        "Brilhos suaves ao redor dos elementos de destaque; visual luminoso.",
        "Garanta contraste do texto sobre o gradiente (AA).",
      ],
      en: [
        "Vibrant mesh-gradient background (several stacked `radial-gradient`s) inspired by the northern lights, leaning into the accent color; it may animate very slowly.",
        "Translucent cards floating above it (semi-transparent background + `backdrop-filter: blur(16px)`).",
        "Soft glows around highlighted elements; a luminous feel.",
        "Keep text on the gradient at AA contrast.",
      ],
    },
  },
  {
    id: "skeuomorphism",
    label: { "pt-BR": "Skeuomorfismo", en: "Skeuomorphism" },
    hint: { "pt-BR": "Materiais realistas: couro, papel, metal", en: "Realistic materials: leather, paper, metal" },
    fragment:
      "Design style: modern skeuomorphism, realistic tactile materials such as a stitched leather sidebar, paper-textured cards, brushed-metal toggles and glossy buttons with realistic highlights, rich lighting and depth, physical-object metaphors.",
    swatch: "sw-skeuo",
    calibrated: false,
    font: "editorial",
    spec: {
      "pt-BR": [
        "Materiais realistas: barra lateral com textura de couro costurado, cartões com textura de papel, toggles de metal escovado e botões brilhantes.",
        "Profundidade com gradientes, sombras internas e externas e texturas (imagens ou padrões em CSS).",
        "Metáforas de objetos físicos: abas, etiquetas, costuras.",
        "Legibilidade em primeiro lugar: texto sempre sobre áreas lisas.",
      ],
      en: [
        "Realistic materials: stitched leather sidebar, paper-textured cards, brushed-metal toggles and glossy buttons.",
        "Depth from gradients, inner and outer shadows and textures (images or CSS patterns).",
        "Physical-object metaphors: tabs, labels, stitching.",
        "Legibility first: text always sits on smooth areas.",
      ],
    },
  },
];

export function findStyle(id: string): StylePreset | undefined {
  return STYLES.find((s) => s.id === id);
}
