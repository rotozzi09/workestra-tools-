/**
 * Chord Diagrams Engine: Authentic Guitar Fretboard Shapes & Piano Keyboard Layouts
 * Comprehensive coverage for all Diatonic Triads & Tetrads in Major and Minor fields.
 */

export interface GuitarChordShape {
  chord: string;
  baseFret: number; // 1 for first position, or 2, 3, 5, etc.
  frets: (number | "x")[]; // 6 strings: [low E, A, D, G, B, high e]
  fingers?: (number | 0)[]; // 0 = none/open/muted, 1 = index, 2 = middle, 3 = ring, 4 = pinky
  barre?: {
    fret: number;
    fromString: number; // 1 = high e, 6 = low E
    toString: number;
    finger: number;
  };
}

export interface NoteIntervalInfo {
  midi: number;
  pitchClass: number; // 0=C, 1=C#, etc.
  noteName: string; // e.g. "C", "D#"
  ptName: string; // e.g. "Dó", "Ré#"
  intervalName: string; // e.g. "Fundamental (1P)", "Terça Maior (3M)"
  intervalShort: string; // e.g. "1P", "3M", "5J", "7M"
  intervalRole: string; // e.g. "Nota base / Tônica que dá nome ao acorde"
  pianoKeyIndex: number; // Semitone from keyboard start
}

export interface ChordAnalysis {
  chord: string;
  rootName: string;
  fullChordName: string; // e.g. "Ré Menor"
  quality: "major" | "minor" | "diminished" | "major7" | "minor7" | "dominant7" | "half-diminished";
  formula: string; // e.g. "1P - 3m - 5J"
  formulaFullName: string; // e.g. "Fundamental + Terça Menor + Quinta Justa"
  formulaExplained: string; // e.g. "1P (Fundamental) · 3m (Terça Menor) · 5J (Quinta Justa)"
  description: string;
  notes: NoteIntervalInfo[];
  pianoFingerSuggestion: string;
  guitarFingerSuggestion: string;
}

const NOTE_NAMES_PT: Record<string, string> = {
  C: "Dó",
  "C#": "Dó#",
  Db: "Réb",
  D: "Ré",
  "D#": "Ré#",
  Eb: "Mib",
  E: "Mi",
  "E#": "Fá",
  F: "Fá",
  "F#": "Fá#",
  Gb: "Solb",
  G: "Sol",
  "G#": "Sol#",
  Ab: "Láb",
  A: "Lá",
  "A#": "Lá#",
  Bb: "Sib",
  B: "Si",
};

const PITCH_CLASSES: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  "E#": 5,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const PITCH_TO_SHARP_NAME = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * Standard, authentic Guitar Chord Shapes for all diatonic chords.
 * Keys: 6th string low E to 1st string high e: [E, A, D, G, B, e]
 */
