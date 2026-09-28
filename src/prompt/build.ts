import type {
  DeviceId,
  Lang,
  PresentationId,
  ScreenId,
  SegmentContent,
  SegmentPreset,
  StylePreset,
  ThemeMode,
} from "@/domain/types";
import { ratioFor } from "@/presets/options";
import { colorName, normalizeHex } from "./colors";

/**
 * Monta o prompt de uma célula (um estilo). A estrutura segue o que foi validado no estudo
 * de calibração: assunto → apresentação → layout → estilo → tema → idioma/qualidade.
 * As instruções ficam em inglês; o texto que aparece na tela fica no idioma escolhido.
 */

export const PROMPT_TEMPLATE_VERSION = 1;

export interface PromptContext {
  /** Segmento pronto; `undefined` quando o usuário descreveu um negócio próprio. */
  segment?: SegmentPreset;
  /** Descrição livre do negócio (usada quando `segment` é undefined). */
  customBusiness?: string;
  screen: ScreenId;
  /** Descrição livre da tela (usada quando `screen` = "custom"). */
  customScreen?: string;
  device: DeviceId;
  presentation: PresentationId;
  theme: ThemeMode;
  accent: string;
  /** Cores extras da marca (além da cor de destaque). */
  palette?: string[];
  lang: Lang;
  brand: string;
  extra: string;
}

const WORDS: Record<Lang, Record<string, string>> = {
  "pt-BR": {
    search: "Buscar...",
    newItem: "Novo",
    cancel: "Cancelar",
    signIn: "Entrar",
    forgot: "Esqueci minha senha",
    remember: "Lembrar de mim",
    email: "E-mail",
    password: "Senha",
    pay: "Finalizar venda",
    exportLabel: "Exportar",
    hello: "Olá",
    period: "Últimos 30 dias",
    welcome: "Bem-vindo de volta",
    language: "Brazilian Portuguese",
  },
  en: {
    search: "Search...",
    newItem: "New",
    cancel: "Cancel",
    signIn: "Sign in",
    forgot: "Forgot password?",
    remember: "Remember me",
    email: "Email",
    password: "Password",
    pay: "Checkout",
    exportLabel: "Export",
    hello: "Hi",
    period: "Last 30 days",
    welcome: "Welcome back",
    language: "English",
  },
};

const SCREEN_NOUN: Record<ScreenId, string> = {
  dashboard: "dashboard",
  agenda: "schedule screen",
  table: "records list screen",
  form: "data entry form screen",
  pos: "point-of-sale screen",
  reports: "reports screen",
  login: "sign-in screen",
  custom: "screen",
};

const q = (s: string) => `"${s}"`;
const list = (items: string[]) => items.join(", ");
const quoted = (items: string[]) => items.map(q).join(", ");

export function buildPrompt(ctx: PromptContext, style: StylePreset): string {
  const theme: ThemeMode = style.forcesTheme ?? ctx.theme;
  const parts = [
    subject(ctx),
    presentation(ctx),
    layout(ctx),
    style.fragment,
    themeBlock(theme, ctx.accent, ctx.device, ctx.palette ?? []),
    `All interface text in ${WORDS[ctx.lang].language}, crisp and legible, realistic data. Polished modern product design, consistent spacing grid, clean sans-serif typography, pixel-perfect UI.`,
  ];
  const extra = ctx.extra.trim();
  if (extra) parts.push(`Additional details: ${extra.replace(/[.\s]+$/, "")}.`);
  return parts.join(" ");
}

function brandOf(ctx: PromptContext): string {
  return ctx.brand.trim() || ctx.segment?.brand || "";
}

function subject(ctx: PromptContext): string {
  const brand = brandOf(ctx);
  const called = brand ? ` called ${q(brand)}` : "";
  const business = ctx.segment
    ? `a ${ctx.segment.business} management system`
    : `a management system for this business: ${q(ctx.customBusiness?.trim() || "small business")}`;
  if (ctx.device === "mobile") {
    const noun = ctx.screen === "dashboard" ? "home screen (dashboard)" : SCREEN_NOUN[ctx.screen];
    return `High-fidelity UI design of a mobile app ${noun} for ${business}${called}.`;
  }
  const app = ctx.device === "tablet" ? "tablet app in landscape" : "desktop web app";
  return `High-fidelity UI design of a ${app} ${SCREEN_NOUN[ctx.screen]} for ${business}${called}.`;
}

