import React, { useRef, useEffect, useState } from 'react';
import { SongVersion, VideoRegenerationTarget } from '../types';
import {
  X,
  Play,
  Pause,
  Video,
  Sparkles,
  Layers,
  RotateCcw,
  Download,
  Maximize2,
  Tv,
  Smartphone,
  Square,
  Music,
  Languages,
  Film,
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface VideoStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: SongVersion;
  onRegenerateTarget: (target: VideoRegenerationTarget) => Promise<void>;
  isProcessing: boolean;
}

export const VideoStudioModal: React.FC<VideoStudioModalProps> = ({
  isOpen,
  onClose,
  version,
  onRegenerateTarget,
  isProcessing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [selectedTemplate, setSelectedTemplate] = useState(version.template || 'Neon Lyric Glow');
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    audioEngine.setOnTimeUpdate((t) => setCurrentTime(t));
    audioEngine.setOnEnded(() => setIsPlaying(false));

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioEngine.stop();
    };
  }, [isOpen]);

  // Canvas drawing loop
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particleArray: Array<{ x: number; y: number; size: number; speedX: number; speedY: number; hue: number }> = [];
    for (let i = 0; i < 40; i++) {
      particleArray.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        hue: Math.random() * 40 + 20, // Warm gold/rose tones
      });
    }

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const analyser = audioEngine.getAnalyser();

      // Clear & Background gradient
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      // Template background variations
      if (selectedTemplate.includes('Neon')) {
        const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.7);
        bgGrad.addColorStop(0, '#1e1b4b');
        bgGrad.addColorStop(0.6, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      } else if (selectedTemplate.includes('Romantic')) {
        const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.7);
        bgGrad.addColorStop(0, '#4c0519');
        bgGrad.addColorStop(0.7, '#1f1315');
        bgGrad.addColorStop(1, '#09090b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#18181b');
        bgGrad.addColorStop(1, '#09090b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Particles
      particleArray.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, 0.4)`;
        ctx.fill();
      });

      // Frequency Audio Visualizer Bars
      let freqData = new Uint8Array(64);
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(freqData);
      } else {
        // Idle animation
        for (let i = 0; i < 64; i++) {
          freqData[i] = Math.sin((Date.now() / 300) + i * 0.2) * 20 + 25;
        }
      }

      const barWidth = (width * 0.8) / 48;
      const startX = width * 0.1;
      const centerY = height * 0.75;

      for (let i = 0; i < 48; i++) {
        const val = freqData[i] || 10;
        const barHeight = (val / 255) * (height * 0.22);
        const x = startX + i * barWidth;

        const barGrad = ctx.createLinearGradient(x, centerY - barHeight, x, centerY + barHeight);
        if (selectedTemplate.includes('Neon')) {
          barGrad.addColorStop(0, '#f43f5e');
          barGrad.addColorStop(1, '#3b82f6');
        } else {
          barGrad.addColorStop(0, '#f59e0b');
          barGrad.addColorStop(1, '#d97706');
        }

        ctx.fillStyle = barGrad;
        ctx.fillRect(x, centerY - barHeight, barWidth - 2, barHeight * 2);
      }

      // Current synchronized lyric line
      const curTime = audioEngine.getCurrentTime();
      const activeLine = version.lyricsLines.find(
        (l) => curTime >= l.startTime && curTime <= l.endTime
      ) || version.lyricsLines[0];

      // Render Title & Template Header
      ctx.textAlign = 'center';
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '12px sans-serif';
      ctx.fillText(
        `CREATORLYRICS AI • ${version.genre.toUpperCase()} • VERSION ${version.versionNumber}`,
        width / 2,
        height * 0.16
      );

      // Render Active Section Badge
      if (activeLine) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`[ ${activeLine.section?.toUpperCase() || 'VERSE'} ]`, width / 2, height * 0.22);

        // Original Lyrics (Big, Glowing)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
        ctx.shadowBlur = 12;
        ctx.fillText(activeLine.originalText, width / 2, height * 0.35);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Phonetic Pronunciation
        if (activeLine.phoneticText) {
          ctx.fillStyle = '#d4d4d8';
          ctx.font = 'italic 13px serif';
          ctx.fillText(activeLine.phoneticText, width / 2, height * 0.42);
        }

        // Target Language Translation
        ctx.fillStyle = '#34d399'; // Emerald glow
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(activeLine.translatedText, width / 2, height * 0.50);

        // Meaning interpretation
        ctx.fillStyle = '#9ca3af';
        ctx.font = '12px sans-serif';
        ctx.fillText(`“${activeLine.meaning}”`, width / 2, height * 0.57);
      }

      // Progress bar at bottom
      const progress = curTime / audioEngine.getDuration();
      ctx.fillStyle = '#27272a';
      ctx.fillRect(width * 0.1, height * 0.9, width * 0.8, 4);

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(width * 0.1, height * 0.9, width * 0.8 * progress, 4);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, selectedTemplate, version, isPlaying]);

  const handlePlayToggle = () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.playVersion(version.id, version.audioParams, version.lyricsLines, currentTime);
      setIsPlaying(true);
    }
  };

  const handleDownloadSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${version.title.replace(/\s+/g, '_')}_v${version.versionNumber}_video_frame.png`;
    a.click();
  };

  if (!isOpen) return null;

  // Aspect ratio canvas size
  const canvasWidth = aspectRatio === '16:9' ? 800 : aspectRatio === '9:16' ? 450 : 600;
  const canvasHeight = aspectRatio === '16:9' ? 450 : aspectRatio === '9:16' ? 800 : 600;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        id="video-studio-modal"
        className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Create & Regenerate Video Studio
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">
                  Version {version.versionNumber}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Synchronized lyrics, audio visualizer, motion background, and modular regeneration
              </p>
            </div>
          </div>
          <button
            id="close-video-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas Stage */}
        <div className="p-4 bg-zinc-950 flex flex-col items-center justify-center border-b border-zinc-800 min-h-[380px] overflow-hidden">
          <div className="relative rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-black max-w-full">
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="max-h-[50vh] w-auto object-contain mx-auto block"
            />
          </div>

          {/* Player controls underneath canvas */}
          <div className="mt-3 flex items-center gap-4">
            <button
              id="video-play-btn"
              onClick={handlePlayToggle}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400 flex items-center gap-2 cursor-pointer shadow-md"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" /> Pause Preview
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Play Video
                </>
              )}
            </button>

            <button
              id="download-video-snapshot-btn"
              onClick={handleDownloadSnapshot}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Save Frame / Artwork
            </button>
          </div>
        </div>

        {/* Video Controls & Modular Regeneration Section */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-zinc-200 text-sm">
          {/* Template & Aspect Ratio Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1.5">
                Video Theme & Template
              </label>
              <select
                id="video-template-select"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full p-2 rounded-lg border border-zinc-700 text-xs bg-zinc-950 text-zinc-100"
              >
                <option value="Neon Lyric Glow">Neon Lyric Glow (Cyberpunk Bars & Glow)</option>
                <option value="Cinematic Horizon">Cinematic Horizon (Serif & Aurora)</option>
                <option value="Retro Cassette">Retro Cassette (Lo-Fi Waveform & Nostalgia)</option>
                <option value="Romantic Petals">Romantic Petals (Rose Dust & Soft Lights)</option>
                <option value="Minimalist Studio">Minimalist Studio (Monochrome Clean)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1.5">
                Video Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                    aspectRatio === '16:9'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" /> 16:9 (Landscape)
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                    aspectRatio === '9:16'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> 9:16 (Shorts/Reels)
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('1:1')}
                  className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                    aspectRatio === '1:1'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" /> 1:1 (Square)
                </button>
              </div>
            </div>
          </div>

          {/* MODULAR REGENERATION TARGETS (As explicitly requested by user) */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Regenerate Video Components (Independent Controls)
              </span>
              <span className="text-[11px] text-zinc-400">
                Regenerate video styling without altering music, or vice versa
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {/* Option 1: Regenerate Video */}
              <button
                id="regen-target-video-btn"
                type="button"
                disabled={isProcessing}
                onClick={() => onRegenerateTarget('video')}
                className="p-3 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <Film className="w-4 h-4 text-purple-400 mb-1" />
                  <span className="font-bold text-xs text-purple-300 block">
                    Regenerate Video
                  </span>
                  <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                    Changes visualizer, fonts & motion (leaves music untouched)
                  </p>
                </div>
              </button>

              {/* Option 2: Regenerate Music */}
              <button
                id="regen-target-music-btn"
                type="button"
                disabled={isProcessing}
                onClick={() => onRegenerateTarget('music')}
                className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <Music className="w-4 h-4 text-amber-400 mb-1" />
                  <span className="font-bold text-xs text-amber-300 block">
                    Regenerate Music
                  </span>
                  <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                    Fresh acoustic stems & arrangement
                  </p>
                </div>
              </button>

              {/* Option 3: Regenerate Lyrics */}
              <button
                id="regen-target-lyrics-btn"
                type="button"
                disabled={isProcessing}
                onClick={() => onRegenerateTarget('lyrics')}
                className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <Sparkles className="w-4 h-4 text-rose-400 mb-1" />
                  <span className="font-bold text-xs text-rose-300 block">
                    Regenerate Lyrics
                  </span>
                  <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                    Writes new poetic lyric lines
                  </p>
                </div>
              </button>

              {/* Option 4: Regenerate Translation */}
              <button
                id="regen-target-translation-btn"
                type="button"
                disabled={isProcessing}
                onClick={() => onRegenerateTarget('translation')}
                className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <Languages className="w-4 h-4 text-emerald-400 mb-1" />
                  <span className="font-bold text-xs text-emerald-300 block">
                    Regenerate Translation
                  </span>
                  <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                    Re-aligns target language subtitles
                  </p>
                </div>
              </button>

              {/* Option 5: Regenerate Everything */}
              <button
                id="regen-target-everything-btn"
                type="button"
                disabled={isProcessing}
                onClick={() => onRegenerateTarget('everything')}
                className="p-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <Layers className="w-4 h-4 text-cyan-400 mb-1" />
                  <span className="font-bold text-xs text-cyan-300 block">
                    Regenerate Everything
                  </span>
                  <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                    Complete re-imagination of music & video
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
