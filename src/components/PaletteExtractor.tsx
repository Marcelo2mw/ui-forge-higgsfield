import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useT } from "@/i18n";
import { paletteFromFile, pickAccent } from "@/lib/palette";
import { cn } from "@/lib/utils";
import { colorName, normalizeHex } from "@/prompt/colors";
import { useConfig } from "@/store/config";

const MAX_PALETTE = 4;

/**
 * Extrai as cores de uma imagem (logo, foto da fachada, identidade visual) no próprio computador.
 * A cor mais viva vira a cor de destaque; as outras entram no prompt como paleta da marca.
 */
export function PaletteExtractor() {
  const t = useT();
  const { config, patch, setPalette } = useConfig();
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const accent = normalizeHex(config.accent);

  async function extract(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t.paletteNotImage);
      return;
    }
    setBusy(true);
    try {
      const { colors, thumb } = await paletteFromFile(file, 6);
      if (colors.length === 0) throw new Error(t.paletteEmpty);
      const next = pickAccent(colors) ?? colors[0].hex;
      patch({ accent: next });
      setPalette(
        colors.map((c) => c.hex).filter((h) => h !== next).slice(0, MAX_PALETTE),
        thumb,
      );
      toast.success(t.paletteDone(colors.length));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  /** Clicar numa cor da paleta troca de lugar com a cor de destaque. */
  function promote(hex: string) {
    const rest = config.palette.filter((c) => normalizeHex(c) !== normalizeHex(hex));
    patch({ accent: hex });
    setPalette([accent, ...rest].slice(0, MAX_PALETTE), config.paletteThumb);
  }

  function remove(hex: string) {
    const rest = config.palette.filter((c) => normalizeHex(c) !== normalizeHex(hex));
    setPalette(rest, rest.length ? config.paletteThumb : null);
  }

  const hasPalette = config.palette.length > 0;

  return (
    <div
      tabIndex={0}
      onPaste={(e) => {
        const file = [...e.clipboardData.files].find((f) => f.type.startsWith("image/"));
        if (file) {
          e.preventDefault();
          void extract(file);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void extract(e.dataTransfer.files[0]);
      }}
      className={cn(
        "rounded-lg border border-dashed p-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
        over ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => void extract(e.target.files?.[0])} />
      {hasPalette ? (
        <div className="flex items-center gap-1.5">
          {config.paletteThumb && (
            <img src={config.paletteThumb} alt="" className="size-7 shrink-0 rounded border object-cover" />
          )}
          <div className="flex flex-1 flex-wrap items-center gap-1">
            {config.palette.map((hex) => (
              <span key={hex} className="group relative">
                <button
                  type="button"
                  title={`${colorName(hex)} ${normalizeHex(hex)} · ${t.paletteMakeAccent}`}
                  onClick={() => promote(hex)}
                  className="block size-6 rounded-md border shadow-sm transition-transform hover:scale-110"
                  style={{ background: hex }}
                />
                <button
                  type="button"
                  title={t.paletteRemove}
                  onClick={() => remove(hex)}
                  className="absolute -top-1 -right-1 hidden size-3.5 items-center justify-center rounded-full bg-foreground text-background group-hover:flex"
                >
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {busy ? <Loader2 className="size-3 animate-spin" /> : t.paletteChange}
          </button>
          <button
            type="button"
            onClick={() => setPalette([], null)}
            className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {t.paletteClear}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-muted/60"
        >
          {busy ? <Loader2 className="size-4 animate-spin text-primary" /> : <ImagePlus className="size-4 text-muted-foreground" />}
          <span className="leading-tight">
            <span className="block text-xs font-medium">{t.paletteTitle}</span>
            <span className="block text-[10px] text-muted-foreground">{t.paletteHint}</span>
          </span>
        </button>
      )}
    </div>
  );
}
