import { useCallback, useEffect, useRef, useState } from "react";
import { FIELDS, mod, norm, Mode, ChordType } from "@/lib/harmony";
import wheelTexture from "@/assets/wheel-texture.png";

const CX = 170;

const R_OUTER = 164;
const R_DIM_LABEL = 146;
const R_MINOR_LABEL = 113;
const R_MAJOR_LABEL = 78;
const R_HUB = 58;

interface Props {
  index: number;
  onIndexChange: (index: number) => void;
  showDegrees?: boolean;
  mode?: Mode;
  chordType?: ChordType;
  studyMode?: boolean;
  isTonicRevealed?: boolean;
  onCenterClick?: () => void;
}

function polar(r: number, deg: number): [string, string] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [(CX + r * Math.cos(a)).toFixed(2), (CX + r * Math.sin(a)).toFixed(2)];
}

/** Annular sector path between radii r0..r1 spanning angles a0..a1 (degrees, 0 = top) */
function sector(r0: number, r1: number, a0: number, a1: number) {
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M ${x0} ${y0} A ${r1} ${r1} 0 0 1 ${x1} ${y1} L ${x2} ${y2} A ${r0} ${r0} 0 0 0 ${x3} ${y3} Z`;
}

interface DegreeMarker {
  degree: string;
  angle: number;
  radius: number;
  width: number;
  height: number;
  type: "tonic" | "major" | "minor" | "dim";
}

/** Degree markers in Major mode (Uppercase Roman: I, II, III, IV, V, VI, VII) */
const MAJOR_MARKERS: DegreeMarker[] = [
  // Outer rim: VII (Bdim)
  { degree: "VII", angle: 0, radius: 164, width: 18, height: 9.5, type: "dim" },
  // Dividing arc r=130: II (Dm), III (Em), VI (Am)
  { degree: "II", angle: -15, radius: 130, width: 14, height: 9, type: "minor" },
  { degree: "III", angle: 0, radius: 130, width: 16, height: 9, type: "minor" },
  { degree: "VI", angle: 15, radius: 130, width: 14, height: 9, type: "minor" },
  // Dividing arc r=98: IV (F), I (C - Tônica Maior), V (G)
  { degree: "IV", angle: -30, radius: 98, width: 15, height: 9, type: "major" },
  { degree: "I", angle: 0, radius: 98, width: 13, height: 9, type: "tonic" },
  { degree: "V", angle: 30, radius: 98, width: 13, height: 9, type: "major" },
];

/** Degree markers in Minor mode (Uppercase Roman: I, II, III, IV, V, VI, VII) */
const MINOR_MARKERS: DegreeMarker[] = [
  // Outer rim: II (Ddim / Bdim)
  { degree: "II", angle: 0, radius: 164, width: 16, height: 9.5, type: "dim" },
  // Dividing arc r=130: IV (Fm), V (Gm), III (Eb)
  { degree: "IV", angle: -15, radius: 130, width: 15, height: 9, type: "minor" },
  { degree: "V", angle: 0, radius: 130, width: 13, height: 9, type: "minor" },
  { degree: "III", angle: 15, radius: 130, width: 16, height: 9, type: "major" },
  // Dividing arc r=98: VI (Ab), I (Cm - Tônica Menor!), VII (Bb)
  { degree: "VI", angle: -30, radius: 98, width: 15, height: 9, type: "major" },
  { degree: "I", angle: 0, radius: 98, width: 13, height: 9, type: "tonic" },
  { degree: "VII", angle: 30, radius: 98, width: 17, height: 9, type: "major" },
];

export function HarmonicWheel({
  index,
  onIndexChange,
  showDegrees = true,
  mode = "major",
  chordType = "triad",
  studyMode = false,
  isTonicRevealed = !studyMode,
  onCenterClick,
}: Props) {
  const [rotation, setRotation] = useState(-index * 30);
  const rotRef = useRef(rotation);
  rotRef.current = rotation;

  const dragging = useRef(false);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const lastAngle = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dragging.current) return;
    const current = rotRef.current;
    const targetBase = -index * 30;
    const diff = norm(targetBase - current);
    if (Math.abs(diff) > 0.1) {
      const next = current + diff;
      rotRef.current = next;
      setRotation(next);
    }
  }, [index]);

  const angleAt = useCallback((x: number, y: number) => {
    const el = wrapRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return (Math.atan2(y - (rect.top + rect.height / 2), x - (rect.left + rect.width / 2)) * 180) / Math.PI;
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Only activate drag if the touch/click is inside the circular wheel disk
    const maxRadius = (rect.width / 2) * (R_OUTER / CX);
    if (dist > maxRadius) {
      return;
    }

    dragging.current = true;
    setIsDraggingState(true);
    lastAngle.current = angleAt(e.clientX, e.clientY);
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // fallback
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const a = angleAt(e.clientX, e.clientY);
    const d = norm(a - lastAngle.current);
    lastAngle.current = a;
    const next = rotRef.current + d;
    rotRef.current = next;
    setRotation(next);
    const live = mod(Math.round(-next / 30), 12);
    if (live !== index) onIndexChange(live);
  };

  const endDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDraggingState(false);
    const snapped = Math.round(rotRef.current / 30) * 30;
    rotRef.current = snapped;
    setRotation(snapped);
    onIndexChange(mod(Math.round(-snapped / 30), 12));
  };

  const isMinor = mode === "minor";
  const currentField = FIELDS[index]!;
  const markers = isMinor ? MINOR_MARKERS : MAJOR_MARKERS;
  const isTetrad = chordType === "tetrad";
  const hubTonic = isTetrad
    ? isMinor
      ? currentField.minorTetrads[0]
      : currentField.majorTetrads[0]
    : isMinor
    ? currentField.minorKey
    : currentField.majorKey;

  return (
    <div
      ref={wrapRef}
      className={`relative mx-auto aspect-square w-full max-w-[340px] select-none ${
        isDraggingState ? "touch-none" : "touch-pan-y"
      }`}
      style={{
        cursor: isDraggingState ? "grabbing" : "grab",
        animation: "wheel-entry 0.8s var(--ease-out-expo) both",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* 3D Floating Ground Shadow Layer 1: Intense diffused ambient ground projection */}
      <div
        className={`pointer-events-none absolute inset-[2.94%] rounded-full bg-black/50 dark:bg-black/90 blur-2xl transition-all duration-300 ${
          isDraggingState ? "translate-y-7 scale-90 opacity-100 blur-3xl" : "translate-y-5 scale-95 opacity-90"
        }`}
        aria-hidden="true"
      />

      {/* 3D Floating Ground Shadow Layer 2: Deep directional drop shadow */}
      <div
        className={`pointer-events-none absolute inset-[2.94%] rounded-full transition-all duration-300 ${
          isDraggingState
            ? "shadow-[0_28px_60px_rgba(0,0,0,0.55),0_14px_28px_rgba(0,0,0,0.35)] dark:shadow-[0_32px_75px_rgba(0,0,0,0.95),0_16px_32px_rgba(235,94,40,0.4)] scale-[0.97]"
            : "shadow-[0_22px_50px_rgba(0,0,0,0.4),0_10px_20px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.9),0_12px_24px_rgba(235,94,40,0.3)]"
        }`}
        aria-hidden="true"
      />

      {/* Rotating face */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: dragging.current
            ? "none"
            : "transform 520ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <svg viewBox="0 0 340 340" className="size-full">
          <defs>
            <clipPath id="wheel-clip">
              <circle cx={CX} cy={CX} r={R_OUTER + 1} />
            </clipPath>
          </defs>
          <g clipPath="url(#wheel-clip)">
            <circle cx={CX} cy={CX} r={R_OUTER + 1} className="fill-card stroke-border" strokeWidth={1} />

            {/* Slice radial boundaries — 12 slices of 30° */}
            {Array.from({ length: 12 }, (_, i) => {
              const a = i * 30 + 15;
              const [x1, y1] = polar(R_HUB, a);
              const [x2, y2] = polar(98, a);
              const [x3, y3] = polar(130, a);
              const [x4, y4] = polar(R_OUTER, a);
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-border" strokeWidth={1} />
                  <line x1={x3} y1={y3} x2={x4} y2={y4} className="stroke-border" strokeWidth={1} />
                </g>
              );
            })}

            {/* Middle ring sub-cells: 24 dividers of 15° */}
            {Array.from({ length: 24 }, (_, j) => {
              const a = j * 15 + 7.5;
              const [x1, y1] = polar(98, a);
              const [x2, y2] = polar(130, a);
              return <line key={j} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-border" strokeWidth={1} />;
            })}

            {/* Concentric ring separators */}
            {[R_HUB, 98, 130].map((r) => (
              <circle key={r} cx={CX} cy={CX} r={r} fill="none" className="stroke-border" strokeWidth={1} />
            ))}
            <circle cx={CX} cy={CX} r={R_OUTER} fill="none" className="stroke-foreground/30" strokeWidth={1.5} />

            {/* Labels — exactly ONE clean label per position, ZERO duplication */}
            {FIELDS.map((f, i) => {
              const isAtTopVisor = i === index;

              const centerTonic = studyMode && isAtTopVisor
                ? "?"
                : isTetrad
                ? isMinor
                  ? f.minorTetrads[0]
                  : f.majorTetrads[0]
                : isMinor
                ? f.minorKey
                : f.majorKey;

              const rawDimLabel = studyMode && isAtTopVisor
                ? "?"
                : isTetrad
                ? isMinor
                  ? f.minorTetrads[1]
                  : f.majorTetrads[6]
                : isMinor
                ? f.minorDimKey
                : f.dimKey;

              // Use ° for diminished triads (e.g. B°) and ø for half-diminished tetrads (e.g. Bø)
              const dimLabel = typeof rawDimLabel === "string"
                ? rawDimLabel.replace(/m7\(b5\)/g, "ø").replace(/dim/g, "°")
                : rawDimLabel;

              const rawMiddleCenter = studyMode && isAtTopVisor
                ? "?"
                : isTetrad
                ? isMinor
                  ? f.minorTetrads[4]
                  : f.majorTetrads[2]
                : isMinor
                ? f.minorChords[4]
                : f.majorChords[2];

              const middleCenter = typeof rawMiddleCenter === "string"
                ? rawMiddleCenter.replace(/m7\(b5\)/g, "ø").replace(/dim/g, "°")
                : rawMiddleCenter;

              const rawMiddleRight = studyMode && isAtTopVisor
                ? "?"
                : isTetrad
                ? isMinor
                  ? f.minorTetrads[2]
                  : f.majorTetrads[5]
                : isMinor
                ? f.minorChords[2]
                : f.majorChords[5];

              const middleRight = typeof rawMiddleRight === "string"
                ? rawMiddleRight.replace(/m7\(b5\)/g, "ø").replace(/dim/g, "°")
                : rawMiddleRight;

              return (
                <g key={`${f.majorKey}-${isMinor ? "min" : "maj"}`}>
                  {/* Sector Center at i * 30° */}
                  <g transform={`rotate(${i * 30} ${CX} ${CX})`}>
                    {/* Outer Ring Diminished / Half-Diminished Note (ex: B° in Triads, Bø in Tetrads) */}
                    <text
                      x={CX}
                      y={CX - R_DIM_LABEL}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-foreground font-mono font-semibold"
                      fontSize={10.5}
                      letterSpacing={0.2}
                    >
                      {dimLabel}
                    </text>

                    {/* Middle Ring Center Note */}
                    <text
                      x={CX}
                      y={CX - R_MINOR_LABEL}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-foreground font-sans font-semibold"
                      fontSize={isTetrad ? 8.5 : 10}
                      letterSpacing={isTetrad ? -0.2 : 0}
                    >
                      {middleCenter}
                    </text>

                    {/* Inner Ring Tonic: C in Major, Cm in Minor */}
                    <text
                      x={CX}
                      y={CX - R_MAJOR_LABEL}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-foreground font-display font-bold"
                      fontSize={isTetrad ? (isMinor ? 11.5 : 12.5) : (isMinor ? 16 : 18)}
                      letterSpacing={isTetrad ? -0.3 : 0}
                    >
                      {centerTonic}
                    </text>

                    {f.majorAlt && !isMinor && !isTetrad && (
                      <text
                        x={CX}
                        y={CX - R_MAJOR_LABEL + 13}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-muted-foreground font-mono"
                        fontSize={7.5}
                      >
                        {`/${f.majorAlt}`}
                      </text>
                    )}
                  </g>

                  {/* Middle Ring Right Note (+15°) */}
                  <g transform={`rotate(${i * 30 + 15} ${CX} ${CX})`}>
                    <text
                      x={CX}
                      y={CX - R_MINOR_LABEL}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-foreground font-sans font-semibold"
                      fontSize={isTetrad ? 8.5 : 10}
                      letterSpacing={isTetrad ? -0.2 : 0}
                    >
                      {middleRight}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Static viewfinder window with Uppercase Roman Degree Markers */}
      <svg viewBox="0 0 340 340" className="pointer-events-none absolute inset-0 size-full">
        {/* Transparent highlighting sectors for the active 7 chords */}
        <path d={sector(R_HUB, 98, -46, 46)} className="fill-primary/15 stroke-primary/60 dark:fill-primary/20 dark:stroke-primary/80" strokeWidth={1.2} />
        <path d={sector(98, 130, -23, 23)} className="fill-primary/15 stroke-primary/60 dark:fill-primary/20 dark:stroke-primary/80" strokeWidth={1.2} />
        <path d={sector(130, R_OUTER, -14, 14)} className="fill-primary/15 stroke-primary/60 dark:fill-primary/20 dark:stroke-primary/80" strokeWidth={1.2} />

        {/* Outer visor tab pointing to diminished chord */}
        <polygon points={`${CX},1 ${CX - 4.5},5.5 ${CX + 4.5},5.5`} className="fill-primary" />

        {/* Precision Uppercase Roman Degree Markers on boundary arcs */}
        {showDegrees && (
          <g className="transition-opacity duration-200">
            {markers.map((b) => {
              const [xStr, yStr] = polar(b.radius, b.angle);
              const bx = parseFloat(xStr);
              const by = parseFloat(yStr);

              const isTonic = b.type === "tonic";

              return (
                <g key={b.degree} transform={`translate(${bx}, ${by})`} className="select-none">
                  {/* Caliper border badge with crisp contrasting border */}
                  <rect
                    x={-b.width / 2}
                    y={-b.height / 2}
                    width={b.width}
                    height={b.height}
                    rx={2.5}
                    className={
                      isTonic
                        ? "fill-primary stroke-background"
                        : "fill-card stroke-primary/80 dark:stroke-primary"
                    }
                    strokeWidth={0.8}
                  />
                  {/* Uppercase Roman Degree text: e.g. I / II / III / IV / V / VI / VII or ? in studyMode */}
                  <text
                    x={0}
                    y={0.5}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={
                      isTonic
                        ? "fill-primary-foreground font-mono font-bold"
                        : "fill-primary font-mono font-bold"
                    }
                    fontSize={studyMode ? 7.5 : 6.8}
                    letterSpacing={-0.2}
                  >
                    {studyMode ? "?" : b.degree}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Center hub — displays Cm in Minor, C in Major, or ? in Study Mode */}
      <button
        type="button"
        onClick={studyMode ? onCenterClick : undefined}
        disabled={!studyMode}
        title={studyMode ? (isTonicRevealed ? "Tônica revelada" : "Clique para revelar a tônica") : undefined}
        className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-foreground text-background shadow-md border-2 border-background/20 select-none ${
          studyMode ? "cursor-pointer hover:scale-105 active:scale-95 transition-transform" : "cursor-default"
        }`}
        style={{ width: `${(R_HUB * 2) / 340 * 100}%`, aspectRatio: "1" }}
      >
        <span className="font-mono text-[7px] uppercase tracking-[0.2em] opacity-60">
          {isMinor ? "Menor" : "Maior"}
        </span>
        <span
          key={studyMode && !isTonicRevealed ? "hidden-tonic" : hubTonic}
          className={`font-display leading-none tracking-tight animate-[hub-pop_0.35s_var(--ease-out-expo)_both] ${
            studyMode && !isTonicRevealed
              ? "text-3xl text-primary font-bold"
              : isTetrad
              ? hubTonic.length > 3
                ? "text-base"
                : "text-lg"
              : "text-2xl"
          }`}
        >
          {studyMode && !isTonicRevealed ? "?" : hubTonic}
        </span>
      </button>
    </div>
  );
}
