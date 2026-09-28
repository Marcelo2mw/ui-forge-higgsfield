import { Check } from "lucide-react";
import { useUiLang, useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { STYLES } from "@/presets/styles";
import { useConfig } from "@/store/config";

/** Grade de estilos com miniatura em CSS que acompanha a cor de destaque. */
export function StylePicker() {
  const t = useT();
  const lang = useUiLang();
  const { config, toggleStyle } = useConfig();

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {STYLES.map((s) => {
        const on = config.styleIds.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => toggleStyle(s.id)}
            title={`${s.hint[lang]}${s.calibrated ? "" : ` · ${t.notCalibrated}`}`}
            aria-pressed={on}
            className={cn(
              "group relative rounded-lg border p-1 text-left transition-all",
              on ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-foreground/30",
            )}
          >
            <div className={cn("sw", s.swatch)} style={{ ["--sw-accent" as string]: config.accent }}>
              <div className="sw-side" />
              <div className="sw-main">
                <div className="sw-kpis">
                  <div className="sw-card" />
                  <div className="sw-card" />
                </div>
                <div className="sw-chart" />
              </div>
            </div>
            <div className="mt-1 flex min-h-[2lh] items-start gap-1 px-0.5 text-[10.5px]">
              <span className="line-clamp-2 text-[10.5px] leading-tight font-medium">{s.label[lang]}</span>
              {!s.calibrated && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-400" />}
            </div>
            {on && (
              <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                <Check className="size-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
