import type { ForgeConfig, HandoffStack, Lang, SegmentContent } from "@/domain/types";
import { resolveFontPairing } from "@/presets/fonts";
import { DEVICES, SCREENS, ratioFor } from "@/presets/options";
import { findSegment } from "@/presets/segments";
import { findStyle } from "@/presets/styles";
import { WORDS } from "./build";
import { normalizeHex } from "./colors";

/**
 * Texto de handoff: vai junto com a imagem escolhida para uma IA de código (Claude Code etc.)
 * montar o protótipo. A imagem mostra o layout; o texto passa a intenção por trás dela
 * (estilo, tokens, tipografia, estrutura, comportamento e entrega), tudo vindo da configuração
 * que gerou a imagem, sem chamar nenhum modelo.
 */

export interface HandoffSource {
  /** Configuração do run que gerou a imagem. */
  config: ForgeConfig;
  styleId: string;
  /** Frase da variante (B, C, D) que gerou a imagem, se houver. */
  variantText?: string;
  /** Prompt enviado ao modelo de imagem. */
  imagePrompt: string;
}

export interface HandoffOptions {
  /** Idioma do texto de handoff (os textos da tela seguem o idioma da imagem). */
  lang: Lang;
  stack: HandoffStack;
  includeImagePrompt: boolean;
  /** Nome do arquivo da imagem quando ela vai na mesma pasta (pacote); senão, "a imagem anexada". */
  imageFile?: string;
}

export const HANDOFF_FILE = "design-prompt.md";
export const handoffImageFile = (ext: string) => `design-reference.${ext || "png"}`;

const q = (s: string) => `"${s}"`;
const code = (s: string) => `\`${s}\``;
const bullets = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

interface Texts {
  title: (name: string, screen: string) => string;
  intro: (imageRef: string, goal: string) => string;
  imageAttached: string;
  imageInFolder: (file: string) => string;
  goal: Record<HandoffStack, string>;
  h: { context: string; image: string; style: (label: string) => string; tokens: string; structure: string; behavior: string; delivery: string; appendix: string };
  product: (business: string, brand: string) => string;
  smallBusiness: string;
  screen: (screen: string, device: string, ratio: string) => string;
  customScreenName: string;
  theme: (dark: boolean, forced: boolean) => string;
  language: Record<Lang, string>;
  extra: (text: string) => string;
  variant: (text: string) => string;
  imageRules: string[];
  presentation: { browser: string; device: string };
  tokensIntro: string;
  accent: (hex: string, mobile: boolean) => string;
  palette: (hexes: string) => string;
  neutrals: (dark: boolean) => string;
  status: string;
  spacing: string;
  typography: (heading: string, body: string, mono?: string) => string;
  numerals: string;
  structureNote: string;
  s: StructureTexts;
  hover: string;
  behavior: Record<ForgeConfig["screen"], string>;
  responsive: Record<ForgeConfig["device"], string>;
  a11y: string;
  delivery: Record<HandoffStack, string[]>;
  compare: string;
  appendixNote: string;
}

interface StructureTexts {
  asImage: string;
  sidebar: (nav: string) => string;
  topbar: string;
  statusBar: string;
  tabs: (tabs: string) => string;
  fab: string;
  kpisRow: (kpis: string) => string;
  kpisGrid: (kpis: string) => string;
  lineChart: (title: string) => string;
  donut: (title: string, items: string) => string;
  table: (title: string, cols: string, statuses: string) => string;
  greeting: (hello: string) => string;
  lineCard: (title: string) => string;
  shortList: (title: string, cols: string, statuses: string) => string;
  week: (title: string, items: string) => string;
  agendaSide: string;
  primary: (label: string) => string;
  weekStrip: (title: string) => string;
  timeline: (items: string) => string;
  toolbar: (title: string, search: string, label: string) => string;
  dataTable: (cols: string, statuses: string) => string;
  pagination: string;
  listHeader: (title: string, search: string) => string;
  cardList: (cols: string, statuses: string) => string;
  formWide: (title: string, fields: string) => string;
  formButtons: (primary: string, cancel: string) => string;
  formHeader: (title: string) => string;
  formMobile: (fields: string) => string;
  formPinned: (primary: string) => string;
  posRail: string;
  posTop: (title: string) => string;
  posGrid: (products: string) => string;
  posCart: (total: string, pay: string) => string;
  posTopMobile: (title: string) => string;
  posGridMobile: (products: string) => string;
  posCartMobile: (total: string, pay: string) => string;
  reportsTop: (title: string, period: string, exportLabel: string) => string;
  reportsCharts: (charts: string) => string;
  reportsTable: string;
  reportsTopMobile: (title: string, period: string) => string;
  reportsChartsMobile: (charts: string) => string;
  loginWide: (brand: string, w: Record<string, string>) => string;
  loginTopMobile: (brand: string) => string;
  loginFormMobile: (w: Record<string, string>) => string;
  brandName: (brand: string) => string;
  custom: (text: string) => string;
  customGeneric: string;
}

