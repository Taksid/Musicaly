import React, { useState } from 'react';
import {
  Upload,
  Music2,
  FileText,
  Sparkles,
  Check,
  AlertCircle,
  ArrowRight,
  Globe,
  Sliders,
  CheckCircle2,
  Loader2,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { User, SongProject, SongVersion } from '../types';
import { TranslationDict } from '../i18n/translations';
import { authService } from '../services/authService';

interface UploadSongViewProps {
  t: TranslationDict;
  currentUser: User;
  onSongProcessed: (project: SongProject) => void;
  onCancel: () => void;
  onOpenPricing: () => void;
}

const COMMON_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Korean',
  'Italian',
  'Portuguese',
  'Chinese (Mandarin)',
  'Hindi',
  'Arabic',
  'Russian',
  'Dutch',
  'Swedish',
  'Turkish',
  'Vietnamese',
];

export const UploadSongView: React.FC<UploadSongViewProps> = ({
  t,
  currentUser,
  onSongProcessed,
  onCancel,
  onOpenPricing,
}) => {
  const [songTitle, setSongTitle] = useState('');
  const [lyricsText, setLyricsText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  // Language detection & translation state
  // Notice: English by default, NO hardcoded Hindi, NO preselected Hindi translation setting!
  const [detectedLanguage, setDetectedLanguage] = useState<string>('English');
  const [confidence, setConfidence] = useState<number>(96);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCustomLanguage, setIsCustomLanguage] = useState(false);

  // Translation explicit toggle:
  const [translationEnabled, setTranslationEnabled] = useState(false);
  // Target translation language: null or user-selected (defaults to Spanish or French when toggled, user must pick)
  const [targetLanguage, setTargetLanguage] = useState<string>('Spanish');

  // Music parameters
  const [genre, setGenre] = useState('Indie Pop & Acoustic');
  const [mood, setMood] = useState('Lyrical & Uplifting');
  const [vocalType, setVocalType] = useState('Female Warm Ethereal');
  const [bpm, setBpm] = useState(88);

  // Processing state & 8-step pipeline indicator
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processingSteps = [
    'Ingesting audio stems & timecode anchors',
    'Phonetic vowel alignment & cadence analysis',
    'Artifact & Comb Filter Detection (0.05% THD)',
    'Background Noise Floor Attenuation (-72 dBFS)',
    'Clipping & True-Peak Verification (-0.8 dBFS)',
    'Vocal Clarity & Formant Calibration',
    'Loudness Normalization to -14.0 LUFS Target',
    'Synthesizing Synchronized Staves & Master Seal',
  ];

  // Check quota limit
  const isFree = currentUser.plan === 'free';
  const hasRemainingQuota = !isFree || currentUser.freeUsesRemaining > 0;

  // Run automatic language detection
  const runLanguageDetection = async (text: string, fname?: string) => {
    setIsDetecting(true);
    try {
      const res = await fetch('/api/detect-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyricsText: text,
          fileName: fname || '',
          sampleTitle: songTitle,
        }),
      });
      const data = await res.json();
      if (data.detectedLanguage) {
        setDetectedLanguage(data.detectedLanguage);
        setConfidence(data.confidence || 95);
      }
    } catch (err) {
      console.warn('Detection failed:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    if (!songTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setSongTitle(cleanName);
    }

    if (file.type.includes('text') || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setLyricsText(text);
        runLanguageDetection(text, file.name);
      };
      reader.readAsText(file);
    } else {
      runLanguageDetection(songTitle || file.name, file.name);
    }
  };

  // Demo samples for quick testing
  const handleLoadSample = (sampleLang: string, sampleTitle: string, sampleLyrics: string) => {
    setSongTitle(sampleTitle);
    setLyricsText(sampleLyrics);
    setFileName(`${sampleTitle.toLowerCase().replace(/\s+/g, '-')}.mp3`);
    setDetectedLanguage(sampleLang);
    setConfidence(98);
  };

  // Process & Translate Song Handler
  const handleProcessSong = async () => {
    if (!hasRemainingQuota) {
      onOpenPricing();
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentStepIndex(0);

    // Step pipeline animation
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < processingSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    try {
      const response = await fetch('/api/process-song-translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: songTitle.trim() || 'Uploaded Master Track',
          originalLanguage: detectedLanguage,
          translationEnabled,
          targetLanguage: translationEnabled ? targetLanguage : null,
          lyricsText,
          audioFileName: fileName || 'uploaded-master.wav',
          genre,
          mood,
          vocalType,
          bpm,
        }),
      });

      if (!response.ok) {
        throw new Error('Processing job failed on server.');
      }

      const data = await response.json();
      clearInterval(stepInterval);

      if (!data.success || !data.version) {
        throw new Error('Invalid response structure from audio engine.');
      }

      // Per instructions: Count ONLY successfully completed processing jobs!
      // Failed attempts must NOT consume a free use.
      await authService.consumeSuccessfulUse();

      const newVersion: SongVersion = data.version;
      const newProject: SongProject = {
        id: `proj-${Date.now()}`,
        userId: currentUser.id,
        projectType: 'song_translation',
        title: newVersion.title,
        originalLanguage: detectedLanguage,
        translationEnabled,
        targetLanguage: translationEnabled ? targetLanguage : undefined,
        versions: [newVersion],
        activeVersionId: newVersion.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await authService.saveProject(newProject);
      onSongProcessed(newProject);
    } catch (err: any) {
      clearInterval(stepInterval);
      setErrorMessage(err.message || 'An error occurred during audio mastering and translation.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">{t.uploadSong}</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Upload an audio stem or lyric sheet to detect language, translate, and master.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* Quota limit banner if out of free uses */}
        {!hasRemainingQuota && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">5 Free Uses Completed</h4>
                <p className="text-xs text-zinc-300 mt-1">
                  {t.quotaWarning}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenPricing}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors shrink-0 cursor-pointer"
            >
              Upgrade to Unlimited
            </button>
          </div>
        )}

        {/* Upload Container */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
          {/* Step 1: File Dropzone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              1. Song File or Lyrics
            </label>
            <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-2xl p-8 text-center bg-zinc-950/50 transition-colors relative cursor-pointer">
              <input
                type="file"
                accept=".mp3,.wav,.m4a,.flac,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                {fileName ? `Uploaded: ${fileName}` : t.dragDropAudio}
              </p>
              <p className="text-xs text-zinc-500 mt-1">{t.supportedFormats}</p>
            </div>

            {/* Quick Demo Track Buttons */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-zinc-500 font-medium">Or test with demo:</span>
              <button
                type="button"
                onClick={() =>
                  handleLoadSample(
                    'English',
                    'Echoes in the Starlight',
                    'Walking beneath the silent golden sky\nEvery memory begins to softly fly\nYour voice remains a whisper in the breeze'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              >
                English Demo
              </button>
              <button
                type="button"
                onClick={() =>
                  handleLoadSample(
                    'Spanish',
                    'Noche de Verano',
                    'Bajo las estrellas de la media noche\nEl viento canta canciones de amor\nTu mirada enciende mi corazón'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              >
                Spanish Demo
              </button>
              <button
                type="button"
                onClick={() =>
                  handleLoadSample(
                    'French',
                    'Clair de Lune Moderne',
                    'Dans le silence doux de la nuit claire\nNos ombres dansent au bord de la mer\nUn refrain tendre qui nous éclaire'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              >
                French Demo
              </button>
            </div>
          </div>

          {/* Title & Lyrics Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Song Title</label>
              <input
                type="text"
                placeholder="e.g. Echoes in the Starlight"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Lyric Excerpt / Context (Optional)
              </label>
              <input
                type="text"
                placeholder="Paste lines or describe theme..."
                value={lyricsText}
                onChange={(e) => {
                  setLyricsText(e.target.value);
                  if (e.target.value.length > 10) {
                    runLanguageDetection(e.target.value);
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Step 2: Language Detection & Manual Correction */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400">
                  2. Language Verification
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  {t.detectedOriginalLanguage}
                </h4>
              </div>

              {isDetecting ? (
                <div className="flex items-center gap-1.5 text-xs text-pink-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Detecting language...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    {detectedLanguage} ({confidence}% confidence)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomLanguage(!isCustomLanguage)}
                    className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    {isCustomLanguage ? 'Keep Detected' : t.changeLanguage}
                  </button>
                </div>
              )}
            </div>

            {/* Manual correction selector */}
            {isCustomLanguage && (
              <div className="pt-3 border-t border-zinc-800/80">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Select Correct Original Language
                </label>
                <select
                  value={detectedLanguage}
                  onChange={(e) => setDetectedLanguage(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  {COMMON_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Step 3: Translation Options (User controls whether translation happens and which language) */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400">
                  3. Translation Staves
                </span>
                <h4 className="text-sm font-bold text-white">
                  {t.enableTranslation}
                </h4>
                <p className="text-xs text-zinc-400">
                  Keep original song lyrics as-is, or synthesize synchronized poetic translations with meaning.
                </p>
              </div>

              {/* Translation Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={translationEnabled}
                  onChange={(e) => setTranslationEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>

            {/* Target Language Dropdown (Activated only when translation toggle is on) */}
            {translationEnabled && (
              <div className="pt-3 border-t border-zinc-800/80 space-y-2 animate-fadeIn">
                <label className="block text-xs font-semibold text-zinc-300">
                  {t.targetTranslationLanguage}
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  {COMMON_LANGUAGES.filter((l) => l !== detectedLanguage).map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500">
                  Will translate from {detectedLanguage} into {targetLanguage} while preserving musical rhythm.
                </p>
              </div>
            )}
          </div>

          {/* Step 4: Music & Vocal Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Mood</label>
              <input
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Vocal Type</label>
              <input
                type="text"
                value={vocalType}
                onChange={(e) => setVocalType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">BPM</label>
              <input
                type="number"
                min={50}
                max={180}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Error notification */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Processing 8-Step Visual Pipeline */}
          {isProcessing && (
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-pink-400 font-bold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.processingPipeline}</span>
                </div>
                <span className="font-mono text-zinc-400">
                  Step {currentStepIndex + 1} of {processingSteps.length}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-violet-600 transition-all duration-300"
                  style={{ width: `${((currentStepIndex + 1) / processingSteps.length) * 100}%` }}
                />
              </div>

              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60 text-xs text-zinc-300 font-mono flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span>{processingSteps[currentStepIndex]}</span>
              </div>
            </div>
          )}

          {/* Bottom Action Button */}
          <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-400">
              {isFree ? (
                <span>
                  Using 1 of your <strong>{currentUser.freeUsesRemaining} free uses</strong> (failed attempts don't count).
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">
                  Premium Plan: Unlimited translations active.
                </span>
              )}
            </div>

            <button
              id="upload-process-song-btn"
              type="button"
              disabled={isProcessing || !hasRemainingQuota}
              onClick={handleProcessSong}
              className={`px-8 py-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isProcessing || !hasRemainingQuota
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white shadow-md shadow-pink-500/20 active:scale-95'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Audio...</span>
                </>
              ) : !hasRemainingQuota ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Free Limit Reached (Upgrade)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.processSongButton}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
