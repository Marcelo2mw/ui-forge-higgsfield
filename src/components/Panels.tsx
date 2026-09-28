import { ChevronDown, ChevronRight, FolderOpen, KeyRound, Loader2, PlugZap, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ProviderId } from "@/domain/types";
import { useT, useUiLang } from "@/i18n";
import { api, asAppError, type CredentialStatus, type LogEntry } from "@/lib/backend";
import { fileSrc, formatCost, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { findStyle } from "@/presets/styles";
import { findModel } from "@/registry/models";
import { useApp } from "@/store/app";
import { ChipGroup, Pill, Section } from "./bits";

/** Imagens selecionadas lado a lado. */
export function CompareDialog() {
  const t = useT();
  const lang = useUiLang();
  const { run, selection, panels, setPanel } = useApp();
  const cells = (run?.cells ?? []).filter((c) => selection.includes(c.cellId) && c.image);
  const vertical = run?.config.device === "mobile";
  return (
    <Dialog open={panels.compare && cells.length > 1} onOpenChange={(o) => setPanel("compare", o)}>
      <DialogContent className="flex h-[92vh] max-w-[96vw] flex-col sm:max-w-[96vw]">
        <DialogHeader>
          <DialogTitle>{t.compare}</DialogTitle>
          <DialogDescription className="sr-only">{t.compareHint}</DialogDescription>
        </DialogHeader>
        <div
          className={cn("grid min-h-0 flex-1 gap-3", vertical ? "grid-flow-col" : cells.length > 2 ? "grid-cols-2" : "grid-cols-1 lg:grid-cols-2")}
        >
          {cells.map((c) => (
            <figure key={c.cellId} className="flex min-h-0 flex-col gap-1">
              <figcaption className="text-xs font-medium">
                {findStyle(c.styleId)?.label[lang]} · {findModel(c.modelId)?.label} · v{c.variation}
              </figcaption>
              <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-stage">
                <img src={fileSrc(c.image!.path)} alt="" className="size-full object-contain" />
              </div>
            </figure>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function HistorySheet() {
  const t = useT();
  const lang = useUiLang();
  const { runs, panels, setPanel, openRun, refreshRuns, run: current, setRun } = useApp();
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (panels.history) void refreshRuns();
  }, [panels.history, refreshRuns]);
  const list = runs.filter((r) => r.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <Sheet open={panels.history} onOpenChange={(o) => setPanel("history", o)}>
      <SheetContent className="w-105 sm:max-w-105">
        <SheetHeader>
          <SheetTitle>{t.history}</SheetTitle>
          <SheetDescription className="sr-only">{t.history}</SheetDescription>
        </SheetHeader>
        <div className="relative px-4">
          <Search className="absolute top-1/2 left-6 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-8 pl-7 text-xs" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          {list.length === 0 && <p className="text-sm text-muted-foreground">{t.historyEmpty}</p>}
          {list.map((r) => (
            <div
              key={r.id}
              className={cn("flex gap-3 rounded-lg border p-2 hover:bg-muted/50", current?.id === r.id && "border-primary")}
            >
              <button
                type="button"
                className="size-16 shrink-0 overflow-hidden rounded-md bg-muted"
                onClick={async () => {
                  await openRun(r.id);
                  setPanel("history", false);
                }}
              >
                {r.cover && <img src={fileSrc(r.cover)} alt="" className="size-full object-cover" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.label}</div>
                <div className="text-[11px] text-muted-foreground">{formatDate(r.createdAt, lang)}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <Pill>{r.provider.toUpperCase()}</Pill>
                  <Pill tone={r.status === "completed" ? "good" : r.status === "running" ? "info" : "warn"}>{r.status}</Pill>
                  <span className="text-[11px] text-muted-foreground">
                    {r.completed}/{r.total} · {formatCost(r.cost, r.unit, lang)}
                  </span>
                </div>
              </div>
              <Button
                size="icon-xs"
                variant="ghost"
                title={t.delete}
                disabled={r.status === "running"}
                onClick={async () => {
                  if (!window.confirm(t.deleteConfirm)) return;
                  try {
                    await api.deleteRun(r.id);
                    if (current?.id === r.id) setRun(null);
                    await refreshRuns();
                  } catch (e) {
                    toast.error(asAppError(e).message);
                  }
                }}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SettingsDialog() {
  const t = useT();
  const { settings, cli, account, accountError, panels, setPanel, saveSettings, refreshCli } = useApp();
  const [cliPath, setCliPath] = useState(settings?.cliPath ?? "");
  useEffect(() => setCliPath(settings?.cliPath ?? ""), [settings?.cliPath]);
  if (!settings) return null;

  const save = (patch: Parameters<typeof saveSettings>[0]) => saveSettings(patch).catch((e) => toast.error(asAppError(e).message));

  return (
    <Dialog open={panels.settings} onOpenChange={(o) => setPanel("settings", o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.settings}</DialogTitle>
          <DialogDescription className="sr-only">{t.settings}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Section title={t.provider}>
            <div className="space-y-1">
              {(["cli", "mock", "api"] as ProviderId[]).map((p) => (
                <label key={p} className="flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-sm has-checked:border-primary">
                  <input type="radio" name="provider" checked={settings.provider === p} onChange={() => save({ provider: p })} className="accent-primary" />
                  {p === "cli" ? t.providerCli : p === "mock" ? t.providerMock : t.providerApi}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {accountError ? (
                <span className="text-rose-600">{accountError}</span>
              ) : account ? (
                `${account.email ?? ""} ${account.plan ? `· ${account.plan}` : ""} ${account.credits != null ? `· ${account.credits} ${t.credits}` : ""}`
              ) : null}
            </p>
          </Section>

          <ApiKeySection />

          <Section title={t.cliPath}>
            <div className="flex gap-2">
              <Input className="h-8 font-mono text-xs" placeholder={t.cliAuto} value={cliPath} onChange={(e) => setCliPath(e.target.value)} />
              <Button size="sm" variant="outline" onClick={() => save({ cliPath: cliPath.trim() || null }).then(refreshCli)}>
                {t.detect}
              </Button>
            </div>
            <p className={cn("text-xs", cli?.found ? "text-emerald-600" : "text-rose-600")}>
              {cli?.found ? `${t.cliFound}: ${cli.path} ${cli.version ? `(${cli.version})` : ""}` : t.cliMissing}
            </p>
          </Section>

          <div className="grid grid-cols-2 gap-4">
            <Section title={t.concurrency}>
              <ChipGroup
                value={settings.concurrency}
                onChange={(concurrency) => save({ concurrency })}
                options={[2, 4, 6, 8].map((n) => ({ id: n, label: String(n) }))}
              />
            </Section>
            <Section title={t.uiLang}>
              <ChipGroup
                value={settings.uiLang}
                onChange={(uiLang) => save({ uiLang })}
                options={[
                  { id: "pt-BR", label: "Português" },
                  { id: "en", label: "English" },
                ]}
              />
            </Section>
          </div>

          <Section title={t.runsFolder}>
            <Button size="sm" variant="outline" onClick={async () => api.revealPath(await api.runsDir())}>
              <FolderOpen />
              {t.reveal}
            </Button>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Key ID + Secret da API: vão direto para o cofre do sistema e nunca voltam para a tela. */
function ApiKeySection() {
  const t = useT();
  const lang = useUiLang();
  const refreshAccount = useApp((s) => s.refreshAccount);
  const [status, setStatus] = useState<CredentialStatus | null>(null);
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api.credentialStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setResult(null);
    try {
      await action();
    } catch (e) {
      setResult({ ok: false, text: asAppError(e).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title={t.apiKey}>
      <p className="text-[11px] text-muted-foreground">{t.apiKeyHint}</p>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="password"
          autoComplete="off"
          className="h-8 font-mono text-xs"
          placeholder={t.keyId}
          value={keyId}
          onChange={(e) => setKeyId(e.target.value)}
        />
        <Input
          type="password"
          autoComplete="off"
          className="h-8 font-mono text-xs"
          placeholder={t.keySecret}
          value={keySecret}
          onChange={(e) => setKeySecret(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={busy || !keyId.trim() || !keySecret.trim()}
          onClick={() =>
            run(async () => {
              setStatus(await api.setApiCredentials(keyId, keySecret));
              setKeyId("");
              setKeySecret("");
              setResult({ ok: true, text: t.keySaved });
              await refreshAccount();
            })
          }
        >
          <KeyRound />
          {t.saveKey}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || !status?.configured}
          onClick={() =>
            run(async () => {
              const usd = await api.testApiCredentials();
              setResult({ ok: true, text: t.keyOk(formatCost(usd, "usd", lang)) });
            })
          }
        >
          {busy ? <Loader2 className="animate-spin" /> : <PlugZap />}
          {t.testKey}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy || status?.source !== "keychain"}
          onClick={() => run(async () => setStatus(await api.clearApiCredentials()))}
        >
          <Trash2 />
          {t.removeKey}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {status?.configured ? t.keyConfigured(status.keyIdMasked ?? "", status.source ?? "") : t.keyMissing}
      </p>
      {result && <p className={cn("text-xs", result.ok ? "text-emerald-600" : "text-rose-600")}>{result.text}</p>}
    </Section>
  );
}

const KIND_TONE = { request: "info", response: "good", status: "neutral", error: "bad", info: "warn" } as const;

/** Log do run atual: o que foi enviado e o que voltou (sem segredos). */
export function LogDrawer() {
  const t = useT();
  const logs = useApp((s) => s.logs);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="flex h-56 shrink-0 flex-col border-t bg-muted/20">
      <div className="flex h-8 items-center border-b px-3 text-xs font-medium">
        {t.log} <span className="ml-2 text-muted-foreground">{logs.length}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto font-mono text-[11px]">
        {logs.length === 0 && <p className="p-3 text-muted-foreground">{t.logEmpty}</p>}
        {[...logs].reverse().map((e: LogEntry, i) => (
          <div key={`${e.ts}-${i}`} className="border-b border-border/50">
            <button type="button" className="flex w-full items-center gap-2 px-3 py-1 text-left hover:bg-muted/60" onClick={() => setOpen(open === i ? null : i)}>
              {e.body != null ? open === i ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" /> : <span className="w-3" />}
              <span className="text-muted-foreground">{new Date(e.ts).toLocaleTimeString()}</span>
              <Pill tone={KIND_TONE[e.kind] ?? "neutral"}>{e.kind}</Pill>
              {e.cellId && <span className="text-muted-foreground">{e.cellId}</span>}
              <span className="truncate">{e.title}</span>
            </button>
            {open === i && e.body != null && (
              <pre className="mx-3 mb-2 max-h-60 overflow-auto rounded bg-background p-2 text-[10.5px] leading-relaxed">
                {JSON.stringify(e.body, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
