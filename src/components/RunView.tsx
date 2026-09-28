import { open } from "@tauri-apps/plugin-dialog";
import { AlertTriangle, Ban, Columns2, Download, FolderOpen, Loader2, RotateCcw, ShieldAlert, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT, useUiLang } from "@/i18n";
import { api, asAppError, TERMINAL, type CellState, type Manifest } from "@/lib/backend";
import { fileSrc, formatCost, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ratioFor } from "@/presets/options";
import { findStyle } from "@/presets/styles";
import { rowKey } from "@/domain/plan";
import { findModel, labelFor } from "@/registry/models";
import { useApp } from "@/store/app";
import { Pill } from "./bits";

export function RunView() {
  const t = useT();
  const run = useApp((s) => s.run);
  if (!run) return <EmptyState title={t.emptyTitle} body={t.emptyBody} />;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RunHeader run={run} />
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <Matrix run={run} />
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="size-6" />
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function RunHeader({ run }: { run: Manifest }) {
  const t = useT();
  const lang = useUiLang();
  const { selection, clearSelection, setPanel } = useApp();
  const done = run.cells.filter((c) => c.status === "completed");
  const finished = run.cells.filter((c) => TERMINAL.includes(c.status)).length;
  const spent = done.reduce((s, c) => s + (c.cost ?? 0), 0);
  const pct = run.cells.length ? Math.round((finished / run.cells.length) * 100) : 0;

  async function exportCells(cellIds: string[]) {
    if (cellIds.length === 0) return;
    const dest = await open({ directory: true, multiple: false });
    if (typeof dest !== "string") return;
    try {
      const n = await api.exportImages(run.id, cellIds, dest);
      toast.success(t.exported(n));
    } catch (e) {
      toast.error(asAppError(e).message);
    }
  }

  return (
    <div className="flex h-11 shrink-0 items-center gap-3 border-b px-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{run.label}</div>
        <div className="text-[11px] text-muted-foreground">
          {finished}/{run.cells.length} · {formatCost(spent, run.unit, lang)} · {run.provider.toUpperCase()}
        </div>
      </div>
      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      {run.status === "paused" && (
        <span className="flex items-center gap-1 truncate text-xs text-rose-600" title={run.pausedReason ?? ""}>
          <AlertTriangle className="size-3.5 shrink-0" />
          {t.runPaused}: {run.pausedReason}
        </span>
      )}
      <div className="ml-auto flex items-center gap-1.5">
        <SizeControl />
        {selection.length > 0 && (
          <>
            <span className="text-xs text-muted-foreground">{selection.length} ✓</span>
            <Button size="xs" variant="ghost" onClick={clearSelection}>
              {t.clearSelection}
            </Button>
            <Button size="xs" variant="outline" disabled={selection.length < 2} onClick={() => setPanel("compare", true)} title={t.compareHint}>
              <Columns2 />
              {t.compare}
            </Button>
            <Button size="xs" variant="outline" onClick={() => exportCells(selection)}>
              <Download />
              {t.exportSel}
            </Button>
          </>
        )}
        <Button size="xs" variant="outline" disabled={Object.keys(run.best).length === 0} onClick={() => exportCells(Object.values(run.best))}>
          <Star />
          {t.exportBest}
        </Button>
        <Button size="xs" variant="outline" disabled={done.length === 0} onClick={() => exportCells(done.map((c) => c.cellId))}>
          <Download />
          {t.exportAll}
        </Button>
        <Button size="icon-xs" variant="ghost" title={t.reveal} onClick={() => api.revealPath(run.dir)}>
          <FolderOpen />
        </Button>
      </div>
    </div>
  );
}

function Matrix({ run }: { run: Manifest }) {
  const lang = useUiLang();
  const t = useT();
  const { rows, modelIds, byKey } = useMemo(() => {
    // Uma linha por estilo (ou estilo × variante, quando o run compara variantes do prompt).
    const rows: { key: string; styleId: string; variantKey?: string }[] = [];
    const modelIds: string[] = [];
    const byKey = new Map<string, CellState[]>();
    for (const c of run.cells) {
      const key = rowKey(c.styleId, c.variantKey);
      if (!rows.some((r) => r.key === key)) rows.push({ key, styleId: c.styleId, variantKey: c.variantKey });
      if (!modelIds.includes(c.modelId)) modelIds.push(c.modelId);
      const k = `${key}|${c.modelId}`;
      byKey.set(k, [...(byKey.get(k) ?? []), c].sort((a, b) => a.variation - b.variation));
    }
    return { rows, modelIds, byKey };
  }, [run.cells]);

  const tileSize = useApp((st) => st.tileSize);
  const ratio = ratioFor(run.config.device).replace(":", " / ");
  const vertical = run.config.device === "mobile";
  const variations = run.config.variations;
  const perRow = vertical ? variations : Math.min(variations, 2);
  const tileW = (vertical ? { s: 104, m: 150, l: 220 } : { s: 190, m: 270, l: 400 })[tileSize];
  const colW = tileW * perRow + 6 * (perRow - 1);

  return (
    <div
      className="grid w-max gap-2"
      style={{ gridTemplateColumns: `112px repeat(${modelIds.length}, ${colW}px)` }}
    >
      <div />
      {modelIds.map((m) => {
        const model = findModel(m);
        return (
          <div key={m} className="sticky top-0 z-10 rounded-md bg-background/90 px-1 pb-1 backdrop-blur">
            <div className="truncate text-xs font-semibold">{model ? labelFor(model, run.provider) : m}</div>
            <div className="truncate text-[10px] text-muted-foreground">{model?.vendor}</div>
          </div>
        );
      })}
      {rows.map(({ key, styleId: s, variantKey }) => {
        const style = findStyle(s);
        const variantText = variantKey ? variantLabel(run, variantKey, t.original) : null;
        return (
          <RowFragment key={key}>
            <div className="flex flex-col gap-1 pt-1">
              <div className={cn("sw", style?.swatch)} style={{ ["--sw-accent" as string]: run.config.accent }}>
                <div className="sw-side" />
                <div className="sw-main">
                  <div className="sw-kpis">
                    <div className="sw-card" />
                    <div className="sw-card" />
                  </div>
                  <div className="sw-chart" />
                </div>
              </div>
              <span className="text-xs leading-tight font-medium">{style?.label[lang] ?? s}</span>
              {variantKey && (
                <span className="flex items-start gap-1 text-[10px] leading-tight text-muted-foreground" title={variantText ?? ""}>
                  <span className="shrink-0 rounded bg-primary/10 px-1 font-semibold text-primary">{variantKey}</span>
                  <span className="line-clamp-3">{variantText}</span>
                </span>
              )}
            </div>
            {modelIds.map((m) => (
              <div
                key={m}
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}
              >
                {(byKey.get(`${key}|${m}`) ?? []).map((c) => (
                  <Tile key={c.cellId} run={run} cell={c} ratio={ratio} />
                ))}
              </div>
            ))}
          </RowFragment>
        );
      })}
    </div>
  );
}

