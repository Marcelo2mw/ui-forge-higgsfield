import { Cloud, Info, Loader2, SquareTerminal, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generatedPrompt } from "@/domain/plan";
import { PRICE_BATCH, priceCheckCells, priceParams, type PriceProvider } from "@/domain/pricing";
import type { ModelDef, QualityTier } from "@/domain/types";
import { useT, useUiLang } from "@/i18n";
import { api, asAppError, type ErrorKind } from "@/lib/backend";
import { formatCost } from "@/lib/format";
import { cn } from "@/lib/utils";
import { findStyle, STYLES } from "@/presets/styles";
import { MODELS } from "@/registry/models";
import { useApp } from "@/store/app";
import { useConfig } from "@/store/config";
import { ChipGroup, Pill } from "./bits";
import { FIT_TONE } from "./ModelPicker";

type Filter = "all" | "api" | "cli";
const PROVIDERS: PriceProvider[] = ["api", "cli"];
/** Uma consulta por modo × qualidade × tamanho do prompt (o que muda o preço nos modelos por tokens). */
const lookupKey = (p: PriceProvider, quality: QualityTier, prompt: string) => `${p}:${quality}:${prompt.length}`;

interface Lookup {
  status: "loading" | "ok" | "error";
  /** Preço por imagem, por modelo: US$ na API, créditos do plano no CLI. */
  perModel: Record<string, number>;
  /** Modelos cobrados pelo uso (tokens): a descrição oficial do preço. */
  byUsage: Record<string, string>;
  /** Erro de um modelo específico (ex.: parâmetro recusado). */
  modelErrors: Record<string, string>;
  errorKind?: ErrorKind;
  message?: string;
}

/** Tons fixos de cada modo, usados nos cartões e nas colunas da tabela. */
const TONE = {
  api: { card: "border-primary/25 bg-primary/5", icon: "bg-primary text-primary-foreground", head: "bg-primary/10 text-primary", cell: "bg-primary/[0.035]" },
  cli: {
    card: "border-emerald-600/25 bg-emerald-500/5",
    icon: "bg-emerald-600 text-white",
    head: "bg-emerald-500/12 text-emerald-800",
    cell: "bg-emerald-500/[0.04]",
  },
} as const;

