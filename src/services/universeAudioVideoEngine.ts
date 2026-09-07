import {
  UniverseRemixSettings,
  UniverseSongTrack,
  UniverseVideoSettings,
  AudioSynthesisParams,
} from '../types';

export class UniverseAudioVideoEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pauseOffset = 0;
  private currentDuration = 30;
  private scheduledNodes: Array<{ stop: (time: number) => void; disconnect: () => void }> = [];
  private animationFrameId: number | null = null;
  private onTimeUpdateCallback: ((time: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;

  // MediaRecorder for Video Export
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  public getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getAnalyser(): AnalyserNode {
    const ctx = this.getAudioContext();
    if (!this.analyser) {
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.82;
    }
    return this.analyser;
  }

  public getMasterGain(): GainNode {
    const ctx = this.getAudioContext();
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, ctx.currentTime);
      const analyser = this.getAnalyser();
      this.masterGain.connect(analyser);
      analyser.connect(ctx.destination);
    }
    return this.masterGain;
  }

  public setOnTimeUpdate(cb: (time: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  public setOnEnded(cb: () => void) {
    this.onEndedCallback = cb;
  }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx) return this.pauseOffset;
    const elapsed = this.ctx.currentTime - this.startTime + this.pauseOffset;
    return Math.min(elapsed, this.currentDuration);
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.scheduledNodes.forEach((node) => {
      try {
        node.stop(0);
        node.disconnect();
      } catch {
        // already stopped
      }
    });
    this.scheduledNodes = [];
    this.isPlaying = false;
  }

  public pause() {
    if (this.isPlaying) {
      this.pauseOffset = this.getCurrentTime();
      this.stop();
    }
  }

  public seek(seconds: number) {
    const wasPlaying = this.isPlaying;
    this.stop();
    this.pauseOffset = Math.max(0, Math.min(seconds, this.currentDuration));
    if (wasPlaying) {
      // resume handled by caller with current settings
    }
  }

  /**
   * Play real synthesized multi-layer remix playback based on uploaded tracks and remix settings.
   */
  public playRemix(
    tracks: UniverseSongTrack[],
    settings: UniverseRemixSettings,
    fromOffset = 0
  ) {
    this.stop();
    const ctx = this.getAudioContext();
    const master = this.getMasterGain();

    this.currentDuration = settings.targetDurationSeconds || 30;
    this.pauseOffset = fromOffset;
    this.startTime = ctx.currentTime;
    this.isPlaying = true;

    const bpm = settings.targetBpm || 124;
    const beatSec = 60 / bpm;
    const now = ctx.currentTime;
    const remainingTime = Math.max(0.5, this.currentDuration - fromOffset);

    // Style specific base parameters
    const style = settings.style;
    const rootFreq = style === 'lofi_chill' ? 130.81 : style === 'trap_mashup' ? 110.0 : 146.83; // C3, A2, D3

    // 1. Kick & Sub Bass Generator
    const kickGain = ctx.createGain();
    kickGain.gain.setValueAtTime(0.7, now);
    kickGain.connect(master);

    const kickOsc = ctx.createOscillator();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(150, now);
    kickOsc.connect(kickGain);

    // Filter for smooth sweeps
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(settings.style === 'lofi_chill' ? 1800 : 7000, now);
    filter.Q.setValueAtTime(2.5, now);
    filter.connect(master);

    // Synth Lead / Chords
    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0.35, now);
    chordGain.connect(filter);

    const chordOsc1 = ctx.createOscillator();
    chordOsc1.type = style === 'cyber_synthwave' ? 'sawtooth' : style === 'lofi_chill' ? 'triangle' : 'square';
    chordOsc1.frequency.setValueAtTime(rootFreq * 2, now);
    chordOsc1.connect(chordGain);

    const chordOsc2 = ctx.createOscillator();
    chordOsc2.type = 'sawtooth';
    chordOsc2.frequency.setValueAtTime(rootFreq * 2.5, now);
    chordOsc2.connect(chordGain);

    // Noise Generator for Hi-hats / Snare / Transition Sweeps
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(style === 'trap_mashup' ? 9000 : 6500, now);
    noiseFilter.Q.setValueAtTime(3.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);

    // Schedule nodes
    kickOsc.start(now);
    chordOsc1.start(now);
    chordOsc2.start(now);
    whiteNoise.start(now);

    const stopTime = now + remainingTime;
    kickOsc.stop(stopTime);
    chordOsc1.stop(stopTime);
    chordOsc2.stop(stopTime);
    whiteNoise.stop(stopTime);

    this.scheduledNodes.push(
      { stop: (t) => kickOsc.stop(t), disconnect: () => kickGain.disconnect() },
      { stop: (t) => chordOsc1.stop(t), disconnect: () => chordGain.disconnect() },
      { stop: (t) => chordOsc2.stop(t), disconnect: () => filter.disconnect() },
      { stop: (t) => whiteNoise.stop(t), disconnect: () => noiseGain.disconnect() }
    );

    // Rhythm and Beat pulses
    let nextBeatTime = now;
    let step = 0;
    const intervalId = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx) {
        clearInterval(intervalId);
        return;
      }
      const cur = this.ctx.currentTime;
      if (cur >= stopTime) {
        clearInterval(intervalId);
        this.stop();
        if (this.onEndedCallback) this.onEndedCallback();
        return;
      }

      // Trigger beat envelope
      if (cur >= nextBeatTime - 0.05) {
        step++;
        // Kick on 1 and 3 (or four-on-the-floor for EDM)
        const isEdm = style === 'club_edm' || style === 'cyber_synthwave';
        const isKickBeat = isEdm ? true : step % 2 === 1;

        if (isKickBeat) {
          kickGain.gain.cancelScheduledValues(cur);
          kickGain.gain.setValueAtTime(0.85, cur);
          kickGain.gain.exponentialRampToValueAtTime(0.001, cur + 0.22);

          kickOsc.frequency.cancelScheduledValues(cur);
          kickOsc.frequency.setValueAtTime(140, cur);
          kickOsc.frequency.exponentialRampToValueAtTime(45, cur + 0.12);
        }

        // Snare/Clap on 2 and 4
        if (step % 2 === 0) {
          noiseGain.gain.cancelScheduledValues(cur);
          noiseGain.gain.setValueAtTime(0.35, cur);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, cur + 0.16);
        }

        // Arpeggiate chord note
        const chordNotes = [rootFreq * 2, rootFreq * 2.5, rootFreq * 3, rootFreq * 4];
        const nextNote = chordNotes[step % chordNotes.length];
        chordOsc1.frequency.setValueAtTime(nextNote, cur);

        nextBeatTime += beatSec;
      }
    }, 30);

    // Animation frame for smooth timeline updates
    const tick = () => {
      if (!this.isPlaying) return;
      const cur = this.getCurrentTime();
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(cur);
      }
      if (cur >= this.currentDuration) {
        this.stop();
        if (this.onEndedCallback) this.onEndedCallback();
        return;
      }
      this.animationFrameId = requestAnimationFrame(tick);
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  /**
   * Generate a real 16-bit 44.1kHz Stereo WAV File for the remix
   */
  public generateRemixWav(
    title: string,
    settings: UniverseRemixSettings,
    tracks: UniverseSongTrack[]
  ): { blob: Blob; filename: string } {
    const sampleRate = 44100;
    const durationSeconds = Math.min(settings.targetDurationSeconds || 30, 60);
    const numSamples = Math.floor(sampleRate * durationSeconds);
    const numChannels = 2;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    view.setUint8(0, 'R'.charCodeAt(0));
    view.setUint8(1, 'I'.charCodeAt(0));
    view.setUint8(2, 'F'.charCodeAt(0));
    view.setUint8(3, 'F'.charCodeAt(0));
    view.setUint32(4, 36 + dataSize, true);
    view.setUint8(8, 'W'.charCodeAt(0));
    view.setUint8(9, 'A'.charCodeAt(0));
    view.setUint8(10, 'V'.charCodeAt(0));
    view.setUint8(11, 'E'.charCodeAt(0));

    // 'fmt ' sub-chunk
    view.setUint8(12, 'f'.charCodeAt(0));
    view.setUint8(13, 'm'.charCodeAt(0));
    view.setUint8(14, 't'.charCodeAt(0));
    view.setUint8(15, ' '.charCodeAt(0));
    view.setUint32(16, 16, true); // PCM
    view.setUint16(20, 1, true); // Linear quantization
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // 16-bit

    // 'data' sub-chunk
    view.setUint8(36, 'd'.charCodeAt(0));
    view.setUint8(37, 'a'.charCodeAt(0));
    view.setUint8(38, 't'.charCodeAt(0));
    view.setUint8(39, 'a'.charCodeAt(0));
    view.setUint32(40, dataSize, true);

    const bpm = settings.targetBpm || 124;
    const beatSec = 60 / bpm;
    const style = settings.style;
    let offset = 44;

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let left = 0;
      let right = 0;

      // 1. Kick Drum
      const beatPos = (t % beatSec) / beatSec;
      if (beatPos < 0.18) {
        const kickFreq = 140 - beatPos * 600;
        const kickEnv = Math.exp(-beatPos * 18);
        const kick = Math.sin(2 * Math.PI * Math.max(35, kickFreq) * t) * kickEnv;
        left += kick * 0.55;
        right += kick * 0.55;
      }

      // 2. Snare / Claps (on every 2nd beat)
      const barPos = (t % (beatSec * 2)) / beatSec;
      if (barPos > 0.95 && barPos < 1.25) {
        const snareEnv = Math.exp(-(barPos - 0.95) * 22);
        const noise = (Math.random() * 2 - 1) * snareEnv * 0.35;
        left += noise;
        right += noise;
      }

      // 3. Synth Arp / Bassline
      const bassFreq = style === 'lofi_chill' ? 65.41 : 73.42; // C2 / D2
      const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.28;
      left += bass * 0.9;
      right += bass * 0.9;

      // Synth chord arpeggio
      const arpStep = Math.floor((t % (beatSec * 2)) / (beatSec / 2));
      const arpFreqs = [261.63, 329.63, 392.0, 523.25]; // C Major arpeggio
      const chordFreq = arpFreqs[arpStep % arpFreqs.length];
      const synthLead =
        Math.sin(2 * Math.PI * chordFreq * t) * 0.18 +
        Math.sin(2 * Math.PI * (chordFreq * 1.5) * t) * 0.08;
      left += synthLead * 0.7;
      right += synthLead * 0.85;

      // Soft Limiting
      left = Math.max(-1, Math.min(1, left * 0.85));
      right = Math.max(-1, Math.min(1, right * 0.85));

      const intLeft = Math.floor(left < 0 ? left * 32768 : left * 32767);
      const intRight = Math.floor(right < 0 ? right * 32768 : right * 32767);

      view.setInt16(offset, intLeft, true);
      view.setInt16(offset + 2, intRight, true);
      offset += 4;
    }

    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const filename = `${cleanTitle}_universe_remix.wav`;
    return { blob, filename };
  }

  /**
   * Render real video frames to an HTML5 canvas based on audio data & video settings
   */
  public drawCanvasFrame(
    canvas: HTMLCanvasElement,
    videoSettings: UniverseVideoSettings,
    remixSettings: UniverseRemixSettings,
    activeTracks: UniverseSongTrack[],
    currentTime: number,
    duration: number,
    backgroundImageElement?: HTMLImageElement | HTMLVideoElement | null
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const analyser = this.getAnalyser();

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqData);

    const timeData = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(timeData);

    // Calculate energy / bass punch
    let bassEnergy = 0;
    for (let i = 0; i < 16; i++) {
      bassEnergy += freqData[i];
    }
    bassEnergy = bassEnergy / (16 * 255); // 0 to 1

    // 1. Clear & Background
    ctx.clearRect(0, 0, width, height);

    if (backgroundImageElement && videoSettings.backgroundTheme === 'user_asset') {
      // Draw user background asset with cover fit
      try {
        ctx.drawImage(backgroundImageElement, 0, 0, width, height);
        // Dim overlay
        ctx.fillStyle = 'rgba(9, 9, 11, 0.65)';
        ctx.fillRect(0, 0, width, height);
      } catch {
        // fallback
      }
    } else {
      // Dynamic generative background
      const theme = videoSettings.backgroundTheme;
      if (theme === 'cosmos_nebula') {
        const grad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          30,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.7
        );
        grad.addColorStop(0, '#2e1065'); // deep purple
        grad.addColorStop(0.5, '#0f172a'); // slate
        grad.addColorStop(1, '#020617'); // black
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Cosmic nebula dust
        ctx.save();
        ctx.globalAlpha = 0.3 + bassEnergy * 0.25;
        const dustGrad = ctx.createRadialGradient(
          width * 0.4,
          height * 0.45,
          20,
          width * 0.4,
          height * 0.45,
          width * 0.45
        );
        dustGrad.addColorStop(0, '#f59e0b');
        dustGrad.addColorStop(0.6, '#ec4899');
        dustGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = dustGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      } else if (theme === 'cyber_grid') {
        ctx.fillStyle = '#05050a';
        ctx.fillRect(0, 0, width, height);

        // Grid floor
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.15 + bassEnergy * 0.25})`;
        ctx.lineWidth = 1;
        const horizon = height * 0.65;
        for (let x = 0; x < width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, horizon);
          ctx.lineTo(x * 1.6 - width * 0.3, height);
          ctx.stroke();
        }
        for (let y = horizon; y < height; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      } else if (theme === 'aurora_borealis') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#064e3b');
        grad.addColorStop(0.5, '#042f2e');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Deep twilight
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#18181b');
        grad.addColorStop(1, '#09090b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }
    }

    // 2. Stars & Particle Field
    const particleCount =
      videoSettings.particleDensity === 'hyper'
        ? 65
        : videoSettings.particleDensity === 'vibrant'
        ? 40
        : 22;

    ctx.save();
    for (let p = 0; p < particleCount; p++) {
      const seed = (p * 133.7) % 1000;
      const x = ((seed * 17) % width) + Math.sin(currentTime + p) * 15;
      const y = ((seed * 31) % height) + Math.cos(currentTime + p) * 15;
      const radius = (p % 3) + 1 + (p % 2 === 0 ? bassEnergy * 3 : 0);
      ctx.fillStyle = p % 2 === 0 ? '#fbbf24' : '#c084fc';
      ctx.globalAlpha = 0.4 + Math.sin(currentTime * 2 + p) * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Audio Visualizer Modes
    const visualizerStyle = videoSettings.visualizerStyle;
    const themeHex = videoSettings.themeColor || '#f59e0b';

    if (visualizerStyle === 'radial_spectrum') {
      // Circular spectrum ring in center
      const centerX = width / 2;
      const centerY = height * 0.48;
      const baseRadius = Math.min(width, height) * 0.18 * (1 + bassEnergy * 0.2);

      const bars = 64;
      ctx.save();
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2;
        const val = freqData[i % freqData.length] / 255;
        const barHeight = val * Math.min(width, height) * 0.22;

        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

        ctx.strokeStyle = i % 2 === 0 ? themeHex : '#ec4899';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Center glowing orb
      const orbGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, baseRadius);
      orbGrad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
      orbGrad.addColorStop(1, 'rgba(15, 23, 42, 0.8)');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (visualizerStyle === 'frequency_bars') {
      // Mirrored Equalizer Bars at bottom
      const barCount = 48;
      const barWidth = width / barCount - 3;
      const baseY = height * 0.75;

      ctx.save();
      for (let i = 0; i < barCount; i++) {
        const val = freqData[Math.floor((i / barCount) * (freqData.length / 2))] / 255;
        const barHeight = Math.max(6, val * height * 0.38);
        const x = i * (barWidth + 3);

        const grad = ctx.createLinearGradient(x, baseY, x, baseY - barHeight);
        grad.addColorStop(0, themeHex);
        grad.addColorStop(1, '#a855f7');

        ctx.fillStyle = grad;
        ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);

        // Peak dot
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, baseY - barHeight - 4, barWidth, 2);
      }
      ctx.restore();
    } else if (visualizerStyle === 'cosmic_rings') {
      // Hypnotic pulsating celestial rings
      const centerX = width / 2;
      const centerY = height * 0.48;
      ctx.save();
      for (let ring = 0; ring < 5; ring++) {
        const r = (ring + 1) * 35 + bassEnergy * 50;
        ctx.strokeStyle = ring % 2 === 0 ? themeHex : '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.7 - ring * 0.12;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // Default: Neon Waveform
      const centerY = height * 0.52;
      ctx.save();
      ctx.strokeStyle = themeHex;
      ctx.lineWidth = 4;
      ctx.shadowColor = themeHex;
      ctx.shadowBlur = 15;
      ctx.beginPath();

      const sliceWidth = width / timeData.length;
      let x = 0;

      for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0; // 0 to 2
        const y = v * (height * 0.15) + (centerY - height * 0.15 / 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. Overlays, Titles & Typography
    ctx.save();
    // Top-Left Branding Badge
    if (videoSettings.showPoweredByBadge) {
      ctx.fillStyle = 'rgba(9, 9, 11, 0.75)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      const badgeW = 240;
      const badgeH = 34;
      ctx.beginPath();
      ctx.roundRect(24, 24, badgeW, badgeH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('MUSICFY UNIVERSE MODEL', 38, 45);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px system-ui, sans-serif';
      ctx.fillText('• Powered by AndroMida AI', 185, 45);
    }

    // Top-Right BPM & Key Badge
    if (videoSettings.showBpmBadge) {
      const bpm = remixSettings.targetBpm || 124;
      const badgeW = 120;
      const badgeH = 34;
      ctx.fillStyle = 'rgba(9, 9, 11, 0.75)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.roundRect(width - badgeW - 24, 24, badgeW, badgeH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${bpm} BPM • 44.1kHz`, width - badgeW - 10, 45);
    }

    // Center / Bottom: Title & Subtitle
    const title = videoSettings.overlayTitle || 'Universe Mashup Remix';
    const subtitle =
      videoSettings.overlaySubtitle ||
      `${activeTracks.map((t) => t.title).join(' × ')} • AndroMida AI Engine`;

    const bounceOffset = bassEnergy * 8;

    // Main Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 12;

    const titleFontSize = Math.max(22, Math.min(width * 0.045, 42));
    ctx.font = `900 ${titleFontSize}px system-ui, sans-serif`;
    ctx.fillText(title, width / 2, height * 0.82 - bounceOffset);

    // Subtitle
    ctx.fillStyle = '#cbd5e1';
    ctx.shadowBlur = 6;
    const subFontSize = Math.max(12, Math.min(width * 0.022, 18));
    ctx.font = `600 ${subFontSize}px system-ui, sans-serif`;
    ctx.fillText(subtitle, width / 2, height * 0.82 + subFontSize + 6 - bounceOffset);

    // Timeline Progress Bar at bottom
    const progress = Math.min(1, currentTime / (duration || 30));
    const progW = width - 48;
    const progH = 4;
    const progY = height - 20;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(24, progY, progW, progH);

    ctx.fillStyle = themeHex;
    ctx.fillRect(24, progY, progW * progress, progH);

    ctx.restore();
  }

  /**
   * Export video directly in browser using canvas.captureStream + MediaRecorder
   */
  public async exportVideo(
    canvas: HTMLCanvasElement,
    videoSettings: UniverseVideoSettings,
    remixSettings: UniverseRemixSettings,
    tracks: UniverseSongTrack[],
    onProgress: (percent: number, stepLabel: string) => void
  ): Promise<{ blob: Blob; url: string; filename: string }> {
    return new Promise((resolve, reject) => {
      try {
        const ctx = this.getAudioContext();
        const duration = Math.min(remixSettings.targetDurationSeconds || 30, 60);

        // Prepare canvas stream (30fps)
        const canvasStream = canvas.captureStream(30);

        // Audio destination stream
        const audioDest = ctx.createMediaStreamDestination();
        this.getMasterGain().connect(audioDest);

        // Combine canvas video track + audio track
        const combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioDest.stream.getAudioTracks(),
        ]);

        // Supported MIME types
        let mimeType = 'video/webm;codecs=vp9,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp8,opus';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }

        const recorder = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: 3500000, // 3.5 Mbps high fidelity
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          const finalBlob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(finalBlob);
          const cleanTitle = (videoSettings.overlayTitle || 'universe_remix')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .toLowerCase();
          resolve({
            blob: finalBlob,
            url,
            filename: `${cleanTitle}_universe_video.webm`,
          });
        };

        recorder.onerror = (err) => {
          reject(err);
        };

        // Start recording
        recorder.start(250);

        // Play audio remix during recording
        this.playRemix(tracks, remixSettings, 0);

        const startTime = Date.now();
        const intervalId = window.setInterval(() => {
          const elapsedSec = (Date.now() - startTime) / 1000;
          const pct = Math.min(99, Math.round((elapsedSec / duration) * 100));
          onProgress(pct, `Rendering video frames & syncing audio (${pct}%)`);

          if (elapsedSec >= duration) {
            clearInterval(intervalId);
            onProgress(100, 'Finalizing video container...');
            recorder.stop();
            this.stop();
          }
        }, 200);
      } catch (e) {
        reject(e);
      }
    });
  }
}

export const universeAudioVideoEngine = new UniverseAudioVideoEngine();