const PT: Texts = {
  title: (name, screen) => `# Handoff de design: ${name} · ${screen}`,
  intro: (imageRef, goal) =>
    `Estou te passando ${imageRef}: uma imagem gerada por IA (com o UI Forge) como referência de design para esta tela. Transforme essa imagem em ${goal}, o mais fiel possível ao design dela. Abaixo está a intenção por trás da imagem: use as duas coisas juntas.`,
  imageAttached: "a imagem anexada",
  imageInFolder: (file) => `a imagem ${code(file)} (nesta mesma pasta)`,
  goal: {
    html: "um protótipo funcional em HTML, CSS e JavaScript",
    react: "um protótipo funcional em React + Tailwind CSS",
    existing: "uma tela funcional dentro do projeto atual",
  },
  h: {
    context: "## 1. Contexto",
    image: "## 2. Como usar a imagem",
    style: (label) => `## 3. Estilo de design: ${label}`,
    tokens: "## 4. Tokens de design",
    structure: "## 5. Estrutura da tela",
    behavior: "## 6. Comportamento",
    delivery: "## 7. Entrega",
    appendix: "## Anexo: prompt que gerou a imagem",
  },
  product: (business, brand) => `Produto: sistema de gestão para ${business}${brand ? `, marca ${q(brand)}` : ""}.`,
  smallBusiness: "um pequeno negócio",
  screen: (screen, device, ratio) => `Tela: ${screen} · ${device} (${ratio}).`,
  customScreenName: "Tela personalizada",
  theme: (dark, forced) => `Tema: ${dark ? "escuro" : "claro"}${forced ? " (o próprio estilo pede tema escuro)" : ""}.`,
  language: {
    "pt-BR": "Idioma da interface: português do Brasil. Mantenha os textos da imagem; moedas, números e datas no formato brasileiro (R$ 1.234,56 · 28/09/2026).",
    en: "Idioma da interface: inglês. Mantenha os textos da imagem em inglês; moedas, números e datas no formato americano ($1,234.56 · 09/28/2026).",
  },
  extra: (text) => `Pedidos extras de design: ${text}.`,
  variant: (text) => `Ênfase desta versão: ${text}.`,
  imageRules: [
    "A imagem é a referência principal de layout, hierarquia, proporções, espaçamentos e cores. Reproduza a mesma composição: mesmas colunas, mesma ordem dos blocos, mesmos tamanhos relativos.",
    "Use os textos que aparecem na imagem. Se algum estiver ilegível ou deformado (comum em imagens geradas por IA), troque por um texto plausível no mesmo contexto. Nada de lorem ipsum.",
    "Corrija defeitos típicos de IA (texto torto, ícones sem sentido, gráficos incoerentes, desalinhamentos) mantendo a intenção do design.",
    "Ícones: use os equivalentes mais próximos do Lucide (ou de outra biblioteca de ícones de linha).",
    "Fotos, avatares e ilustrações: placeholders com as mesmas proporções e tons.",
  ],
  presentation: {
    browser: "A imagem mostra o app dentro de uma janela de navegador: implemente só a interface do app, sem a moldura do navegador.",
    device: "A imagem mostra a tela num aparelho, em perspectiva: implemente só a interface, vista de frente e sem o aparelho.",
  },
  tokensIntro: `Declare os tokens como variáveis CSS em ${code(":root")} e use só as variáveis no resto do código.`,
  accent: (hex, mobile) =>
    `Cor de destaque: ${code(hex)} → botão primário, ${mobile ? "aba ativa" : "item ativo do menu"} e destaques dos gráficos.`,
  palette: (hexes) => `Paleta da marca: ${hexes} → distribua pela interface junto com a cor de destaque.`,
  neutrals: (dark) => `Fundo, superfícies, texto, texto secundário e bordas: tire os tons exatos da imagem, coerentes com o tema ${dark ? "escuro" : "claro"}.`,
  status: "Cores de status (sucesso, alerta, erro, informação): as das pílulas e indicadores da imagem.",
  spacing: "Espaçamento em grade de 4 px (4, 8, 12, 16, 24, 32, 48); raios e sombras conforme o estilo acima.",
  typography: (heading, body, mono) =>
    heading === body
      ? `Tipografia (Google Fonts): **${heading}** em títulos e textos${mono ? `, **${mono}** em números e códigos` : ""}. Escala sugerida: 12 / 14 / 16 / 20 / 24 / 32 px.`
      : `Tipografia (Google Fonts): títulos em **${heading}**, textos em **${body}**${mono ? `, números e códigos em **${mono}**` : ""}. Escala sugerida: 12 / 14 / 16 / 20 / 24 / 32 px.`,
  numerals: `Números de KPIs e tabelas com ${code("font-variant-numeric: tabular-nums")}.`,
  structureNote: "Confira sempre com a imagem: se ela divergir desta lista, vale a imagem.",
  s: {
    asImage: "conforme a imagem",
    sidebar: (nav) => `Barra lateral esquerda com o logo e o menu: ${nav} (primeiro item ativo).`,
    topbar: "Barra superior com campo de busca, notificações e avatar do usuário.",
    statusBar: "Barra de status do celular no topo (só visual: hora, sinal e bateria).",
    tabs: (tabs) => `Barra de abas inferior: ${tabs} (primeira aba ativa).`,
    fab: `Botão flutuante redondo ${q("+")}.`,
    kpisRow: (kpis) => `Linha com 4 cartões de KPI: ${kpis}.`,
    kpisGrid: (kpis) => `Grade 2×2 de cartões de KPI: ${kpis}.`,
    lineChart: (title) => `Gráfico de linha ${title}.`,
    donut: (title, items) => `Gráfico de rosca ${title}: ${items}.`,
    table: (title, cols, statuses) => `Tabela ${title} com as colunas ${cols}; status em pílulas coloridas (${statuses}).`,
    greeting: (hello) => `Cabeçalho com o logo, a saudação ${hello} e o sino de notificações.`,
    lineCard: (title) => `Cartão com gráfico de linha compacto ${title}.`,
    shortList: (title, cols, statuses) => `Lista ${title} com três itens (${cols}) e pílula de status (${statuses}).`,
    week: (title, items) =>
      `Calendário semanal ${title}: colunas por dia, horários das 08:00 às 18:00 e blocos coloridos de compromissos, como ${items}.`,
    agendaSide: "Painel à direita com minicalendário do mês e a lista de compromissos de hoje.",
    primary: (label) => `Botão primário ${label}.`,
    weekStrip: (title) => `Cabeçalho ${title} com uma faixa horizontal de dias da semana (hoje destacado).`,
    timeline: (items) => `Linha do tempo vertical com os compromissos de hoje em cartões: ${items}.`,
    toolbar: (title, search, label) => `Página ${title} com barra de ferramentas: busca ${search}, filtros em chips e botão primário ${label}.`,
    dataTable: (cols, statuses) => `Tabela com as colunas ${cols}, cerca de 8 linhas de dados, pílulas de status (${statuses}) e ícones de ação por linha.`,
    pagination: "Paginação no rodapé da tabela.",
    listHeader: (title, search) => `Cabeçalho ${title} com busca ${search} e filtros em chips.`,
    cardList: (cols, statuses) => `Lista vertical de cartões mostrando ${cols} e uma pílula de status (${statuses}).`,
    formWide: (title, fields) =>
      `Formulário ${title} com os campos ${fields}, agrupados em seções numa grade de 2 colunas (com seletor de data e lista suspensa).`,
    formButtons: (primary, cancel) => `Botões no rodapé: ${primary} (primário) e ${cancel}.`,
    formHeader: (title) => `Cabeçalho com seta de voltar e o título ${title}.`,
    formMobile: (fields) => `Formulário em coluna única com os campos ${fields}.`,
    formPinned: (primary) => `Botão primário ${primary} fixo no rodapé, em largura total.`,
    posRail: "Trilho lateral estreito com o logo.",
    posTop: (title) => `Título ${title} e abas de categoria no topo.`,
    posGrid: (products) => `Grade de cartões de produto com foto, nome e preço: ${products}.`,
    posCart: (total, pay) => `Painel do carrinho à direita com itens, quantidades, o total ${total} e o botão grande ${pay}.`,
    posTopMobile: (title) => `Cabeçalho ${title} com categorias em chips.`,
    posGridMobile: (products) => `Grade de 2 colunas de produtos com foto, nome e preço: ${products}.`,
    posCartMobile: (total, pay) => `Resumo do carrinho no rodapé com o total ${total} e o botão ${pay}.`,
    reportsTop: (title, period, exportLabel) => `Página ${title} com seletor de período ${period} e botão ${exportLabel}.`,
    reportsCharts: (charts) => `Três gráficos: ${charts} (barras, pizza e linha).`,
    reportsTable: "Tabela de resumo abaixo dos gráficos.",
    reportsTopMobile: (title, period) => `Cabeçalho ${title} com seletor de período ${period}.`,
    reportsChartsMobile: (charts) => `Cartões de gráfico empilhados: ${charts}.`,
    loginWide: (brand, w) =>
      `Tela dividida ao meio: de um lado, uma ilustração grande da marca com o logo${brand}; do outro, o cartão de login com o título ${q(w.welcome)}, os campos ${q(w.email)} e ${q(w.password)}, a opção ${q(w.remember)}, o botão primário ${q(w.signIn)} e o link ${q(w.forgot)}.`,
    loginTopMobile: (brand) => `Logo${brand} no topo, sobre uma ilustração suave.`,
    loginFormMobile: (w) => `Campos ${q(w.email)} e ${q(w.password)}, botão primário ${q(w.signIn)} em largura total e o link ${q(w.forgot)}.`,
    brandName: (brand) => ` e o nome ${q(brand)}`,
    custom: (text) => `Área principal: ${q(text)}, com os blocos que essa tela pede (conforme a imagem).`,
    customGeneric: "Área principal: a tela principal do sistema, conforme a imagem.",
  },
  hover: "Estados de hover, foco e ativo coerentes com o estilo, com transições curtas (150–200 ms).",
  behavior: {
    dashboard: "Menu clicável (troca o item ativo); gráficos com tooltip; tabela ordenável por coluna.",
    agenda: "Clique num compromisso abre os detalhes (modal ou painel); navegação entre semanas e dias; o botão de novo compromisso abre um formulário.",
    table: "Busca filtrando as linhas em tempo real; chips de filtro funcionando; paginação; ações por linha (editar, excluir com confirmação).",
    form: "Validação dos campos obrigatórios com mensagem de erro; máscaras onde fizer sentido (data, telefone, moeda); aviso de sucesso ao salvar.",
    pos: "Clique no produto adiciona ao carrinho; botões +/− de quantidade; total recalculado na hora; abas de categoria filtrando os produtos.",
    reports: "Seletor de período atualizando gráficos e tabela; botão de exportar baixando um CSV com os dados.",
    login: "Validação de e-mail e senha; mostrar/ocultar senha; estado de carregamento no botão ao entrar.",
    custom: "As interações que a tela pede (filtros, abas, modais etc.), todas funcionando com dados fictícios.",
  },
  responsive: {
    desktop: "Responsivo: pensado para 1440 px de largura, funcionando de 1280 a 1920 px; abaixo de 1024 px a barra lateral vira um menu recolhível.",
    tablet: "Responsivo: pensado para tablet na horizontal (1180 × 820), funcionando de 1024 a 1366 px de largura.",
    mobile: "Responsivo: pensado para celular (390 × 844), funcionando de 360 a 430 px de largura, sem rolagem horizontal e com áreas de toque de pelo menos 44 px.",
  },
  a11y: `Acessibilidade: contraste AA, foco visível, ${code("label")} em todos os campos e HTML semântico (${code("nav")}, ${code("header")}, ${code("main")}, ${code("table")}).`,
  delivery: {
    html: [
      `Arquivos: ${code("index.html")}, ${code("styles.css")} e ${code("app.js")}, sem etapa de build (abre direto no navegador).`,
      "Fontes pelo Google Fonts; ícones do Lucide via CDN; gráficos com Chart.js via CDN.",
      `Dados fictícios num objeto separado no topo do ${code("app.js")}.`,
    ],
    react: [
      "Vite + React + TypeScript + Tailwind CSS.",
      "Um componente por bloco da tela (barra lateral, barra superior, cartão de KPI, gráfico, tabela etc.); tokens como variáveis CSS ligadas ao tema do Tailwind.",
      `Ícones com ${code("lucide-react")}, gráficos com Recharts e dados fictícios em ${code("src/data/mock.ts")}.`,
    ],
    existing: [
      "Integre esta tela ao projeto atual, usando a stack, os componentes e os tokens que ele já tem.",
      "Se faltar algo (ex.: biblioteca de gráficos ou de ícones), escolha a opção mais leve compatível com o projeto.",
    ],
  },
  compare: "Ao terminar, compare o resultado lado a lado com a imagem (se puder, tire um print da página) e ajuste espaçamentos, tamanhos, cores e alinhamentos até ficar fiel.",
  appendixNote: "Em inglês, como foi enviado ao modelo de imagem. É só apoio: se divergir da imagem, vale a imagem.",
};

