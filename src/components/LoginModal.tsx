import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { WorkestraAuthError, WorkestraAuthErrorCode } from "../lib/workestraAuth";
import workestraLogo from "../assets/workestra-logo.png";
import { X, Crown, ShieldCheck, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";

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

export function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, signInWithWorkestra } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
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
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          aria-label={t("close")}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Badge */}
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
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-500" />
              {t("premiumOnlyBadge")}
            </span>
            <h2
              id="login-modal-title"
              className="text-lg font-bold tracking-tight text-foreground font-display uppercase leading-none mt-0.5"
            >
              {t("welcomeTitle")}
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed">
          {t("premiumAccessNote")}
        </p>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium leading-tight animate-in fade-in duration-150">
            {errorMsg}
          </div>
        )}

        {/* Workestra Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label
              htmlFor="modal-workestra-email"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              {t("emailLabel")}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="modal-workestra-email"
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
              htmlFor="modal-workestra-password"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              {t("passwordLabel")}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="modal-workestra-password"
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
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99] shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn className="w-4 h-4 shrink-0" />
            )}
            <span>{isSubmitting ? t("connecting") : t("submitLogin")}</span>
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>{t("connectedViaWorkestra")}</span>
        </div>
      </div>
    </div>
  );
}
