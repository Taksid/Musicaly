import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SongVersion,
  RegenerationModeId,
  KeepChangeConfig,
  RegenerationModeOption,
} from '../types';
import {
  Sparkles,
  X,
  Sliders,
  Music,
  Mic,
  Disc,
  Layers,
  RotateCcw,
  Check,
  Flame,
  Volume2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface RegenerationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: SongVersion;
  onGenerateNewVersion: (
    mode: RegenerationModeId,
    config: KeepChangeConfig,
    induceDefect: boolean
  ) => Promise<void>;
  isGenerating: boolean;
}

const REGENERATION_MODES: RegenerationModeOption[] = [
  {
    id: 'same_lyrics_new_music',
    label: '1. Same Lyrics — New Music',
    description: 'Keep the exact vocal lines and words, but compose a fresh acoustic & rhythmic arrangement.',
    iconName: 'Music',
  },
  {
    id: 'same_music_better_version',
    label: '2. Same Music Style — Better Version',
    description: 'Enhance mixing fidelity, refine chord voicings, and optimize mastering clarity.',
    iconName: 'Flame',
  },
  {
    id: 'new_music_same_lyrics',
    label: '3. New Music — Same Lyrics',
    description: 'Transform rhythm, tempo, and harmony while preserving every word of the written lyrics.',
    iconName: 'Disc',
  },
  {
    id: 'new_vocal_performance',
    label: '4. New Vocal Performance',
    description: 'Re-render lead vocal timbre, emotional inflection, and harmonic vibrato styling.',
    iconName: 'Mic',
  },
  {
    id: 'new_instrumental',
    label: '5. New Instrumental',
    description: 'Replace instrument stems with fresh acoustic textures (e.g. Bansuri, Tabla, Strings).',
    iconName: 'Layers',
  },
  {
    id: 'completely_new_version',
    label: '6. Completely New Version',
    description: 'Full studio redesign: new lyrics, updated melody, fresh chord progression and rhythm.',
    iconName: 'Sparkles',
  },
];

const VOCAL_OPTIONS = [
  'Female Warm Ethereal',
  'Male Warm Soulful',
  'Duet Harmonized',
  'Acoustic Singer-Songwriter',
  'Velvet Baritone',
  'Auto-Tuned Pop',
  'Soulful R&B Lead',
];

const GENRE_OPTIONS = [
  'Indie Pop & Acoustic',
  'Acoustic Indie Folk',
  'R&B Soul Ballad',
  'Lo-Fi Chill Hop',
  'Cinematic Ambient Pop',
  'Synthwave 80s',
  'Latin Acoustic Pop',
  'Classical Crossover',
];

const INSTRUMENT_OPTIONS = [
  'Acoustic Guitar',
  'Grand Piano',
  'Sub Bass',
  'Ambient Strings',
  'Drum Machine',
  'Warm Synth Pad',
  'Bansuri Flute',
  'Tabla',
  'Cello Solo',
  'Electric Bass',
];

const SONG_STRUCTURE_OPTIONS = [
  'Verse 1 - Chorus - Verse 2 - Chorus - Outro',
  'Intro - Verse - Chorus - Bridge - Chorus - Outro',
  'Hook Intro - Verse 1 - Verse 2 - Double Chorus',
  'Acoustic Verse - Building Chorus - Extended Outro',
];

