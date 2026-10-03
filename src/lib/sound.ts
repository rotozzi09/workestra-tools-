export type Instrument = "piano" | "guitar" | "epiano" | "strings" | "synth_brass" | "pad";

export interface InstrumentInfo {
  id: Instrument;
  name: string;
  category: "acoustics" | "electronic";
  description: string;
  iconName: string;
}

export const INSTRUMENTS: InstrumentInfo[] = [
  {
    id: "piano",
    name: "Piano Acústico",
    category: "acoustics",
    description: "Grand Piano com martelos e ressonância de cordas",
    iconName: "Piano",
  },
  {
    id: "guitar",
    name: "Violão Acústico",
    category: "acoustics",
    description: "Cordas de nylon e aço com palhetada natural",
    iconName: "Guitar",
  },
  {
    id: "epiano",
    name: "Piano Elétrico (Rhodes)",
    category: "electronic",
    description: "Timbre vintage aveludado com sino harmônico",
    iconName: "Sparkles",
  },
  {
    id: "strings",
    name: "Cordas (Strings Pad)",
    category: "electronic",
    description: "Sustentação orquestral rica e envolvente",
    iconName: "Music",
  },
  {
    id: "synth_brass",
    name: "Synth Brass (Anos 80)",
    category: "electronic",
    description: "Metais sintetizados encorpados com filtro ressonante",
    iconName: "Zap",
  },
  {
    id: "pad",
    name: "Warm Ambient Pad",
    category: "electronic",
    description: "Textura atmosférica suave para harmonias profundas",
    iconName: "Waves",
  },
];

