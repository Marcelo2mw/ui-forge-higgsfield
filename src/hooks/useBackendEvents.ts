import type { UnlistenFn } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { events } from "@/lib/backend";
import { useApp } from "@/store/app";

/** Liga os eventos do Rust ao store (uma vez só, mesmo com o StrictMode montando duas vezes). */
export function useBackendEvents() {
  useEffect(() => {
    let alive = true;
    const unlisten: UnlistenFn[] = [];
    const { applyCell, applyRunSummary, pushLog } = useApp.getState();
    Promise.all([
      events.onCell((runId, cell) => applyCell(runId, cell)),
      events.onRun((runId, summary, reason) => applyRunSummary(runId, summary, reason)),
      events.onLog((entry) => pushLog(entry)),
    ]).then((fns) => {
      if (alive) unlisten.push(...fns);
      else fns.forEach((f) => f());
    });
    return () => {
      alive = false;
      unlisten.forEach((f) => f());
    };
  }, []);
}