const EN: Texts = {
  title: (name, screen) => `# Design handoff: ${name} · ${screen}`,
  intro: (imageRef, goal) =>
    `I'm giving you ${imageRef}: an AI-generated image (made with UI Forge) that serves as the design reference for this screen. Turn this image into ${goal}, as faithful to its design as possible. Below is the intent behind the image: use both together.`,
  imageAttached: "the attached image",
  imageInFolder: (file) => `the image ${code(file)} (in this same folder)`,
  goal: {
    html: "a working prototype in HTML, CSS and JavaScript",
    react: "a working prototype in React + Tailwind CSS",
    existing: "a working screen inside the current project",
  },
  h: {
    context: "## 1. Context",
    image: "## 2. How to use the image",
    style: (label) => `## 3. Design style: ${label}`,
    tokens: "## 4. Design tokens",
    structure: "## 5. Screen structure",
    behavior: "## 6. Behavior",
    delivery: "## 7. Delivery",
    appendix: "## Appendix: prompt that generated the image",
  },
  product: (business, brand) => `Product: management system for ${business}${brand ? `, brand ${q(brand)}` : ""}.`,
  smallBusiness: "a small business",
  screen: (screen, device, ratio) => `Screen: ${screen} · ${device} (${ratio}).`,
  customScreenName: "Custom screen",
  theme: (dark, forced) => `Theme: ${dark ? "dark" : "light"}${forced ? " (the style itself calls for a dark theme)" : ""}.`,
  language: {
    "pt-BR": "Interface language: Brazilian Portuguese. Keep the texts from the image; currency, numbers and dates in Brazilian format (R$ 1.234,56 · 28/09/2026).",
    en: "Interface language: English. Keep the texts from the image; currency, numbers and dates in US format ($1,234.56 · 09/28/2026).",
  },
  extra: (text) => `Extra design requests: ${text}.`,
  variant: (text) => `Emphasis for this version: ${text}.`,
  imageRules: [
    "The image is the main reference for layout, hierarchy, proportions, spacing and colors. Reproduce the same composition: same columns, same block order, same relative sizes.",
    "Use the texts shown in the image. If any text is illegible or garbled (common in AI-generated images), replace it with plausible text in the same context. No lorem ipsum.",
    "Fix typical AI artifacts (warped text, meaningless icons, incoherent charts, misalignments) while keeping the design intent.",
    "Icons: use the closest Lucide equivalents (or another line-icon library).",
    "Photos, avatars and illustrations: placeholders with the same proportions and tones.",
  ],
  presentation: {
    browser: "The image shows the app inside a browser window: implement only the app interface, without the browser chrome.",
    device: "The image shows the screen on a device, in perspective: implement only the interface, straight-on and without the device.",
  },
  tokensIntro: `Declare the tokens as CSS variables in ${code(":root")} and use only the variables in the rest of the code.`,
  accent: (hex, mobile) => `Accent color: ${code(hex)} → primary button, ${mobile ? "active tab" : "active menu item"} and chart highlights.`,
  palette: (hexes) => `Brand palette: ${hexes} → spread across the interface together with the accent color.`,
  neutrals: (dark) => `Background, surfaces, text, secondary text and borders: pick the exact tones from the image, consistent with the ${dark ? "dark" : "light"} theme.`,
  status: "Status colors (success, warning, error, info): the ones used in the image's pills and indicators.",
  spacing: "Spacing on a 4px grid (4, 8, 12, 16, 24, 32, 48); radii and shadows as described in the style above.",
  typography: (heading, body, mono) =>
    heading === body
      ? `Typography (Google Fonts): **${heading}** for headings and text${mono ? `, **${mono}** for numbers and codes` : ""}. Suggested scale: 12 / 14 / 16 / 20 / 24 / 32px.`
      : `Typography (Google Fonts): headings in **${heading}**, text in **${body}**${mono ? `, numbers and codes in **${mono}**` : ""}. Suggested scale: 12 / 14 / 16 / 20 / 24 / 32px.`,
  numerals: `KPI and table numbers with ${code("font-variant-numeric: tabular-nums")}.`,
  structureNote: "Always check against the image: if it differs from this list, the image wins.",
  s: {
    asImage: "as shown in the image",
    sidebar: (nav) => `Left sidebar with the logo and the menu: ${nav} (first item active).`,
    topbar: "Top bar with a search field, notifications and the user avatar.",
    statusBar: "Phone status bar at the top (visual only: time, signal and battery).",
    tabs: (tabs) => `Bottom tab bar: ${tabs} (first tab active).`,
    fab: `Round floating ${q("+")} button.`,
    kpisRow: (kpis) => `A row of 4 KPI cards: ${kpis}.`,
    kpisGrid: (kpis) => `A 2×2 grid of KPI cards: ${kpis}.`,
    lineChart: (title) => `Line chart ${title}.`,
    donut: (title, items) => `Donut chart ${title}: ${items}.`,
    table: (title, cols, statuses) => `Table ${title} with the columns ${cols}; statuses as colored pills (${statuses}).`,
    greeting: (hello) => `Header with the logo, the greeting ${hello} and a notification bell.`,
    lineCard: (title) => `Card with a compact line chart ${title}.`,
    shortList: (title, cols, statuses) => `List ${title} with three items (${cols}) and a status pill (${statuses}).`,
    week: (title, items) => `Weekly calendar ${title}: day columns, time slots from 08:00 to 18:00 and colored appointment blocks such as ${items}.`,
    agendaSide: "Right panel with a mini month calendar and today's appointments.",
    primary: (label) => `Primary button ${label}.`,
    weekStrip: (title) => `Header ${title} with a horizontal strip of weekdays (today highlighted).`,
    timeline: (items) => `Vertical timeline with today's appointments as cards: ${items}.`,
    toolbar: (title, search, label) => `Page ${title} with a toolbar: search ${search}, filter chips and a primary button ${label}.`,
    dataTable: (cols, statuses) => `Table with the columns ${cols}, about 8 rows of data, status pills (${statuses}) and row action icons.`,
    pagination: "Pagination below the table.",
    listHeader: (title, search) => `Header ${title} with search ${search} and filter chips.`,
    cardList: (cols, statuses) => `Vertical list of cards showing ${cols} and a status pill (${statuses}).`,
    formWide: (title, fields) => `Form ${title} with the fields ${fields}, grouped into sections in a two-column grid (with a date picker and a dropdown).`,
    formButtons: (primary, cancel) => `Buttons at the bottom: ${primary} (primary) and ${cancel}.`,
    formHeader: (title) => `Header with a back arrow and the title ${title}.`,
    formMobile: (fields) => `Single-column form with the fields ${fields}.`,
    formPinned: (primary) => `Full-width primary button ${primary} pinned at the bottom.`,
    posRail: "Slim left rail with the logo.",
    posTop: (title) => `Title ${title} and category tabs at the top.`,
    posGrid: (products) => `Grid of product cards with photo, name and price: ${products}.`,
    posCart: (total, pay) => `Cart panel on the right with items, quantities, the total ${total} and a large ${pay} button.`,
    posTopMobile: (title) => `Header ${title} with category chips.`,
    posGridMobile: (products) => `Two-column grid of products with photo, name and price: ${products}.`,
    posCartMobile: (total, pay) => `Cart summary at the bottom with the total ${total} and the ${pay} button.`,
    reportsTop: (title, period, exportLabel) => `Page ${title} with a date range selector ${period} and an ${exportLabel} button.`,
    reportsCharts: (charts) => `Three charts: ${charts} (bar, pie and line).`,
    reportsTable: "Summary table below the charts.",
    reportsTopMobile: (title, period) => `Header ${title} with a period selector ${period}.`,
    reportsChartsMobile: (charts) => `Stacked chart cards: ${charts}.`,
    loginWide: (brand, w) =>
      `Screen split in two halves: on one side a large brand illustration with the logo${brand}; on the other the sign-in card with the title ${q(w.welcome)}, the fields ${q(w.email)} and ${q(w.password)}, the ${q(w.remember)} option, the primary button ${q(w.signIn)} and the link ${q(w.forgot)}.`,
    loginTopMobile: (brand) => `Logo${brand} at the top, over a subtle illustration.`,
    loginFormMobile: (w) => `Fields ${q(w.email)} and ${q(w.password)}, a full-width primary button ${q(w.signIn)} and the link ${q(w.forgot)}.`,
    brandName: (brand) => ` and the name ${q(brand)}`,
    custom: (text) => `Main area: ${q(text)}, with the blocks this screen needs (as shown in the image).`,
    customGeneric: "Main area: the system's main screen, as shown in the image.",
  },
  hover: "Hover, focus and active states consistent with the style, with short transitions (150–200ms).",
  behavior: {
    dashboard: "Clickable menu (switches the active item); charts with tooltips; table sortable by column.",
    agenda: "Clicking an appointment opens its details (modal or panel); navigation between weeks and days; the new appointment button opens a form.",
    table: "Search filters the rows in real time; working filter chips; pagination; row actions (edit, delete with confirmation).",
    form: "Validation of required fields with error messages; input masks where they make sense (date, phone, currency); success feedback on save.",
    pos: "Clicking a product adds it to the cart; +/− quantity buttons; total recalculated instantly; category tabs filter the products.",
    reports: "The date range selector updates charts and table; the export button downloads a CSV with the data.",
    login: "Email and password validation; show/hide password; loading state on the sign-in button.",
    custom: "The interactions this screen needs (filters, tabs, modals, etc.), all working with mock data.",
  },
  responsive: {
    desktop: "Responsive: designed for a 1440px width, working from 1280 to 1920px; below 1024px the sidebar becomes a collapsible menu.",
    tablet: "Responsive: designed for a landscape tablet (1180 × 820), working from 1024 to 1366px wide.",
    mobile: "Responsive: designed for a phone (390 × 844), working from 360 to 430px wide, with no horizontal scroll and touch targets of at least 44px.",
  },
  a11y: `Accessibility: AA contrast, visible focus, a ${code("label")} on every field and semantic HTML (${code("nav")}, ${code("header")}, ${code("main")}, ${code("table")}).`,
  delivery: {
    html: [
      `Files: ${code("index.html")}, ${code("styles.css")} and ${code("app.js")}, with no build step (opens straight in the browser).`,
      "Fonts from Google Fonts; Lucide icons via CDN; charts with Chart.js via CDN.",
      `Mock data in a separate object at the top of ${code("app.js")}.`,
    ],
    react: [
      "Vite + React + TypeScript + Tailwind CSS.",
      "One component per screen block (sidebar, top bar, KPI card, chart, table, etc.); tokens as CSS variables wired into the Tailwind theme.",
      `Icons with ${code("lucide-react")}, charts with Recharts and mock data in ${code("src/data/mock.ts")}.`,
    ],
    existing: [
      "Integrate this screen into the current project, using the stack, components and tokens it already has.",
      "If something is missing (e.g. a chart or icon library), pick the lightest option compatible with the project.",
    ],
  },
  compare: "When done, compare the result side by side with the image (take a screenshot of the page if you can) and adjust spacing, sizes, colors and alignment until it matches.",
  appendixNote: "In English, as sent to the image model. It is only supporting material: if it differs from the image, the image wins.",
};