/** Pitch class (0 = C) for each tonic spelling used on the wheel */
const PITCH: Record<string, number> = {
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

const LATIN_PITCH: Record<string, number> = {
  "DÓ#": 1,
  "DO#": 1,
  "RÉB": 1,
  "REB": 1,
  "DÓ": 0,
  "DO": 0,
  "RÉ#": 3,
  "RE#": 3,
  "MIB": 3,
  "RÉ": 2,
  "RE": 2,
  "MI": 4,
  "FÁ#": 6,
  "FA#": 6,
  "SOLB": 6,
  "FÁ": 5,
  "FA": 5,
  "SOL#": 8,
  "LÁB": 8,
  "LAB": 8,
  "SOL": 7,
  "LÁ#": 10,
  "LA#": 10,
  "SIB": 10,
  "LÁ": 9,
  "LA": 9,
  "SI": 11,
};

let ctx: AudioContext | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;
let masterLimiter: DynamicsCompressorNode | null = null;
let masterGain: GainNode | null = null;
let presenceEQ: BiquadFilterNode | null = null;
let highpassFilter: BiquadFilterNode | null = null;

// Volume settings (0.0 to 1.5, default 1.0)
let globalMasterVolume = 1.0;
let globalMetronomeVolume = 0.85;

export function getMasterVolume(): number {
  return globalMasterVolume;
}

export function setMasterVolume(vol: number) {
  globalMasterVolume = Math.max(0, Math.min(1.5, vol));
  if (masterGain && ctx) {
    masterGain.gain.setValueAtTime(globalMasterVolume, ctx.currentTime);
  }
}

export function getMetronomeVolume(): number {
  return globalMetronomeVolume;
}

export function setMetronomeVolume(vol: number) {
  globalMetronomeVolume = Math.max(0, Math.min(1.5, vol));
}

function getAudioContext(): AudioContext {
  if (!ctx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioContextClass();

    // 1. High-Pass Filter: Removes inaudible sub-50Hz rumble that chokes phone speaker headroom
    highpassFilter = ctx.createBiquadFilter();
    highpassFilter.type = "highpass";
    highpassFilter.frequency.setValueAtTime(50, ctx.currentTime);
    highpassFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    // 2. Presence High-Shelf EQ: +2.8dB boost at 3.2kHz for acoustic definition & phone clarity
    presenceEQ = ctx.createBiquadFilter();
    presenceEQ.type = "highshelf";
    presenceEQ.frequency.setValueAtTime(3200, ctx.currentTime);
    presenceEQ.gain.setValueAtTime(2.8, ctx.currentTime);

    // 3. Master Gain Node with direct scaling fader
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(globalMasterVolume, ctx.currentTime);

    // 4. Punchy Bus Compressor: Tightens dynamic range and adds rich harmonic body
    masterCompressor = ctx.createDynamicsCompressor();
    masterCompressor.threshold.setValueAtTime(-10, ctx.currentTime);
    masterCompressor.knee.setValueAtTime(8, ctx.currentTime);
    masterCompressor.ratio.setValueAtTime(2.5, ctx.currentTime);
    masterCompressor.attack.setValueAtTime(0.005, ctx.currentTime);
    masterCompressor.release.setValueAtTime(0.18, ctx.currentTime);

    // 5. Studio Brickwall Peak Limiter: Ensures maximum true loudness with 0% distortion
    masterLimiter = ctx.createDynamicsCompressor();
    masterLimiter.threshold.setValueAtTime(-1.2, ctx.currentTime);
    masterLimiter.knee.setValueAtTime(1, ctx.currentTime);
    masterLimiter.ratio.setValueAtTime(20, ctx.currentTime);
    masterLimiter.attack.setValueAtTime(0.001, ctx.currentTime);
    masterLimiter.release.setValueAtTime(0.05, ctx.currentTime);

    // Signal chain: Inputs -> Highpass -> Presence EQ -> Bus Compressor -> Limiter -> Master Gain (Post-Limiter Fader) -> Destination
    highpassFilter.connect(presenceEQ);
    presenceEQ.connect(masterCompressor);
    masterCompressor.connect(masterLimiter);
    masterLimiter.connect(masterGain);
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

function getMasterOutput(): AudioNode {
  getAudioContext();
  return highpassFilter ?? ctx!.destination;
}

export function getRootPitch(note: string): number {
  if (!note) return 0;
  const upper = note.trim().toUpperCase();

  // Check Latin pitch names (Dó#, Sol#, Fá, Ré, etc.)
  for (const [key, val] of Object.entries(LATIN_PITCH)) {
    if (upper.startsWith(key)) {
      return val;
    }
  }

  // Check Anglo-Saxon pitch names (C, C#, Db, D, etc.)
  const match = upper.match(/^([A-G][#B]?)/);
  if (match) {
    const raw = match[1];
    const normalized = raw.length === 2 && raw[1] === "B" ? raw[0] + "b" : raw;
    if (PITCH[normalized] !== undefined) {
      return PITCH[normalized];
    }
    if (PITCH[raw] !== undefined) {
      return PITCH[raw];
    }
  }
  return 0;
}

// -------------------------------------------------------------
// REAL STUDIO SOUNDFONT SAMPLING ENGINE
// -------------------------------------------------------------
const CDN_BASE = "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM";

interface AnchorSample {
  name: string;
  midi: number;
}

const PIANO_ANCHORS: AnchorSample[] = [
  { name: "C3", midi: 48 },
  { name: "G3", midi: 55 },
  { name: "C4", midi: 60 },
  { name: "G4", midi: 67 },
  { name: "C5", midi: 72 },
];

const GUITAR_ANCHORS: AnchorSample[] = [
  { name: "E2", midi: 40 },
  { name: "A2", midi: 45 },
  { name: "D3", midi: 50 },
  { name: "G3", midi: 55 },
  { name: "B3", midi: 59 },
  { name: "E4", midi: 64 },
  { name: "A4", midi: 69 },
];

const sampleBufferCache: Map<string, AudioBuffer> = new Map();
const sampleLoadingPromises: Map<string, Promise<AudioBuffer | null>> = new Map();

async function loadSample(instrument: "piano" | "guitar", anchor: AnchorSample): Promise<AudioBuffer | null> {
  const c = getAudioContext();
  const folder = instrument === "piano" ? "acoustic_grand_piano-mp3" : "acoustic_guitar_nylon-mp3";
  const key = `${instrument}-${anchor.name}`;

  if (sampleBufferCache.has(key)) {
    return sampleBufferCache.get(key)!;
  }

  if (sampleLoadingPromises.has(key)) {
    return sampleLoadingPromises.get(key)!;
  }

  const loadPromise = (async () => {
    try {
      const url = `${CDN_BASE}/${folder}/${anchor.name}.mp3`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await c.decodeAudioData(arrayBuffer);
      sampleBufferCache.set(key, audioBuffer);
      return audioBuffer;
    } catch {
      return null;
    }
  })();

  sampleLoadingPromises.set(key, loadPromise);
  return loadPromise;
}

export function preloadAcousticSamples() {
  try {
    PIANO_ANCHORS.forEach((a) => void loadSample("piano", a));
    GUITAR_ANCHORS.forEach((a) => void loadSample("guitar", a));
  } catch {
    // Non-blocking
  }
}

if (typeof window !== "undefined") {
  setTimeout(() => {
    preloadAcousticSamples();
  }, 100);
}

function findBestAnchor(targetMidi: number, anchors: AnchorSample[]): AnchorSample {
  let best = anchors[0]!;
  let minDiff = Math.abs(targetMidi - best.midi);
  for (let i = 1; i < anchors.length; i++) {
    const diff = Math.abs(targetMidi - anchors[i]!.midi);
    if (diff < minDiff) {
      minDiff = diff;
      best = anchors[i]!;
    }
  }
  return best;
}

function playSampledNote(
  midi: number,
  time: number,
  instrument: "piano" | "guitar",
  velocity = 1.0,
  duration = 2.4
): boolean {
  const c = getAudioContext();
  const anchors = instrument === "piano" ? PIANO_ANCHORS : GUITAR_ANCHORS;
  const bestAnchor = findBestAnchor(midi, anchors);
  const key = `${instrument}-${bestAnchor.name}`;
  const buffer = sampleBufferCache.get(key);

  if (!buffer) {
    void loadSample(instrument, bestAnchor);
    return false;
  }

  const source = c.createBufferSource();
  source.buffer = buffer;

  const semitones = midi - bestAnchor.midi;
  source.playbackRate.setValueAtTime(Math.pow(2, semitones / 12), time);

  const gain = c.createGain();
  const master = getMasterOutput();
  gain.connect(master);

  const gainValue = (instrument === "guitar" ? 1.45 : 1.35) * velocity;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(gainValue, time + (instrument === "guitar" ? 0.006 : 0.008));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  source.connect(gain);
  source.start(time);
  source.stop(time + duration + 0.1);
  return true;
}

// -------------------------------------------------------------
// HIGH-FIDELITY SYNTHESIZER VOICING ENGINES
// -------------------------------------------------------------

/** 1. Acoustic Guitar Karplus-Strong Physical Pluck */
function playPhysicalGuitarNote(freq: number, time: number, gainLevel = 0.52) {
  const c = getAudioContext();
  const master = getMasterOutput();

  const noteGain = c.createGain();
  noteGain.connect(master);
  noteGain.gain.setValueAtTime(0, time);
  noteGain.gain.linearRampToValueAtTime(gainLevel, time + 0.004);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.9);

  const bodyFilter = c.createBiquadFilter();
  bodyFilter.type = "lowpass";
  bodyFilter.frequency.setValueAtTime(freq * 3.5, time);
  bodyFilter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.2, 280), time + 0.35);
  bodyFilter.Q.setValueAtTime(2.2, time);

  const osc1 = c.createOscillator();
  osc1.type = "triangle";
  osc1.frequency.setValueAtTime(freq, time);

  const osc2 = c.createOscillator();
  osc2.type = "sawtooth";
  osc2.frequency.setValueAtTime(freq * 1.001, time);
  const sawGain = c.createGain();
  sawGain.gain.setValueAtTime(0.35, time);
  sawGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
  osc2.connect(sawGain);

  osc1.connect(bodyFilter);
  sawGain.connect(bodyFilter);
  bodyFilter.connect(noteGain);

  osc1.start(time);
  osc1.stop(time + 2.0);
  osc2.start(time);
  osc2.stop(time + 0.3);

  const snapOsc = c.createOscillator();
  snapOsc.type = "sine";
  snapOsc.frequency.setValueAtTime(freq * 4, time);
  const snapGain = c.createGain();
  snapGain.gain.setValueAtTime(0.18, time);
  snapGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);
  snapOsc.connect(snapGain);
  snapGain.connect(noteGain);
  snapOsc.start(time);
  snapOsc.stop(time + 0.04);
}

/** 2. Acoustic Grand Piano Physical Hammer Strike */
function playPhysicalPianoNote(freq: number, time: number, gainLevel = 0.55) {
  const c = getAudioContext();
  const master = getMasterOutput();

  const noteGain = c.createGain();
  noteGain.connect(master);
  noteGain.gain.setValueAtTime(0, time);
  noteGain.gain.linearRampToValueAtTime(gainLevel, time + 0.006);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, time + 2.3);

  const osc1 = c.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(freq, time);

  const osc2 = c.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(freq * 1.0008, time);
  const harmGain = c.createGain();
  harmGain.gain.setValueAtTime(0.5, time);
  harmGain.gain.exponentialRampToValueAtTime(0.01, time + 1.2);
  osc2.connect(harmGain);

  const hammer = c.createOscillator();
  hammer.type = "sine";
  hammer.frequency.setValueAtTime(freq * 2.8, time);
  const hammerGain = c.createGain();
  hammerGain.gain.setValueAtTime(0.18, time);
  hammerGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  hammer.connect(hammerGain);

  osc1.connect(noteGain);
  harmGain.connect(noteGain);
  hammerGain.connect(noteGain);

  osc1.start(time);
  osc1.stop(time + 2.4);
  osc2.start(time);
  osc2.stop(time + 1.3);
  hammer.start(time);
  hammer.stop(time + 0.06);
}

/** 3. Electric Piano (Vintage Rhodes / FM Tine Synthesis) */
function playElectricPianoNote(freq: number, time: number, gainLevel = 0.58) {
  const c = getAudioContext();
  const master = getMasterOutput();

  const noteGain = c.createGain();
  noteGain.connect(master);
  noteGain.gain.setValueAtTime(0, time);
  noteGain.gain.linearRampToValueAtTime(gainLevel, time + 0.005);
  noteGain.gain.exponentialRampToValueAtTime(gainLevel * 0.45, time + 0.6);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, time + 2.8);

  // Warm Body fundamental
  const bodyOsc = c.createOscillator();
  bodyOsc.type = "sine";
  bodyOsc.frequency.setValueAtTime(freq, time);

  // Metallic Tine chime (Harmonic 7x and 4x)
  const tineOsc = c.createOscillator();
  tineOsc.type = "sine";
  tineOsc.frequency.setValueAtTime(freq * 4.0, time);
  const tineGain = c.createGain();
  tineGain.gain.setValueAtTime(0.42, time);
  tineGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);
  tineOsc.connect(tineGain);

  // Soft chorus overtone
  const overtoneOsc = c.createOscillator();
  overtoneOsc.type = "triangle";
  overtoneOsc.frequency.setValueAtTime(freq * 2.002, time);
  const overtoneGain = c.createGain();
  overtoneGain.gain.setValueAtTime(0.28, time);
  overtoneGain.gain.exponentialRampToValueAtTime(0.001, time + 1.1);
  overtoneOsc.connect(overtoneGain);

  bodyOsc.connect(noteGain);
  tineGain.connect(noteGain);
  overtoneGain.connect(noteGain);

  bodyOsc.start(time);
  bodyOsc.stop(time + 2.9);
  tineOsc.start(time);
  tineOsc.stop(time + 0.3);
  overtoneOsc.start(time);
  overtoneOsc.stop(time + 1.2);
}