function presentation(ctx: PromptContext): string {
  const ratio = ratioFor(ctx.device);
  if (ctx.presentation === "flat") {
    return ctx.device === "mobile"
      ? `Full-bleed straight-on screenshot of the app screen filling the whole ${ratio} frame edge to edge, no phone frame, no bezel, no device outline, no perspective.`
      : `Full-bleed straight-on screenshot of the app screen filling the whole ${ratio} frame, no device, no perspective.`;
  }
  if (ctx.presentation === "browser") {
    return ctx.device === "mobile"
      ? `The app is shown inside a minimal mobile browser with an address bar at the top, filling the ${ratio} frame, straight-on, no phone frame.`
      : `The app is shown inside a minimal modern browser window with an address bar, centered on a soft neutral background, straight-on, no perspective, ${ratio} frame.`;
  }
  const device =
    ctx.device === "mobile"
      ? "a modern smartphone standing upright on a clean surface"
      : ctx.device === "tablet"
        ? "a modern tablet in landscape lying on a clean desk"
        : "a modern laptop on a clean desk";
  return `The app screen is displayed on ${device}, slight three-quarter angle, soft studio lighting, the on-screen interface sharp and readable, ${ratio} frame.`;
}

function themeBlock(theme: ThemeMode, accent: string, device: DeviceId, palette: string[]): string {
  const hex = normalizeHex(accent);
  const target = device === "mobile" ? "the primary button, active tab and chart highlights" : "the primary button, active menu item and chart highlights";
  const base = theme === "dark" ? "dark theme with deep charcoal backgrounds" : "light theme";
  const text = `Theme: ${base} with ${colorName(hex)} (${hex}) as the accent color on ${target}.`;
  const extra = palette.map(normalizeHex).filter((c) => c !== hex);
  if (extra.length === 0) return text;
  const named = extra.map((c) => `${colorName(c)} (${c})`).join(", ");
  return `${text} Use this brand color palette throughout the interface, together with the accent: ${named}.`;
}

function layout(ctx: PromptContext): string {
  const c = ctx.segment?.content[ctx.lang];
  const w = WORDS[ctx.lang];
  const logo = ctx.segment?.logoHint ?? "simple";
  const mobile = ctx.device === "mobile";
  const body = mobile ? mobileLayout(ctx.screen, c, w, logo, brandOf(ctx), ctx) : wideLayout(ctx.screen, c, w, logo, brandOf(ctx), ctx);
  return `Layout: ${body}`;
}

function sidebar(c: SegmentContent | undefined, logo: string): string {
  return c
    ? `left sidebar with a small ${logo} logo and the menu items ${list(c.nav)}; top bar with a search field, notification bell and user avatar.`
    : `left sidebar with a small logo and 7 menu items that fit this business; top bar with a search field, notification bell and user avatar.`;
}

function kpiCards(c: SegmentContent | undefined, grid: string): string {
  return c
    ? `${grid} of KPI cards: ${c.kpis.map((k) => q(`${k.label} ${k.value}`)).join(", ")}`
    : `${grid} of KPI cards with realistic metrics for this business`;
}