function SizeControl() {
  const { tileSize, setTileSize } = useApp();
  return (
    <div className="mr-1 flex overflow-hidden rounded-md border" role="radiogroup" aria-label="Tamanho">
      {(["s", "m", "l"] as const).map((sz) => (
        <button
          key={sz}
          type="button"
          role="radio"
          aria-checked={tileSize === sz}
          onClick={() => setTileSize(sz)}
          className={cn("h-6 w-6 text-[10px] font-semibold uppercase", tileSize === sz ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
        >
          {sz === "s" ? "P" : sz === "m" ? "M" : "G"}
        </button>
      ))}
    </div>
  );
}

function RowFragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function useTicker(active: boolean) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
}

function Tile({ run, cell, ratio }: { run: Manifest; cell: CellState; ratio: string }) {
  const t = useT();
  const lang = useUiLang();
  const { selection, toggleSelect, setLightbox, setRun } = useApp();
  const busy = !TERMINAL.includes(cell.status);
  useTicker(busy && !!cell.submittedAt);
  const elapsed = cell.elapsedMs ?? (cell.submittedAt ? Date.now() - new Date(cell.submittedAt).getTime() : null);
  const row = rowKey(cell.styleId, cell.variantKey);
  const isBest = run.best[row] === cell.cellId;
  const selected = selection.includes(cell.cellId);
  const img = cell.image;

  async function toggleBest() {
    try {
      setRun(await api.setBest(run.id, row, isBest ? null : cell.cellId));
    } catch (e) {
      toast.error(asAppError(e).message);
    }
  }

  async function rerun() {
    try {
      const m = await api.rerunCells(run.id, [cell.cellId]);
      useApp.setState({ run: m });
    } catch (e) {
      toast.error(asAppError(e).message);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div
        className={cn(
          "group relative overflow-hidden rounded-lg border bg-muted/40",
          isBest && "ring-2 ring-amber-400",
          selected && "ring-2 ring-primary",
        )}
        style={{ aspectRatio: ratio }}
      >
        {cell.status === "completed" && img ? (
          <button type="button" className="block size-full" onClick={() => setLightbox(cell.cellId)}>
            <img src={fileSrc(img.thumbPath ?? img.path)} alt="" className="size-full object-cover" loading="lazy" draggable={false} />
          </button>
        ) : busy ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 overflow-hidden">
            <div className="absolute inset-0 animate-pulse bg-linear-to-br from-muted via-background to-muted" />
            <Loader2 className="relative size-5 animate-spin text-primary" />
            <span className="relative text-[11px] font-medium">{t.status[cell.status]}</span>
            {elapsed != null && <span className="relative font-mono text-[10px] text-muted-foreground">{formatDuration(elapsed)}</span>}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center">
            {cell.status === "nsfw" ? (
              <ShieldAlert className="size-5 text-amber-600" />
            ) : cell.status === "canceled" ? (
              <Ban className="size-5 text-muted-foreground" />
            ) : (
              <AlertTriangle className="size-5 text-rose-600" />
            )}
            <span className="text-[11px] font-medium">{t.status[cell.status]}</span>
            {cell.error && (
              <span className="line-clamp-3 text-[10px] text-muted-foreground" title={cell.error.message}>
                {t.errors[cell.error.kind] ?? ""}: {cell.error.message}
              </span>
            )}
            <Button size="xs" variant="outline" className="mt-1" onClick={rerun}>
              <RotateCcw />
              {t.rerun}
            </Button>
          </div>
        )}

        {cell.status === "completed" && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-1 opacity-0 transition-opacity group-hover:opacity-100 has-data-[on=true]:opacity-100">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => toggleSelect(cell.cellId)}
              data-on={selected}
              className="pointer-events-auto size-4 cursor-pointer accent-primary"
              title={t.compare}
            />
            <div className="pointer-events-auto flex gap-1">
              <button
                type="button"
                onClick={rerun}
                title={t.rerun}
                className="flex size-6 items-center justify-center rounded-md bg-black/45 text-white hover:bg-black/65"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={toggleBest}
                data-on={isBest}
                title={isBest ? t.unmarkBest : t.markBest}
                className="flex size-6 items-center justify-center rounded-md bg-black/45 text-white hover:bg-black/65"
              >
                <Star className={cn("size-3.5", isBest && "fill-amber-400 text-amber-400")} />
              </button>
            </div>
          </div>
        )}
        {isBest && (
          <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-amber-400 px-1 text-[10px] font-semibold text-black">
            <Star className="size-3 fill-black" />
            {t.best}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-1 px-0.5 text-[10px] text-muted-foreground">
        <span className="truncate">
          v{cell.variation}
          {cell.attempt > 1 && ` · ${t.attempt} ${cell.attempt}`}
        </span>
        <span className="flex items-center gap-1 tabular-nums">
          {cell.status === "completed" && <span>{formatDuration(cell.elapsedMs)}</span>}
          {cell.status === "completed" || busy ? (
            <Pill tone={cell.status === "completed" ? "good" : "info"}>{formatCost(cell.cost, run.unit, lang)}</Pill>
          ) : (
            <Pill tone="neutral" title={t.notCharged}>
              —
            </Pill>
          )}
        </span>
      </div>
    </div>
  );
}

/** Texto de uma variante do run: A = original; B, C, D = frases da configuração usada no run. */
export function variantLabel(run: Manifest, key: string, original: string): string {
  if (key === "A") return original;
  const text = run.config.promptVariants?.[key.charCodeAt(0) - 66]?.trim();
  return text ? `+ ${text}` : key;
}
