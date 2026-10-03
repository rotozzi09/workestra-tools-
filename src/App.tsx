import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Music, Layers, Sun, Moon, GraduationCap, Sliders, Mic, Download } from "lucide-react";
import workestraLogo from "./assets/workestra-logo.png";
import { HarmonicWheel } from "./components/HarmonicWheel";
import { ProgressionPlayer } from "./components/ProgressionPlayer";
import { HarmonicQuiz } from "./components/HarmonicQuiz";
import { ChordDiagramInspector } from "./components/ChordDiagramInspector";
import { ChordMapAtlas } from "./components/ChordMapAtlas";
import { CapoCalculator } from "./components/CapoCalculator";
import { VocalPitchDetector } from "./components/VocalPitchDetector";
import { PWAInstallButton } from "./components/PWAInstallButton";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { AudioSettingsModal } from "./components/AudioSettingsModal";
import { LoginModal } from "./components/LoginModal";
import { LoginScreen } from "./components/LoginScreen";
import { UserAuthButton } from "./components/UserAuthButton";
import { StudyHarmonicTips } from "./components/StudyHarmonicTips";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import {
  FIELDS,
  mod,
  Mode,
  ChordType,
  getActiveHarmonicField,
} from "./lib/harmony";
import {
  getGuitarChordShape,
  getGuitarChordMidis,
  getInvertedVoicing,
} from "./lib/chordDiagrams";
import {
  playTonic,
  playChord,
  Instrument,
  setMasterVolume,
  setMetronomeVolume,
  getMasterVolume,
  getMetronomeVolume,
} from "./lib/sound";

