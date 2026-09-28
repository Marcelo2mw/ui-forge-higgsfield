import { FileText, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/domain/types";
import { useT, useUiLang } from "@/i18n";
import { cn } from "@/lib/utils";
import { ACCENT_SWATCHES, DEVICES, PRESENTATIONS, SCREENS } from "@/presets/options";
import { SEGMENTS } from "@/presets/segments";
import { staleOverrides } from "@/domain/plan";
import { useConfig } from "@/store/config";
import { isHexColor, normalizeHex } from "@/prompt/colors";
import { ChipGroup, Section } from "./bits";
import { ModelPicker } from "./ModelPicker";
import { PaletteExtractor } from "./PaletteExtractor";
import { PromptDialog } from "./PromptDialog";
import { StylePicker } from "./StylePicker";
import { VariantsEditor } from "./VariantsEditor";

export function ConfigSidebar() {
  const t = useT();
  const lang = useUiLang();
  const { config, patch, setSegment } = useConfig();
  const [promptOpen, setPromptOpen] = useState(false);
  const segment = SEGMENTS.find((s) => s.id === config.segmentId);
  const edited = Object.keys(config.promptOverrides).filter((id) => config.styleIds.includes(id)).length;
  const stale = staleOverrides(config).length;

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r bg-sidebar">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-3">
          <Section title={t.segment}>
            <Select value={config.segmentId} onValueChange={setSegment}>
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label[lang]}
                  </SelectItem>
                ))}
                <SelectItem value="custom">{t.customSegment}</SelectItem>
              </SelectContent>
            </Select>
            {config.segmentId === "custom" && (
              <Input
                className="h-7 text-xs"
                placeholder={t.customPlaceholder}
                value={config.customSegment}
                onChange={(e) => patch({ customSegment: e.target.value })}
              />
            )}
          </Section>

          <Section title={t.screen}>
            <ChipGroup
              cols={4}
              value={config.screen}
              onChange={(screen) => patch({ screen })}
              options={SCREENS.map((s) => ({ id: s.id, label: s.label[lang] }))}
            />
            {config.screen === "custom" && (
              <Textarea
                autoFocus
                className="min-h-14 text-xs"
                placeholder={t.customScreenPlaceholder}
                value={config.customScreen}
                onChange={(e) => patch({ customScreen: e.target.value })}
              />
            )}
          </Section>

          <Section title={t.styles} aside={<span className="text-[11px] text-muted-foreground">{config.styleIds.length} · {t.stylesHint}</span>}>
            <StylePicker />
          </Section>

          <div className="grid grid-cols-2 gap-3">
            <Section title={t.theme}>
              <ChipGroup
                value={config.theme}
                onChange={(theme) => patch({ theme })}
                options={[
                  { id: "light", label: t.light },
                  { id: "dark", label: t.dark },
                ]}
              />
            </Section>
            <Section title={t.textLang}>
              <ChipGroup<Lang>
                value={config.lang}
                onChange={(l) => patch({ lang: l })}
                options={[
                  { id: "pt-BR", label: "PT-BR" },
                  { id: "en", label: "EN" },
                ]}
              />
            </Section>
          </div>

          <Section title={t.accent}>
            <AccentPicker value={config.accent} onChange={(accent) => patch({ accent })} />
            <PaletteExtractor />
          </Section>

          <Section title={t.device}>
            <ChipGroup
              value={config.device}
              onChange={(device) => patch({ device })}
              options={DEVICES.map((d) => ({ id: d.id, label: `${d.label[lang]} ${d.ratio}` }))}
            />
          </Section>

          <Section title={t.presentation}>
            <ChipGroup
              value={config.presentation}
              onChange={(presentation) => patch({ presentation })}
              options={PRESENTATIONS.map((p) => ({ id: p.id, label: p.label[lang], title: p.hint[lang] }))}
            />
          </Section>

          <Section title={t.brand}>
            <Input
              className="h-7 text-xs"
              placeholder={segment?.brand ?? t.brandPlaceholder}
              value={config.brand}
              onChange={(e) => patch({ brand: e.target.value })}
            />
          </Section>

          <Section title={t.extra}>
            <Textarea
              className="min-h-14 text-xs"
              placeholder={t.extraPlaceholder}
              value={config.extra}
              onChange={(e) => patch({ extra: e.target.value })}
            />
          </Section>

          <VariantsEditor />

          <Button
            variant="outline"
            size="sm"
            className={cn("w-full", stale > 0 && "border-amber-400 text-amber-700 dark:text-amber-400")}
            onClick={() => setPromptOpen(true)}
          >
            {stale > 0 ? <TriangleAlert /> : <FileText />}
            {t.showPrompt}
            {stale > 0 ? (
              <span className="text-[10px]">({t.staleCount(stale)})</span>
            ) : (
              edited > 0 && <span className="text-[10px] text-primary">({edited} {t.editedPrompt})</span>
            )}
          </Button>

          <Section title={t.models}>
            <ModelPicker />
          </Section>

          <div className="grid grid-cols-[auto_1fr] gap-3">
            <Section title={t.variations}>
              <ChipGroup
                value={config.variations}
                onChange={(variations) => patch({ variations })}
                options={[1, 2, 3, 4].map((n) => ({ id: n, label: String(n) }))}
              />
            </Section>
            <Section title={t.quality}>
              <ChipGroup
                value={config.quality}
                onChange={(quality) => patch({ quality })}
                options={[
                  { id: "draft", label: t.draft },
                  { id: "final", label: t.final },
                ]}
              />
            </Section>
          </div>

        </div>
      </ScrollArea>
      <PromptDialog open={promptOpen} onOpenChange={setPromptOpen} />
    </aside>
  );
}

function AccentPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState(value);
  const current = normalizeHex(value);
  // A cor também muda por fora (ao trocar de segmento).
  useEffect(() => {
    setDraft((d) => (isHexColor(d) && normalizeHex(d) === current ? d : current));
  }, [current]);
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 flex-wrap gap-1">
        {ACCENT_SWATCHES.map((hex) => (
          <button
            key={hex}
            type="button"
            title={hex}
            onClick={() => {
              onChange(hex);
              setDraft(hex);
            }}
            className="size-5 rounded-full border-2 transition-transform hover:scale-110"
            style={{ background: hex, borderColor: current === hex ? "var(--foreground)" : "transparent" }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="size-5 rounded border" style={{ background: current }} />
        <Input
          className="h-7 w-19 px-1.5 font-mono text-xs"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (isHexColor(e.target.value)) onChange(normalizeHex(e.target.value));
          }}
          onBlur={() => setDraft(current)}
        />
      </div>
    </div>
  );
}
