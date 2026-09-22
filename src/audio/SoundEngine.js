// High-fidelity procedural Web Audio sound synthesizer for FPS feedback
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Gunshot with transient attack, sub-bass punch, and metallic chamber resonance
  playGunshot(isSilenced = false) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // 1. Noise transient (gunpowder explosion)
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * (isSilenced ? 0.04 : 0.09)));
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = isSilenced ? 'lowpass' : 'bandpass';
    noiseFilter.frequency.setValueAtTime(isSilenced ? 800 : 1800, t);
    noiseFilter.Q.setValueAtTime(1.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isSilenced ? 0.4 : 0.9, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + (isSilenced ? 0.12 : 0.3));

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noiseSource.start(t);

    // 2. Punch sub-oscillator (low thump)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(190, t);
    subOsc.frequency.exponentialRampToValueAtTime(32, t + 0.12);

    subGain.gain.setValueAtTime(0.8, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(t);
    subOsc.stop(t + 0.2);

    // 3. High snap / chamber crack
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(850, t);
    snapOsc.frequency.exponentialRampToValueAtTime(110, t + 0.05);

    snapGain.gain.setValueAtTime(0.5, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    snapOsc.connect(snapGain);
    snapGain.connect(this.masterGain);
    snapOsc.start(t);
    snapOsc.stop(t + 0.08);
  }

  // Tactical multi-step reload sequence
  playReload() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Step 1: Magazine release / eject click (at 0.1s)
    setTimeout(() => {
      this.playMechanicalClick(1400, 0.04, 0.4);
    }, 80);

    // Step 2: Fresh magazine slap in (at 0.9s)
    setTimeout(() => {
      this.playMechanicalThud(120, 0.08, 0.5);
      this.playMechanicalClick(2100, 0.03, 0.45);
    }, 700);

    // Step 3: Bolt / charging handle release snap (at 1.4s)
    setTimeout(() => {
      this.playMechanicalClick(2800, 0.06, 0.6);
      this.playMechanicalClick(950, 0.09, 0.5);
    }, 1250);
  }

  playMechanicalClick(freq = 1500, duration = 0.04, vol = 0.3) {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + duration);

    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  playMechanicalThud(freq = 110, duration = 0.08, vol = 0.4) {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + duration);

    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  // Dry fire click when ammo is empty
  playDryFire() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    this.playMechanicalClick(2400, 0.025, 0.35);
  }

  // Footstep audio with surface thump and pitch randomization
  playFootstep(isSprinting = false) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const freqVariation = 65 + (Math.random() * 20 - 10);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqVariation, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.06);

    const vol = isSprinting ? 0.35 : 0.22;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    // Subtle noise brush for sole contact
    const bufSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const nFilter = this.ctx.createBiquadFilter();
    nFilter.type = 'lowpass';
    nFilter.frequency.setValueAtTime(600, t);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(vol * 0.5, t);
    nGain.gain.linearRampToValueAtTime(0.001, t + 0.04);

    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(t);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  // Tactical slide whoosh & friction sound
  playSlide() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const duration = 0.65;

    // 1. Friction sweep noise
    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.5);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + duration);
    filter.Q.setValueAtTime(2.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);

    // 2. Low whoosh body movement
    const whoosh = this.ctx.createOscillator();
    const wGain = this.ctx.createGain();
    whoosh.type = 'triangle';
    whoosh.frequency.setValueAtTime(140, t);
    whoosh.frequency.exponentialRampToValueAtTime(45, t + duration * 0.8);

    wGain.gain.setValueAtTime(0.3, t);
    wGain.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.8);

    whoosh.connect(wGain);
    wGain.connect(this.masterGain);
    whoosh.start(t);
    whoosh.stop(t + duration * 0.8);
  }

  // Hitmarker chime (crisp double sine hit confirmation)
  playHitmarker(isHeadshot = false) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    const f1 = isHeadshot ? 2800 : 2200;
    const f2 = isHeadshot ? 3400 : 2600;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(f1, t);
    osc2.frequency.setValueAtTime(f2, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isHeadshot ? 0.12 : 0.06));

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.13);
    osc2.stop(t + 0.13);
  }

  // Elimination / kill confirmation sound
  playElimination() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.setValueAtTime(660, t + 0.06);
    osc.frequency.setValueAtTime(880, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  // SMG fire: High rate, crisp snap, fast metallic bolt
  playSMGFire() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, t);
    filter.Q.setValueAtTime(2.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.08);
    oscGain.gain.setValueAtTime(0.6, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Heavy .50 BMG Sniper: Thunderous low boom, supersonic crack, long reverb tail
  playSniperFire() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Concussion sub-bass
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, t);
    sub.frequency.exponentialRampToValueAtTime(24, t + 0.45);
    subGain.gain.setValueAtTime(1.1, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(t);
    sub.stop(t + 0.6);

    // Supersonic whip crack
    const whip = this.ctx.createOscillator();
    const whipGain = this.ctx.createGain();
    whip.type = 'sawtooth';
    whip.frequency.setValueAtTime(3200, t);
    whip.frequency.exponentialRampToValueAtTime(180, t + 0.09);
    whipGain.gain.setValueAtTime(0.7, t);
    whipGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    whip.connect(whipGain);
    whipGain.connect(this.masterGain);
    whip.start(t);
    whip.stop(t + 0.13);

    // Long echoing explosion noise
    const bufferSize = this.ctx.sampleRate * 0.75;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.22));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.9, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(t);

    // Bolt action cycle sound after 0.5s
    setTimeout(() => {
      this.playMechanicalClick(1800, 0.03, 0.35);
      setTimeout(() => this.playMechanicalClick(2400, 0.04, 0.4), 220);
    }, 450);
  }

  // Shotgun: Multi-pellet blast concussion followed by pump racking
  playShotgunFire() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, t);
    filter.Q.setValueAtTime(1.1, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);

    const bass = this.ctx.createOscillator();
    const bGain = this.ctx.createGain();
    bass.type = 'triangle';
    bass.frequency.setValueAtTime(160, t);
    bass.frequency.exponentialRampToValueAtTime(30, t + 0.22);
    bGain.gain.setValueAtTime(0.9, t);
    bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    bass.connect(bGain);
    bGain.connect(this.masterGain);
    bass.start(t);
    bass.stop(t + 0.26);

    // Pump action rack after 0.3s
    setTimeout(() => {
      this.playMechanicalClick(1500, 0.04, 0.45);
      setTimeout(() => this.playMechanicalClick(2100, 0.04, 0.5), 160);
    }, 280);
  }

  // Pistol fire: snappy 9mm pop
  playPistolFire() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2100, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.75, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);

    const snap = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    snap.type = 'sawtooth';
    snap.frequency.setValueAtTime(700, t);
    snap.frequency.exponentialRampToValueAtTime(90, t + 0.07);
    sGain.gain.setValueAtTime(0.5, t);
    sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    snap.connect(sGain);
    sGain.connect(this.masterGain);
    snap.start(t);
    snap.stop(t + 0.09);
  }

  // Weapon swap / holster draw sound
  playWeaponSwap() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    this.playMechanicalClick(2600, 0.03, 0.35);
    setTimeout(() => this.playMechanicalClick(1800, 0.04, 0.4), 80);
  }

  // Dramatic low-pitch death drone and flatline
  playPlayerDeath() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // 1. Deep sub drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + 1.2);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 1.5);

    // 2. High flatline tone
    const flat = this.ctx.createOscillator();
    const fGain = this.ctx.createGain();
    flat.type = 'sine';
    flat.frequency.setValueAtTime(650, t + 0.1);
    flat.frequency.exponentialRampToValueAtTime(580, t + 1.6);
    fGain.gain.setValueAtTime(0.0, t);
    fGain.gain.setValueAtTime(0.25, t + 0.1);
    fGain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
    flat.connect(fGain);
    fGain.connect(this.masterGain);
    flat.start(t + 0.1);
    flat.stop(t + 1.7);
  }

  // Affirmative cyber bootup chime when respawning
  playRespawn() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    [440, 587.33, 880].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);

      gain.gain.setValueAtTime(0.0, t);
      gain.gain.setValueAtTime(0.3, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.26);
    });

    // Mechanical load click
    setTimeout(() => {
      this.playMechanicalClick(2100, 0.04, 0.45);
    }, 240);
  }
}

export const sounds = new SoundEngine();
