import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  ArrowRight,
  Disc,
  Music2,
  Mic,
  Radio,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TranslationDict } from '../i18n/translations';
import { audioEngine } from '../services/audioEngine';
import { DEFAULT_ENGLISH_SEED_VERSION } from '../services/authService';

interface LandingPageProps {
  t: TranslationDict;
  onGetStarted: () => void;
  onLogIn: () => void;
  onSelectSampleSong: () => void;
  onOpenPricing: () => void;
  onOpenGenerator?: () => void;
  onOpenStudio?: () => void;
  onOpenCloner?: () => void;
  onOpenUniverseModel?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  t,
  onGetStarted,
  onLogIn,
  onOpenPricing,
  onOpenGenerator,
  onOpenStudio,
  onOpenCloner,
  onOpenUniverseModel,
}) => {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const previewDuration = 28;
  const lyrics = DEFAULT_ENGLISH_SEED_VERSION.lyricsLines;

  useEffect(() => {
    audioEngine.setOnTimeUpdate((time) => {
      setPreviewCurrentTime(time);
      if (time >= previewDuration && isPlayingPreview) {
        setIsPlayingPreview(false);
      }
    });

    return () => {
      audioEngine.stop();
      audioEngine.setOnTimeUpdate(() => {});
    };
  }, [isPlayingPreview]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const numBars = 64;
      const barWidth = width / numBars;
      const progress = previewCurrentTime / previewDuration;
      const playedBars = Math.floor(progress * numBars);

      const analyser = audioEngine.getAnalyser();
      const freqData = new Uint8Array(numBars);
      if (analyser && isPlayingPreview) {
        analyser.getByteFrequencyData(freqData);
      }

      for (let i = 0; i < numBars; i++) {
        const baseFactor = Math.sin((i / numBars) * Math.PI) * 0.45 + 0.35;
        const dynamicBoost = isPlayingPreview && freqData[i] ? (freqData[i] / 255) * 0.35 : 0;
        const barHeight = Math.max(6, (baseFactor + dynamicBoost) * (height * 0.78));

        const x = i * barWidth;
        const y = (height - barHeight) / 2;

        // Vibrant multicolor gradient bars (orange, pink, magenta, violet)
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (i <= playedBars) {
          gradient.addColorStop(0, '#f97316'); // orange
          gradient.addColorStop(0.5, '#ec4899'); // pink/magenta
          gradient.addColorStop(1, '#8b5cf6'); // violet
        } else {
          gradient.addColorStop(0, '#272933');
          gradient.addColorStop(1, '#1e2029');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x + 1, y, Math.max(2, barWidth - 3), barHeight, 3);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [previewCurrentTime, isPlayingPreview]);

  const handleTogglePlay = () => {
    if (isPlayingPreview) {
      audioEngine.pause();
      setIsPlayingPreview(false);
    } else {
      audioEngine.playSongVersion(DEFAULT_ENGLISH_SEED_VERSION, previewCurrentTime);
      setIsPlayingPreview(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setPreviewCurrentTime(time);
    audioEngine.seek(time);
    if (isPlayingPreview) {
      audioEngine.playSongVersion(DEFAULT_ENGLISH_SEED_VERSION, time);
    }
  };

  const currentLyric = lyrics.find(
    (l) => previewCurrentTime >= l.startTime && previewCurrentTime <= l.endTime
  ) || lyrics[0];

  return (
    <div className="min-h-screen bg-[#0d0e12] text-[#f4f4f5] flex flex-col font-sans selection:bg-pink-500 selection:text-white relative overflow-hidden">
      {/* Background Ambient Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-orange-600/15 via-pink-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-gradient-to-bl from-purple-600/15 via-magenta-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Public Header */}
      <header className="sticky top-0 z-30 bg-[#0d0e12]/85 backdrop-blur-md border-b border-[#20222e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-pink-500 to-violet-600 p-0.5 shadow-md shadow-orange-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0d0e12] rounded-[10px] flex items-center justify-center text-pink-400">
                <Disc className="w-4 h-4 text-pink-400 animate-spin-slow" />
              </div>
            </div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Musicfy AI
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 font-medium">
              5 free creations
            </span>
            <button
              type="button"
              onClick={onLogIn}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white hover:opacity-95 transition-all shadow-md shadow-pink-500/20 cursor-pointer"
            >
              Start creating
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section: Striking Hero & Studio Preview */}
      <section className="pt-16 pb-20 px-4 sm:px-8 border-b border-[#20222e] relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Striking Headline & Action */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
              Your voice.{' '}
              <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                Your next song.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-xl font-normal">
              Create songs, record your voice, and remix your music in one unified studio.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onGetStarted}
                className="px-7 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white hover:opacity-95 transition-all shadow-lg shadow-pink-500/25 flex items-center gap-2.5 cursor-pointer"
              >
                <span>Start creating</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  document.getElementById('tools-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-7 py-3.5 rounded-2xl text-sm font-semibold bg-[#181922] hover:bg-[#20222f] text-zinc-200 border border-[#2b2d3e] transition-colors cursor-pointer"
              >
                Explore the studio
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              5 free creations included • No credit card required
            </p>
          </div>

          {/* Right: Expressive Studio Preview with Multicolor Audio Tracks & Waveform */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl bg-[#15161d] border border-[#262838] p-6 sm:p-7 shadow-2xl shadow-purple-950/20 space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-pink-500/10 via-violet-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-[#222432] pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                    <Music2 className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white tracking-wide">Echoes in the Starlight</div>
                    <div className="text-xs text-zinc-400 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Studio Master • 88 BPM • Acoustic Pop</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 hover:opacity-95 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md shadow-pink-500/20 cursor-pointer"
                >
                  {isPlayingPreview ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Listen</span>
                    </>
                  )}
                </button>
              </div>

              {/* Multicolor Audio Tracks & Waveform */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span className="text-pink-400 font-semibold">Multi-track Stems Active</span>
                  <span>{Math.floor(previewCurrentTime)}s / {previewDuration}s</span>
                </div>

                <canvas
                  ref={canvasRef}
                  width={700}
                  height={80}
                  className="w-full h-20 rounded-2xl bg-[#0f1015] border border-[#222432] cursor-pointer"
                  onClick={handleTogglePlay}
                />

                <input
                  type="range"
                  min="0"
                  max={previewDuration}
                  step="0.1"
                  value={previewCurrentTime}
                  onChange={handleSeek}
                  className="w-full accent-pink-500 h-1.5 bg-[#222432] rounded-lg cursor-pointer"
                />
              </div>

              {/* Synced Lyrics Display */}
              <div className="p-4 rounded-2xl bg-[#101117] border border-[#20222f] text-center space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                  {currentLyric.section} • Synced Lyrics
                </div>
                <div className="text-sm sm:text-base font-semibold text-white">
                  "{currentLyric.originalText}"
                </div>
                <div className="text-xs text-zinc-400 italic">
                  {currentLyric.meaning}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creation Process Steps */}
      <section className="py-16 px-4 sm:px-8 border-b border-[#20222e] bg-[#0f1016]/60">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              The Creation Process
            </h2>
            <p className="text-sm text-zinc-400 max-w-lg mx-auto">
              From initial melody prompt to professional multi-track stems and final video production.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-[#15161d] border border-[#262838] space-y-4 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                01
              </div>
              <h3 className="text-lg font-bold text-white">Compose or Upload</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Describe your musical vision, enter custom lyrics, or upload an audio file to extract separate vocal and instrumental stems instantly.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[#15161d] border border-[#262838] space-y-4 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                02
              </div>
              <h3 className="text-lg font-bold text-white">Generate & Record</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Choose from Mars, Earth, Light Speed, or Light Speed Power models, record over synchronized lyrics with countdown, and refine mix parameters.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[#15161d] border border-[#262838] space-y-4 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                03
              </div>
              <h3 className="text-lg font-bold text-white">Master & Export</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Run the 8-step mastering analyzer, download high-definition WAV stems, or render custom visualizer and lyric music videos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Four Creative Tools with Custom Sound Illustrations */}
      <section id="tools-section" className="py-20 px-4 sm:px-8 border-b border-[#20222e]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Four creative tools for every stage
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto">
              Engineered for speed, fidelity, and absolute creative control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tool 1: Song Generator */}
            <div className="p-7 rounded-3xl bg-[#15161d] border border-[#262838] flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-orange-500/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Song Generator</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Compose complete songs from text prompts or custom lyrics. Tailor genres, moods, tempo, instruments, and vocal styles with advanced model controls.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenGenerator || onGetStarted}
                className="w-full py-3 rounded-xl bg-[#20222f] hover:bg-[#282b3d] text-xs font-bold text-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Open Song Generator</span>
                <ArrowRight className="w-4 h-4 text-orange-400" />
              </button>
            </div>

            {/* Tool 2: Song Studio */}
            <div className="p-7 rounded-3xl bg-[#15161d] border border-[#262838] flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-pink-500/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Song Studio</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Isolate backing tracks and vocals, record over synchronized lyrics with countdown, trim takes, and mix audio masters.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenStudio || onGetStarted}
                className="w-full py-3 rounded-xl bg-[#20222f] hover:bg-[#282b3d] text-xs font-bold text-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Open Song Studio</span>
                <ArrowRight className="w-4 h-4 text-pink-400" />
              </button>
            </div>

            {/* Tool 3: Voice Cloner */}
            <div className="p-7 rounded-3xl bg-[#15161d] border border-[#262838] flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                  <Radio className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Voice Cloner</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Enroll personal vocal profiles with clear consent verification to sing custom lead melodies in your unique natural timbre.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCloner || onGetStarted}
                className="w-full py-3 rounded-xl bg-[#20222f] hover:bg-[#282b3d] text-xs font-bold text-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Open Voice Cloner</span>
                <ArrowRight className="w-4 h-4 text-purple-400" />
              </button>
            </div>

            {/* Tool 4: Universe Model */}
            <div className="p-7 rounded-3xl bg-[#15161d] border border-[#262838] flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-violet-500/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Universe</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Arrange and blend multiple songs on a multi-track timeline, apply transition curves, and render high-definition music videos.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenUniverseModel || onGetStarted}
                className="w-full py-3 rounded-xl bg-[#20222f] hover:bg-[#282b3d] text-xs font-bold text-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Open Universe</span>
                <ArrowRight className="w-4 h-4 text-violet-400" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20 px-4 sm:px-8 border-b border-[#20222e]">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Plans & Usage
            </h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Start with 5 free creations. Pro tier coming soon upon billing integration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-7 rounded-3xl bg-[#15161d] border border-[#262838] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Free Tier</span>
                <h3 className="text-2xl font-black text-white">5 Free Creations</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Full access to song generator, studio recording, voice cloner, and universe mixer for your first 5 successful jobs.
                </p>
              </div>
              <button
                type="button"
                onClick={onGetStarted}
                className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white transition-opacity hover:opacity-95 shadow-md shadow-pink-500/20 cursor-pointer"
              >
                Get Started Free
              </button>
            </div>

            <div className="p-7 rounded-3xl bg-[#15161d] border border-[#262838] flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-800 text-pink-400 border border-pink-500/30">
                Coming Soon
              </div>
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400">Pro Tier</span>
                <h3 className="text-2xl font-black text-white">Unlimited Production</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Unlimited song generation, lossless stems, priority AI processing, and 4K video rendering. Billing integration pending.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenPricing}
                className="w-full py-3 rounded-xl text-xs font-bold bg-[#20222f] hover:bg-[#282b3d] text-zinc-200 transition-colors cursor-pointer border border-[#2b2d3e]"
              >
                View Plans Details
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-8 bg-[#0a0b0f] border-t border-[#1a1c26] text-xs text-zinc-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-200">Musicfy AI</span>
            <span>• 5 free creations included</span>
          </div>

          <div className="text-[11px] text-zinc-400">
            Powered by AndroMida AI
          </div>
        </div>
      </footer>
    </div>
  );
};