export const GUITAR_CHORDS_DB: Record<string, GuitarChordShape> = {
  // --- MAJOR TRIADS ---
  C: {
    chord: "C",
    baseFret: 1,
    frets: ["x", 3, 2, 0, 1, 0],
    fingers: [0, 3, 2, 0, 1, 0],
  },
  D: {
    chord: "D",
    baseFret: 1,
    frets: ["x", "x", 0, 2, 3, 2],
    fingers: [0, 0, 0, 1, 3, 2],
  },
  E: {
    chord: "E",
    baseFret: 1,
    frets: [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
  },
  F: {
    chord: "F",
    baseFret: 1,
    frets: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 1, fromString: 6, toString: 1, finger: 1 },
  },
  G: {
    chord: "G",
    baseFret: 1,
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
  },
  A: {
    chord: "A",
    baseFret: 1,
    frets: ["x", 0, 2, 2, 2, 0],
    fingers: [0, 0, 1, 2, 3, 0],
  },
  B: {
    chord: "B",
    baseFret: 2,
    frets: ["x", 2, 4, 4, 4, 2],
    fingers: [0, 1, 2, 3, 4, 1],
    barre: { fret: 2, fromString: 5, toString: 1, finger: 1 },
  },
  Db: {
    chord: "Db",
    baseFret: 4,
    frets: ["x", 4, 6, 6, 6, 4],
    fingers: [0, 1, 2, 3, 4, 1],
    barre: { fret: 4, fromString: 5, toString: 1, finger: 1 },
  },
  "C#": {
    chord: "C#",
    baseFret: 4,
    frets: ["x", 4, 6, 6, 6, 4],
    fingers: [0, 1, 2, 3, 4, 1],
    barre: { fret: 4, fromString: 5, toString: 1, finger: 1 },
  },
  Eb: {
    chord: "Eb",
    baseFret: 1,
    frets: ["x", "x", 1, 3, 4, 3],
    fingers: [0, 0, 1, 3, 4, 2],
  },
  "D#": {
    chord: "D#",
    baseFret: 1,
    frets: ["x", "x", 1, 3, 4, 3],
    fingers: [0, 0, 1, 3, 4, 2],
  },
  "F#": {
    chord: "F#",
    baseFret: 2,
    frets: [2, 4, 4, 3, 2, 2],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 2, fromString: 6, toString: 1, finger: 1 },
  },
  Gb: {
    chord: "Gb",
    baseFret: 2,
    frets: [2, 4, 4, 3, 2, 2],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 2, fromString: 6, toString: 1, finger: 1 },
  },
  Ab: {
    chord: "Ab",
    baseFret: 4,
    frets: [4, 6, 6, 5, 4, 4],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 4, fromString: 6, toString: 1, finger: 1 },
  },
  "G#": {
    chord: "G#",
    baseFret: 4,
    frets: [4, 6, 6, 5, 4, 4],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 4, fromString: 6, toString: 1, finger: 1 },
  },
  Bb: {
    chord: "Bb",
    baseFret: 1,
    frets: ["x", 1, 3, 3, 3, 1],
    fingers: [0, 1, 2, 3, 4, 1],
    barre: { fret: 1, fromString: 5, toString: 1, finger: 1 },
  },
  "A#": {
    chord: "A#",
    baseFret: 1,
    frets: ["x", 1, 3, 3, 3, 1],
    fingers: [0, 1, 2, 3, 4, 1],
    barre: { fret: 1, fromString: 5, toString: 1, finger: 1 },
  },

  // --- MINOR TRIADS ---
  Cm: {
    chord: "Cm",
    baseFret: 3,
    frets: ["x", 3, 5, 5, 4, 3],
    fingers: [0, 1, 3, 4, 2, 1],
    barre: { fret: 3, fromString: 5, toString: 1, finger: 1 },
  },
  "C#m": {
    chord: "C#m",
    baseFret: 4,
    frets: ["x", 4, 6, 6, 5, 4],
    fingers: [0, 1, 3, 4, 2, 1],
    barre: { fret: 4, fromString: 5, toString: 1, finger: 1 },
  },
  Dm: {
    chord: "Dm",
    baseFret: 1,
    frets: ["x", "x", 0, 2, 3, 1],
    fingers: [0, 0, 0, 2, 3, 1],
  },
  "D#m": {
    chord: "D#m",
    baseFret: 6,
    frets: ["x", 6, 8, 8, 7, 6],
    fingers: [0, 1, 3, 4, 2, 1],
    barre: { fret: 6, fromString: 5, toString: 1, finger: 1 },
  },
  Ebm: {
    chord: "Ebm",
    baseFret: 6,
    frets: ["x", 6, 8, 8, 7, 6],
    fingers: [0, 1, 3, 4, 2, 1],
    barre: { fret: 6, fromString: 5, toString: 1, finger: 1 },
  },
  Em: {
    chord: "Em",
    baseFret: 1,
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
  },
  Fm: {
    chord: "Fm",
    baseFret: 1,
    frets: [1, 3, 3, 1, 1, 1],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 1, fromString: 6, toString: 1, finger: 1 },
  },
  "F#m": {
    chord: "F#m",
    baseFret: 2,
    frets: [2, 4, 4, 2, 2, 2],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 2, fromString: 6, toString: 1, finger: 1 },
  },
  Gm: {
    chord: "Gm",
    baseFret: 3,
    frets: [3, 5, 5, 3, 3, 3],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 3, fromString: 6, toString: 1, finger: 1 },
  },
  "G#m": {
    chord: "G#m",
    baseFret: 4,
    frets: [4, 6, 6, 4, 4, 4],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 4, fromString: 6, toString: 1, finger: 1 },
  },
  Abm: {
    chord: "Abm",
    baseFret: 4,
    frets: [4, 6, 6, 4, 4, 4],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 4, fromString: 6, toString: 1, finger: 1 },
  },
  Am: {
    chord: "Am",
    baseFret: 1,
    frets: ["x", 0, 2, 2, 1, 0],
    fingers: [0, 0, 2, 3, 1, 0],
  },
  "A#m": {
    chord: "A#m",
    baseFret: 1,
    frets: ["x", 1, 3, 3, 2, 1],
    fingers: [0, 1, 3, 4, 2, 1],
    barre: { fret: 1, fromString: 5, toString: 1, finger: 1 },
  },
  Bbm: {
    chord: "Bbm",
    baseFret: 1,
    frets: ["x", 1, 3, 3, 2, 1],
    fingers: [0, 1, 3, 4, 2, 1],
    barre: { fret: 1, fromString: 5, toString: 1, finger: 1 },
  },
  Bm: {
    chord: "Bm",
    baseFret: 2,
    frets: ["x", 2, 4, 4, 3, 2],
    fingers: [0, 1, 3, 4, 2, 1],
    barre: { fret: 2, fromString: 5, toString: 1, finger: 1 },
  },

  // --- DIMINISHED TRIADS ---
  Bdim: {
    chord: "Bdim",
    baseFret: 1,
    frets: ["x", 2, 3, 4, 3, "x"],
    fingers: [0, 1, 2, 4, 3, 0],
  },
  "F#dim": {
    chord: "F#dim",
    baseFret: 1,
    frets: [2, "x", 1, 2, 1, "x"],
    fingers: [3, 0, 1, 4, 2, 0],
  },
  "C#dim": {
    chord: "C#dim",
    baseFret: 3,
    frets: ["x", 4, 5, 3, 5, "x"],
    fingers: [0, 2, 3, 1, 4, 0],
  },
  "G#dim": {
    chord: "G#dim",
    baseFret: 3,
    frets: [4, "x", 3, 4, 3, "x"],
    fingers: [3, 0, 1, 4, 2, 0],
  },
  "D#dim": {
    chord: "D#dim",
    baseFret: 5,
    frets: ["x", 6, 7, 5, 7, "x"],
    fingers: [0, 2, 3, 1, 4, 0],
  },
  "A#dim": {
    chord: "A#dim",
    baseFret: 1,
    frets: ["x", 1, 2, 3, 2, "x"],
    fingers: [0, 1, 2, 4, 3, 0],
  },
  "E#dim": {
    chord: "E#dim",
    baseFret: 1,
    frets: [1, "x", 0, 1, 0, "x"],
    fingers: [2, 0, 0, 1, 0, 0],
  },
  Edim: {
    chord: "Edim",
    baseFret: 1,
    frets: ["x", "x", 2, 3, 2, 3],
    fingers: [0, 0, 1, 3, 2, 4],
  },
  Adim: {
    chord: "Adim",
    baseFret: 1,
    frets: ["x", 0, 1, 2, 1, "x"],
    fingers: [0, 0, 1, 3, 2, 0],
  },
  Ddim: {
    chord: "Ddim",
    baseFret: 1,
    frets: ["x", "x", 0, 1, 3, 1],
    fingers: [0, 0, 0, 1, 3, 2],
  },
  Gdim: {
    chord: "Gdim",
    baseFret: 2,
    frets: [3, "x", 2, 3, 2, "x"],
    fingers: [3, 0, 1, 4, 2, 0],
  },
  Cdim: {
    chord: "Cdim",
    baseFret: 2,
    frets: ["x", 3, 4, 2, 4, "x"],
    fingers: [0, 2, 3, 1, 4, 0],
  },

  // --- MAJOR 7TH TETRADS (7M) ---
  C7M: {
    chord: "C7M",
    baseFret: 1,
    frets: ["x", 3, 2, 0, 0, 0],
    fingers: [0, 3, 2, 0, 0, 0],
  },
  D7M: {
    chord: "D7M",
    baseFret: 1,
    frets: ["x", "x", 0, 2, 2, 2],
    fingers: [0, 0, 0, 1, 2, 3],
    barre: { fret: 2, fromString: 3, toString: 1, finger: 1 },
  },
  E7M: {
    chord: "E7M",
    baseFret: 1,
    frets: [0, 2, 1, 1, 0, 0],
    fingers: [0, 3, 1, 2, 0, 0],
  },
  F7M: {
    chord: "F7M",
    baseFret: 1,
    frets: ["x", "x", 3, 2, 1, 0],
    fingers: [0, 0, 3, 2, 1, 0],
  },
  G7M: {
    chord: "G7M",
    baseFret: 1,
    frets: [3, 2, 0, 0, 0, 2],
    fingers: [2, 1, 0, 0, 0, 3],
  },
  A7M: {
    chord: "A7M",
    baseFret: 1,
    frets: ["x", 0, 2, 1, 2, 0],
    fingers: [0, 0, 2, 1, 3, 0],
  },
  B7M: {
    chord: "B7M",
    baseFret: 2,
    frets: ["x", 2, 4, 3, 4, 2],
    fingers: [0, 1, 3, 2, 4, 1],
    barre: { fret: 2, fromString: 5, toString: 1, finger: 1 },
  },
  Db7M: {
    chord: "Db7M",
    baseFret: 4,
    frets: ["x", 4, 6, 5, 6, 4],
    fingers: [0, 1, 3, 2, 4, 1],
    barre: { fret: 4, fromString: 5, toString: 1, finger: 1 },
  },
  "C#7M": {
    chord: "C#7M",
    baseFret: 4,
    frets: ["x", 4, 6, 5, 6, 4],
    fingers: [0, 1, 3, 2, 4, 1],
    barre: { fret: 4, fromString: 5, toString: 1, finger: 1 },
  },
  Eb7M: {
    chord: "Eb7M",
    baseFret: 5,
    frets: ["x", 6, 8, 7, 8, 6],
    fingers: [0, 1, 3, 2, 4, 1],
    barre: { fret: 6, fromString: 5, toString: 1, finger: 1 },
  },
  "D#7M": {
    chord: "D#7M",
    baseFret: 5,
    frets: ["x", 6, 8, 7, 8, 6],
    fingers: [0, 1, 3, 2, 4, 1],
    barre: { fret: 6, fromString: 5, toString: 1, finger: 1 },
  },
  "F#7M": {
    chord: "F#7M",
    baseFret: 2,
    frets: [2, "x", 3, 3, 2, "x"],
    fingers: [1, 0, 3, 4, 2, 0],
  },
  Gb7M: {
    chord: "Gb7M",
    baseFret: 2,
    frets: [2, "x", 3, 3, 2, "x"],
    fingers: [1, 0, 3, 4, 2, 0],
  },
  Ab7M: {
    chord: "Ab7M",
    baseFret: 4,
    frets: [4, "x", 5, 5, 4, "x"],
    fingers: [1, 0, 3, 4, 2, 0],
  },
  "G#7M": {
    chord: "G#7M",
    baseFret: 4,
    frets: [4, "x", 5, 5, 4, "x"],
    fingers: [1, 0, 3, 4, 2, 0],
  },
  Bb7M: {
    chord: "Bb7M",
    baseFret: 1,
    frets: ["x", 1, 3, 2, 3, 1],
    fingers: [0, 1, 3, 2, 4, 1],
    barre: { fret: 1, fromString: 5, toString: 1, finger: 1 },
  },

  // --- DOMINANT 7TH TETRADS (7) ---
  C7: {
    chord: "C7",
    baseFret: 1,
    frets: ["x", 3, 2, 3, 1, 0],
    fingers: [0, 3, 2, 4, 1, 0],
  },
  D7: {
    chord: "D7",
    baseFret: 1,
    frets: ["x", "x", 0, 2, 1, 2],
    fingers: [0, 0, 0, 2, 1, 3],
  },
  E7: {
    chord: "E7",
    baseFret: 1,
    frets: [0, 2, 0, 1, 0, 0],
    fingers: [0, 2, 0, 1, 0, 0],
  },
  F7: {
    chord: "F7",
    baseFret: 1,
    frets: [1, 3, 1, 2, 1, 1],
    fingers: [1, 3, 1, 2, 1, 1],
    barre: { fret: 1, fromString: 6, toString: 1, finger: 1 },
  },
  G7: {
    chord: "G7",
    baseFret: 1,
    frets: [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, 0, 0, 0, 1],
  },
  A7: {
    chord: "A7",
    baseFret: 1,
    frets: ["x", 0, 2, 0, 2, 0],
    fingers: [0, 0, 2, 0, 3, 0],
  },
  B7: {
    chord: "B7",
    baseFret: 1,
    frets: ["x", 2, 1, 2, 0, 2],
    fingers: [0, 2, 1, 3, 0, 4],
  },
  "C#7": {
    chord: "C#7",
    baseFret: 4,
    frets: ["x", 4, 6, 4, 6, 4],
    fingers: [0, 1, 3, 1, 4, 1],
    barre: { fret: 4, fromString: 5, toString: 1, finger: 1 },
  },
  Db7: {
    chord: "Db7",
    baseFret: 4,
    frets: ["x", 4, 6, 4, 6, 4],
    fingers: [0, 1, 3, 1, 4, 1],
    barre: { fret: 4, fromString: 5, toString: 1, finger: 1 },
  },
  "D#7": {
    chord: "D#7",
    baseFret: 5,
    frets: ["x", 6, 8, 6, 8, 6],
    fingers: [0, 1, 3, 1, 4, 1],
    barre: { fret: 6, fromString: 5, toString: 1, finger: 1 },
  },
  Eb7: {
    chord: "Eb7",
    baseFret: 5,
    frets: ["x", 6, 8, 6, 8, 6],
    fingers: [0, 1, 3, 1, 4, 1],
    barre: { fret: 6, fromString: 5, toString: 1, finger: 1 },
  },
  "F#7": {
    chord: "F#7",
    baseFret: 2,
    frets: [2, 4, 2, 3, 2, 2],
    fingers: [1, 3, 1, 2, 1, 1],
    barre: { fret: 2, fromString: 6, toString: 1, finger: 1 },
  },
  Ab7: {
    chord: "Ab7",
    baseFret: 4,
    frets: [4, 6, 4, 5, 4, 4],
    fingers: [1, 3, 1, 2, 1, 1],
    barre: { fret: 4, fromString: 6, toString: 1, finger: 1 },
  },
  "G#7": {
    chord: "G#7",
    baseFret: 4,
    frets: [4, 6, 4, 5, 4, 4],
    fingers: [1, 3, 1, 2, 1, 1],
    barre: { fret: 4, fromString: 6, toString: 1, finger: 1 },
  },
  Bb7: {
    chord: "Bb7",
    baseFret: 1,
    frets: ["x", 1, 3, 1, 3, 1],
    fingers: [0, 1, 3, 1, 4, 1],
    barre: { fret: 1, fromString: 5, toString: 1, finger: 1 },
  },

  // --- MINOR 7TH TETRADS (m7) ---
  Cm7: {
    chord: "Cm7",
    baseFret: 3,
    frets: ["x", 3, 5, 3, 4, 3],
    fingers: [0, 1, 3, 1, 2, 1],
    barre: { fret: 3, fromString: 5, toString: 1, finger: 1 },
  },
  "C#m7": {
    chord: "C#m7",
    baseFret: 4,
    frets: ["x", 4, 6, 4, 5, 4],
    fingers: [0, 1, 3, 1, 2, 1],
    barre: { fret: 4, fromString: 5, toString: 1, finger: 1 },
  },
  Dm7: {
    chord: "Dm7",
    baseFret: 1,
    frets: ["x", "x", 0, 2, 1, 1],
    fingers: [0, 0, 0, 2, 1, 1],
    barre: { fret: 1, fromString: 2, toString: 1, finger: 1 },
  },
  "D#m7": {
    chord: "D#m7",
    baseFret: 6,
    frets: ["x", 6, 8, 6, 7, 6],
    fingers: [0, 1, 3, 1, 2, 1],
    barre: { fret: 6, fromString: 5, toString: 1, finger: 1 },
  },
  Ebm7: {
    chord: "Ebm7",
    baseFret: 6,
    frets: ["x", 6, 8, 6, 7, 6],
    fingers: [0, 1, 3, 1, 2, 1],
    barre: { fret: 6, fromString: 5, toString: 1, finger: 1 },
  },
  Em7: {
    chord: "Em7",
    baseFret: 1,
    frets: [0, 2, 0, 0, 0, 0],
    fingers: [0, 2, 0, 0, 0, 0],
  },
  Fm7: {
    chord: "Fm7",
    baseFret: 1,
    frets: [1, 3, 1, 1, 1, 1],
    fingers: [1, 3, 1, 1, 1, 1],
    barre: { fret: 1, fromString: 6, toString: 1, finger: 1 },
  },
  "F#m7": {
    chord: "F#m7",
    baseFret: 2,
    frets: [2, 4, 2, 2, 2, 2],
    fingers: [1, 3, 1, 1, 1, 1],
    barre: { fret: 2, fromString: 6, toString: 1, finger: 1 },
  },
  Gm7: {
    chord: "Gm7",
    baseFret: 3,
    frets: [3, 5, 3, 3, 3, 3],
    fingers: [1, 3, 1, 1, 1, 1],
    barre: { fret: 3, fromString: 6, toString: 1, finger: 1 },
  },
  "G#m7": {
    chord: "G#m7",
    baseFret: 4,
    frets: [4, 6, 4, 4, 4, 4],
    fingers: [1, 3, 1, 1, 1, 1],
    barre: { fret: 4, fromString: 6, toString: 1, finger: 1 },
  },
  Abm7: {
    chord: "Abm7",
    baseFret: 4,
    frets: [4, 6, 4, 4, 4, 4],
    fingers: [1, 3, 1, 1, 1, 1],
    barre: { fret: 4, fromString: 6, toString: 1, finger: 1 },
  },
  Am7: {
    chord: "Am7",
    baseFret: 1,
    frets: ["x", 0, 2, 0, 1, 0],
    fingers: [0, 0, 2, 0, 1, 0],
  },
  "A#m7": {
    chord: "A#m7",
    baseFret: 1,
    frets: ["x", 1, 3, 1, 2, 1],
    fingers: [0, 1, 3, 1, 2, 1],
    barre: { fret: 1, fromString: 5, toString: 1, finger: 1 },
  },
  Bbm7: {
    chord: "Bbm7",
    baseFret: 1,
    frets: ["x", 1, 3, 1, 2, 1],
    fingers: [0, 1, 3, 1, 2, 1],
    barre: { fret: 1, fromString: 5, toString: 1, finger: 1 },
  },
  Bm7: {
    chord: "Bm7",
    baseFret: 2,
    frets: ["x", 2, 4, 2, 3, 2],
    fingers: [0, 1, 3, 1, 2, 1],
    barre: { fret: 2, fromString: 5, toString: 1, finger: 1 },
  },

  // --- HALF-DIMINISHED TETRADS (m7(b5)) ---
  "Bm7(b5)": {
    chord: "Bm7(b5)",
    baseFret: 1,
    frets: ["x", 2, 3, 2, 3, "x"],
    fingers: [0, 1, 3, 2, 4, 0],
  },
  "F#m7(b5)": {
    chord: "F#m7(b5)",
    baseFret: 1,
    frets: [2, "x", 2, 2, 1, "x"],
    fingers: [2, 0, 3, 4, 1, 0],
  },
  "C#m7(b5)": {
    chord: "C#m7(b5)",
    baseFret: 3,
    frets: ["x", 4, 5, 4, 5, "x"],
    fingers: [0, 1, 3, 2, 4, 0],
  },
  "G#m7(b5)": {
    chord: "G#m7(b5)",
    baseFret: 3,
    frets: [4, "x", 4, 4, 3, "x"],
    fingers: [2, 0, 3, 4, 1, 0],
  },
  "D#m7(b5)": {
    chord: "D#m7(b5)",
    baseFret: 5,
    frets: ["x", 6, 7, 6, 7, "x"],
    fingers: [0, 1, 3, 2, 4, 0],
  },
  "A#m7(b5)": {
    chord: "A#m7(b5)",
    baseFret: 1,
    frets: ["x", 1, 2, 1, 2, "x"],
    fingers: [0, 1, 3, 2, 4, 0],
  },
  "Em7(b5)": {
    chord: "Em7(b5)",
    baseFret: 1,
    frets: [0, 1, 2, 0, 3, 0],
    fingers: [0, 1, 2, 0, 4, 0],
  },
  "Am7(b5)": {
    chord: "Am7(b5)",
    baseFret: 1,
    frets: ["x", 0, 1, 2, 1, "x"],
    fingers: [0, 0, 1, 3, 2, 0],
  },
  "Dm7(b5)": {
    chord: "Dm7(b5)",
    baseFret: 1,
    frets: ["x", "x", 0, 1, 1, 1],
    fingers: [0, 0, 0, 1, 1, 1],
    barre: { fret: 1, fromString: 3, toString: 1, finger: 1 },
  },
  "Gm7(b5)": {
    chord: "Gm7(b5)",
    baseFret: 2,
    frets: [3, "x", 3, 3, 2, "x"],
    fingers: [2, 0, 3, 4, 1, 0],
  },
  "Cm7(b5)": {
    chord: "Cm7(b5)",
    baseFret: 2,
    frets: ["x", 3, 4, 3, 4, "x"],
    fingers: [0, 1, 3, 2, 4, 0],
  },
};

