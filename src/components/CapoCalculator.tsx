import React, { useState, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  ChevronDown,
  ChevronUp,
  Volume2,
  Sparkles,
  Layers,
  HelpCircle,
} from "lucide-react";
import { ActiveHarmonicField, Mode, pitchOf, PITCH_NAMES, mod, getChordNotes } from "../lib/harmony";
import { playChord, Instrument } from "../lib/sound";
import { getGuitarChordShape, getGuitarChordMidis, getInvertedVoicing } from "../lib/chordDiagrams";
import { CapoIcon } from "./InstrumentIcons";

interface Props {
  field: ActiveHarmonicField;
  mode: Mode;
  instrument: Instrument;
  soundOn: boolean;
}

interface CapoRecommendation {
  fret: number;
  shapeName: string;
  shapeTonic: string;
  difficultyScore: "fácil" | "médio" | "avançado";
  description: { pt: string; en: string; es: string };
  isPopular: boolean;
}

// Open guitar root pitches
const OPEN_SHAPES_MAJOR: { name: string; rootPitch: number; popularity: number }[] = [
  { name: "D", rootPitch: 2, popularity: 1 },
  { name: "C", rootPitch: 0, popularity: 2 },
  { name: "G", rootPitch: 7, popularity: 3 },
  { name: "E", rootPitch: 4, popularity: 4 },
  { name: "A", rootPitch: 9, popularity: 5 },
];

const OPEN_SHAPES_MINOR: { name: string; rootPitch: number; popularity: number }[] = [
  { name: "Am", rootPitch: 9, popularity: 1 },
  { name: "Em", rootPitch: 4, popularity: 2 },
  { name: "Dm", rootPitch: 2, popularity: 3 },
];

