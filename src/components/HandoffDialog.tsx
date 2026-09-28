import { open as pickFolder } from "@tauri-apps/plugin-dialog";
import { Copy, PackageOpen, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { HandoffStack, Lang } from "@/domain/types";
import { useT, useUiLang } from "@/i18n";
import { api, asAppError, type CellState, type Manifest } from "@/lib/backend";
import { fileSrc } from "@/lib/format";
import { buildHandoff, HANDOFF_FILE, handoffImageFile, type HandoffSource } from "@/prompt/handoff";
import { ChipGroup, Section } from "./bits";

interface Prefs {
  stack: HandoffStack;
  lang: Lang;
  includeImagePrompt: boolean;
}

const PREFS_KEY = "ui-forge.handoff";
const STACKS: HandoffStack[] = ["html", "react", "existing"];

// Preferência de conveniência: se o localStorage falhar, só volta ao padrão.
function loadPrefs(lang: Lang): Prefs {
  const fallback: Prefs = { stack: "html", lang, includeImagePrompt: true };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") };
  } catch {
    return fallback;
  }
}

function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignora */
  }
}

/** Texto para levar a imagem escolhida a uma IA de código (Claude Code etc.) e montar o protótipo. */
export function HandoffDialog({ run, cell, onClose }: { run: Manifest; cell: CellState; onClose: () => void }) {
  const t = useT();
  const uiLang = useUiLang();
  const [prefs, setPrefs] = useState(() => loadPrefs(uiLang));
  /** Edição manual, presa ao texto gerado de onde partiu: opções novas geram outro texto e ela deixa de valer. */
  const [edit, setEdit] = useState<{ base: string; text: string } | null>(null);
  const image = cell.image!;
  const ext = image.path.split(".").pop()?.toLowerCase() || "png";

  const source = useMemo<HandoffSource>(() => {
    // Variantes: A é o prompt original; B, C, D são as frases da configuração do run.
    const variantIndex = cell.variantKey && cell.variantKey !== "A" ? cell.variantKey.charCodeAt(0) - 66 : -1;
    return {
      config: run.config,
      styleId: cell.styleId,
      variantText: variantIndex >= 0 ? run.config.promptVariants?.[variantIndex] : undefined,
      imagePrompt: String(cell.params.prompt ?? ""),
    };
  }, [run.config, cell]);
  const generated = useMemo(() => buildHandoff(source, prefs), [source, prefs]);
  const edited = edit?.base === generated ? edit.text : null;
  const text = edited ?? generated;

  function update(p: Partial<Prefs>) {
    const next = { ...prefs, ...p };
    setPrefs(next);
    savePrefs(next);
  }

  async function copy() {
    await navigator.clipboard.writeText(text);
    toast.success(t.copied);
  }

  async function savePackage() {
    const dest = await pickFolder({ directory: true, multiple: false });
    if (typeof dest !== "string") return;
    const imageName = handoffImageFile(ext);
    // No pacote o texto cita a imagem pelo nome do arquivo; uma edição manual vai como está.
    const body = edited ?? buildHandoff(source, { ...prefs, imageFile: imageName });
    try {
      const path = await api.exportHandoff(run.id, cell.cellId, dest, imageName, HANDOFF_FILE, body);
      toast.success(t.handoffSaved, { action: { label: t.reveal, onClick: () => void api.revealPath(path) } });
    } catch (e) {
      toast.error(asAppError(e).message);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[88vh] max-w-5xl flex-col gap-3 sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t.handoffTitle}</DialogTitle>
          <DialogDescription className="text-xs">{t.handoffDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-4">
          <img
            src={fileSrc(image.thumbPath ?? image.path)}
            alt=""
            draggable={false}
            className="h-16 shrink-0 rounded-md border object-cover"
          />
          <div className="w-[380px] shrink-0">
            <Section title={t.handoffStack}>
              <ChipGroup value={prefs.stack} onChange={(stack) => update({ stack })} options={STACKS.map((id) => ({ id, label: t.stackNames[id] }))} />
            </Section>
          </div>
          <div className="w-32 shrink-0">
            <Section title={t.handoffLang}>
              <ChipGroup<Lang>
                value={prefs.lang}
                onChange={(lang) => update({ lang })}
                options={[
                  { id: "pt-BR", label: "PT-BR" },
                  { id: "en", label: "EN" },
                ]}
              />
            </Section>
          </div>
          <label className="flex h-7 cursor-pointer items-center gap-2 text-xs">
            <Switch checked={prefs.includeImagePrompt} onCheckedChange={(v) => update({ includeImagePrompt: v })} />
            {t.handoffIncludePrompt}
          </label>
        </div>

        <div className="min-h-0 flex-1">
          <Textarea
            className="h-full resize-none font-mono text-xs leading-relaxed"
            value={text}
            spellCheck={false}
            onChange={(e) => setEdit(e.target.value === generated ? null : { base: generated, text: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            {t.chars(text.length)}
            {edited !== null && ` · ${t.editedPrompt}`} · {t.handoffSaveHint}
          </p>
          <div className="flex shrink-0 gap-2">
            {edited !== null && (
              <Button size="sm" variant="ghost" onClick={() => setEdit(null)}>
                <RotateCcw />
                {t.handoffReset}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={savePackage}>
              <PackageOpen />
              {t.handoffSave}
            </Button>
            <Button size="sm" onClick={copy}>
              <Copy />
              {t.handoffCopy}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
