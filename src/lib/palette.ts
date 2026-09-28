// Extração da paleta de cores de uma imagem, feita no próprio computador (sem API, sem custo).
// Algoritmo: median cut sobre os pixels opacos, depois junta cores muito parecidas.

export interface PaletteColor {
  hex: string;
  /** Fração dos pixels (0–1). */
  share: number;
}

type Rgb = [number, number, number];

interface Box {
  pixels: Rgb[];
}

function channelRange(pixels: Rgb[], ch: 0 | 1 | 2): number {
  let min = 255;
  let max = 0;
  for (const p of pixels) {
    if (p[ch] < min) min = p[ch];
    if (p[ch] > max) max = p[ch];
  }
  return max - min;
}

function widestChannel(pixels: Rgb[]): 0 | 1 | 2 {
  const ranges = [channelRange(pixels, 0), channelRange(pixels, 1), channelRange(pixels, 2)];
  return ranges.indexOf(Math.max(...ranges)) as 0 | 1 | 2;
}

function average(pixels: Rgb[]): Rgb {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const p of pixels) {
    r += p[0];
    g += p[1];
    b += p[2];
  }
  const n = pixels.length || 1;
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

function toHex([r, g, b]: Rgb): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function distance(a: Rgb, b: Rgb): number {
  // Distância ponderada, próxima da percepção humana.
  return Math.sqrt(2 * (a[0] - b[0]) ** 2 + 4 * (a[1] - b[1]) ** 2 + 3 * (a[2] - b[2]) ** 2);
}

/**
 * Paleta a partir de pixels RGBA (como os de `ImageData.data`).
 * Ignora pixels transparentes. Devolve as cores ordenadas pela quantidade de pixels.
 */
export function extractPalette(rgba: Uint8ClampedArray | number[], maxColors = 6): PaletteColor[] {
  const pixels: Rgb[] = [];
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 200) continue;
    pixels.push([rgba[i], rgba[i + 1], rgba[i + 2]]);
  }
  if (pixels.length === 0) return [];

  // Median cut: divide sempre a caixa com maior variação no canal mais largo. O corte é pelo
  // VALOR mediano (não pela posição): pixels iguais ficam sempre do mesmo lado, senão a média
  // de uma caixa vira uma cor misturada que não existe na imagem.
  const boxes: Box[] = [{ pixels }];
  const target = maxColors * 2;
  while (boxes.length < target) {
    let pick = -1;
    let best = 0;
    boxes.forEach((b, i) => {
      if (b.pixels.length < 2) return;
      const range = channelRange(b.pixels, widestChannel(b.pixels));
      const score = range * Math.sqrt(b.pixels.length);
      if (score > best) {
        best = score;
        pick = i;
      }
    });
    if (pick < 0 || best === 0) break;
    const box = boxes[pick];
    const ch = widestChannel(box.pixels);
    const sorted = [...box.pixels].sort((a, b) => a[ch] - b[ch]);
    const median = sorted[Math.floor(sorted.length / 2)][ch];
    let left = sorted.filter((p) => p[ch] < median);
    let right = sorted.filter((p) => p[ch] >= median);
    if (left.length === 0) {
      left = sorted.filter((p) => p[ch] <= median);
      right = sorted.filter((p) => p[ch] > median);
    }
    boxes.splice(pick, 1, { pixels: left }, { pixels: right });
  }

  // Junta caixas com cores quase iguais.
  const merged: { rgb: Rgb; count: number }[] = [];
  const candidates = boxes
    .map((b) => ({ rgb: average(b.pixels), count: b.pixels.length }))
    .sort((a, b) => b.count - a.count);
  for (const c of candidates) {
    const near = merged.find((m) => distance(m.rgb, c.rgb) < 60);
    if (near) {
      const total = near.count + c.count;
      near.rgb = near.rgb.map((v, i) => Math.round((v * near.count + c.rgb[i] * c.count) / total)) as Rgb;
      near.count = total;
    } else {
      merged.push({ ...c });
    }
  }

  return merged
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColors)
    .map((m) => ({ hex: toHex(m.rgb), share: m.count / pixels.length }));
}

/** Cor mais "viva" da paleta (boa candidata a cor de destaque). */
export function pickAccent(colors: PaletteColor[]): string | undefined {
  let best: string | undefined;
  let bestScore = -1;
  for (const c of colors) {
    const n = parseInt(c.hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
    // Saturada, nem muito clara nem muito escura, e presente de verdade na imagem.
    const score = s * (1 - Math.abs(l - 0.5) * 1.6) * Math.min(1, 0.4 + c.share * 3);
    if (score > bestScore) {
      bestScore = score;
      best = c.hex;
    }
  }
  return best;
}

/** Lê um arquivo de imagem, reduz e extrai a paleta. Devolve também uma miniatura pequena. */
export async function paletteFromFile(file: Blob, maxColors = 6): Promise<{ colors: PaletteColor[]; thumb: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("não consegui abrir a imagem"));
      el.src = url;
    });
    const scale = Math.min(1, 120 / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("canvas indisponível");
    ctx.drawImage(img, 0, 0, w, h);
    const colors = extractPalette(ctx.getImageData(0, 0, w, h).data, maxColors);

    // Miniatura de 48px para mostrar de onde a paleta veio.
    const t = Math.min(1, 48 / Math.max(w, h));
    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = Math.max(1, Math.round(w * t));
    thumbCanvas.height = Math.max(1, Math.round(h * t));
    thumbCanvas.getContext("2d")?.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    return { colors, thumb: thumbCanvas.toDataURL("image/png") };
  } finally {
    URL.revokeObjectURL(url);
  }
}
