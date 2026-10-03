import React, { useState, useEffect, useMemo } from "react";
import { useLanguage, Language } from "../contexts/LanguageContext";
import { Volume2, Music, X, Play, BookOpen, GraduationCap, Eye, EyeOff, Sparkles, CheckCircle2, RotateCcw, RefreshCw, Info, ListMusic } from "lucide-react";
import { Instrument, playChord, playSuccessChime, playSoftMiss } from "../lib/sound";
import { ChordType, pitchOf } from "../lib/harmony";
import {
  analyzeChord,
  getGuitarChordShape,
  getGuitarChordMidis,
  getGuitarStringDetails,
  GuitarStringDetail,
  getInvertedChordDisplayName,
  getInvertedVoicing,
  GuitarChordShape,
  ChordAnalysis,
} from "../lib/chordDiagrams";
import { PianoColorIcon, GuitarColorIcon } from "./InstrumentIcons";

interface Props {
  chord: string;
  romanDegree: string;
  degreeIndex: number;
  notes: number[];
  chordType?: ChordType;
  instrument: Instrument;
  onInstrumentChange: (inst: Instrument) => void;
  onClose?: () => void;
  soundOn: boolean;
  tonicKey: string;
  isMinor: boolean;
  studyMode?: boolean;
  allFieldChords?: string[];
  scaleChords?: { romanDegree: string; chord: string }[];
  onChordSolved?: (degreeIndex: number) => void;
  initialInversion?: number;
  onInversionChange?: (inv: number) => void;
}

const DEGREE_FUNCTIONS: Record<string, Record<Language, { role: string; desc: string }>> = {
  I: {
    pt: { role: "Tônica (Centro Harmônico)", desc: "Sensação definitiva de repouso, estabilidade e conclusão." },
    en: { role: "Tonic (Harmonic Center)", desc: "Definite feeling of rest, stability and resolution." },
    es: { role: "Tónica (Centro Armónico)", desc: "Sensación definitiva de reposo, estabilidad y conclusión." },
  },
  II: {
    pt: { role: "Subdominante (Afastamento)", desc: "Prepara a tensão e conduz naturalmente para o Grau V (cadência II - V)." },
    en: { role: "Subdominant (Preparation)", desc: "Prepares tension and naturally leads to Degree V (II - V cadence)." },
    es: { role: "Subdominante (Preparación)", desc: "Prepara la tensión y conduce naturalmente al Grado V (cadencia II - V)." },
  },
  III: {
    pt: { role: "Função Tônica Secundária", desc: "Acorde intermediário suave, ponte harmônica entre graus principais." },
    en: { role: "Secondary Tonic Function", desc: "Soft intermediate chord, harmonic bridge between primary degrees." },
    es: { role: "Función Tónica Secundaria", desc: "Acorde intermedio suave, puente armónico entre grados principales." },
  },
  IV: {
    pt: { role: "Subdominante (Afastamento Moderado)", desc: "Sensação de movimento e expansão harmônica sem instabilidade excessiva." },
    en: { role: "Subdominant (Moderate Movement)", desc: "Sense of movement and harmonic expansion without excessive instability." },
    es: { role: "Subdominante (Movimiento Moderado)", desc: "Sensación de movimiento y expansión armónica sin inestabilidad excesiva." },
  },
  V: {
    pt: { role: "Dominante (Tensão Dinâmica)", desc: "Tensão máxima que pede resolução imediata na Tônica (Grau I)." },
    en: { role: "Dominant (Dynamic Tension)", desc: "Maximum tension demanding immediate resolution to Tonic (Degree I)." },
    es: { role: "Dominante (Tensión Dinámica)", desc: "Tensión máxima que pide resolución inmediata en la Tónica (Grado I)." },
  },
  VI: {
    pt: { role: "Relativo / Função Tônica", desc: "Sensação nostálgica ou agridoce, ponto de partida de baladas e melodias pop." },
    en: { role: "Relative / Tonic Function", desc: "Nostalgic or bittersweet feel, common starting point for ballads and pop." },
    es: { role: "Relativo / Función Tónica", desc: "Sensación melancólica o agridulce, punto de partida de baladas y pop." },
  },
  VII: {
    pt: { role: "Sensível / Tensão Máxima", desc: "Contém a sensível e o trítono, tensão aguda que se resolve na tônica." },
    en: { role: "Leading Tone / Peak Tension", desc: "Contains leading tone and tritone, sharp tension resolving to tonic." },
    es: { role: "Sensible / Tensión Máxima", desc: "Contiene la sensible y el tritono, tensión aguda que se resuelve en la tónica." },
  },
};