const TRANSLATION_LANGUAGES = [
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

const TEMPLATE_OPTIONS = [
  'Cinematic Horizon',
  'Neon Lyric Glow',
  'Retro Cassette',
  'Minimalist Studio',
  'Romantic Petals',
  'Aurora Borealis',
];

export const RegenerationPanel: React.FC<RegenerationPanelProps> = ({
  isOpen,
  onClose,
  currentVersion,
  onGenerateNewVersion,
  isGenerating,
}) => {
  const [selectedMode, setSelectedMode] = useState<RegenerationModeId>('same_lyrics_new_music');

  // Keep vs Change configuration
  const [keepLyrics, setKeepLyrics] = useState(true);
  const [keepLanguage, setKeepLanguage] = useState(true);
  const [keepGenre, setKeepGenre] = useState(true);
  const [keepMood, setKeepMood] = useState(true);

  const [changeVocal, setChangeVocal] = useState(false);
  const [newVocalType, setNewVocalType] = useState(currentVersion.vocalType);

  const [changeInstruments, setChangeInstruments] = useState(false);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(currentVersion.instruments);

  const [changeBpm, setChangeBpm] = useState(false);
  const [newBpm, setNewBpm] = useState(currentVersion.bpm);

  const [changeStyle, setChangeStyle] = useState(false);
  const [newStyle, setNewStyle] = useState(currentVersion.genre);

  const [changeSongStructure, setChangeSongStructure] = useState(false);
  const [newSongStructure, setNewSongStructure] = useState(currentVersion.songStructure);

  const [targetLanguage, setTargetLanguage] = useState(currentVersion.targetLanguage);
  const [template, setTemplate] = useState(currentVersion.template);

  // Audio Quality defect simulation toggle (to demonstrate automated defect catch)
  const [simulateDefect, setSimulateDefect] = useState(false);

  // When mode changes, preset smart keep/change defaults
  const handleModeSelect = (mode: RegenerationModeId) => {
    setSelectedMode(mode);
    if (mode === 'same_lyrics_new_music') {
      setKeepLyrics(true);
      setKeepGenre(false);
      setChangeInstruments(true);
    } else if (mode === 'same_music_better_version') {
      setKeepLyrics(true);
      setKeepGenre(true);
      setKeepMood(true);
      setChangeInstruments(false);
    } else if (mode === 'new_vocal_performance') {
      setKeepLyrics(true);
      setChangeVocal(true);
    } else if (mode === 'new_instrumental') {
      setKeepLyrics(true);
      setChangeInstruments(true);
    } else if (mode === 'completely_new_version') {
      setKeepLyrics(false);
      setKeepGenre(false);
      setChangeVocal(true);
      setChangeInstruments(true);
      setChangeBpm(true);
    }
  };

  const handleInstrumentToggle = (inst: string) => {
    if (selectedInstruments.includes(inst)) {
      if (selectedInstruments.length > 1) {
        setSelectedInstruments(selectedInstruments.filter((i) => i !== inst));
      }
    } else {
      setSelectedInstruments([...selectedInstruments, inst]);
    }
  };

  const handleSubmit = async () => {
    const config: KeepChangeConfig = {
      keepLyrics,
      keepLanguage,
      keepGenre,
      keepMood,
      changeVocal,
      newVocalType: changeVocal ? newVocalType : currentVersion.vocalType,
      changeInstruments,
      newInstruments: changeInstruments ? selectedInstruments : currentVersion.instruments,
      changeBpm,
      newBpm: changeBpm ? newBpm : currentVersion.bpm,
      changeStyle,
      newStyle: changeStyle ? newStyle : currentVersion.genre,
      changeSongStructure,
      newSongStructure: changeSongStructure ? newSongStructure : currentVersion.songStructure,
      targetLanguage,
      template,
      induceQualityDefect: simulateDefect,
    };

    await onGenerateNewVersion(selectedMode, config, simulateDefect);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          id="regeneration-modal"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-zinc-950 font-bold shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  Regenerate Song Studio
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">
                    Professional Workflow
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Refine specific musical parameters without losing previous generations
                </p>
              </div>
            </div>
            <button
              id="close-regeneration-panel-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Scrollable */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-200 text-sm">
            {/* 1. Current Version & Settings Summary Card */}
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                    Current: Version {currentVersion.versionNumber}
                  </span>
                  <h4 className="font-semibold text-zinc-100 text-sm">{currentVersion.title}</h4>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                  <span>Language: <strong className="text-zinc-200">{currentVersion.language}</strong></span>
                  <span>•</span>
                  <span>Genre: <strong className="text-zinc-200">{currentVersion.genre}</strong></span>
                  <span>•</span>
                  <span>Vocal: <strong className="text-zinc-200">{currentVersion.vocalType}</strong></span>
                  <span>•</span>
                  <span>BPM: <strong className="text-zinc-200">{currentVersion.bpm}</strong></span>
                  <span>•</span>
                  <span>Translation: <strong className="text-zinc-200">{currentVersion.targetLanguage}</strong></span>
                </div>
              </div>

              {/* Quality badge */}
              <div className="flex items-center gap-3 self-start md:self-center">
                <div className="text-right">
                  <span className="text-[11px] text-zinc-400 block">Current Quality</span>
                  <span
                    className={`font-black text-sm ${
                      currentVersion.qualityReport.status === 'quality_needs_improvement'
                        ? 'text-pink-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {currentVersion.qualityReport.overallScore}/100
                  </span>
                </div>
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    currentVersion.qualityReport.status === 'quality_needs_improvement'
                      ? 'bg-pink-500/20 text-pink-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 2. Select Regeneration Mode */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-2.5">
                Select Regeneration Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {REGENERATION_MODES.map((mode) => {
                  const isSelected = selectedMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      id={`mode-btn-${mode.id}`}
                      type="button"
                      onClick={() => handleModeSelect(mode.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-pink-500/15 border-pink-500/70 text-zinc-100 shadow-md ring-1 ring-pink-500/40'
                          : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span className={`text-xs font-bold ${isSelected ? 'text-pink-400' : 'text-zinc-200'}`}>
                          {mode.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-pink-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{mode.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Keep vs. Change Parameter Matrix */}
            <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/40 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-pink-400" />
                  Keep vs. Change Parameter Matrix
                </span>
                <span className="text-[11px] text-zinc-500">
                  Select parameters to retain or modify
                </span>
              </div>

              {/* Keep Toggles Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 text-xs">
                  <input
                    id="keep-lyrics-toggle"
                    type="checkbox"
                    checked={keepLyrics}
                    onChange={(e) => setKeepLyrics(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-500 focus:ring-pink-500 bg-zinc-800 border-zinc-700 cursor-pointer"
                  />
                  <span className="font-medium">Keep Lyrics</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 text-xs">
                  <input
                    id="keep-language-toggle"
                    type="checkbox"
                    checked={keepLanguage}
                    onChange={(e) => setKeepLanguage(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-500 focus:ring-pink-500 bg-zinc-800 border-zinc-700 cursor-pointer"
                  />
                  <span className="font-medium">Keep Language</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 text-xs">
                  <input
                    id="keep-genre-toggle"
                    type="checkbox"
                    checked={keepGenre}
                    onChange={(e) => setKeepGenre(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-500 focus:ring-pink-500 bg-zinc-800 border-zinc-700 cursor-pointer"
                  />
                  <span className="font-medium">Keep Genre</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 text-xs">
                  <input
                    id="keep-mood-toggle"
                    type="checkbox"
                    checked={keepMood}
                    onChange={(e) => setKeepMood(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-500 focus:ring-pink-500 bg-zinc-800 border-zinc-700 cursor-pointer"
                  />
                  <span className="font-medium">Keep Mood</span>
                </label>
              </div>

              {/* Changeable Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Vocal Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-zinc-400" />
                      Vocal Type
                    </label>
                    <button
                      type="button"
                      onClick={() => setChangeVocal(!changeVocal)}
                      className={`text-[11px] font-semibold cursor-pointer ${
                        changeVocal ? 'text-pink-400' : 'text-zinc-500'
                      }`}
                    >
                      {changeVocal ? 'Changing' : 'Keep Current'}
                    </button>
                  </div>
                  <select
                    id="new-vocal-select"
                    disabled={!changeVocal}
                    value={newVocalType}
                    onChange={(e) => setNewVocalType(e.target.value)}
                    className={`w-full p-2 rounded-lg border text-xs bg-zinc-900 transition-opacity ${
                      changeVocal
                        ? 'border-pink-500/50 text-zinc-100'
                        : 'border-zinc-800 text-zinc-500 opacity-60'
                    }`}
                  >
                    {VOCAL_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Genre / Style */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-zinc-400" />
                      Music Style / Genre
                    </label>
                    <button
                      type="button"
                      onClick={() => setChangeStyle(!changeStyle)}
                      className={`text-[11px] font-semibold cursor-pointer ${
                        changeStyle ? 'text-pink-400' : 'text-zinc-500'
                      }`}
                    >
                      {changeStyle ? 'Changing' : 'Keep Current'}
                    </button>
                  </div>
                  <select
                    id="new-style-select"
                    disabled={!changeStyle}
                    value={newStyle}
                    onChange={(e) => setNewStyle(e.target.value)}
                    className={`w-full p-2 rounded-lg border text-xs bg-zinc-900 transition-opacity ${
                      changeStyle
                        ? 'border-pink-500/50 text-zinc-100'
                        : 'border-zinc-800 text-zinc-500 opacity-60'
                    }`}
                  >
                    {GENRE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* BPM & Tempo */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-medium text-zinc-300">
                      BPM & Tempo ({newBpm} BPM)
                    </label>
                    <button
                      type="button"
                      onClick={() => setChangeBpm(!changeBpm)}
                      className={`text-[11px] font-semibold cursor-pointer ${
                        changeBpm ? 'text-pink-400' : 'text-zinc-500'
                      }`}
                    >
                      {changeBpm ? 'Changing' : 'Keep Current'}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      id="bpm-slider"
                      type="range"
                      min="65"
                      max="140"
                      step="1"
                      disabled={!changeBpm}
                      value={newBpm}
                      onChange={(e) => setNewBpm(Number(e.target.value))}
                      className="w-full accent-pink-500 cursor-pointer disabled:opacity-40"
                    />
                    <span className="font-mono text-xs w-12 text-right text-pink-400 font-bold">
                      {newBpm}
                    </span>
                  </div>
                </div>

                {/* Target Translation Language */}
                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-300 text-xs block">
                    Target Translation Language
                  </label>
                  <select
                    id="target-language-select"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-700 text-xs bg-zinc-900 text-zinc-100"
                  >
                    {TRANSLATION_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang} (Synchronized)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Song Structure */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-medium text-zinc-300">Song Structure</label>
                    <button
                      type="button"
                      onClick={() => setChangeSongStructure(!changeSongStructure)}
                      className={`text-[11px] font-semibold cursor-pointer ${
                        changeSongStructure ? 'text-pink-400' : 'text-zinc-500'
                      }`}
                    >
                      {changeSongStructure ? 'Changing' : 'Keep Current'}
                    </button>
                  </div>
                  <select
                    id="new-structure-select"
                    disabled={!changeSongStructure}
                    value={newSongStructure}
                    onChange={(e) => setNewSongStructure(e.target.value)}
                    className={`w-full p-2 rounded-lg border text-xs bg-zinc-900 transition-opacity ${
                      changeSongStructure
                        ? 'border-pink-500/50 text-zinc-100'
                        : 'border-zinc-800 text-zinc-500 opacity-60'
                    }`}
                  >
                    {SONG_STRUCTURE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visual Video Template */}
                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-300 text-xs block">
                    Video Design Template
                  </label>
                  <select
                    id="template-select"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-700 text-xs bg-zinc-900 text-zinc-100"
                  >
                    {TEMPLATE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Instruments Selection */}
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-xs mb-2">
                  <label className="font-medium text-zinc-300">
                    Acoustic & Instrumental Stems
                  </label>
                  <button
                    type="button"
                    onClick={() => setChangeInstruments(!changeInstruments)}
                    className={`text-[11px] font-semibold cursor-pointer ${
                      changeInstruments ? 'text-pink-400' : 'text-zinc-500'
                    }`}
                  >
                    {changeInstruments ? 'Customizing Stems' : 'Keep Stems'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {INSTRUMENT_OPTIONS.map((inst) => {
                    const isPicked = selectedInstruments.includes(inst);
                    return (
                      <button
                        key={inst}
                        type="button"
                        disabled={!changeInstruments}
                        onClick={() => handleInstrumentToggle(inst)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          !changeInstruments
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-500 opacity-60'
                            : isPicked
                            ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {inst} {isPicked && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Audio Quality Safeguard & Defect Induction Simulator */}
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-zinc-200 block">
                    Simulate Audio Defect Catch (Quality Test)
                  </span>
                  <span className="text-zinc-400">
                    Induces clipping & noise in this generation to test automated &ldquo;Quality needs improvement&rdquo; detection and recovery.
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  id="simulate-defect-toggle"
                  type="checkbox"
                  checked={simulateDefect}
                  onChange={(e) => setSimulateDefect(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>
          </div>

          {/* Footer with Primary Action */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-zinc-400 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>
                Generates <strong className="text-zinc-200">Version {currentVersion.versionNumber + 1}</strong> without overwriting Version {currentVersion.versionNumber}.
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                id="generate-new-version-submit-btn"
                type="button"
                onClick={handleSubmit}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white hover:opacity-95 active:scale-98 transition-all shadow-md shadow-pink-500/20 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    RUNNING QUALITY PIPELINE...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    GENERATE NEW VERSION
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
