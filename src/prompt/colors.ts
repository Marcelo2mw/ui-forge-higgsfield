// Nome em inglês da cor: os modelos seguem melhor "raspberry pink (#E11D74)" do que só o hex.

const NAMED: [string, string][] = [
  ["raspberry pink", "#E11D74"],
  ["hot pink", "#EC4899"],
  ["rose red", "#E11D48"],
  ["crimson red", "#DC2626"],
  ["tomato orange", "#EA580C"],
  ["amber", "#F59E0B"],
  ["golden yellow", "#CA8A04"],
  ["lime green", "#65A30D"],
  ["emerald green", "#059669"],
  ["teal", "#0D9488"],
  ["cyan", "#0891B2"],
  ["sky blue", "#0EA5E9"],
  ["royal blue", "#2563EB"],
  ["indigo", "#4F46E5"],
  ["violet", "#7C3AED"],
  ["purple", "#9333EA"],
  ["magenta", "#C026D3"],
  ["chocolate brown", "#7C4A2D"],
  ["slate gray", "#475569"],
  ["graphite", "#111827"],
  ["navy blue", "#1E3A8A"],
  ["forest green", "#166534"],
  ["coral", "#F97361"],
  ["lavender", "#A78BFA"],
];

/** Acima desta distância, o nome da lista não descreve bem a cor: usa a descrição por matiz/luz. */
const NAMED_MAX_DISTANCE = 45;

function rgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function isHexColor(hex: string): boolean {
  return rgb(hex) !== null;
}

export function normalizeHex(hex: string): string {
  const c = rgb(hex);
  if (!c) return hex;
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function toHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return [h, s, l];
}

const HUES: [number, string][] = [
  [15, "red"],
  [40, "orange"],
  [65, "yellow"],
  [95, "lime green"],
  [160, "green"],
  [185, "teal"],
  [205, "cyan"],
  [245, "blue"],
  [265, "indigo"],
  [290, "violet"],
  [325, "magenta"],
  [350, "pink"],
  [361, "red"],
];

/** Descrição pela matiz, saturação e luminosidade (para tons claros, escuros e neutros). */
function describe(c: [number, number, number]): string {
  const [h, s, l] = toHsl(c);
  if (s < 0.12 || (l > 0.9 && s < 0.3)) {
    if (l > 0.94) return "white";
    if (l > 0.82) return "off-white";
    if (l > 0.6) return "light gray";
    if (l > 0.35) return "gray";
    if (l > 0.15) return "charcoal";
    return "near black";
  }
  if ((h < 60 || h > 330) && l > 0.7 && s < 0.7) return l > 0.82 ? "cream" : "beige";
  if (h >= 15 && h < 45 && l < 0.45 && s < 0.7) return l < 0.25 ? "dark brown" : "brown";
  const base = HUES.find(([deg]) => h < deg)?.[1] ?? "red";
  if (l > 0.84) return `pale ${base}`;
  if (l > 0.7) return `light ${base}`;
  if (l < 0.2) return `deep ${base}`;
  if (l < 0.35) return `dark ${base}`;
  if (s < 0.35) return `muted ${base}`;
  return base;
}

export function colorName(hex: string): string {
  const c = rgb(hex);
  if (!c) return "accent";
  let best = NAMED[0][0];
  let bestDist = Infinity;
  for (const [name, h] of NAMED) {
    const [r, g, b] = rgb(h)!;
    // Distância ponderada (aproximação da percepção humana).
    const d = Math.sqrt(2 * (c[0] - r) ** 2 + 4 * (c[1] - g) ** 2 + 3 * (c[2] - b) ** 2);
    if (d < bestDist) {
      bestDist = d;
      best = name;
    }
  }
  return bestDist <= NAMED_MAX_DISTANCE ? best : describe(c);
}
