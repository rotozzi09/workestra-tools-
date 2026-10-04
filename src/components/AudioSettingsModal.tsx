import React, { useEffect, useRef } from "react";
import {
  X,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Music,
  Zap,
  Waves,
  Play,
  Check,
  Radio,
  Globe,
  Download,
} from "lucide-react";
import { useLanguage, Language } from "../contexts/LanguageContext";
import {
  Instrument,
  INSTRUMENTS,
  playChord,
  playMetronomeClick,
  setMasterVolume,
  setMetronomeVolume,
} from "../lib/sound";

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrument: Instrument;
  onInstrumentChange: (inst: Instrument) => void;
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  metronomeVolume: number;
  onMetronomeVolumeChange: (vol: number) => void;
}

export function AudioSettingsModal({
  isOpen,
  onClose,
  instrument,
  onInstrumentChange,
  masterVolume,
  onMasterVolumeChange,
  metronomeVolume,
  onMetronomeVolumeChange,
}: AudioSettingsModalProps) {
  const { language, setLanguage, t } = useLanguage();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap / auto focus on open
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getInstrumentIcon = (id: Instrument) => {
    switch (id) {
      case "piano":
        return <Music className="w-4 h-4 text-emerald-500" />;
      case "guitar":
        return <Music className="w-4 h-4 text-amber-500" />;
      case "epiano":
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case "strings":
        return <Radio className="w-4 h-4 text-violet-400" />;
      case "synth_brass":
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case "pad":
        return <Waves className="w-4 h-4 text-indigo-400" />;
      default:
        return <Music className="w-4 h-4 text-primary" />;
    }
  };

  const previewChord = (inst: Instrument) => {
    playChord([60, 64, 67, 71, 74], inst);
  };

  const previewMetronome = () => {
    playMetronomeClick(true, metronomeVolume);
    setTimeout(() => playMetronomeClick(false, metronomeVolume), 220);
    setTimeout(() => playMetronomeClick(false, metronomeVolume), 440);
    setTimeout(() => playMetronomeClick(false, metronomeVolume), 660);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-settings-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-2xl p-5 sm:p-6 outline-none animate-in zoom-in-95 duration-150 flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 id="audio-settings-title" className="text-base font-bold text-foreground">
                {t("settingsTitle")}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {t("settingsSubtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 0: Idioma do Aplicativo (App Language Selector) */}
        <div className="space-y-2.5 rounded-xl bg-muted/30 border border-border/60 p-3.5">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary shrink-0" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-foreground">
              {t("appLanguage")}
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setLanguage("pt")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                language === "pt"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs scale-[1.02]"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
              }`}
            >
              <span>🇧🇷</span>
              <span>Ptbr</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage("es")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                language === "es"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs scale-[1.02]"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
              }`}
            >
              <span>🇪🇸</span>
              <span>Es</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                language === "en"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs scale-[1.02]"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
              }`}
            >
              <span>🇺🇸</span>
              <span>En</span>
            </button>
          </div>
        </div>

        {/* Section 1: Metronome & Master Volumes */}
        <div className="space-y-4 rounded-xl bg-muted/30 border border-border/60 p-4">
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-muted-foreground">
            {t("audioVolume")}
          </h3>

          {/* Metronome Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="metronome-vol"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <span>{t("metronomeVolLabel")}</span>
                <span className="text-[11px] font-mono text-primary font-bold">
                  {Math.round(metronomeVolume * 100)}%
                </span>
              </label>
              <button
                type="button"
                onClick={previewMetronome}
                title={t("testMetronomeBtn")}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{t("testMetronomeBtn")}</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const next = metronomeVolume > 0 ? 0 : 0.7;
                  onMetronomeVolumeChange(next);
                  setMetronomeVolume(next);
                }}
                aria-label={metronomeVolume > 0 ? t("muteSound") : t("enableSound")}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors cursor-pointer"
              >
                {metronomeVolume > 0 ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-destructive" />
                )}
              </button>
              <input
                id="metronome-vol"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={metronomeVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onMetronomeVolumeChange(val);
                  setMetronomeVolume(val);
                }}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                aria-label={t("metronomeVolLabel")}
              />
            </div>
          </div>

          {/* Master Volume */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <label
                htmlFor="master-vol"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <span>{t("instrumentVolLabel")}</span>
                <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  masterVolume > 1.05 ? "bg-amber-500/15 text-amber-500 border border-amber-500/30" : "text-primary"
                }`}>
                  {Math.round(masterVolume * 100)}% {masterVolume > 1.05 ? `· ${t("highGain")}` : masterVolume >= 0.95 ? `· ${t("defaultGain")}` : ""}
                </span>
              </label>
              <button
                type="button"
                onClick={() => previewChord(instrument)}
                title={t("previewChordBtn")}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{t("previewChordBtn")}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const next = masterVolume > 0 ? 0 : 1.0;
                  onMasterVolumeChange(next);
                  setMasterVolume(next);
                }}
                aria-label={masterVolume > 0 ? t("muteSound") : t("enableSound")}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors cursor-pointer"
              >
                {masterVolume > 0 ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-destructive" />
                )}
              </button>
              <input
                id="master-vol"
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={masterVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onMasterVolumeChange(val);
                  setMasterVolume(val);
                }}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                aria-label={t("instrumentVolLabel")}
              />
            </div>

            {/* Quick Volume & Boost Presets */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-mono text-muted-foreground">{t("volumePresets")}</span>
              <button
                type="button"
                onClick={() => {
                  onMasterVolumeChange(0.7);
                  setMasterVolume(0.7);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer border ${
                  Math.abs(masterVolume - 0.7) < 0.05
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground border-border/60"
                }`}
              >
                {t("softVolume")}
              </button>
              <button
                type="button"
                onClick={() => {
                  onMasterVolumeChange(1.0);
                  setMasterVolume(1.0);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer border ${
                  Math.abs(masterVolume - 1.0) < 0.05
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground border-border/60"
                }`}
              >
                {t("standardVolume")}
              </button>
              <button
                type="button"
                onClick={() => {
                  onMasterVolumeChange(1.5);
                  setMasterVolume(1.5);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer border ${
                  Math.abs(masterVolume - 1.5) < 0.05
                    ? "bg-amber-500 text-black border-amber-500 shadow-xs"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/30"
                }`}
              >
                {t("boostVolume")}
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Timbres & Sound Banks */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-muted-foreground">
              {t("soundBankTitle")}
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground">
              {t("timbresAvailable")}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label={t("soundBankTitle")}>
            {INSTRUMENTS.map((inst) => {
              const isSelected = instrument === inst.id;
              return (
                <div
                  key={inst.id}
                  onClick={() => onInstrumentChange(inst.id)}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onInstrumentChange(inst.id);
                    }
                  }}
                  className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                      : "border-border bg-card hover:bg-muted/50 hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? "bg-primary/20" : "bg-muted group-hover:bg-muted/80"
                      }`}
                    >
                      {getInstrumentIcon(inst.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {inst.name}
                        </span>
                        {inst.category === "electronic" && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold">
                            Synth
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                        {inst.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        previewChord(inst.id);
                      }}
                      title={`${t("previewChordBtn")} ${inst.name}`}
                      aria-label={`${t("previewChordBtn")} ${inst.name}`}
                      className="p-1.5 rounded-lg bg-muted hover:bg-primary/20 hover:text-primary text-muted-foreground transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/80 bg-background"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-mono">
            {t("webAudioSynth")}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            {t("doneBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