const TEXTS: Record<Lang, Texts> = { "pt-BR": PT, en: EN };

export function buildHandoff(src: HandoffSource, opts: HandoffOptions): string {
  const t = TEXTS[opts.lang];
  const cfg = src.config;
  const style = findStyle(src.styleId);
  const segment = cfg.segmentId === "custom" ? undefined : findSegment(cfg.segmentId);
  const brand = cfg.brand?.trim() || segment?.brand || "";
  const business = segment?.label[opts.lang] ?? (cfg.customSegment?.trim() || t.smallBusiness);
  const custom = cfg.screen === "custom";
  const screenName = custom ? t.customScreenName : (SCREENS.find((s) => s.id === cfg.screen)?.label[opts.lang] ?? cfg.screen);
  const device = DEVICES.find((d) => d.id === cfg.device)?.label[opts.lang] ?? cfg.device;
  const dark = (style?.forcesTheme ?? cfg.theme) === "dark";
  const mobile = cfg.device === "mobile";

  const context = [
    t.product(business, brand),
    t.screen(screenName, device, ratioFor(cfg.device)),
    t.theme(dark, !!style?.forcesTheme && cfg.theme !== "dark"),
    t.language[cfg.lang] ?? t.language["pt-BR"],
  ];
  const extra = cfg.extra?.trim().replace(/[.\s]+$/, "");
  if (extra) context.push(t.extra(extra));
  const variant = src.variantText?.trim().replace(/[.\s]+$/, "");
  if (variant) context.push(t.variant(variant));

  const imageRules = [...t.imageRules];
  if (cfg.presentation === "browser" || cfg.presentation === "device") imageRules.push(t.presentation[cfg.presentation]);

  const accent = normalizeHex(cfg.accent);
  const palette = (cfg.palette ?? []).map(normalizeHex).filter((c) => c !== accent);
  const fonts = style ? resolveFontPairing(cfg.fontPairing, style) : undefined;
  const tokens = [t.accent(accent, mobile)];
  if (palette.length) tokens.push(t.palette(palette.map(code).join(", ")));
  tokens.push(t.neutrals(dark), t.status, t.spacing);
  if (fonts) tokens.push(t.typography(fonts.heading, fonts.body, fonts.mono));
  tokens.push(t.numerals);

  const behavior = [t.hover, t.behavior[cfg.screen], t.responsive[cfg.device], t.a11y];
  const delivery = [...t.delivery[opts.stack], t.compare];

  const imageRef = opts.imageFile ? t.imageInFolder(opts.imageFile) : t.imageAttached;
  const sections = [
    t.title(brand || business, screenName),
    t.intro(imageRef, t.goal[opts.stack]),
    t.h.context,
    bullets(context),
    t.h.image,
    bullets(imageRules),
    t.h.style(style?.label[opts.lang] ?? src.styleId),
    ...(style ? [`${style.hint[opts.lang]}.`, bullets(style.spec[opts.lang])] : []),
    t.h.tokens,
    t.tokensIntro,
    bullets(tokens),
    t.h.structure,
    t.structureNote,
    bullets(structure(cfg, t.s, brand)),
    t.h.behavior,
    bullets(behavior),
    t.h.delivery,
    bullets(delivery),
  ];
  if (opts.includeImagePrompt && src.imagePrompt.trim()) {
    sections.push(t.h.appendix, t.appendixNote, "```text\n" + src.imagePrompt.trim() + "\n```");
  }
  return sections.join("\n\n") + "\n";
}