export function CapoCalculator({ field, mode, instrument, soundOn }: Props) {
  const { language, t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const isMinor = mode === "minor";

  const tonicPitch = useMemo(() => {
    return pitchOf(field.tonicName);
  }, [field.tonicName]);

  // Calculate best capo positions
  const recommendations = useMemo<CapoRecommendation[]>(() => {
    const list: CapoRecommendation[] = [];
    const shapes = isMinor ? OPEN_SHAPES_MINOR : OPEN_SHAPES_MAJOR;

    shapes.forEach((s) => {
      const fret = mod(tonicPitch - s.rootPitch, 12);
      if (fret <= 9) {
        let diff: "fácil" | "médio" | "avançado" = "fácil";
        if (fret > 5) diff = "médio";
        if (fret > 7) diff = "avançado";

        const shapeRoot = PITCH_NAMES[s.rootPitch] + (isMinor ? "m" : "");

        list.push({
          fret,
          shapeName: s.name,
          shapeTonic: shapeRoot,
          difficultyScore: diff,
          description: {
            pt: fret === 0 ? "Sem capotraste (afinação padrão aberta)" : `Toque com acordes abertos de ${shapeRoot} na Casa ${fret}`,
            en: fret === 0 ? "No capo (standard open tuning)" : `Play with open ${shapeRoot} shapes at Fret ${fret}`,
            es: fret === 0 ? "Sin capo (afinación abierta estándar)" : `Toca con formas abiertas de ${shapeRoot} en Traste ${fret}`,
          },
          isPopular: fret <= 4,
        });
      }
    });

    return list.sort((a, b) => a.fret - b.fret);
  }, [tonicPitch, isMinor]);

  const [selectedFret, setSelectedFret] = useState<number>(() => {
    return recommendations[0]?.fret ?? 0;
  });

  const currentShapeRootPitch = mod(tonicPitch - selectedFret, 12);
  const currentShapeRootName = PITCH_NAMES[currentShapeRootPitch] + (isMinor ? "m" : "");

  const mappedChords = useMemo(() => {
    return field.chords.map((ch, idx) => {
      const realPitch = pitchOf(ch.chord);
      const shapePitch = mod(realPitch - selectedFret, 12);
      const isDim = ch.chord.includes("°") || ch.chord.includes("dim") || ch.chord.includes("m7b5");
      const isM = ch.chord.includes("m") && !isDim;

      let shapeChordName = PITCH_NAMES[shapePitch]!;
      if (isDim) shapeChordName += "°";
      else if (isM) shapeChordName += "m";

      const shapeNotes = getChordNotes(shapeChordName);

      return {
        degree: ch.romanDegree,
        realChord: ch.chord,
        shapeChord: shapeChordName,
        notes: shapeNotes,
        degreeIdx: idx,
      };
    });
  }, [field.chords, selectedFret]);

  const handlePlayChord = (notes: number[], shapeChordName: string) => {
    if (soundOn) {
      const shape = getGuitarChordShape(shapeChordName, 0);
      const toPlay = instrument === "guitar"
        ? getGuitarChordMidis(shape)
        : getInvertedVoicing(notes, 0);
      playChord(toPlay, instrument);
    }
  };

  return (
    <article className="w-full rounded-2xl bg-card border border-border shadow-xs overflow-hidden transition-all duration-300">
      {/* Header */}
      <div
        className="w-full p-3.5 sm:p-4 bg-muted/20 border-b border-border/60 flex items-start justify-between gap-2.5 cursor-pointer select-none hover:bg-muted/40 transition-colors"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="size-8 sm:size-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <CapoIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="font-display text-base sm:text-lg font-bold text-foreground leading-snug">
                {t("capoTitle")}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                {t("realKey")}: {field.tonicName}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug mt-0.5">
              {t("capoSubtitle")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          aria-label={isExpanded ? "Recolher Capotraste" : "Expandir Capotraste"}
          className="size-8 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors shrink-0 cursor-pointer mt-0.5"
        >
          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3.5 sm:p-5 space-y-4">
          {/* Quick Recommendations Pills */}
          <div>
            <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              {t("quickSuggestions")} {field.tonicName}:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {recommendations.slice(0, 3).map((rec) => {
                const isSelected = selectedFret === rec.fret;
                return (
                  <button
                    key={rec.fret}
                    type="button"
                    onClick={() => setSelectedFret(rec.fret)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground ring-2 ring-primary/20"
                        : "bg-card border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-xs font-bold text-primary">
                        {rec.fret === 0 ? t("noCapo") : `${t("capoAtFret")} ${rec.fret}`}
                      </span>
                      {rec.fret === 0 ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                          {t("standard")}
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-semibold">
                          {t("recommended")}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {t("shapesOf")} {rec.shapeTonic}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {rec.description[language] || rec.description.pt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Fretboard Selector */}
          <div className="rounded-xl bg-card border border-border p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                {t("fretSelectorTitle")}
              </span>
              <span className="text-xs font-mono font-bold text-primary">
                {selectedFret === 0
                  ? t("openTuning")
                  : `${t("capoAtFret")} ${selectedFret} (${t("shapesOf")} ${currentShapeRootName})`}
              </span>
            </div>

            {/* Fret Buttons 0 to 9 */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((fret) => {
                const isCurrent = selectedFret === fret;
                const shapePitch = mod(tonicPitch - fret, 12);
                const shapeName = PITCH_NAMES[shapePitch] + (isMinor ? "m" : "");

                return (
                  <button
                    key={fret}
                    type="button"
                    onClick={() => setSelectedFret(fret)}
                    className={`py-2 px-1 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isCurrent
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs scale-105 z-10"
                        : "bg-muted/30 border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    <span className="font-mono text-[10px] leading-tight">
                      {fret === 0 ? "0" : `C${fret}`}
                    </span>
                    <span className="font-mono text-xs font-bold mt-0.5">
                      {shapeName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real vs Shape Comparison Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>{t("howYouFretVsReal")} {field.tonicName}):</span>
              <span className="text-primary font-semibold">{t("clickToListen")}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {mappedChords.map((item) => {
                return (
                  <button
                    key={item.degree}
                    type="button"
                    onClick={() => handlePlayChord(item.notes, item.shapeChord)}
                    className="p-2.5 rounded-xl border border-border bg-card hover:border-primary/50 transition-all cursor-pointer text-left group flex flex-col justify-between gap-1 shadow-2xs hover:shadow-xs active:scale-95"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-primary">
                        {item.degree}
                      </span>
                      <Volume2 className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        {t("fretLabel")}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-foreground block font-mono">
                        {item.shapeChord}
                      </span>
                    </div>

                    <div className="pt-1 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{t("soundsLabel")}</span>
                      <span className="font-bold text-primary font-mono">{item.realChord}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
