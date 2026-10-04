import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { LogIn, LogOut, User as UserIcon, ChevronDown, CheckCircle2 } from "lucide-react";

export function UserAuthButton() {
  const { user, loading, openLoginModal, logOut } = useAuth();
  const { t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="h-8 w-20 bg-muted/60 animate-pulse rounded-lg" />
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={openLoginModal}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs active:scale-95 transition-all cursor-pointer"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>{t("loginWithGoogle")}</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg border border-border/70 hover:bg-muted/50 transition-colors text-xs font-medium cursor-pointer"
        aria-expanded={isDropdownOpen}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || t("user")}
            className="w-6 h-6 rounded-full object-cover ring-1 ring-primary/30"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
          </div>
        )}
        <span className="max-w-[100px] truncate hidden sm:inline font-semibold text-foreground">
          {user.displayName?.split(" ")[0] || user.email?.split("@")[0] || t("user")}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 ${isDropdownOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-border shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="px-3.5 py-2 border-b border-border/50">
            <p className="text-xs font-bold text-foreground truncate">
              {user.displayName || t("musician")}
            </p>
            <p className="text-[11px] font-mono text-muted-foreground truncate">
              {user.email}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>{t("connectedViaGoogle")}</span>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={async () => {
                setIsDropdownOpen(false);
                await logOut();
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t("signOut")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
