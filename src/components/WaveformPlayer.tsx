import React, { useRef, useEffect } from 'react';
import { SongVersion } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  ArrowRightLeft,
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface WaveformPlayerProps {
  version: SongVersion;
  isPlaying: boolean;
  currentTime: number;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onOpenRegenerate: () => void;
  onOpenCompare?: () => void;
}

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  version,
  isPlaying,
  currentTime,
  onPlayPause,
  onSeek,
  onOpenRegenerate,
  onOpenCompare,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const duration = audioEngine.getDuration();
  const isDefective = version.qualityReport.status === 'quality_needs_improvement';

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

      const analyser = audioEngine.getAnalyser();
      const numBars = 64;
      const barWidth = width / numBars;
      const progress = currentTime / duration;
      const playedBars = Math.floor(progress * numBars);

      const freqData = new Uint8Array(numBars);
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(freqData);
      }

      for (let i = 0; i < numBars; i++) {
        // Waveform profile based on song structure
        const baseFactor = Math.sin((i / numBars) * Math.PI) * 0.5 + 0.3;
        const dynamicBoost = isPlaying && freqData[i] ? (freqData[i] / 255) * 0.4 : 0;
        const barHeight = Math.max(6, (baseFactor + dynamicBoost) * (height * 0.75));

        const x = i * barWidth;
        const y = (height - barHeight) / 2;

        const isPast = i <= playedBars;
        if (isPast) {
          ctx.fillStyle = isDefective ? '#be185d' : '#ec4899'; // Pink active
        } else {
          ctx.fillStyle = '#27272a'; // Zinc muted
        }

        // Rounded bar
        ctx.beginPath();
        ctx.roundRect(x + 1, y, Math.max(1, barWidth - 2), barHeight, 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [currentTime, duration, isPlaying, isDefective]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(clickRatio * duration);
  };

  return (
    <div
      id="waveform-player-card"
      className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl relative overflow-hidden"
    >
      {/* Background ambient gradient glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" />

      {/* Top Details Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
              Active Master: Version {version.versionNumber}
            </span>
            <h2 className="text-lg font-bold text-zinc-100">{version.title}</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {version.genre} • {version.vocalType} • {version.tempo} • Scale: {version.audioParams.scale}
          </p>
        </div>

        {/* Quality status badge */}
        <div className="flex items-center gap-2">
          {isDefective ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/40 text-pink-300 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-pink-400" />
              Quality Needs Improvement ({version.qualityReport.overallScore}/100)
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Studio Certified Master ({version.qualityReport.overallScore}/100)
            </div>
          )}
        </div>
      </div>

      {/* Interactive Waveform Canvas */}
      <div className="relative mb-4 bg-zinc-950/70 rounded-xl p-2.5 border border-zinc-800/80">
        <canvas
          ref={canvasRef}
          width={800}
          height={70}
          onClick={handleCanvasClick}
          className="w-full h-18 cursor-pointer block"
        />

        {/* Time overlay */}
        <div className="flex justify-between text-[11px] font-mono text-zinc-400 mt-1 px-1">
          <span>{currentTime.toFixed(1)}s</span>
          <span>{duration}.0s (Master Preview)</span>
        </div>
      </div>

      {/* Transport Controls and Main Action Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            id="waveform-play-toggle-btn"
            type="button"
            onClick={onPlayPause}
            className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white hover:opacity-95 active:scale-95 flex items-center justify-center font-bold shadow-md shadow-pink-500/20 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            id="waveform-replay-btn"
            type="button"
            onClick={() => onSeek(0)}
            className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            title="Restart from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="text-xs text-zinc-400 font-medium pl-1">
            <span className="text-zinc-200 block">
              {isPlaying ? 'Now Playing Synthesized Stems' : 'Playback Paused'}
            </span>
            <span className="text-[11px] text-zinc-500">
              {version.instruments.join(', ')}
            </span>
          </div>
        </div>

        {/* Right side: Prominent REGENERATE SONG trigger */}
        <div className="flex items-center gap-2.5">
          {onOpenCompare && (
            <button
              id="waveform-compare-btn"
              type="button"
              onClick={onOpenCompare}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
              Compare Versions
            </button>
          )}

          <button
            id="waveform-regenerate-song-btn"
            type="button"
            onClick={onOpenRegenerate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white hover:opacity-95 active:scale-95 transition-all shadow-md shadow-pink-500/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            ✨ REGENERATE SONG
          </button>
        </div>
      </div>
    </div>
  );
};
