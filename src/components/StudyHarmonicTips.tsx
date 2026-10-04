import React, { useState, useEffect } from "react";
import { Lightbulb, Volume2, ChevronRight, X, Sparkles, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mode, ChordType } from "@/lib/harmony";

interface HarmonicFunctionInfo {
  degreeIndex: number;
  roman: string;
  name: string;
  functionCategory: "Tônica" | "Subdominante" | "Dominante";
  colorClass: string;
  badgeBg: string;
  summary: string;
  details: string;
  typicalResolution: string;
}

const MAJOR_FUNCTIONS: HarmonicFunctionInfo[] = [
  {
    degreeIndex: 0,
    roman: "I",
    name: "Tônica",
    functionCategory: "Tônica",
    colorClass: "text-emerald-500 dark:text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    summary: "Centro de repouso absoluto e resolução definitiva.",
    details: "É a casa da tonalidade. Todos os outros acordes geram expectativas e caminhos que buscam descansar e concluir no I grau.",
    typicalResolution: "Ponto final da cadência perfeita (V ➔ I) ou cadência plagal (IV ➔ I)."
  },
  {
    degreeIndex: 4,
    roman: "V",
    name: "Dominante",
    functionCategory: "Dominante",
    colorClass: "text-amber-500 dark:text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    summary: "Este é o acorde de dominante, que resolve na tônica.",
    details: "Possui a máxima tensão harmônica e uma atração magnética irresistível que empurra os ouvidos de volta para o I grau.",
    typicalResolution: "Resolve diretamente na Tônica (V ➔ I) ou na Relativa em cadência de engano (V ➔ VI)."
  },
  {
    degreeIndex: 3,
    roman: "IV",
    name: "Subdominante",
    functionCategory: "Subdominante",
    colorClass: "text-sky-500 dark:text-sky-400",
    badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
    summary: "Afastamento, abertura e preparação de movimento.",
    details: "Cria sensação de expansão espacial e distância da tônica, preparando a chegada da dominante ou gerando a clássica cadência 'Amém' (IV ➔ I).",
    typicalResolution: "Geralmente conduz para a Dominante (IV ➔ V) ou retorna suavemente à Tônica (IV ➔ I)."
  },
  {
    degreeIndex: 1,
    roman: "II",
    name: "Supertônica",
    functionCategory: "Subdominante",
    colorClass: "text-sky-500 dark:text-sky-400",
    badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
    summary: "Subdominante preparatório na cadência clássica II - V - I.",
    details: "Acorde menor que substitui o IV com elegância, servindo como rampa de lançamento perfeita para a dominante.",
    typicalResolution: "Conduz naturalmente para a Dominante (II ➔ V ➔ I)."
  },
  {
    degreeIndex: 5,
    roman: "VI",
    name: "Relativa Menor / Superdominante",
    functionCategory: "Tônica",
    colorClass: "text-emerald-500 dark:text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    summary: "Repouso alternativo com clima emotivo e reflexivo.",
    details: "Compartilha duas notas com a tônica. Quando tocado após a dominante, surpreende quem ouve na famosa 'cadência de engano' (V ➔ VI).",
    typicalResolution: "Usado como substituto da tônica ou ponte para o II ou IV grau."
  },
  {
    degreeIndex: 2,
    roman: "III",
    name: "Mediante",
    functionCategory: "Tônica",
    colorClass: "text-emerald-500 dark:text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    summary: "Transição suave e substituto sutil da tônica.",
    details: "Contém a terça e a quinta da tônica, conferindo uma sensação de repouso suave sem a finalidade categórica do I grau.",
    typicalResolution: "Frequentemente conduz para o VI grau (III ➔ VI) ou IV grau."
  },
  {
    degreeIndex: 6,
    roman: "VII",
    name: "Sensível / Diminuto",
    functionCategory: "Dominante",
    colorClass: "text-amber-500 dark:text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    summary: "Tensão máxima com intervalo de trítono agudo.",
    details: "Está a apenas um semitom de distância da tônica. Por ter tanta instabilidade, anseia por subir meio tom e repousar no I.",
    typicalResolution: "Resolve invariavelmente subindo para a Tônica (VII° ➔ I)."
  }
];