function wideLayout(
  screen: ScreenId,
  c: SegmentContent | undefined,
  w: Record<string, string>,
  logo: string,
  brand: string,
  ctx: PromptContext,
): string {
  switch (screen) {
    case "dashboard":
      return c
        ? `${sidebar(c, logo)} ${kpiCards(c, "A row of four")}. Below: a line chart ${q(c.lineChart)}, a donut chart ${q(c.donut.title)} (${list(c.donut.items)}) and a table ${q(c.table.title)} with columns ${list(c.table.columns)} and colored status pills (${list(c.table.statuses)}).`
        : `${sidebar(c, logo)} ${kpiCards(c, "A row of four")}. Below: a line chart, a donut chart and a table with colored status pills, all with realistic data for this business.`;
    case "agenda":
      return c
        ? `${sidebar(c, logo)} Main area: a weekly calendar titled ${q(c.agenda.title)} with day columns and hourly time slots from 08:00 to 18:00, colored appointment blocks including ${quoted(c.agenda.items)}; a mini month calendar and a list of today's appointments in a right panel; a primary button ${q(`+ ${w.newItem}`)}.`
        : `${sidebar(c, logo)} Main area: a weekly calendar with day columns, hourly time slots from 08:00 to 18:00 and colored appointment blocks that fit this business; a mini month calendar and a list of today's appointments in a right panel.`;
    case "table":
      return c
        ? `${sidebar(c, logo)} Main area: a page titled ${q(c.table.title)} with a toolbar (search field ${q(w.search)}, filter chips and a primary button ${q(`+ ${w.newItem}`)}), a data table with columns ${list(c.table.columns)} and 8 rows of realistic data, colored status pills (${list(c.table.statuses)}), row action icons and pagination at the bottom.`
        : `${sidebar(c, logo)} Main area: a records page with a toolbar (search, filter chips and a primary "new" button), a data table with 8 rows of realistic data for this business, colored status pills, row action icons and pagination.`;
    case "form":
      return c
        ? `${sidebar(c, logo)} Main area: a form page titled ${q(c.form.title)} with labeled input fields ${list(c.form.fields)}, grouped into sections in a two-column grid, including a date picker and a dropdown, and at the bottom the buttons ${q(c.form.primaryAction)} (primary) and ${q(w.cancel)}.`
        : `${sidebar(c, logo)} Main area: a data entry form with labeled fields that fit this business, grouped into sections in a two-column grid, with a date picker, a dropdown and primary and cancel buttons at the bottom.`;
    case "pos":
      return c
        ? `a point-of-sale screen titled ${q(c.pos.title)}: a slim left rail with the ${logo} logo, category tabs at the top, a grid of product cards with photos, names and prices (${list(c.pos.products)}), and a cart panel on the right listing items with quantities and the total ${q(c.pos.total)}, with a large primary button ${q(w.pay)}.`
        : `a point-of-sale screen: a slim left rail with the logo, category tabs, a grid of product cards with photos, names and prices that fit this business, and a cart panel on the right with quantities, a total and a large primary checkout button.`;
    case "reports":
      return c
        ? `${sidebar(c, logo)} Main area: a reports page titled ${q(c.reports.title)} with a date range selector ${q(w.period)}, an ${q(w.exportLabel)} button, three charts titled ${quoted(c.reports.charts)} (a bar chart, a pie chart and a line chart) and a summary table below.`
        : `${sidebar(c, logo)} Main area: a reports page with a date range selector, an export button, a bar chart, a pie chart and a line chart with realistic data for this business, and a summary table.`;
    case "custom":
      return `${sidebar(c, logo)} Main area: ${customScreen(ctx)}`;
    case "login": {
      const name = brand ? ` and the brand name ${q(brand)}` : "";
      const business = ctx.segment?.business ?? "business";
      return `a sign-in screen split in two halves: on one side a large brand illustration related to the ${business} with the ${logo} logo${name}; on the other side a clean sign-in card with the title ${q(w.welcome)}, the fields ${q(w.email)} and ${q(w.password)}, a ${q(w.remember)} checkbox, a primary button ${q(w.signIn)} and a link ${q(w.forgot)}.`;
    }
  }
}

