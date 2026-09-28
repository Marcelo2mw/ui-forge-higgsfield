import { Anvil, History, Loader2, PanelBottom, Play, Settings2, Square, TriangleAlert, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { buildPlan, staleOverrides } from "@/domain/plan";
import { useEstimate } from "@/hooks/useEstimate";
import { useT, useUiLang } from "@/i18n";
import { api, asAppError } from "@/lib/backend";
import { formatCost } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SCREENS } from "@/presets/options";
import { findSegment } from "@/presets/segments";
import { findStyle } from "@/presets/styles";
import { PROMPT_TEMPLATE_VERSION } from "@/prompt/build";
import { useApp } from "@/store/app";
import { useConfig } from "@/store/config";

const CONFIRM_ABOVE = 24;

export function Toolbar() {
  const t = useT();
  const lang = useUiLang();
  const config = useConfig((s) => s.config);
  const { settings, account, accountError, run, panels, setPanel, setRun, refreshRuns } = useApp();
  const provider = settings?.provider ?? "cli";
  const plan = useMemo(() => buildPlan(config, provider), [config, provider]);
  const estimate = useEstimate(plan.cells);
  /** Confirmação pendente: muitas imagens, ou prompts editados que ficaram desatualizados. */
  const [confirming, setConfirming] = useState<null | "big" | "stale">(null);
  const [starting, setStarting] = useState(false);
  const running = run?.status === "running";

  const costText =
    estimate.total != null ? `~${formatCost(estimate.total, estimate.unit, lang)}` : estimate.loading ? t.estimating : "—";

  async function start() {
    setConfirming(null);
    setStarting(true);
    try {
      const segment = config.segmentId === "custom" ? config.customSegment || t.customSegment : findSegment(config.segmentId)?.label[lang];
      const screen =
        config.screen === "custom"
          ? clip(config.customScreen.trim(), 40)
          : SCREENS.find((s) => s.id === config.screen)?.label[lang];
      const costs: Record<string, number> = {};
      for (const c of plan.cells) {
        const v = estimate.costOf(c);
        if (v !== undefined) costs[c.cellId] = v;
      }
      const manifest = await api.startRun({
        label: `${segment} · ${screen}`,
        config,
        prompts: plan.prompts,
        promptTemplateVersion: PROMPT_TEMPLATE_VERSION,
        cells: plan.cells,
        costs,
      });
      setRun(manifest);
      void refreshRuns();
    } catch (e) {
      toast.error(asAppError(e).message);
    } finally {
      setStarting(false);
    }
  }

  function onGenerate() {
    if (plan.cells.length === 0) {
      toast.error(t.emptyTitle);
      return;
    }
    if (config.screen === "custom" && !config.customScreen.trim()) {
      toast.error(t.customScreenMissing);
      return;
    }
    const invalid = Object.keys(estimate.invalid);
    if (invalid.length) {
      toast.error(`${t.errors.validation}: ${Object.values(estimate.invalid)[0]}`);
      return;
    }
    if (staleOverrides(config).length > 0) setConfirming("stale");
    else if (plan.cells.length > CONFIRM_ABOVE) setConfirming("big");
    else void start();
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-3">
      <div className="flex w-74 items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Anvil className="size-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">UI Forge</div>
          <div className="text-[10px] text-muted-foreground">{t.appTagline}</div>
        </div>
      </div>

      <div className="flex flex-1 items-center gap-2">
        <div className="flex h-7 items-center gap-2 rounded-full border bg-muted/40 px-3 text-xs">
          <span className="font-medium">{t.images(plan.cells.length)}</span>
          <span className="text-muted-foreground">·</span>
          <span className={cn("tabular-nums", estimate.loading && "text-muted-foreground")}>
            {estimate.loading && <Loader2 className="mr-1 inline size-3 animate-spin" />}
            {costText}
          </span>
        </div>
        {plan.skipped.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <TriangleAlert className="size-3.5" />
                {plan.skipped.length}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {plan.skipped
                .map((s) => {
                  const why = { ratio: t.skippedRatio, "not-on-api": t.skippedApi, "not-on-cli": t.skippedCli, "prompt-too-long": t.skippedPrompt }[s.reason];
                  return `${s.modelId}${s.styleId ? ` (${s.styleId})` : ""}: ${why}`;
                })
                .join(" · ")}
            </TooltipContent>
          </Tooltip>
        )}
        {Object.keys(estimate.invalid).length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-xs text-rose-600">
                <TriangleAlert className="size-3.5" />
                {t.errors.validation}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              {Object.entries(estimate.invalid).map(([m, msg]) => `${m}: ${msg}`).join(" · ")}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setPanel("settings", true)}
            className="flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs hover:bg-muted"
          >
            <Wallet className="size-3.5 text-muted-foreground" />
            <span className="font-medium uppercase">{provider}</span>
            <span className="tabular-nums text-muted-foreground">
              {account?.credits != null ? formatCost(account.credits, "credits", lang) : account?.usd != null ? formatCost(account.usd, "usd", lang) : "—"}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent>{accountError ?? `${t.balance}${account?.email ? ` · ${account.email}` : ""}`}</TooltipContent>
      </Tooltip>

      <Button variant={panels.log ? "secondary" : "ghost"} size="icon-sm" title={t.log} onClick={() => setPanel("log", !panels.log)}>
        <PanelBottom />
      </Button>
      <Button variant="ghost" size="icon-sm" title={t.history} onClick={() => setPanel("history", true)}>
        <History />
      </Button>
      <Button variant="ghost" size="icon-sm" title={t.settings} onClick={() => setPanel("settings", true)}>
        <Settings2 />
      </Button>

      {running && (
        <Button variant="outline" size="sm" onClick={() => run && api.stopRun(run.id).then(setRun).catch((e) => toast.error(asAppError(e).message))}>
          <Square />
          {t.stop}
        </Button>
      )}
      <Button size="sm" className="min-w-24" disabled={starting || plan.cells.length === 0} onClick={onGenerate}>
        {starting ? <Loader2 className="animate-spin" /> : <Play />}
        {starting ? t.generating : t.generate}
      </Button>

      <Dialog open={confirming !== null} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirming === "stale" ? t.staleConfirmTitle : t.confirmTitle}</DialogTitle>
            <DialogDescription>
              {confirming === "stale"
                ? t.staleConfirmBody(staleOverrides(config).map((id) => findStyle(id)?.label[lang] ?? id).join(", "))
                : t.confirmBody(plan.cells.length, costText)}
              {confirming === "stale" && plan.cells.length > CONFIRM_ABOVE && (
                <span className="mt-2 block">{t.confirmBody(plan.cells.length, costText)}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirming(null)}>
              {t.cancel}
            </Button>
            <Button onClick={() => void start()}>{t.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
