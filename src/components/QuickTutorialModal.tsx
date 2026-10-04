import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Disc,
  GraduationCap,
  Mic,
  Music,
  Check,
  HelpCircle,
  Play,
  RotateCw,
  Layers,
  Volume2,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import workestraLogo from "../assets/workestra-logo.png";

interface QuickTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusSection?: (sectionId: string) => void;
}

export function QuickTutorialModal({
  isOpen,
  onClose,
  onFocusSection,
}: QuickTutorialModalProps) {
  const { language, t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const diffX = touchEndX - touchStartX.current;
      const diffY = touchEndY - touchStartY.current;

      // Ensure horizontal swipe is dominant over vertical scroll
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
        if (diffX < 0) {
          // Swiped left -> Next step
          if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1);
          }
        } else {
          // Swiped right -> Previous step
          if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
          }
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Close on Escape key or handle arrow keys for step navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        handleFinish();
      } else if (e.key === "ArrowRight") {
        if (currentStep < steps.length - 1) {
          setCurrentStep((prev) => prev + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  const handleFinish = () => {
    if (dontShowAgain) {
      localStorage.setItem("workestra_tutorial_seen", "true");
    }
    onClose();
  };

  if (!isOpen) return null;

  const steps = [
    {
      id: "welcome",
      badge: language === "es" ? "Guía Rápido" : language === "en" ? "Quick Guide" : "Guia Rápido",
      title:
        language === "es"
          ? "¡Bienvenido a Workestra Tools!"
          : language === "en"
          ? "Welcome to Workestra Tools!"
          : "Bem-vindo ao Workestra Tools!",
      subtitle:
        language === "es"
          ? "Tu estudio armónico e interactivo completo"
          : language === "en"
          ? "Your complete interactive harmonic studio"
          : "Seu estúdio harmônico interativo completo",
      icon: (
        <img
          src={workestraLogo}
          alt="Workestra Tools Logo"
          className="size-9 object-contain select-none pointer-events-none drop-shadow-sm"
        />
      ),
      content: (
        <div className="space-y-3.5">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {language === "es"
              ? "Domina la armonía musical, la teoría aplicada y el entrenamiento auditivo con herramientas en tiempo real diseñadas para músicos."
              : language === "en"
              ? "Master musical harmony, practical theory, and ear training with real-time tools designed for musicians."
              : "Domine harmonia musical, teoria aplicada e treino auditivo com ferramentas em tempo real projetadas para músicos."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-left">
            <div className="flex items-start gap-2 rounded-xl bg-card border border-border p-2.5">
              <Disc className="size-4 text-primary shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <span className="font-bold text-foreground block">
                  {language === "es" ? "Círculo Armónico" : language === "en" ? "Harmonic Wheel" : "Roda Harmônica"}
                </span>
                <span className="text-muted-foreground">
                  {language === "es"
                    ? "12 tonalidades maiores e menores"
                    : language === "en"
                    ? "12 major & minor keys"
                    : "12 tonalidades maiores e menores"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-card border border-border p-2.5">
              <GraduationCap className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <span className="font-bold text-foreground block">
                  {language === "es" ? "Modo Estudio" : language === "en" ? "Study Mode" : "Modo Estudo"}
                </span>
                <span className="text-muted-foreground">
                  {language === "es"
                    ? "Entrenamiento de oído activo"
                    : language === "en"
                    ? "Active ear training challenge"
                    : "Treino de ouvido e graus ocultos"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-card border border-border p-2.5">
              <Mic className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <span className="font-bold text-foreground block">
                  {language === "es" ? "Afinador Vocal" : language === "en" ? "Vocal Tuner" : "Afinador Vocal"}
                </span>
                <span className="text-muted-foreground">
                  {language === "es"
                    ? "Detector de tono en tiempo real"
                    : language === "en"
                    ? "Real-time vocal pitch detection"
                    : "Detecção de tom em tempo real"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-card border border-border p-2.5">
              <Music className="size-4 text-cyan-500 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <span className="font-bold text-foreground block">
                  {language === "es" ? "Progresiones y Capo" : language === "en" ? "Sequencer & Capo" : "Progressões e Capo"}
                </span>
                <span className="text-muted-foreground">
                  {language === "es"
                    ? "Biblioteca y calculadoras"
                    : language === "en"
                    ? "Library & position solvers"
                    : "Sequenciador e calculadoras"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "wheel",
      badge: "Passo 1 de 4",
      title:
        language === "es"
          ? "1. Círculo de Campos Armónicos"
          : language === "en"
          ? "1. Circle of Fifths & Wheel"
          : "1. Roda de Campos Harmônicos",
      subtitle:
        language === "es"
          ? "Navega y escucha las 12 tonalidades"
          : language === "en"
          ? "Explore and hear all 12 musical keys"
          : "Navegue e ouça todas as 12 tonalidades",
      icon: <Disc className="size-6 text-primary" />,
      content: (
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {language === "es"
              ? "Gira la rueda arrastrándola o usando las flechas laterales para cambiar de tono. Alterna entre Campo Mayor/Menor y Tríadas o Tétradas (7ª)."
              : language === "en"
              ? "Drag the wheel or use side arrows to rotate between keys. Toggle between Major/Minor fields and Triads or Tetrads (7ths)."
              : "Gire a roda arrastrando-a ou usando as setas laterais para alternar entre as 12 tonalidades. Escolha entre Campo Maior/Menor e Tríades ou Tétrades (com 7ª)."}
          </p>

          <div className="rounded-xl bg-muted/40 border border-border/80 p-3 text-xs space-y-2 text-left">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <RotateCw className="size-3.5 text-primary shrink-0" />
              <span>
                {language === "es"
                  ? "Interactividad e Instrumentos:"
                  : language === "en"
                  ? "Interactive Audio & Instruments:"
                  : "Interatividade & Timbres:"}
              </span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px] leading-normal pl-1">
              <li>
                {language === "es"
                  ? "Toca las notas o el centro del círculo para escuchar los acordes reais."
                  : language === "en"
                  ? "Tap notes or the center hub to hear rich acoustic samples."
                  : "Toque nas notas ou no centro do círculo para ouvir os acordes reais."}
              </li>
              <li>
                {language === "es"
                  ? "Haz clic en qualquer acorde da tabela para abrir o diagrama de violão e teclado."
                  : language === "en"
                  ? "Click any chord button to inspect full guitar fretboard & keyboard diagrams."
                  : "Clique em qualquer acorde da tabela para ver o diagrama de violão e teclado."}
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "study",
      badge: "Passo 2 de 4",
      title:
        language === "es"
          ? "2. Modo Estudio y Entrenamiento"
          : language === "en"
          ? "2. Study Mode & Ear Training"
          : "2. Modo Estudo & Desafio",
      subtitle:
        language === "es"
          ? "Oculta las notas para probar tu oído"
          : language === "en"
          ? "Hide notes to test your musical ear"
          : "Oculte notas e graus para testar seu ouvido",
      icon: <GraduationCap className="size-6 text-amber-500" />,
      content: (
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {language === "es"
              ? "Al activar el botón 'Estudio', los nombres de los acordes y grados romanos se ocultan. Escucha el sonido o guíate por la posición en la rueda para adivinar antes de revelar."
              : language === "en"
              ? "Activating 'Study' hides chord names and Roman degrees. Listen to the sound or observe wheel position to guess the chord before revealing it."
              : "Ao ativar o botão 'Estudo', os nomes dos acordes e graus romanos ficam ocultos. Ouça o som ou observe a posição no círculo para adivinhar a tonalidade e os graus antes de revelá-los!"}
          </p>

          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs space-y-2 text-left">
            <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
              <GraduationCap className="size-3.5 shrink-0 text-amber-500" />
              <span>
                {language === "es"
                  ? "Desafío de Percepción:"
                  : language === "en"
                  ? "Ear Perception Challenge:"
                  : "Desafio de Percepção:"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              {language === "es"
                ? "Ideal para aprender a sacar canciones de oído y memorizar las funciones armónicas (Tónica, Subdominante, Dominante)."
                : language === "en"
                ? "Ideal for learning to play songs by ear and memorizing harmonic functions (Tonic, Subdominant, Dominant)."
                : "Ideal para aprender a tirar músicas de ouvido e memorizar as funções harmônicas na prática."}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "vocal",
      badge: "Passo 3 de 4",
      title:
        language === "es"
          ? "3. Detector Vocal & Afinador"
          : language === "en"
          ? "3. Vocal Pitch Detector & Tuner"
          : "3. Detector Vocal & Afinador",
      subtitle:
        language === "es"
          ? "Descubre tu tesitura vocal en tiempo real"
          : language === "en"
          ? "Discover your exact vocal range"
          : "Descubra o tom da sua voz em tempo real",
      icon: <Mic className="size-6 text-emerald-500" />,
      content: (
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {language === "es"
              ? "Usa tu micrófono para cantar y medir tu tono vocal. El medidor indica si tu nota está afinada, bemol o sostenida, clasificando tu rango vocal (Tenor, Soprano, Barítono, etc.)."
              : language === "en"
              ? "Use your microphone to sing and measure your pitch. The meter displays if you are in tune, flat, or sharp, classifying your voice (Tenor, Soprano, Baritone, etc.)."
              : "Ative seu microfone para cantar e medir sua frequência vocal. O ponteiro indica se sua nota está afinada, bemol ou sustenida, além de identificar sua extensão vocal."}
          </p>

          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs space-y-2 text-left">
            <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
              <Mic className="size-3.5 shrink-0 text-emerald-500" />
              <span>
                {language === "es"
                  ? "Sugerencia de Tonalidad:"
                  : language === "en"
                  ? "Key Recommendation:"
                  : "Aplicações de Tom:"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              {language === "es"
                ? "¡Puedes aplicar el tono detectado directamente al círculo armónico para ajustar la música a tu voz!"
                : language === "en"
                ? "You can apply the detected key directly to the harmonic wheel to match songs to your singing range!"
                : "Você pode aplicar o tom detectado diretamente na roda de campos harmônicos para ajustar qualquer música para a sua voz!"}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "tools",
      badge: "Passo 4 de 4",
      title:
        language === "es"
          ? "4. Progresiones & Capotraste"
          : language === "en"
          ? "4. Progressions & Capo Calculator"
          : "4. Progressões & Calculadoras",
      subtitle:
        language === "es"
          ? "Biblioteca de secuencias y calculadora de capo"
          : language === "en"
          ? "Song sequence library & capo position solver"
          : "Biblioteca de sequências e posições para violão",
      icon: <Layers className="size-6 text-cyan-500" />,
      content: (
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {language === "es"
              ? "Involucra la biblioteca de progresiones clásicas y gospel con metrónomo y secuenciador, la calculadora inteligente de capotraste y el Atlas con digitación completa."
              : language === "en"
              ? "Enjoy classic & gospel progression library with built-in metronome, smart capo calculator for guitar, and complete visual chord map atlas."
              : "Explore a biblioteca de progressões gospel e clássicas com sequenciador e metrônomo, a calculadora de capotraste para violão e o mapa visual de digitações!"}
          </p>

          <div className="rounded-xl bg-card border border-border p-3 text-xs text-left flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="size-4 text-primary shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                {language === "es"
                  ? "Puedes reabrir esta guía en el ícono '?' en el menú."
                  : language === "en"
                  ? "Reopen this guide anytime via the '?' button."
                  : "Você pode rever este tutorial clicando no botão '?' no topo do app."}
              </span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentData = steps[currentStep]!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleFinish();
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-lg min-h-[560px] sm:min-h-[600px] max-h-[94vh] rounded-2xl bg-card border border-border shadow-2xl p-5 sm:p-6 outline-none animate-in zoom-in-95 duration-150 flex flex-col justify-between text-center touch-pan-y"
      >
        {/* Header Badge & Close Button */}
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5 shrink-0">
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono text-[10px] font-bold uppercase tracking-wider">
            {currentData.badge}
          </span>

          <button
            type="button"
            onClick={handleFinish}
            aria-label={t("close")}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Inner Content Area (Fixed Height Viewport) */}
        <div className="flex-1 flex flex-col justify-center overflow-y-auto no-scrollbar py-2 my-auto">
          {/* Step Icon & Title */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 mb-2">
            <div className="size-11 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-center shadow-xs">
              {currentData.icon}
            </div>
            <div>
              <h2
                id="tutorial-modal-title"
                className="text-lg sm:text-xl font-bold font-display text-foreground uppercase tracking-tight"
              >
                {currentData.title}
              </h2>
              <p className="text-xs text-primary font-mono font-semibold">
                {currentData.subtitle}
              </p>
            </div>
          </div>

          {/* Step Content */}
          <div className="py-1">{currentData.content}</div>
        </div>

        {/* Footer Area (Step Dots, Don't Show Again & Nav Buttons) */}
        <div className="flex flex-col gap-2 shrink-0 pt-2 border-t border-border/60">
          {/* Step Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                aria-label={`Ir para passo ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStep
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
              />
            ))}
          </div>

          {/* Checkbox: Não mostrar novamente (Don't show again) */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="size-3.5 rounded border-border accent-primary cursor-pointer"
              />
              <span>
                {language === "es"
                  ? "No mostrar este tutorial al inicio"
                  : language === "en"
                  ? "Don't show this tutorial on startup"
                  : "Não mostrar este tutorial ao iniciar"}
              </span>
            </label>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted text-xs font-semibold transition-all cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
                <span>
                  {language === "es" ? "Anterior" : language === "en" ? "Back" : "Anterior"}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {language === "es" ? "Omitir" : language === "en" ? "Skip" : "Pular"}
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 ml-auto"
              >
                <span>
                  {language === "es" ? "Siguiente" : language === "en" ? "Next" : "Próximo"}
                </span>
                <ChevronRight className="size-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 ml-auto"
              >
                <Check className="size-3.5 stroke-[3]" />
                <span>
                  {language === "es" ? "¡Entendido!" : language === "en" ? "Got It!" : "Começar a Usar!"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
