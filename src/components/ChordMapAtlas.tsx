import React, { useState, useEffect, useRef } from "react";
import { useLanguage, Language } from "../contexts/LanguageContext";
import {
  ActiveHarmonicField,
  ChordType,
  FieldChordDisplay,
  Mode,
  ROMAN_DEGREES,
} from "../lib/harmony";
import {
  Instrument,
  playChord,
  INSTRUMENTS,
} from "../lib/sound";
import {
  analyzeChord,
  getGuitarChordShape,
  getGuitarChordMidis,
  getInvertedChordDisplayName,
  getInvertedVoicing,
  GuitarChordShape,
  ChordAnalysis,
} from "../lib/chordDiagrams";
import { PianoColorIcon, GuitarColorIcon } from "./InstrumentIcons";
import {
  Volume2,
  Play,
  Square,
  Sparkles,
  Info,
  FileMusic,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";

interface Props {
  field: ActiveHarmonicField;
  mode: Mode;
  chordType: ChordType;
  instrument: Instrument;
  onInstrumentChange: (inst: Instrument) => void;
  onSelectChord: (degreeIndex: number, inversion?: number) => void;
  selectedDegreeIndex: number | null;
  soundOn: boolean;
  inversionsMap?: Record<number, number>;
  onInversionChange?: (degreeIndex: number, inv: number) => void;
}

type HarmonicFilter = "all" | "tonic" | "subdominant" | "dominant";

const FUNCTION_TAGS: Record<number, Record<Language, { label: string; group: "tonic" | "subdominant" | "dominant"; color: string; desc: string }>> = {
  0: {
    pt: { label: "Tônica", group: "tonic", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", desc: "Repouso & Conclusão" },
    en: { label: "Tonic", group: "tonic", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", desc: "Rest & Resolution" },
    es: { label: "Tónica", group: "tonic", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", desc: "Reposo y Conclusión" },
  },
  1: {
    pt: { label: "Subdominante", group: "subdominant", color: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30", desc: "Preparação & Condução" },
    en: { label: "Subdominant", group: "subdominant", color: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30", desc: "Preparation & Drive" },
    es: { label: "Subdominante", group: "subdominant", color: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30", desc: "Preparación y Conducción" },
  },
  2: {
    pt: { label: "Tônica Secundária", group: "tonic", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", desc: "Ponte Suave" },
    en: { label: "Secondary Tonic", group: "tonic", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", desc: "Soft Bridge" },
    es: { label: "Tónica Secundaria", group: "tonic", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", desc: "Puente Suave" },
  },
  3: {
    pt: { label: "Subdominante", group: "subdominant", color: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30", desc: "Afastamento & Movimento" },
    en: { label: "Subdominant", group: "subdominant", color: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30", desc: "Movement & Expansion" },
    es: { label: "Subdominante", group: "subdominant", color: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30", desc: "Movimiento y Expansión" },
  },
  4: {
    pt: { label: "Dominante", group: "dominant", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", desc: "Tensão & Resolução" },
    en: { label: "Dominant", group: "dominant", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", desc: "Tension & Resolution" },
    es: { label: "Dominante", group: "dominant", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", desc: "Tensión y Resolución" },
  },
  5: {
    pt: { label: "Relativo / Tônica", group: "tonic", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", desc: "Nostalgia & Variação" },
    en: { label: "Relative / Tonic", group: "tonic", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", desc: "Nostalgia & Variation" },
    es: { label: "Relativo / Tónica", group: "tonic", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", desc: "Nostalgia y Variación" },
  },
  6: {
    pt: { label: "Sensível / Tensão", group: "dominant", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", desc: "Tensão Máxima" },
    en: { label: "Leading Tone", group: "dominant", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", desc: "Peak Tension" },
    es: { label: "Sensible / Tensión", group: "dominant", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", desc: "Tensión Máxima" },
  },
};

export function ChordMapAtlas({
  field,
  mode,
  chordType,
  instrument,
  onInstrumentChange,
  onSelectChord,
  selectedDegreeIndex,
  soundOn,
  inversionsMap: propInversionsMap,
  onInversionChange,
}: Props) {
  const { language, t } = useLanguage();
  const [filter, setFilter] = useState<HarmonicFilter>("all");
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localInversionsMap, setLocalInversionsMap] = useState<Record<number, number>>({});
  const sequenceTimerRef = useRef<number | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const inversionsMap = propInversionsMap ?? localInversionsMap;
  const isGuitar = instrument === "guitar";

  // Stop sequence on unmount or field change
  useEffect(() => {
    return () => {
      if (sequenceTimerRef.current !== null) {
        window.clearTimeout(sequenceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    stopSequence();
    setLocalInversionsMap({});
  }, [field, mode, chordType]);

  const stopSequence = () => {
    if (sequenceTimerRef.current !== null) {
      window.clearTimeout(sequenceTimerRef.current);
      sequenceTimerRef.current = null;
    }
    setIsPlayingSequence(false);
    setCurrentPlayingIndex(null);
  };

  const playSequenceStep = (stepIdx: number) => {
    if (stepIdx >= field.chords.length) {
      stopSequence();
      return;
    }

    const chordItem = field.chords[stepIdx]!;
    setCurrentPlayingIndex(stepIdx);

    // Smooth scroll to the playing card
    const cardEl = cardRefs.current.get(stepIdx);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }

    const invIdx = inversionsMap[stepIdx] || 0;
    const shape = getGuitarChordShape(chordItem.chord, invIdx);
    const currentNotes = isGuitar
      ? getGuitarChordMidis(shape)
      : getInvertedVoicing(chordItem.notes, invIdx);

    if (soundOn && currentNotes.length > 0) {
      playChord(currentNotes, instrument);
    }

    sequenceTimerRef.current = window.setTimeout(() => {
      playSequenceStep(stepIdx + 1);
    }, 1100);
  };

  const toggleSequence = () => {
    if (isPlayingSequence) {
      stopSequence();
    } else {
      setIsPlayingSequence(true);
      playSequenceStep(0);
    }
  };

  const handleCardClick = (idx: number, chordItem: FieldChordDisplay) => {
    const invIdx = inversionsMap[idx] || 0;
    const shape = getGuitarChordShape(chordItem.chord, invIdx);
    const currentNotes = isGuitar
      ? getGuitarChordMidis(shape)
      : getInvertedVoicing(chordItem.notes, invIdx);

    if (soundOn && currentNotes.length > 0) {
      playChord(currentNotes, instrument);
    }
    onSelectChord(idx, invIdx);
  };

  // Filter chords based on functional group
  const filteredChords = field.chords.map((chord, idx) => ({ chord, idx })).filter(({ idx }) => {
    if (filter === "all") return true;
    const tag = FUNCTION_TAGS[idx]?.[language] || FUNCTION_TAGS[idx]?.pt;
    return tag && tag.group === filter;
  });

  return (
    <section className="w-full rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm space-y-5 animate-[slide-up_0.5s_var(--ease-out-expo)_both]">
      {/* Top Header Row: Title & Top-Right Expand/Collapse Button */}
      <div className="flex items-start justify-between gap-2.5 border-b border-border/70 pb-3.5">
        <div
          onClick={() => setIsExpanded((v) => !v)}
          className="flex items-start gap-2.5 cursor-pointer select-none group flex-1 min-w-0"
        >
          <span className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors shrink-0 mt-0.5">
            <FileMusic className="size-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                {t("chordMapTitle")}
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-primary/10 text-primary border border-primary/20 shrink-0">
                {chordType === "tetrad" ? t("tetrads") : t("triads")}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground leading-snug">
              {t("chordMapSubtitle")} —{" "}
              <strong className="text-foreground">{field.tonicName}</strong>
            </p>
          </div>
        </div>

        {/* Expand / Collapse Button exactly in top right corner matching all cards */}
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          aria-label={isExpanded ? "Recolher mapa de acordes" : "Expandir mapa de acordes"}
          title={isExpanded ? "Recolher" : "Expandir"}
          className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer shadow-xs shrink-0 mt-0.5"
        >
          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 animate-[fade-in_0.25s_both]">
          {/* Sub-toolbar: Instrument Switcher & Play Sequence */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
            {/* Instrument switcher (Teclado vs Violão) */}
            <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => onInstrumentChange("piano")}
                aria-label={t("piano")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  !isGuitar
                    ? "bg-card text-foreground shadow-xs border border-border font-bold scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <PianoColorIcon active={!isGuitar} className="size-4" />
                <span className="text-[11px]">{t("piano")}</span>
              </button>

              <button
                type="button"
                onClick={() => onInstrumentChange("guitar")}
                aria-label={t("guitar")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  isGuitar
                    ? "bg-card text-foreground shadow-xs border border-border font-bold scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <GuitarColorIcon active={isGuitar} className="size-4" />
                <span className="text-[11px]">{t("guitar")}</span>
              </button>
            </div>

            {/* Play Sequence Button */}
            <button
              type="button"
              onClick={toggleSequence}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isPlayingSequence
                  ? "bg-red-500/15 text-red-500 border border-red-500/30 hover:bg-red-500/25"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
              }`}
            >
              {isPlayingSequence ? (
                <>
                  <Square className="size-3.5 fill-current" />
                  <span>{t("stop")}</span>
                </>
              ) : (
                <>
                  <Play className="size-3.5 fill-current" />
                  <span>{t("play")} (I ➔ VII)</span>
                </>
              )}
            </button>
          </div>
          {/* Filter Tabs (Funções Harmônicas) */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <SlidersHorizontal className="size-3 text-primary" />
            Filtrar:
          </span>

          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
              filter === "all"
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {t("filterAll")}
          </button>

          <button
            type="button"
            onClick={() => setFilter("tonic")}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
              filter === "tonic"
                ? "bg-emerald-600 text-white font-bold shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {t("filterTonic")}
          </button>

          <button
            type="button"
            onClick={() => setFilter("subdominant")}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
              filter === "subdominant"
                ? "bg-sky-600 text-white font-bold shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {t("filterSubdominant")}
          </button>

          <button
            type="button"
            onClick={() => setFilter("dominant")}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
              filter === "dominant"
                ? "bg-amber-600 text-white font-bold shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {t("filterDominant")}
          </button>
        </div>

        <div className="text-[10px] font-mono text-muted-foreground">
          {filteredChords.length} {t("chordsWord")}
        </div>
      </div>

      {/* Grid of Chord Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7 gap-3.5">
        {filteredChords.map(({ chord: item, idx }) => {
          const isSelected = selectedDegreeIndex === idx;
          const isPlayingThis = currentPlayingIndex === idx;
          const funcTag = FUNCTION_TAGS[idx]?.[language] || FUNCTION_TAGS[idx]?.pt;

          const invIdx = inversionsMap[idx] || 0;
          const guitarShape = getGuitarChordShape(item.chord, invIdx);
          const slashInfo = getInvertedChordDisplayName(item.chord, invIdx);
          const baseNotes = item.notes;
          const maxInv = baseNotes.length > 0 ? baseNotes.length : 1;
          const rotatedNotes = getInvertedVoicing(baseNotes, invIdx);
          const analysis = analyzeChord(invIdx > 0 ? slashInfo.slashChord : item.chord, rotatedNotes);

          return (
            <div
              ref={(el) => {
                if (el) cardRefs.current.set(idx, el);
                else cardRefs.current.delete(idx);
              }}
              key={`${item.romanDegree}-${item.chord}`}
              onClick={() => handleCardClick(idx, item)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleCardClick(idx, item);
                }
              }}
              className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-200 cursor-pointer select-none ${
                isPlayingThis
                  ? "border-primary bg-primary/15 shadow-md ring-2 ring-primary scale-[1.03] z-10"
                  : isSelected
                  ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/60 scale-[1.02] z-10"
                  : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30 hover:shadow-xs"
              }`}
            >
              {/* Card Header: Roman Degree & Function Tag */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/25">
                    {t("degreeWord")} {item.romanDegree}
                  </span>
                  {funcTag && (
                    <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border ${funcTag.color}`}>
                      {funcTag.label}
                    </span>
                  )}
                </div>

                {/* Big Chord Name with Slash Chord for Inversion */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-display text-xl sm:text-2xl font-extrabold text-foreground leading-none flex items-baseline gap-0.5">
                      <span>{item.chord}</span>
                      {invIdx > 0 && (
                        <span className="text-base sm:text-lg text-primary font-mono font-bold tracking-tight">
                          /{slashInfo.bassNote}
                        </span>
                      )}
                    </h3>
                    <span className="text-[11px] font-semibold text-muted-foreground block mt-0.5">
                      {analysis.fullChordName} {invIdx > 0 ? `• ${slashInfo.inversionLabel}` : "• Inversões"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentNotes = isGuitar
                        ? getGuitarChordMidis(guitarShape)
                        : rotatedNotes;
                      if (soundOn && currentNotes.length > 0) {
                        playChord(currentNotes, instrument);
                      }
                    }}
                    title={`Tocar acorde ${invIdx > 0 ? slashInfo.slashChord : item.chord}`}
                    aria-label={`Tocar acorde ${invIdx > 0 ? slashInfo.slashChord : item.chord}`}
                    className="p-1.5 rounded-lg bg-muted hover:bg-primary/20 hover:text-primary text-muted-foreground transition-colors cursor-pointer shrink-0"
                  >
                    <Volume2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Visual Diagram: Mini Guitar Fretboard OR Mini Piano Keyboard - Large & Full Width */}
              <div className="my-2.5 flex justify-center items-center rounded-xl bg-muted/40 border border-border/50 p-2 sm:p-3 w-full min-h-[160px] sm:min-h-[175px] overflow-hidden">
                {isGuitar ? (
                  <MiniGuitarDiagram
                    shape={guitarShape}
                    onPlayNote={(midi) => {
                      if (soundOn) playChord([midi], "guitar");
                    }}
                  />
                ) : (
                  <MiniPianoDiagram
                    notes={rotatedNotes}
                    analysis={analysis}
                    onPlayNote={(midi) => {
                      if (soundOn) playChord([midi], "piano");
                    }}
                  />
                )}
              </div>

              {/* Card Footer: Notes & Formula Pills */}
              <div className="space-y-2 border-t border-border/50 pt-2.5">
                {/* Notes pills */}
                <div className="flex flex-wrap items-center gap-1">
                  {analysis.notes.map((n, nIdx) => (
                    <span
                      key={nIdx}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-muted/80 text-foreground border border-border/60"
                      title={`${n.ptName} (${n.intervalName})`}
                    >
                      {n.noteName}
                    </span>
                  ))}
                  <span className="text-[10px] font-mono text-primary font-semibold ml-auto">
                    {analysis.formula}
                  </span>
                </div>

                {/* Quick inspect prompt with Inversion Reload Button */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <span>{funcTag?.desc || "Acorde Diatônico"}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextInv = ((inversionsMap[idx] || 0) + 1) % maxInv;
                      setLocalInversionsMap((prev) => ({ ...prev, [idx]: nextInv }));
                      onInversionChange?.(idx, nextInv);
                      const nextGuitarShape = getGuitarChordShape(item.chord, nextInv);
                      const nextNotes = isGuitar
                        ? getGuitarChordMidis(nextGuitarShape)
                        : getInvertedVoicing(baseNotes, nextInv);
                      if (soundOn && nextNotes.length > 0) {
                        playChord(nextNotes, instrument);
                      }
                      if (selectedDegreeIndex === idx) {
                        onSelectChord(idx, nextInv);
                      }
                    }}
                    title={`Inverter acorde no ${isGuitar ? "Violão" : "Teclado"} (${slashInfo.inversionLabel})`}
                    aria-label="Inverter acorde"
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-primary/25 hover:text-primary text-muted-foreground transition-all cursor-pointer group/inv"
                  >
                    <RefreshCw className="size-3.5 transition-transform duration-300 group-hover/inv:rotate-180" />
                    <span className="text-[9px] font-bold">{invIdx === 0 ? "Inversões" : `${invIdx}ª Inversão`}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}
</section>
  );
}

/**
 * SVG Guitar Fretboard for Map Atlas Cards - Scaled to fill the card
 */
function MiniGuitarDiagram({
  shape,
  onPlayNote,
}: {
  shape: GuitarChordShape;
  onPlayNote?: (midi: number) => void;
}) {
  const [activeStringIndex, setActiveStringIndex] = useState<number | null>(null);

  const WIDTH = 160;
  const HEIGHT = 180;
  const TOP_Y = 34;
  const BOTTOM_Y = 155;
  const LEFT_X = 30;
  const RIGHT_X = 140;
  const NUM_FRETS = 5;
  const STRING_SPACING = (RIGHT_X - LEFT_X) / 5;
  const FRET_SPACING = (BOTTOM_Y - TOP_Y) / NUM_FRETS;

  const stringNames = ["E", "A", "D", "G", "B", "e"];
  const OPEN_STRINGS_MIDI = [40, 45, 50, 55, 59, 64];
  const isNut = shape.baseFret === 1;

  const handleStringClick = (e: React.MouseEvent, sIdx: number) => {
    e.stopPropagation();
    const f = shape.frets[sIdx];
    if (f === "x") {
      setActiveStringIndex(sIdx);
      setTimeout(() => setActiveStringIndex(null), 250);
      return;
    }
    const fretNum = typeof f === "number" ? f : 0;
    const midi = OPEN_STRINGS_MIDI[sIdx]! + fretNum;
    setActiveStringIndex(sIdx);
    setTimeout(() => setActiveStringIndex(null), 300);
    onPlayNote?.(midi);
  };

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-[190px] h-[170px] select-none drop-shadow-xs">
      {/* Base Fret indicator */}
      {!isNut && (
        <text
          x={LEFT_X - 8}
          y={TOP_Y + FRET_SPACING / 2 + 4}
          textAnchor="end"
          className="font-mono text-[9.5px] font-bold fill-primary"
        >
          {shape.baseFret}ª
        </text>
      )}

      {/* Top Nut or First Fret Line */}
      {isNut ? (
        <rect
          x={LEFT_X - 1.5}
          y={TOP_Y - 3.5}
          width={RIGHT_X - LEFT_X + 3}
          height={3.8}
          rx={0.8}
          className="fill-foreground/80 stroke-foreground/40"
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

      {/* Fret lines */}
      {Array.from({ length: NUM_FRETS }).map((_, fIdx) => {
        const y = TOP_Y + (fIdx + 1) * FRET_SPACING;
        return (
          <line
            key={fIdx}
            x1={LEFT_X}
            y1={y}
            x2={RIGHT_X}
            y2={y}
            className="stroke-border"
            strokeWidth={1.4}
          />
        );
      })}

      {/* Vertical strings */}
      {Array.from({ length: 6 }).map((_, sIdx) => {
        const x = LEFT_X + sIdx * STRING_SPACING;
        const isActive = activeStringIndex === sIdx;
        const sWidth = isActive ? 3.4 : (2.2 - sIdx * 0.25);
        return (
          <line
            key={sIdx}
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
            y={BOTTOM_Y + 14}
            textAnchor="middle"
            onClick={(e) => handleStringClick(e, sIdx)}
            className={`font-mono text-[8px] font-semibold cursor-pointer transition-colors ${
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
        const y = TOP_Y - 10;
        const isActive = activeStringIndex === sIdx;

        if (f === "x") {
          return (
            <text
              key={`x-${sIdx}`}
              x={x}
              y={y + 3.5}
              textAnchor="middle"
              onClick={(e) => handleStringClick(e, sIdx)}
              className="font-mono text-[11px] font-extrabold fill-destructive cursor-pointer hover:opacity-80"
            >
              ✕
            </text>
          );
        }
        if (f === 0) {
          return (
            <circle
              key={`o-${sIdx}`}
              cx={x}
              cy={y}
              r={isActive ? 4.5 : 3.2}
              fill={isActive ? "var(--color-primary)" : "none"}
              className="stroke-primary cursor-pointer transition-all hover:scale-125"
              strokeWidth={1.4}
              onClick={(e) => handleStringClick(e, sIdx)}
            />
          );
        }
        return null;
      })}

      {/* Barre pill */}
      {shape.barre && (
        (() => {
          const bFret = shape.barre.fret;
          const relFret = isNut ? bFret : bFret - shape.baseFret + 1;
          if (relFret >= 1 && relFret <= NUM_FRETS) {
            const y = TOP_Y + (relFret - 0.5) * FRET_SPACING;
            const x1 = LEFT_X + (6 - shape.barre.fromString) * STRING_SPACING;
            const x2 = LEFT_X + (6 - shape.barre.toString) * STRING_SPACING;
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);

            return (
              <g key="mini-barre">
                <rect
                  x={minX - 4.5}
                  y={y - 5.5}
                  width={maxX - minX + 9}
                  height={11}
                  rx={5.5}
                  className="fill-primary/80"
                />
                <text
                  x={(minX + maxX) / 2}
                  y={y + 3}
                  textAnchor="middle"
                  className="font-mono text-[7.5px] font-bold fill-primary-foreground pointer-events-none"
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
            key={`dot-${sIdx}`}
            onClick={(e) => handleStringClick(e, sIdx)}
            className="cursor-pointer group"
          >
            {isActive && (
              <circle
                cx={x}
                cy={y}
                r={10}
                className="fill-primary/20 stroke-primary animate-ping pointer-events-none"
                strokeWidth={1}
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={isActive ? 8 : 6.8}
              className={`fill-primary stroke-card transition-all duration-150 ${
                isActive ? "scale-110 drop-shadow-md" : "group-hover:scale-110"
              }`}
              strokeWidth={1.2}
            />
            {fingerNum && fingerNum > 0 ? (
              <text
                x={x}
                y={y + 2.8}
                textAnchor="middle"
                className="font-mono text-[8px] font-bold fill-primary-foreground pointer-events-none"
              >
                {fingerNum}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Invisible broad hitboxes for each string column */}
      {Array.from({ length: 6 }).map((_, sIdx) => {
        const x = LEFT_X + sIdx * STRING_SPACING;
        return (
          <rect
            key={`hitbox-${sIdx}`}
            x={x - 8}
            y={TOP_Y - 12}
            width={16}
            height={BOTTOM_Y - TOP_Y + 30}
            fill="transparent"
            className="cursor-pointer hover:fill-primary/10 transition-colors"
            onClick={(e) => handleStringClick(e, sIdx)}
          />
        );
      })}
    </svg>
  );
}

/**
 * SVG Piano Keyboard for Map Atlas Cards - Scaled to fill the card
 */
function MiniPianoDiagram({
  notes,
  analysis,
  onPlayNote,
}: {
  notes: number[];
  analysis: ChordAnalysis;
  onPlayNote?: (midi: number) => void;
}) {
  const minNote = notes.length > 0 ? Math.min(...notes) : 48;
  const maxNote = notes.length > 0 ? Math.max(...notes) : 72;

  // Default 2-octave window: C3 (48) to C5 (72) -> 15 white keys
  let startMidi = 48;
  let endMidi = 72;

  // Slide window to the right or left by octaves if notes fall outside
  while (maxNote > endMidi) {
    startMidi += 12;
    endMidi += 12;
  }
  while (minNote < startMidi) {
    startMidi -= 12;
    endMidi -= 12;
  }

  const WHITE_KEY_CLASSES = [0, 2, 4, 5, 7, 9, 11];
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  const WHITE_KEYS: { midi: number; note: string; label?: string }[] = [];
  for (let m = startMidi; m <= endMidi; m++) {
    const pc = m % 12;
    if (WHITE_KEY_CLASSES.includes(pc)) {
      const octave = Math.floor(m / 12) - 1;
      const label = (pc === 0) ? `C${octave}` : undefined;
      WHITE_KEYS.push({ midi: m, note: NOTE_NAMES[pc], label });
    }
  }

  const BLACK_KEYS: { midi: number; afterWhiteIndex: number }[] = [];
  for (let m = startMidi; m <= endMidi; m++) {
    const pc = m % 12;
    if (!WHITE_KEY_CLASSES.includes(pc)) {
      const whiteIdx = WHITE_KEYS.findIndex(wk => wk.midi === m - 1);
      if (whiteIdx !== -1) {
        BLACK_KEYS.push({ midi: m, afterWhiteIndex: whiteIdx });
      }
    }
  }

  const KEY_WIDTH = 16.8; // Constant key width
  const KEY_HEIGHT = 80;
  const BLACK_WIDTH = KEY_WIDTH * 0.55;
  const BLACK_HEIGHT = 48;
  const TOTAL_WIDTH = WHITE_KEYS.length * KEY_WIDTH;

  const isTetrad = notes.length >= 4;

  const isKeyActive = (midi: number) => {
    const idx = notes.findIndex((m) => m === midi);
    if (idx !== -1) {
      const noteObj = analysis.notes.find(n => n.pitchClass === (midi % 12)) || analysis.notes[idx % analysis.notes.length];
      const finger = isTetrad
        ? idx === 0 ? 1 : idx === 1 ? 2 : idx === 2 ? 3 : 5
        : idx === 0 ? 1 : idx === 1 ? 3 : 5;
      return { active: true, note: noteObj || analysis.notes[0], finger };
    }
    return { active: false, note: null, finger: null };
  };

  return (
    <svg viewBox={`0 0 ${TOTAL_WIDTH} ${KEY_HEIGHT + 18}`} className="w-full max-w-[290px] h-[125px] sm:h-[135px] select-none drop-shadow-xs">
      {/* White keys */}
      {WHITE_KEYS.map((wk, idx) => {
        const x = idx * KEY_WIDTH;
        const { active } = isKeyActive(wk.midi);
        return (
          <rect
            key={wk.midi}
            x={x}
            y={0}
            width={KEY_WIDTH}
            height={KEY_HEIGHT}
            rx={1.5}
            onClick={(e) => {
              e.stopPropagation();
              onPlayNote?.(wk.midi);
            }}
            className={`transition-colors cursor-pointer hover:opacity-80 ${
              active
                ? "fill-primary/25 stroke-primary/90"
                : "fill-white dark:fill-neutral-100 stroke-neutral-300 dark:stroke-neutral-400"
            }`}
            strokeWidth={0.8}
          />
        );
      })}

      {/* Black keys */}
      {BLACK_KEYS.map((bk) => {
        const x = (bk.afterWhiteIndex + 1) * KEY_WIDTH - BLACK_WIDTH / 2;
        const { active } = isKeyActive(bk.midi);
        return (
          <rect
            key={bk.midi}
            x={x}
            y={0}
            width={BLACK_WIDTH}
            height={BLACK_HEIGHT}
            rx={1}
            onClick={(e) => {
              e.stopPropagation();
              onPlayNote?.(bk.midi);
            }}
            className={`transition-colors cursor-pointer hover:opacity-80 ${
              active
                ? "fill-primary stroke-card"
                : "fill-neutral-900 dark:fill-black stroke-neutral-800"
            }`}
            strokeWidth={0.8}
          />
        );
      })}

      {/* Active white key markers (Dots + Note + Interval + Finger) */}
      {WHITE_KEYS.map((wk, idx) => {
        const x = idx * KEY_WIDTH;
        const { active, note, finger } = isKeyActive(wk.midi);
        if (!active || !note) return null;
        return (
          <g
            key={`w-mark-${wk.midi}`}
            onClick={(e) => {
              e.stopPropagation();
              onPlayNote?.(wk.midi);
            }}
            className="cursor-pointer"
          >
            <circle cx={x + KEY_WIDTH / 2} cy={KEY_HEIGHT - 18} r={5.8} className="fill-primary stroke-card" strokeWidth={1} />
            <text
              x={x + KEY_WIDTH / 2}
              y={KEY_HEIGHT - 15.5}
              textAnchor="middle"
              className="font-mono text-[6.5px] font-extrabold fill-primary-foreground pointer-events-none"
            >
              {note.noteName}
            </text>
            {finger && (
              <text
                x={x + KEY_WIDTH / 2}
                y={KEY_HEIGHT - 4}
                textAnchor="middle"
                className="font-mono text-[5.8px] font-bold fill-primary pointer-events-none"
              >
                D{finger}
              </text>
            )}
          </g>
        );
      })}

      {/* Active black key markers */}
      {BLACK_KEYS.map((bk) => {
        const x = (bk.afterWhiteIndex + 1) * KEY_WIDTH - BLACK_WIDTH / 2;
        const { active, note, finger } = isKeyActive(bk.midi);
        if (!active || !note) return null;
        return (
          <g
            key={`b-mark-${bk.midi}`}
            onClick={(e) => {
              e.stopPropagation();
              onPlayNote?.(bk.midi);
            }}
            className="cursor-pointer"
          >
            <circle cx={x + BLACK_WIDTH / 2} cy={BLACK_HEIGHT - 13} r={4.6} className="fill-primary-foreground stroke-primary" strokeWidth={1} />
            <text
              x={x + BLACK_WIDTH / 2}
              y={BLACK_HEIGHT - 11}
              textAnchor="middle"
              className="font-mono text-[5.2px] font-extrabold fill-primary pointer-events-none"
            >
              {note.noteName}
            </text>
            {finger && (
              <text
                x={x + BLACK_WIDTH / 2}
                y={BLACK_HEIGHT - 2.5}
                textAnchor="middle"
                className="font-mono text-[5px] font-extrabold fill-primary-foreground pointer-events-none"
              >
                D{finger}
              </text>
            )}
          </g>
        );
      })}

      {/* Octave Labels (C3, C4, C5) */}
      {WHITE_KEYS.map((wk, idx) => {
        if (!wk.label) return null;
        const x = idx * KEY_WIDTH;
        return (
          <text
            key={`lbl-${wk.midi}`}
            x={x + KEY_WIDTH / 2}
            y={KEY_HEIGHT + 11}
            textAnchor="middle"
            className="font-mono text-[7px] font-bold fill-muted-foreground"
          >
            {wk.label}
          </text>
        );
      })}
    </svg>
  );
}
