import React from 'react';
import { SongVersion } from '../types';
import {
  Play,
  Pause,
  ArrowRightLeft,
  Check,
  Download,
  Trash2,
  Volume2,
  AlertTriangle,
  Clock,
  Sparkles,
  FileText,
  Disc,
} from 'lucide-react';
import { AudioQualityReport } from './AudioQualityReport';

interface VersionsListProps {
  versions: SongVersion[];
  activeVersionId: string;
  playingVersionId: string | null;
  isPlaying: boolean;
  onPlayPause: (version: SongVersion) => void;
  onSelectVersion: (version: SongVersion) => void;
  onCompare: (versionA: SongVersion, versionB?: SongVersion) => void;
  onDownload: (version: SongVersion) => void;
  onDelete: (versionId: string) => void;
  onOpenRegenerateModal: () => void;
  onFixDefects: (version: SongVersion) => void;
}

export const VersionsList: React.FC<VersionsListProps> = ({
  versions,
  activeVersionId,
  playingVersionId,
  isPlaying,
  onPlayPause,
  onSelectVersion,
  onCompare,
  onDownload,
  onDelete,
  onOpenRegenerateModal,
  onFixDefects,
}) => {
  return (
    <div id="versions-history-section" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Disc className="w-4 h-4 text-pink-400" />
              Generated Versions Studio
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
              {versions.length} {versions.length === 1 ? 'Version' : 'Versions'}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Compare previous and new generations freely. Your earlier versions are permanently preserved.
          </p>
        </div>

        <button
          id="versions-shelf-regenerate-btn"
          type="button"
          onClick={onOpenRegenerateModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-violet-600/20 text-pink-400 border border-pink-500/30 hover:bg-pink-500/30 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          ✨ REGENERATE NEW VERSION
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {versions.map((ver) => {
          const isActive = ver.id === activeVersionId;
          const isCurrentlyPlaying = isPlaying && playingVersionId === ver.id;
          const isDefective = ver.qualityReport.status === 'quality_needs_improvement';

          return (
            <div
              key={ver.id}
              id={`version-card-v${ver.versionNumber}`}
              className={`p-4 rounded-xl border transition-all ${
                isActive
                  ? 'bg-zinc-900/90 border-pink-500/60 shadow-lg shadow-pink-950/20'
                  : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Version Info & Quick Player */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <button
                    id={`play-pause-v${ver.versionNumber}-btn`}
                    type="button"
                    onClick={() => onPlayPause(ver)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-md ${
                      isCurrentlyPlaying
                        ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white ring-2 ring-pink-400/50'
                        : 'bg-zinc-800 text-zinc-200 hover:text-pink-400'
                    }`}
                  >
                    {isCurrentlyPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-zinc-100">
                        Version {ver.versionNumber}
                      </span>
                      {isActive && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active Selection
                        </span>
                      )}
                      <AudioQualityReport
                        report={ver.qualityReport}
                        versionNumber={ver.versionNumber}
                        compact={true}
                      />
                    </div>

                    <p className="text-xs text-zinc-300 font-medium">{ver.title}</p>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-zinc-400">
                      <span>{ver.genre}</span>
                      <span>•</span>
                      <span>{ver.vocalType}</span>
                      <span>•</span>
                      <span className="font-mono">{ver.bpm} BPM</span>
                      <span>•</span>
                      <span>{ver.language} → {ver.targetLanguage}</span>
                    </div>

                    {ver.regenerationNotes && (
                      <p className="text-[11px] text-zinc-400 italic">
                        {ver.regenerationNotes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions (Play, Compare, Use This Version, Download, Delete) */}
                <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-800/80 self-end lg:self-center">
                  {/* Defect warning trigger */}
                  {isDefective && (
                    <button
                      id={`fix-defects-v${ver.versionNumber}-btn`}
                      type="button"
                      onClick={() => onFixDefects(ver)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/40 hover:bg-pink-500/30 cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-pink-400" />
                      Auto-Fix & Regenerate
                    </button>
                  )}

                  {/* Compare */}
                  <button
                    id={`compare-v${ver.versionNumber}-btn`}
                    type="button"
                    onClick={() => onCompare(ver)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors cursor-pointer"
                    title="Compare this generation against other versions"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                    Compare
                  </button>

                  {/* Use This Version */}
                  <button
                    id={`use-version-v${ver.versionNumber}-btn`}
                    type="button"
                    onClick={() => onSelectVersion(ver)}
                    disabled={isActive}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 opacity-80 cursor-default'
                        : 'bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-300'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isActive ? 'Current Active' : 'Use This Version'}
                  </button>

                  {/* Download Mastered Audio + Package */}
                  <button
                    id={`download-v${ver.versionNumber}-btn`}
                    type="button"
                    onClick={() => onDownload(ver)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Download Mastered WAV Audio & Lyrics"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  {versions.length > 1 && (
                    <button
                      id={`delete-v${ver.versionNumber}-btn`}
                      type="button"
                      onClick={() => onDelete(ver.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete this version"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