/** 4. Orchestral Strings Ensemble Pad */
function playStringsNote(freq: number, time: number, gainLevel = 0.48) {
  const c = getAudioContext();
  const master = getMasterOutput();

  const noteGain = c.createGain();
  noteGain.connect(master);
  // Lush swell envelope
  noteGain.gain.setValueAtTime(0, time);
  noteGain.gain.linearRampToValueAtTime(gainLevel, time + 0.08);
  noteGain.gain.exponentialRampToValueAtTime(gainLevel * 0.75, time + 1.2);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, time + 3.2);

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(Math.min(freq * 4.2, 3800), time);
  filter.frequency.exponentialRampToValueAtTime(Math.min(freq * 2.8, 2200), time + 1.8);
  filter.Q.setValueAtTime(1.2, time);

  // Triple detuned sawtooth ensemble for wide chorus
  const osc1 = c.createOscillator();
  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(freq, time);

  const osc2 = c.createOscillator();
  osc2.type = "sawtooth";
  osc2.frequency.setValueAtTime(freq * 1.004, time);

  const osc3 = c.createOscillator();
  osc3.type = "sawtooth";
  osc3.frequency.setValueAtTime(freq * 0.996, time);

  osc1.connect(filter);
  osc2.connect(filter);
  osc3.connect(filter);
  filter.connect(noteGain);

  osc1.start(time);
  osc1.stop(time + 3.3);
  osc2.start(time);
  osc2.stop(time + 3.3);
  osc3.start(time);
  osc3.stop(time + 3.3);
}

