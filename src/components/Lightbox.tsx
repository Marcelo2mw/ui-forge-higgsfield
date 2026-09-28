import { ChevronLeft, ChevronRight, CodeXml, Copy, FolderOpen, RotateCcw, Star, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useT, useUiLang } from "@/i18n";
import { api, asAppError } from "@/lib/backend";
import { fileSrc, formatCost, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { findStyle } from "@/presets/styles";
import { findModel, labelFor } from "@/registry/models";
import { rowKey } from "@/domain/plan";
import { HandoffDialog } from "./HandoffDialog";
import { variantLabel } from "./RunView";
import { useApp } from "@/store/app";

/** Imagem grande com zoom, navegação ←/→ entre as prontas e as ações da célula. */
export function Lightbox() {
  const t = useT();
  const lang = useUiLang();
  const { run, lightbox, setLightbox, setRun } = useApp();
  const done = useMemo(() => (run?.cells ?? []).filter((c) => c.status === "completed" && c.image), [run]);
  const index = done.findIndex((c) => c.cellId === lightbox);
  const cell = index >= 0 ? done[index] : undefined;
  const [handoffOpen, setHandoffOpen] = useState(false);

  useEffect(() => {
    // Com o handoff aberto, as setas movem o cursor no texto, não trocam a imagem.
    if (!cell || handoffOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setLightbox(done[(index + 1) % done.length].cellId);
      if (e.key === "ArrowLeft") setLightbox(done[(index - 1 + done.length) % done.length].cellId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cell, done, index, setLightbox, handoffOpen]);

  if (!run || !cell || !cell.image) return null;
  const style = findStyle(cell.styleId);
  const model = findModel(cell.modelId);
  const row = rowKey(cell.styleId, cell.variantKey);
  const isBest = run.best[row] === cell.cellId;
  const prompt = String(cell.params.prompt ?? "");

  return (
    <Dialog open onOpenChange={(o) => !o && setLightbox(null)}>
      <DialogContent className="flex h-[92vh] max-w-[96vw] gap-0 overflow-hidden p-0 sm:max-w-[96vw]" showCloseButton>
        <DialogTitle className="sr-only">{`${style?.label[lang]} · ${model ? labelFor(model, run.provider) : ""}`}</DialogTitle>
        <div className="relative min-w-0 flex-1 bg-stage">
          <TransformWrapper key={cell.cellId} minScale={0.5} maxScale={6} centerOnInit>
            {({ zoomIn, zoomOut }) => (
              <>
                <TransformComponent wrapperClass="!size-full" contentClass="!size-full flex items-center justify-center">
                  <img src={fileSrc(cell.image!.path)} alt="" className="max-h-full max-w-full object-contain" draggable={false} />
                </TransformComponent>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-lg bg-black/60 p-1">
                  <Button size="icon-sm" variant="ghost" className="text-white hover:bg-white/15" onClick={() => zoomOut()}>
                    <ZoomOut />
                  </Button>
                  <Button size="icon-sm" variant="ghost" className="text-white hover:bg-white/15" onClick={() => zoomIn()}>
                    <ZoomIn />
                  </Button>
                </div>
              </>
            )}
          </TransformWrapper>
          {done.length > 1 && (
            <>
              <NavButton side="left" onClick={() => setLightbox(done[(index - 1 + done.length) % done.length].cellId)} />
              <NavButton side="right" onClick={() => setLightbox(done[(index + 1) % done.length].cellId)} />
            </>
          )}
        </div>

        <aside className="flex w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l p-4 text-sm">
          <div>
            <div className="text-base font-semibold">{style?.label[lang] ?? cell.styleId}</div>
            <div className="text-muted-foreground">
              {model ? labelFor(model, run.provider) : cell.modelId} · v{cell.variation}
            </div>
            {cell.variantKey && (
              <div className="mt-1 flex items-start gap-1 text-xs">
                <span className="shrink-0 rounded bg-primary/10 px-1 font-semibold text-primary">{cell.variantKey}</span>
                <span className="text-muted-foreground">{variantLabel(run, cell.variantKey, t.original)}</span>
              </div>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <dt className="text-muted-foreground">{t.time}</dt>
            <dd className="tabular-nums">{formatDuration(cell.elapsedMs)}</dd>
            <dt className="text-muted-foreground">{t.cost}</dt>
            <dd className="tabular-nums">{formatCost(cell.cost, run.unit, lang)}</dd>
            <dt className="text-muted-foreground">Size</dt>
            <dd className="tabular-nums">{cell.image.width && cell.image.height ? `${cell.image.width}×${cell.image.height}` : "—"}</dd>
            <dt className="text-muted-foreground">{t.attempt}</dt>
            <dd>{cell.attempt}</dd>
            <dt className="text-muted-foreground">Job</dt>
            <dd className="truncate font-mono text-[10px]" title={cell.remoteId ?? ""}>
              {cell.remoteId}
            </dd>
          </dl>
          <Button className="w-full" title={t.handoffHint} onClick={() => setHandoffOpen(true)}>
            <CodeXml />
            {t.handoff}
          </Button>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={isBest ? "default" : "outline"}
              onClick={async () => {
                try {
                  setRun(await api.setBest(run.id, row, isBest ? null : cell.cellId));
                  useApp.setState({ lightbox: cell.cellId });
                } catch (e) {
                  toast.error(asAppError(e).message);
                }
              }}
            >
              <Star className={cn(isBest && "fill-current")} />
              {isBest ? t.best : t.markBest}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  const m = await api.rerunCells(run.id, [cell.cellId]);
                  useApp.setState({ run: m, lightbox: null });
                } catch (e) {
                  toast.error(asAppError(e).message);
                }
              }}
            >
              <RotateCcw />
              {t.rerun}
            </Button>
            <Button size="sm" variant="outline" onClick={() => api.revealPath(cell.image!.path)}>
              <FolderOpen />
              {t.reveal}
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{t.prompt}</span>
              <Button
                size="xs"
                variant="ghost"
                onClick={async () => {
                  await navigator.clipboard.writeText(prompt);
                  toast.success(t.copied);
                }}
              >
                <Copy />
                {t.copyPrompt}
              </Button>
            </div>
            <p className="min-h-0 flex-1 overflow-y-auto rounded-md bg-muted p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
              {prompt}
            </p>
          </div>
        </aside>
        {handoffOpen && <HandoffDialog run={run} cell={cell} onClose={() => setHandoffOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="size-6" />
    </button>
  );
}
