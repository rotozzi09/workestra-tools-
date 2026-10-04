import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Play,
  Square,
  Repeat,
  Music2,
  Sparkles,
  Timer,
  BellRing,
  Sliders,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Save,
  Copy,
  Check,
  FolderOpen,
  Wand2,
} from "lucide-react";
import {
  ActiveHarmonicField,
  MAJOR_PROGRESSIONS,
  MINOR_PROGRESSIONS,
  Mode,
  ROMAN_DEGREES,
  getPresetChordDisplay,
  getThirdNoteName,
} from "@/lib/harmony";
import { playChord, playMetronomeClick, Instrument, INSTRUMENTS } from "@/lib/sound";
import { PianoColorIcon, GuitarColorIcon } from "./InstrumentIcons";

export interface CustomStep {
  degIdx: number;
  displayLabel: string;
}

interface CustomProgression {
  id: string;
  name: string;
  degrees?: number[];
  steps?: CustomStep[];
  mode: Mode;
}

interface Props {
  mode: Mode;
  field: ActiveHarmonicField;
  soundOn: boolean;
  instrument: Instrument;
  onInstrumentChange: (inst: Instrument) => void;
  onPlayingDegreeChange?: (degreeIndex: number | null, beat?: number | null) => void;
  onOpenAudioSettings?: () => void;
}

