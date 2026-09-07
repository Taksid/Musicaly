import React, { useState } from 'react';
import { SongVersion, LyricLine } from '../types';
import {
  Languages,
  RotateCcw,
  Sparkles,
  Play,
  Volume2,
  Clock,
  BookOpen,
  Check,
  Copy,
} from 'lucide-react';

interface LyricsTranslationViewProps {
  version: SongVersion;
  currentTime: number;
  isPlaying: boolean;
  onSeekLine: (startTime: number) => void;
  onRegenerateTranslation: (targetLanguage: string) => Promise<void>;
  isUpdatingTranslation: boolean;
}

const SUPPORTED_LANGUAGES = [
  'Spanish',
  'French',
  'English',
  'German',
  'Japanese',
  'Korean',
  'Italian',
  'Portuguese',
  'Hindi',
  'Arabic',
];

export const LyricsTranslationView: React.FC<LyricsTranslationViewProps> = ({
  version,
  currentTime,
  isPlaying,
  onSeekLine,
  onRegenerateTranslation,
  isUpdatingTranslation,
}) => {
  const [selectedLang, setSelectedLang] = useState<string>(version.targetLanguage || 'Spanish');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div id="lyrics-translation-studio" className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Languages className="w-4 h-4 text-amber-400" />
              Synchronized Lyrics & Translation Studio
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
              V{version.versionNumber} Synced
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            {version.language} Original synchronized with {version.targetLanguage} poetic meaning and timestamps.
          </p>
        </div>

        {/* Language switch & Regenerate translation */}
        <div className="flex items-center gap-2">
          <select
            id="quick-translate-select"
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 text-xs rounded-lg px-3 py-1.5 text-zinc-200"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                Translate to {lang}
              </option>
            ))}
          </select>

          <button
            id="regenerate-translation-btn"
            type="button"
            disabled={isUpdatingTranslation}
            onClick={() => onRegenerateTranslation(selectedLang)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isUpdatingTranslation ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                Updating Sync...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Regenerate Translation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Synchronized Lines List */}
      <div className="space-y-3">
        {version.lyricsLines.map((line, idx) => {
          const isLineActive =
            isPlaying && currentTime >= line.startTime && currentTime <= line.endTime;

          return (
            <div
              key={line.id || idx}
              id={`lyric-line-${line.id || idx}`}
              onClick={() => onSeekLine(line.startTime)}
              className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                isLineActive
                  ? 'bg-gradient-to-r from-amber-500/20 via-zinc-900 to-rose-500/10 border-amber-500/70 shadow-lg shadow-amber-950/20 ring-1 ring-amber-500/40'
                  : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              {/* Line Metadata Row */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                    {line.section || `Line ${idx + 1}`}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {line.startTime.toFixed(1)}s - {line.endTime.toFixed(1)}s
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isLineActive && (
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                      Singing Now
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(`${line.originalText}\n${line.translatedText}`, line.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-400 hover:text-zinc-200 transition-opacity"
                    title="Copy Line"
                  >
                    {copiedId === line.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Original Lyrics in Script */}
              <div className="mb-2">
                <p className={`text-base sm:text-lg font-bold leading-relaxed ${
                  isLineActive ? 'text-amber-300' : 'text-zinc-100'
                }`}>
                  {line.originalText}
                </p>
                {line.phoneticText && (
                  <p className="text-xs text-zinc-400 font-serif italic">
                    {line.phoneticText}
                  </p>
                )}
              </div>

              {/* Translation in Target Script & Meaning */}
              <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-0.5">
                    {version.targetLanguage} Translation
                  </span>
                  <p className="text-emerald-400 font-medium text-sm">
                    {line.translatedText}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-0.5">
                    Poetic Meaning
                  </span>
                  <p className="text-zinc-300 text-xs italic">
                    &ldquo;{line.meaning}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
