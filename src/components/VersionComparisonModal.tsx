import React, { useState, useEffect } from 'react';
import { SongVersion } from '../types';
import {
  X,
  Play,
  Pause,
  ArrowRightLeft,
  Check,
  Sparkles,
  Layers,
  Volume2,
  Sliders,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface VersionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: SongVersion[];
  initialVersionA: SongVersion;
  initialVersionB?: SongVersion;
  onSelectVersion: (version: SongVersion) => void;
}

export const VersionComparisonModal: React.FC<VersionComparisonModalProps> = ({
  isOpen,
  onClose,
  versions,
  initialVersionA,
  initialVersionB,
  onSelectVersion,
}) => {
  const [versionAId, setVersionAId] = useState<string>(initialVersionA.id);
  const [versionBId, setVersionBId] = useState<string>(
    initialVersionB?.id || versions.find((v) => v.id !== initialVersionA.id)?.id || initialVersionA.id
  );

  const [activePlaybackVer, setActivePlaybackVer] = useState<'A' | 'B'>('A');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const versionA = versions.find((v) => v.id === versionAId) || initialVersionA;
  const versionB = versions.find((v) => v.id === versionBId) || initialVersionA;

  useEffect(() => {
    audioEngine.setOnTimeUpdate((t) => setCurrentTime(t));
    audioEngine.setOnEnded(() => setIsPlaying(false));
    return () => {
      audioEngine.stop();
    };
  }, []);

  const handlePlayToggle = () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      const active = activePlaybackVer === 'A' ? versionA : versionB;
      audioEngine.playVersion(active.id, active.audioParams, active.lyricsLines, currentTime);
      setIsPlaying(true);
    }
  };

  // Instant A/B Switch at current playhead!
  const handleSwitchAB = (target: 'A' | 'B') => {
    if (target === activePlaybackVer) return;
    const nowTime = audioEngine.getCurrentTime();
    setActivePlaybackVer(target);
    if (isPlaying) {
      const active = target === 'A' ? versionA : versionB;
      audioEngine.playVersion(active.id, active.audioParams, active.lyricsLines, nowTime);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        id="comparison-modal"
        className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                A/B Version Comparison Studio
              </h3>
              <p className="text-xs text-zinc-400">
                Instant seamless cross-listening and acoustic parameter delta
              </p>
            </div>
          </div>
          <button
            id="close-compare-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Synchronized Playback Control Bar */}
        <div className="px-6 py-3.5 bg-zinc-950 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              id="compare-play-btn"
              onClick={handlePlayToggle}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-pink-500 text-white hover:bg-pink-400 flex items-center gap-2 cursor-pointer shadow-md shadow-pink-500/20"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Play Comparison
                </>
              )}
            </button>
            <span className="text-xs font-mono text-zinc-400">
              {currentTime.toFixed(1)}s / {audioEngine.getDuration()}s
            </span>
          </div>

          {/* Instant A / B Switch Buttons */}
          <div className="flex items-center bg-zinc-900 border border-zinc-750 p-1 rounded-xl gap-1">
            <button
              id="switch-to-a-btn"
              onClick={() => handleSwitchAB('A')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activePlaybackVer === 'A'
                  ? 'bg-pink-500 text-white shadow-sm shadow-pink-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Listen: Version {versionA.versionNumber} (A)
            </button>
            <button
              id="switch-to-b-btn"
              onClick={() => handleSwitchAB('B')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activePlaybackVer === 'B'
                  ? 'bg-cyan-400 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Listen: Version {versionB.versionNumber} (B)
            </button>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-200 text-sm">
          {/* Side by Side Version Selectors & Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Version A Card */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                activePlaybackVer === 'A'
                  ? 'bg-pink-500/10 border-pink-500/60 ring-1 ring-pink-500/40'
                  : 'bg-zinc-950/60 border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  SLOT A
                </span>
                <select
                  id="select-version-a"
                  value={versionAId}
                  onChange={(e) => setVersionAId(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-xs rounded-lg px-2.5 py-1 text-zinc-200"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      Version {v.versionNumber} ({v.genre})
                    </option>
                  ))}
                </select>
              </div>

              <h4 className="font-bold text-zinc-100 text-sm mb-1">{versionA.title}</h4>
              <p className="text-xs text-zinc-400 mb-3">{versionA.regenerationNotes || 'Initial generation'}</p>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Quality Score:</span>
                  <span className={`font-bold ${versionA.qualityReport.status === 'quality_needs_improvement' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {versionA.qualityReport.overallScore}/100
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Vocal Timbre:</span>
                  <span className="text-zinc-200 font-medium">{versionA.vocalType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Tempo / BPM:</span>
                  <span className="font-mono text-zinc-200">{versionA.bpm} BPM</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Mastered Peak:</span>
                  <span className="font-mono text-zinc-200">{versionA.qualityReport.peakDbfs} dBFS</span>
                </div>
                <div className="py-1">
                  <span className="text-zinc-400 block mb-1">Instruments:</span>
                  <div className="flex flex-wrap gap-1">
                    {versionA.instruments.map((i) => (
                      <span key={i} className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-end">
                <button
                  id="pick-winner-a-btn"
                  onClick={() => {
                    onSelectVersion(versionA);
                    onClose();
                  }}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-pink-500 text-white hover:bg-pink-400 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-pink-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  Select Version {versionA.versionNumber} As Winner
                </button>
              </div>
            </div>

            {/* Version B Card */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                activePlaybackVer === 'B'
                  ? 'bg-cyan-500/10 border-cyan-500/60 ring-1 ring-cyan-500/40'
                  : 'bg-zinc-950/60 border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  SLOT B
                </span>
                <select
                  id="select-version-b"
                  value={versionBId}
                  onChange={(e) => setVersionBId(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-xs rounded-lg px-2.5 py-1 text-zinc-200"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      Version {v.versionNumber} ({v.genre})
                    </option>
                  ))}
                </select>
              </div>

              <h4 className="font-bold text-zinc-100 text-sm mb-1">{versionB.title}</h4>
              <p className="text-xs text-zinc-400 mb-3">{versionB.regenerationNotes || 'Initial generation'}</p>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Quality Score:</span>
                  <span className={`font-bold ${versionB.qualityReport.status === 'quality_needs_improvement' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {versionB.qualityReport.overallScore}/100
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Vocal Timbre:</span>
                  <span className="text-zinc-200 font-medium">{versionB.vocalType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Tempo / BPM:</span>
                  <span className="font-mono text-zinc-200">{versionB.bpm} BPM</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800">
                  <span className="text-zinc-400">Mastered Peak:</span>
                  <span className="font-mono text-zinc-200">{versionB.qualityReport.peakDbfs} dBFS</span>
                </div>
                <div className="py-1">
                  <span className="text-zinc-400 block mb-1">Instruments:</span>
                  <div className="flex flex-wrap gap-1">
                    {versionB.instruments.map((i) => (
                      <span key={i} className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-end">
                <button
                  id="pick-winner-b-btn"
                  onClick={() => {
                    onSelectVersion(versionB);
                    onClose();
                  }}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-cyan-400 text-zinc-950 hover:bg-cyan-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Select Version {versionB.versionNumber} As Winner
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