/** Blocos da tela, com os textos exatos que foram pedidos para a imagem (no idioma dela). */
function structure(cfg: ForgeConfig, s: StructureTexts, brand: string): string[] {
  const segment = cfg.segmentId === "custom" ? undefined : findSegment(cfg.segmentId);
  const c: SegmentContent | undefined = segment?.content[cfg.lang];
  const w = WORDS[cfg.lang] ?? WORDS["pt-BR"];
  const or = (value: string | undefined) => value ?? s.asImage;
  const title = (value: string | undefined) => (value ? q(value) : s.asImage);
  const plain = (items: string[] | undefined) => or(items?.join(", "));
  const quoted = (items: string[] | undefined) => or(items?.map(q).join(", "));
  const kpis = or(c?.kpis.map((k) => q(`${k.label} ${k.value}`)).join(", "));
  const brandName = brand ? s.brandName(brand) : "";
  const newLabel = q(`+ ${w.newItem}`);

  if (cfg.device === "mobile") {
    const tabs = s.tabs(plain(c?.mobileTabs));
    switch (cfg.screen) {
      case "dashboard":
        return [
          s.statusBar,
          s.greeting(c ? q(`${w.hello}, ${c.userName}`) : s.asImage),
          s.kpisGrid(kpis),
          s.lineCard(title(c?.lineChart)),
          s.shortList(title(c?.table.title), plain(c?.table.columns.slice(0, 3)), plain(c?.table.statuses)),
          s.fab,
          tabs,
        ];
      case "agenda":
        return [s.statusBar, s.weekStrip(title(c?.agenda.title)), s.timeline(quoted(c?.agenda.items)), s.fab, tabs];
      case "table":
        return [s.statusBar, s.listHeader(title(c?.table.title), q(w.search)), s.cardList(plain(c?.table.columns.slice(0, 3)), plain(c?.table.statuses)), s.fab, tabs];
      case "form":
        return [s.statusBar, s.formHeader(title(c?.form.title)), s.formMobile(plain(c?.form.fields)), s.formPinned(title(c?.form.primaryAction))];
      case "pos":
        return [s.statusBar, s.posTopMobile(title(c?.pos.title)), s.posGridMobile(plain(c?.pos.products)), s.posCartMobile(title(c?.pos.total), q(w.pay))];
      case "reports":
        return [s.statusBar, s.reportsTopMobile(title(c?.reports.title), q(w.period)), s.reportsChartsMobile(quoted(c?.reports.charts)), tabs];
      case "login":
        return [s.statusBar, s.loginTopMobile(brandName), s.loginFormMobile(w)];
      case "custom":
        return [s.statusBar, customLine(cfg, s), tabs];
    }
  }

  const sidebar = s.sidebar(plain(c?.nav));
  switch (cfg.screen) {
    case "dashboard":
      return [
        sidebar,
        s.topbar,
        s.kpisRow(kpis),
        s.lineChart(title(c?.lineChart)),
        s.donut(title(c?.donut.title), plain(c?.donut.items)),
        s.table(title(c?.table.title), plain(c?.table.columns), plain(c?.table.statuses)),
      ];
    case "agenda":
      return [sidebar, s.topbar, s.week(title(c?.agenda.title), quoted(c?.agenda.items)), s.agendaSide, s.primary(newLabel)];
    case "table":
      return [sidebar, s.topbar, s.toolbar(title(c?.table.title), q(w.search), newLabel), s.dataTable(plain(c?.table.columns), plain(c?.table.statuses)), s.pagination];
    case "form":
      return [sidebar, s.topbar, s.formWide(title(c?.form.title), plain(c?.form.fields)), s.formButtons(title(c?.form.primaryAction), q(w.cancel))];
    case "pos":
      return [s.posRail, s.posTop(title(c?.pos.title)), s.posGrid(plain(c?.pos.products)), s.posCart(title(c?.pos.total), q(w.pay))];
    case "reports":
      return [sidebar, s.topbar, s.reportsTop(title(c?.reports.title), q(w.period), q(w.exportLabel)), s.reportsCharts(quoted(c?.reports.charts)), s.reportsTable];
    case "login":
      return [s.loginWide(brandName, w)];
    case "custom":
      return [sidebar, s.topbar, customLine(cfg, s)];
  }
}

function customLine(cfg: ForgeConfig, s: StructureTexts): string {
  const text = cfg.customScreen?.trim().replace(/[.\s]+$/, "");
  return text ? s.custom(text) : s.customGeneric;
}
