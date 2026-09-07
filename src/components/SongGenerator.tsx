import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  Mic,
  Music2,
  Sliders,
  Globe,
  Radio,
  FileText,
  Clock,
  ArrowRight,
  Disc,
} from 'lucide-react';
import { SongVersion, VoiceProfile, User, SupportedInterfaceLanguage, MusicfyModelId } from '../types';
import { audioEngine } from '../services/audioEngine';
import { authService } from '../services/authService';
import { TranslationDict } from '../i18n/translations';
import { ModelSelector } from './ModelSelector';
import { getModelById } from '../config/models';
import { WaveformPlayer } from './WaveformPlayer';

interface SongGeneratorProps {
  t: TranslationDict;
  currentUser: User | null;
  voiceProfiles: VoiceProfile[];
  onSongCreated: (version: SongVersion, title: string) => void;
  onOpenStudioWithSong?: (version: SongVersion) => void;
  onOpenAuth: () => void;
}

const GENRES = [
  'Indie Pop',
  'Acoustic',
  'R&B & Soul',
  'Lo-Fi Chill',
  'Pop Ballad',
  'Synthwave',
  'Rock',
  'Electronic',
];

const MOODS = [
  'Uplifting',
  'Melancholic',
  'Dreamy',
  'Energetic',
  'Intimate',
  'Chill',
];

const VOCAL_STYLES = [
  'Female Warm Ethereal',
  'Male Velvet Baritone',
  'Female Bright Pop',
  'Male Soulful Rasp',
  'Acoustic Singer-Songwriter',
  'Duet Harmony',
];

const INSTRUMENT_OPTIONS = [
  'Acoustic Guitar',
  'Grand Piano',
  'Bass Guitar',
  'Drum Kit',
  'Ambient Synth',
  'Strings',
];

const TARGET_LANGUAGES = [
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Portuguese',
  'Hindi',
  'Italian',
];