/**
 * Authentic Guitar Inversions (Slash Chords / Acordes com Baixo Invertido)
 * 1 = 1ª Inversão (Baixo na 3ª)
 * 2 = 2ª Inversão (Baixo na 5ª)
 * 3 = 3ª Inversão (Baixo na 7ª para tétrades)
 */
export const GUITAR_INVERSIONS_DB: Record<string, Record<number, GuitarChordShape>> = {
  // --- MAJOR TRIADS ---
  C: {
    1: { chord: "C/E", baseFret: 1, frets: [0, "x", 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
    2: { chord: "C/G", baseFret: 1, frets: [3, "x", 2, 0, 1, 0], fingers: [3, 0, 2, 0, 1, 0] },
  },
  D: {
    1: { chord: "D/F#", baseFret: 1, frets: [2, "x", 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3] },
    2: { chord: "D/A", baseFret: 1, frets: ["x", 0, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  },
  E: {
    1: { chord: "E/G#", baseFret: 2, frets: [4, 2, 2, 4, 5, "x"], fingers: [3, 1, 1, 2, 4, 0], barre: { fret: 2, fromString: 5, toString: 4, finger: 1 } },
    2: { chord: "E/B", baseFret: 1, frets: ["x", 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  },
  F: {
    1: { chord: "F/A", baseFret: 1, frets: ["x", 0, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], barre: { fret: 1, fromString: 2, toString: 1, finger: 1 } },
    2: { chord: "F/C", baseFret: 1, frets: ["x", 3, 3, 2, 1, 1], fingers: [0, 3, 4, 2, 1, 1], barre: { fret: 1, fromString: 2, toString: 1, finger: 1 } },
  },
  G: {
    1: { chord: "G/B", baseFret: 1, frets: ["x", 2, 0, 0, 3, 3], fingers: [0, 1, 0, 0, 3, 4] },
    2: { chord: "G/D", baseFret: 1, frets: ["x", "x", 0, 0, 0, 3], fingers: [0, 0, 0, 0, 0, 3] },
  },
  A: {
    1: { chord: "A/C#", baseFret: 1, frets: ["x", 4, 2, 2, 2, 0], fingers: [0, 4, 1, 2, 3, 0] },
    2: { chord: "A/E", baseFret: 1, frets: [0, "x", 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  },
  B: {
    1: { chord: "B/D#", baseFret: 2, frets: ["x", 6, 4, 4, 4, "x"], fingers: [0, 4, 1, 2, 3, 0] },
    2: { chord: "B/F#", baseFret: 2, frets: [2, 2, 4, 4, 4, 2], fingers: [1, 1, 2, 3, 4, 1], barre: { fret: 2, fromString: 6, toString: 1, finger: 1 } },
  },
  Bb: {
    1: { chord: "Bb/D", baseFret: 1, frets: ["x", 5, 3, 3, 3, "x"], fingers: [0, 4, 1, 2, 3, 0] },
    2: { chord: "Bb/F", baseFret: 1, frets: [1, 1, 3, 3, 3, 1], fingers: [1, 1, 2, 3, 4, 1], barre: { fret: 1, fromString: 6, toString: 1, finger: 1 } },
  },
  Eb: {
    1: { chord: "Eb/G", baseFret: 3, frets: [3, 6, 5, 3, 4, 3], fingers: [1, 4, 3, 1, 2, 1], barre: { fret: 3, fromString: 6, toString: 1, finger: 1 } },
    2: { chord: "Eb/Bb", baseFret: 6, frets: [6, 6, 8, 8, 8, 6], fingers: [1, 1, 2, 3, 4, 1], barre: { fret: 6, fromString: 6, toString: 1, finger: 1 } },
  },
  Ab: {
    1: { chord: "Ab/C", baseFret: 3, frets: ["x", 3, 6, 5, 4, 4], fingers: [0, 1, 4, 3, 2, 2], barre: { fret: 4, fromString: 2, toString: 1, finger: 2 } },
    2: { chord: "Ab/Eb", baseFret: 4, frets: ["x", 6, 6, 5, 4, 4], fingers: [0, 3, 4, 2, 1, 1], barre: { fret: 4, fromString: 5, toString: 1, finger: 1 } },
  },
  Db: {
    1: { chord: "Db/F", baseFret: 1, frets: [1, 4, 3, 1, 2, 1], fingers: [1, 4, 3, 1, 2, 1], barre: { fret: 1, fromString: 6, toString: 1, finger: 1 } },
    2: { chord: "Db/Ab", baseFret: 4, frets: [4, 4, 6, 6, 6, 4], fingers: [1, 1, 2, 3, 4, 1], barre: { fret: 4, fromString: 6, toString: 1, finger: 1 } },
  },
  "F#": {
    1: { chord: "F#/A#", baseFret: 2, frets: ["x", 1, 4, 3, 2, 2], fingers: [0, 1, 4, 3, 2, 2], barre: { fret: 2, fromString: 2, toString: 1, finger: 2 } },
    2: { chord: "F#/C#", baseFret: 2, frets: ["x", 4, 4, 3, 2, 2], fingers: [0, 3, 4, 2, 1, 1], barre: { fret: 2, fromString: 2, toString: 1, finger: 1 } },
  },

  // --- MINOR TRIADS ---
  Am: {
    1: { chord: "Am/C", baseFret: 1, frets: ["x", 3, 2, 2, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
    2: { chord: "Am/E", baseFret: 1, frets: [0, "x", 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  },
  Dm: {
    1: { chord: "Dm/F", baseFret: 1, frets: ["x", "x", 3, 2, 3, 1], fingers: [0, 0, 3, 2, 4, 1] },
    2: { chord: "Dm/A", baseFret: 1, frets: ["x", 0, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  },
  Em: {
    1: { chord: "Em/G", baseFret: 1, frets: [3, "x", 2, 0, 0, 0], fingers: [3, 0, 2, 0, 0, 0] },
    2: { chord: "Em/B", baseFret: 1, frets: ["x", 2, 2, 0, 0, 0], fingers: [0, 1, 2, 0, 0, 0] },
  },
  Bm: {
    1: { chord: "Bm/D", baseFret: 1, frets: ["x", "x", 0, 4, 3, 2], fingers: [0, 0, 0, 3, 2, 1] },
    2: { chord: "Bm/F#", baseFret: 2, frets: [2, 2, 4, 4, 3, 2], fingers: [1, 1, 3, 4, 2, 1], barre: { fret: 2, fromString: 6, toString: 1, finger: 1 } },
  },
  "C#m": {
    1: { chord: "C#m/E", baseFret: 1, frets: [0, 4, 2, 1, 2, 0], fingers: [0, 4, 2, 1, 3, 0] },
    2: { chord: "C#m/G#", baseFret: 4, frets: [4, 4, 6, 6, 5, 4], fingers: [1, 1, 3, 4, 2, 1], barre: { fret: 4, fromString: 6, toString: 1, finger: 1 } },
  },
  "F#m": {
    1: { chord: "F#m/A", baseFret: 1, frets: ["x", 0, 4, 2, 2, 2], fingers: [0, 0, 3, 1, 1, 1], barre: { fret: 2, fromString: 3, toString: 1, finger: 1 } },
    2: { chord: "F#m/C#", baseFret: 2, frets: ["x", 4, 4, 2, 2, 2], fingers: [0, 3, 4, 1, 1, 1], barre: { fret: 2, fromString: 3, toString: 1, finger: 1 } },
  },
  "G#m": {
    1: { chord: "G#m/B", baseFret: 2, frets: ["x", 2, 6, 4, 4, 4], fingers: [0, 1, 4, 2, 2, 2], barre: { fret: 4, fromString: 3, toString: 1, finger: 2 } },
    2: { chord: "G#m/D#", baseFret: 4, frets: ["x", 6, 6, 4, 4, 4], fingers: [0, 3, 4, 1, 1, 1], barre: { fret: 4, fromString: 3, toString: 1, finger: 1 } },
  },
  Gm: {
    1: { chord: "Gm/Bb", baseFret: 1, frets: ["x", 1, 0, 0, 3, 3], fingers: [0, 1, 0, 0, 3, 4] },
    2: { chord: "Gm/D", baseFret: 1, frets: ["x", "x", 0, 3, 3, 3], fingers: [0, 0, 0, 1, 2, 3] },
  },
  Cm: {
    1: { chord: "Cm/Eb", baseFret: 3, frets: ["x", 6, 5, 5, 4, 3], fingers: [0, 4, 2, 3, 1, 1], barre: { fret: 3, fromString: 2, toString: 1, finger: 1 } },
    2: { chord: "Cm/G", baseFret: 3, frets: [3, 3, 5, 5, 4, 3], fingers: [1, 1, 3, 4, 2, 1], barre: { fret: 3, fromString: 6, toString: 1, finger: 1 } },
  },
  Fm: {
    1: { chord: "Fm/Ab", baseFret: 1, frets: [4, 3, 3, 1, 1, 1], fingers: [4, 2, 3, 1, 1, 1], barre: { fret: 1, fromString: 3, toString: 1, finger: 1 } },
    2: { chord: "Fm/C", baseFret: 1, frets: ["x", 3, 3, 1, 1, 1], fingers: [0, 3, 4, 1, 1, 1], barre: { fret: 1, fromString: 3, toString: 1, finger: 1 } },
  },

  // --- DIMINISHED ---
  Bdim: {
    1: { chord: "Bdim/D", baseFret: 1, frets: ["x", "x", 0, 1, 0, 1], fingers: [0, 0, 0, 1, 0, 2] },
    2: { chord: "Bdim/F", baseFret: 1, frets: [1, 2, 0, "x", 0, 1], fingers: [1, 2, 0, 0, 0, 3] },
  },
  "C#dim": {
    1: { chord: "C#dim/E", baseFret: 1, frets: [0, 1, 2, 0, 2, 0], fingers: [0, 1, 2, 0, 3, 0] },
    2: { chord: "C#dim/G", baseFret: 1, frets: [3, 4, 2, 0, 2, 0], fingers: [3, 4, 2, 0, 1, 0] },
  },
  "D#dim": {
    1: { chord: "D#dim/F#", baseFret: 1, frets: [2, "x", 1, 2, 1, "x"], fingers: [2, 0, 1, 3, 1, 0], barre: { fret: 1, fromString: 4, toString: 2, finger: 1 } },
    2: { chord: "D#dim/A", baseFret: 1, frets: ["x", 0, 1, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4] },
  },
  "F#dim": {
    1: { chord: "F#dim/A", baseFret: 1, frets: ["x", 0, 1, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4] },
    2: { chord: "F#dim/C", baseFret: 1, frets: ["x", 3, 4, 2, "x", "x"], fingers: [0, 2, 3, 1, 0, 0] },
  },
  Cdim: {
    1: { chord: "Cdim/Eb", baseFret: 1, frets: ["x", "x", 1, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4] },
    2: { chord: "Cdim/Gb", baseFret: 2, frets: [2, 3, 1, "x", "x", "x"], fingers: [2, 3, 1, 0, 0, 0] },
  },
  Ddim: {
    1: { chord: "Ddim/F", baseFret: 1, frets: [1, "x", 0, 1, 0, 1], fingers: [1, 0, 0, 2, 0, 3] },
    2: { chord: "Ddim/Ab", baseFret: 3, frets: [4, 5, 3, "x", "x", "x"], fingers: [2, 3, 1, 0, 0, 0] },
  },
  Edim: {
    1: { chord: "Edim/G", baseFret: 1, frets: [3, 1, 2, 0, "x", "x"], fingers: [3, 1, 2, 0, 0, 0] },
    2: { chord: "Edim/Bb", baseFret: 1, frets: ["x", 1, 2, 0, "x", "x"], fingers: [0, 1, 2, 0, 0, 0] },
  },
  Fdim: {
    1: { chord: "Fdim/Ab", baseFret: 1, frets: [4, 2, 3, 1, "x", "x"], fingers: [4, 2, 3, 1, 0, 0] },
    2: { chord: "Fdim/B", baseFret: 1, frets: ["x", 2, 3, 1, 0, "x"], fingers: [0, 2, 3, 1, 0, 0] },
  },
  Gdim: {
    1: { chord: "Gdim/Bb", baseFret: 1, frets: ["x", 1, 2, 0, 2, "x"], fingers: [0, 1, 3, 0, 2, 0] },
    2: { chord: "Gdim/Db", baseFret: 3, frets: ["x", 4, 5, 3, "x", "x"], fingers: [0, 2, 3, 1, 0, 0] },
  },
  Adim: {
    1: { chord: "Adim/C", baseFret: 1, frets: ["x", 3, 4, 2, "x", "x"], fingers: [0, 2, 3, 1, 0, 0] },
    2: { chord: "Adim/Eb", baseFret: 5, frets: ["x", 6, 7, 5, "x", "x"], fingers: [0, 2, 3, 1, 0, 0] },
  },
  "G#dim": {
    1: { chord: "G#dim/B", baseFret: 1, frets: ["x", 2, 3, 1, "x", "x"], fingers: [0, 2, 3, 1, 0, 0] },
    2: { chord: "G#dim/D", baseFret: 4, frets: ["x", 5, 6, 4, "x", "x"], fingers: [0, 2, 3, 1, 0, 0] },
  },
  "A#dim": {
    1: { chord: "A#dim/C#", baseFret: 3, frets: ["x", 4, 5, 3, "x", "x"], fingers: [0, 2, 3, 1, 0, 0] },
    2: { chord: "A#dim/E", baseFret: 1, frets: [0, 1, 2, 0, "x", "x"], fingers: [0, 1, 2, 0, 0, 0] },
  },

  // --- SEVENTH CHORDS (TÉTRADES) - 7M ---
  C7M: {
    1: { chord: "C7M/E", baseFret: 1, frets: [0, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
    2: { chord: "C7M/G", baseFret: 1, frets: [3, 3, 2, 0, 0, 0], fingers: [3, 4, 2, 0, 0, 0] },
    3: { chord: "C7M/B", baseFret: 1, frets: ["x", 2, 2, 0, 1, 0], fingers: [0, 2, 3, 0, 1, 0] },
  },
  D7M: {
    1: { chord: "D7M/F#", baseFret: 1, frets: [2, 0, 0, 2, 2, 2], fingers: [2, 0, 0, 1, 1, 1], barre: { fret: 2, fromString: 3, toString: 1, finger: 1 } },
    2: { chord: "D7M/A", baseFret: 1, frets: ["x", 0, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1], barre: { fret: 2, fromString: 3, toString: 1, finger: 1 } },
    3: { chord: "D7M/C#", baseFret: 2, frets: ["x", 4, 0, 2, 2, 2], fingers: [0, 3, 0, 1, 1, 1] },
  },
  E7M: {
    1: { chord: "E7M/G#", baseFret: 1, frets: [4, 2, 1, 1, 0, 0], fingers: [4, 2, 1, 1, 0, 0] },
    2: { chord: "E7M/B", baseFret: 1, frets: ["x", 2, 1, 1, 0, 0], fingers: [0, 2, 1, 1, 0, 0] },
    3: { chord: "E7M/D#", baseFret: 4, frets: ["x", 6, 6, 4, 4, 4], fingers: [0, 3, 4, 1, 1, 1], barre: { fret: 4, fromString: 3, toString: 1, finger: 1 } },
  },
  F7M: {
    1: { chord: "F7M/A", baseFret: 1, frets: ["x", 0, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
    2: { chord: "F7M/C", baseFret: 1, frets: ["x", 3, 3, 2, 1, 0], fingers: [0, 3, 4, 2, 1, 0] },
    3: { chord: "F7M/E", baseFret: 1, frets: [0, 3, 3, 2, 1, 0], fingers: [0, 3, 4, 2, 1, 0] },
  },
  G7M: {
    1: { chord: "G7M/B", baseFret: 1, frets: ["x", 2, 0, 0, 0, 2], fingers: [0, 2, 0, 0, 0, 3] },
    2: { chord: "G7M/D", baseFret: 1, frets: ["x", "x", 0, 0, 0, 2], fingers: [0, 0, 0, 0, 0, 2] },
    3: { chord: "G7M/F#", baseFret: 1, frets: [2, "x", 0, 0, 0, 2], fingers: [2, 0, 0, 0, 0, 3] },
  },
  A7M: {
    1: { chord: "A7M/C#", baseFret: 1, frets: ["x", 4, 2, 1, 2, 0], fingers: [0, 4, 2, 1, 3, 0] },
    2: { chord: "A7M/E", baseFret: 1, frets: [0, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
    3: { chord: "A7M/G#", baseFret: 1, frets: [4, 0, 2, 1, 2, 0], fingers: [4, 0, 2, 1, 3, 0] },
  },
  B7M: {
    1: { chord: "B7M/D#", baseFret: 2, frets: ["x", 6, 4, 3, 4, 2], fingers: [0, 4, 2, 1, 3, 1] },
    2: { chord: "B7M/F#", baseFret: 2, frets: [2, 2, 4, 3, 4, 2], fingers: [1, 1, 3, 2, 4, 1], barre: { fret: 2, fromString: 6, toString: 1, finger: 1 } },
    3: { chord: "B7M/A#", baseFret: 1, frets: ["x", 1, 4, 3, 4, 2], fingers: [0, 1, 3, 2, 4, 1] },
  },
  Bb7M: {
    1: { chord: "Bb7M/D", baseFret: 1, frets: ["x", 5, 3, 2, 3, 1], fingers: [0, 4, 2, 1, 3, 1] },
    2: { chord: "Bb7M/F", baseFret: 1, frets: [1, 1, 3, 2, 3, 1], fingers: [1, 1, 3, 2, 4, 1], barre: { fret: 1, fromString: 6, toString: 1, finger: 1 } },
    3: { chord: "Bb7M/A", baseFret: 1, frets: ["x", 0, 3, 2, 3, 1], fingers: [0, 0, 2, 1, 3, 1] },
  },
  Eb7M: {
    1: { chord: "Eb7M/G", baseFret: 3, frets: [3, 6, 5, 3, 3, 3], fingers: [1, 4, 3, 1, 1, 1], barre: { fret: 3, fromString: 6, toString: 1, finger: 1 } },
    2: { chord: "Eb7M/Bb", baseFret: 1, frets: ["x", 1, 1, 3, 3, 3], fingers: [0, 1, 1, 2, 3, 4] },
    3: { chord: "Eb7M/D", baseFret: 3, frets: ["x", 5, 5, 3, 3, 3], fingers: [0, 3, 4, 1, 1, 1], barre: { fret: 3, fromString: 3, toString: 1, finger: 1 } },
  },
  Ab7M: {
    1: { chord: "Ab7M/C", baseFret: 3, frets: ["x", 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1] },
    2: { chord: "Ab7M/Eb", baseFret: 3, frets: ["x", 6, 6, 5, 4, 3], fingers: [0, 4, 3, 2, 1, 1] },
    3: { chord: "Ab7M/G", baseFret: 3, frets: [3, "x", 5, 5, 4, 3], fingers: [1, 0, 3, 4, 2, 1] },
  },
  Db7M: {
    1: { chord: "Db7M/F", baseFret: 1, frets: [1, 4, 3, 1, 1, 1], fingers: [1, 4, 3, 1, 1, 1], barre: { fret: 1, fromString: 6, toString: 1, finger: 1 } },
    2: { chord: "Db7M/Ab", baseFret: 4, frets: [4, 4, 6, 5, 6, 4], fingers: [1, 1, 3, 2, 4, 1], barre: { fret: 4, fromString: 6, toString: 1, finger: 1 } },
    3: { chord: "Db7M/C", baseFret: 1, frets: ["x", 3, 3, 1, 1, 1], fingers: [0, 3, 4, 1, 1, 1], barre: { fret: 1, fromString: 3, toString: 1, finger: 1 } },
  },
  "F#7M": {
    1: { chord: "F#7M/A#", baseFret: 1, frets: ["x", 1, 4, 3, 2, 1], fingers: [0, 1, 4, 3, 2, 1] },
    2: { chord: "F#7M/C#", baseFret: 2, frets: ["x", 4, 4, 3, 2, 1], fingers: [0, 3, 4, 2, 1, 1] },
    3: { chord: "F#7M/F", baseFret: 1, frets: [1, "x", 4, 3, 2, 1], fingers: [1, 0, 4, 3, 2, 1] },
  },
  Gb7M: {
    1: { chord: "Gb7M/Bb", baseFret: 1, frets: ["x", 1, 4, 3, 2, 1], fingers: [0, 1, 4, 3, 2, 1] },
    2: { chord: "Gb7M/Db", baseFret: 2, frets: ["x", 4, 4, 3, 2, 1], fingers: [0, 3, 4, 2, 1, 1] },
    3: { chord: "Gb7M/F", baseFret: 1, frets: [1, "x", 4, 3, 2, 1], fingers: [1, 0, 4, 3, 2, 1] },
  },

  // --- DOMINANT 7TH (7) ---
  C7: {
    1: { chord: "C7/E", baseFret: 1, frets: [0, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
    2: { chord: "C7/G", baseFret: 1, frets: [3, 3, 2, 3, 1, 0], fingers: [3, 4, 2, 5, 1, 0] },
    3: { chord: "C7/Bb", baseFret: 1, frets: ["x", 1, 2, 3, 1, 0], fingers: [0, 1, 2, 4, 1, 0] },
  },
  D7: {
    1: { chord: "D7/F#", baseFret: 1, frets: [2, 0, 0, 2, 1, 2], fingers: [2, 0, 0, 3, 1, 4] },
    2: { chord: "D7/A", baseFret: 1, frets: ["x", 0, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
    3: { chord: "D7/C", baseFret: 1, frets: ["x", 3, 0, 2, 1, 2], fingers: [0, 3, 0, 2, 1, 4] },
  },
  E7: {
    1: { chord: "E7/G#", baseFret: 1, frets: [4, 2, 0, 1, 0, 0], fingers: [4, 2, 0, 1, 0, 0] },
    2: { chord: "E7/B", baseFret: 1, frets: ["x", 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
    3: { chord: "E7/D", baseFret: 1, frets: ["x", "x", 0, 1, 0, 0], fingers: [0, 0, 0, 1, 0, 0] },
  },
  F7: {
    1: { chord: "F7/A", baseFret: 1, frets: ["x", 0, 3, 2, 4, 1], fingers: [0, 0, 2, 1, 4, 1] },
    2: { chord: "F7/C", baseFret: 1, frets: ["x", 3, 3, 2, 4, 1], fingers: [0, 2, 3, 1, 4, 1] },
    3: { chord: "F7/Eb", baseFret: 1, frets: ["x", 6, 3, 2, 4, 1], fingers: [0, 4, 2, 1, 3, 1] },
  },
  G7: {
    1: { chord: "G7/B", baseFret: 1, frets: ["x", 2, 3, 0, 0, 1], fingers: [0, 2, 3, 0, 0, 1] },
    2: { chord: "G7/D", baseFret: 1, frets: ["x", "x", 0, 0, 0, 1], fingers: [0, 0, 0, 0, 0, 1] },
    3: { chord: "G7/F", baseFret: 1, frets: [1, 2, 0, 0, 0, 1], fingers: [1, 2, 0, 0, 0, 3] },
  },
  A7: {
    1: { chord: "A7/C#", baseFret: 1, frets: ["x", 4, 2, 0, 2, 0], fingers: [0, 3, 1, 0, 2, 0] },
    2: { chord: "A7/E", baseFret: 1, frets: [0, 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0] },
    3: { chord: "A7/G", baseFret: 1, frets: [3, 0, 2, 0, 2, 0], fingers: [3, 0, 1, 0, 2, 0] },
  },
  B7: {
    1: { chord: "B7/D#", baseFret: 1, frets: ["x", "x", 1, 2, 0, 2], fingers: [0, 0, 1, 2, 0, 3] },
    2: { chord: "B7/F#", baseFret: 1, frets: [2, 2, 1, 2, 0, 2], fingers: [2, 3, 1, 4, 0, 4] },
    3: { chord: "B7/A", baseFret: 2, frets: ["x", 0, 4, 2, 4, 2], fingers: [0, 0, 3, 1, 4, 1] },
  },
  Bb7: {
    1: { chord: "Bb7/D", baseFret: 1, frets: ["x", 5, 3, 3, 3, 4], fingers: [0, 3, 1, 1, 1, 2] },
    2: { chord: "Bb7/F", baseFret: 1, frets: [1, 1, 3, 1, 3, 1], fingers: [1, 1, 3, 1, 4, 1], barre: { fret: 1, fromString: 6, toString: 1, finger: 1 } },
    3: { chord: "Bb7/Ab", baseFret: 1, frets: [4, 1, 3, 1, 3, 1], fingers: [4, 1, 3, 1, 2, 1] },
  },
  Eb7: {
    1: { chord: "Eb7/G", baseFret: 3, frets: [3, 6, 5, 3, 4, 3], fingers: [1, 4, 3, 1, 2, 1], barre: { fret: 3, fromString: 6, toString: 1, finger: 1 } },
    2: { chord: "Eb7/Bb", baseFret: 1, frets: ["x", 1, 1, 3, 2, 3], fingers: [0, 1, 1, 3, 2, 4] },
    3: { chord: "Eb7/Db", baseFret: 3, frets: ["x", 4, 5, 3, 4, 3], fingers: [0, 2, 3, 1, 4, 1] },
  },
  Ab7: {
    1: { chord: "Ab7/C", baseFret: 3, frets: ["x", 3, 4, 5, 4, 4], fingers: [0, 1, 2, 4, 3, 3] },
    2: { chord: "Ab7/Eb", baseFret: 4, frets: ["x", 6, 4, 5, 4, 4], fingers: [0, 4, 1, 3, 1, 1] },
    3: { chord: "Ab7/Gb", baseFret: 2, frets: [2, "x", 4, 5, 4, 4], fingers: [1, 0, 2, 4, 3, 3] },
  },
  Db7: {
    1: { chord: "Db7/F", baseFret: 1, frets: [1, 4, 3, 4, 2, 1], fingers: [1, 4, 3, 5, 2, 1], barre: { fret: 1, fromString: 6, toString: 1, finger: 1 } },
    2: { chord: "Db7/Ab", baseFret: 4, frets: [4, 4, 6, 4, 6, 4], fingers: [1, 1, 3, 1, 4, 1], barre: { fret: 4, fromString: 6, toString: 1, finger: 1 } },
    3: { chord: "Db7/B", baseFret: 1, frets: ["x", 2, 3, 4, 2, 1], fingers: [0, 2, 3, 4, 1, 1] },
  },
  "F#7": {
    1: { chord: "F#7/A#", baseFret: 1, frets: ["x", 1, 4, 3, 5, 2], fingers: [0, 1, 3, 2, 4, 1] },
    2: { chord: "F#7/C#", baseFret: 2, frets: ["x", 4, 4, 3, 5, 2], fingers: [0, 2, 3, 1, 4, 1] },
    3: { chord: "F#7/E", baseFret: 1, frets: [0, 4, 4, 3, 5, 2], fingers: [0, 2, 3, 1, 4, 1] },
  },

  // --- MINOR 7TH (m7) ---
  Dm7: {
    1: { chord: "Dm7/F", baseFret: 1, frets: [1, "x", 0, 2, 1, 1], fingers: [1, 0, 0, 3, 2, 2], barre: { fret: 1, fromString: 2, toString: 1, finger: 2 } },
    2: { chord: "Dm7/A", baseFret: 1, frets: ["x", 0, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], barre: { fret: 1, fromString: 2, toString: 1, finger: 1 } },
    3: { chord: "Dm7/C", baseFret: 1, frets: ["x", 3, 0, 2, 1, 1], fingers: [0, 3, 0, 2, 1, 1], barre: { fret: 1, fromString: 2, toString: 1, finger: 1 } },
  },
  Em7: {
    1: { chord: "Em7/G", baseFret: 1, frets: [3, 2, 0, 0, 3, 0], fingers: [2, 1, 0, 0, 3, 0] },
    2: { chord: "Em7/B", baseFret: 1, frets: ["x", 2, 2, 0, 3, 0], fingers: [0, 1, 2, 0, 3, 0] },
    3: { chord: "Em7/D", baseFret: 1, frets: ["x", "x", 0, 0, 0, 0], fingers: [0, 0, 0, 0, 0, 0] },
  },
  Am7: {
    1: { chord: "Am7/C", baseFret: 1, frets: ["x", 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
    2: { chord: "Am7/E", baseFret: 1, frets: [0, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
    3: { chord: "Am7/G", baseFret: 1, frets: [3, 0, 2, 0, 1, 0], fingers: [3, 0, 2, 0, 1, 0] },
  },
  Bm7: {
    1: { chord: "Bm7/D", baseFret: 2, frets: ["x", 5, 4, 4, 3, 2], fingers: [0, 4, 2, 3, 1, 1] },
    2: { chord: "Bm7/F#", baseFret: 2, frets: [2, 2, 4, 2, 3, 2], fingers: [1, 1, 3, 1, 2, 1], barre: { fret: 2, fromString: 6, toString: 1, finger: 1 } },
    3: { chord: "Bm7/A", baseFret: 2, frets: ["x", 0, 4, 2, 3, 2], fingers: [0, 0, 3, 1, 2, 1] },
  },
  Cm7: {
    1: { chord: "Cm7/Eb", baseFret: 3, frets: ["x", 6, 5, 3, 4, 3], fingers: [0, 4, 3, 1, 2, 1] },
    2: { chord: "Cm7/G", baseFret: 3, frets: [3, 3, 5, 3, 4, 3], fingers: [1, 1, 3, 1, 2, 1], barre: { fret: 3, fromString: 6, toString: 1, finger: 1 } },
    3: { chord: "Cm7/Bb", baseFret: 1, frets: ["x", 1, 5, 3, 4, 3], fingers: [0, 1, 4, 2, 3, 1] },
  },
  "C#m7": {
    1: { chord: "C#m7/E", baseFret: 1, frets: [0, 4, 2, 4, 2, 0], fingers: [0, 3, 1, 4, 2, 0] },
    2: { chord: "C#m7/G#", baseFret: 4, frets: [4, 4, 6, 4, 5, 4], fingers: [1, 1, 3, 1, 2, 1], barre: { fret: 4, fromString: 6, toString: 1, finger: 1 } },
    3: { chord: "C#m7/B", baseFret: 2, frets: ["x", 2, 2, 4, 2, 0], fingers: [0, 1, 2, 4, 3, 0] },
  },
  "F#m7": {
    1: { chord: "F#m7/A", baseFret: 1, frets: ["x", 0, 4, 2, 2, 2], fingers: [0, 0, 3, 1, 1, 1], barre: { fret: 2, fromString: 3, toString: 1, finger: 1 } },
    2: { chord: "F#m7/C#", baseFret: 2, frets: ["x", 4, 4, 2, 5, 2], fingers: [0, 2, 3, 1, 4, 1] },
    3: { chord: "F#m7/E", baseFret: 2, frets: [0, 4, 4, 2, 2, 2], fingers: [0, 2, 3, 1, 1, 1], barre: { fret: 2, fromString: 3, toString: 1, finger: 1 } },
  },
  "G#m7": {
    1: { chord: "G#m7/B", baseFret: 2, frets: ["x", 2, 4, 4, 4, 4], fingers: [0, 1, 2, 3, 4, 4], barre: { fret: 4, fromString: 4, toString: 1, finger: 3 } },
    2: { chord: "G#m7/D#", baseFret: 4, frets: ["x", 6, 4, 4, 4, 4], fingers: [0, 3, 1, 1, 1, 1], barre: { fret: 4, fromString: 4, toString: 1, finger: 1 } },
    3: { chord: "G#m7/F#", baseFret: 2, frets: [2, "x", 4, 4, 4, 4], fingers: [1, 0, 2, 3, 4, 4], barre: { fret: 4, fromString: 4, toString: 1, finger: 2 } },
  },
  "D#m7": {
    1: { chord: "D#m7/F#", baseFret: 1, frets: [2, "x", 1, 3, 2, 2], fingers: [2, 0, 1, 4, 3, 3] },
    2: { chord: "D#m7/A#", baseFret: 1, frets: ["x", 1, 1, 3, 2, 2], fingers: [0, 1, 1, 4, 2, 3] },
    3: { chord: "D#m7/C#", baseFret: 1, frets: ["x", 4, 1, 3, 2, 2], fingers: [0, 4, 1, 3, 2, 2] },
  },
  Gm7: {
    1: { chord: "Gm7/Bb", baseFret: 1, frets: ["x", 1, 3, 3, 3, 3], fingers: [0, 1, 2, 3, 4, 4] },
    2: { chord: "Gm7/D", baseFret: 1, frets: ["x", "x", 0, 3, 3, 3], fingers: [0, 0, 0, 1, 2, 3] },
    3: { chord: "Gm7/F", baseFret: 1, frets: [1, "x", 3, 3, 3, 3], fingers: [1, 0, 2, 3, 4, 4] },
  },
  Fm7: {
    1: { chord: "Fm7/Ab", baseFret: 1, frets: [4, 3, 3, 1, 4, 1], fingers: [3, 2, 2, 1, 4, 1] },
    2: { chord: "Fm7/C", baseFret: 1, frets: ["x", 3, 3, 1, 4, 1], fingers: [0, 2, 3, 1, 4, 1] },
    3: { chord: "Fm7/Eb", baseFret: 1, frets: ["x", 6, 3, 1, 4, 1], fingers: [0, 4, 2, 1, 3, 1] },
  },
  Bbm7: {
    1: { chord: "Bbm7/Db", baseFret: 1, frets: ["x", 4, 3, 3, 2, 1], fingers: [0, 4, 2, 3, 1, 1] },
    2: { chord: "Bbm7/F", baseFret: 1, frets: [1, 1, 3, 1, 2, 1], fingers: [1, 1, 3, 1, 2, 1], barre: { fret: 1, fromString: 6, toString: 1, finger: 1 } },
    3: { chord: "Bbm7/Ab", baseFret: 1, frets: [4, 1, 3, 1, 2, 1], fingers: [4, 1, 3, 1, 2, 1] },
  },
  Ebm7: {
    1: { chord: "Ebm7/Gb", baseFret: 1, frets: [2, "x", 1, 3, 2, 2], fingers: [2, 0, 1, 4, 3, 3] },
    2: { chord: "Ebm7/Bb", baseFret: 1, frets: ["x", 1, 1, 3, 2, 2], fingers: [0, 1, 1, 4, 2, 3] },
    3: { chord: "Ebm7/Db", baseFret: 1, frets: ["x", 4, 1, 3, 2, 2], fingers: [0, 4, 1, 3, 2, 2] },
  },

  // --- HALF-DIMINISHED (m7b5) ---
  "Bm7(b5)": {
    1: { chord: "Bm7(b5)/D", baseFret: 2, frets: ["x", 5, 3, 4, 3, "x"], fingers: [0, 4, 1, 3, 2, 0] },
    2: { chord: "Bm7(b5)/F", baseFret: 1, frets: [1, 2, 3, 2, "x", "x"], fingers: [1, 2, 4, 3, 0, 0] },
    3: { chord: "Bm7(b5)/A", baseFret: 1, frets: ["x", 0, 3, 2, 3, 1], fingers: [0, 0, 3, 2, 4, 1] },
  },
  "C#m7(b5)": {
    1: { chord: "C#m7(b5)/E", baseFret: 1, frets: [0, 4, 2, 4, 2, 0], fingers: [0, 3, 1, 4, 2, 0] },
    2: { chord: "C#m7(b5)/G", baseFret: 2, frets: [3, 4, 2, 4, "x", "x"], fingers: [2, 3, 1, 4, 0, 0] },
    3: { chord: "C#m7(b5)/B", baseFret: 2, frets: ["x", 2, 2, 4, 2, 0], fingers: [0, 1, 2, 4, 3, 0] },
  },
  "Dm7(b5)": {
    1: { chord: "Dm7(b5)/F", baseFret: 1, frets: [1, "x", 0, 1, 1, 1], fingers: [1, 0, 0, 2, 3, 4] },
    2: { chord: "Dm7(b5)/Ab", baseFret: 3, frets: [4, 5, 6, 5, "x", "x"], fingers: [1, 2, 4, 3, 0, 0] },
    3: { chord: "Dm7(b5)/C", baseFret: 1, frets: ["x", 3, 0, 1, 1, 1], fingers: [0, 3, 0, 1, 2, 2] },
  },
  "D#m7(b5)": {
    1: { chord: "D#m7(b5)/F#", baseFret: 1, frets: [2, "x", 1, 2, 2, 2], fingers: [2, 0, 1, 3, 3, 3] },
    2: { chord: "D#m7(b5)/A", baseFret: 1, frets: ["x", 0, 1, 2, 2, 2], fingers: [0, 0, 1, 2, 3, 4] },
    3: { chord: "D#m7(b5)/C#", baseFret: 2, frets: ["x", 4, 1, 2, 2, 2], fingers: [0, 4, 1, 2, 2, 2] },
  },
  "Em7(b5)": {
    1: { chord: "Em7(b5)/G", baseFret: 1, frets: [3, 1, 2, 0, 3, 0], fingers: [3, 1, 2, 0, 4, 0] },
    2: { chord: "Em7(b5)/Bb", baseFret: 1, frets: ["x", 1, 2, 0, 3, 0], fingers: [0, 1, 2, 0, 3, 0] },
    3: { chord: "Em7(b5)/D", baseFret: 1, frets: ["x", "x", 0, 0, 3, 0], fingers: [0, 0, 0, 0, 2, 0] },
  },
  "Fm7(b5)": {
    1: { chord: "Fm7(b5)/Ab", baseFret: 1, frets: [4, 2, 3, 1, 4, 1], fingers: [4, 2, 3, 1, 5, 1] },
    2: { chord: "Fm7(b5)/B", baseFret: 1, frets: ["x", 2, 3, 1, 4, 1], fingers: [0, 2, 3, 1, 4, 1] },
    3: { chord: "Fm7(b5)/Eb", baseFret: 1, frets: ["x", 6, 3, 1, 4, 1], fingers: [0, 4, 2, 1, 3, 1] },
  },
  "F#m7(b5)": {
    1: { chord: "F#m7(b5)/A", baseFret: 1, frets: ["x", 0, 2, 2, 1, 2], fingers: [0, 0, 2, 3, 1, 4] },
    2: { chord: "F#m7(b5)/C", baseFret: 2, frets: ["x", 3, 4, 2, 5, 2], fingers: [0, 2, 3, 1, 4, 1] },
    3: { chord: "F#m7(b5)/E", baseFret: 1, frets: [0, "x", 2, 2, 1, 2], fingers: [0, 0, 2, 3, 1, 4] },
  },
  "Gm7(b5)": {
    1: { chord: "Gm7(b5)/Bb", baseFret: 1, frets: ["x", 1, 3, 3, 2, 3], fingers: [0, 1, 3, 4, 2, 4] },
    2: { chord: "Gm7(b5)/Db", baseFret: 3, frets: ["x", 4, 5, 3, 5, "x"], fingers: [0, 2, 3, 1, 4, 0] },
    3: { chord: "Gm7(b5)/F", baseFret: 1, frets: [1, 1, 3, 3, 2, 3], fingers: [1, 1, 3, 4, 2, 4] },
  },
  "G#m7(b5)": {
    1: { chord: "G#m7(b5)/B", baseFret: 2, frets: ["x", 2, 4, 4, 3, 4], fingers: [0, 1, 3, 4, 2, 4] },
    2: { chord: "G#m7(b5)/D", baseFret: 4, frets: ["x", 5, 6, 4, 6, "x"], fingers: [0, 2, 3, 1, 4, 0] },
    3: { chord: "G#m7(b5)/F#", baseFret: 2, frets: [2, 2, 4, 4, 3, 4], fingers: [1, 1, 3, 4, 2, 4] },
  },
  "Am7(b5)": {
    1: { chord: "Am7(b5)/C", baseFret: 2, frets: ["x", 3, 5, 5, 4, 5], fingers: [0, 1, 3, 4, 2, 4] },
    2: { chord: "Am7(b5)/Eb", baseFret: 5, frets: ["x", 6, 7, 5, 7, "x"], fingers: [0, 2, 3, 1, 4, 0] },
    3: { chord: "Am7(b5)/G", baseFret: 3, frets: [3, "x", 5, 5, 4, 5], fingers: [1, 0, 3, 4, 2, 4] },
  },
  "A#m7(b5)": {
    1: { chord: "A#m7(b5)/C#", baseFret: 3, frets: ["x", 4, 6, 6, 5, 6], fingers: [0, 1, 3, 4, 2, 4] },
    2: { chord: "A#m7(b5)/E", baseFret: 1, frets: [0, 1, 2, 1, 2, 0], fingers: [0, 1, 3, 2, 4, 0] },
    3: { chord: "A#m7(b5)/G#", baseFret: 4, frets: [4, "x", 6, 6, 5, 6], fingers: [1, 0, 3, 4, 2, 4] },
  },
  "Cm7(b5)": {
    1: { chord: "Cm7(b5)/Eb", baseFret: 3, frets: ["x", 6, 4, 5, 4, "x"], fingers: [0, 4, 1, 3, 2, 0] },
    2: { chord: "Cm7(b5)/Gb", baseFret: 2, frets: [2, 3, 4, 3, "x", "x"], fingers: [1, 2, 4, 3, 0, 0] },
    3: { chord: "Cm7(b5)/Bb", baseFret: 1, frets: ["x", 1, 4, 3, 4, "x"], fingers: [0, 1, 3, 2, 4, 0] },
  },
  "E#m7(b5)": {
    1: { chord: "E#m7(b5)/G#", baseFret: 1, frets: [4, 2, 3, 1, 4, 1], fingers: [4, 2, 3, 1, 5, 1] },
    2: { chord: "E#m7(b5)/B", baseFret: 1, frets: ["x", 2, 3, 1, 4, 1], fingers: [0, 2, 3, 1, 4, 1] },
    3: { chord: "E#m7(b5)/D#", baseFret: 1, frets: ["x", 6, 3, 1, 4, 1], fingers: [0, 4, 2, 1, 3, 1] },
  },
  "E#dim": {
    1: { chord: "E#dim/G#", baseFret: 1, frets: [4, 2, 3, 1, "x", "x"], fingers: [4, 2, 3, 1, 0, 0] },
    2: { chord: "E#dim/B", baseFret: 1, frets: ["x", 2, 3, 1, 0, "x"], fingers: [0, 2, 3, 1, 0, 0] },
  },
  "D#m": {
    1: { chord: "D#m/F#", baseFret: 1, frets: [2, "x", 1, 3, 4, 2], fingers: [2, 0, 1, 3, 4, 2] },
    2: { chord: "D#m/A#", baseFret: 1, frets: ["x", 1, 1, 3, 4, 2], fingers: [0, 1, 1, 3, 4, 2] },
  },
  Ebm: {
    1: { chord: "Ebm/Gb", baseFret: 1, frets: [2, "x", 1, 3, 4, 2], fingers: [2, 0, 1, 3, 4, 2] },
    2: { chord: "Ebm/Bb", baseFret: 1, frets: ["x", 1, 1, 3, 4, 2], fingers: [0, 1, 1, 3, 4, 2] },
  },
  Bbm: {
    1: { chord: "Bbm/Db", baseFret: 1, frets: ["x", 4, 3, 3, 2, "x"], fingers: [0, 4, 2, 3, 1, 0] },
    2: { chord: "Bbm/F", baseFret: 1, frets: [1, 1, 3, 3, 2, 1], fingers: [1, 1, 3, 4, 2, 1], barre: { fret: 1, fromString: 6, toString: 1, finger: 1 } },
  },
  "A#m": {
    1: { chord: "A#m/C#", baseFret: 1, frets: ["x", 4, 3, 3, 2, "x"], fingers: [0, 4, 2, 3, 1, 0] },
    2: { chord: "A#m/F", baseFret: 1, frets: [1, 1, 3, 3, 2, 1], fingers: [1, 1, 3, 4, 2, 1], barre: { fret: 1, fromString: 6, toString: 1, finger: 1 } },
  },
  "C#": {
    1: { chord: "C#/F", baseFret: 1, frets: [1, 4, 3, 1, 2, 1], fingers: [1, 4, 3, 1, 2, 1], barre: { fret: 1, fromString: 6, toString: 1, finger: 1 } },
    2: { chord: "C#/G#", baseFret: 4, frets: [4, 4, 6, 6, 6, 4], fingers: [1, 1, 2, 3, 4, 1], barre: { fret: 4, fromString: 6, toString: 1, finger: 1 } },
  },
  "D#": {
    1: { chord: "D#/G", baseFret: 3, frets: [3, 6, 5, 3, 4, 3], fingers: [1, 4, 3, 1, 2, 1], barre: { fret: 3, fromString: 6, toString: 1, finger: 1 } },
    2: { chord: "D#/A#", baseFret: 6, frets: [6, 6, 8, 8, 8, 6], fingers: [1, 1, 2, 3, 4, 1], barre: { fret: 6, fromString: 6, toString: 1, finger: 1 } },
  },
  Gb: {
    1: { chord: "Gb/Bb", baseFret: 1, frets: ["x", 1, 4, 3, 2, 2], fingers: [0, 1, 4, 3, 2, 2], barre: { fret: 2, fromString: 2, toString: 1, finger: 2 } },
    2: { chord: "Gb/Db", baseFret: 2, frets: ["x", 4, 4, 3, 2, 2], fingers: [0, 3, 4, 2, 1, 1], barre: { fret: 2, fromString: 2, toString: 1, finger: 1 } },
  },
  "G#": {
    1: { chord: "G#/C", baseFret: 3, frets: ["x", 3, 6, 5, 4, 4], fingers: [0, 1, 4, 3, 2, 2], barre: { fret: 4, fromString: 2, toString: 1, finger: 2 } },
    2: { chord: "G#/D#", baseFret: 4, frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 4, fromString: 6, toString: 1, finger: 1 } },
  },
  "A#": {
    1: { chord: "A#/D", baseFret: 1, frets: ["x", 5, 3, 3, 3, "x"], fingers: [0, 4, 1, 2, 3, 0] },
    2: { chord: "A#/F", baseFret: 1, frets: [1, 1, 3, 3, 3, 1], fingers: [1, 1, 2, 3, 4, 1], barre: { fret: 1, fromString: 6, toString: 1, finger: 1 } },
  },
};

export type Language = "pt" | "en" | "es";

const NOTE_NAMES_LANG: Record<Language, Record<string, string>> = {
  pt: { C: "Dó", "C#": "Dó#", Db: "Réb", D: "Ré", "D#": "Ré#", Eb: "Mib", E: "Mi", "E#": "Fá", F: "Fá", "F#": "Fá#", Gb: "Solb", G: "Sol", "G#": "Sol#", Ab: "Láb", A: "Lá", "A#": "Lá#", Bb: "Sib", B: "Si" },
  en: { C: "C", "C#": "C#", Db: "Db", D: "D", "D#": "D#", Eb: "Eb", E: "E", "E#": "E#", F: "F", "F#": "F#", Gb: "Gb", G: "G", "G#": "G#", Ab: "Ab", A: "A", "A#": "A#", Bb: "Bb", B: "B" },
  es: { C: "Do", "C#": "Do#", Db: "Reb", D: "Re", "D#": "Re#", Eb: "Mib", E: "Mi", "E#": "Fa", F: "Fa", "F#": "Fa#", Gb: "Solb", G: "Sol", "G#": "Sol#", Ab: "Lab", A: "La", "A#": "La#", Bb: "Sib", B: "Si" },
};

/**
 * Returns formatted slash chord display names and bass notes for inverted chords
 */
export function getInvertedChordDisplayName(chordName: string, invIdx: number, lang: Language = "pt"): {
  slashChord: string;
  bassNote: string;
  bassNotePt: string;
  inversionLabel: string;
} {
  const rootPosLabels: Record<Language, string> = {
    pt: "Posição Fundamental",
    en: "Root Position",
    es: "Posición Fundamental",
  };

  if (invIdx <= 0) {
    return {
      slashChord: chordName,
      bassNote: "",
      bassNotePt: "",
      inversionLabel: rootPosLabels[lang] || rootPosLabels.pt,
    };
  }

  const match = chordName.match(/^([A-G][#b]?)(.*)$/);
  const root = match ? match[1]! : chordName;
  const suffix = match ? match[2]! : "";
  const rootPitch = PITCH_CLASSES[root] ?? 0;

  const isDim = suffix.includes("dim") || suffix.includes("°") || suffix.includes("m7(b5)");
  const isMin = !isDim && suffix.includes("m");
  const isMaj7 = suffix.includes("7M") || suffix.includes("maj7");

  let bassPitch = rootPitch;
  let intervalLabel = "";

  if (invIdx === 1) {
    bassPitch = (rootPitch + (isDim || isMin ? 3 : 4)) % 12;
    intervalLabel = "3ª";
  } else if (invIdx === 2) {
    bassPitch = (rootPitch + (isDim ? 6 : 7)) % 12;
    intervalLabel = "5ª";
  } else if (invIdx === 3) {
    bassPitch = (rootPitch + (isMaj7 ? 11 : 10)) % 12;
    intervalLabel = "7ª";
  }

  const PITCH_TO_FLAT_NAME = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  const shouldUseFlats = root.includes("b") || ["F", "Dm", "Gm", "Cm", "Fm", "Bbm", "Ebm"].some(k => chordName.startsWith(k));
  const bassName = shouldUseFlats ? PITCH_TO_FLAT_NAME[bassPitch]! : PITCH_TO_SHARP_NAME[bassPitch]!;
  const bassPt = NOTE_NAMES_LANG[lang]?.[bassName] ?? bassName;

  let invLabelText = `${invIdx}ª Inversão (Baixo na ${intervalLabel}: ${bassPt})`;
  if (lang === "en") {
    const ordinal = invIdx === 1 ? "1st" : invIdx === 2 ? "2nd" : "3rd";
    invLabelText = `${ordinal} Inversion (Bass on ${intervalLabel}: ${bassPt})`;
  } else if (lang === "es") {
    invLabelText = `${invIdx}ª Inversión (Bajo en la ${intervalLabel}: ${bassPt})`;
  }

  return {
    slashChord: `${chordName}/${bassName}`,
    bassNote: bassName,
    bassNotePt: bassPt,
    inversionLabel: invLabelText,
  };
}

/**
 * Fallback algorithmic guitar shape builder for movable barre chords (E and A shapes)
 * Supports invIdx (0 = root, 1 = 1st inv, 2 = 2nd inv, 3 = 3rd inv)
 */
export function getGuitarChordShape(chordName: string, invIdx: number = 0): GuitarChordShape {
  // Check explicit inversion database
  if (invIdx > 0 && GUITAR_INVERSIONS_DB[chordName]?.[invIdx]) {
    return GUITAR_INVERSIONS_DB[chordName]![invIdx]!;
  }

  // Direct match for fundamental
  if (invIdx === 0 && GUITAR_CHORDS_DB[chordName]) {
    return GUITAR_CHORDS_DB[chordName]!;
  }

  // Normalized match (handling variants like maj7, dim, etc.)
  const clean = chordName.replace(/maj7/gi, "7M").replace(/°/g, "dim");
  if (invIdx === 0 && GUITAR_CHORDS_DB[clean]) {
    return GUITAR_CHORDS_DB[clean]!;
  }
  if (invIdx > 0 && GUITAR_INVERSIONS_DB[clean]?.[invIdx]) {
    return GUITAR_INVERSIONS_DB[clean]![invIdx]!;
  }

  // Enharmonic equivalent match (e.g., C# <-> Db, A# <-> Bb, D# <-> Eb, F# <-> Gb, G# <-> Ab, E# <-> F)
  const ENHARMONIC_EQUIV: Record<string, string> = {
    "C#": "Db", Db: "C#",
    "D#": "Eb", Eb: "D#",
    "F#": "Gb", Gb: "F#",
    "G#": "Ab", Ab: "G#",
    "A#": "Bb", Bb: "A#",
    "E#": "F",
  };

  const match = chordName.match(/^([A-G][#b]?)(.*)$/);
  if (!match) {
    return GUITAR_CHORDS_DB["C"]!;
  }

  const root = match[1]!;
  const suffix = match[2]!;
  const rootPitch = PITCH_CLASSES[root] ?? 0;

  const altRoot = ENHARMONIC_EQUIV[root];
  if (altRoot) {
    const altChord = `${altRoot}${suffix}`;
    const altClean = altChord.replace(/maj7/gi, "7M").replace(/°/g, "dim");
    if (invIdx === 0 && GUITAR_CHORDS_DB[altChord]) {
      return GUITAR_CHORDS_DB[altChord]!;
    }
    if (invIdx === 0 && GUITAR_CHORDS_DB[altClean]) {
      return GUITAR_CHORDS_DB[altClean]!;
    }
    if (invIdx > 0 && GUITAR_INVERSIONS_DB[altChord]?.[invIdx]) {
      return GUITAR_INVERSIONS_DB[altChord]![invIdx]!;
    }
    if (invIdx > 0 && GUITAR_INVERSIONS_DB[altClean]?.[invIdx]) {
      return GUITAR_INVERSIONS_DB[altClean]![invIdx]!;
    }
  }

  const slashInfo = getInvertedChordDisplayName(chordName, invIdx);
  const targetTitle = invIdx > 0 ? slashInfo.slashChord : chordName;

  // Dynamic transposition for inversions not in database
  if (invIdx > 0) {
    let baseModelChord = "C";
    let baseModelRoot = 0;

    if (suffix.includes("m7(b5)") || suffix.includes("m7b5") || suffix.includes("ø")) {
      baseModelChord = "Bm7(b5)";
      baseModelRoot = 11;
    } else if (suffix.includes("7M") || suffix.includes("maj7")) {
      baseModelChord = "C7M";
      baseModelRoot = 0;
    } else if (suffix === "7") {
      baseModelChord = "C7";
      baseModelRoot = 0;
    } else if (suffix.includes("m7")) {
      baseModelChord = "Dm7";
      baseModelRoot = 2;
    } else if (suffix.includes("dim") || suffix.includes("°")) {
      baseModelChord = "Bdim";
      baseModelRoot = 11;
    } else if (suffix === "m") {
      baseModelChord = "Am";
      baseModelRoot = 9;
    }

    const template = GUITAR_INVERSIONS_DB[baseModelChord]?.[invIdx];
    if (template) {
      const shift = (rootPitch - baseModelRoot + 12) % 12;
      const transposedFrets = template.frets.map((f) => (typeof f === "number" ? f + shift : f));
      const minFret = transposedFrets.reduce<number>((min, f) => (typeof f === "number" ? Math.min(min, f) : min), 12);
      return {
        chord: targetTitle,
        baseFret: Math.max(1, minFret),
        frets: transposedFrets,
        fingers: template.fingers,
      };
    }
  }

  // Movable A-shape barre on 5th string (A string = pitch 9)
  // Fret = (rootPitch - 9 + 12) % 12, if 0 then 12
  let aFret = (rootPitch - 9 + 12) % 12;
  if (aFret === 0) aFret = 12;

  // If suffix has m7(b5)
  if (suffix.includes("m7(b5)") || suffix.includes("m7b5") || suffix.includes("ø")) {
    return {
      chord: targetTitle,
      baseFret: Math.max(1, aFret - 1),
      frets: ["x", aFret, aFret + 1, aFret, aFret + 1, "x"],
      fingers: [0, 1, 3, 2, 4, 0],
    };
  }

  // If suffix has 7M
  if (suffix.includes("7M") || suffix.includes("maj7")) {
    return {
      chord: targetTitle,
      baseFret: Math.max(1, aFret - 1),
      frets: ["x", aFret, aFret + 2, aFret + 1, aFret + 2, aFret],
      fingers: [0, 1, 3, 2, 4, 1],
      barre: { fret: aFret, fromString: 5, toString: 1, finger: 1 },
    };
  }

  // If suffix has 7
  if (suffix === "7") {
    return {
      chord: targetTitle,
      baseFret: Math.max(1, aFret - 1),
      frets: ["x", aFret, aFret + 2, aFret, aFret + 2, aFret],
      fingers: [0, 1, 3, 1, 4, 1],
      barre: { fret: aFret, fromString: 5, toString: 1, finger: 1 },
    };
  }

  // If suffix has m7
  if (suffix.includes("m7")) {
    return {
      chord: targetTitle,
      baseFret: Math.max(1, aFret - 1),
      frets: ["x", aFret, aFret + 2, aFret, aFret + 1, aFret],
      fingers: [0, 1, 3, 1, 2, 1],
      barre: { fret: aFret, fromString: 5, toString: 1, finger: 1 },
    };
  }

  // If minor triad
  if (suffix === "m") {
    return {
      chord: targetTitle,
      baseFret: Math.max(1, aFret - 1),
      frets: ["x", aFret, aFret + 2, aFret + 2, aFret + 1, aFret],
      fingers: [0, 1, 3, 4, 2, 1],
      barre: { fret: aFret, fromString: 5, toString: 1, finger: 1 },
    };
  }

  // Default Major triad (A-shape barre)
  return {
    chord: targetTitle,
    baseFret: Math.max(1, aFret - 1),
    frets: ["x", aFret, aFret + 2, aFret + 2, aFret + 2, aFret],
    fingers: [0, 1, 2, 3, 4, 1],
    barre: { fret: aFret, fromString: 5, toString: 1, finger: 1 },
  };
}

export function analyzeChord(chord: string, midis: number[], lang: Language = "pt"): ChordAnalysis {
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  const rootName = match ? match[1]! : "C";
  const suffix = match ? match[2]! : "";

  let quality: ChordAnalysis["quality"] = "major";
  let formula = "1P - 3M - 5J";

  const formulasFull: Record<string, Record<Language, string>> = {
    major: { pt: "Fundamental + Terça Maior + Quinta Justa", en: "Root + Major Third + Perfect Fifth", es: "Fundamental + Tercera Mayor + Quinta Justa" },
    minor: { pt: "Fundamental + Terça Menor + Quinta Justa", en: "Root + Minor Third + Perfect Fifth", es: "Fundamental + Tercera Menor + Quinta Justa" },
    major7: { pt: "Fundamental + Terça Maior + Quinta Justa + Sétima Maior", en: "Root + Major Third + Perfect Fifth + Major Seventh", es: "Fundamental + Tercera Mayor + Quinta Justa + Séptima Mayor" },
    dominant7: { pt: "Fundamental + Terça Maior + Quinta Justa + Sétima Menor", en: "Root + Major Third + Perfect Fifth + Minor Seventh", es: "Fundamental + Tercera Mayor + Quinta Justa + Séptima Menor" },
    minor7: { pt: "Fundamental + Terça Menor + Quinta Justa + Sétima Menor", en: "Root + Minor Third + Perfect Fifth + Minor Seventh", es: "Fundamental + Tercera Menor + Quinta Justa + Séptima Menor" },
    diminished: { pt: "Fundamental + Terça Menor + Quinta Diminuta", en: "Root + Minor Third + Diminished Fifth", es: "Fundamental + Tercera Menor + Quinta Disminuida" },
    "half-diminished": { pt: "Fundamental + Terça Menor + Quinta Diminuta + Sétima Menor", en: "Root + Minor Third + Diminished Fifth + Minor Seventh", es: "Fundamental + Tercera Menor + Quinta Disminuida + Séptima Menor" },
  };

  const descriptions: Record<string, Record<Language, string>> = {
    major: { pt: "Acorde Maior (Tríade Consonante)", en: "Major Chord (Consonant Triad)", es: "Acorde Mayor (Tríada Consonante)" },
    minor: { pt: "Acorde Menor (Tríade Melancólica e Introspectiva)", en: "Minor Chord (Melancholic Triad)", es: "Acorde Menor (Tríada Melancólica)" },
    major7: { pt: "Acorde com Sétima Maior (Aveludado, suave e lírico)", en: "Major 7th Chord (Smooth and lyrical)", es: "Acorde con Séptima Mayor (Suave y lírico)" },
    dominant7: { pt: "Acorde Dominante com Sétima Menor (Gera o trítono de tensão)", en: "Dominant 7th Chord (Generates tension resolving to tonic)", es: "Acorde Dominante con Séptima Menor (Genera tensión)" },
    minor7: { pt: "Acorde Menor com Sétima (Sonoridade moderna, rica e relaxada)", en: "Minor 7th Chord (Modern and rich sound)", es: "Acorde Menor con Séptima (Sonoridad moderna y rica)" },
    diminished: { pt: "Acorde Diminuto (Forte instabilidade pelo trítono)", en: "Diminished Chord (Tense instability)", es: "Acorde Disminuido (Tensión e inestabilidad)" },
    "half-diminished": { pt: "Acorde Meio-Diminuto (Sensível e Tenso)", en: "Half-Diminished Chord (Tense leading chord)", es: "Acorde Semidisminuido (Tensión armónica)" },
  };

  if (suffix.includes("m7(b5)") || suffix.includes("m7b5") || suffix.includes("ø")) {
    quality = "half-diminished";
    formula = "1P - 3m - 5dim - 7m";
  } else if (suffix.includes("7M") || suffix.includes("maj7")) {
    quality = "major7";
    formula = "1P - 3M - 5J - 7M";
  } else if (suffix === "7") {
    quality = "dominant7";
    formula = "1P - 3M - 5J - 7m";
  } else if (suffix.includes("m7")) {
    quality = "minor7";
    formula = "1P - 3m - 5J - 7m";
  } else if (suffix.includes("dim") || suffix.includes("°")) {
    quality = "diminished";
    formula = "1P - 3m - 5dim";
  } else if (suffix === "m") {
    quality = "minor";
    formula = "1P - 3m - 5J";
  }

  const formulaFullName = formulasFull[quality]?.[lang] || formulasFull[quality]?.pt || "";
  const formulaExplained = formula;
  const description = descriptions[quality]?.[lang] || descriptions[quality]?.pt || "";
  const pianoFingerSuggestion = lang === "en"
    ? "Right Hand: Fingers 1 (thumb) - 3 (middle) - 5 (pinky)"
    : lang === "es"
    ? "Mano Derecha: Dedos 1 (pulgar) - 3 (medio) - 5 (meñique)"
    : "Mão Direita: Dedos 1 (polegar) - 3 (médio) - 5 (mínimo)";
  const guitarFingerSuggestion = lang === "en"
    ? "Press with fingertips, maintaining natural hand arch."
    : lang === "es"
    ? "Presiona con la yema de los dedos manteniendo el arco natural de la mano."
    : "Pressione com a ponta dos dedos, mantendo o arco natural da mão.";

  const rootNoteLang = NOTE_NAMES_LANG[lang]?.[rootName] ?? rootName;
  const qualitySuffixLabels: Record<string, Record<Language, string>> = {
    major: { pt: "Maior", en: "Major", es: "Mayor" },
    minor: { pt: "Menor", en: "Minor", es: "Menor" },
    major7: { pt: "Maior com Sétima Maior", en: "Major 7th", es: "Mayor con Séptima Mayor" },
    dominant7: { pt: "com Sétima Dominante", en: "Dominant 7th", es: "con Séptima Dominante" },
    minor7: { pt: "Menor com Sétima", en: "Minor 7th", es: "Menor con Séptima" },
    diminished: { pt: "Diminuto", en: "Diminished", es: "Disminuido" },
    "half-diminished": { pt: "Meio-Diminuto", en: "Half-Diminished", es: "Semidisminuido" },
  };

  const fullChordName = `${rootNoteLang} ${qualitySuffixLabels[quality]?.[lang] || qualitySuffixLabels[quality]?.pt}`;

  const rootPitch = PITCH_CLASSES[rootName] ?? 0;
  const PITCH_TO_FLAT_NAME = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  const shouldUseFlats = rootName.includes("b") || ["F", "Dm", "Gm", "Cm", "Fm", "Bbm", "Ebm"].some(k => chord.startsWith(k));

  // Build interval infos for each MIDI note
  const notes: NoteIntervalInfo[] = midis.map((m, i) => {
    const pitchClass = m % 12;
    const semitoneInterval = (pitchClass - rootPitch + 12) % 12;
    const noteName = shouldUseFlats
      ? (PITCH_TO_FLAT_NAME[pitchClass] ?? "C")
      : (PITCH_TO_SHARP_NAME[pitchClass] ?? "C");
    const ptName = NOTE_NAMES_LANG[lang]?.[noteName] ?? noteName;

    let intervalShort = "1P";
    let intervalName = lang === "en" ? "Root (Tonic)" : lang === "es" ? "Fundamental (Tónica)" : "Fundamental (Tônica)";
    let intervalRole = lang === "en" ? "Base note (Tonic) that names the chord" : lang === "es" ? "Nota base (Tónica) que da nombre al acorde" : "Nota base (Tônica) que dá nome ao acorde";

    if (i === 0 || semitoneInterval === 0) {
      intervalShort = "1P";
      intervalName = lang === "en" ? "Root (Tonic)" : lang === "es" ? "Fundamental (Tónica)" : "Fundamental (Tônica)";
      intervalRole = lang === "en" ? "Base note (Tonic) that names the chord" : lang === "es" ? "Nota base (Tónica) que da nombre al acorde" : "Nota base (Tônica) que dá nome ao acorde";
    } else if (semitoneInterval === 3) {
      intervalShort = "3m";
      intervalName = lang === "en" ? "Minor Third (3m)" : lang === "es" ? "Tercera Menor (3m)" : "Terça Menor (3m)";
      intervalRole = lang === "en" ? "Defines minor tonality (mellow)" : lang === "es" ? "Define el tono menor (melancólico)" : "Define o tom menor (melancólico/suave)";
    } else if (semitoneInterval === 4) {
      intervalShort = "3M";
      intervalName = lang === "en" ? "Major Third (3M)" : lang === "es" ? "Tercera Mayor (3M)" : "Terça Maior (3M)";
      intervalRole = lang === "en" ? "Defines major tonality (bright)" : lang === "es" ? "Define el tono mayor (alegre)" : "Define o tom maior (alegre/brilhante)";
    } else if (semitoneInterval === 6) {
      intervalShort = "5dim";
      intervalName = lang === "en" ? "Diminished Fifth (5dim)" : lang === "es" ? "Quinta Disminuida (5dim)" : "Quinta Diminuta (5dim)";
      intervalRole = lang === "en" ? "Generates tritone harmonic tension" : lang === "es" ? "Genera la tensión del tritono" : "Gera o trítono de instabilidade harmônica";
    } else if (semitoneInterval === 7) {
      intervalShort = "5J";
      intervalName = lang === "en" ? "Perfect Fifth (5P)" : lang === "es" ? "Quinta Justa (5J)" : "Quinta Justa (5J)";
      intervalRole = lang === "en" ? "Provides body and acoustic stability" : lang === "es" ? "Da cuerpo y estabilidad acústica" : "Dá corpo, firmeza e estabilidade acústica";
    } else if (semitoneInterval === 10) {
      intervalShort = "7m";
      intervalName = lang === "en" ? "Minor Seventh (7m)" : lang === "es" ? "Séptima Menor (7m)" : "Sétima Menor (7m)";
      intervalRole = lang === "en" ? "Adds dynamic tension needing resolution" : lang === "es" ? "Añade tensión dinámica resolutiva" : "Adiciona tensão dinâmica que pede resolução";
    } else if (semitoneInterval === 11) {
      intervalShort = "7M";
      intervalName = lang === "en" ? "Major Seventh (7M)" : lang === "es" ? "Séptima Mayor (7M)" : "Sétima Maior (7M)";
      intervalRole = lang === "en" ? "Lends smooth, lyrical elegance" : lang === "es" ? "Otorga elegancia suave y lírica" : "Confere elegância suave, lírica e bossa nova";
    }

    return {
      midi: m,
      pitchClass,
      noteName,
      ptName,
      intervalName,
      intervalShort,
      intervalRole,
      pianoKeyIndex: m - 48,
    };
  });

  return {
    chord,
    rootName,
    fullChordName,
    quality,
    formula,
    formulaFullName,
    formulaExplained,
    description,
    notes,
    pianoFingerSuggestion,
    guitarFingerSuggestion,
  };
}

/**
 * Convert Guitar chord fret numbers to real MIDI pitch numbers based on standard guitar tuning:
 * String 6 (E2: 40), 5 (A2: 45), 4 (D3: 50), 3 (G3: 55), 2 (B3: 59), 1 (E4: 64)
 */
export function getGuitarChordMidis(shape: GuitarChordShape): number[] {
  const OPEN_STRINGS_MIDI = [40, 45, 50, 55, 59, 64];
  const midis: number[] = [];
  shape.frets.forEach((fret, stringIdx) => {
    if (typeof fret === "number" && fret >= 0) {
      midis.push(OPEN_STRINGS_MIDI[stringIdx]! + fret);
    }
  });
  return midis.length > 0 ? midis : [48, 52, 55];
}

/**
 * Detailed information for each guitar string in a chord shape,
 * mapping frets, notes, intervals, and finger suggestions.
 */
export interface GuitarStringDetail {
  stringIdx: number; // 0 = 6th string (low E), 5 = 1st string (high e)
  stringName: string; // "E", "A", "D", "G", "B", "e"
  stringLabel: string; // "6ª (E)", "5ª (A)", etc.
  stringPtName: string; // "6ª Corda (Mi grave)", etc.
  fret: number | "x";
  finger?: number;
  midi?: number;
  pitchClass?: number;
  noteName?: string;
  ptName?: string;
  intervalShort?: string;
  intervalName?: string;
  octave?: number;
  isMuted: boolean;
  isOpen: boolean;
}

export function getGuitarStringDetails(shape: GuitarChordShape, chordName: string, lang: Language = "pt"): GuitarStringDetail[] {
  const OPEN_STRINGS_MIDI = [40, 45, 50, 55, 59, 64];
  const stringNames = ["E", "A", "D", "G", "B", "e"];
  const stringLabels = lang === "en"
    ? ["6th (E)", "5th (A)", "4th (D)", "3rd (G)", "2nd (B)", "1st (e)"]
    : ["6ª (E)", "5ª (A)", "4ª (D)", "3ª (G)", "2ª (B)", "1ª (e)"];
  const stringPtNames = lang === "en"
    ? ["6th String (Low E)", "5th String (A)", "4th String (D)", "3rd String (G)", "2nd String (B)", "1st String (High E)"]
    : lang === "es"
    ? ["6ª Cuerda (Mi grave)", "5ª Cuerda (La)", "4ª Cuerda (Re)", "3ª Cuerda (Sol)", "2ª Cuerda (Si)", "1ª Cuerda (Mi agudo)"]
    : ["6ª Corda (Mi grave)", "5ª Corda (Lá)", "4ª Corda (Ré)", "3ª Corda (Sol)", "2ª Corda (Si)", "1ª Corda (Mi agudo)"];

  // Extract root note
  const rootMatch = chordName.match(/^[A-G][b#]?/);
  const rootName = rootMatch ? rootMatch[0] : "C";
  const rootPitch = PITCH_CLASSES[rootName] ?? 0;
  const shouldUseFlats = rootName.includes("b") || ["F", "Dm", "Gm", "Cm", "Fm", "Bbm", "Ebm"].some(k => chordName.startsWith(k));
  const PITCH_TO_FLAT_NAME = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

  return shape.frets.map((fret, sIdx) => {
    const isMuted = fret === "x";
    const isOpen = fret === 0;
    const finger = shape.fingers ? shape.fingers[sIdx] : undefined;

    if (isMuted) {
      return {
        stringIdx: sIdx,
        stringName: stringNames[sIdx]!,
        stringLabel: stringLabels[sIdx]!,
        stringPtName: stringPtNames[sIdx]!,
        fret: "x",
        isMuted: true,
        isOpen: false,
      };
    }

    const fretNum = typeof fret === "number" ? fret : 0;
    const midi = OPEN_STRINGS_MIDI[sIdx]! + fretNum;
    const pitchClass = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    const noteName = shouldUseFlats
      ? (PITCH_TO_FLAT_NAME[pitchClass] ?? "C")
      : (PITCH_TO_SHARP_NAME[pitchClass] ?? "C");
    const ptName = NOTE_NAMES_LANG[lang]?.[noteName] ?? noteName;
    const semitone = (pitchClass - rootPitch + 12) % 12;

    let intervalShort = "1P";
    let intervalName = lang === "en" ? "Root (Tonic)" : lang === "es" ? "Fundamental (Tónica)" : "Fundamental (Tônica)";
    if (semitone === 0) {
      intervalShort = "1P";
      intervalName = lang === "en" ? "Root (Tonic)" : lang === "es" ? "Fundamental (Tónica)" : "Fundamental (Tônica)";
    } else if (semitone === 3) {
      intervalShort = "3m";
      intervalName = lang === "en" ? "Minor Third (3m)" : lang === "es" ? "Tercera Menor (3m)" : "Terça Menor (3m)";
    } else if (semitone === 4) {
      intervalShort = "3M";
      intervalName = lang === "en" ? "Major Third (3M)" : lang === "es" ? "Tercera Mayor (3M)" : "Terça Maior (3M)";
    } else if (semitone === 6) {
      intervalShort = "5dim";
      intervalName = lang === "en" ? "Diminished Fifth (5dim)" : lang === "es" ? "Quinta Disminuida (5dim)" : "Quinta Diminuta (5dim)";
    } else if (semitone === 7) {
      intervalShort = "5J";
      intervalName = lang === "en" ? "Perfect Fifth (5P)" : lang === "es" ? "Quinta Justa (5J)" : "Quinta Justa (5J)";
    } else if (semitone === 10) {
      intervalShort = "7m";
      intervalName = lang === "en" ? "Minor Seventh (7m)" : lang === "es" ? "Séptima Menor (7m)" : "Sétima Menor (7m)";
    } else if (semitone === 11) {
      intervalShort = "7M";
      intervalName = lang === "en" ? "Major Seventh (7M)" : lang === "es" ? "Séptima Mayor (7M)" : "Sétima Maior (7M)";
    } else if (semitone === 2) {
      intervalShort = "9M";
      intervalName = lang === "en" ? "Major Ninth (9M)" : lang === "es" ? "Novena Mayor (9M)" : "Nona Maior (9M)";
    } else if (semitone === 5) {
      intervalShort = "4J";
      intervalName = lang === "en" ? "Perfect Fourth (4P)" : lang === "es" ? "Cuarta Justa (4J)" : "Quarta Justa (4J)";
    } else if (semitone === 9) {
      intervalShort = "6M";
      intervalName = lang === "en" ? "Major Sixth (6M)" : lang === "es" ? "Sexta Mayor (6M)" : "Sexta Maior (6M)";
    }

    return {
      stringIdx: sIdx,
      stringName: stringNames[sIdx]!,
      stringLabel: stringLabels[sIdx]!,
      stringPtName: stringPtNames[sIdx]!,
      fret: fretNum,
      finger,
      midi,
      pitchClass,
      noteName,
      ptName,
      intervalShort,
      intervalName,
      octave,
      isMuted: false,
      isOpen,
    };
  });
}

/**
 * Helper to compute chord inversion voicings by shifting notes up by octaves
 */
export function getInvertedVoicing(baseNotes: number[], invIdx: number): number[] {
  if (!baseNotes || baseNotes.length === 0 || invIdx <= 0) return baseNotes;
  let notes = [...baseNotes].sort((a, b) => a - b);
  for (let i = 0; i < invIdx; i++) {
    const lowest = notes.shift()!;
    notes.push(lowest + 12);
    notes.sort((a, b) => a - b);
  }
  return notes;
}