export function ChordDiagramInspector({
  chord,
  romanDegree,
  degreeIndex,
  notes,
  chordType,
  instrument,
  onInstrumentChange,
  onClose,
  soundOn,
  tonicKey,
  isMinor,
  studyMode = false,
  allFieldChords,
  scaleChords,
  onChordSolved,
  initialInversion = 0,
  onInversionChange,
}: Props) {
  const { language, t } = useLanguage();
  const [isPlayingArpeggio, setIsPlayingArpeggio] = useState(false);
  const [highlightedNoteIndex, setHighlightedNoteIndex] = useState<number | null>(null);

  // Map the 7 diatonic scale notes of the active tonality to their unique Roman degree (I, II, III, IV, V, VI, VII)
  const tonalityDegreesMap = useMemo(() => {
    const map: Record<number, string> = {};
    if (scaleChords && scaleChords.length > 0) {
      scaleChords.forEach((sc) => {
        const p = pitchOf(sc.chord);
        map[p] = sc.romanDegree; // Unique: "I", "II", "III", "IV", "V", "VI", "VII"
      });
    } else if (tonicKey) {
      // Fallback: standard 7 diatonic intervals for Major or Minor
      const tonicPitch = pitchOf(tonicKey);
      const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
      const degrees = ["I", "II", "III", "IV", "V", "VI", "VII"];
      intervals.forEach((interval, idx) => {
        const pitch = (tonicPitch + interval) % 12;
        map[pitch] = degrees[idx]!;
      });
    }
    return map;
  }, [scaleChords, tonicKey, isMinor]);

  // Study mode states
  const [isRevealed, setIsRevealed] = useState(!studyMode);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);
  const [guessStatus, setGuessStatus] = useState<"correct" | "wrong" | null>(null);
  const [choices, setChoices] = useState<string[]>([]);

  // Fixed multiple choice options: generated ONCE when a new chord/degree is loaded, never changing on clicks or re-renders
  useEffect(() => {
    if (studyMode) {
      setIsRevealed(false);
      setSelectedGuess(null);
      setGuessStatus(null);
    } else {
      setIsRevealed(true);
    }

    // Generate fixed 4 choices once for this chord
    if (allFieldChords && allFieldChords.length > 0) {
      const distractors = allFieldChords
        .filter((c) => c !== chord)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      const stableChoices = [...distractors, chord].sort(() => 0.5 - Math.random());
      setChoices(stableChoices);
    }
  }, [chord, degreeIndex, tonicKey, isMinor, chordType, studyMode]);

  const [inversion, setInversion] = useState(initialInversion ?? 0);
  const [guitarViewTab, setGuitarViewTab] = useState<"theory" | "strings">("theory");
  const [activeGuitarStringIdx, setActiveGuitarStringIdx] = useState<number | null>(null);

  useEffect(() => {
    setInversion(initialInversion ?? 0);
  }, [chord, degreeIndex, initialInversion]);

  const maxInv = notes.length > 0 ? notes.length : 1;
  const slashInfo = getInvertedChordDisplayName(chord, inversion, language);
  const guitarShape: GuitarChordShape = getGuitarChordShape(chord, inversion);
  const rotatedNotes = getInvertedVoicing(notes, inversion);
  const activeVoicingNotes = instrument === "guitar"
    ? getGuitarChordMidis(guitarShape)
    : rotatedNotes;

  const analysis: ChordAnalysis = analyzeChord(inversion > 0 ? slashInfo.slashChord : chord, rotatedNotes, language);
  const degreeInfo = DEGREE_FUNCTIONS[romanDegree]?.[language] ?? DEGREE_FUNCTIONS[romanDegree]?.pt ?? {
    role: t("degreeWord"),
    desc: "",
  };

  // Detailed string-by-string breakdown for guitar mode
  const guitarStringDetails: GuitarStringDetail[] = useMemo(() => {
    return getGuitarStringDetails(guitarShape, inversion > 0 ? slashInfo.slashChord : chord, language);
  }, [guitarShape, inversion, slashInfo.slashChord, chord, language]);

  const activeStrings = useMemo(() => {
    return guitarStringDetails.filter((s) => !s.isMuted && typeof s.midi === "number");
  }, [guitarStringDetails]);

  // Map each theoretical note to which guitar strings it sounds on
  const noteStringOccurrences = useMemo(() => {
    const map: Record<number, string[]> = {};
    activeStrings.forEach((s) => {
      if (s.pitchClass !== undefined) {
        if (!map[s.pitchClass]) map[s.pitchClass] = [];
        map[s.pitchClass]!.push(s.stringName);
      }
    });
    return map;
  }, [activeStrings]);

  // Play full chord with current instrument
  const handlePlayChord = () => {
    if (!soundOn) return;
    playChord(activeVoicingNotes, instrument);
  };

  // Play arpeggio note by note with synchronized visual strings and theoretical notes
  const handlePlayArpeggio = () => {
    if (!soundOn || isPlayingArpeggio) return;
    setIsPlayingArpeggio(true);

    if (instrument === "guitar") {
      activeStrings.forEach((s, idx) => {
        setTimeout(() => {
          setActiveGuitarStringIdx(s.stringIdx);
          // Highlight matching theoretical interval card in sync
          const pitchClass = s.midi! % 12;
          const matchIdx = analysis.notes.findIndex((n) => n.pitchClass === pitchClass);
          setHighlightedNoteIndex(matchIdx >= 0 ? matchIdx : null);
          playChord([s.midi!], "guitar");
        }, idx * 340);
      });

      setTimeout(() => {
        setActiveGuitarStringIdx(null);
        setHighlightedNoteIndex(null);
        setIsPlayingArpeggio(false);
      }, activeStrings.length * 340 + 200);
    } else {
      rotatedNotes.forEach((midi, idx) => {
        setTimeout(() => {
          setHighlightedNoteIndex(idx);
          playChord([midi], "piano");
        }, idx * 340);
      });

      setTimeout(() => {
        setHighlightedNoteIndex(null);
        setIsPlayingArpeggio(false);
      }, rotatedNotes.length * 340 + 200);
    }
  };

  // Handle quiz guess in study mode
  const handleGuess = (guess: string) => {
    setSelectedGuess(guess);
    if (guess === chord) {
      setGuessStatus("correct");
      if (soundOn) playSuccessChime();
      onChordSolved?.(degreeIndex);
      setTimeout(() => {
        setIsRevealed(true);
      }, 700);
    } else {
      setGuessStatus("wrong");
      if (soundOn) playSoftMiss();
    }
  };

  const handleDirectReveal = () => {
    setIsRevealed(true);
    onChordSolved?.(degreeIndex);
  };

  return (
    <div className="relative mt-4 w-full rounded-xl border border-primary/30 bg-card/95 p-4 sm:p-5 shadow-lg backdrop-blur-md animate-[slide-up_0.35s_var(--ease-out-expo)_both]">
      {/* Close button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar diagrama"
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer z-10"
        >
          <X className="size-4" />
        </button>
      )}

      {/* CHALLENGE VIEW: When Study Mode is active and chord is not yet revealed */}
      {studyMode && !isRevealed ? (
        <div className="flex flex-col items-center justify-center py-4 px-2 sm:px-4 text-center space-y-4 animate-[fade-in_0.3s_both]">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold shadow-xs">
            <GraduationCap className="size-4 text-amber-500" />
            <span>Modo Estudo Ativo · Desafio Harmônico</span>
          </div>

          <div className="space-y-1 max-w-md">
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Identifique o Acorde
            </h3>
            <p className="text-xs text-muted-foreground">
              Ouça o som ou observe a posição destacada no círculo de quintas (tom de <strong>{tonicKey} {isMinor ? "Menor" : "Maior"}</strong>).
            </p>
          </div>

          {/* Audio Listen Buttons & Instrument Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handlePlayChord}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer active:scale-95"
            >
              <Volume2 className="size-4" />
              <span>Ouvir Acorde ({instrument === "guitar" ? "Violão" : "Teclado"})</span>
            </button>

            <button
              type="button"
              onClick={handlePlayArpeggio}
              disabled={isPlayingArpeggio}
              className={`flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                isPlayingArpeggio
                  ? "bg-primary/10 text-primary border-primary/40"
                  : "text-foreground hover:border-primary/60 hover:text-primary active:scale-95"
              }`}
            >
              <Play className="size-3.5 fill-current" />
              <span>Ouvir Arpejo</span>
            </button>

            {/* Inline instrument switcher */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => onInstrumentChange("piano")}
                title="Ouvir no Teclado"
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs cursor-pointer transition-all ${
                  instrument === "piano" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <PianoColorIcon active={instrument === "piano"} className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onInstrumentChange("guitar")}
                title="Ouvir no Violão"
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs cursor-pointer transition-all ${
                  instrument === "guitar" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <GuitarColorIcon active={instrument === "guitar"} className="size-4" />
              </button>
            </div>
          </div>

          {/* Multiple choice quiz buttons */}
          <div className="w-full max-w-sm pt-2">
            <span className="font-mono text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block mb-2">
              {t("whichChordGuess")}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {choices.map((c) => {
                const isSelected = selectedGuess === c;
                const isCorrect = isSelected && guessStatus === "correct";
                const isWrong = isSelected && guessStatus === "wrong";

                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleGuess(c)}
                    className={`flex items-center justify-center py-2.5 px-3 rounded-lg border text-sm font-bold transition-all cursor-pointer ${
                      isCorrect
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400 scale-102"
                        : isWrong
                        ? "bg-destructive/15 text-destructive border-destructive/50"
                        : "bg-card border-border hover:border-primary/60 text-foreground hover:bg-muted/40"
                    } active:scale-95`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            {guessStatus === "wrong" && (
              <span className="mt-2.5 text-xs text-destructive font-medium block animate-bounce">
                {t("wrongGuessMsg")}
              </span>
            )}

            {guessStatus === "correct" && (
              <span className="mt-2.5 text-xs text-emerald-500 font-bold block animate-[fade-in_0.3s_both]">
                {t("correctGuessMsg")}
              </span>
            )}
          </div>

          {/* Reveal button */}
          <div className="pt-2 border-t border-border/60 w-full max-w-sm flex items-center justify-center">
            <button
              type="button"
              onClick={handleDirectReveal}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono transition-colors cursor-pointer py-1.5 px-3 rounded-md hover:bg-muted/50"
            >
              <Eye className="size-3.5" />
              <span>{t("revealDiagramBtn")}</span>
            </button>
          </div>
        </div>
      ) : (
        /* REVEALED VIEW: Full diagram and analysis */
        <>
          {/* Study Mode Revealed Banner */}
          {studyMode && (
            <div className="flex items-center justify-between mb-3 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium animate-[fade-in_0.3s_both]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>{t("chordRevealed")}: <strong>{chord}</strong> ({t("degreeWord")} {romanDegree} · {analysis.fullChordName})</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRevealed(false);
                  setSelectedGuess(null);
                  setGuessStatus(null);
                }}
                className="flex items-center gap-1 text-[11px] font-mono hover:underline cursor-pointer opacity-80 hover:opacity-100"
              >
                <EyeOff className="size-3" />
                <span>{t("hide")}</span>
              </button>
            </div>
          )}

          {/* Header with Chord Name, Degree & Instrument Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3.5 pr-7 sm:pr-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                  {t("degreeWord")} {romanDegree}
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-muted/80 text-foreground border border-border">
                  {notes.length >= 4 ? `${t("tetrads")} (4 ${t("notesWord")})` : `${t("triads")} (3 ${t("notesWord")})`}
                </span>
                <span className="text-xs font-bold text-foreground">
                  {analysis.fullChordName}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  · {degreeInfo.role}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <div className="flex items-baseline gap-1">
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-baseline">
                    <span>{chord}</span>
                    {inversion > 0 && (
                      <span className="text-xl sm:text-2xl text-primary font-mono font-bold tracking-tight">
                        /{slashInfo.bassNote}
                      </span>
                    )}
                  </h3>
                </div>

                {/* Inversion cycle button */}
                <button
                  type="button"
                  onClick={() => {
                    const nextInv = (inversion + 1) % maxInv;
                    setInversion(nextInv);
                    onInversionChange?.(nextInv);
                    const nextGuitarShape = getGuitarChordShape(chord, nextInv);
                    const nextNotes = instrument === "guitar"
                      ? getGuitarChordMidis(nextGuitarShape)
                      : getInvertedVoicing(notes, nextInv);
                    if (soundOn && nextNotes.length > 0) {
                      playChord(nextNotes, instrument);
                    }
                  }}
                  title={`${slashInfo.inversionLabel}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 text-xs font-mono font-bold transition-all cursor-pointer group/inv active:scale-95"
                >
                  <RefreshCw className="size-3.5 transition-transform duration-300 group-hover/inv:rotate-180" />
                  <span>{inversion === 0 ? t("rootPosition") : `${inversion}ª ${t("inversionNotice").split(" ")[0]}`}</span>
                  {inversion > 0 && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      (Bass: {slashInfo.bassNote})
                    </span>
                  )}
                </button>

                <span className="text-xs sm:text-sm font-semibold text-primary">
                  {analysis.formulaFullName}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  ({analysis.formula})
                </span>
              </div>

              {/* Educational callout badge when inversion is active */}
              {inversion > 0 && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-primary/10 border border-primary/25 p-2 text-xs text-foreground animate-[fade-in_0.25s_both]">
                  <Info className="size-4 text-primary shrink-0 mt-0.5" />
                  <div className="leading-tight">
                    <span className="font-bold text-primary">{t("inversionNotice")} ({slashInfo.slashChord}):</span> {instrument === "guitar" ? t("inversionNoticeGuitar") : t("inversionNoticePiano")}
                  </div>
                </div>
              )}
            </div>

            {/* Instrument Selector Toggle */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => onInstrumentChange("piano")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer ${
                  instrument === "piano"
                    ? "bg-card text-foreground shadow-xs border border-border/80 font-bold scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                }`}
              >
                <PianoColorIcon active={instrument === "piano"} className="size-5 transition-transform duration-200" />
                <span>{t("piano")}</span>
              </button>

              <button
                type="button"
                onClick={() => onInstrumentChange("guitar")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer ${
                  instrument === "guitar"
                    ? "bg-card text-foreground shadow-xs border border-border/80 font-bold scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                }`}
              >
                <GuitarColorIcon active={instrument === "guitar"} className="size-5 transition-transform duration-200" />
                <span>{t("guitar")}</span>
              </button>
            </div>
          </div>

          {/* Main Diagram Area: Guitar Fretboard OR Piano Keyboard with smooth fade & slide transition */}
          <div className="mt-4 flex flex-col md:flex-row items-center md:items-start justify-center gap-6">
            <div
              key={instrument}
              className="w-full md:w-auto flex flex-col items-center animate-instrument"
            >
              {instrument === "guitar" ? (
                <div className="flex flex-col items-center">
                  <span className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {t("guitarFretboardTitle")}
                  </span>
                  <GuitarFretboardView
                    shape={guitarShape}
                    chord={inversion > 0 ? slashInfo.slashChord : chord}
                    isHighlighting={isPlayingArpeggio}
                    activeStringIndex={activeGuitarStringIdx}
                    onPlayNote={(midi) => {
                      if (soundOn) playChord([midi], "guitar");
                    }}
                  />
                  <span className="mt-2 text-[10px] font-mono text-muted-foreground text-center">
                    {t("guitarFretboardSub")}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full max-w-[420px]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("keyboardHandTitle")}
                    </span>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {notes.length >= 4 ? `4 ${t("notesWord")}` : `3 ${t("notesWord")}`}
                    </span>
                  </div>
                  <PianoKeyboardView
                    notes={rotatedNotes}
                    analysis={analysis}
                    highlightedNoteIndex={highlightedNoteIndex}
                    tonalityDegreesMap={tonalityDegreesMap}
                    tonicKey={tonicKey}
                    onPlayNote={(midi) => {
                      if (soundOn) playChord([midi], "piano");
                    }}
                  />
                  <div className="mt-2.5 flex flex-col sm:flex-row items-center justify-between w-full px-2 gap-1 text-[11px] font-mono">
                    <span className="text-foreground font-semibold">
                      ✋ {t("rightHandFingers")}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {notes.length >= 4 ? t("simultaneous4") : t("simultaneous3")}
                    </span>
                  </div>
                  <div className="mt-1 text-[9.5px] font-mono text-muted-foreground text-center">
                    <span>
                      {t("keysTopNote")} <strong className="text-foreground font-bold">{tonicKey}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chord Structure & Theoretical Details */}
            <div className="flex flex-1 flex-col justify-between w-full space-y-3.5 border-t md:border-t-0 md:border-l border-border/60 pt-3 md:pt-0 md:pl-5">
              <div className="space-y-3">
                {/* Mode tabs switcher when Guitar is active */}
                {instrument === "guitar" ? (
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60 border border-border/60 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setGuitarViewTab("theory")}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                          guitarViewTab === "theory"
                            ? "bg-card text-foreground font-bold shadow-xs border border-border/70"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <ListMusic className="size-3.5 text-primary" />
                        <span>{t("theoreticalTriad")} ({analysis.notes.length} {t("notesWord")})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuitarViewTab("strings")}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                          guitarViewTab === "strings"
                            ? "bg-card text-foreground font-bold shadow-xs border border-border/70"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <GuitarColorIcon active={guitarViewTab === "strings"} className="size-3.5" />
                        <span>{t("on6Strings")} ({activeStrings.length} {t("sounding")})</span>
                      </button>
                    </div>

                    <span className="text-[11px] font-mono text-primary font-bold hidden sm:inline-block">
                      {analysis.notes.map((n) => `${n.ptName} (${n.noteName})`).join(" + ")}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {t("notesStructure")}
                    </span>
                    <span className="text-[11px] font-mono text-primary font-bold">
                      {analysis.notes.map((n) => `${n.ptName} (${n.noteName})`).join(" + ")}
                    </span>
                  </div>
                )}

                {/* Educational Beginner Alert: Explaining 3 notes vs 6 strings */}
                {instrument === "guitar" && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 p-2.5 text-xs text-foreground/90">
                    <div className="flex items-start gap-2">
                      <Sparkles className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-bold text-amber-600 dark:text-amber-400">
                          💡 {language === "en" ? `Educational Tip: Why does guitar play ${activeStrings.length} notes if chord has ${analysis.notes.length}?` : language === "es" ? `💡 Consejo Didáctico: ¿Por qué la guitarra toca ${activeStrings.length} notas si el acorde tiene ${analysis.notes.length}?` : `💡 Dica Didática: Por que o violão toca ${activeStrings.length} notas se o acorde tem ${analysis.notes.length}?`}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {language === "en" ? `In music theory, the ${inversion > 0 ? slashInfo.slashChord : chord} chord is composed essentially of the ${analysis.notes.length} triad notes (${analysis.notes.map((n) => n.ptName).join(" + ")}). On guitar, these notes are distributed and doubled in different octaves across the 6 strings for sustain, resonance, and acoustic volume.` : language === "es" ? `En la armonía musical, el acorde de ${inversion > 0 ? slashInfo.slashChord : chord} está compuesto esencialmente por las ${analysis.notes.length} notas de la tríada (${analysis.notes.map((n) => n.ptName).join(" + ")}). En la guitarra, estas notas se distribuyen y duplican en diferentes octavas a lo largo de las 6 cuerdas.` : `Na harmonia musical, o acorde de ${inversion > 0 ? slashInfo.slashChord : chord} é composto essencialmente pelas ${analysis.notes.length} notas da tríade (${analysis.notes.map((n) => n.ptName).join(" + ")}). No violão, essas notas são distribuídas e duplicadas em diferentes oitavas ao longo das 6 cordas para dar sustentação, ressonância e volume acústico.`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 1: Theoretical Structure (Tríade Teórica) */}
                {(instrument === "piano" || guitarViewTab === "theory") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2 animate-[fade-in_0.2s_both]">
                    {analysis.notes.map((n, idx) => {
                      const strings = noteStringOccurrences[n.pitchClass] ?? [];
                      return (
                        <div
                          key={`${n.noteName}-${idx}`}
                          className={`flex items-start gap-2.5 rounded-lg border p-2.5 transition-all ${
                            highlightedNoteIndex === idx
                              ? "border-primary bg-primary/15 text-foreground scale-[1.01] shadow-sm ring-2 ring-primary/40"
                              : "border-border bg-card/80 text-foreground"
                          }`}
                        >
                          {/* Left pill with Note letter & PT name */}
                          <div className="flex flex-col items-center justify-center rounded-md bg-muted/60 px-2 py-1 min-w-[42px] border border-border/60">
                            <span className="font-display text-base font-extrabold leading-tight text-primary">
                              {n.noteName}
                            </span>
                            <span className="text-[10px] font-semibold text-muted-foreground leading-none">
                              {n.ptName}
                            </span>
                          </div>

                          {/* Right description: Interval Name + Meaning + Guitar Cordas */}
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                  {n.intervalShort}
                                </span>
                                <span className="font-sans text-xs font-bold text-foreground truncate">
                                  {n.intervalName}
                                </span>
                              </div>
                              {instrument === "guitar" && strings.length > 0 && (
                                <span className="font-mono text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                                  {strings.length === 1 ? `${t("oneString")} ${strings[0]}` : `${strings.length} ${t("multipleStrings")} ${strings.join(", ")}`}
                                </span>
                              )}
                            </div>
                            <span className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                              {n.intervalRole}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* TAB 2: String-by-String Guitar Breakdown (Nas 6 Cordas do Violão) */}
                {instrument === "guitar" && guitarViewTab === "strings" && (
                  <div className="space-y-1.5 animate-[fade-in_0.2s_both]">
                    <div className="flex items-center justify-between px-1 text-[10.5px] font-mono text-muted-foreground">
                      <span>{t("stringNeck")}</span>
                      <span>{t("tapToPlaySingle")}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 max-h-[290px] overflow-y-auto pr-1">
                      {guitarStringDetails.map((s) => {
                        const isPlayingThisString = activeGuitarStringIdx === s.stringIdx;
                        return (
                          <div
                            key={`string-row-${s.stringIdx}`}
                            onClick={() => {
                              if (!s.isMuted && typeof s.midi === "number" && soundOn) {
                                playChord([s.midi], "guitar");
                                setActiveGuitarStringIdx(s.stringIdx);
                                setTimeout(() => setActiveGuitarStringIdx(null), 350);
                              }
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                              s.isMuted
                                ? "border-border/40 bg-muted/20 opacity-60 cursor-not-allowed"
                                : isPlayingThisString
                                ? "border-primary bg-primary/20 scale-[1.01] shadow-xs ring-2 ring-primary/50"
                                : "border-border/70 bg-card/80 hover:bg-muted/50 hover:border-primary/40"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {/* String label badge */}
                              <div
                                className={`flex items-center justify-center font-mono text-[11px] font-extrabold px-2 py-0.5 rounded border ${
                                  isPlayingThisString
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted text-foreground border-border/80"
                                }`}
                              >
                                {s.stringLabel}
                              </div>

                              {/* Fret / Finger info */}
                              <div className="flex flex-col">
                                <span className="font-mono text-[11px] font-semibold text-foreground">
                                  {s.isMuted
                                    ? t("mutedString")
                                    : s.isOpen
                                    ? t("openString")
                                    : `${t("fretWord")} ${s.fret}ª ${s.finger ? `· ${t("fingerWord")} ${s.finger}` : ""}`}
                                </span>
                                <span className="text-[9.5px] text-muted-foreground">
                                  {s.stringPtName}
                                </span>
                              </div>
                            </div>

                            {/* Resulting note & interval */}
                            {!s.isMuted && (
                              <div className="flex items-center gap-1.5">
                                <div className="flex flex-col items-end">
                                  <span className="font-display text-xs font-bold text-primary">
                                    {s.ptName} ({s.noteName}{s.octave})
                                  </span>
                                  <span className="font-mono text-[9.5px] text-muted-foreground">
                                    {s.intervalShort} · {s.intervalName?.split(" ")[0]}
                                  </span>
                                </div>
                                <Volume2 className={`size-3.5 ${isPlayingThisString ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Sound playback buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handlePlayChord}
                  className="flex-1 min-w-[130px] flex items-center justify-center gap-2 rounded-lg bg-primary py-2 px-3 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer active:scale-97"
                >
                  <Volume2 className="size-4" />
                  <span>{t("playChordBtn")} ({instrument === "guitar" ? t("guitar") : t("piano")})</span>
                </button>

                <button
                  type="button"
                  onClick={handlePlayArpeggio}
                  disabled={isPlayingArpeggio}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 px-3 text-xs font-semibold transition-all cursor-pointer ${
                    isPlayingArpeggio
                      ? "bg-primary/10 text-primary border-primary/40"
                      : "bg-card text-foreground hover:border-primary/60 hover:text-primary active:scale-97"
                  }`}
                >
                  <Play className="size-3.5 fill-current" />
                  <span>
                    {instrument === "guitar"
                      ? isPlayingArpeggio ? t("arpeggiatingStrings") : t("listenArpeggio")
                      : isPlayingArpeggio ? t("arpeggiatingNotes") : t("listenArpeggioPiano")}
                  </span>
                </button>
              </div>

              {/* Harmonic Context Quote */}
              <div className="rounded-lg bg-muted/40 p-2.5 border border-border/50 text-xs">
                <div className="flex items-start gap-1.5">
                  <BookOpen className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">
                      {t("roleInKey")} {tonicKey} {isMinor ? t("minor") : t("major")}:
                    </span>{" "}
                    <span className="text-muted-foreground">{degreeInfo.desc}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * High-definition SVG Guitar Chord Fretboard
 */
function GuitarFretboardView({
  shape,
  chord,
  isHighlighting,
  activeStringIndex: externalActiveStringIndex,
  onPlayNote,
}: {
  shape: GuitarChordShape;
  chord: string;
  isHighlighting: boolean;
  activeStringIndex?: number | null;
  onPlayNote?: (midi: number) => void;
}) {
  const [internalActiveStringIndex, setInternalActiveStringIndex] = useState<number | null>(null);
  const activeStringIndex =
    externalActiveStringIndex !== undefined && externalActiveStringIndex !== null
      ? externalActiveStringIndex
      : internalActiveStringIndex;

  const WIDTH = 180;
  const HEIGHT = 210;
  const TOP_Y = 40;
  const BOTTOM_Y = 185;
  const LEFT_X = 35;
  const RIGHT_X = 155;
  const NUM_FRETS = 5;
  const STRING_SPACING = (RIGHT_X - LEFT_X) / 5;
  const FRET_SPACING = (BOTTOM_Y - TOP_Y) / NUM_FRETS;

  const stringNames = ["E", "A", "D", "G", "B", "e"];
  const stringNamesPt = ["6ª Corda (Mi grave)", "5ª Corda (Lá)", "4ª Corda (Ré)", "3ª Corda (Sol)", "2ª Corda (Si)", "1ª Corda (Mi agudo)"];
  const OPEN_STRINGS_MIDI = [40, 45, 50, 55, 59, 64];
  const isNut = shape.baseFret === 1;

  const handleStringClick = (sIdx: number) => {
    const f = shape.frets[sIdx];
    if (f === "x") {
      setInternalActiveStringIndex(sIdx);
      setTimeout(() => setInternalActiveStringIndex(null), 250);
      return;
    }
    const fretNum = typeof f === "number" ? f : 0;
    const midi = OPEN_STRINGS_MIDI[sIdx]! + fretNum;
    setInternalActiveStringIndex(sIdx);
    setTimeout(() => setInternalActiveStringIndex(null), 350);
    onPlayNote?.(midi);
  };

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-[180px] h-[210px] select-none touch-none drop-shadow-xs"
    >
      {/* Base Fret indicator (e.g. 3ª casa) if higher up the neck */}
      {!isNut && (
        <text
          x={LEFT_X - 10}
          y={TOP_Y + FRET_SPACING / 2 + 4}
          textAnchor="end"
          className="font-mono text-[10px] font-bold fill-primary"
        >
          {shape.baseFret}ª
        </text>
      )}

      {/* Top Nut or first fret line */}
      {isNut ? (
        <rect
          x={LEFT_X - 1.5}
          y={TOP_Y - 4}
          width={RIGHT_X - LEFT_X + 3}
          height={4.5}
          rx={1}
          className="fill-foreground/80 stroke-foreground"
          strokeWidth={0.5}
        />
      ) : (
        <line
          x1={LEFT_X}
          y1={TOP_Y}
          x2={RIGHT_X}
          y2={TOP_Y}
          className="stroke-foreground/60"
          strokeWidth={2}
        />
      )}

      {/* Horizontal Fret Lines */}
      {Array.from({ length: NUM_FRETS }).map((_, fIdx) => {
        const y = TOP_Y + (fIdx + 1) * FRET_SPACING;
        return (
          <line
            key={`fret-${fIdx}`}
            x1={LEFT_X}
            y1={y}
            x2={RIGHT_X}
            y2={y}
            className="stroke-border"
            strokeWidth={1.5}
          />
        );
      })}

      {/* Vertical Strings (from 6th low E to 1st high e) */}
      {Array.from({ length: 6 }).map((_, sIdx) => {
        const x = LEFT_X + sIdx * STRING_SPACING;
        const isActive = activeStringIndex === sIdx;
        // Thicker stroke for lower strings, with glow when plucked
        const sWidth = isActive ? 3.6 : (2.4 - sIdx * 0.28);
        return (
          <line
            key={`string-${sIdx}`}
            x1={x}
            y1={TOP_Y}
            x2={x}
            y2={BOTTOM_Y}
            className={`transition-all duration-150 ${
              isActive ? "stroke-primary" : "stroke-foreground/65"
            }`}
            strokeWidth={sWidth}
          />
        );
      })}

      {/* String Tuning Labels at bottom (Clickable) */}
      {stringNames.map((sName, sIdx) => {
        const x = LEFT_X + sIdx * STRING_SPACING;
        const isActive = activeStringIndex === sIdx;
        return (
          <text
            key={`sname-${sIdx}`}
            x={x}
            y={BOTTOM_Y + 16}
            textAnchor="middle"
            onClick={() => handleStringClick(sIdx)}
            className={`font-mono text-[9px] cursor-pointer transition-colors ${
              isActive ? "fill-primary font-bold" : "fill-muted-foreground hover:fill-foreground"
            }`}
          >
            {sName}
          </text>
        );
      })}

      {/* Top markers (O for open, X for muted) - Clickable */}
      {shape.frets.map((f, sIdx) => {
        const x = LEFT_X + sIdx * STRING_SPACING;
        const y = TOP_Y - 12;
        const isActive = activeStringIndex === sIdx;

        if (f === "x") {
          return (
            <text
              key={`marker-x-${sIdx}`}
              x={x}
              y={y + 3}
              textAnchor="middle"
              onClick={() => handleStringClick(sIdx)}
              className="font-mono text-[12px] font-extrabold fill-destructive cursor-pointer hover:opacity-80"
            >
              ✕
            </text>
          );
        }
        if (f === 0) {
          return (
            <circle
              key={`marker-o-${sIdx}`}
              cx={x}
              cy={y}
              r={isActive ? 5 : 3.8}
              fill={isActive ? "var(--color-primary)" : "none"}
              className="stroke-primary cursor-pointer transition-all hover:scale-125"
              strokeWidth={1.5}
              onClick={() => handleStringClick(sIdx)}
            />
          );
        }
        return null;
      })}

      {/* Barre indicator pill if chord has barre */}
      {shape.barre && (
        (() => {
          const bFret = shape.barre.fret;
          // Calculate relative fret offset
          const relFret = isNut ? bFret : bFret - shape.baseFret + 1;
          if (relFret >= 1 && relFret <= NUM_FRETS) {
            const y = TOP_Y + (relFret - 0.5) * FRET_SPACING;
            const x1 = LEFT_X + (6 - shape.barre.fromString) * STRING_SPACING;
            const x2 = LEFT_X + (6 - shape.barre.toString) * STRING_SPACING;
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);

            return (
              <g key="barre-pill">
                <rect
                  x={minX - 5}
                  y={y - 6}
                  width={maxX - minX + 10}
                  height={12}
                  rx={6}
                  className="fill-primary/80"
                />
                <text
                  x={(minX + maxX) / 2}
                  y={y + 3}
                  textAnchor="middle"
                  className="font-mono text-[8px] font-bold fill-primary-foreground pointer-events-none"
                >
                  1
                </text>
              </g>
            );
          }
          return null;
        })()
      )}

      {/* Finger dots - Clickable with plucked pulse */}
      {shape.frets.map((f, sIdx) => {
        if (typeof f !== "number" || f <= 0) return null;

        const relFret = isNut ? f : f - shape.baseFret + 1;
        if (relFret < 1 || relFret > NUM_FRETS) return null;

        const x = LEFT_X + sIdx * STRING_SPACING;
        const y = TOP_Y + (relFret - 0.5) * FRET_SPACING;
        const fingerNum = shape.fingers ? shape.fingers[sIdx] : 0;
        const isActive = activeStringIndex === sIdx;

        return (
          <g
            key={`dot-${sIdx}-${f}`}
            onClick={() => handleStringClick(sIdx)}
            className="cursor-pointer group"
          >
            {/* Visual ripple ring on tap */}
            {isActive && (
              <circle
                cx={x}
                cy={y}
                r={12}
                className="fill-primary/20 stroke-primary animate-ping pointer-events-none"
                strokeWidth={1}
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={isActive ? 9 : 7.5}
              className={`fill-primary stroke-card transition-all duration-150 ${
                isActive ? "scale-110 drop-shadow-md" : "group-hover:scale-110"
              }`}
              strokeWidth={1.5}
            />
            {fingerNum && fingerNum > 0 ? (
              <text
                x={x}
                y={y + 3}
                textAnchor="middle"
                className="font-mono text-[9px] font-bold fill-primary-foreground pointer-events-none"
              >
                {fingerNum}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Broad invisible hitboxes for easy string tapping on touch devices */}
      {Array.from({ length: 6 }).map((_, sIdx) => {
        const x = LEFT_X + sIdx * STRING_SPACING;
        return (
          <rect
            key={`hitbox-${sIdx}`}
            x={x - 9}
            y={TOP_Y - 14}
            width={18}
            height={BOTTOM_Y - TOP_Y + 34}
            fill="transparent"
            className="cursor-pointer hover:fill-primary/10 transition-colors"
            onClick={() => handleStringClick(sIdx)}
          >
            <title>{stringNamesPt[sIdx]}</title>
          </rect>
        );
      })}
    </svg>
  );
}

/**
 * Realistic 2-Octave SVG Piano Keyboard Diagram
 */
function PianoKeyboardView({
  notes,
  analysis,
  highlightedNoteIndex,
  tonalityDegreesMap,
  tonicKey,
  onPlayNote,
}: {
  notes: number[];
  analysis: ChordAnalysis;
  highlightedNoteIndex: number | null;
  tonalityDegreesMap?: Record<number, string>;
  tonicKey?: string;
  onPlayNote?: (midi: number) => void;
}) {
  // We represent 2 octaves from C3 (MIDI 48) to C5 (MIDI 72) = 25 keys (15 white keys, 10 black keys)
  // White keys layout:
  // Octave 1: C3, D3, E3, F3, G3, A3, B3 (7)
  // Octave 2: C4, D4, E4, F4, G4, A4, B4 (7)
  // End key: C5 (1)
  const WHITE_KEYS = [
    { note: "C", midi: 48, label: "C3" },
    { note: "D", midi: 50 },
    { note: "E", midi: 52 },
    { note: "F", midi: 53 },
    { note: "G", midi: 55 },
    { note: "A", midi: 57 },
    { note: "B", midi: 59 },
    { note: "C", midi: 60, label: "C4" },
    { note: "D", midi: 62 },
    { note: "E", midi: 64 },
    { note: "F", midi: 65 },
    { note: "G", midi: 67 },
    { note: "A", midi: 69 },
    { note: "B", midi: 71 },
    { note: "C", midi: 72, label: "C5" },
  ];

  // Black keys positions relative to white keys (0-indexed):
  // C#3 is between C(0) and D(1)
  const BLACK_KEYS = [
    { note: "C#", midi: 49, afterWhiteIndex: 0 },
    { note: "D#", midi: 51, afterWhiteIndex: 1 },
    { note: "F#", midi: 54, afterWhiteIndex: 3 },
    { note: "G#", midi: 56, afterWhiteIndex: 4 },
    { note: "A#", midi: 58, afterWhiteIndex: 5 },
    { note: "C#", midi: 61, afterWhiteIndex: 7 },
    { note: "D#", midi: 63, afterWhiteIndex: 8 },
    { note: "F#", midi: 66, afterWhiteIndex: 10 },
    { note: "G#", midi: 68, afterWhiteIndex: 11 },
    { note: "A#", midi: 70, afterWhiteIndex: 12 },
  ];

  const KEY_WIDTH = 28;
  const KEY_HEIGHT = 100;
  const BLACK_WIDTH = 14;
  const BLACK_HEIGHT = 62;
  const TOTAL_WIDTH = WHITE_KEYS.length * KEY_WIDTH;

  const isTetradChord = notes.length >= 4;

  // Find info about a key — EXACT single-hand matching (no octave duplication)
  const getKeyInfo = (midi: number) => {
    const matchIdx = notes.findIndex((m) => m === midi);
    if (matchIdx !== -1) {
      // 1-hand right hand finger numbers:
      // Triad (3 notes): 1 (polegar), 3 (médio), 5 (mínimo)
      // Tetrad (4 notes): 1 (polegar), 2 (indicador), 3 (médio), 5 (mínimo)
      const fingerNumber = isTetradChord
        ? matchIdx === 0
          ? 1
          : matchIdx === 1
          ? 2
          : matchIdx === 2
          ? 3
          : 5
        : matchIdx === 0
        ? 1
        : matchIdx === 1
        ? 3
        : 5;

      return {
        isActive: true,
        noteInfo: analysis.notes[matchIdx],
        isArpeggioActive: highlightedNoteIndex === matchIdx,
        fingerNumber,
      };
    }
    return { isActive: false, noteInfo: null, isArpeggioActive: false, fingerNumber: null };
  };

  // Helper for font size of Roman degrees based on character count
  const getDegreeTextClass = (deg: string) => {
    if (deg.length >= 4) return "text-[5.5px]";
    if (deg.length === 3) return "text-[6.2px]";
    if (deg.length === 2) return "text-[7.2px]";
    return "text-[8.5px]";
  };

  return (
    <div className="w-full overflow-x-auto flex justify-center py-1">
      <svg
        viewBox={`0 0 ${TOTAL_WIDTH} ${KEY_HEIGHT + 24}`}
        className="w-full max-w-[420px] h-[130px] select-none touch-none drop-shadow-sm"
      >
        <defs>
          <linearGradient id="activeKeyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Layer 1: White Key Rectangles */}
        {WHITE_KEYS.map((wk, idx) => {
          const x = idx * KEY_WIDTH;
          const { isActive, isArpeggioActive } = getKeyInfo(wk.midi);

          return (
            <rect
              key={`wk-rect-${wk.midi}`}
              x={x}
              y={0}
              width={KEY_WIDTH}
              height={KEY_HEIGHT}
              rx={2}
              onClick={(e) => {
                e.stopPropagation();
                onPlayNote?.(wk.midi);
              }}
              className={`transition-colors duration-150 cursor-pointer ${
                isActive
                  ? isArpeggioActive
                    ? "fill-primary stroke-primary"
                    : "fill-primary/20 stroke-primary/80"
                  : "fill-white dark:fill-neutral-100 stroke-neutral-300 dark:stroke-neutral-400 hover:fill-neutral-50"
              }`}
              strokeWidth={1}
            />
          );
        })}

        {/* Layer 2: Black Key Rectangles */}
        {BLACK_KEYS.map((bk) => {
          const x = (bk.afterWhiteIndex + 1) * KEY_WIDTH - BLACK_WIDTH / 2;
          const { isActive, isArpeggioActive } = getKeyInfo(bk.midi);

          return (
            <rect
              key={`bk-rect-${bk.midi}`}
              x={x}
              y={0}
              width={BLACK_WIDTH}
              height={BLACK_HEIGHT}
              rx={1.5}
              onClick={(e) => {
                e.stopPropagation();
                onPlayNote?.(bk.midi);
              }}
              className={`transition-colors duration-150 cursor-pointer ${
                isActive
                  ? isArpeggioActive
                    ? "fill-primary stroke-card"
                    : "fill-primary stroke-card"
                  : "fill-neutral-900 dark:fill-black stroke-neutral-800"
              }`}
              strokeWidth={1}
            />
          );
        })}

        {/* Layer 3: Active Key Playing Indicators (Dots, Note Names, Intervals, Fingering) */}
        {/* White Keys Playing Indicators */}
        {WHITE_KEYS.map((wk, idx) => {
          const x = idx * KEY_WIDTH;
          const { isActive, noteInfo, isArpeggioActive, fingerNumber } = getKeyInfo(wk.midi);
          if (!isActive || !noteInfo) return null;

          return (
            <g key={`wk-active-${wk.midi}`}>
              <circle
                cx={x + KEY_WIDTH / 2}
                cy={KEY_HEIGHT - 24}
                r={8.5}
                className={`${
                  isArpeggioActive
                    ? "fill-primary-foreground stroke-card"
                    : "fill-primary stroke-card"
                }`}
                strokeWidth={1.5}
              />
              <text
                x={x + KEY_WIDTH / 2}
                y={KEY_HEIGHT - 21}
                textAnchor="middle"
                className={`font-mono text-[8.5px] font-bold ${
                  isArpeggioActive ? "fill-primary" : "fill-primary-foreground"
                }`}
              >
                {noteInfo.noteName}
              </text>
              <text
                x={x + KEY_WIDTH / 2}
                y={KEY_HEIGHT - 9}
                textAnchor="middle"
                className="font-mono text-[7.5px] font-extrabold fill-primary"
              >
                {noteInfo.intervalShort}
              </text>
              {fingerNumber && (
                <text
                  x={x + KEY_WIDTH / 2}
                  y={KEY_HEIGHT - 1}
                  textAnchor="middle"
                  className="font-mono text-[6.5px] font-semibold fill-muted-foreground"
                >
                  D{fingerNumber}
                </text>
              )}
            </g>
          );
        })}

        {/* Black Keys Playing Indicators */}
        {BLACK_KEYS.map((bk) => {
          const x = (bk.afterWhiteIndex + 1) * KEY_WIDTH - BLACK_WIDTH / 2;
          const { isActive, noteInfo, fingerNumber } = getKeyInfo(bk.midi);
          if (!isActive || !noteInfo) return null;

          return (
            <g key={`bk-active-${bk.midi}`}>
              <circle
                cx={x + BLACK_WIDTH / 2}
                cy={BLACK_HEIGHT - 16}
                r={6.5}
                className="fill-primary-foreground stroke-primary"
                strokeWidth={1.5}
              />
              <text
                x={x + BLACK_WIDTH / 2}
                y={BLACK_HEIGHT - 13.5}
                textAnchor="middle"
                className="font-mono text-[7px] font-bold fill-primary"
              >
                {noteInfo.noteName}
              </text>
              {fingerNumber && (
                <text
                  x={x + BLACK_WIDTH / 2}
                  y={BLACK_HEIGHT - 3}
                  textAnchor="middle"
                  className="font-mono text-[6.5px] font-extrabold fill-primary-foreground"
                >
                  D{fingerNumber}
                </text>
              )}
            </g>
          );
        })}

        {/* Layer 4: TOPMOST SCALE DEGREE ROW — Perfectly Aligned at y=15, Zero Clipping, Zero Red */}
        {/* White Keys Degrees (Black text, no background, optical notch centered) */}
        {WHITE_KEYS.map((wk, idx) => {
          const x = idx * KEY_WIDTH;
          const pitchClass = wk.midi % 12;
          const scaleDegree = tonalityDegreesMap?.[pitchClass];
          if (!scaleDegree) return null;

          // Precise optical notch center between neighboring black keys:
          // C & F (black key on right only): shift center to the left
          // E & B & C5 (black key on left only): shift center to the right
          // D, G, A (black keys on both sides): exact midpoint
          const opticalX =
            idx === 0 || idx === 3 || idx === 7 || idx === 10
              ? x + 10.5
              : idx === 2 || idx === 6 || idx === 9 || idx === 13 || idx === 14
              ? x + 17.5
              : x + 14;

          return (
            <text
              key={`wk-deg-${wk.midi}`}
              x={opticalX}
              y={15}
              textAnchor="middle"
              className={`font-mono select-none pointer-events-none font-bold tracking-tighter fill-black dark:fill-neutral-900 ${getDegreeTextClass(
                scaleDegree
              )}`}
            >
              <title>{`Grau ${scaleDegree} na tonalidade de ${tonicKey || ""}`}</title>
              {scaleDegree}
            </text>
          );
        })}

        {/* Black Keys Degrees (White text, no background, horizontally centered on black key) */}
        {BLACK_KEYS.map((bk) => {
          const x = (bk.afterWhiteIndex + 1) * KEY_WIDTH - BLACK_WIDTH / 2;
          const pitchClass = bk.midi % 12;
          const scaleDegree = tonalityDegreesMap?.[pitchClass];
          if (!scaleDegree) return null;

          return (
            <text
              key={`bk-deg-${bk.midi}`}
              x={x + BLACK_WIDTH / 2}
              y={15}
              textAnchor="middle"
              className={`font-mono select-none pointer-events-none font-bold tracking-tighter fill-white ${getDegreeTextClass(
                scaleDegree
              )}`}
            >
              <title>{`Grau ${scaleDegree} na tonalidade de ${tonicKey || ""}`}</title>
              {scaleDegree}
            </text>
          );
        })}

        {/* Layer 5: Octave labels (C3, C4, C5) */}
        {WHITE_KEYS.map((wk, idx) => {
          if (!wk.label) return null;
          const x = idx * KEY_WIDTH;
          return (
            <text
              key={`wk-lbl-${wk.midi}`}
              x={x + KEY_WIDTH / 2}
              y={KEY_HEIGHT + 14}
              textAnchor="middle"
              className="font-mono text-[8px] font-semibold fill-muted-foreground"
            >
              {wk.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
