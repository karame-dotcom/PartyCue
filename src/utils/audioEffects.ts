// Web Audio API party sound effects generator - zero external MP3s needed!

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/** Call from a user click/tap to allow sound effects and the judge voice for this session. */
export function unlockAudio() {
  try {
    getAudioContext();
  } catch {}
  try {
    const synth = window.speechSynthesis;
    if (synth) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      synth.speak(u);
    }
  } catch {}
}

/** Loud countdown beep. Use final=true for the higher, longer "go" beep. */
export function playBeep(final = false) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const length = final ? 0.7 : 0.28;
    const freq = final ? 1568 : 1046.5; // G6 for "go", C6 for each count

    // Compressor lets us push the level up without harsh clipping
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-10, now);
    comp.ratio.setValueAtTime(4, now);
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(1.0, now + 0.008);
    master.gain.setValueAtTime(1.0, now + length * 0.6);
    master.gain.exponentialRampToValueAtTime(0.0001, now + length);
    master.connect(comp);
    comp.connect(ctx.destination);

    // Square wave for punch + sine an octave down for body
    const layers: Array<[OscillatorType, number, number]> = [
      ['square', freq, 0.35],
      ['sine', freq / 2, 0.8],
      ['triangle', freq, 0.5],
    ];
    layers.forEach(([type, f, level]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, now);
      g.gain.setValueAtTime(level, now);
      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + length + 0.02);
    });
  } catch (err) {
    console.warn('Beep error:', err);
  }
}

export function playAirhorn() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const playBurst = (startTime: number) => {
      // Classic DJ airhorn uses dual frequencies around 466Hz (Bb4) and 622Hz (Eb5)
      const freqs = [466.16, 622.25, 932.33];
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.96, startTime + 0.35);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    };

    // Staccato airhorn triplet pattern
    playBurst(now);
    playBurst(now + 0.18);
    playBurst(now + 0.42);
    playBurst(now + 0.65);
  } catch (err) {
    console.warn('Audio effect error:', err);
  }
}

export function playApplause() {
  try {
    const ctx = getAudioContext();
    const duration = 2.5;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to simulate cheering crowd applause
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  } catch (err) {
    console.warn('Applause effect error:', err);
  }
}

export function playFanfare() {
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.65);
    });
  } catch (err) {
    console.warn('Fanfare error:', err);
  }
}
