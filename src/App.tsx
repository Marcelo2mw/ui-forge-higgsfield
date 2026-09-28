import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfigSidebar } from "@/components/ConfigSidebar";
import { Lightbox } from "@/components/Lightbox";
import { CompareDialog, HistorySheet, LogDrawer, SettingsDialog } from "@/components/Panels";
import { RunView } from "@/components/RunView";
import { Toolbar } from "@/components/Toolbar";
import { useBackendEvents } from "@/hooks/useBackendEvents";
import { asAppError } from "@/lib/backend";
import { useApp } from "@/store/app";

export default function App() {
  useBackendEvents();
  const logOpen = useApp((s) => s.panels.log);
  const uiLang = useApp((s) => s.settings?.uiLang);

  useEffect(() => {
    useApp.getState().init().catch((e) => toast.error(asAppError(e).message));
  }, []);

  useEffect(() => {
    if (uiLang) document.documentElement.lang = uiLang;
  }, [uiLang]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen flex-col overflow-hidden">
        <Toolbar />
        <div className="flex min-h-0 flex-1">
          <ConfigSidebar />
          <main className="flex min-w-0 flex-1 flex-col">
            <RunView />
            {logOpen && <LogDrawer />}
          </main>
        </div>
      </div>
      <Lightbox />
      <CompareDialog />
      <HistorySheet />
      <SettingsDialog />
      <Toaster position="bottom-right" richColors />
    </TooltipProvider>
  );
}
