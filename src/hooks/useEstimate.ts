import { useEffect, useMemo, useState } from "react";
import { api, asAppError, type Estimate, type JobSpec } from "@/lib/backend";
import { useApp } from "@/store/app";

/** Células com o mesmo alvo e os mesmos parâmetros (fora o prompt) custam igual. */
function costKey(cell: JobSpec): string {
  const { prompt: _prompt, ...rest } = cell.params;
  return `${cell.target}|${JSON.stringify(rest, Object.keys(rest).sort())}`;
}

interface EstimateState {
  key: string;
  costs: Record<string, number>;
  errors: Estimate["errors"];
  unit: string;
  loading: boolean;
  error: string | null;
}

export interface EstimateResult {
  total: number | null;
  unit: string;
  loading: boolean;
  error: string | null;
  /** Modelos cujos parâmetros o provider recusou (com a mensagem). */
  invalid: Record<string, string>;
  costOf: (cell: JobSpec) => number | undefined;
}

export function useEstimate(cells: JobSpec[]): EstimateResult {
  const provider = useApp((s) => s.settings?.provider);
  const reps = useMemo(() => {
    const map = new Map<string, JobSpec>();
    for (const c of cells) if (!map.has(costKey(c))) map.set(costKey(c), c);
    return map;
  }, [cells]);
  const key = `${provider}|${[...reps.keys()].sort().join("§")}`;
  const [state, setState] = useState<EstimateState>({ key: "", costs: {}, errors: [], unit: "credits", loading: false, error: null });

  useEffect(() => {
    if (!provider || reps.size === 0) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    const timer = setTimeout(async () => {
      try {
        const list = [...reps.entries()];
        const res = await api.estimateRun(list.map(([, c]) => c));
        if (!alive) return;
        const costs: Record<string, number> = {};
        for (const [k, c] of list) {
          const v = res.perCell[c.cellId];
          if (v !== undefined) costs[k] = v;
        }
        setState({ key, costs, errors: res.errors, unit: res.unit, loading: false, error: null });
      } catch (e) {
        if (alive) setState({ key, costs: {}, errors: [], unit: "credits", loading: false, error: asAppError(e).message });
      }
    }, 450);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // `key` resume `reps` e o provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (cells.length === 0) {
    return { total: 0, unit: state.unit, loading: false, error: null, invalid: {}, costOf: () => undefined };
  }
  const fresh = state.key === key;
  const costOf = (cell: JobSpec) => (fresh ? state.costs[costKey(cell)] : undefined);
  const known = cells.map(costOf);
  const total = fresh && known.every((v) => v !== undefined) ? known.reduce<number>((s, v) => s + (v ?? 0), 0) : null;
  const invalid: Record<string, string> = {};
  if (fresh) for (const e of state.errors) invalid[e.modelId] = e.message;

  return { total, unit: state.unit, loading: state.loading || !fresh, error: fresh ? state.error : null, invalid, costOf };
}
