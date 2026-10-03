export type Mode = "major" | "minor";
export type ChordType = "triad" | "tetrad";

export interface KeyFieldPair {
  majorKey: string;
  majorAlt?: string;
  minorKey: string;
  dimKey: string;
  minorDimKey: string;
  /** Diatonic triads in Major (3 notes) */
  majorChords: [string, string, string, string, string, string, string];
  /** Diatonic tetrads in Major with 7ths (4 notes) */
  majorTetrads: [string, string, string, string, string, string, string];
  /** Diatonic triads in Minor (3 notes) */
  minorChords: [string, string, string, string, string, string, string];
  /** Diatonic tetrads in Minor with 7ths (4 notes) */
  minorTetrads: [string, string, string, string, string, string, string];
}

/** Uppercase Roman numerals for degrees */
export const ROMAN_DEGREES = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;

export interface ProgressionPreset {
  id: string;
  name: string;
  genre: string;
  description: string;
  /** 0-based indices corresponding to the 7 diatonic degrees [I=0, II=1, III=2, IV=3, V=4, VI=5, VII=6] */
  degrees: number[];
}

export const MAJOR_PROGRESSIONS: ProgressionPreset[] = [
  {
    id: "worship-slash-1",
    name: "I - V/7 - VI - IV (Com G/B)",
    genre: "Worship / Adoração (Baixo Invertido)",
    description: "Progressão de culto com condução suave no baixo (ex: C - G/B - Am - F / D - A/C# - Bm - G)",
    degrees: [0, 4, 5, 3],
  },
  {
    id: "worship-slash-2",
    name: "I - I/3 - IV - V (Com D/F# ou C/E)",
    genre: "Gospel Worship / Hinos",
    description: "Inversão clássica da tônica para subida fluida no violão e piano (ex: D - D/F# - G - A)",
    degrees: [0, 0, 3, 4],
  },
  {
    id: "worship-slash-3",
    name: "VI - V/3 - IV - I/3 (Caminhada Baixo)",
    genre: "Worship Acústico / Balada",
    description: "Linha de baixo descendente sofisticada para momentos de entrega e intimidade",
    degrees: [5, 4, 3, 0],
  },
  {
    id: "pop-4-chords",
    name: "I - V - VI - IV",
    genre: "Pop / Sertanejo / Rock",
    description: "A progressão mais famosa e tocada do mundo",
    degrees: [0, 4, 5, 3],
  },
  {
    id: "cadencia-perfeita",
    name: "I - IV - V - I",
    genre: "Gospel / Hinos / Folk",
    description: "Cadência autêntica e tradicional da Harpa Cristã e hinos clássicos",
    degrees: [0, 3, 4, 0],
  },
  {
    id: "gospel-worship",
    name: "VI - IV - I - V",
    genre: "Gospel Worship / Adoração",
    description: "A queridinha do louvor contemporâneo (Fernandinho, Bethel, Hillsong)",
    degrees: [5, 3, 0, 4],
  },
  {
    id: "gospel-ponte",
    name: "IV - I - V - VI",
    genre: "Gospel / Ponte de Louvor",
    description: "Clássica ponte de subida e intensidade (Gabriela Rocha, Morada)",
    degrees: [3, 0, 4, 5],
  },
  {
    id: "gospel-soul-black",
    name: "I - III - VI - IV",
    genre: "Gospel Soul / Black Worship",
    description: "Harmonia rica com terça menor preparando o relativo (Kirk Franklin, Tye Tribbett)",
    degrees: [0, 2, 5, 3],
  },
  {
    id: "gospel-elevacao",
    name: "IV - V - VI - I",
    genre: "Gospel Triunfal / Refrão",
    description: "Movimento ascendente de celebração e vitória",
    degrees: [3, 4, 5, 0],
  },
  {
    id: "gospel-adoracao-forte",
    name: "I - IV - VI - V",
    genre: "Gospel / Adoração & Fé",
    description: "Movimento harmônico fluido muito usado em baladas de louvor",
    degrees: [0, 3, 5, 4],
  },
  {
    id: "jazz-mpb",
    name: "II - V - I",
    genre: "Jazz / Bossa Nova / MPB",
    description: "A espinha dorsal da harmonia funcional moderna",
    degrees: [1, 4, 0],
  },
  {
    id: "anos-50",
    name: "I - VI - IV - V",
    genre: "Anos 50 / Balada / Doo-wop",
    description: "Sucessão nostálgica e romântica das grandes baladas",
    degrees: [0, 5, 3, 4],
  },
];

