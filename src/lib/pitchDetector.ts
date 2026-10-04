/**
 * Workestra Vocal Pitch Detector & Key Detection Engine
 * High-performance Web Audio autocorrelation & YIN-based fundamental frequency estimator
 */

export interface PitchDetectionResult {
  frequency: number; // in Hz (e.g. 440.0)
  midi: number; // floating point MIDI number
  noteMidi: number; // rounded MIDI number
  noteName: string; // e.g. "A", "C#", "Eb"
  latinName: string; // e.g. "Lá", "Dó#", "Mib"
  octave: number; // e.g. 4
  cents: number; // -50 to +50 cents deviation
  clarity: number; // 0 to 1 confidence/periodicity
  volume: number; // 0 to 1 RMS level
}

export const NOTE_NAMES_EN = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export const NOTE_NAMES_EN_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;
export const NOTE_NAMES_PT = ["Dó", "Dó#", "Ré", "Ré#", "Mi", "Fá", "Fá#", "Sol", "Sol#", "Lá", "Lá#", "Si"] as const;
export const NOTE_NAMES_PT_FLAT = ["Dó", "Réb", "Ré", "Mib", "Mi", "Fá", "Solb", "Sol", "Láb", "Lá", "Sib", "Si"] as const;

/**
 * Standard A4 reference frequency
 */
export const A4_FREQ = 440.0;

/**
 * Convert frequency in Hz to MIDI note number
 */
export function freqToMidi(freq: number, refA4 = A4_FREQ): number {
  return 69 + 12 * Math.log2(freq / refA4);
}

/**
 * Convert MIDI note number to frequency in Hz
 */
