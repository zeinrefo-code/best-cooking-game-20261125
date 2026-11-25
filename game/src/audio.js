// All sound is synthesized with WebAudio: short oscillator blips and a little
// filtered noise for the grill sizzle. No audio files, nothing over the network.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      return null;
    }
    return context;
  }

  function blip(frequency, duration, type, gainValue, when = 0) {
    if (muted) return;
    const audio = ensure();
    if (!audio) return;
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    const start = audio.currentTime + when;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  function noiseBurst(duration, gainValue) {
    if (muted) return;
    const audio = ensure();
    if (!audio) return;
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    const length = Math.floor(audio.sampleRate * duration);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = audio.createBufferSource();
    source.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    const gain = audio.createGain();
    gain.gain.value = gainValue;
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start();
  }

  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    unlock() {
      ensure();
    },
    click() {
      blip(660, 0.07, 'triangle', 0.12);
    },
    chop() {
      noiseBurst(0.08, 0.25);
      blip(180, 0.08, 'square', 0.08);
    },
    sizzle() {
      noiseBurst(0.25, 0.10);
    },
    ding() {
      blip(880, 0.12, 'sine', 0.16);
      blip(1318, 0.18, 'sine', 0.14, 0.09);
    },
    serve() {
      blip(523, 0.1, 'triangle', 0.16);
      blip(659, 0.1, 'triangle', 0.16, 0.08);
      blip(784, 0.22, 'triangle', 0.18, 0.16);
    },
    error() {
      blip(160, 0.16, 'sawtooth', 0.12);
      blip(120, 0.2, 'sawtooth', 0.1, 0.1);
    },
    tick() {
      blip(980, 0.05, 'square', 0.07);
    },
    over() {
      blip(392, 0.18, 'triangle', 0.16);
      blip(330, 0.18, 'triangle', 0.16, 0.16);
      blip(262, 0.4, 'triangle', 0.16, 0.32);
    },
    win() {
      [523, 659, 784, 1047].forEach((frequency, index) => blip(frequency, 0.22, 'triangle', 0.16, index * 0.12));
    },
  };
}
