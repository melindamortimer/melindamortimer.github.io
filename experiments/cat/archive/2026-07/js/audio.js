const SOUND_NAMES = new Set([
  'jump',
  'dash',
  'collect',
  'yarn',
  'checkpoint',
  'hurt',
  'land',
  'unlock',
  'complete',
  'click',
]);

/** A tiny, asset-free Web Audio soundscape. */
export class AudioEngine {
  constructor(options = {}) {
    this.muted = typeof options === 'boolean' ? options : Boolean(options.muted);
    this.context = null;
    this.master = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.musicWanted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicNextTime = 0;
    this.musicVoices = new Set();
  }

  /** Must be called from a click, key, or other user gesture. */
  async resume() {
    try {
      if (!this.context) {
        const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AudioContextClass) return false;

        this.context = new AudioContextClass();
        this.master = this.context.createGain();
        this.sfxBus = this.context.createGain();
        this.musicBus = this.context.createGain();

        this.master.gain.value = this.muted ? 0 : 0.72;
        this.sfxBus.gain.value = 1;
        this.musicBus.gain.value = 0.68;
        this.sfxBus.connect(this.master);
        this.musicBus.connect(this.master);
        this.master.connect(this.context.destination);
      }

      if (this.context.state === 'suspended') await this.context.resume();
      if (this.context.state !== 'running') return false;

      if (this.musicWanted) this._beginMusic();
      return true;
    } catch {
      return false;
    }
  }

  setMuted(value) {
    this.muted = Boolean(value);
    if (!this.context || !this.master) return;

    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.72, now, 0.018);
  }

  startMusic() {
    this.musicWanted = true;
    this._beginMusic();
  }

  stopMusic() {
    this.musicWanted = false;
    if (this.musicTimer !== null) {
      globalThis.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }

    const now = this.context?.currentTime ?? 0;
    this.musicVoices.forEach((voice) => {
      try {
        voice.stop(now);
      } catch {
        // It may already have naturally ended.
      }
    });
    this.musicVoices.clear();
  }

  play(name) {
    if (!SOUND_NAMES.has(name)) return false;
    if (!this.context || this.context.state !== 'running' || this.muted) return false;

    try {
      const now = this.context.currentTime + 0.006;

      switch (name) {
        case 'jump':
          this._tone(330, { start: now, endFrequency: 610, duration: 0.13, volume: 0.09 });
          break;
        case 'dash':
          this._noise({ start: now, duration: 0.16, volume: 0.075, frequency: 1150, type: 'bandpass' });
          this._tone(190, { start: now, endFrequency: 90, duration: 0.13, volume: 0.045, type: 'sawtooth' });
          break;
        case 'collect':
          this._pluckSequence([880, 1320], now, 0.055, 0.07);
          break;
        case 'yarn':
          this._pluckSequence([523.25, 659.25, 783.99], now, 0.07, 0.065);
          break;
        case 'checkpoint':
          this._pluckSequence([392, 523.25, 659.25], now, 0.09, 0.09);
          break;
        case 'hurt':
          this._noise({ start: now, duration: 0.17, volume: 0.065, frequency: 520, type: 'lowpass' });
          this._tone(180, { start: now, endFrequency: 72, duration: 0.22, volume: 0.08, type: 'sawtooth' });
          break;
        case 'land':
          this._noise({ start: now, duration: 0.075, volume: 0.04, frequency: 310, type: 'lowpass' });
          this._tone(92, { start: now, endFrequency: 68, duration: 0.08, volume: 0.035, type: 'sine' });
          break;
        case 'unlock':
          this._pluckSequence([440, 554.37, 659.25, 880], now, 0.085, 0.075);
          break;
        case 'complete':
          this._pluckSequence([523.25, 659.25, 783.99, 1046.5], now, 0.11, 0.11);
          this._tone(261.63, { start: now, duration: 0.7, volume: 0.028, type: 'sine' });
          break;
        case 'click':
          this._tone(620, { start: now, endFrequency: 520, duration: 0.035, volume: 0.035, type: 'sine' });
          break;
      }

      return true;
    } catch {
      return false;
    }
  }

  _beginMusic() {
    if (!this.musicWanted || this.musicTimer !== null) return;
    if (!this.context || this.context.state !== 'running') return;

    this.musicStep = 0;
    this.musicNextTime = this.context.currentTime + 0.05;
    this._scheduleMusic();
    this.musicTimer = globalThis.setInterval(() => this._scheduleMusic(), 500);
  }

  _scheduleMusic() {
    if (!this.musicWanted || !this.context || this.context.state !== 'running') return;

    const notes = [220, 329.63, 392, 493.88, 196, 293.66, 369.99, 440];
    const beat = 0.42;
    const horizon = this.context.currentTime + 1.2;

    while (this.musicNextTime < horizon) {
      const frequency = notes[this.musicStep % notes.length];
      this._tone(frequency, {
        start: this.musicNextTime,
        duration: 0.62,
        volume: this.musicStep % 4 === 0 ? 0.028 : 0.021,
        attack: 0.025,
        type: this.musicStep % 2 === 0 ? 'triangle' : 'sine',
        bus: this.musicBus,
        trackAsMusic: true,
      });
      this.musicStep += 1;
      this.musicNextTime += beat;
    }
  }

  _pluckSequence(frequencies, start, spacing, volume) {
    frequencies.forEach((frequency, index) => {
      this._tone(frequency, {
        start: start + index * spacing,
        duration: 0.22,
        volume,
        attack: 0.006,
        type: 'triangle',
      });
    });
  }

  _tone(frequency, options = {}) {
    const context = this.context;
    if (!context) return;

    const {
      start = context.currentTime,
      duration = 0.18,
      endFrequency = frequency,
      volume = 0.06,
      attack = 0.008,
      type = 'triangle',
      bus = this.sfxBus,
      trackAsMusic = false,
    } = options;
    const end = start + duration;
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(1, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), end);
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(5200, Math.max(900, frequency * 5));
    filter.Q.value = 0.5;

    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + Math.min(attack, duration * 0.4));
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(bus);

    if (trackAsMusic) {
      this.musicVoices.add(oscillator);
      oscillator.onended = () => this.musicVoices.delete(oscillator);
    }

    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }

  _noise(options = {}) {
    const context = this.context;
    if (!context) return;

    const {
      start = context.currentTime,
      duration = 0.12,
      volume = 0.05,
      frequency = 900,
      type = 'lowpass',
    } = options;
    const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let last = 0;

    for (let i = 0; i < samples.length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.35 + white * 0.65;
      samples[i] = last;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const end = start + duration;

    source.buffer = buffer;
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = type === 'bandpass' ? 0.8 : 0.4;
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);

    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.sfxBus);
    source.start(start);
    source.stop(end + 0.01);
  }
}