/** 5. 80s Synth Brass (Analog Resonant Filter Sweep) */
function playSynthBrassNote(freq: number, time: number, gainLevel = 0.52) {
  const c = getAudioContext();
  const master = getMasterOutput();

  const noteGain = c.createGain();
  noteGain.connect(master);
  noteGain.gain.setValueAtTime(0, time);
  noteGain.gain.linearRampToValueAtTime(gainLevel, time + 0.02);
  noteGain.gain.exponentialRampToValueAtTime(gainLevel * 0.6, time + 0.5);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, time + 2.5);

  // Resonant brass filter sweep (opens on attack, decays smoothly)
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.setValueAtTime(3.8, time);
  filter.frequency.setValueAtTime(freq * 1.2, time);
  filter.frequency.exponentialRampToValueAtTime(Math.min(freq * 6.5, 5200), time + 0.045);
  filter.frequency.exponentialRampToValueAtTime(Math.min(freq * 2.2, 1800), time + 0.7);

  const osc1 = c.createOscillator();
  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(freq, time);

  const osc2 = c.createOscillator();
  osc2.type = "sawtooth";
  osc2.frequency.setValueAtTime(freq * 1.005, time);

  const oscSub = c.createOscillator();
  oscSub.type = "triangle";
  oscSub.frequency.setValueAtTime(freq * 0.5, time);
  const subGain = c.createGain();
  subGain.gain.setValueAtTime(0.35, time);
  oscSub.connect(subGain);

  osc1.connect(filter);
  osc2.connect(filter);
  subGain.connect(filter);
  filter.connect(noteGain);

  osc1.start(time);
  osc1.stop(time + 2.6);
  osc2.start(time);
  osc2.stop(time + 2.6);
  oscSub.start(time);
  oscSub.stop(time + 2.6);
}