function mobileLayout(
  screen: ScreenId,
  c: SegmentContent | undefined,
  w: Record<string, string>,
  logo: string,
  brand: string,
  ctx: PromptContext,
): string {
  const tabs = c
    ? `a bottom tab bar with icons and labels ${list(c.mobileTabs)}`
    : `a bottom tab bar with 5 icons and labels that fit this business`;
  switch (screen) {
    case "dashboard":
      return c
        ? `status bar at the top; header with a small ${logo} logo, the greeting ${q(`${w.hello}, ${c.userName}`)} and a notification bell; ${kpiCards(c, "a 2x2 grid")}; a compact line chart card ${q(c.lineChart)}; a list ${q(c.table.title)} with three rows (${list(c.table.columns.slice(0, 3))} and a colored status pill: ${list(c.table.statuses)}); a floating round "+" button; ${tabs}.`
        : `status bar at the top; header with a small logo, a greeting and a notification bell; ${kpiCards(c, "a 2x2 grid")}; a compact line chart card; a short list with colored status pills; a floating round "+" button; ${tabs}.`;
    case "agenda":
      return c
        ? `status bar; header with the title ${q(c.agenda.title)} and a horizontal strip of weekdays with today highlighted; a vertical timeline of today's appointments as cards: ${quoted(c.agenda.items)}; a floating round "+" button; ${tabs}.`
        : `status bar; header with a title and a horizontal strip of weekdays with today highlighted; a vertical timeline of today's appointments as cards; a floating round "+" button; ${tabs}.`;
    case "table":
      return c
        ? `status bar; header ${q(c.table.title)} with a search field ${q(w.search)} and filter chips; a vertical list of 6 cards, each showing ${list(c.table.columns.slice(0, 3))} and a colored status pill (${list(c.table.statuses)}); a floating round "+" button; ${tabs}.`
        : `status bar; header with a search field and filter chips; a vertical list of 6 record cards with colored status pills; a floating round "+" button; ${tabs}.`;
    case "form":
      return c
        ? `status bar; header with a back arrow and the title ${q(c.form.title)}; a single-column form with labeled fields ${list(c.form.fields)}; a full-width primary button ${q(c.form.primaryAction)} pinned at the bottom.`
        : `status bar; header with a back arrow and a title; a single-column form with labeled fields that fit this business; a full-width primary button pinned at the bottom.`;
    case "pos":
      return c
        ? `status bar; header ${q(c.pos.title)} with category chips; a 2-column grid of product cards with photos, names and prices (${list(c.pos.products)}); a bottom cart summary with the total ${q(c.pos.total)} and a primary button ${q(w.pay)}.`
        : `status bar; header with category chips; a 2-column grid of product cards with photos, names and prices; a bottom cart summary with a total and a primary checkout button.`;
    case "reports":
      return c
        ? `status bar; header ${q(c.reports.title)} with a period selector ${q(w.period)}; stacked chart cards titled ${quoted(c.reports.charts)}; ${tabs}.`
        : `status bar; header with a period selector; stacked chart cards (bar, pie and line charts) with realistic data; ${tabs}.`;
    case "custom":
      return `status bar at the top; a header with the screen title; ${customScreen(ctx)}; ${tabs}.`;
    case "login": {
      const name = brand ? ` and the brand name ${q(brand)}` : "";
      return `status bar; the ${logo} logo${name} at the top over a subtle illustration; a sign-in form with the fields ${q(w.email)} and ${q(w.password)}, a full-width primary button ${q(w.signIn)} and a link ${q(w.forgot)}.`;
    }
  }
}

/** Tela descrita pelo usuário: o texto dele entra entre aspas, no idioma em que foi escrito. */
function customScreen(ctx: PromptContext): string {
  const text = ctx.customScreen?.trim().replace(/[.\s]+$/, "");
  const what = text ? `this screen, as described by the user: ${q(text)}` : "the main screen of this system";
  return `${what}. Build it as a complete, realistic screen with a clear page title and the widgets it needs (cards, tables, charts, forms or lists, whatever fits best), all with realistic data that fits this business.`;
}

/** Acrescenta a frase de uma variante (B, C, D) ao prompt de um estilo. A (original) não muda nada. */
export function withVariant(prompt: string, variantText: string): string {
  const text = variantText.trim().replace(/[.\s]+$/, "");
  return text ? `${prompt} Extra emphasis for this version: ${text}.` : prompt;
}