/** Tabela de preço dos modelos: quanto custam 1.000 imagens na API (US$) e no CLI (créditos do plano). */
export function PricingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useT();
  const lang = useUiLang();
  const provider = useApp((s) => s.settings?.provider ?? "cli");
  const setPanel = useApp((s) => s.setPanel);
  const [quality, setQuality] = useState<QualityTier>(() => useConfig.getState().config.quality);
  const [filter, setFilter] = useState<Filter>("all");
  const [lookups, setLookups] = useState<Record<string, Lookup>>({});
  const lookupsRef = useRef(lookups);
  lookupsRef.current = lookups;
  const inflight = useRef(new Set<string>());
  // Prompt de tamanho real (o da configuração atual): nos modelos cobrados por tokens, ele pesa no preço.
  const prompt = useMemo(() => {
    const cfg = useConfig.getState().config;
    return generatedPrompt(cfg, findStyle(cfg.styleIds[0] ?? "") ?? STYLES[0]);
    // Recalcula a cada abertura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Consulta cada modo uma vez por qualidade. Erros são refeitos ao reabrir (a chave pode ter sido salva).
  useEffect(() => {
    if (!open) return;
    for (const p of PROVIDERS) {
      const key = lookupKey(p, quality, prompt);
      if (inflight.current.has(key) || lookupsRef.current[key]?.status === "ok") continue;
      inflight.current.add(key);
      const put = (l: Lookup) => setLookups((s) => ({ ...s, [key]: l }));
      put({ status: "loading", perModel: {}, byUsage: {}, modelErrors: {} });
      api
        .estimateRun(priceCheckCells(p, quality, prompt), p)
        .then((est) =>
          put({
            status: "ok",
            perModel: est.perCell,
            byUsage: est.byUsage ?? {},
            modelErrors: Object.fromEntries(est.errors.map((e) => [e.modelId, e.message])),
          }),
        )
        .catch((e) => {
          const err = asAppError(e);
          put({ status: "error", perModel: {}, byUsage: {}, modelErrors: {}, errorKind: err.kind, message: err.message });
        })
        .finally(() => inflight.current.delete(key));
    }
  }, [open, quality, prompt]);

  const apiLookup = lookups[lookupKey("api", quality, prompt)];
  const cliLookup = lookups[lookupKey("cli", quality, prompt)];
  const apiCount = MODELS.filter((m) => m.api.endpoint).length;
  const cliCount = MODELS.filter((m) => m.cli).length;
  const rows = MODELS.filter((m) => filter === "all" || (filter === "api" ? !!m.api.endpoint : !!m.cli));
  const usd = (v: number) => formatCost(v, "usd", lang);
  const credits = (v: number) => formatCost(v, "credits", lang);

  function apiCell(m: ModelDef): ReactNode {
    if (!m.api.endpoint) return <Unavailable>{t.apiBadge.no}</Unavailable>;
    if (!apiLookup || apiLookup.status === "loading") return <Loading />;
    const params = priceParams(m, "api", quality, t.paramWords);
    const live = apiLookup.perModel[m.id];
    if (live != null) return <Price main={usd(live * PRICE_BATCH)} sub={t.perImage(usd(live))} params={params} />;
    const from = m.api.priceFromUsd;
    const usage = apiLookup.byUsage[m.id];
    if (usage !== undefined) {
      return from != null ? (
        <Price prefix={t.priceFrom} main={usd(from * PRICE_BATCH)} sub={t.billedByUsage} params={params} title={usage} />
      ) : (
        <Unavailable title={usage}>{t.billedByUsage}</Unavailable>
      );
    }
    if (from != null) return <Price prefix={t.priceFrom} main={usd(from * PRICE_BATCH)} sub={t.perImage(usd(from))} title={apiLookup.modelErrors[m.id]} />;
    return <Unavailable title={apiLookup.modelErrors[m.id] ?? apiLookup.message}>—</Unavailable>;
  }

  function cliCell(m: ModelDef): ReactNode {
    if (!m.cli) return <Unavailable>{t.onlyApi}</Unavailable>;
    if (!cliLookup || cliLookup.status === "loading") return <Loading />;
    const params = priceParams(m, "cli", quality, t.paramWords);
    const live = cliLookup.perModel[m.id];
    if (live != null) return <Price main={credits(live * PRICE_BATCH)} sub={t.perImage(credits(live))} params={params} />;
    const study = m.refCredits[quality];
    if (study > 0) {
      return <Price main={credits(study * PRICE_BATCH)} sub={t.perImage(credits(study))} params={params} tag={t.fromStudy} title={cliLookup.modelErrors[m.id]} />;
    }
    return <Unavailable title={cliLookup.modelErrors[m.id] ?? cliLookup.message}>—</Unavailable>;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-4 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t.pricingTitle}</DialogTitle>
          <DialogDescription className="text-xs">{t.pricingDescription}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <ModeCard mode="api" icon={Cloud} title={t.pricingApiTitle} body={t.pricingApiBody} count={t.pricingModels(apiCount)} current={provider === "api" ? t.pricingCurrent : null} />
          <ModeCard mode="cli" icon={SquareTerminal} title={t.pricingCliTitle} body={t.pricingCliBody} count={t.pricingModels(cliCount)} current={provider === "cli" ? t.pricingCurrent : null} />
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="w-56">
            <Label>{t.quality}</Label>
            <ChipGroup<QualityTier>
              value={quality}
              onChange={setQuality}
              options={[
                { id: "draft", label: t.draft },
                { id: "final", label: t.final },
              ]}
            />
          </div>
          <div className="w-72">
            <Label>{t.pricingShow}</Label>
            <ChipGroup<Filter> value={filter} onChange={setFilter} options={(["all", "api", "cli"] as const).map((id) => ({ id, label: t.pricingFilter[id] }))} />
          </div>
        </div>

        <p className="-mt-2 text-[11px] text-muted-foreground">{t.pricingPresetNote}</p>

        {apiLookup?.status === "error" && (
          <Notice
            action={
              apiLookup.errorKind === "auth" ? (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    setPanel("settings", true);
                  }}
                >
                  {t.openSettings}
                </Button>
              ) : null
            }
          >
            {apiLookup.errorKind === "auth" ? t.pricingNeedKey : `${apiLookup.message} · ${t.pricingNeedKey}`}
          </Notice>
        )}
        {cliLookup?.status === "error" && <Notice>{t.pricingCliMissing}</Notice>}

        <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-background text-left text-[11px] font-semibold tracking-wide uppercase">
              <tr className="border-b">
                <th className="px-3 py-2 text-muted-foreground">{t.pricingColModel}</th>
                <th className="px-3 py-2 text-muted-foreground">{t.pricingColFit}</th>
                <th className={cn("w-48 px-3 py-2 text-right", TONE.api.head)}>
                  <span className="inline-flex items-center gap-1.5">
                    <Cloud className="size-3.5" />
                    {t.pricingColApi}
                  </span>
                </th>
                <th className={cn("w-48 px-3 py-2 text-right", TONE.cli.head)}>
                  <span className="inline-flex items-center gap-1.5">
                    <SquareTerminal className="size-3.5" />
                    {t.pricingColCli}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2">
                    <div className="font-medium">{m.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {m.vendor}
                      {m.api.label && m.api.label !== m.label && ` · ${t.pricingApiName(m.api.label)}`}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Pill tone={FIT_TONE[m.fit]}>{t.fit[m.fit]}</Pill>
                  </td>
                  <td className={cn("px-3 py-2", TONE.api.cell)}>{apiCell(m)}</td>
                  <td className={cn("px-3 py-2", TONE.cli.cell)}>{cliCell(m)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="space-y-0.5 text-[11px] text-muted-foreground">
          {t.pricingNotes.map((n) => (
            <li key={n}>· {n}</li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function ModeCard({ mode, icon: Icon, title, body, count, current }: { mode: PriceProvider; icon: LucideIcon; title: string; body: string; count: string; current: string | null }) {
  return (
    <div className={cn("flex gap-3 rounded-lg border p-3", TONE[mode].card)}>
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONE[mode].icon)}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs text-muted-foreground">· {count}</span>
          {current && <Pill tone="info">{current}</Pill>}
        </div>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function Price({ main, sub, prefix, params, tag, title }: { main: string; sub: string; prefix?: string; params?: string; tag?: string; title?: string }) {
  return (
    <div className="text-right leading-tight" title={title}>
      <div className="font-semibold tabular-nums">
        {prefix && <span className="mr-1 text-[10px] font-normal text-muted-foreground">{prefix}</span>}
        {main}
      </div>
      <div className="text-[10px] text-muted-foreground tabular-nums">
        {sub}
        {tag && <span className="ml-1 rounded bg-muted px-1">{tag}</span>}
      </div>
      {params && <div className="text-[10px] text-muted-foreground/70">{params}</div>}
    </div>
  );
}

function Unavailable({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="text-right text-xs text-muted-foreground/70" title={title}>
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-end">
      <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <div className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{children}</div>;
}

function Notice({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
      <Info className="size-4 shrink-0" />
      <span className="flex-1">{children}</span>
      {action}
    </div>
  );
}