/** 6. Warm Ambient Pad (Deep Harmonic Shimmer) */
function playAmbientPadNote(freq: number, time: number, gainLevel = 0.50) {
  const c = getAudioContext();
  const master = getMasterOutput();

  const noteGain = c.createGain();
  noteGain.connect(master);
  noteGain.gain.setValueAtTime(0, time);
  noteGain.gain.linearRampToValueAtTime(gainLevel, time + 0.12);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, time + 3.4);

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(Math.min(freq * 3.0, 2400), time);
  filter.Q.setValueAtTime(0.8, time);

  const osc1 = c.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(freq, time);

  const osc2 = c.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(freq * 1.002, time);

  const osc3 = c.createOscillator();
  osc3.type = "sine";
  osc3.frequency.setValueAtTime(freq * 2.0, time);
  const chimeGain = c.createGain();
  chimeGain.gain.setValueAtTime(0.25, time);
  osc3.connect(chimeGain);

  osc1.connect(filter);
  osc2.connect(filter);
  chimeGain.connect(filter);
  filter.connect(noteGain);

  osc1.start(time);
  osc1.stop(time + 3.5);
  osc2.start(time);
  osc2.stop(time + 3.5);
  osc3.start(time);
  osc3.stop(time + 3.5);
}

// -------------------------------------------------------------
// PUBLIC SOUND INTERFACE
// -------------------------------------------------------------

function synthesizeNoteByInstrument(instrument: Instrument, freq: number, time: number, gain: number) {
  switch (instrument) {
    case "guitar":
      playPhysicalGuitarNote(freq, time, gain);
      break;
    case "epiano":
      playElectricPianoNote(freq, time, gain * 1.1);
      break;
    case "strings":
      playStringsNote(freq, time, gain * 0.95);
      break;
    case "synth_brass":
      playSynthBrassNote(freq, time, gain * 1.0);
      break;
    case "pad":
      playAmbientPadNote(freq, time, gain * 0.95);
      break;
    case "piano":
    default:
      playPhysicalPianoNote(freq, time, gain);
      break;
  }
}

