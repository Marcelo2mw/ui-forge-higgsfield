import type { DeviceId, Localized, PresentationId, ScreenId } from "@/domain/types";

export const SCREENS: { id: ScreenId; label: Localized }[] = [
  { id: "dashboard", label: { "pt-BR": "Dashboard", en: "Dashboard" } },
  { id: "agenda", label: { "pt-BR": "Agenda", en: "Schedule" } },
  { id: "table", label: { "pt-BR": "Lista", en: "List" } },
  { id: "form", label: { "pt-BR": "Cadastro", en: "Form" } },
  { id: "pos", label: { "pt-BR": "Caixa", en: "Checkout" } },
  { id: "reports", label: { "pt-BR": "Relatórios", en: "Reports" } },
  { id: "login", label: { "pt-BR": "Login", en: "Login" } },
  { id: "custom", label: { "pt-BR": "Outra", en: "Other" } },
];

export const DEVICES: { id: DeviceId; label: Localized; ratio: string }[] = [
  { id: "desktop", label: { "pt-BR": "Desktop", en: "Desktop" }, ratio: "16:9" },
  { id: "tablet", label: { "pt-BR": "Tablet", en: "Tablet" }, ratio: "4:3" },
  { id: "mobile", label: { "pt-BR": "Celular", en: "Mobile" }, ratio: "9:16" },
];

export const PRESENTATIONS: { id: PresentationId; label: Localized; hint: Localized }[] = [
  { id: "flat", label: { "pt-BR": "Tela", en: "Screen" }, hint: { "pt-BR": "Só a tela, chapada", en: "Just the screen, flat" } },
  { id: "browser", label: { "pt-BR": "Navegador", en: "Browser" }, hint: { "pt-BR": "Dentro de uma janela de navegador", en: "Inside a browser window" } },
  { id: "device", label: { "pt-BR": "Mockup", en: "Mockup" }, hint: { "pt-BR": "Num notebook, tablet ou celular", en: "On a laptop, tablet or phone" } },
];

/** Paleta rápida de cores de destaque (o usuário também pode digitar um hex). */
export const ACCENT_SWATCHES = [
  "#E11D74", "#7C3AED", "#2563EB", "#0891B2", "#059669", "#65A30D",
  "#CA8A04", "#EA580C", "#DC2626", "#DB2777", "#475569", "#111827",
];

export function ratioFor(device: DeviceId): string {
  return DEVICES.find((d) => d.id === device)?.ratio ?? "16:9";
}
