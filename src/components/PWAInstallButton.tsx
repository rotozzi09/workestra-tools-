import React, { useState } from "react";
import { Download, Smartphone, X, Check, Sparkles } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        aria-label="Instalar aplicativo Workestra Tools no dispositivo"
        title="Instalar Workestra Tools no celular / PC (Funciona offline)"
        className="flex h-8 sm:h-9 items-center gap-1.5 px-2.5 sm:px-3 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] sm:text-xs font-semibold hover:bg-emerald-500/20 transition-all active:scale-95 cursor-pointer shadow-2xs"
      >
        <Download className="size-3.5" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label="Instalar no iPhone / iPad"
          title="Instalar no iOS (Safari)"
          className="flex h-8 sm:h-9 items-center gap-1.5 px-2.5 sm:px-3 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] sm:text-xs font-semibold hover:bg-emerald-500/20 transition-all active:scale-95 cursor-pointer shadow-2xs"
        >
          <Smartphone className="size-3.5" />
          <span className="hidden sm:inline">Instalar iOS</span>
          <span className="sm:hidden">iOS</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          >
            <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl text-card-foreground">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <Sparkles className="size-4" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Instalar no iPhone / iPad</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                  aria-label="Fechar guia"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/60">
                  <span className="size-5 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <span>
                    Toque no botão de <strong>Compartilhar</strong> (ícone com quadrado e seta para cima) na barra do Safari.
                  </span>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/60">
                  <span className="size-5 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <span>
                    Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.
                  </span>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/60">
                  <span className="size-5 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <span>
                    Toque em <strong>Adicionar</strong> no canto superior direito para abrir em tela cheia!
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
              >
                Entendi!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