export const SongGenerator: React.FC<SongGeneratorProps> = ({
  t,
  currentUser,
  voiceProfiles,
  onSongCreated,
  onOpenStudioWithSong,
  onOpenAuth,
}) => {
  // Input Mode: prompt vs lyrics
  const [inputMode, setInputMode] = useState<'prompt' | 'lyrics'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [userLyrics, setUserLyrics] = useState('');
  const [title, setTitle] = useState('');

  // AI Model Selection
  const [selectedModel, setSelectedModel] = useState<MusicfyModelId>('mars');

  // Musical attributes
  const [genre, setGenre] = useState(GENRES[0]);
  const [mood, setMood] = useState(MOODS[0]);
  const [vocalStyle, setVocalStyle] = useState(VOCAL_STYLES[0]);
  const [selectedVoiceProfileId, setSelectedVoiceProfileId] = useState<string>('');
  const [isInstrumentalOnly, setIsInstrumentalOnly] = useState(false);

  // Advanced settings state
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [bpm, setBpm] = useState(90);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([
    'Acoustic Guitar',
    'Grand Piano',
    'Bass Guitar',
    'Drum Kit',
  ]);
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('Spanish');

  // Generation & playback state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generatedVersion, setGeneratedVersion] = useState<SongVersion | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const toggleInstrument = (inst: string) => {
    if (selectedInstruments.includes(inst)) {
      if (selectedInstruments.length > 1) {
        setSelectedInstruments(selectedInstruments.filter((i) => i !== inst));
      }
    } else {
      setSelectedInstruments([...selectedInstruments, inst]);
    }
  };

  const handleCreateSong = async () => {
    if (inputMode === 'prompt' && !prompt.trim()) {
      setErrorMessage('Please describe the song you would like to create.');
      return;
    }
    if (inputMode === 'lyrics' && !userLyrics.trim()) {
      setErrorMessage('Please enter lyrics for your song.');
      return;
    }

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (currentUser.plan !== 'premium' && currentUser.freeUsesRemaining <= 0) {
      setErrorMessage('You have used all 5 free creations. Please upgrade to Pro for unlimited songs.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStep('Composing musical arrangement and harmonies...');

    try {
      const activeProfile = voiceProfiles.find((vp) => vp.id === selectedVoiceProfileId);

      const response = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputMode === 'prompt' ? prompt : (title || 'My Original Song'),
          modelId: selectedModel,
          userLyrics: inputMode === 'lyrics' ? userLyrics : '',
          isInstrumentalOnly,
          genre,
          language: 'English',
          targetLanguage,
          translationEnabled,
          mood,
          vocalType: isInstrumentalOnly
            ? 'Instrumental (No Vocals)'
            : activeProfile
            ? `AI Voice (${activeProfile.name})`
            : vocalStyle,
          clonedVoiceProfileName: activeProfile ? activeProfile.name : '',
          bpm,
          instruments: selectedInstruments,
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.version) {
        throw new Error(data.error || 'Failed to synthesize song');
      }

      // Consume free use
      await authService.consumeSuccessfulUse();

      let finalAudioBlobUrl = undefined;
      if (data.version.audioBase64) {
        try {
          const binary = atob(data.version.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/wav' }); // Lyria often outputs audio/wav or audio/mp3, generic is fine for blob
          finalAudioBlobUrl = URL.createObjectURL(blob);
        } catch (e) {
          console.error('Failed to convert base64 to blob URL', e);
        }
      }

      const newVersion: SongVersion = {
        ...data.version,
        modelId: selectedModel,
        audioBlobUrl: finalAudioBlobUrl,
      };

      setGeneratedVersion(newVersion);
      setTitle(newVersion.title || title || 'New Song');
      setIsSaved(false);

      onSongCreated(newVersion, newVersion.title || title || 'New Song');
    } catch (err: unknown) {
      console.error('Song generation error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(`Failed to create song: ${msg}. Your quota was not charged.`);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handlePlayPause = () => {
    if (!generatedVersion) return;
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      audioEngine.playSongVersion(generatedVersion, currentTime);
      setIsPlaying(true);
      audioEngine.setOnTimeUpdate((t) => setCurrentTime(t));
      audioEngine.setOnEnded(() => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
    }
  };

  const handleDownloadWav = (stemType: 'master' | 'vocals' | 'instrumental') => {
    if (!generatedVersion) return;
    const songTitle = generatedVersion.title || title || 'Song';
    
    if (generatedVersion.audioBlobUrl) {
      // Use the actual generated audio
      const a = document.createElement('a');
      a.href = generatedVersion.audioBlobUrl;
      a.download = `${songTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}_${stemType}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Fallback to synthesized audio for old versions
      const { blob, filename } = audioEngine.generateWavFile(songTitle, generatedVersion.audioParams, stemType);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleSaveToProjects = async () => {
    if (!generatedVersion) return;
    const songTitle = generatedVersion.title || title || 'Untitled Project';
    await authService.saveProject({
      id: `proj-${Date.now()}`,
      userId: currentUser?.id || 'demo-user-1',
      projectType: 'song_generator',
      title: songTitle,
      originalLanguage: 'English',
      translationEnabled,
      targetLanguage,
      versions: [generatedVersion],
      activeVersionId: generatedVersion.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsSaved(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Workspace Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Create Song</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Compose multi-track songs from text descriptions or your own lyrics.
        </p>
      </div>

      {/* Primary Creation Form */}
      <div className="rounded-2xl bg-[#18191f] border border-[#262832] p-5 sm:p-6 space-y-6">
        {/* Switch between Describe and Lyrics */}
        <div className="flex items-center justify-between border-b border-[#242630] pb-4">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#121316] border border-[#272933]">
            <button
              type="button"
              onClick={() => setInputMode('prompt')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                inputMode === 'prompt'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Describe a song
            </button>
            <button
              type="button"
              onClick={() => setInputMode('lyrics')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                inputMode === 'lyrics'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Use my lyrics
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400 flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isInstrumentalOnly}
                onChange={(e) => setIsInstrumentalOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-pink-500 bg-zinc-800 border-zinc-700"
              />
              <span>Instrumental only</span>
            </label>
          </div>
        </div>

        {/* Lead Prompt / Lyrics Field */}
        {inputMode === 'prompt' ? (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              Describe your song
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your song (e.g., A warm acoustic indie song with fingerpicked guitar, intimate vocals, and an uplifting chorus about driving at sunset)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#14151a] border border-[#262832] text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-zinc-500 transition-colors resize-none leading-relaxed"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">Song Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your song a title..."
                className="w-full px-3 py-2 rounded-lg bg-[#14151a] border border-[#262832] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-zinc-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">Your Lyrics</label>
              <textarea
                rows={5}
                value={userLyrics}
                onChange={(e) => setUserLyrics(e.target.value)}
                placeholder="[Verse 1]&#10;Walking down the quiet street...&#10;&#10;[Chorus]&#10;We chase the light into the dark..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14151a] border border-[#262832] text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-zinc-500 transition-colors leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Compact Chips: Genre & Mood */}
        <div className="space-y-4 pt-1">
          {/* Genre Chips */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-zinc-300">Genre</div>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    genre === g
                      ? 'bg-zinc-700 text-zinc-100 border border-zinc-600'
                      : 'bg-[#14151a] text-zinc-400 hover:text-zinc-200 border border-[#242630]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Mood Chips */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-zinc-300">Mood</div>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    mood === m
                      ? 'bg-zinc-700 text-zinc-100 border border-zinc-600'
                      : 'bg-[#14151a] text-zinc-400 hover:text-zinc-200 border border-[#242630]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Vocal Style Selector */}
          {!isInstrumentalOnly && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-zinc-300">Vocal Style</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {VOCAL_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => {
                      setVocalStyle(style);
                      setSelectedVoiceProfileId('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer truncate ${
                      vocalStyle === style && !selectedVoiceProfileId
                        ? 'bg-zinc-700 text-zinc-100 border border-zinc-600 font-medium'
                        : 'bg-[#14151a] text-zinc-400 hover:text-zinc-200 border border-[#242630]'
                    }`}
                  >
                    {style}
                  </button>
                ))}

                {voiceProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => {
                      setSelectedVoiceProfileId(profile.id);
                      setVocalStyle(`AI Voice (${profile.name})`);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer truncate ${
                      selectedVoiceProfileId === profile.id
                        ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 font-medium'
                        : 'bg-[#14151a] text-zinc-400 hover:text-zinc-200 border border-[#242630]'
                    }`}
                  >
                    Custom: {profile.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expandable Advanced Settings (Tempo, Instruments, Translation) */}
        <div className="border-t border-[#242630] pt-3">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="flex items-center justify-between w-full py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <span>Advanced settings (Tempo, Instruments, Translation)</span>
            {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isAdvancedOpen && (
            <div className="mt-4 pt-3 border-t border-[#20222a] space-y-4">
              {/* Tempo / BPM */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Tempo</span>
                  <span className="font-mono text-zinc-200">{bpm} BPM</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="160"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value))}
                  className="w-full accent-pink-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Instruments Selection */}
              <div className="space-y-1.5">
                <div className="text-xs text-zinc-400">Instruments</div>
                <div className="flex flex-wrap gap-1.5">
                  {INSTRUMENT_OPTIONS.map((inst) => {
                    const isSelected = selectedInstruments.includes(inst);
                    return (
                      <button
                        key={inst}
                        type="button"
                        onClick={() => toggleInstrument(inst)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-700 text-zinc-100 border border-zinc-600'
                            : 'bg-[#14151a] text-zinc-500 hover:text-zinc-300 border border-[#242630]'
                        }`}
                      >
                        {inst}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Translation Option */}
              <div className="p-3 rounded-xl bg-[#14151a] border border-[#242630] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={translationEnabled}
                    onChange={(e) => setTranslationEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-pink-500"
                  />
                  <span className="text-xs font-medium text-zinc-300">
                    Enable multi-language translation for lyrics
                  </span>
                </label>

                {translationEnabled && (
                  <div className="flex items-center gap-2 pt-1 pl-5">
                    <span className="text-xs text-zinc-400">Target language:</span>
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                    >
                      {TARGET_LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Model Selector near creation controls */}
        <div className="border-t border-[#242630] pt-4">
          <ModelSelector
            selectedModelId={selectedModel}
            onSelectModel={setSelectedModel}
            currentUser={currentUser}
            label="Model Engine"
          />
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleCreateSong}
            disabled={isGenerating}
            className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-pink-500/20"
          >
            {isGenerating ? (
              <>
                <Disc className="w-4 h-4 animate-spin text-white" />
                <span>{generationStep || 'Creating song...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create song</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Area (Compact when empty, expands when song is available) */}
      <div className="rounded-2xl bg-[#18191f] border border-[#262832] p-5 sm:p-6">
        {!generatedVersion ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-9 h-9 mx-auto rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400">
              <Music2 className="w-4 h-4" />
            </div>
            <div className="text-xs font-medium text-zinc-300">No song created yet</div>
            <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
              Describe a theme above or paste lyrics, then click Create song to synthesize your track.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242630] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-zinc-100">
                    {generatedVersion.title || title}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {generatedVersion.genre}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {generatedVersion.tempo} • {generatedVersion.vocalType} • Model: {getModelById(generatedVersion.modelId || 'mars').name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveToProjects}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <span>Save to Projects</span>
                  )}
                </button>

                {onOpenStudioWithSong && (
                  <button
                    type="button"
                    onClick={() => onOpenStudioWithSong(generatedVersion)}
                    className="px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Open in Song Studio</span>
                  </button>
                )}
              </div>
            </div>

            {/* Waveform Player */}
            <WaveformPlayer
              version={generatedVersion}
              isPlaying={isPlaying}
              currentTime={currentTime}
              onPlayPause={handlePlayPause}
              onSeek={(sec) => {
                setCurrentTime(sec);
                audioEngine.seek(sec);
              }}
              onOpenRegenerate={() => {}}
            />

            {/* Lyrics preview */}
            {generatedVersion.lyricsLines && generatedVersion.lyricsLines.length > 0 && (
              <div className="p-4 rounded-xl bg-[#14151a] border border-[#242630] space-y-2">
                <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Generated Lyrics
                </div>
                <div className="space-y-1.5 text-xs text-zinc-300">
                  {generatedVersion.lyricsLines.map((line) => (
                    <div key={line.id} className="flex items-baseline gap-3">
                      <span className="text-[10px] text-zinc-400 font-mono w-16 shrink-0">
                        {line.section}
                      </span>
                      <span>{line.originalText}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stem Downloads */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#242630]">
              <div className="text-xs text-zinc-400">Export lossless stems:</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadWav('master')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3 h-3 text-zinc-400" />
                  <span>Master WAV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadWav('instrumental')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3 h-3 text-zinc-400" />
                  <span>Instrumental</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadWav('vocals')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3 h-3 text-zinc-400" />
                  <span>Vocals</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
