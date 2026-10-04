import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import workestraLogo from "../assets/workestra-logo.png";
import { X, Sparkles, ShieldCheck, BookmarkCheck } from "lucide-react";

export function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, signInWithGoogle } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        setErrorMsg("O login foi cancelado na janela do Google.");
      } else if (err?.code === "auth/popup-blocked") {
        setErrorMsg("O pop-up de login foi bloqueado pelo seu navegador. Permita pop-ups para continuar.");
      } else if (err?.code === "auth/unauthorized-domain") {
        setErrorMsg(`Domínio não autorizado (${window.location.hostname}). Adicione este domínio na aba 'Authentication > Configurações > Domínios autorizados' no Firebase Console.`);
      } else {
        setErrorMsg(`Erro de login (${err?.code || err?.message || 'desconhecido'}). Verifique se o domínio Vercel está autorizado no Firebase.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-card border border-border/80 shadow-2xl p-6 sm:p-8 overflow-hidden text-card-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeLoginModal}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label="Fechar modal de login"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Decorative Badge */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={workestraLogo}
            alt="Workestra Tools"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            className="size-11 sm:size-12 object-contain drop-shadow-sm shrink-0"
          />
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
              Workestra Tools
            </span>
            <h2 id="login-modal-title" className="text-lg font-bold tracking-tight text-foreground font-display uppercase leading-none">
              Acesse sua Conta
            </h2>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Entre com sua conta Google para sincronizar suas progressões salvas, histórico de estudo e configurações em qualquer dispositivo.
        </p>

        {/* Benefits list */}
        <div className="space-y-3 mb-6 bg-muted/40 rounded-xl p-3.5 border border-border/50 text-xs font-medium">
          <div className="flex items-center gap-2.5 text-foreground">
            <BookmarkCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Salve progressões de acordes favoritas e notas de estudo</span>
          </div>
          <div className="flex items-center gap-2.5 text-foreground">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span>Acompanhe seu nível e progresso nos treinos de ouvido</span>
          </div>
          <div className="flex items-center gap-2.5 text-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Acesso seguro e instantâneo via autenticação oficial Google</span>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium leading-tight animate-in fade-in duration-150">
            {errorMsg}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-sm border border-border shadow-xs bg-card hover:bg-muted/50 active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {isSubmitting ? "Conectando ao Google..." : "Entrar com o Google"}
          </span>
        </button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={closeLoginModal}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