export function midiToFreq(midi: number, refA4 = A4_FREQ): number {
  return refA4 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Get note details from MIDI number
 */
export function getNoteDetails(midi: number, useFlats = false) {
  const roundMidi = Math.round(midi);
  const pitchClass = ((roundMidi % 12) + 12) % 12;
  const octave = Math.floor(roundMidi / 12) - 1;
  const cents = Math.round((midi - roundMidi) * 100);

  const noteName = useFlats ? NOTE_NAMES_EN_FLAT[pitchClass] : NOTE_NAMES_EN[pitchClass];
  const latinName = useFlats ? NOTE_NAMES_PT_FLAT[pitchClass] : NOTE_NAMES_PT[pitchClass];

  return {
    roundMidi,
    pitchClass,
    octave,
    cents,
    noteName,
    latinName,
    fullNotationEn: `${noteName}${octave}`,
    fullNotationPt: `${latinName}${octave}`,
  };
}

/**
 * Autocorrelation with Normalized Difference & Parabolic Interpolation
 * Specially tuned for human singing voice (55 Hz to 1400 Hz)
 */
export function detectPitchYIN(
  buffer: ArrayLike<number>,
  sampleRate: number,
  threshold = 0.15,
  minFreq = 60, // B1
  maxFreq = 1300 // E6
): PitchDetectionResult | null {
  const bufferSize = buffer.length;

  // 1. Calculate RMS energy to filter out ambient noise
  let sumSquares = 0;
  for (let i = 0; i < bufferSize; i++) {
    const val = buffer[i];
    sumSquares += val * val;
  }
  const rms = Math.sqrt(sumSquares / bufferSize);

  // If signal is too quiet, no confident pitch can be extracted
  if (rms < 0.008) {
    return null;
  }

  const minPeriod = Math.floor(sampleRate / maxFreq);
  const maxPeriod = Math.ceil(sampleRate / minFreq);
  const halfBufferSize = Math.floor(bufferSize / 2);
  const searchLimit = Math.min(maxPeriod, halfBufferSize);

  // 2. Difference function d(tau)
  const d = new Float32Array(searchLimit + 1);
  d[0] = 0;

  for (let tau = 1; tau <= searchLimit; tau++) {
    let diffSum = 0;
    for (let j = 0; j < halfBufferSize; j++) {
      const diff = buffer[j] - buffer[j + tau];
      diffSum += diff * diff;
    }
    d[tau] = diffSum;
  }

  // 3. Cumulative mean normalized difference d'(tau)
  const dPrime = new Float32Array(searchLimit + 1);
  dPrime[0] = 1;
  let runningSum = 0;

  for (let tau = 1; tau <= searchLimit; tau++) {
    runningSum += d[tau];
    if (runningSum === 0) {
      dPrime[tau] = 1;
    } else {
      dPrime[tau] = (d[tau] * tau) / runningSum;
    }
  }

  // 4. Absolute threshold search
  let tauCandidate = -1;
  for (let tau = minPeriod; tau <= searchLimit; tau++) {
    if (dPrime[tau] < threshold) {
      // Find the local minimum below threshold
      while (tau + 1 <= searchLimit && dPrime[tau + 1] < dPrime[tau]) {
        tau++;
      }
      tauCandidate = tau;
      break;
    }
  }

  // Fallback: Global minimum if no point fell below threshold but clarity is decent
  if (tauCandidate === -1) {
    let minVal = 1.0;
    let bestTau = -1;
    for (let tau = minPeriod; tau <= searchLimit; tau++) {
      if (dPrime[tau] < minVal) {
        minVal = dPrime[tau];
        bestTau = tau;
      }
    }
    if (minVal < 0.35 && bestTau !== -1) {
      tauCandidate = bestTau;
    } else {
      return null;
    }
  }

  // 5. Parabolic interpolation for sub-sample precision
  let betterTau = tauCandidate;
  if (tauCandidate > 1 && tauCandidate < searchLimit) {
    const s0 = dPrime[tauCandidate - 1];
    const s1 = dPrime[tauCandidate];
    const s2 = dPrime[tauCandidate + 1];
    const denom = 2 * (2 * s1 - s0 - s2);
    if (denom !== 0) {
      const delta = (s2 - s0) / denom;
      betterTau = tauCandidate + delta;
    }
  }

  const frequency = sampleRate / betterTau;
  if (frequency < minFreq || frequency > maxFreq || !Number.isFinite(frequency)) {
    return null;
  }

  const clarity = Math.max(0, Math.min(1, 1 - dPrime[tauCandidate]));
  const midi = freqToMidi(frequency);
  const { roundMidi, octave, cents, noteName, latinName } = getNoteDetails(midi);

  return {
    frequency,
    midi,
    noteMidi: roundMidi,
    noteName,
    latinName,
    octave,
    cents,
    clarity,
    volume: Math.min(1, rms * 5),
  };
}

/**
 * Key estimation engine based on note histogram and diatonic weight analysis
 */
export interface KeyMatchSuggestion {
  keyIndex: number; // 0 to 11 in Circle of Fifths FIELDS
  keyName: string; // e.g. "Sol Maior (G)"
  relativeName: string; // e.g. "Mi menor (Em)"
  mode: "major" | "minor";
  score: number; // 0 to 100 percentage match
  matchingNotes: string[];
  totalSungNotes: number;
}

// Major scale intervals: [0, 2, 4, 5, 7, 9, 11]
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
// Natural minor scale intervals: [0, 2, 3, 5, 7, 8, 10]
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

// Circle of Fifths tonic pitch classes (0=C, 1=G, 2=D, 3=A, 4=E, 5=B, 6=F#, 7=Db, 8=Ab, 9=Eb, 10=Bb, 11=F)
const CIRCLE_OF_FIFTHS_PITCHES = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

export function estimateTonalitiesFromNotes(
  noteHistogram: Record<number, number>
): KeyMatchSuggestion[] {
  // Count total notes recorded
  const totalOccurrences = Object.values(noteHistogram).reduce((a, b) => a + b, 0);
  if (totalOccurrences < 3) {
    return [];
  }

  const results: KeyMatchSuggestion[] = [];

  for (let circleIdx = 0; circleIdx < 12; circleIdx++) {
    const rootPitch = CIRCLE_OF_FIFTHS_PITCHES[circleIdx];

    // 1. Major Key evaluation
    const majorScalePitches = new Set(MAJOR_SCALE_INTERVALS.map((int) => (rootPitch + int) % 12));
    let majorScoreSum = 0;
    const majorMatchedNotes: string[] = [];

    // 2. Minor Key evaluation
    const minorScalePitches = new Set(MINOR_SCALE_INTERVALS.map((int) => (rootPitch + int) % 12));
    let minorScoreSum = 0;
    const minorMatchedNotes: string[] = [];

    for (let p = 0; p < 12; p++) {
      const count = noteHistogram[p] || 0;
      if (count > 0) {
        const noteStr = NOTE_NAMES_PT[p];
        if (majorScalePitches.has(p)) {
          // Weight tonic, 3rd, 5th higher
          const isTonic = p === rootPitch;
          const isFifth = p === (rootPitch + 7) % 12;
          const isThird = p === (rootPitch + 4) % 12;
          const weight = isTonic ? 1.5 : isFifth ? 1.3 : isThird ? 1.2 : 1.0;
          majorScoreSum += count * weight;
          if (!majorMatchedNotes.includes(noteStr)) majorMatchedNotes.push(noteStr);
        } else {
          // Penalty for out-of-scale notes
          majorScoreSum -= count * 0.8;
        }

        if (minorScalePitches.has(p)) {
          const isTonic = p === rootPitch;
          const isFifth = p === (rootPitch + 7) % 12;
          const isThird = p === (rootPitch + 3) % 12;
          const weight = isTonic ? 1.5 : isFifth ? 1.3 : isThird ? 1.2 : 1.0;
          minorScoreSum += count * weight;
          if (!minorMatchedNotes.includes(noteStr)) minorMatchedNotes.push(noteStr);
        } else {
          minorScoreSum -= count * 0.8;
        }
      }
    }

    const maxPossibleScore = totalOccurrences * 1.5;
    const normalizedMajorScore = Math.max(0, Math.min(100, Math.round((majorScoreSum / maxPossibleScore) * 100)));
    const normalizedMinorScore = Math.max(0, Math.min(100, Math.round((minorScoreSum / maxPossibleScore) * 100)));

    const rootNamePt = NOTE_NAMES_PT[rootPitch];
    const rootNameEn = NOTE_NAMES_EN[rootPitch];
    const relativeMinorPitch = (rootPitch + 9) % 12;
    const relMinorNamePt = NOTE_NAMES_PT[relativeMinorPitch];
    const relMinorNameEn = NOTE_NAMES_EN[relativeMinorPitch];

    if (normalizedMajorScore > 20) {
      results.push({
        keyIndex: circleIdx,
        keyName: `${rootNamePt} Maior (${rootNameEn})`,
        relativeName: `Relativo: ${relMinorNamePt}m (${relMinorNameEn}m)`,
        mode: "major",
        score: normalizedMajorScore,
        matchingNotes: majorMatchedNotes,
        totalSungNotes: totalOccurrences,
      });
    }

    if (normalizedMinorScore > 20) {
      const relativeMajorPitch = (rootPitch + 3) % 12;
      const relMajorNamePt = NOTE_NAMES_PT[relativeMajorPitch];
      const relMajorNameEn = NOTE_NAMES_EN[relativeMajorPitch];
      results.push({
        keyIndex: circleIdx,
        keyName: `${rootNamePt} Menor (${rootNameEn}m)`,
        relativeName: `Relativo: ${relMajorNamePt} Maior (${relMajorNameEn})`,
        mode: "minor",
        score: normalizedMinorScore,
        matchingNotes: minorMatchedNotes,
        totalSungNotes: totalOccurrences,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

/**
 * Vocal Classification (Tessitura Vocal)
 */
export interface VocalClassification {
  type: string;
  category: string;
  description: string;
  typicalRange: string;
  matchScore: number;
}

export function classifyVocalRange(minMidi: number, maxMidi: number, lang: "pt" | "en" | "es" = "pt"): VocalClassification {
  const noteDetailsMin = getNoteDetails(minMidi);
  const noteDetailsMax = getNoteDetails(maxMidi);
  const minNote = lang === "pt" ? noteDetailsMin.fullNotationPt : noteDetailsMin.fullNotationEn;
  const maxNote = lang === "pt" ? noteDetailsMax.fullNotationPt : noteDetailsMax.fullNotationEn;

  const midMidi = (minMidi + maxMidi) / 2;

  if (midMidi <= 48) {
    return {
      type: lang === "en" ? "Bass" : lang === "es" ? "Bajo" : "Baixo",
      category: lang === "en" ? "Male" : lang === "es" ? "Masculina" : "Masculina",
      description: lang === "en" ? "Very deep, resonant, and full male voice." : lang === "es" ? "Voz masculina muy grave, resonante y con cuerpo." : "Voz masculina muito grave, ressonante e encorpada.",
      typicalRange: lang === "en" ? `Your current range: ${minNote} to ${maxNote}` : lang === "es" ? `Tu rango actual: ${minNote} hasta ${maxNote}` : `Sua faixa atual: ${minNote} até ${maxNote}`,
      matchScore: 92,
    };
  } else if (midMidi <= 55) {
    return {
      type: lang === "en" ? "Baritone" : lang === "es" ? "Barítono" : "Barítono",
      category: lang === "en" ? "Male" : lang === "es" ? "Masculina" : "Masculina",
      description: lang === "en" ? "The most common male voice, balanced between warm mid-range and lows." : lang === "es" ? "La voz masculina más común, equilibrada entre medios y graves terciopelo." : "A voz masculina mais comum, equilibrada entre médios e graves aveludados.",
      typicalRange: lang === "en" ? `Your current range: ${minNote} to ${maxNote}` : lang === "es" ? `Tu rango actual: ${minNote} hasta ${maxNote}` : `Sua faixa atual: ${minNote} até ${maxNote}`,
      matchScore: 95,
    };
  } else if (midMidi <= 63) {
    return {
      type: "Tenor",
      category: lang === "en" ? "Male" : lang === "es" ? "Masculina" : "Masculina",
      description: lang === "en" ? "Bright and powerful male voice in the upper-mid range." : lang === "es" ? "Voz masculina brillante y potente en la región media-aguda." : "Voz masculina brilhante e potente na região média-aguda.",
      typicalRange: lang === "en" ? `Your current range: ${minNote} to ${maxNote}` : lang === "es" ? `Tu rango actual: ${minNote} hasta ${maxNote}` : `Sua faixa atual: ${minNote} até ${maxNote}`,
      matchScore: 94,
    };
  } else if (midMidi <= 69) {
    return {
      type: lang === "en" ? "Alto / Contralto" : "Contralto",
      category: lang === "en" ? "Female / High" : lang === "es" ? "Femenina / Aguda" : "Feminina / Aguda",
      description: lang === "en" ? "The lowest female voice, rich, deep, and velvety." : lang === "es" ? "La voz femenina más grave, con cuerpo, rica y terciopelo." : "A voz feminina mais grave, encorpada, rica e aveludada.",
      typicalRange: lang === "en" ? `Your current range: ${minNote} to ${maxNote}` : lang === "es" ? `Tu rango actual: ${minNote} hasta ${maxNote}` : `Sua faixa atual: ${minNote} até ${maxNote}`,
      matchScore: 93,
    };
  } else if (midMidi <= 76) {
    return {
      type: "Mezzo-Soprano",
      category: lang === "en" ? "Female / High" : lang === "es" ? "Femenina / Aguda" : "Feminina / Aguda",
      description: lang === "en" ? "Medium female voice with agility and warm lyrical timbre." : lang === "es" ? "Voz femenina media con agilidad y timbre lírico cálido." : "Voz feminina média com agilidade e timbre lírico quente.",
      typicalRange: lang === "en" ? `Your current range: ${minNote} to ${maxNote}` : lang === "es" ? `Tu rango actual: ${minNote} hasta ${maxNote}` : `Sua faixa atual: ${minNote} até ${maxNote}`,
      matchScore: 95,
    };
  } else {
    return {
      type: "Soprano",
      category: lang === "en" ? "Female / High" : lang === "es" ? "Femenina / Aguda" : "Feminina / Aguda",
      description: lang === "en" ? "The highest female voice, clear, bright, and penetrating." : lang === "es" ? "La voz femenina más aguda, límpida, brillante y penetrante." : "A voz feminina mais aguda, límpida, brilhante e penetrante.",
      typicalRange: lang === "en" ? `Your current range: ${minNote} to ${maxNote}` : lang === "es" ? `Tu rango actual: ${minNote} hasta ${maxNote}` : `Sua faixa atual: ${minNote} até ${maxNote}`,
      matchScore: 96,
    };
  }
}
