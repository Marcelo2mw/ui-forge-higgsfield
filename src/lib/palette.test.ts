import { describe, expect, it } from "vitest";
import { colorName } from "@/prompt/colors";
import { extractPalette, pickAccent } from "./palette";

/** Pixels RGBA: `n` pixels de cada cor. */
function pixels(...groups: [number, [number, number, number, number?]][]): number[] {
  const out: number[] = [];
  for (const [n, [r, g, b, a = 255]] of groups) for (let i = 0; i < n; i++) out.push(r, g, b, a);
  return out;
}

describe("extractPalette", () => {
  it("ordena as cores pela quantidade e ignora pixels transparentes", () => {
    const data = pixels([700, [245, 240, 232]], [250, [225, 29, 116]], [50, [30, 30, 30]], [500, [0, 0, 255, 0]]);
    const colors = extractPalette(data, 6);
    expect(colors.map((c) => c.hex)).toEqual(["#F5F0E8", "#E11D74", "#1E1E1E"]);
    expect(colors[0].share).toBeCloseTo(0.7, 2);
  });

  it("junta tons quase iguais numa cor só", () => {
    const data = pixels([400, [225, 29, 116]], [400, [228, 32, 118]], [200, [255, 255, 255]]);
    expect(extractPalette(data, 6)).toHaveLength(2);
  });

  it("imagem toda transparente não tem paleta", () => {
    expect(extractPalette(pixels([100, [10, 10, 10, 0]]))).toEqual([]);
  });
});

describe("pickAccent", () => {
  it("escolhe a cor viva, não o fundo claro dominante", () => {
    const colors = [
      { hex: "#F5F0E8", share: 0.7 },
      { hex: "#E11D74", share: 0.25 },
      { hex: "#1E1E1E", share: 0.05 },
    ];
    expect(pickAccent(colors)).toBe("#E11D74");
  });
});

describe("colorName para tons neutros e claros", () => {
  it("descreve brancos, cremes e quase pretos", () => {
    expect(colorName("#FFFFFF")).toBe("white");
    expect(["off-white", "cream"]).toContain(colorName("#F5F0E8"));
    expect(colorName("#F3E3C8")).toBe("cream");
    expect(["near black", "graphite", "charcoal"]).toContain(colorName("#1E1E1E"));
    expect(colorName("#F9C5A0")).toMatch(/peach|light orange|beige|cream/);
  });
});
