import { Input } from "@/components/ui/input";
import { activeVariants } from "@/domain/plan";
import { useT } from "@/i18n";
import { MAX_VARIANTS, useConfig } from "@/store/config";
import { Section } from "./bits";

/** Frases extras para comparar lado a lado: cada uma vira uma linha na grade, ao lado do original (A). */
export function VariantsEditor() {
  const t = useT();
  const { config, setVariant } = useConfig();
  const active = activeVariants(config).length;

  return (
    <Section
      title={t.variants}
      aside={active > 0 ? <span className="text-[11px] font-medium text-primary">{t.variantsActive(active)}</span> : undefined}
    >
      <p className="text-[11px] leading-snug text-muted-foreground">{t.variantsHint}</p>
      <div className="space-y-1">
        {Array.from({ length: MAX_VARIANTS }, (_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold">
              {String.fromCharCode(66 + i)}
            </span>
            <Input
              className="h-7 text-xs"
              placeholder={t.variantPlaceholders[i]}
              value={config.promptVariants[i] ?? ""}
              onChange={(e) => setVariant(i, e.target.value)}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