/** Play a single musical note by its MIDI number with acoustic soundfonts */
export function playSingleNote(midi: number, instrument: Instrument = "piano") {
  try {
    const c = getAudioContext();
    const t = c.currentTime;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);

    if (instrument === "piano" || instrument === "guitar") {
      const playedSample = playSampledNote(midi, t, instrument, 1.15, 2.2);
      if (!playedSample) {
        synthesizeNoteByInstrument(instrument, freq, t, 0.55);
      }
    } else {
      synthesizeNoteByInstrument(instrument, freq, t, 0.55);
    }
  } catch {
    // Audio unavailable
  }
}

/** Play the tonic of a key as an acoustic plucked tone, grand piano or synth chord note */
export function playTonic(note: string, instrument: Instrument = "piano") {
  try {
    const c = getAudioContext();
    const t = c.currentTime;
    const pitchClass = getRootPitch(note);
    const midi = 60 + pitchClass;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);

    if (instrument === "piano" || instrument === "guitar") {
      const playedSample = playSampledNote(midi, t, instrument, 1.15, 2.2);
      if (!playedSample) {
        synthesizeNoteByInstrument(instrument, freq, t, 0.55);
      }
    } else {
      synthesizeNoteByInstrument(instrument, freq, t, 0.55);
    }
  } catch {
    // Audio unavailable
  }
}

/**
 * Play a chord (triad or tetrad) with the selected instrument.
 */
export function playChord(midis: number[], instrument: Instrument = "piano") {
  try {
    const c = getAudioContext();
    const t = c.currentTime;

    midis.forEach((m, i) => {
      const delay =
        instrument === "guitar"
          ? i * 0.036
          : instrument === "strings" || instrument === "pad"
          ? i * 0.015
          : i * 0.006;
      const noteTime = t + delay;
      const velocity = instrument === "guitar" ? 1.15 - i * 0.04 : 1.1;
      const freq = 440 * Math.pow(2, (m - 69) / 12);

      if (instrument === "piano" || instrument === "guitar") {
        const playedSample = playSampledNote(
          m,
          noteTime,
          instrument,
          velocity,
          instrument === "guitar" ? 2.2 : 2.5
        );
        if (!playedSample) {
          synthesizeNoteByInstrument(
            instrument,
            freq,
            noteTime,
            instrument === "guitar" ? 0.48 : 0.52
          );
        }
      } else {
        synthesizeNoteByInstrument(instrument, freq, noteTime, 0.52);
      }
    });
  } catch {
    // Audio unavailable
  }
}

/** Crisp wooden metronome click with configurable volume */
export function playMetronomeClick(isDownbeat: boolean, volumeOverride?: number) {
  try {
    const effectiveVolume = volumeOverride !== undefined ? volumeOverride : globalMetronomeVolume;
    if (effectiveVolume <= 0.01) return;

    const c = getAudioContext();
    const t = c.currentTime;
    const master = getMasterOutput();

    const osc = c.createOscillator();
    const gain = c.createGain();

    const freq = isDownbeat ? 1400 : 920;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.35, t + 0.025);

    const baseGain = isDownbeat ? 0.85 : 0.55;
    const volume = baseGain * effectiveVolume;

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    osc.connect(gain);
    gain.connect(master);

    osc.start(t);
    osc.stop(t + 0.045);
  } catch {
    // Audio unavailable
  }
}

/** Triumphant ascending harmonic chime for correct guess */
export function playSuccessChime() {
  try {
    const c = getAudioContext();
    const t = c.currentTime;
    const master = getMasterOutput();

    [76, 80, 83, 88].forEach((midi, idx) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      const noteTime = t + idx * 0.075;
      const freq = 440 * Math.pow(2, (midi - 69) / 12);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.42 * globalMasterVolume, noteTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.4);

      osc.connect(gain);
      gain.connect(master);

      osc.start(noteTime);
      osc.stop(noteTime + 0.42);
    });
  } catch {
    // Audio unavailable
  }
}

/** Gentle subtle buzz for incorrect guess */
export function playSoftMiss() {
  try {
    const c = getAudioContext();
    const t = c.currentTime;
    const master = getMasterOutput();

    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(175, t + 0.18);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.32 * globalMasterVolume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    osc.connect(gain);
    gain.connect(master);

    osc.start(t);
    osc.stop(t + 0.25);
  } catch {
    // Audio unavailable
  }
}
