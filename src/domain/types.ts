// Tipos do domínio: presets, modelos, configuração do usuário e runs.
// Os tipos que cruzam a fronteira com o Rust ficam em `src/lib/backend.ts`.

export type Lang = "pt-BR" | "en";
export type Localized = Record<Lang, string>;

export type ScreenId = "dashboard" | "agenda" | "table" | "form" | "pos" | "reports" | "login" | "custom";
export type DeviceId = "desktop" | "tablet" | "mobile";
export type PresentationId = "flat" | "browser" | "device";
export type ThemeMode = "light" | "dark";
export type QualityTier = "draft" | "final";
export type ProviderId = "cli" | "api" | "mock";

/** Conteúdo de um segmento num idioma. Tudo aqui aparece escrito na imagem. */
export interface SegmentContent {
  /** Itens do menu lateral (7 a 9). */
  nav: string[];
  /** Exatamente 4 KPIs com valores realistas no formato do idioma (R$ 18.450 / $18,450). */
  kpis: { label: string; value: string }[];
  /** Título do gráfico de linha. */
  lineChart: string;
  /** Gráfico de rosca: título + 4 categorias. */
  donut: { title: string; items: string[] };
  /** Tabela principal: título, 4 colunas e 3 status. */
  table: { title: string; columns: string[]; statuses: string[] };
  /** Agenda: título + 4 compromissos no formato "09:00 Serviço · Cliente". */
  agenda: { title: string; items: string[] };
  /** Formulário de cadastro: título, 6 a 8 campos e o texto do botão principal. */
  form: { title: string; fields: string[]; primaryAction: string };
  /** PDV/caixa: título, 6 produtos com preço e o total do carrinho. */
  pos: { title: string; products: string[]; total: string };
  /** Relatórios: título + 3 gráficos. */
  reports: { title: string; charts: string[] };
  /** Nome usado na saudação e no avatar ("Ana"). */
  userName: string;
  /** 5 abas da barra inferior no celular. */
  mobileTabs: string[];
}

export interface SegmentPreset {
  id: string;
  label: Localized;
  /** Descrição do negócio EM INGLÊS para as instruções do prompt ("bakery and confectionery"). */
  business: string;
  /** Objeto do logo EM INGLÊS ("cupcake"). */
  logoHint: string;
  /** Nome de marca sugerido (fica editável). */
  brand: string;
  /** Cor de destaque sugerida para o segmento. */
  accent: string;
  content: Record<Lang, SegmentContent>;
}

export interface StylePreset {
  id: string;
  label: Localized;
  /** Descrição curta para tooltip. */
  hint: Localized;
  /** Trecho do prompt (inglês) começando por "Design style: ...". */
  fragment: string;
  /** Classe CSS da miniatura ao vivo (swatches.css). */
  swatch: string;
  /** Alguns estilos só fazem sentido num tema. */
  forcesTheme?: ThemeMode;
  /** Validado no estudo de calibração (2026-09-28). */
  calibrated: boolean;
}

export type ModelFit = "recommended" | "good" | "weak" | "unstable" | "untested";
export type ApiAvailability = "yes" | "unknown" | "no";
export type Params = Record<string, unknown>;

export interface ModelDef {
  id: string;
  label: string;
  vendor: string;
  fit: ModelFit;
  defaultSelected: boolean;
  aspectRatios: string[];
  /** Custo de referência (rascunho/final): créditos do plano no CLI; a estimativa real vem do provider. */
  refCredits: Record<QualityTier, number>;
  note?: Localized;
  /** Limite de caracteres do prompt no provider (a célula é pulada se passar). */
  maxPromptChars?: number;
  /** `null` = modelo que só existe na API. */
  cli: { jobType: string; params: Record<QualityTier, Params> } | null;
  api: {
    availability: ApiAvailability;
    endpoint: string | null;
    /** Nome do modelo no catálogo da API, quando for diferente. */
    label?: string;
    aspectRatios?: string[];
    maxPromptChars?: number;
    params: Record<QualityTier, Params>;
  };
}

/** Configuração montada na barra lateral. */
export interface ForgeConfig {
  segmentId: string;
  customSegment: string;
  screen: ScreenId;
  /** Descrição livre da tela (quando `screen` = "custom"). */
  customScreen: string;
  styleIds: string[];
  theme: ThemeMode;
  accent: string;
  /** Cores extras da marca (tiradas de uma imagem), além da cor de destaque. */
  palette: string[];
  /** Miniatura da imagem de onde a paleta veio (data URL pequena). */
  paletteThumb: string | null;
  device: DeviceId;
  presentation: PresentationId;
  lang: Lang;
  brand: string;
  extra: string;
  /** Frases extras para comparar lado a lado (B, C, D). A = prompt original. */
  promptVariants: string[];
  modelIds: string[];
  variations: number;
  quality: QualityTier;
  /** Prompts editados à mão, por estilo (sobrescrevem o gerado). */
  promptOverrides: Record<string, PromptOverride>;
}

export interface PromptOverride {
  text: string;
  /** Prompt gerado no momento da edição: se o gerado mudar, a edição ficou desatualizada. */
  base: string;
}

/** Uma linha da grade quando há variantes: A (original), B, C, D. */
export interface PromptVariant {
  key: string;
  text: string;
}
