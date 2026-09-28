import { Checkbox } from "@/components/ui/checkbox";
import type { ModelDef, ProviderId } from "@/domain/types";
import { useT, useUiLang } from "@/i18n";
import { cn } from "@/lib/utils";
import { ratioFor } from "@/presets/options";
import { labelFor, MODELS, supportsRatio } from "@/registry/models";
import { useApp } from "@/store/app";
import { useConfig } from "@/store/config";
import { Pill } from "./bits";

const FIT_TONE = { recommended: "good", good: "info", weak: "warn", unstable: "bad", untested: "neutral" } as const;
const API_TONE = { yes: "good", unknown: "neutral", no: "bad" } as const;

export function ModelPicker() {
  const t = useT();
  const lang = useUiLang();
  const { config, toggleModel } = useConfig();
  const provider = useApp((s) => s.settings?.provider ?? "cli");
  const ratio = ratioFor(config.device);

  return (
    <div className="divide-y rounded-lg border bg-background">
      {MODELS.map((m) => {
        const reason = unavailable(m, ratio, provider);
        const on = config.modelIds.includes(m.id);
        return (
          <label
            key={m.id}
            className={cn("flex cursor-pointer items-start gap-2 px-2 py-1.5 hover:bg-muted/50", reason && "cursor-not-allowed opacity-45")}
            title={[m.note?.[lang], reason === "ratio" ? t.skippedRatio : reason === "api" ? t.skippedApi : reason === "cli" ? t.skippedCli : ""].filter(Boolean).join(" · ")}
          >
            <Checkbox className="mt-0.5" checked={on} disabled={!!reason} onCheckedChange={() => toggleModel(m.id)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-xs font-medium">{labelFor(m, provider)}</span>
                {provider !== "api" && m.cli && (
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{m.refCredits[config.quality]} cr</span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{m.vendor}</span>
                <Pill tone={FIT_TONE[m.fit]}>{t.fit[m.fit]}</Pill>
                <Pill tone={API_TONE[m.api.availability]}>{t.apiBadge[m.api.availability]}</Pill>
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}

function unavailable(m: ModelDef, ratio: string, provider: ProviderId): "ratio" | "api" | "cli" | null {
  if (provider === "api" && !m.api.endpoint) return "api";
  if (provider !== "api" && !m.cli) return "cli";
  if (!supportsRatio(m, ratio, provider)) return "ratio";
  return null;
}
