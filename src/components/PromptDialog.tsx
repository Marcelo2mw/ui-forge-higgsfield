import { Copy, RotateCcw, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { activeVariants, finalPrompt, generatedPrompt, staleOverrides } from "@/domain/plan";
import { useT, useUiLang } from "@/i18n";
import { cn } from "@/lib/utils";
import { findStyle } from "@/presets/styles";
import { useConfig } from "@/store/config";

/** Mostra o prompt de cada estilo selecionado; dá para editar à mão. */
export function PromptDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useT();
  const lang = useUiLang();
  const { config, setPromptOverride, acceptOverride } = useConfig();
  const styles = config.styleIds.map(findStyle).filter((s) => !!s);
  const [active, setActive] = useState<string | null>(null);
  const current = styles.find((s) => s.id === active) ?? styles[0];
  const stale = staleOverrides(config);
  const variants = activeVariants(config).filter((v) => v.text);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t.prompt}</DialogTitle>
          <DialogDescription className="text-xs">{t.promptDialogHint}</DialogDescription>
        </DialogHeader>
        {current ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {styles.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  className={cn(
                    "flex h-6 items-center gap-1 rounded-md border px-2 text-xs",
                    s.id === current.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  {s.label[lang]}
                  {stale.includes(s.id) ? (
                    <TriangleAlert className="size-3 text-amber-500" />
                  ) : (
                    config.promptOverrides[s.id] && <span>•</span>
                  )}
                </button>
              ))}
            </div>

            {stale.includes(current.id) && (
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <p>{t.staleBody}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="xs" variant="outline" onClick={() => acceptOverride(current.id, generatedPrompt(config, current))}>
                      {t.staleKeep}
                    </Button>
                    <Button size="xs" variant="outline" onClick={() => setPromptOverride(current.id, null)}>
                      <RotateCcw />
                      {t.staleUseNew}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Textarea
              className="h-72 font-mono text-xs leading-relaxed"
              value={finalPrompt(config, current)}
              onChange={(e) => {
                const text = e.target.value;
                const generated = generatedPrompt(config, current);
                setPromptOverride(current.id, text === generated ? null : text, generated);
              }}
            />

            {variants.length > 0 && (
              <p className="rounded-md bg-muted p-2 text-[11px] text-muted-foreground">
                {t.promptVariantsNote}{" "}
                {variants.map((v) => (
                  <span key={v.key} className="mr-2 font-medium text-foreground">
                    {v.key}: “{v.text}”
                  </span>
                ))}
              </p>
            )}

            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">{finalPrompt(config, current).length} chars</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!config.promptOverrides[current.id]}
                  onClick={() => setPromptOverride(current.id, null)}
                >
                  <RotateCcw />
                  {t.resetPrompt}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(finalPrompt(config, current));
                    toast.success(t.copied);
                  }}
                >
                  <Copy />
                  {t.copyPrompt}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t.stylesHint}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