const MINOR_FUNCTIONS: HarmonicFunctionInfo[] = [
  {
    degreeIndex: 0,
    roman: "I",
    name: "Tônica Menor",
    functionCategory: "Tônica",
    colorClass: "text-emerald-500 dark:text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    summary: "Centro de repouso profundo, emotivo e dramático.",
    details: "Define a identidade do modo menor, trazendo gravidade e atmosfera reflexiva para a música.",
    typicalResolution: "Repouso fundamental do campo harmônico menor."
  },
  {
    degreeIndex: 4,
    roman: "V",
    name: "Dominante",
    functionCategory: "Dominante",
    colorClass: "text-amber-500 dark:text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    summary: "Este é o acorde de dominante, que resolve na tônica menor.",
    details: "Na harmonia funcional, a dominante cria forte tensão de retorno que ancora a resolução na tônica menor (Im).",
    typicalResolution: "Resolve diretamente na Tônica Menor (V ➔ Im)."
  },
  {
    degreeIndex: 3,
    roman: "IV",
    name: "Subdominante Menor",
    functionCategory: "Subdominante",
    colorClass: "text-sky-500 dark:text-sky-400",
    badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
    summary: "Lirismo, melancolia e movimento expressivo.",
    details: "Aprofunda a sonoridade poética da tonalidade menor, preparando a chegada da dominante ou cadência plagal menor.",
    typicalResolution: "Conduz para o V grau ou resolve em cadência suave no Im."
  },
  {
    degreeIndex: 2,
    roman: "III",
    name: "Relativa Maior",
    functionCategory: "Tônica",
    colorClass: "text-emerald-500 dark:text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    summary: "Alívio harmônico e luminosidade no tom menor.",
    details: "É a tonalidade relativa maior. Oferece um momento de esperança e brilho dentro de uma peça em tom menor.",
    typicalResolution: "Frequentemente usado como refúgio melódico antes de retornar ao drama menor."
  },
  {
    degreeIndex: 5,
    roman: "VI",
    name: "Superdominante Maior",
    functionCategory: "Subdominante",
    colorClass: "text-sky-500 dark:text-sky-400",
    badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
    summary: "Acorde maior com sonoridade doce, épica e aberta.",
    details: "Um dos graus mais marcantes do repertório moderno e trilhas sonoras, criando uma elevação emocional instantânea.",
    typicalResolution: "Prepara a dominante ou resolve na progressão VI ➔ VII ➔ Im."
  },
  {
    degreeIndex: 1,
    roman: "II",
    name: "Supertônica Diminuta",
    functionCategory: "Subdominante",
    colorClass: "text-sky-500 dark:text-sky-400",
    badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
    summary: "Preparação tensa e elegante no tom menor.",
    details: "Acorde diminuto que prepara a cadência perfeita no modo menor (II° ➔ V7 ➔ Im).",
    typicalResolution: "Conduz com força direta para o V grau dominante."
  },
  {
    degreeIndex: 6,
    roman: "VII",
    name: "Subtônica / Sensível",
    functionCategory: "Dominante",
    colorClass: "text-amber-500 dark:text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    summary: "Movimento ascensional marcante no rock e pop.",
    details: "No modo menor natural, cria o clássico movimento de subida de degraus harmônicos (VI ➔ VII ➔ Im).",
    typicalResolution: "Sobe um tom inteiro direto para a tônica menor."
  }
];

interface Props {
  mode: Mode;
  chordType: ChordType;
  chords: Array<{
    romanDegree: string;
    chord: string;
    notes: number[];
    isTonic: boolean;
  }>;
  selectedChordIndex: number | null;
  revealedChords: Set<number>;
  onSelectChord: (index: number) => void;
  onPlayChord: (notes: number[]) => void;
  onDismiss: () => void;
  soundOn: boolean;
}

