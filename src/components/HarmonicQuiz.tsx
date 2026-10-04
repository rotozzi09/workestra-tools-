import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Trophy,
  Volume2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flame,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  FIELDS,
  Mode,
  ChordType,
  ROMAN_DEGREES,
  getActiveHarmonicField,
} from "@/lib/harmony";
import { playChord, playTonic, Instrument } from "@/lib/sound";

interface Props {
  currentKeyIndex: number;
  currentMode: Mode;
  chordType: ChordType;
  instrument: Instrument;
  soundOn: boolean;
}

type QuizType = "degree_ear" | "relative" | "function";

interface Question {
  type: QuizType;
  title: string;
  subtitle: string;
  tonicName: string;
  secretChordName: string;
  secretDegreeIndex: number;
  secretNotes: number[];
  tonicNotes: number[];
  options: { label: string; value: string; isCorrect: boolean }[];
  explanation: string;
}

export function HarmonicQuiz({
  currentKeyIndex,
  currentMode,
  chordType,
  instrument,
  soundOn,
}: Props) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [quizType, setQuizType] = useState<QuizType | "all">("degree_ear");

  const soundPlayedRef = useRef(false);

  // Generate a random question
  const generateQuestion = (): Question => {
    // Pick either current key or random key
    const useCurrent = Math.random() < 0.6;
    const keyIdx = useCurrent
      ? currentKeyIndex
      : Math.floor(Math.random() * 12);
    const field = getActiveHarmonicField(keyIdx, currentMode, chordType);

    // Pick a question type
    const types: QuizType[] =
      quizType === "all" ? ["degree_ear", "relative", "function"] : [quizType];
    const pickedType = types[Math.floor(Math.random() * types.length)]!;

    if (pickedType === "degree_ear") {
      // Pick random degree (0..6)
      const degreeIdx = Math.floor(Math.random() * 7);
      const targetChord = field.chords[degreeIdx]!;
      const roman = ROMAN_DEGREES[degreeIdx]!;

      // 4 choices
      const allDegIndices = [0, 1, 2, 3, 4, 5, 6];
      const distractors = allDegIndices
        .filter((d) => d !== degreeIdx)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      const choices = [degreeIdx, ...distractors]
        .sort(() => 0.5 - Math.random())
        .map((d) => ({
          label: `${ROMAN_DEGREES[d]} (${field.chords[d]!.chord})`,
          value: String(d),
          isCorrect: d === degreeIdx,
        }));

      const funcName =
        degreeIdx === 0
          ? "Tônica (repouso)"
          : degreeIdx === 3
          ? "Subdominante (afastamento)"
          : degreeIdx === 4
          ? "Dominante (tensão)"
          : degreeIdx === 5
          ? "Relativo Menor"
          : degreeIdx === 6
          ? "Sensível / Diminuto"
          : "Grau intermediário";

      return {
        type: "degree_ear",
        title: `Qual é o grau deste acorde em ${field.tonicName}?`,
        subtitle: "Ouça a tônica de referência e identifique o acorde tocado",
        tonicName: field.tonicName,
        secretChordName: targetChord.chord,
        secretDegreeIndex: degreeIdx,
        secretNotes: targetChord.notes,
        tonicNotes: field.chords[0]!.notes,
        options: choices,
        explanation: `O acorde era ${targetChord.chord} (${roman}), que tem função de ${funcName}.`,
      };
    } else if (pickedType === "relative") {
      // Relative key question
      const isMajor = currentMode === "major";
      const fieldEntry = FIELDS[keyIdx]!;
      const rootKey = isMajor ? fieldEntry.majorKey : fieldEntry.minorKey;
      const relativeKey = isMajor ? fieldEntry.minorKey : fieldEntry.majorKey;

      // Distractors from other keys
      const distractorKeys = FIELDS.filter((_, i) => i !== keyIdx)
        .map((f) => (isMajor ? f.minorKey : f.majorKey))
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const choices = [relativeKey, ...distractorKeys]
        .sort(() => 0.5 - Math.random())
        .map((k) => ({
          label: k,
          value: k,
          isCorrect: k === relativeKey,
        }));

      return {
        type: "relative",
        title: `Qual é o ${isMajor ? "menor" : "maior"} relativo de ${rootKey}?`,
        subtitle:
          "Os acordes relativos compartilham a mesma armadura de clave na roda",
        tonicName: rootKey,
        secretChordName: relativeKey,
        secretDegreeIndex: isMajor ? 5 : 2,
        secretNotes: field.chords[isMajor ? 5 : 2]!.notes,
        tonicNotes: field.chords[0]!.notes,
        options: choices,
        explanation: `O relativo de ${rootKey} é ${relativeKey}. No campo maior, o relativo menor é sempre o VI grau!`,
      };
    } else {
      // Function question (Tônica, Subdominante, Dominante)
      const targetDeg = Math.random() < 0.5 ? 4 : 3; // IV (Subdominante) ou V (Dominante)
      const targetChord = field.chords[targetDeg]!;
      const targetRole = targetDeg === 4 ? "Dominante (tensão para resolução)" : "Subdominante (preparação)";

      const allDegIndices = [0, 1, 2, 3, 4, 5, 6];
      const distractors = allDegIndices
        .filter((d) => d !== targetDeg)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const choices = [targetDeg, ...distractors]
        .sort(() => 0.5 - Math.random())
        .map((d) => ({
          label: `${field.chords[d]!.chord} (${ROMAN_DEGREES[d]})`,
          value: String(d),
          isCorrect: d === targetDeg,
        }));

      return {
        type: "function",
        title: `Em ${field.tonicName}, qual acorde tem função ${targetRole.split(" ")[0]}?`,
        subtitle: targetRole,
        tonicName: field.tonicName,
        secretChordName: targetChord.chord,
        secretDegreeIndex: targetDeg,
        secretNotes: targetChord.notes,
        tonicNotes: field.chords[0]!.notes,
        options: choices,
        explanation: `Em ${field.tonicName}, o acorde ${targetChord.chord} (${ROMAN_DEGREES[targetDeg]}) atua como ${targetRole}.`,
      };
    }
  };

  // Play question audio (Tonic reference then mystery chord)
  const playQuestionAudio = (q: Question) => {
    if (!soundOn) return;
    // 1. Play tonic reference
    playChord(q.tonicNotes, instrument);
    // 2. Play secret chord 950ms later
    setTimeout(() => {
      playChord(q.secretNotes, instrument);
    }, 950);
  };

  // Start / Next Question
  const nextQuestion = () => {
    const q = generateQuestion();
    setQuestion(q);
    setSelectedAnswer(null);
    setIsAnswered(false);
    soundPlayedRef.current = false;

    // Auto-play audio if sound is on
    setTimeout(() => {
      playQuestionAudio(q);
    }, 200);
  };

  // Init when opened
  useEffect(() => {
    if (isOpen && !question) {
      nextQuestion();
    }
  }, [isOpen]);

  const handleSelectAnswer = (option: { label: string; value: string; isCorrect: boolean }) => {
    if (isAnswered) return;
    setSelectedAnswer(option.value);
    setIsAnswered(true);
    setTotalAnswered((t) => t + 1);

    if (option.isCorrect) {
      setScore((s) => s + 10);
      setStreak((st) => st + 1);
    } else {
      setStreak(0);
    }

    // Play secret chord to verify
    if (question && soundOn) {
      playChord(question.secretNotes, instrument);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-border bg-card/60 p-4 shadow-xs backdrop-blur-xs">
      {/* Accordion Trigger Header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between transition-colors cursor-pointer text-left"
      >
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 shrink-0 mt-0.5">
            <Trophy className="size-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="font-display text-base sm:text-lg font-bold text-foreground leading-snug">
                {t("quizTitle")}
              </h2>
              {streak > 1 && (
                <span className="flex items-center gap-0.5 rounded-full bg-orange-500/15 px-1.5 py-0.2 text-[9px] font-mono font-bold text-orange-500 border border-orange-500/30 shrink-0">
                  <Flame className="size-2.5 fill-current" />
                  {streak}x
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug mt-0.5">
              {t("quizSubtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {score > 0 && (
            <span className="font-mono text-xs font-bold text-primary">
              {score} pts
            </span>
          )}
          <div className="flex size-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
            {isOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </div>
        </div>
      </button>

      {/* Quiz Body */}
      {isOpen && (
        <div className="mt-4 border-t border-border/50 pt-3 animate-[slide-up_0.3s_var(--ease-out-expo)_both]">
          {/* Mode Tabs */}
          <div className="flex items-center justify-between gap-1 pb-3">
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {(
                [
                  { id: "degree_ear", label: t("quizDegreeEar") },
                  { id: "relative", label: t("quizRelatives") },
                  { id: "function", label: t("quizFunctions") },
                  { id: "all", label: t("quizMixed") },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setQuizType(tab.id);
                    setTimeout(() => nextQuestion(), 50);
                  }}
                  className={`rounded-md px-2 py-1 text-[10px] font-mono font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    quizType === tab.id
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Accuracy percentage */}
            {totalAnswered > 0 ? (
              <div className="text-[10px] font-mono text-muted-foreground shrink-0 text-center px-1">
                <span className="font-bold text-foreground">{Math.round((score / (totalAnswered * 10)) * 100)}%</span>
              </div>
            ) : (
              <div className="text-[10px] font-mono text-muted-foreground/60 shrink-0 text-center px-1">
                0%
              </div>
            )}
          </div>

          {/* Question Card */}
          {question && (
            <div className="rounded-xl border border-border/70 bg-background/50 p-3.5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-primary font-bold">
                    {t("harmonicChallenge")}
                  </span>
                  <h4 className="font-display text-sm text-foreground leading-snug">
                    {question.title}
                  </h4>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                    {question.subtitle}
                  </p>
                </div>

                {/* Listen Audio Again Button */}
                <button
                  type="button"
                  onClick={() => playQuestionAudio(question)}
                  title={`Ouvir novamente`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition-transform active:scale-90 hover:bg-primary/20 cursor-pointer shadow-xs"
                >
                  <Volume2 className="size-4" />
                </button>
              </div>

              {/* Audio Hint Pills */}
              <div className="flex items-center gap-1.5 mb-3 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => soundOn && playChord(question.tonicNotes, instrument)}
                  className="flex items-center gap-1 rounded bg-card border border-border px-2 py-0.5 text-muted-foreground hover:text-foreground hover:border-primary/40 cursor-pointer"
                >
                  <Volume2 className="size-3 text-primary" />
                  <span>{t("referenceTonic")}: {question.tonicName}</span>
                </button>
                <span className="text-muted-foreground/40 font-mono">→</span>
                <button
                  type="button"
                  onClick={() => soundOn && playChord(question.secretNotes, instrument)}
                  className="flex items-center gap-1 rounded bg-card border border-border px-2 py-0.5 text-muted-foreground hover:text-foreground hover:border-primary/40 cursor-pointer"
                >
                  <HelpCircle className="size-3 text-amber-500" />
                  <span>{t("mysteryChord")}</span>
                </button>
              </div>

              {/* Multiple Choice Options */}
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((opt, i) => {
                  let btnStyle =
                    "border-border bg-card text-foreground hover:border-primary/60 hover:bg-foreground/5";

                  if (isAnswered) {
                    if (opt.isCorrect) {
                      btnStyle =
                        "border-green-500 bg-green-500/15 text-green-400 font-bold ring-1 ring-green-500";
                    } else if (selectedAnswer === opt.value) {
                      btnStyle =
                        "border-red-500 bg-red-500/15 text-red-400 line-through opacity-80";
                    } else {
                      btnStyle = "border-border bg-card/40 text-muted-foreground/50";
                    }
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectAnswer(opt)}
                      className={`flex items-center justify-between rounded-lg border p-2.5 text-left font-mono text-xs transition-all cursor-pointer ${btnStyle} active:scale-95`}
                    >
                      <span className="truncate font-semibold">{opt.label}</span>
                      {isAnswered && opt.isCorrect && (
                        <CheckCircle2 className="size-3.5 text-green-400 shrink-0 ml-1" />
                      )}
                      {isAnswered && !opt.isCorrect && selectedAnswer === opt.value && (
                        <XCircle className="size-3.5 text-red-400 shrink-0 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback and Next Button */}
              {isAnswered && (
                <div className="mt-3 rounded-lg bg-foreground/5 p-2.5 border border-border/50 animate-[slide-up_0.25s_var(--ease-out-expo)_both]">
                  <p className="font-mono text-[11px] text-foreground mb-2">
                    {question.explanation}
                  </p>
                  <button
                    type="button"
                    onClick={nextQuestion}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 font-mono text-xs font-bold text-primary-foreground shadow-xs hover:opacity-90 active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>{t("nextQuestion")}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