export function getThirdNoteName(root: string): string {
  const map: Record<string, string> = {
    C: "E", "C#": "E#", Db: "F", D: "F#", "D#": "F##", Eb: "G", E: "G#", F: "A", "F#": "A#", Gb: "Bb", G: "B", "G#": "B#", Ab: "C", A: "C#", "A#": "C##", Bb: "D", B: "D#"
  };
  return map[root] || "3ª";
}

export function getPresetChordDisplay(presetId: string, field: ActiveHarmonicField, degIdx: number, stepIdx: number): string {
  const baseChord = field.chords[degIdx]!.chord;
  const root = baseChord.match(/^[A-G][#b]?/)?.[0] || baseChord;
  const thirdNote = getThirdNoteName(root);

  if (presetId === "worship-slash-1" && stepIdx === 1) {
    return `${baseChord}/${thirdNote}`;
  }
  if (presetId === "worship-slash-2" && stepIdx === 1) {
    return `${baseChord}/${thirdNote}`;
  }
  if (presetId === "worship-slash-3" && (stepIdx === 1 || stepIdx === 3)) {
    return `${baseChord}/${thirdNote}`;
  }
  return baseChord;
}

export const MINOR_PROGRESSIONS: ProgressionPreset[] = [
  {
    id: "menor-pop",
    name: "I - VI - VII - I",
    genre: "Gospel / Rock Menor / Clamor",
    description: "Dramática, usada em momentos de clamor e canções de guerra espiritual",
    degrees: [0, 5, 6, 0],
  },
  {
    id: "gospel-menor-worship",
    name: "I - IV - VI - VII",
    genre: "Gospel Worship Menor",
    description: "Sucessão contemplativa e moderna em tom menor",
    degrees: [0, 3, 5, 6],
  },
  {
    id: "gospel-lamento",
    name: "I - VII - VI - V",
    genre: "Gospel Lamento / Clamor",
    description: "Descendente solene muito presente em orações e hinos de súplica",
    degrees: [0, 6, 5, 4],
  },
  {
    id: "menor-epica",
    name: "I - VI - III - VII",
    genre: "Épica / Balada Menor",
    description: "Sucessão heroica muito presente em trilhas sonoras e louvor épico",
    degrees: [0, 5, 2, 6],
  },
  {
    id: "menor-tradicional",
    name: "I - IV - V - I",
    genre: "Menor Tradicional / Hinos",
    description: "Cadência clássica menor com forte tensão e resolução na tônica",
    degrees: [0, 3, 4, 0],
  },
  {
    id: "jazz-menor",
    name: "II - V - I",
    genre: "Jazz Menor / Noir",
    description: "Cadência menor sofisticada com acorde meio-diminuto",
    degrees: [1, 4, 0],
  },
  {
    id: "andante-flamenco",
    name: "I - VII - VI - VII",
    genre: "Flamenco / Andante",
    description: "Movimento descendente com sabor latino e andaluz",
    degrees: [0, 6, 5, 6],
  },
];

/**
 * 12 Keys arranged along Circle of Fifths.
 * In Major, starts in C.
 * In Minor, starts in Cm.
 * Diatonic chords match the user's "Campo Harmônico Maior vs Menor - Guia de Bolso".
 */
export const FIELDS: KeyFieldPair[] = [
  // 0: C / Cm
  {
    majorKey: "C",
    minorKey: "Cm",
    dimKey: "Bdim",
    minorDimKey: "Ddim",
    majorChords: ["C", "Dm", "Em", "F", "G", "Am", "Bdim"],
    majorTetrads: ["C7M", "Dm7", "Em7", "F7M", "G7", "Am7", "Bm7(b5)"],
    minorChords: ["Cm", "Ddim", "Eb", "Fm", "Gm", "Ab", "Bb"],
    minorTetrads: ["Cm7", "Dm7(b5)", "Eb7M", "Fm7", "Gm7", "Ab7M", "Bb7"],
  },
  // 1: G / Gm
  {
    majorKey: "G",
    minorKey: "Gm",
    dimKey: "F#dim",
    minorDimKey: "Adim",
    majorChords: ["G", "Am", "Bm", "C", "D", "Em", "F#dim"],
    majorTetrads: ["G7M", "Am7", "Bm7", "C7M", "D7", "Em7", "F#m7(b5)"],
    minorChords: ["Gm", "Adim", "Bb", "Cm", "Dm", "Eb", "F"],
    minorTetrads: ["Gm7", "Am7(b5)", "Bb7M", "Cm7", "Dm7", "Eb7M", "F7"],
  },
  // 2: D / Dm
  {
    majorKey: "D",
    minorKey: "Dm",
    dimKey: "C#dim",
    minorDimKey: "Edim",
    majorChords: ["D", "Em", "F#m", "G", "A", "Bm", "C#dim"],
    majorTetrads: ["D7M", "Em7", "F#m7", "G7M", "A7", "Bm7", "C#m7(b5)"],
    minorChords: ["Dm", "Edim", "F", "Gm", "Am", "Bb", "C"],
    minorTetrads: ["Dm7", "Em7(b5)", "F7M", "Gm7", "Am7", "Bb7M", "C7"],
  },
  // 3: A / Am
  {
    majorKey: "A",
    minorKey: "Am",
    dimKey: "G#dim",
    minorDimKey: "Bdim",
    majorChords: ["A", "Bm", "C#m", "D", "E", "F#m", "G#dim"],
    majorTetrads: ["A7M", "Bm7", "C#m7", "D7M", "E7", "F#m7", "G#m7(b5)"],
    minorChords: ["Am", "Bdim", "C", "Dm", "Em", "F", "G"],
    minorTetrads: ["Am7", "Bm7(b5)", "C7M", "Dm7", "Em7", "F7M", "G7"],
  },
  // 4: E / Em
  {
    majorKey: "E",
    minorKey: "Em",
    dimKey: "D#dim",
    minorDimKey: "F#dim",
    majorChords: ["E", "F#m", "G#m", "A", "B", "C#m", "D#dim"],
    majorTetrads: ["E7M", "F#m7", "G#m7", "A7M", "B7", "C#m7", "D#m7(b5)"],
    minorChords: ["Em", "F#dim", "G", "Am", "Bm", "C", "D"],
    minorTetrads: ["Em7", "F#m7(b5)", "G7M", "Am7", "Bm7", "C7M", "D7"],
  },
  // 5: B / Bm
  {
    majorKey: "B",
    minorKey: "Bm",
    dimKey: "A#dim",
    minorDimKey: "C#dim",
    majorChords: ["B", "C#m", "D#m", "E", "F#", "G#m", "A#dim"],
    majorTetrads: ["B7M", "C#m7", "D#m7", "E7M", "F#7", "G#m7", "A#m7(b5)"],
    minorChords: ["Bm", "C#dim", "D", "Em", "F#m", "G", "A"],
    minorTetrads: ["Bm7", "C#m7(b5)", "D7M", "Em7", "F#m7", "G7M", "A7"],
  },
  // 6: F# / F#m
  {
    majorKey: "F#",
    majorAlt: "Gb",
    minorKey: "F#m",
    dimKey: "E#dim",
    minorDimKey: "G#dim",
    majorChords: ["F#", "G#m", "A#m", "B", "C#", "D#m", "E#dim"],
    majorTetrads: ["F#7M", "G#m7", "A#m7", "B7M", "C#7", "D#m7", "E#m7(b5)"],
    minorChords: ["F#m", "G#dim", "A", "Bm", "C#m", "D", "E"],
    minorTetrads: ["F#m7", "G#m7(b5)", "A7M", "Bm7", "C#m7", "D7M", "E7"],
  },
  // 7: Db / C#m
  {
    majorKey: "Db",
    majorAlt: "C#",
    minorKey: "C#m",
    dimKey: "Cdim",
    minorDimKey: "D#dim",
    majorChords: ["Db", "Ebm", "Fm", "Gb", "Ab", "Bbm", "Cdim"],
    majorTetrads: ["Db7M", "Ebm7", "Fm7", "Gb7M", "Ab7", "Bbm7", "Cm7(b5)"],
    minorChords: ["C#m", "D#dim", "E", "F#m", "G#m", "A", "B"],
    minorTetrads: ["C#m7", "D#m7(b5)", "E7M", "F#m7", "G#m7", "A7M", "B7"],
  },
  // 8: Ab / G#m
  {
    majorKey: "Ab",
    majorAlt: "G#",
    minorKey: "G#m",
    dimKey: "Gdim",
    minorDimKey: "A#dim",
    majorChords: ["Ab", "Bbm", "Cm", "Db", "Eb", "Fm", "Gdim"],
    majorTetrads: ["Ab7M", "Bbm7", "Cm7", "Db7M", "Eb7", "Fm7", "Gm7(b5)"],
    minorChords: ["G#m", "A#dim", "B", "C#m", "D#m", "E", "F#"],
    minorTetrads: ["G#m7", "A#m7(b5)", "B7M", "C#m7", "D#m7", "E7M", "F#7"],
  },
  // 9: Eb / Ebm
  {
    majorKey: "Eb",
    minorKey: "Ebm",
    dimKey: "Ddim",
    minorDimKey: "Fdim",
    majorChords: ["Eb", "Fm", "Gm", "Ab", "Bb", "Cm", "Ddim"],
    majorTetrads: ["Eb7M", "Fm7", "Gm7", "Ab7M", "Bb7", "Cm7", "Dm7(b5)"],
    minorChords: ["Ebm", "Fdim", "Gb", "Abm", "Bbm", "B", "Db"],
    minorTetrads: ["Ebm7", "Fm7(b5)", "Gb7M", "Abm7", "Bbm7", "B7M", "Db7"],
  },
  // 10: Bb / Bbm
  {
    majorKey: "Bb",
    minorKey: "Bbm",
    dimKey: "Adim",
    minorDimKey: "Cdim",
    majorChords: ["Bb", "Cm", "Dm", "Eb", "F", "Gm", "Adim"],
    majorTetrads: ["Bb7M", "Cm7", "Dm7", "Eb7M", "F7", "Gm7", "Am7(b5)"],
    minorChords: ["Bbm", "Cdim", "Db", "Ebm", "Fm", "Gb", "Ab"],
    minorTetrads: ["Bbm7", "Cm7(b5)", "Db7M", "Ebm7", "Fm7", "Gb7M", "Ab7"],
  },
  // 11: F / Fm
  {
    majorKey: "F",
    minorKey: "Fm",
    dimKey: "Edim",
    minorDimKey: "Gdim",
    majorChords: ["F", "Gm", "Am", "Bb", "C", "Dm", "Edim"],
    majorTetrads: ["F7M", "Gm7", "Am7", "Bb7M", "C7", "Dm7", "Em7(b5)"],
    minorChords: ["Fm", "Gdim", "Ab", "Bbm", "Cm", "Db", "Eb"],
    minorTetrads: ["Fm7", "Gm7(b5)", "Ab7M", "Bbm7", "Cm7", "Db7M", "Eb7"],
  },
];

export const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Standard pitch names (0=C ... 11=B) */
export const PITCH_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;

/** Normalize an angle in degrees to [-180, 180) */
export const norm = (a: number) => mod(a + 180, 360) - 180;

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NAT = [0, 2, 4, 5, 7, 9, 11];

export function pitchOf(name: string) {
  // Strip extensions like 7M, m7(b5), m7, 7, dim, m, °, etc.
  const clean = name
    .replace(/7M$/, "")
    .replace(/m7\(b5\)$/, "")
    .replace(/m7$/, "")
    .replace(/7$/, "")
    .replace(/dim$/, "")
    .replace(/m$/, "")
    .replace(/°$/, "")
    .replace(/\+$/, "");

  const l = LETTERS.indexOf(clean[0]!);
  if (l === -1) return 0;
  let p = NAT[l]!;
  for (const c of clean.slice(1)) p += c === "#" ? 1 : c === "b" ? -1 : 0;
  return mod(p, 12);
}

/** Returns the MIDI note numbers for a chord (3 notes for Triad, 4 notes for Tetrad) */
export function getChordNotes(chord: string): number[] {
  const p = pitchOf(chord);
  // Voicing positioned starting at C3 (MIDI 48) for 2-octave keyboard (C3-C5):
  const rootMidi = 48 + p;

  // Half-diminished (m7(b5))
  if (chord.includes("m7(b5)")) {
    return [rootMidi, rootMidi + 3, rootMidi + 6, rootMidi + 10];
  }
  // Major 7th (7M)
  if (chord.includes("7M")) {
    return [rootMidi, rootMidi + 4, rootMidi + 7, rootMidi + 11];
  }
  // Minor 7th (m7)
  if (chord.includes("m7")) {
    return [rootMidi, rootMidi + 3, rootMidi + 7, rootMidi + 10];
  }
  // Dominant 7th (7)
  if (chord.includes("7")) {
    return [rootMidi, rootMidi + 4, rootMidi + 7, rootMidi + 10];
  }

  // Triads:
  const isDim = chord.includes("dim") || chord.includes("°");
  const isMin = !isDim && chord.includes("m");
  const third = isDim || isMin ? rootMidi + 3 : rootMidi + 4;
  const fifth = isDim ? rootMidi + 6 : rootMidi + 7;
  return [rootMidi, third, fifth];
}

export interface FieldChordDisplay {
  romanDegree: string;
  degreeIndex: number;
  chord: string;
  isTonic: boolean;
  notes: number[];
}

export interface ActiveHarmonicField {
  index: number;
  tonicName: string;
  relativeName: string;
  modeLabel: string;
  chordType: ChordType;
  chords: FieldChordDisplay[];
}

export function getActiveHarmonicField(
  index: number,
  mode: Mode,
  chordType: ChordType = "triad",
  lang: "pt" | "en" | "es" = "pt"
): ActiveHarmonicField {
  const normIndex = mod(index, 12);
  const pair = FIELDS[normIndex]!;

  const chordsList =
    mode === "major"
      ? chordType === "tetrad"
        ? pair.majorTetrads
        : pair.majorChords
      : chordType === "tetrad"
      ? pair.minorTetrads
      : pair.minorChords;

  const tetradLabel =
    lang === "en" ? "Tetrads with 7th" : lang === "es" ? "Tétradas con 7ª" : "Tétrades com 7ª";
  const triadLabel =
    lang === "en" ? "Triads" : lang === "es" ? "Tríadas" : "Tríades";

  if (mode === "major") {
    const relKey = chordType === "tetrad" ? pair.majorTetrads[5] : pair.majorChords[5];
    const relPrefix =
      lang === "en" ? "relative minor" : lang === "es" ? "relativa menor" : "relativa menor";
    const modePrefix =
      lang === "en" ? "Major Harmonic Field" : lang === "es" ? "Campo Armónico Mayor" : "Campo Harmônico Maior";

    return {
      index: normIndex,
      tonicName: chordsList[0],
      relativeName: `${relPrefix}: ${relKey}`,
      modeLabel: `${modePrefix} (${chordType === "tetrad" ? tetradLabel : triadLabel})`,
      chordType,
      chords: chordsList.map((chord, i) => ({
        romanDegree: ROMAN_DEGREES[i],
        degreeIndex: i,
        chord,
        isTonic: i === 0,
        notes: getChordNotes(chord),
      })),
    };
  }

  // Minor Mode
  const relKey = chordType === "tetrad" ? pair.minorTetrads[2] : pair.minorChords[2];
  const relPrefix =
    lang === "en" ? "relative major" : lang === "es" ? "relativa mayor" : "relativa maior";
  const modePrefix =
    lang === "en" ? "Minor Harmonic Field" : lang === "es" ? "Campo Armónico Menor" : "Campo Harmônico Menor";

  return {
    index: normIndex,
    tonicName: chordsList[0],
    relativeName: `${relPrefix}: ${relKey}`,
    modeLabel: `${modePrefix} (${chordType === "tetrad" ? tetradLabel : triadLabel})`,
    chordType,
    chords: chordsList.map((chord, i) => ({
      romanDegree: ROMAN_DEGREES[i],
      degreeIndex: i,
      chord,
      isTonic: i === 0,
      notes: getChordNotes(chord),
    })),
  };
}