export function ProgressionPlayer({
  mode,
  field,
  soundOn,
  instrument,
  onInstrumentChange,
  onPlayingDegreeChange,
  onOpenAudioSettings,
}: Props) {
  const { t } = useLanguage();
  const progressions = mode === "major" ? MAJOR_PROGRESSIONS : MINOR_PROGRESSIONS;

  const [activeTab, setActiveTab] = useState<"presets" | "custom">("presets");
  const [selectedPresetId, setSelectedPresetId] = useState<string>(progressions[0]!.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Custom Progression Builder state
  const [customSteps, setCustomSteps] = useState<CustomStep[]>([
    { degIdx: 0, displayLabel: "C" },
    { degIdx: 4, displayLabel: "G" },
    { degIdx: 5, displayLabel: "Am" },
    { degIdx: 3, displayLabel: "F" },
  ]);

  useEffect(() => {
    setCustomSteps([
      { degIdx: 0, displayLabel: field.chords[0]!.chord },
      { degIdx: 4, displayLabel: field.chords[4]!.chord },
      { degIdx: 5, displayLabel: field.chords[5]!.chord },
      { degIdx: 3, displayLabel: field.chords[3]!.chord },
    ]);
  }, [field]);

  const [customProgName, setCustomProgName] = useState<string>("Minha Música");
  const [savedCustomList, setSavedCustomList] = useState<CustomProgression[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("workestra_custom_progressions");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: "custom-1", name: "Louvor 1 (I - V - vi - IV)", steps: [{degIdx:0, displayLabel:"C"}, {degIdx:4, displayLabel:"G"}, {degIdx:5, displayLabel:"Am"}, {degIdx:3, displayLabel:"F"}], mode: "major" },
      { id: "custom-2", name: "Worship Forte (vi - IV - I - V)", steps: [{degIdx:5, displayLabel:"Am"}, {degIdx:3, displayLabel:"F"}, {degIdx:0, displayLabel:"C"}, {degIdx:4, displayLabel:"G"}], mode: "major" },
    ];
  });
  const [copiedNotification, setCopiedNotification] = useState(false);

  // BPM & Metronome State
  const [bpm, setBpm] = useState(80);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [timeSignature, setTimeSignature] = useState<"4/4" | "3/4" | "2/4" | "6/8" | "2/2" | "5/4" | "7/8" | "12/8">("4/4");

  const getBeatsForSig = (sig: string) => {
    switch (sig) {
      case "3/4": return 3;
      case "2/4": case "2/2": return 2;
      case "6/8": return 6;
      case "5/4": return 5;
      case "7/8": return 7;
      case "12/8": return 12;
      case "4/4": default: return 4;
    }
  };

  const beatsPerMeasure = getBeatsForSig(timeSignature);
  const beatsPerChord = beatsPerMeasure;

  // If mode changes, ensure we select the first preset of that mode
  useEffect(() => {
    setSelectedPresetId(progressions[0]!.id);
    stopPlayback();
  }, [mode]);

  const currentPreset =
    progressions.find((p) => p.id === selectedPresetId) || progressions[0]!;

  // Effective sequence of steps to play/display
  const effectiveSteps: CustomStep[] =
    activeTab === "presets"
      ? currentPreset.degrees.map((degIdx, stepIdx) => ({
          degIdx,
          displayLabel: getPresetChordDisplay(currentPreset.id, field, degIdx, stepIdx),
        }))
      : customSteps;

  const timerRef = useRef<number | null>(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const instrumentRef = useRef(instrument);
  instrumentRef.current = instrument;
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  const metronomeRef = useRef(metronomeOn);
  metronomeRef.current = metronomeOn;
  const isLoopingRef = useRef(isLooping);
  isLoopingRef.current = isLooping;
  const effectiveStepsRef = useRef(effectiveSteps);
  effectiveStepsRef.current = effectiveSteps;
  const timeSignatureRef = useRef(timeSignature);
  timeSignatureRef.current = timeSignature;

  const stopPlayback = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setActiveStepIndex(null);
    setCurrentBeat(0);
    onPlayingDegreeChange?.(null, null);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const playBeat = (beatNumber: number) => {
    if (!isPlayingRef.current) return;

    const sequence = effectiveStepsRef.current;
    const totalSteps = sequence.length;
    if (totalSteps === 0) {
      stopPlayback();
      return;
    }
    const currentSigBeats = getBeatsForSig(timeSignatureRef.current);
    const currentBeatsPerChord = currentSigBeats;
    const totalBeats = totalSteps * currentBeatsPerChord;

    if (beatNumber >= totalBeats) {
      if (isLoopingRef.current) {
        beatNumber = 0;
      } else {
        stopPlayback();
        return;
      }
    }

    const beatInChord = beatNumber % currentBeatsPerChord;
    const step = Math.floor(beatNumber / currentBeatsPerChord);

    // If it's the first beat of a chord, trigger chord sound & UI state
    if (beatInChord === 0) {
      setActiveStepIndex(step);
      const stepItem = sequence[step];
      if (stepItem) {
        const chordItem = field.chords[stepItem.degIdx];
        if (soundOn && chordItem) {
          playChord(chordItem.notes, instrumentRef.current);
        }
      }
    }

    const currentStepItem = sequence[step] ?? null;
    onPlayingDegreeChange?.(currentStepItem ? currentStepItem.degIdx : null, beatInChord);

    // If metronome is enabled, play click
    if (metronomeRef.current) {
      const isDownbeat = beatNumber % currentSigBeats === 0;
      playMetronomeClick(isDownbeat);
    }

    setCurrentBeat(beatNumber % currentSigBeats);

    // Schedule next beat based on current BPM
    const beatIntervalMs = (60 / bpmRef.current) * 1000;
    timerRef.current = window.setTimeout(() => {
      playBeat(beatNumber + 1);
    }, beatIntervalMs);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      if (effectiveSteps.length === 0) return;
      setIsPlaying(true);
      isPlayingRef.current = true;
      playBeat(0);
    }
  };

  const handleManualChordClick = (degreeIdx: number, stepIdx: number) => {
    setActiveStepIndex(stepIdx);
    onPlayingDegreeChange?.(degreeIdx, 0);
    setTimeout(() => {
      if (!isPlayingRef.current) {
        setActiveStepIndex(null);
        onPlayingDegreeChange?.(null, null);
      }
    }, 450);

    const chordItem = field.chords[degreeIdx];
    if (soundOn && chordItem) {
      playChord(chordItem.notes, instrument);
    }
  };

  // Custom Progression management
  const handleAddCustomStep = (degIdx: number, displayLabel?: string) => {
    if (customSteps.length >= 12) return;
    const label = displayLabel || field.chords[degIdx]!.chord;
    setCustomSteps((prev) => [...prev, { degIdx, displayLabel: label }]);
    if (soundOn && field.chords[degIdx]) {
      playChord(field.chords[degIdx]!.notes, instrument);
    }
  };

  const handleRemoveStep = (idx: number) => {
    setCustomSteps((prev) => prev.filter((_, i) => i !== idx));
    if (isPlaying) stopPlayback();
  };

  const handleSaveCustom = () => {
    if (customSteps.length === 0) return;
    const newProg: CustomProgression = {
      id: "custom-" + Date.now(),
      name: customProgName.trim() || `Progressão ${savedCustomList.length + 1}`,
      steps: [...customSteps],
      mode,
    };
    const updated = [newProg, ...savedCustomList];
    setSavedCustomList(updated);
    try {
      localStorage.setItem("workestra_custom_progressions", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCustom = (id: string) => {
    const updated = savedCustomList.filter((p) => p.id !== id);
    setSavedCustomList(updated);
    try {
      localStorage.setItem("workestra_custom_progressions", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadCustom = (prog: CustomProgression) => {
    stopPlayback();
    if (prog.steps) {
      setCustomSteps([...prog.steps]);
    } else if (prog.degrees) {
      setCustomSteps(prog.degrees.map((degIdx) => ({ degIdx, displayLabel: field.chords[degIdx]!.chord })));
    }
    setCustomProgName(prog.name);
  };

  const handleCopyProgression = () => {
    const seqChords = effectiveSteps.map((s) => s.displayLabel).join(" - ");
    const seqDegrees = effectiveSteps.map((s) => ROMAN_DEGREES[s.degIdx]).join(" - ");
    const text = `Workestra Tools: Tom ${field.tonicName} (${mode === "major" ? "Maior" : "Menor"})\nAcordes: ${seqChords}\nGraus: ${seqDegrees}\nBPM: ${bpm}`;

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="w-full rounded-2xl border border-border bg-card/60 p-4 shadow-xs backdrop-blur-xs">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border/60 pb-3 gap-2.5">
        <div
          onClick={() => setIsExpanded((v) => !v)}
          className="flex items-start gap-2.5 cursor-pointer select-none group min-w-0 flex-1"
        >
          <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors shrink-0 mt-0.5">
            <Music2 className="size-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h2 className="font-display text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
              {t("progressionTitle")}
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug mt-0.5">
              {t("progressionSubtitle")} — {t("realKey")}: {field.tonicName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {/* Loop Toggle */}
          <button
            type="button"
            onClick={() => setIsLooping((v) => !v)}
            title={isLooping ? "Repetição contínua ativada" : "Tocar uma vez"}
            className={`flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-mono transition-colors cursor-pointer ${
              isLooping
                ? "bg-primary/15 text-primary font-bold border border-primary/30"
                : "text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <Repeat className="size-3" />
            <span>Loop</span>
          </button>

          {/* Expand / Collapse Button */}
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            aria-label={isExpanded ? "Recolher módulo de progressões" : "Expandir módulo de progressões"}
            title={isExpanded ? "Recolher" : "Expandir"}
            className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="animate-[fade-in_0.25s_both] mt-3 space-y-3.5">
          {/* Top Switcher: [ Biblioteca de Louvores | Criar Própria ] */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center rounded-lg bg-muted/60 p-0.5 border border-border/80">
              <button
                type="button"
                onClick={() => {
                  stopPlayback();
                  setActiveTab("presets");
                }}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === "presets"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("presetsTab")}
              </button>
              <button
                type="button"
                onClick={() => {
                  stopPlayback();
                  setActiveTab("custom");
                }}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === "custom"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wand2 className="size-3" />
                {t("customTab")}
              </button>
            </div>

            {/* Copy / Export Progression */}
            <button
              type="button"
              onClick={handleCopyProgression}
              title="Copiar sequência de acordes"
              className="flex h-7 items-center gap-1 px-2.5 rounded-lg border border-border bg-card hover:border-primary/40 text-muted-foreground hover:text-foreground text-[10px] font-mono transition-all cursor-pointer"
            >
              {copiedNotification ? (
                <>
                  <Check className="size-3 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">{t("copied")}</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>{t("copyChords")}</span>
                </>
              )}
            </button>
          </div>

          {activeTab === "presets" ? (
            /* Preset Pills */
            <div className="flex w-full gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {progressions.map((p) => {
                const isSelected = p.id === currentPreset.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (p.id !== currentPreset.id) {
                        stopPlayback();
                        setSelectedPresetId(p.id);
                      }
                    }}
                    className={`flex flex-col items-start rounded-lg px-2.5 py-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs scale-102"
                        : "border-border bg-card/80 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <span className="font-mono text-[11px] leading-tight font-bold">
                      {p.name}
                    </span>
                    <span
                      className={`font-sans text-[9px] ${
                        isSelected ? "opacity-90" : "opacity-60"
                      }`}
                    >
                      {p.genre}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Custom Progression Builder Controls */
            <div className="space-y-3 rounded-xl bg-card border border-border p-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={customProgName}
                    onChange={(e) => setCustomProgName(e.target.value)}
                    placeholder={t("songNamePlaceholder")}
                    className="h-7 px-2 rounded-lg bg-background border border-border text-xs font-mono font-semibold text-foreground focus:border-primary focus:outline-none w-full sm:w-44"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    title="Salvar"
                    className="flex h-7 items-center gap-1 px-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-mono font-bold hover:bg-primary/90 transition-all cursor-pointer shrink-0"
                  >
                    <Save className="size-3" />
                    <span>{t("save")}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCustomSteps([]);
                    stopPlayback();
                  }}
                  title="Limpar"
                  className="flex h-7 items-center gap-1 px-2 rounded-lg text-[10px] font-mono text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3" />
                  <span>{t("clear")}</span>
                </button>
              </div>

              {/* Tap-to-add degree buttons */}
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">
                  {t("tapToAddDegree")} ({field.tonicName}):
                </span>
                <div className="grid grid-cols-7 gap-1">
                  {field.chords.map((ch, dIdx) => (
                    <button
                      key={dIdx}
                      type="button"
                      onClick={() => handleAddCustomStep(dIdx)}
                      className="p-1.5 rounded-lg border border-border bg-muted/40 hover:bg-primary/15 hover:border-primary/50 text-center transition-all cursor-pointer active:scale-95 group flex flex-col items-center"
                    >
                      <span className="font-mono text-[9px] font-bold text-primary">
                        {ch.romanDegree}
                      </span>
                      <span className="font-mono text-xs font-bold text-foreground truncate w-full">
                        {ch.chord}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slash Chords quick add row */}
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1.5 mt-2">
                  {t("slashChordsSubtitle")}
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                  {field.chords.map((ch, dIdx) => {
                    const root = ch.chord.match(/^[A-G][#b]?/)?.[0] || ch.chord;
                    const third = getThirdNoteName(root);
                    const slashName = `${ch.chord}/${third}`;
                    return (
                      <button
                        key={`slash-${dIdx}`}
                        type="button"
                        onClick={() => handleAddCustomStep(dIdx, slashName)}
                        className="p-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/25 text-center transition-all cursor-pointer active:scale-95 group flex flex-col items-center"
                        title={`Adicionar ${slashName}`}
                      >
                        <span className="font-mono text-[9px] font-bold text-primary">
                          {ch.romanDegree}/3
                        </span>
                        <span className="font-mono text-xs font-bold text-foreground truncate w-full">
                          {slashName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Saved User Progressions Chips */}
              {savedCustomList.length > 0 && (
                <div className="pt-2 border-t border-border/60">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">
                    {t("yourSavedProgressions")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {savedCustomList.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/60 border border-border text-[10px] font-mono font-semibold"
                      >
                        <button
                          type="button"
                          onClick={() => handleLoadCustom(item)}
                          className="hover:text-primary transition-colors cursor-pointer text-left"
                        >
                          {item.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustom(item.id)}
                          className="text-muted-foreground hover:text-red-500 p-0.5 rounded cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="size-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Sequence Display */}
          <div className="rounded-xl bg-background/60 p-3 border border-border/50">
            <div className="mb-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <Sparkles className="size-3 text-primary inline" />
                {activeTab === "presets" ? currentPreset.description : customProgName}
              </span>
              <span className="opacity-70">
                {effectiveSteps.length} {t("chordsWord")}
              </span>
            </div>

            {/* Chords Sequence Row */}
            {effectiveSteps.length === 0 ? (
              <div className="p-4 text-center text-xs font-mono text-muted-foreground border border-dashed border-border rounded-lg">
                {t("noChordsInSequence")}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
                {effectiveSteps.map(({ degIdx, displayLabel }, stepIdx) => {
                  const isStepActive = activeStepIndex === stepIdx;
                  const roman = ROMAN_DEGREES[degIdx];
                  const beatInChord = currentBeat % beatsPerChord;
                  const isDownbeat = isStepActive && isPlaying && beatInChord === 0;

                  return (
                    <div key={`${stepIdx}-${degIdx}`} className="flex flex-1 items-center min-w-[52px]">
                      <div className="relative flex flex-1 flex-col items-center">
                        <button
                          type="button"
                          onClick={() => handleManualChordClick(degIdx, stepIdx)}
                          title={`Tocar ${displayLabel} (${roman})`}
                          className={`relative overflow-hidden flex w-full flex-col items-center justify-center rounded-lg py-2 sm:py-2.5 transition-all duration-100 cursor-pointer border ${
                            isStepActive
                              ? isPlaying
                                ? isDownbeat
                                  ? "border-primary bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/60 scale-106 z-10"
                                  : "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40 scale-103 z-10"
                                : "border-primary bg-primary text-primary-foreground shadow-md scale-105 ring-2 ring-primary/40"
                              : "border-border bg-card text-foreground hover:border-primary/50"
                          }`}
                        >
                          {/* Beat pulse ripple */}
                          {isStepActive && isPlaying && (
                            <span
                              key={`beat-pulse-${stepIdx}-${currentBeat}`}
                              className={`pointer-events-none absolute inset-0 rounded-lg ${
                                isDownbeat
                                  ? "bg-primary-foreground/20 animate-[chord-downbeat_0.32s_ease-out_both]"
                                  : "bg-primary-foreground/10 animate-[chord-beat_0.25s_ease-out_both]"
                              }`}
                            />
                          )}

                          <span
                            className={`font-mono text-[10px] font-bold ${
                              isStepActive ? "opacity-90" : "text-primary"
                            }`}
                          >
                            {roman}
                          </span>
                          <span className="font-display text-xs sm:text-sm leading-tight truncate px-0.5">
                            {displayLabel}
                          </span>

                          {/* Pulsing rhythmic beat dots */}
                          {isStepActive && isPlaying && (
                            <div className="mt-1 flex items-center justify-center gap-1">
                              {Array.from({ length: beatsPerChord }).map((_, bIdx) => (
                                <span
                                  key={bIdx}
                                  className={`rounded-full transition-all duration-100 ${
                                    beatInChord === bIdx
                                      ? bIdx === 0
                                        ? "size-1.5 sm:size-2 bg-primary-foreground scale-125 shadow-xs"
                                        : "size-1.5 bg-primary-foreground scale-110"
                                      : "size-1 bg-primary-foreground/40"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </button>

                        {/* Remove button in custom tab */}
                        {activeTab === "custom" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveStep(stepIdx);
                            }}
                            className="mt-1 text-[9px] text-muted-foreground hover:text-red-500 cursor-pointer"
                            title="Remover este acorde"
                          >
                            × remover
                          </button>
                        )}
                      </div>

                      {stepIdx < effectiveSteps.length - 1 && (
                        <span className="px-1 text-muted-foreground/40 font-mono text-xs select-none">
                          →
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tempo (BPM) & Metrônomo Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background/50 px-3 py-2 border border-border/50">
            {/* Left: BPM adjustment (- / + buttons, display, and quick chips) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Timer className="size-3.5 text-primary" />
                <span className="font-mono text-xs font-bold text-foreground">
                  {bpm}{" "}
                  <span className="text-[10px] text-muted-foreground font-normal">
                    BPM
                  </span>
                </span>
              </div>

              {/* Steppers */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setBpm((b) => Math.max(40, b - 5))}
                  className="flex size-5 items-center justify-center rounded bg-card border border-border text-[11px] font-mono hover:border-primary/50 text-muted-foreground hover:text-foreground active:scale-95 cursor-pointer"
                  title="Diminuir 5 BPM (Mínimo 40)"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setBpm((b) => Math.min(220, b + 5))}
                  className="flex size-5 items-center justify-center rounded bg-card border border-border text-[11px] font-mono hover:border-primary/50 text-muted-foreground hover:text-foreground active:scale-95 cursor-pointer"
                  title="Aumentar 5 BPM (Até 220 BPM)"
                >
                  +
                </button>
              </div>

              {/* Quick preset chips */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-[210px] sm:max-w-none no-scrollbar">
                {[60, 80, 100, 120, 140, 160, 180].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBpm(preset)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer shrink-0 ${
                      bpm === preset
                        ? "bg-primary/20 text-primary font-bold border border-primary/40"
                        : "text-muted-foreground/60 hover:text-foreground hover:bg-card border border-transparent"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Time Signature selector, Rhythmic Beat Pulse & Metrônomo Toggle */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Time Signature selector */}
              <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background/80 p-0.5 overflow-x-auto max-w-[180px] sm:max-w-none no-scrollbar">
                {(["4/4", "3/4", "2/4", "6/8", "2/2", "5/4", "7/8", "12/8"] as const).map((sig) => (
                  <button
                    key={sig}
                    type="button"
                    onClick={() => setTimeSignature(sig)}
                    title={`Fórmula de compasso: ${sig}`}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer shrink-0 ${
                      timeSignature === sig
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {sig}
                  </button>
                ))}
              </div>

              {/* Visual Rhythmic Beat Pulse */}
              <div
                className="flex items-center gap-1 px-1"
                title={`Pulso do compasso (${timeSignature})`}
              >
                {Array.from({ length: beatsPerMeasure }).map((_, b) => (
                  <span
                    key={b}
                    className={`size-1.5 rounded-full transition-all duration-75 ${
                      isPlaying && currentBeat === b
                        ? b === 0
                          ? "bg-primary scale-150 shadow-[0_0_8px_rgba(235,94,40,0.9)]"
                          : "bg-foreground scale-125"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>

              {/* Metronome On/Off button */}
              <button
                type="button"
                onClick={() => setMetronomeOn((m) => !m)}
                title={
                  metronomeOn
                    ? "Metrônomo ativado (clique de madeira)"
                    : "Ativar clique do metrônomo"
                }
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-mono transition-all cursor-pointer ${
                  metronomeOn
                    ? "bg-primary text-primary-foreground font-bold shadow-xs scale-102"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                <BellRing className="size-3" />
                <span>Metrônomo</span>
              </button>
            </div>
          </div>

          {/* Bottom Action Controls: Instrument + Tocar Sequência */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
              {isPlaying ? (
                <span className="flex items-center gap-1 text-primary font-bold animate-pulse">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {bpm} BPM · {INSTRUMENTS.find((i) => i.id === instrument)?.name || "Teclado"}
                </span>
              ) : (
                <div className="flex items-center gap-1">
                  <span>Timbre:</span>
                  <span className="font-semibold text-foreground">
                    {INSTRUMENTS.find((i) => i.id === instrument)?.name || "Teclado"}
                  </span>
                </div>
              )}

              {onOpenAudioSettings && (
                <button
                  type="button"
                  onClick={onOpenAudioSettings}
                  title="Abrir configurações de áudio, volume e timbres"
                  aria-label="Abrir configurações de áudio"
                  className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right side controls: Quick instrument toggle + Play Button */}
            <div className="flex items-center gap-2.5">
              {/* Quick Instrument Icons */}
              <div className="flex items-center gap-2">
                {/* Teclado / Piano colorful icon */}
                <button
                  type="button"
                  onClick={() => onInstrumentChange("piano")}
                  aria-label="Selecionar Teclado"
                  title="Teclado / Piano Acústico"
                  className="group flex flex-col items-center justify-center bg-transparent border-0 p-0 shadow-none outline-none cursor-pointer"
                >
                  <PianoColorIcon active={instrument === "piano"} />
                  <span
                    className={`mt-1 h-0.5 w-3.5 rounded-full transition-all ${
                      instrument === "piano" ? "bg-red-500 opacity-100 shadow-[0_0_6px_rgba(239,68,68,0.7)]" : "opacity-0"
                    }`}
                  />
                </button>

                {/* Violão colorful icon */}
                <button
                  type="button"
                  onClick={() => onInstrumentChange("guitar")}
                  aria-label="Selecionar Violão"
                  title="Violão / Guitarra Acústica"
                  className="group flex flex-col items-center justify-center bg-transparent border-0 p-0 shadow-none outline-none cursor-pointer"
                >
                  <GuitarColorIcon active={instrument === "guitar"} />
                  <span
                    className={`mt-1 h-0.5 w-3.5 rounded-full transition-all ${
                      instrument === "guitar" ? "bg-amber-500 opacity-100 shadow-[0_0_6px_rgba(245,158,11,0.7)]" : "opacity-0"
                    }`}
                  />
                </button>

                {/* If synth is active */}
                {instrument !== "piano" && instrument !== "guitar" && (
                  <button
                    type="button"
                    onClick={onOpenAudioSettings}
                    title="Sintetizador ativo. Clique para alterar"
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-primary/10 text-primary border border-primary/30 font-bold"
                  >
                    Synth
                  </button>
                )}
              </div>

              {/* Tocar Sequência Button */}
              <button
                type="button"
                onClick={togglePlay}
                disabled={effectiveSteps.length === 0}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 sm:px-4 py-2 font-mono text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  isPlaying
                    ? "bg-red-500/15 text-red-500 border border-red-500/30 hover:bg-red-500/20"
                    : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95 disabled:opacity-50"
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="size-3.5 fill-current" />
                    <span>Parar</span>
                  </>
                ) : (
                  <>
                    <Play className="size-3.5 fill-current" />
                    <span>Tocar Sequência</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
