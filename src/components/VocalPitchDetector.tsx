import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  RotateCcw,
  Target,
  Trophy,
  Award,
  ChevronDown,
  ChevronUp,
  Activity,
  Sliders,
  Play,
  Square,
  HelpCircle,
} from "lucide-react";
import {
  detectPitchYIN,
  PitchDetectionResult,
  estimateTonalitiesFromNotes,
  KeyMatchSuggestion,
  classifyVocalRange,
  VocalClassification,
  getNoteDetails,
  NOTE_NAMES_PT,
  NOTE_NAMES_EN,
  A4_FREQ,
} from "../lib/pitchDetector";
import { playTonic, playSingleNote, Instrument } from "../lib/sound";
import { ActiveHarmonicField } from "../lib/harmony";

interface VocalPitchDetectorProps {
  currentField: ActiveHarmonicField;
  currentMode: "major" | "minor";
  instrument: Instrument;
  soundOn: boolean;
  onApplyKey: (keyIndex: number, mode: "major" | "minor") => void;
  onClose?: () => void;
  expandTrigger?: number;
}

export function VocalPitchDetector({
  currentField,
  currentMode,
  instrument,
  soundOn,
  onApplyKey,
  expandTrigger,
}: VocalPitchDetectorProps) {
  const { language, t } = useLanguage();
  // Mic state
  const [isListening, setIsListening] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [notationStyle, setNotationStyle] = useState<"latin" | "anglo">("latin"); // "Dó, Ré..." vs "C, D..."
  const [sensitivity, setSensitivity] = useState<number>(0.15); // YIN threshold: lower = stricter
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    if (expandTrigger !== undefined && expandTrigger > 0) {
      setIsCollapsed(false);
      setTimeout(() => {
        const el = document.getElementById("vocal-pitch-detector-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 60);
    }
  }, [expandTrigger]);

  // Live pitch state
  const [pitchResult, setPitchResult] = useState<PitchDetectionResult | null>(null);
  const [smoothedCents, setSmoothedCents] = useState<number>(0);
  const [recentNotesHistory, setRecentNotesHistory] = useState<number[]>([]);
  const [noteHistogram, setNoteHistogram] = useState<Record<number, number>>({});
  const [keySuggestions, setKeySuggestions] = useState<KeyMatchSuggestion[]>([]);

  // Vocal range tracking
  const [minSungMidi, setMinSungMidi] = useState<number | null>(null);
  const [maxSungMidi, setMaxSungMidi] = useState<number | null>(null);
  const [vocalClassification, setVocalClassification] = useState<VocalClassification | null>(null);

  // Pitch Hold Challenge state
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [challengeTargetPitch, setChallengeTargetPitch] = useState<number>(60); // Middle C (C4)
  const [challengeHoldProgress, setChallengeHoldProgress] = useState(0); // 0 to 100%
  const [challengeSuccess, setChallengeSuccess] = useState(false);
  const [challengeScore, setChallengeScore] = useState<number>(0);

  // Reference tone playing state
  const [playingRefNote, setPlayingRefNote] = useState<string | null>(null);

  // Audio nodes refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const startListening = async () => {
    setMicPermissionError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador não suporta captura de microfone via Web Audio.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      mediaStreamRef.current = stream;
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize);

      setIsListening(true);
      startPitchLoop();
    } catch (err: unknown) {
      console.error("Erro ao acessar microfone:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Permissão de microfone negada. Por favor, libere o microfone no navegador.";
      setMicPermissionError(message);
      setIsListening(false);
    }
  };

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsListening(false);
    setPitchResult(null);
  }, []);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Main real-time pitch detection loop
  const startPitchLoop = () => {
    let lastValidPitchTime = Date.now();

    const loop = () => {
      if (!analyserRef.current || !audioContextRef.current || !bufferRef.current) return;

      const analyser = analyserRef.current;
      const buffer = bufferRef.current;
      analyser.getFloatTimeDomainData(buffer as unknown as Float32Array<ArrayBuffer>);

      // Draw real-time waveform on canvas
      drawWaveform(buffer);

      const result = detectPitchYIN(
        buffer,
        audioContextRef.current.sampleRate,
        sensitivity,
        60,
        1300
      );

      const now = Date.now();

      if (result) {
        lastValidPitchTime = now;
        setPitchResult(result);

        // Smooth cents transition (exponential smoothing)
        setSmoothedCents((prev) => prev * 0.4 + result.cents * 0.6);

        // Update note histogram for key detection if clarity and volume are good
        if (result.clarity > 0.65 && result.volume > 0.08) {
          const pitchClass = result.noteMidi % 12;

          setRecentNotesHistory((prev) => {
            const next = [result.noteMidi, ...prev.slice(0, 19)];
            return next;
          });

          setNoteHistogram((prev) => {
            const next = { ...prev, [pitchClass]: (prev[pitchClass] || 0) + 1 };
            const suggestions = estimateTonalitiesFromNotes(next);
            setKeySuggestions(suggestions);
            return next;
          });

          // Track Vocal Range (min and max pitch)
          setMinSungMidi((prev) => {
            const nextMin = prev === null ? result.noteMidi : Math.min(prev, result.noteMidi);
            return nextMin;
          });
          setMaxSungMidi((prev) => {
            const nextMax = prev === null ? result.noteMidi : Math.max(prev, result.noteMidi);
            return nextMax;
          });
        }

        // Handle Singing Pitch Challenge if active
        if (isChallengeActive) {
          const targetMidi = challengeTargetPitch;
          const isTargetNote = result.noteMidi === targetMidi || Math.abs(result.midi - targetMidi) <= 0.45;
          const isAccurate = Math.abs(result.cents) <= 15;

          if (isTargetNote && isAccurate) {
            if (holdStartTimeRef.current === null) {
              holdStartTimeRef.current = now;
            }
            const heldDuration = now - holdStartTimeRef.current;
            const progress = Math.min(100, Math.round((heldDuration / 2500) * 100));
            setChallengeHoldProgress(progress);

            if (progress >= 100 && !challengeSuccess) {
              setChallengeSuccess(true);
              setChallengeScore((s) => s + 100);
            }
          } else {
            // Decay progress slowly
            holdStartTimeRef.current = null;
            setChallengeHoldProgress((p) => Math.max(0, p - 8));
          }
        }
      } else {
        // No pitch detected
        if (now - lastValidPitchTime > 450) {
          setPitchResult(null);
          setSmoothedCents((prev) => prev * 0.85);
          if (isChallengeActive) {
            holdStartTimeRef.current = null;
            setChallengeHoldProgress((p) => Math.max(0, p - 6));
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  // Recalculate vocal classification when min/max change
  useEffect(() => {
    if (minSungMidi !== null && maxSungMidi !== null && maxSungMidi >= minSungMidi) {
      const classification = classifyVocalRange(minSungMidi, maxSungMidi, language);
      setVocalClassification(classification);
    }
  }, [minSungMidi, maxSungMidi, language]);

  // Waveform oscilloscope renderer
  const drawWaveform = (data: Float32Array<ArrayBufferLike> | Float32Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isListening ? "rgba(234, 179, 8, 0.7)" : "rgba(148, 163, 184, 0.3)";
    ctx.beginPath();

    const sliceWidth = width / (data.length / 4);
    let x = 0;

    for (let i = 0; i < data.length; i += 4) {
      const v = data[i] * 2.5;
      const y = (height / 2) + v * (height / 2.2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  const handleClearHistory = () => {
    setRecentNotesHistory([]);
    setNoteHistogram({});
    setKeySuggestions([]);
    setMinSungMidi(null);
    setMaxSungMidi(null);
    setVocalClassification(null);
  };

  // Reference note playback
  const handlePlayReferencePitch = (noteId: string, midi: number) => {
    setPlayingRefNote(noteId);
    if (soundOn) {
      playSingleNote(midi, instrument);
    }
    setTimeout(() => {
      setPlayingRefNote(null);
    }, 1200);
  };

  // Tuner needle rotation calculation (-50 cents = -45 deg, +50 cents = +45 deg)
  const needleRotation = Math.max(-48, Math.min(48, (smoothedCents / 50) * 45));

  // Determine tuning accuracy color & label
  const absCents = Math.abs(smoothedCents);
  const isInTune = pitchResult !== null && absCents <= 8;
  const isSlightlyOff = pitchResult !== null && absCents > 8 && absCents <= 20;

  let tuneStatusText = "Aguardando voz...";
  let tuneStatusBadgeColor = "bg-muted/60 text-muted-foreground border-border";

  if (pitchResult) {
    if (isInTune) {
      tuneStatusText = "🎯 AFINADO PERFEITO!";
      tuneStatusBadgeColor = "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 ring-2 ring-emerald-500/20";
    } else if (smoothedCents < 0) {
      tuneStatusText = isSlightlyOff ? "♭ Um pouco baixo (Bemol)" : "♭ Muito baixo (Aumente o tom)";
      tuneStatusBadgeColor = "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";
    } else {
      tuneStatusText = isSlightlyOff ? "♯ Um pouco alto (Sustenido)" : "♯ Muito alto (Abaixe o tom)";
      tuneStatusBadgeColor = "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    }
  }

  // Find if sung note belongs to current active harmonic field
  const currentFieldNotes = currentField.chords.map((c) => c.chord);
  const sungNoteName = pitchResult ? (notationStyle === "latin" ? pitchResult.latinName : pitchResult.noteName) : null;

  return (
    <div className="w-full rounded-2xl border-2 border-primary/30 bg-card/95 backdrop-blur-md p-4 sm:p-5 shadow-lg transition-all duration-300">
      {/* Header with Title, Status & Toggle buttons */}
      <div className="flex items-start justify-between gap-2.5 border-b border-border/70 pb-3.5">
        <div
          onClick={() => setIsCollapsed((c) => !c)}
          className="flex items-start gap-2.5 cursor-pointer select-none group min-w-0 flex-1"
        >
          <div className="relative flex size-8 sm:size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs shrink-0 mt-0.5">
            {isListening ? (
              <>
                <div className="absolute inset-0 rounded-xl bg-amber-500/20 animate-ping" />
                <Mic className="size-4 text-amber-500 animate-pulse relative z-10" />
              </>
            ) : (
              <MicOff className="size-4 text-muted-foreground relative z-10" />
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="font-display text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                {t("vocalDetectorTitle")}
              </h2>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase shrink-0">
                {t("aiWebAudio")}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug mt-0.5">
              {t("vocalDetectorSubtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <button
            type="button"
            onClick={() => setNotationStyle((s) => (s === "latin" ? "anglo" : "latin"))}
            title={`Alternar notação: ${notationStyle === "latin" ? "Dó, Ré, Mi" : "C, D, E"}`}
            className="flex h-8 items-center gap-1 px-2 rounded-lg border border-border bg-card/80 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all cursor-pointer shadow-xs"
          >
            <span>{notationStyle === "latin" ? t("solfejoNotation") : t("cifraNotation")}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed((c) => !c)}
            aria-label={isCollapsed ? "Expandir detector vocal" : "Recolher detector vocal"}
            className="flex size-8 items-center justify-center rounded-lg border border-border bg-card/80 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all cursor-pointer shadow-xs"
          >
            {isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </button>
        </div>
      </div>

      {/* Permission Error Banner if any with Step-by-Step Guide and Retry Button */}
      {micPermissionError && (
        <div className="mt-3.5 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 p-4 text-xs text-foreground animate-[fade-in_0.3s_both] shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
              <HelpCircle className="size-4" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-display font-bold text-sm text-foreground">
                  Como Liberar o Microfone no seu Aparelho:
                </h4>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  O navegador ou sistema bloqueou o acesso ao microfone. Para liberar em 5 segundos:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-card/80 p-3 rounded-lg border border-border/70">
                <div className="space-y-1">
                  <strong className="text-primary font-mono block">📱 No Celular (Android / Chrome):</strong>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    <li>Toque no <strong>ícone de ajustes/cadeado</strong> ao lado do link do site</li>
                    <li>Toque em <strong>Permissões</strong> &gt; <strong>Microfone</strong> &gt; <strong>Permitir</strong></li>
                    <li><em>Se o app estiver instalado:</em> Vá em Configurações do Celular &gt; Apps &gt; Workestra &gt; Permissões &gt; Microfone.</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <strong className="text-primary font-mono block">🍎 No iPhone / iPad (Safari):</strong>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    <li>Toque no ícone <strong>aA</strong> na barra de navegação</li>
                    <li>Toque em <strong>Ajustes do Site</strong> &gt; <strong>Microfone</strong> &gt; <strong>Permitir</strong></li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={startListening}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 font-mono text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Tentar Novamente (Solicitar Microfone)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMicPermissionError(null)}
                  className="font-mono text-[11px] text-muted-foreground hover:text-foreground cursor-pointer px-2"
                >
                  Fechar aviso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Detector Content */}
      {!isCollapsed && (
        <div className="mt-4 space-y-4 animate-[slide-up_0.3s_var(--ease-out-expo)_both]">
          {/* Main Action Bar: Ativar / Parar Microfone + Waveform Canvas */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              type="button"
              onClick={handleToggleListening}
              className={`flex h-11 w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl px-5 font-mono text-xs font-bold tracking-wider transition-all cursor-pointer shadow-md select-none ${
                isListening
                  ? "bg-rose-500 hover:bg-rose-600 text-white ring-2 ring-rose-500/30"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground ring-2 ring-primary/30"
              } active:scale-98`}
            >
              {isListening ? (
                <>
                  <MicOff className="size-4 stroke-[2.5]" />
                  <span>{t("disableMic")}</span>
                </>
              ) : (
                <>
                  <Mic className="size-4 stroke-[2.5]" />
                  <span>{t("enableMic")}</span>
                </>
              )}
            </button>

            {/* Live Audio Oscilloscope Canvas */}
            <div className="relative flex-1 w-full h-11 rounded-xl border border-border/80 bg-background/80 overflow-hidden flex items-center px-2">
              <canvas
                ref={canvasRef}
                width={300}
                height={40}
                className="w-full h-full object-contain"
              />
              {!isListening && (
                <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-muted-foreground/70 bg-card/40 backdrop-blur-[1px]">
                  Clique em "Ativar Microfone" para iniciar
                </div>
              )}
            </div>
          </div>

          {/* AFINADOR GAUGE / PONTEIRO DE AFINAÇÃO (Estilo afinador profissional de violão/voz) */}
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card/80 to-background p-4 sm:p-5 shadow-inner">
            {/* Background Glow Effect */}
            {pitchResult && (
              <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-300 blur-2xl opacity-20 ${
                  isInTune ? "bg-emerald-500" : smoothedCents < 0 ? "bg-sky-500" : "bg-amber-500"
                }`}
              />
            )}

            {/* Gauge Dial SVG & Rotating Needle */}
            <div className="relative flex flex-col items-center justify-center">
              <div className="relative w-64 sm:w-72 h-32 flex items-end justify-center">
                {/* SVG Dial Arc */}
                <svg viewBox="0 0 280 140" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="42%" stopColor="#eab308" />
                      <stop offset="50%" stopColor="#22c55e" />
                      <stop offset="58%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>

                  {/* Base Track */}
                  <path
                    d="M 30 130 A 110 110 0 0 1 250 130"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/30"
                    strokeLinecap="round"
                  />

                  {/* Colored Arc */}
                  <path
                    d="M 30 130 A 110 110 0 0 1 250 130"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="4 6"
                    opacity="0.85"
                  />

                  {/* In-Tune Center Target Indicator Zone */}
                  <path
                    d="M 128 20 A 110 110 0 0 1 152 20"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                  />

                  {/* Dial Graduation Marks */}
                  {[-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50].map((cent) => {
                    const angleRad = ((cent / 50) * 45 - 90) * (Math.PI / 180);
                    const cx = 140;
                    const cy = 130;
                    const rInner = cent % 20 === 0 ? 100 : 106;
                    const rOuter = 114;
                    const x1 = cx + rInner * Math.cos(angleRad);
                    const y1 = cy + rInner * Math.sin(angleRad);
                    const x2 = cx + rOuter * Math.cos(angleRad);
                    const y2 = cy + rOuter * Math.sin(angleRad);

                    return (
                      <line
                        key={cent}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={cent === 0 ? "#22c55e" : "currentColor"}
                        strokeWidth={cent === 0 ? "3" : cent % 20 === 0 ? "2" : "1"}
                        className={cent === 0 ? "text-emerald-500" : "text-muted-foreground/60"}
                      />
                    );
                  })}
                </svg>

                {/* PHYSICAL NEEDLE (Ponteiro Giratório com amortecimento suave) */}
                <div
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 origin-bottom transition-transform duration-100 ease-out z-20 pointer-events-none"
                  style={{
                    transform: `translateX(-50%) rotate(${needleRotation}deg)`,
                    height: "105px",
                    width: "4px",
                  }}
                >
                  <div
                    className={`w-full h-full rounded-t-full shadow-lg ${
                      isInTune
                        ? "bg-emerald-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.9)]"
                        : smoothedCents < 0
                        ? "bg-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]"
                        : "bg-amber-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.7)]"
                    }`}
                  />
                  {/* Needle Pivot Cap */}
                  <div className="absolute -bottom-2 -left-2 size-5 rounded-full bg-foreground border-2 border-primary shadow-md" />
                </div>
              </div>

              {/* Cent Label Scale Indicators */}
              <div className="flex w-full max-w-[280px] items-center justify-between px-2 font-mono text-[10px] text-muted-foreground font-semibold mt-3 mb-4">
                <span className="text-sky-500">-50 ¢ (Grave)</span>
                <span className="text-emerald-500 font-bold">0 ¢ (Afinado)</span>
                <span className="text-amber-500">+50 ¢ (Agudo)</span>
              </div>

              {/* Large Central Detected Note Badge */}
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`font-display text-4xl sm:text-5xl font-black uppercase tracking-tight transition-all ${
                      pitchResult
                        ? isInTune
                          ? "text-emerald-500 scale-105"
                          : "text-foreground"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    {pitchResult
                      ? notationStyle === "latin"
                        ? pitchResult.latinName
                        : pitchResult.noteName
                      : "--"}
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-bold text-primary">
                    {pitchResult ? pitchResult.octave : ""}
                  </span>
                </div>

                {/* Status Badge */}
                <div
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold transition-all shadow-xs ${tuneStatusBadgeColor}`}
                >
                  <Activity className="size-3.5" />
                  <span>{tuneStatusText}</span>
                </div>

                {/* Frequency in Hz & Cents readout */}
                <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground pt-1">
                  <span>
                    Frequência:{" "}
                    <strong className="text-foreground">
                      {pitchResult ? `${pitchResult.frequency.toFixed(1)} Hz` : "0.0 Hz"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Desvio:{" "}
                    <strong
                      className={
                        isInTune
                          ? "text-emerald-500"
                          : smoothedCents < 0
                          ? "text-sky-400"
                          : "text-amber-400"
                      }
                    >
                      {pitchResult
                        ? `${smoothedCents >= 0 ? "+" : ""}${Math.round(smoothedCents)} ¢`
                        : "0 ¢"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TONALIDADE DA MÚSICA / VOZ (Key Detection Engine) */}
          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h3 className="font-display text-xs sm:text-sm uppercase font-bold text-foreground">
                  Tom Identificado da Voz / Música
                </h3>
              </div>
              {recentNotesHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground cursor-pointer underline"
                >
                  <RotateCcw className="size-3" />
                  <span>Limpar Histórico</span>
                </button>
              )}
            </div>

            {/* Sung Notes Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                Notas identificadas:
              </span>
              {Object.keys(noteHistogram).length === 0 ? (
                <span className="font-mono text-[11px] italic text-muted-foreground/60">
                  Cante ou assobie algumas notas para analisar a tonalidade...
                </span>
              ) : (
                Object.keys(noteHistogram).map((pStr) => {
                  const p = parseInt(pStr, 10);
                  const noteName = notationStyle === "latin" ? NOTE_NAMES_PT[p] : NOTE_NAMES_EN[p];
                  const isCurrentTonic =
                    (notationStyle === "latin" ? currentField.tonicName : currentField.tonicName) ===
                    noteName;
                  return (
                    <span
                      key={p}
                      className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold border transition-all ${
                        isCurrentTonic
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border"
                      }`}
                    >
                      {noteName}
                    </span>
                  );
                })
              )}
            </div>

            {/* Suggested Keys Ranked Cards with Direct "Aplicar à Roda" Button */}
            {keySuggestions.length > 0 && (
              <div className="mt-2 space-y-2">
                <span className="font-mono text-[11px] font-bold text-foreground block">
                  Tonalidades Mais Prováveis (compatibilidade harmônica):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {keySuggestions.slice(0, 4).map((sug, i) => {
                    const isTop1 = i === 0;
                    return (
                      <div
                        key={`${sug.keyName}-${sug.mode}`}
                        className={`flex flex-col justify-between rounded-xl border p-2.5 transition-all ${
                          isTop1
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border bg-card/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-display text-xs sm:text-sm font-bold text-foreground">
                            {sug.keyName}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                              isTop1
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {sug.score}% Match
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground mt-0.5">
                          {sug.relativeName}
                        </span>

                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/40 pt-2">
                          <span className="font-mono text-[9px] text-muted-foreground">
                            Notas: {sug.matchingNotes.join(", ")}
                          </span>
                          <button
                            type="button"
                            onClick={() => onApplyKey(sug.keyIndex, sug.mode)}
                            className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 font-mono text-[10px] font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                          >
                            <Target className="size-3" />
                            <span>Aplicar à Roda</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* EXTENSÃO VOCAL & TESSITURA (Classificação da voz do cantor) */}
          {vocalClassification && (
            <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2 animate-[fade-in_0.3s_both]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Award className="size-4 text-amber-500" />
                  <h3 className="font-display text-xs sm:text-sm uppercase font-bold text-foreground">
                    Sua Extensão Vocal & Classificação
                  </h3>
                </div>
                <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {vocalClassification.type} ({vocalClassification.category})
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {vocalClassification.description}
              </p>
              <div className="flex items-center justify-between rounded-lg bg-background/80 px-3 py-2 font-mono text-[11px] border border-border/60">
                <span className="text-muted-foreground">Faixa Detectada:</span>
                <span className="font-bold text-primary">
                  {minSungMidi !== null ? getNoteDetails(minSungMidi).fullNotationPt : "--"} até{" "}
                  {maxSungMidi !== null ? getNoteDetails(maxSungMidi).fullNotationPt : "--"}
                </span>
              </div>
            </div>
          )}

          {/* GERADOR DE NOTA GUIA / TOM DE REFERÊNCIA */}
          <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Volume2 className="size-4 text-primary" />
                <h3 className="font-display text-xs sm:text-sm uppercase font-bold text-foreground">
                  Ouvir Tom de Referência (Nota Guia)
                </h3>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                Afinação A4 = 440 Hz
              </span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
              {NOTE_NAMES_PT.map((nPt, idx) => {
                const noteEn = NOTE_NAMES_EN[idx];
                const midi = 60 + idx; // C4=60, C#4=61, D4=62, D#4=63, E4=64, F4=65, F#4=66, G4=67, G#4=68, A4=69, A#4=70, B4=71
                const isPlaying = playingRefNote === noteEn || playingRefNote === nPt;
                return (
                  <button
                    key={nPt}
                    type="button"
                    onClick={() => handlePlayReferencePitch(noteEn, midi)}
                    title={`Ouvir nota guia ${nPt} (${noteEn}4)`}
                    className={`flex h-8 flex-col items-center justify-center rounded-lg border font-mono text-[10px] font-bold transition-all cursor-pointer select-none ${
                      isPlaying
                        ? "bg-primary text-primary-foreground border-primary scale-105 shadow-md"
                        : "bg-secondary/60 hover:bg-secondary border-border text-foreground hover:border-primary/40"
                    }`}
                  >
                    <span>{notationStyle === "latin" ? nPt : noteEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESAFIO DE AFINAÇÃO VOCAL (Treino de Sustentação de Nota) */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" />
                <h3 className="font-display text-xs sm:text-sm uppercase font-bold text-amber-600 dark:text-amber-400">
                  Desafio de Afinação: Sustente a Nota
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChallengeActive((v) => !v);
                  setChallengeHoldProgress(0);
                  setChallengeSuccess(false);
                }}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold border transition-all cursor-pointer shadow-2xs ${
                  isChallengeActive
                    ? "bg-amber-500 text-black border-amber-500 font-extrabold"
                    : "bg-card border-border text-foreground hover:border-amber-500/50"
                }`}
              >
                {isChallengeActive ? (
                  <>
                    <Square className="size-3 fill-current" />
                    <span>PARAR DESAFIO</span>
                  </>
                ) : (
                  <>
                    <Play className="size-3 fill-current" />
                    <span>INICIAR DESAFIO</span>
                  </>
                )}
              </button>
            </div>

            {isChallengeActive && (
              <div className="space-y-2.5 animate-[fade-in_0.3s_both]">
                <p className="text-xs text-muted-foreground">
                  Cante a nota alvo <strong>{getNoteDetails(challengeTargetPitch).fullNotationPt}</strong> e
                  mantenha a voz firme e afinada por 3 segundos consecutivos!
                </p>

                {/* Target Note Selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">Alvo:</span>
                  {[
                    { label: "Dó3 (C3)", midi: 48 },
                    { label: "Mi3 (E3)", midi: 52 },
                    { label: "Sol3 (G3)", midi: 55 },
                    { label: "Dó4 (C4)", midi: 60 },
                    { label: "Mi4 (E4)", midi: 64 },
                    { label: "Sol4 (G4)", midi: 67 },
                    { label: "Lá4 (A4)", midi: 69 },
                  ].map((target) => (
                    <button
                      key={target.midi}
                      type="button"
                      onClick={() => {
                        setChallengeTargetPitch(target.midi);
                        setChallengeHoldProgress(0);
                        setChallengeSuccess(false);
                      }}
                      className={`rounded-md px-2 py-1 font-mono text-[10px] font-bold border transition-all cursor-pointer shrink-0 ${
                        challengeTargetPitch === target.midi
                          ? "bg-amber-500 text-black border-amber-500 shadow-xs"
                          : "bg-card border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>

                {/* Hold Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-muted-foreground">Progresso de Afinação:</span>
                    <span className="font-bold text-amber-500">{challengeHoldProgress}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-card border border-border overflow-hidden">
                    <div
                      className={`h-full transition-all duration-150 rounded-full ${
                        challengeSuccess
                          ? "bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${challengeHoldProgress}%` }}
                    />
                  </div>
                </div>

                {challengeSuccess && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-bounce">
                    <Sparkles className="size-4 shrink-0" />
                    <span>Parabéns! Nota sustentada perfeitamente afinada! (+100 Pontos)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ADVANCED SETTINGS (Sensibilidade do Microfone) */}
          <div className="border-t border-border/60 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Sliders className="size-3" />
              <span>{showAdvanced ? "Ocultar ajustes do microfone" : "Ajustes de sensibilidade do microfone"}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-2 rounded-xl border border-border/60 bg-card/60 p-3 animate-[fade-in_0.2s_both]">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-muted-foreground">Filtro de Ruído / Rigor do Pitch:</span>
                  <span className="font-bold text-foreground">
                    {sensitivity <= 0.12 ? "Alta Precisão (Estúdio)" : sensitivity <= 0.18 ? "Equilibrado (Voz Natural)" : "Permissivo (Ambiente com Ruído)"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.08"
                  max="0.25"
                  step="0.01"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <span className="font-mono text-[10px] text-muted-foreground block">
                  Aumente se o app não estiver captando notas graves/suaves, ou diminua se houver ruído externo.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
