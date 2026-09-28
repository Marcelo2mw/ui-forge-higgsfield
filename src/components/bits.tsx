import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

export interface ChipOption<T extends string | number> {
  id: T;
  label: ReactNode;
  title?: string;
  disabled?: boolean;
}

/** Grupo de botões compactos (seleção única). */
export function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
  cols,
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${cols ?? options.length}, minmax(0, 1fr))` }}
      role="radiogroup"
    >
      {options.map((o) => (
        <button
          key={String(o.id)}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          title={o.title}
          disabled={o.disabled}
          onClick={() => onChange(o.id)}
          className={cn(
            "h-7 truncate rounded-md border px-2 text-xs transition-colors disabled:opacity-40",
            o.id === value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pill({ tone = "neutral", children, title }: { tone?: "neutral" | "good" | "warn" | "bad" | "info"; children: ReactNode; title?: string }) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    good: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    warn: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    bad: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
    info: "bg-primary/10 text-primary dark:bg-primary/20",
  };
  return (
    <span title={title} className={cn("inline-flex h-4 items-center rounded px-1 text-[10px] font-medium whitespace-nowrap", tones[tone])}>
      {children}
    </span>
  );
}
