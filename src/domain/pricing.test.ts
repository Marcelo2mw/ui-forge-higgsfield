import { describe, expect, it } from "vitest";
import { findModel, MODELS } from "@/registry/models";
import { priceCheckCells, priceParams } from "./pricing";

describe("priceParams", () => {
  const words = { quality: "qualidade", speed: "velocidade" };
  it("mostra a configuração que define o preço de cada nível", () => {
    const msi = findModel("marketing-studio-image")!;
    expect(priceParams(msi, "api", "draft", words)).toBe("1k · qualidade medium");
    // Final dos Marketing Studio: 2k com qualidade medium (high custaria ~3,5x mais).
    expect(priceParams(msi, "api", "final", words)).toBe("2k · qualidade medium");
    expect(priceParams(findModel("marketing-studio-image-flare")!, "api", "final", words)).toBe("2k · qualidade medium");
    expect(priceParams(findModel("ideogram-4")!, "api", "final", words)).toBe("velocidade quality");
    expect(priceParams(findModel("soul-standard")!, "api", "draft", words)).toBe("720p");
  });
});

describe("priceCheckCells", () => {
  it("consulta só os modelos de cada modo, com os parâmetros da qualidade escolhida", () => {
    const api = priceCheckCells("api", "draft");
    expect(api.map((c) => c.modelId)).toEqual(MODELS.filter((m) => m.api.endpoint).map((m) => m.id));
    expect(api.some((c) => c.modelId === "gpt-image-2.5")).toBe(false);
    const flare = api.find((c) => c.modelId === "marketing-studio-image-flare")!;
    expect(flare.target).toBe("marketing-studio/image/flare");
    expect(flare.params).toMatchObject({ aspect_ratio: "16:9", quality: "medium", resolution: "1k" });

    const cli = priceCheckCells("cli", "final");
    expect(cli.map((c) => c.modelId)).toEqual(MODELS.filter((m) => m.cli).map((m) => m.id));
    expect(cli.find((c) => c.modelId === "gpt-image-2.5")!.params).toMatchObject({ quality: "high", resolution: "2k" });
  });

  it("manda o prompt de verdade quando recebe um (o tamanho pesa nos modelos por tokens)", () => {
    expect(priceCheckCells("api", "draft", "prompt longo").every((c) => c.params.prompt === "prompt longo")).toBe(true);
  });

  it("usa o 16:9 quando o modelo aceita e o primeiro formato quando não", () => {
    for (const c of [...priceCheckCells("api", "draft"), ...priceCheckCells("cli", "draft")]) {
      expect(typeof c.params.aspect_ratio).toBe("string");
    }
  });
});