function MainApp() {
  const { user, loading: authLoading } = useAuth();
  const { language, t } = useLanguage();
  const [index, setIndex] = useState(0); // 0 = C (Maior) / Cm (Menor)
  const [mode, setMode] = useState<Mode>("major");
  const [chordType, setChordType] = useState<ChordType>("triad");
  const [instrument, setInstrument] = useState<Instrument>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("harmonic-wheel-instrument");
      if (saved) return saved as Instrument;
    }
    return "piano";
  });
  const [soundOn, setSoundOn] = useState(true);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [masterVolume, setMasterVolumeState] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("harmonic-wheel-master-vol");
      if (saved) return parseFloat(saved);
    }
    return getMasterVolume();
  });
  const [metronomeVolume, setMetronomeVolumeState] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("harmonic-wheel-metronome-vol");
      if (saved) return parseFloat(saved);
    }
    return getMetronomeVolume();
  });

  const handleInstrumentChange = (inst: Instrument) => {
    setInstrument(inst);
    localStorage.setItem("harmonic-wheel-instrument", inst);
  };

  const handleMasterVolumeChange = (vol: number) => {
    setMasterVolumeState(vol);
    setMasterVolume(vol);
    localStorage.setItem("harmonic-wheel-master-vol", vol.toString());
  };

  const handleMetronomeVolumeChange = (vol: number) => {
    setMetronomeVolumeState(vol);
    setMetronomeVolume(vol);
    localStorage.setItem("harmonic-wheel-metronome-vol", vol.toString());
  };
  const [showDegrees, setShowDegrees] = useState(true);
  const [studyMode, setStudyMode] = useState(false);
  const [vocalExpandTrigger, setVocalExpandTrigger] = useState(0);
  const [revealedChords, setRevealedChords] = useState<Set<number>>(new Set());
  const [showStudyHint, setShowStudyHint] = useState(false);
  const studyInactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetStudyInactivityTimer = useCallback(() => {
    if (studyInactivityTimerRef.current) {
      clearTimeout(studyInactivityTimerRef.current);
      studyInactivityTimerRef.current = null;
    }
    if (!studyMode) {
      setShowStudyHint(false);
      return;
    }
    // Set 10-second inactivity countdown timer
    studyInactivityTimerRef.current = setTimeout(() => {
      setShowStudyHint(true);
    }, 10000);
  }, [studyMode]);

  // Activate or clear timer when study mode toggles
  useEffect(() => {
    if (studyMode) {
      resetStudyInactivityTimer();
      const onUserActivity = () => {
        resetStudyInactivityTimer();
      };
      window.addEventListener("pointerdown", onUserActivity, { passive: true });
      window.addEventListener("keydown", onUserActivity, { passive: true });
      return () => {
        window.removeEventListener("pointerdown", onUserActivity);
        window.removeEventListener("keydown", onUserActivity);
        if (studyInactivityTimerRef.current) {
          clearTimeout(studyInactivityTimerRef.current);
          studyInactivityTimerRef.current = null;
        }
      };
    } else {
      setShowStudyHint(false);
      if (studyInactivityTimerRef.current) {
        clearTimeout(studyInactivityTimerRef.current);
        studyInactivityTimerRef.current = null;
      }
    }
  }, [studyMode, resetStudyInactivityTimer]);

  const [activeChordIndex, setActiveChordIndex] = useState<number | null>(null);
  const [selectedChordIndex, setSelectedChordIndex] = useState<number | null>(0);
  const [lastSelectedChordIndex, setLastSelectedChordIndex] = useState<number>(0);
  const [playingDegreeIndex, setPlayingDegreeIndex] = useState<number | null>(null);
  const [playingBeat, setPlayingBeat] = useState<number | null>(null);
  const [inversionsMap, setInversionsMap] = useState<Record<number, number>>({});

  // Theme state: "light" | "dark"
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("harmonic-wheel-theme");
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("harmonic-wheel-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const prevKey = useRef<string | null>(null);
  const fieldData = getActiveHarmonicField(index, mode, chordType, language);
  const allFieldChordNames = useMemo(
    () => fieldData.chords.map((c) => c.chord),
    [fieldData]
  );

  useEffect(() => {
    const currentKey = `${index}-${mode}-${chordType}`;
    // Avoid playing sound on first initial mount before user interaction
    if (prevKey.current === null) {
      prevKey.current = currentKey;
      return;
    }
    if (prevKey.current === currentKey) return;
    prevKey.current = currentKey;

    if (soundOn) {
      const tonicChord = fieldData.chords[0];
      if (tonicChord) {
        playChord(tonicChord.notes, instrument);
      }
    }
  }, [index, mode, chordType, soundOn, fieldData, instrument]);

  const handleModeChange = (newMode: Mode) => {
    if (mode === newMode) return;
    setMode(newMode);
    // Maior inicia em C (index 0), Menor inicia em Cm (index 0)
    setIndex(0);
    setSelectedChordIndex(0);
    setLastSelectedChordIndex(0);
    setRevealedChords(new Set());
    setInversionsMap({});
  };

  const handleKeyChange = (newIndex: number) => {
    const targetIndex = mod(newIndex, 12);
    setIndex(targetIndex);
    setSelectedChordIndex(0); // Reseta para o Grau I (Tônica) do novo tom
    setLastSelectedChordIndex(0);
    setRevealedChords(new Set());
    setInversionsMap({});
  };

  const handleChordTypeChange = (newType: ChordType) => {
    if (chordType === newType) return;
    setChordType(newType);
    setInversionsMap({});
    if (soundOn && selectedChordIndex !== null) {
      const nextField = getActiveHarmonicField(index, mode, newType);
      const nextChord = nextField.chords[selectedChordIndex];
      if (nextChord) {
        playChord(nextChord.notes, instrument);
      }
    }
  };

  const handleChordClick = (itemIndex: number, notes: number[]) => {
    if (studyMode) {
      setRevealedChords((prev) => new Set(prev).add(itemIndex));
    }
    setActiveChordIndex(itemIndex);
    setSelectedChordIndex(itemIndex);
    setLastSelectedChordIndex(itemIndex);
    setTimeout(() => setActiveChordIndex(null), 350);
    const chordItem = fieldData.chords[itemIndex];
    if (soundOn && chordItem) {
      const inv = inversionsMap[itemIndex] ?? 0;
      const shape = getGuitarChordShape(chordItem.chord, inv);
      const toPlay = instrument === "guitar"
        ? getGuitarChordMidis(shape)
        : getInvertedVoicing(notes, inv);
      playChord(toPlay, instrument);
    }
  };

  // If checking initial auth state: show loader
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-500/15 blur-xl scale-150 animate-pulse" />
          <img
            src={workestraLogo}
            alt="Carregando Workestra"
            className="w-16 h-16 object-contain animate-spin drop-shadow-[0_0_16px_rgba(234,179,8,0.3)] select-none pointer-events-none"
            style={{ animationDuration: "2.8s" }}
          />
        </div>
        <span className="font-mono text-xs text-muted-foreground tracking-wider animate-pulse">
          Carregando estúdio harmônico...
        </span>
      </div>
    );
  }

  // If user is logged out: show dedicated Login Screen
  if (!user) {
    return <LoginScreen theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center bg-background font-sans text-foreground">
      <div className="flex w-full max-w-md flex-col items-center px-3 pb-12 pt-5">
        {/* Header: Workestra Tools Brand Logo, Title & Subtitle + User Profile Button */}
        <header className="flex w-full flex-col gap-3 animate-[slide-up_0.6s_var(--ease-out-expo)_both]">
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={workestraLogo}
                alt="Workestra Tools"
                loading="eager"
                decoding="sync"
                fetchPriority="high"
                className="size-11 sm:size-12 object-contain drop-shadow-sm shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-display text-2xl sm:text-3xl uppercase leading-none tracking-tight text-foreground truncate">
                    Workestra Tools
                  </h1>
                </div>
                <span className="mt-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-primary font-bold">
                  {t("appSubtitle")}
                </span>
              </div>
            </div>

            {/* Google Login / User Profile Button & System Icons underneath */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <UserAuthButton />
              <div className="flex items-center gap-1 bg-card/80 p-1 rounded-full border border-border shadow-xs">
                <button
                  type="button"
                  onClick={() => setSoundOn((s) => !s)}
                  aria-label={soundOn ? "Desativar som" : "Ativar som"}
                  title={soundOn ? "Desativar som" : "Ativar som"}
                  className="flex size-7 items-center justify-center rounded-full transition-transform active:scale-95 cursor-pointer hover:bg-muted"
                >
                  {soundOn ? (
                    <Volume2 className="size-3.5 text-primary" />
                  ) : (
                    <VolumeX className="size-3.5 text-muted-foreground" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsAudioSettingsOpen(true)}
                  aria-label="Abrir configurações de áudio e timbres"
                  title="Configurações de Áudio & Timbres"
                  className="flex size-7 items-center justify-center rounded-full transition-transform active:scale-95 cursor-pointer hover:bg-muted text-foreground"
                >
                  <Sliders className="size-3.5 text-muted-foreground hover:text-primary transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={theme === "dark" ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
                  title={theme === "dark" ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
                  className="flex size-7 items-center justify-center rounded-full transition-transform active:scale-95 cursor-pointer hover:bg-muted text-foreground"
                >
                  {theme === "dark" ? (
                    <Sun className="size-3.5 text-amber-400" />
                  ) : (
                    <Moon className="size-3.5 text-slate-700" />
                  )}
                </button>

                <PWAInstallButton />
              </div>
            </div>
          </div>

          {/* Barra de Ações alinhada à esquerda (Estudo, Graus, Afinador Vocal) */}
          <div className="flex w-full items-center gap-1.5 pt-2.5 border-t border-border/50 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setStudyMode((v) => {
                  const next = !v;
                  setRevealedChords(new Set());
                  return next;
                });
              }}
              aria-label={studyMode ? "Desativar Modo Estudo" : "Ativar Modo Estudo"}
              title={studyMode ? "Desativar Modo Estudo (revelar tudo)" : "Ativar Modo Estudo (ocultar graus e notas)"}
              className={`flex h-8 items-center gap-1.5 px-3 rounded-full border text-[11px] sm:text-xs font-mono transition-transform active:scale-95 cursor-pointer shadow-xs shrink-0 ${
                studyMode
                  ? "border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold ring-2 ring-amber-500/30"
                  : "border-border bg-card text-muted-foreground hover:border-amber-500/50 hover:text-foreground"
              }`}
            >
              <GraduationCap className="size-3.5 text-amber-500 shrink-0" />
              <span>{t("studyModeBtn")}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDegrees((v) => !v)}
              aria-label={showDegrees ? "Ocultar graus na roda" : "Exibir graus na roda"}
              title={showDegrees ? "Ocultar graus na roda" : "Exibir graus na roda"}
              className={`flex h-8 items-center gap-1.5 px-3 rounded-full border text-[11px] sm:text-xs font-mono transition-transform active:scale-95 cursor-pointer shadow-xs shrink-0 ${
                showDegrees
                  ? "border-primary bg-primary/10 text-primary font-bold"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              <Layers className="size-3.5 shrink-0" />
              <span>{t("degreesBtn")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setVocalExpandTrigger((v) => v + 1);
                const el = document.getElementById("vocal-pitch-detector-section");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              aria-label="Ir para o Detector Vocal & Afinador"
              title="Detector de Tom Vocal & Afinador de Voz em Tempo Real"
              className="flex h-8 items-center gap-1.5 px-3 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[11px] sm:text-xs font-mono font-bold transition-transform active:scale-95 cursor-pointer shadow-xs shrink-0"
            >
              <Mic className="size-3.5 text-amber-500 shrink-0" />
              <span>{t("vocalTunerBtn")}</span>
            </button>
          </div>
        </header>

        {/* Mode Selector [ CAMPO MAIOR | CAMPO MENOR ] */}
        <section className="mt-4 flex w-full justify-center">
          <div className="flex w-full max-w-[320px] items-center rounded-xl bg-card border-2 border-border p-1 shadow-sm">
            <button
              type="button"
              onClick={() => handleModeChange("major")}
              className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer text-center select-none ${
                mode === "major"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              {t("majorField")}
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("minor")}
              className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer text-center select-none ${
                mode === "minor"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              {t("minorField")}
            </button>
          </div>
        </section>

        {/* Feature 2: Chord Type Selector [ Tríades (3 notas) | Tétrades (com 7ª) ] */}
        <section className="mt-2.5 flex w-full justify-center">
          <div className="flex w-full max-w-[300px] items-center rounded-lg bg-card/80 border border-border/80 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleChordTypeChange("triad")}
              className={`flex-1 py-1.5 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer text-center select-none ${
                chordType === "triad"
                  ? "bg-foreground text-background font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("triads")}
            </button>
            <button
              type="button"
              onClick={() => handleChordTypeChange("tetrad")}
              className={`flex-1 py-1.5 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer text-center select-none ${
                chordType === "tetrad"
                  ? "bg-foreground text-background font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("tetrads")}
            </button>
          </div>
        </section>

        {/* Legenda de notas superior: Segue a ordem exata da roda (C, G, D, A, E, B...) adaptando para Tríades ou Tétrades */}
        <section className="mt-3 w-full">
          <div className="grid w-full grid-cols-12 gap-0.5 sm:gap-1">
            {FIELDS.map((f, kIdx) => {
              const isSelected = kIdx === index;
              const keyLabel =
                chordType === "tetrad"
                  ? mode === "major"
                    ? f.majorTetrads[0]
                    : f.minorTetrads[0]
                  : mode === "major"
                  ? f.majorKey
                  : f.minorKey;

              const isSelectedKey = isSelected && (!studyMode || revealedChords.has(0));

              return (
                <button
                  key={kIdx}
                  type="button"
                  onClick={() => handleKeyChange(kIdx)}
                  title={`Selecionar tonalidade ${keyLabel}`}
                  className={`flex h-8 items-center justify-center rounded-md font-mono text-[7.5px] sm:text-[9.5px] font-semibold tracking-tighter transition-all cursor-pointer select-none px-0.5 ${
                    isSelectedKey
                      ? "bg-primary text-primary-foreground font-bold shadow-xs scale-105 z-10"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                  }`}
                >
                  {keyLabel}
                </button>
              );
            })}
          </div>
        </section>

        {/* Harmonic Wheel with Semi-Circle Side Arrow Tabs (Outward Half-Circles) */}
        <section className="relative mt-2 w-full flex items-center justify-center">
          {/* Left Semi-Circle Arrow Tab (Outward Half-Circle) */}
          <button
            type="button"
            onClick={() => handleKeyChange(index - 1)}
            aria-label="Tonalidade anterior"
            title="Girar para o tom anterior (Esquerda)"
            className="absolute left-0 sm:-left-2 z-10 flex h-12 sm:h-14 w-7 sm:w-8 items-center justify-center rounded-l-full border-2 border-r-0 border-primary bg-primary/15 text-primary backdrop-blur-xs shadow-md transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground active:scale-95 cursor-pointer shadow-primary/20 pl-0.5"
          >
            <ChevronLeft className="size-5 sm:size-6 stroke-[2.5]" />
          </button>

          {/* Harmonic Wheel in Original Full 340px Size */}
          <HarmonicWheel
            index={index}
            onIndexChange={handleKeyChange}
            showDegrees={showDegrees}
            mode={mode}
            chordType={chordType}
            studyMode={studyMode}
            isTonicRevealed={!studyMode || revealedChords.has(0)}
            onCenterClick={() => {
              if (studyMode) {
                setRevealedChords((prev) => new Set(prev).add(0));
              }
              if (soundOn) {
                const tonicChord = fieldData.chords[0];
                if (tonicChord) {
                  playChord(tonicChord.notes, instrument);
                }
              }
            }}
          />

          {/* Right Semi-Circle Arrow Tab (Outward Half-Circle) */}
          <button
            type="button"
            onClick={() => handleKeyChange(index + 1)}
            aria-label="Próxima tonalidade"
            title="Girar para o próximo tom (Direita)"
            className="absolute right-0 sm:-right-2 z-10 flex h-12 sm:h-14 w-7 sm:w-8 items-center justify-center rounded-r-full border-2 border-l-0 border-primary bg-primary/15 text-primary backdrop-blur-xs shadow-md transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground active:scale-95 cursor-pointer shadow-primary/20 pr-0.5"
          >
            <ChevronRight className="size-5 sm:size-6 stroke-[2.5]" />
          </button>
        </section>

        {/* Key Readout Indicator */}
        <div className="mt-3 flex w-full items-center justify-center">
          <div className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-1.5 shadow-2xs">
            <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-foreground select-none">
              {fieldData.tonicName} ({mode === "major" ? t("major") : t("minor")})
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="font-mono text-[10px] text-muted-foreground font-semibold">
              {String(index + 1).padStart(2, "0")} / 12
            </span>
          </div>
        </div>

        {/* Readout Table: Campo Harmônico com Graus em Números Romanos Maiúsculos */}
        <section className="mt-5 w-full space-y-3 animate-[slide-up_0.6s_var(--ease-out-expo)_both]">
          <div className="flex flex-col gap-1 border-b border-border pb-2.5 w-full">
            {/* Linha 1: Campo Harmônico Maior/Menor em uma única linha */}
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap block">
              {fieldData.modeLabel}
            </span>

            {/* Linha 2: Tonalidade na frente e Relativa ao final da mesma linha */}
            <div className="flex items-baseline justify-between gap-2 w-full pt-0.5">
              <span className="font-display text-lg sm:text-xl uppercase leading-none tracking-tight text-foreground shrink-0">
                {studyMode ? t("hiddenTonality") : `${t("tonality")}: ${fieldData.tonicName}`}
              </span>
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-primary font-bold whitespace-nowrap text-right">
                {studyMode ? t("studyTitle") : fieldData.relativeName}
              </span>
            </div>
          </div>

          {/* Study Mode Info Banner */}
          {studyMode && (
            <div className="flex items-start justify-between gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300 animate-[fade-in_0.3s_both]">
              <div className="flex items-start gap-2">
                <GraduationCap className="size-4 shrink-0 mt-0.5 text-amber-500" />
                <div className="leading-tight">
                  <span className="font-bold">{t("modeEstudoActive")}:</span> {t("studyModeActiveNote")}
                </div>
              </div>
              {revealedChords.size > 0 && (
                <button
                  type="button"
                  onClick={() => setRevealedChords(new Set())}
                  className="text-[11px] font-mono underline hover:text-foreground cursor-pointer shrink-0 ml-1 text-amber-600 dark:text-amber-400"
                >
                  {t("hideAll")}
                </button>
              )}
            </div>
          )}

          {/* Contextual Harmonic Tips (appears after 10s of inactivity in Study Mode) */}
          {studyMode && showStudyHint && (
            <StudyHarmonicTips
              mode={mode}
              chordType={chordType}
              chords={fieldData.chords}
              selectedChordIndex={selectedChordIndex}
              revealedChords={revealedChords}
              onSelectChord={(di) => {
                setRevealedChords((prev) => new Set(prev).add(di));
                handleChordClick(di, fieldData.chords[di]?.notes || []);
              }}
              onPlayChord={(notes) => {
                playChord(notes, instrument);
              }}
              onDismiss={() => {
                setShowStudyHint(false);
                resetStudyInactivityTimer();
              }}
              soundOn={soundOn}
            />
          )}

          {/* 7 Diatonic Chords with Roman Numerals Only (I, II, III, IV, V, VI, VII) */}
          <div className="grid grid-cols-7 gap-1">
            {fieldData.chords.map((item, di) => {
              const isTonic = item.isTonic;
              const isPlayingHighlight = playingDegreeIndex === di;
              const isClickActive = activeChordIndex === di;
              const isSelected = selectedChordIndex === di;
              const isChordRevealed = !studyMode || revealedChords.has(di);
              const isHighlighted = isPlayingHighlight || isClickActive;
              const isDownbeat = isPlayingHighlight && (playingBeat === 0 || playingBeat === null);

              return (
                <button
                  key={`${item.romanDegree}-${item.chord}`}
                  type="button"
                  onClick={() => handleChordClick(di, item.notes)}
                  title={
                    studyMode
                      ? `Ouvir acorde ${di + 1} e identificar no Modo Estudo`
                      : `Ver diagrama e ouvir acorde ${item.chord} (${item.romanDegree}) com ${instrument === "guitar" ? "Violão" : "Teclado"}`
                  }
                  className={`relative overflow-hidden flex flex-col items-center rounded-md py-2.5 px-0.5 transition-all duration-100 cursor-pointer ${
                    isPlayingHighlight
                      ? isDownbeat
                        ? "border-primary bg-primary text-primary-foreground shadow-lg scale-108 ring-4 ring-primary/60 z-20"
                        : "border-primary bg-primary text-primary-foreground shadow-md scale-104 ring-2 ring-primary/40 z-20"
                      : isClickActive
                      ? "border-primary bg-primary text-primary-foreground shadow-md scale-105 ring-2 ring-primary/40 z-10"
                      : isSelected
                      ? "border-2 border-primary bg-primary/15 text-foreground ring-2 ring-primary/30 shadow-xs z-10 scale-[1.02]"
                      : isTonic && !studyMode
                      ? "bg-foreground text-background shadow-xs hover:opacity-90 ring-1 ring-foreground"
                      : "border border-border bg-card hover:border-primary/60 text-foreground"
                  } active:scale-95`}
                >
                  {/* Expanding beat pulse ripple on each tempo beat */}
                  {isPlayingHighlight && (
                    <span
                      key={`field-beat-${di}-${playingBeat}`}
                      className={`pointer-events-none absolute inset-0 rounded-md ${
                        isDownbeat
                          ? "bg-primary-foreground/25 animate-[chord-downbeat_0.32s_ease-out_both]"
                          : "bg-primary-foreground/15 animate-[chord-beat_0.25s_ease-out_both]"
                      }`}
                    />
                  )}

                  <span
                    className={`font-mono text-[11px] font-bold mb-1 ${
                      isHighlighted
                        ? "text-primary-foreground opacity-95"
                        : isSelected
                        ? "text-primary font-extrabold"
                        : isTonic && !studyMode
                        ? "text-background opacity-90"
                        : "text-primary"
                    }`}
                  >
                    {item.romanDegree}
                  </span>
                  <span
                    className={`leading-tight ${
                      isHighlighted
                        ? "font-display text-sm sm:text-base text-primary-foreground"
                        : isSelected
                        ? "font-display text-sm sm:text-base font-extrabold text-foreground"
                        : isTonic && !studyMode
                        ? "font-display text-sm sm:text-base text-background"
                        : "font-sans text-xs sm:text-sm font-bold text-foreground"
                    }`}
                  >
                    {isChordRevealed ? item.chord : "???"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1">
              <Music className="size-3 text-primary inline" />
              {studyMode
                ? t("studyModeHint")
                : `${t("clickChordToSee")} (${chordType === "tetrad" ? "4" : "3"} · ${instrument === "guitar" ? t("guitar") : t("piano")})`}
            </span>
            <span className="text-primary font-bold">
              {studyMode ? t("studyTitle") : t("standardDegrees")}
            </span>
          </div>

          {/* Interactive Chord Diagram (Piano / Guitar) */}
          {selectedChordIndex !== null && fieldData.chords[selectedChordIndex] ? (
            <ChordDiagramInspector
              key={`${index}-${mode}-${chordType}-${selectedChordIndex}`}
              chord={fieldData.chords[selectedChordIndex].chord}
              romanDegree={fieldData.chords[selectedChordIndex].romanDegree}
              degreeIndex={selectedChordIndex}
              notes={fieldData.chords[selectedChordIndex].notes}
              chordType={chordType}
              instrument={instrument}
              onInstrumentChange={handleInstrumentChange}
              onClose={() => setSelectedChordIndex(null)}
              soundOn={soundOn}
              tonicKey={fieldData.tonicName}
              isMinor={mode === "minor"}
              studyMode={studyMode && !revealedChords.has(selectedChordIndex)}
              allFieldChords={allFieldChordNames}
              scaleChords={fieldData.chords}
              initialInversion={inversionsMap[selectedChordIndex] ?? 0}
              onInversionChange={(inv) => {
                if (selectedChordIndex !== null) {
                  setInversionsMap((prev) => ({ ...prev, [selectedChordIndex]: inv }));
                }
              }}
              onChordSolved={(degIdx) => {
                setRevealedChords((prev) => new Set(prev).add(degIdx));
              }}
            />
          ) : (
            <div className="mt-3.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 rounded-xl border border-dashed border-border/80 bg-card/60 px-4 py-3 text-xs text-muted-foreground animate-[fade-in_0.25s_both]">
              <div className="flex items-center gap-2">
                <Music className="size-4 text-primary shrink-0" />
                <span>
                  Diagrama fechado. Clique em qualquer acorde acima para ver suas notas e posições.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const targetIdx = lastSelectedChordIndex ?? 0;
                  setSelectedChordIndex(targetIdx);
                  const targetChord = fieldData.chords[targetIdx];
                  if (soundOn && targetChord) {
                    const inv = inversionsMap[targetIdx] ?? 0;
                    const shape = getGuitarChordShape(targetChord.chord, inv);
                    const toPlay = instrument === "guitar"
                      ? getGuitarChordMidis(shape)
                      : getInvertedVoicing(targetChord.notes, inv);
                    playChord(toPlay, instrument);
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary/15 border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/25 transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <span>Reabrir Diagrama ({fieldData.chords[lastSelectedChordIndex ?? 0]?.chord ?? "I"})</span>
              </button>
            </div>
          )}
        </section>

        {/* Detector de Tom Vocal & Afinador em Tempo Real com Ponteiro */}
        <section id="vocal-pitch-detector-section" className="mt-5 w-full">
          <VocalPitchDetector
            currentField={fieldData}
            currentMode={mode}
            instrument={instrument}
            soundOn={soundOn}
            expandTrigger={vocalExpandTrigger}
            onApplyKey={(keyIndex, newMode) => {
              handleKeyChange(keyIndex);
              if (newMode !== mode) {
                handleModeChange(newMode);
              }
            }}
          />
        </section>



        {/* Mapa Visual de Acordes (Atlas Harmônico Completo - Teclado & Violão) */}
        <section className="mt-5 w-full">
          <ChordMapAtlas
            field={fieldData}
            mode={mode}
            chordType={chordType}
            instrument={instrument}
            onInstrumentChange={handleInstrumentChange}
            inversionsMap={inversionsMap}
            onInversionChange={(degreeIdx, inv) => {
              setInversionsMap((prev) => ({ ...prev, [degreeIdx]: inv }));
            }}
            onSelectChord={(degreeIdx, inv) => {
              setSelectedChordIndex(degreeIdx);
              setLastSelectedChordIndex(degreeIdx);
              if (inv !== undefined) {
                setInversionsMap((prev) => ({ ...prev, [degreeIdx]: inv }));
              }
            }}
            selectedDegreeIndex={selectedChordIndex}
            soundOn={soundOn}
          />
        </section>

        {/* Calculadora de Capotraste Inteligente (Posições e Acordes para Violão) */}
        <section className="mt-5 w-full">
          <CapoCalculator
            field={fieldData}
            mode={mode}
            instrument={instrument}
            soundOn={soundOn}
          />
        </section>

        {/* Feature 1: Progressões Harmônicas Famosas & Criador Próprio com Player e Sequenciador */}
        <section className="mt-5 w-full">
          <ProgressionPlayer
            mode={mode}
            field={fieldData}
            soundOn={soundOn}
            instrument={instrument}
            onInstrumentChange={handleInstrumentChange}
            onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
            onPlayingDegreeChange={(deg, beat) => {
              setPlayingDegreeIndex(deg);
              setPlayingBeat(beat ?? null);
            }}
          />
        </section>

        {/* Feature 3: Treino Auditivo & Quiz Harmônico */}
        <section className="mt-5 w-full">
          <HarmonicQuiz
            currentKeyIndex={index}
            currentMode={mode}
            chordType={chordType}
            instrument={instrument}
            soundOn={soundOn}
          />
        </section>

        {/* Connectivity Offline Indicator */}
        <OfflineIndicator />

        {/* Accessible Audio Settings & Timbre Modal */}
        <AudioSettingsModal
          isOpen={isAudioSettingsOpen}
          onClose={() => setIsAudioSettingsOpen(false)}
          instrument={instrument}
          onInstrumentChange={handleInstrumentChange}
          masterVolume={masterVolume}
          onMasterVolumeChange={handleMasterVolumeChange}
          metronomeVolume={metronomeVolume}
          onMetronomeVolumeChange={handleMetronomeVolumeChange}
        />

        {/* Google Authentication Modal */}
        <LoginModal />
      </div>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </AuthProvider>
  );
}
