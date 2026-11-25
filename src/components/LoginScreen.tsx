import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { WorkestraAuthError, WorkestraAuthErrorCode } from "../lib/workestraAuth";
import workestraLogo from "../assets/workestra-logo.png";
import {
  Sparkles,
  Compass,
  GraduationCap,
  Layers,
  Sun,
  Moon,
  Volume2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Crown,
  LogIn,
} from "lucide-react";

interface Props {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

function getAuthErrorMessage(
  code: WorkestraAuthErrorCode,
  t: ReturnType<typeof useLanguage>["t"]
): string {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return t("errInvalidCredentials");
    case "PREMIUM_REQUIRED":
      return t("errPremiumRequired");
    case "INVALID_TOKEN":
      return t("errInvalidToken");
    case "API_NOT_CONFIGURED":
    case "INVALID_API_URL":
      return t("errApiNotConfigured");
    case "NETWORK_ERROR":
      return t("errNetwork");
    default:
      return t("errUnknown");
  }
}

export function LoginScreen({ theme, onToggleTheme }: Props) {
  const { signInWithWorkestra, ssoError, clearSsoError } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (ssoError) {
      setErrorMsg(getAuthErrorMessage(ssoError.code, t));
    }
  }, [ssoError, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    clearSsoError();

    try {
      await signInWithWorkestra(email, password);
    } catch (err) {
      if (err instanceof WorkestraAuthError) {
        setErrorMsg(getAuthErrorMessage(err.code, t));
      } else {
        setErrorMsg(t("errUnknown"));
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

          {/* Feature Highlights */}
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

        {/* Right Column: Workestra Database Sign In Card */}
        <div className="w-full max-w-sm rounded-2xl bg-card border-2 border-border p-6 sm:p-8 shadow-xl text-card-foreground">
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-card border border-border/80 p-1 mb-3 shadow-xs">
              <img
                src={workestraLogo}
                alt="Workestra Tools"
                loading="eager"
                decoding="sync"
                className="size-full object-contain drop-shadow-xs"
              />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-amber-500 mb-1">
              <Crown className="w-3.5 h-3.5" />
              <span>{t("premiumOnlyBadge")}</span>
            </div>

            <h3 className="text-xl font-bold text-foreground">{t("welcomeTitle")}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t("connectAccount")}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium leading-snug text-center">
              {errorMsg}
            </div>
          )}

          {/* Workestra Email + Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label
                htmlFor="workestra-login-email"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                {t("emailLabel")}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="workestra-login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="workestra-login-password"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                {t("passwordLabel")}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="workestra-login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 shrink-0" />
              )}
              <span>
                {isSubmitting ? t("connecting") : t("submitLogin")}
              </span>
            </button>
          </form>

          <p className="mt-4 text-[11px] text-muted-foreground text-center leading-relaxed">
            {t("premiumAccessNote")}
          </p>

          <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-border/50 text-[11px] text-muted-foreground/80 font-mono">
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
