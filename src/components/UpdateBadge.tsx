import { openUrl } from "@tauri-apps/plugin-opener";
import { CircleArrowUp, Download, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { useT, useUiLang } from "@/i18n";
import { asAppError } from "@/lib/backend";
import { useApp } from "@/store/app";

/** Selo "Nova versão" na barra de título. Só aparece quando há release mais nova; atualizar é escolha do usuário. */
export function UpdateBadge() {
  const t = useT();
  const lang = useUiLang();
  const { update, skippedVersion, skipVersion } = useApp();
  const [open, setOpen] = useState(false);
  if (!update?.available || !update.latest || update.latest === skippedVersion) return null;
  const latest = update.latest;
  const date = update.publishedAt ? new Intl.DateTimeFormat(lang, { dateStyle: "short" }).format(new Date(update.publishedAt)) : null;

  async function openLink(url: string | null, download = false) {
    if (!url) return;
    try {
      await openUrl(url);
      if (download) toast.success(t.updateDownloadStarted, { description: t.updateHowTo });
    } catch (e) {
      toast.error(asAppError(e).message);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mr-1.5 flex h-7 items-center gap-1.5 rounded-full border border-primary/50 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
        >
          <CircleArrowUp className="size-3.5" />
          {t.updateBadge(latest)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>{t.updateTitle}</PopoverTitle>
          <PopoverDescription className="text-xs">{t.updateBody(update.current, latest, date)}</PopoverDescription>
        </PopoverHeader>
        <p className="text-xs text-muted-foreground">{t.updateHowTo}</p>
        <div className="flex flex-col gap-1.5">
          <Button
            size="sm"
            onClick={() => {
              setOpen(false);
              void openLink(update.downloadUrl ?? update.pageUrl, true);
            }}
          >
            <Download />
            {t.updateDownload}
          </Button>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => void openLink(update.pageUrl)}>
              <ExternalLink />
              {t.updateNotes}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setOpen(false);
                skipVersion(latest);
              }}
            >
              {t.updateSkip}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