export function StudyHarmonicTips({
  mode,
  chordType,
  chords,
  selectedChordIndex,
  revealedChords,
  onSelectChord,
  onPlayChord,
  onDismiss,
  soundOn,
}: Props) {
  const { t } = useLanguage();
  const functionsList = mode === "major" ? MAJOR_FUNCTIONS : MINOR_FUNCTIONS;
  const [tipIndex, setTipIndex] = useState(() => {
    // If a chord is currently selected, show its tip first; otherwise start with Dominante (V) or Tonic (I)
    if (selectedChordIndex !== null) {
      const idx = functionsList.findIndex((f) => f.degreeIndex === selectedChordIndex);
      return idx >= 0 ? idx : 1; // 1 is dominant in our ordered list
    }
    return 1; // Default to dominant (index 1 is V in list)
  });

  // If user selects a chord while hint is open, update tip to match selected chord
  useEffect(() => {
    if (selectedChordIndex !== null) {
      const foundIdx = functionsList.findIndex((f) => f.degreeIndex === selectedChordIndex);
      if (foundIdx >= 0) {
        setTipIndex(foundIdx);
      }
    }
  }, [selectedChordIndex, functionsList]);

  const currentTip = functionsList[tipIndex % functionsList.length];
  const relatedChord = chords[currentTip.degreeIndex];
  const isChordRevealed = revealedChords.has(currentTip.degreeIndex);

  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % functionsList.length);
  };

  const handlePlay = () => {
    if (relatedChord) {
      onPlayChord(relatedChord.notes);
      onSelectChord(currentTip.degreeIndex);
    }
  };

  return (
    <div
      role="region"
      aria-label="Dica Harmônica Contextual do Modo Estudo"
      className="w-full rounded-xl border-2 border-amber-500/40 bg-card/95 p-3.5 sm:p-4 shadow-lg shadow-amber-500/5 backdrop-blur-md transition-all animate-[slide-up_0.35s_var(--ease-out-expo)_both]"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Icon with pulse */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20">
            <Lightbulb className="size-4.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Sparkles className="size-3" />
                Dica Harmônica Contextual
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${currentTip.badgeBg}`}
              >
                {currentTip.functionCategory} • Grau {currentTip.roman}
              </span>
            </div>
            <h4 className="font-display text-base sm:text-lg uppercase tracking-tight text-foreground mt-0.5">
              {currentTip.name}:{" "}
              <span className="text-primary font-mono text-sm sm:text-base font-bold">
                {isChordRevealed ? relatedChord?.chord : `Grau ${currentTip.roman}`}
              </span>
            </h4>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar dica"
          title="Fechar dica"
          className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Main explanation text */}
      <div className="mt-2.5 space-y-1.5 text-xs sm:text-sm text-foreground/90 pl-0.5">
        <p className="font-semibold text-foreground leading-snug">
          {currentTip.summary}
        </p>
        <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">
          {currentTip.details}
        </p>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-primary font-medium pt-1">
          <span className="shrink-0 font-bold">Resolução típica:</span>
          <span>{currentTip.typicalResolution}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {relatedChord && (
            <button
              type="button"
              onClick={handlePlay}
              title={`Ouvir ${isChordRevealed ? relatedChord.chord : `o acorde do grau ${currentTip.roman}`}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-mono text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <Volume2 className="size-3.5" />
              <span>Ouvir {isChordRevealed ? relatedChord.chord : `Grau ${currentTip.roman}`}</span>
            </button>
          )}

          {!isChordRevealed && (
            <button
              type="button"
              onClick={() => onSelectChord(currentTip.degreeIndex)}
              className="text-[11px] font-mono text-muted-foreground hover:text-foreground underline cursor-pointer"
            >
              Revelar este acorde
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleNextTip}
          className="flex items-center gap-1 text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 hover:text-foreground transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-amber-500/10"
        >
          <span>Outra função</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
