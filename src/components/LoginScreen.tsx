import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import workestraLogo from "../assets/workestra-logo.png";
import {
  Sparkles,
  Compass,
  GraduationCap,
  Layers,
  Sun,
  Moon,
  Volume2,
} from "lucide-react";

interface Props {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function LoginScreen({ theme, onToggleTheme }: Props) {
  const { signInWithGoogle } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        setErrorMsg("O login foi cancelado na janela do Google.");
      } else if (err?.code === "auth/popup-blocked") {
        setErrorMsg("O pop-up foi bloqueado pelo navegador. Permita pop-ups para fazer login.");
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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary transition-colors duration-200">
      {/* Top Bar */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5 min-w-0">
          <img
            src={workestraLogo}
            alt="Workestra Tools"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            className="size-12 sm:size-16 md:size-20 object-contain drop-shadow-md shrink-0 transition-transform hover:scale-105"
          />
          <div className="flex flex-col min-w-0 justify-center">
            <h1 className="font-display text-2xl sm:text-4xl md:text-5xl uppercase leading-none tracking-tight text-foreground truncate">
              Workestra Tools
            </h1>
            <span className="mt-1 sm:mt-2 font-mono text-[9.5px] sm:text-xs md:text-sm uppercase tracking-wider sm:tracking-[0.18em] text-primary font-bold truncate">
              {t("appSubtitle")}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
          className="flex size-9 sm:size-11 md:size-12 items-center justify-center rounded-xl sm:rounded-2xl border border-border/80 bg-card hover:bg-muted/60 transition-transform active:scale-95 cursor-pointer shadow-xs text-foreground shrink-0"
        >
          {theme === "dark" ? (
            <Sun className="size-4 sm:size-5 md:size-6 text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="size-4 sm:size-5 md:size-6 text-slate-700 transition-transform hover:-rotate-12" />
          )}
        </button>
      </header>

      {/* Main Hero & Login Box */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14">
        {/* Left Column: Visual Highlights */}
        <div className="flex-1 max-w-lg text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("heroBadge")}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15] mb-4">
            {t("heroHeading")}
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
            {t("heroSub")}
          </p>

          {/* Interactive Feature Pills */}
          <div className="grid grid-cols-2 gap-2.5 text-left mb-6">
            <div className="p-3 rounded-xl bg-card border border-border/70 shadow-xs flex items-start gap-2.5">
              <Compass className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-foreground block">Roda de Quintas</span>
                <span className="text-[11px] text-muted-foreground">Maiores, menores e graus</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/70 shadow-xs flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-foreground block">Piano & Violão</span>
                <span className="text-[11px] text-muted-foreground">Digitações e graus exatos</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/70 shadow-xs flex items-start gap-2.5">
              <Volume2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-foreground block">Áudio Realista</span>
                <span className="text-[11px] text-muted-foreground">Samples acústicos de estúdio</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/70 shadow-xs flex items-start gap-2.5">
              <GraduationCap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-foreground block">Treino & Quiz</span>
                <span className="text-[11px] text-muted-foreground">Treinamento de ouvido</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Card */}
        <div className="w-full max-w-sm rounded-2xl bg-card border-2 border-border p-6 sm:p-8 shadow-xl text-card-foreground">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-card border border-border/80 p-1 mb-3 shadow-xs">
              <img
                src={workestraLogo}
                alt="Workestra Tools"
                loading="eager"
                decoding="sync"
                className="size-full object-contain drop-shadow-xs"
              />
            </div>
            <h3 className="text-xl font-bold text-foreground">{t("welcomeTitle")}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t("connectAccount")}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium leading-tight text-center">
              {errorMsg}
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm border-2 border-border shadow-sm bg-card hover:bg-muted/60 active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
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
            <span className="text-foreground group-hover:text-primary transition-colors">
              {isSubmitting ? t("connecting") : t("loginWithGoogle")}
            </span>
          </button>

          <div className="flex items-center justify-center gap-3 mt-6 text-[11px] text-muted-foreground/80 font-mono">
            <a
              href="/privacidade.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors underline underline-offset-2"
            >
              {t("privacy")}
            </a>
            <span>•</span>
            <a
              href="/termos.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors underline underline-offset-2"
            >
              {t("terms")}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
