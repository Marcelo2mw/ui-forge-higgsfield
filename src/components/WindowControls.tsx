import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState, type ReactNode } from "react";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

/** No macOS a janela mantém a moldura nativa (tauri.macos.conf.json); nos demais, os botões são nossos. */
const NATIVE_FRAME = navigator.userAgent.includes("Mac");

export function WindowControls() {
  return NATIVE_FRAME ? null : <CaptionButtons />;
}

function CaptionButtons() {
  const t = useT();
  const [maximized, setMaximized] = useState(false);
  const [focused, setFocused] = useState(true);

  useEffect(() => {
    const win = getCurrentWindow();
    const sync = () => void win.isMaximized().then(setMaximized);
    sync();
    const unlisten = [win.onResized(sync), win.onFocusChanged(({ payload }) => setFocused(payload))];
    return () => unlisten.forEach((p) => void p.then((off) => off()));
  }, []);

  const win = getCurrentWindow();
  return (
    // Como no Windows: os botões apagam um pouco quando a janela perde o foco.
    <div className={cn("flex self-stretch transition-opacity", !focused && "opacity-55")}>
      <CaptionButton label={t.minimize} onClick={() => void win.minimize()}>
        <path d="M0 5.5h10" />
      </CaptionButton>
      <CaptionButton label={maximized ? t.restore : t.maximize} onClick={() => void win.toggleMaximize()}>
        {maximized ? (
          <>
            <rect x="0.5" y="2.5" width="7" height="7" rx="1" />
            <path d="M2.5 2.5v-1a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-1" />
          </>
        ) : (
          <rect x="0.5" y="0.5" width="9" height="9" rx="1" />
        )}
      </CaptionButton>
      <CaptionButton label={t.close} danger onClick={() => void win.close()}>
        <path d="M0.5 0.5l9 9M9.5 0.5l-9 9" />
      </CaptionButton>
    </div>
  );
}

function CaptionButton({ label, danger, onClick, children }: { label: string; danger?: boolean; onClick: () => void; children: ReactNode }) {
  // Botão e ícone em px, não em rem (w-11.5, size-2.5): a raiz é 14px, e aí os traços de 1px
  // caem em meio pixel e a borda de baixo some. 46px e 10px mantêm tudo no pixel inteiro.
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex w-[46px] items-center justify-center text-foreground/85 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2",
        danger ? "hover:bg-[#c42b1c] hover:text-white active:bg-[#c42b1c]/85" : "hover:bg-white/10 active:bg-white/6",
      )}
    >
      <svg viewBox="0 0 10 10" width={10} height={10} fill="none" stroke="currentColor" strokeWidth={1} aria-hidden>
        {children}
      </svg>
    </button>
  );
}
