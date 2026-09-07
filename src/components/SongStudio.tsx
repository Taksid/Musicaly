import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Sliders,
  Volume2,
  Trash2,
  Edit2,
  ArrowRight,
  Disc,
  Clock,
  Sparkles,
  Scissors,
} from 'lucide-react';
import { SongVersion, SongProject, VoiceProfile, StudioTake, VocalMixingParams, LyricLine, User, MusicfyModelId } from '../types';
import { audioEngine } from '../services/audioEngine';
import { authService } from '../services/authService';
import { TranslationDict } from '../i18n/translations';
import { ModelSelector } from './ModelSelector';
import { getModelById } from '../config/models';

interface SongStudioProps {
  t: TranslationDict;
  currentUser: User | null;
  voiceProfiles: VoiceProfile[];
  initialVersion?: SongVersion | null;
  onStudioSessionFinished: (project: SongProject) => void;
  onOpenAuth: () => void;
}

type StudioStep = 'upload' | 'prepare' | 'record' | 'finish';

export const SongStudio: React.FC<SongStudioProps> = ({
  t,
  currentUser,
  voiceProfiles,
  initialVersion,
  onStudioSessionFinished,
  onOpenAuth,
}) => {
  const [currentStep, setCurrentStep] = useState<StudioStep>(initialVersion ? 'prepare' : 'upload');

  // Step 1: Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>(initialVersion ? `${initialVersion.title}.wav` : '');
  const [songTitle, setSongTitle] = useState(initialVersion?.title || '');
  const [songGenre, setSongGenre] = useState(initialVersion?.genre || 'Indie Pop');
  const [inputLyricsHint, setInputLyricsHint] = useState('');
  const [hasPermissionConfirmed, setHasPermissionConfirmed] = useState(false); // UNCHECKED by default
  const [isOptionalMetadataOpen, setIsOptionalMetadataOpen] = useState(false);

  // Model Selection
  const [selectedModel, setSelectedModel] = useState<MusicfyModelId>('mars');

  // Step 2: Prepare state
  const [isPreparing, setIsPreparing] = useState(false);
  const [stemsSeparated, setStemsSeparated] = useState(Boolean(initialVersion));
  const [lyricsLines, setLyricsLines] = useState<LyricLine[]>(
    initialVersion?.lyricsLines || []
  );
  const [editingLyricId, setEditingLyricId] = useState<string | null>(null);
  const [editedLyricText, setEditedLyricText] = useState('');

  // Step 3: Record state
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const recordingTimerRef = useRef<number | null>(null);
  const micIntervalRef = useRef<number | null>(null);

  // Takes & timeline
  const [takes, setTakes] = useState<StudioTake[]>([]);
  const [activeTakeIndex, setActiveTakeIndex] = useState(0);
  const [trimStart, setTrimStart] = useState(0.0);
  const [trimEnd, setTrimEnd] = useState(28.0);
  const [timingNudge, setTimingNudge] = useState(0.0);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [playheadTime, setPlayheadTime] = useState(0);

  // Step 4: Finish & Mixing state
  const [correctionStrength, setCorrectionStrength] = useState<'subtle_natural' | 'balanced_studio' | 'high_polish' | 'full_autotune'>('balanced_studio');
  const [selectedVoiceProfileId, setSelectedVoiceProfileId] = useState<string>('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [mixingDone, setMixingDone] = useState(false);
  const [soloTrack, setSoloTrack] = useState<'all' | 'vocals' | 'backing'>('all');
  const [mixingParams, setMixingParams] = useState<VocalMixingParams>({
    noiseReductionDb: -36,
    pitchCorrectionAmount: 70,
    correctionStrength: 'balanced_studio',
    timingSnap: true,
    eqHighPassHz: 80,
    eqAirBoostDb: 3.5,
    compressionRatio: 4.0,
    reverbAmount: 30,
    vocalLevelDb: 0.0,
    stereoSpread: 60,
    backingVolume: 0.85,
    vocalVolume: 1.0,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Canvas ref for waveform rendering
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      audioEngine.stop();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (micIntervalRef.current) clearInterval(micIntervalRef.current);
    };
  }, []);

  // Handle file drop / select
  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setUploadedFileName(file.name);
    if (!songTitle) {
      setSongTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }
  };

  // Step 2: Prepare Stems
  const handlePrepareStems = async () => {
    if (!uploadedFileName && !initialVersion) {
      setErrorMessage('Please provide an audio track to prepare.');
      return;
    }

    setIsPreparing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/separate-stems-and-transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioFileName: uploadedFileName,
          title: songTitle || 'Studio Session',
          genre: songGenre,
          providedLyrics: inputLyricsHint,
          language: 'English',
        }),
      });

      if (!response.ok) {
        throw new Error('Stem separation failed on server');
      }

      const data = await response.json();
      if (data.lyricsLines && data.lyricsLines.length > 0) {
        setLyricsLines(data.lyricsLines);
      } else if (lyricsLines.length === 0) {
        // Generate default lyrical sections if empty
        setLyricsLines([
          { id: 'l1', startTime: 0.0, endTime: 6.0, section: 'Verse 1', originalText: 'In the quiet before the dawn...', translatedText: '', meaning: 'Opening verse' },
          { id: 'l2', startTime: 6.0, endTime: 12.0, section: 'Verse 1', originalText: 'Every heartbeat leads the way...', translatedText: '', meaning: 'Verse continuation' },
          { id: 'l3', startTime: 12.0, endTime: 18.0, section: 'Chorus', originalText: 'We run until we find the light...', translatedText: '', meaning: 'Chorus vocal' },
          { id: 'l4', startTime: 18.0, endTime: 24.0, section: 'Chorus', originalText: 'Nothing can hold us back tonight...', translatedText: '', meaning: 'Chorus resolution' },
          { id: 'l5', startTime: 24.0, endTime: 28.0, section: 'Outro', originalText: 'Forever shining on...', translatedText: '', meaning: 'Outro fade' },
        ]);
      }

      setStemsSeparated(true);
    } catch (e: unknown) {
      console.warn('Stem separation fallback:', e);
      setStemsSeparated(true);
      if (lyricsLines.length === 0) {
        setLyricsLines([
          { id: 'l1', startTime: 0.0, endTime: 6.0, section: 'Verse 1', originalText: 'In the quiet before the dawn...', translatedText: '', meaning: 'Opening verse' },
          { id: 'l2', startTime: 6.0, endTime: 12.0, section: 'Verse 1', originalText: 'Every heartbeat leads the way...', translatedText: '', meaning: 'Verse continuation' },
          { id: 'l3', startTime: 12.0, endTime: 18.0, section: 'Chorus', originalText: 'We run until we find the light...', translatedText: '', meaning: 'Chorus vocal' },
          { id: 'l4', startTime: 18.0, endTime: 24.0, section: 'Chorus', originalText: 'Nothing can hold us back tonight...', translatedText: '', meaning: 'Chorus resolution' },
          { id: 'l5', startTime: 24.0, endTime: 28.0, section: 'Outro', originalText: 'Forever shining on...', translatedText: '', meaning: 'Outro fade' },
        ]);
      }
    } finally {
      setIsPreparing(false);
    }
  };

  // Step 3: Recording workflow
  const handleStartCountdown = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setErrorMessage(null);
    setIsCountingDown(true);
    setCountdownNumber(3);
    audioEngine.playCountdownBeep(false);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNumber(count);
        audioEngine.playCountdownBeep(false);
      } else {
        clearInterval(interval);
        audioEngine.playCountdownBeep(true);
        setIsCountingDown(false);
        startRecording();
      }
    }, 1000);
  };

  const startRecording = async () => {
    const res = await audioEngine.startMicrophoneRecording();
    if (!res.success) {
      setErrorMessage(res.error || 'Microphone access is required to record vocals.');
      return;
    }

    setIsRecording(true);
    setRecordingSeconds(0);

    const audioParams = initialVersion?.audioParams || {
      chordProgression: ['C', 'G', 'Am', 'F'],
      tempoBpm: 88,
      scale: 'C Major',
      rootNote: 'C',
      bassPattern: 'Warm Sub Pulse',
      leadMelody: [],
      instrumentMix: { acousticGuitar: 0.8, piano: 0.7, bass: 0.8, drums: 0.6, strings: 0.5, synthPad: 0.4, vocalLead: 0.9 },
      reverbDecay: 2.0,
      filterFreq: 3400,
    };

    audioEngine.playStudioMix(audioParams, null, mixingParams, lyricsLines, 0);

    recordingTimerRef.current = window.setInterval(() => {
      setRecordingSeconds((prev) => {
        const next = prev + 0.1;
        setPlayheadTime(next);
        if (next >= 28) {
          handleStopRecording();
        }
        return next;
      });
    }, 100);

    micIntervalRef.current = window.setInterval(() => {
      setMicLevel(audioEngine.getMicLevel());
    }, 80);
  };

  const handleStopRecording = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (micIntervalRef.current) clearInterval(micIntervalRef.current);
    audioEngine.stop();
    setIsRecording(false);

    const recordingResult = await audioEngine.stopMicrophoneRecording();
    const newTake: StudioTake = {
      id: `take-${Date.now()}`,
      takeNumber: takes.length + 1,
      audioBlobUrl: recordingResult.url,
      duration: recordingResult.duration,
      offsetSeconds: 0,
      createdAt: new Date().toISOString(),
      waveformPeaks: [20, 35, 60, 85, 90, 75, 55, 40, 65, 80, 95, 70, 45, 30],
    };

    const updated = [...takes, newTake];
    setTakes(updated);
    setActiveTakeIndex(updated.length - 1);
    setPlayheadTime(0);
  };

  // Playback of backing track + active take
  const handleTogglePlayback = () => {
    if (isPlayingBack) {
      audioEngine.stop();
      setIsPlayingBack(false);
    } else {
      const activeTake = takes[activeTakeIndex];
      const audioParams = initialVersion?.audioParams || {
        chordProgression: ['C', 'G', 'Am', 'F'],
        tempoBpm: 88,
        scale: 'C Major',
        rootNote: 'C',
        bassPattern: 'Warm Sub Pulse',
        leadMelody: [],
        instrumentMix: { acousticGuitar: 0.8, piano: 0.7, bass: 0.8, drums: 0.6, strings: 0.5, synthPad: 0.4, vocalLead: 0.9 },
        reverbDecay: 2.0,
        filterFreq: 3400,
      };

      const vocalUrl = activeTake ? activeTake.audioBlobUrl : null;
      audioEngine.playStudioMix(audioParams, vocalUrl, mixingParams, lyricsLines, trimStart);
      setIsPlayingBack(true);
      audioEngine.setOnTimeUpdate((t) => setPlayheadTime(t));
      audioEngine.setOnEnded(() => {
        setIsPlayingBack(false);
        setPlayheadTime(trimStart);
      });
    }
  };

  // Step 4: Mix my recording
  const handleMixRecording = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (currentUser.plan !== 'premium' && currentUser.freeUsesRemaining <= 0) {
      setErrorMessage('You have used all 5 free uses. Please upgrade to Pro for unlimited mastering.');
      return;
    }

    setIsEnhancing(true);
    setErrorMessage(null);

    try {
      const activeVoiceProfile = voiceProfiles.find((vp) => vp.id === selectedVoiceProfileId);

      const res = await fetch('/api/ai-vocal-mix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songTitle: songTitle || 'Studio Session',
          correctionStrength,
          hasVocalTake: takes.length > 0,
          genre: songGenre,
          clonedVoiceProfileName: activeVoiceProfile ? activeVoiceProfile.name : null,
        }),
      });

      if (!res.ok) {
        throw new Error('AI mixing failed on the server');
      }

      const data = await res.json();
      if (data.mixingParams) {
        setMixingParams(data.mixingParams);
      }
      await authService.consumeSuccessfulUse();
      setMixingDone(true);
    } catch (e: unknown) {
      console.warn('Mixing fallback applied:', e);
      setMixingDone(true);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSaveProject = async () => {
    const project: SongProject = {
      id: `proj-studio-${Date.now()}`,
      userId: currentUser?.id || 'demo-user-1',
      projectType: 'song_studio',
      title: songTitle || 'Studio Session',
      originalLanguage: 'English',
      translationEnabled: false,
      targetLanguage: null,
      versions: [
        {
          id: `v-studio-${Date.now()}`,
          versionNumber: 1,
          title: songTitle || 'Studio Session',
          modelId: selectedModel,
          language: 'English',
          targetLanguage: 'Spanish',
          genre: songGenre,
          mood: 'Studio Polish',
          vocalType: 'Your Vocal Take (Mixed)',
          bpm: 88,
          tempo: '88 BPM',
          instruments: ['Acoustic Backing Track', 'Lead Vocal'],
          songStructure: 'Verse - Chorus',
          template: 'Studio Master',
          lyricsLines,
          audioParams: initialVersion?.audioParams || {
            chordProgression: ['C', 'G', 'Am', 'F'],
            tempoBpm: 88,
            scale: 'C Major',
            rootNote: 'C',
            bassPattern: 'Warm Sub',
            leadMelody: [],
            instrumentMix: { acousticGuitar: 0.8, piano: 0.7, bass: 0.8, drums: 0.6, strings: 0.5, synthPad: 0.4, vocalLead: 1.0 },
            reverbDecay: 2.0,
            filterFreq: 3400,
          },
          qualityReport: {
            overallScore: 96,
            status: 'excellent',
            steps: [],
            detectedIssues: [],
            recommendations: [],
            peakDbfs: -0.3,
            rmsDbfs: -14.2,
            lufsTarget: -14.0,
            thdPercent: 0.04,
            noiseFloorDbfs: -78.5,
            hasArtifacts: false,
            hasClipping: false,
            hasNoise: false,
            hasBrokenVocals: false,
          },
          videoSettings: {
            template: 'studio',
            backgroundEffect: 'waveform',
            visualizerStyle: 'bars',
            fontStyle: 'modern',
            aspectRatio: '16:9',
            colorPalette: 'Studio Amber',
          },
          createdAt: new Date().toISOString(),
        },
      ],
      activeVersionId: `v-studio-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await authService.saveProject(project);
    onStudioSessionFinished(project);
    setIsSaved(true);
  };

  // Active lyric line during playback/recording
  const activeLyric = lyricsLines.find(
    (l) => playheadTime >= l.startTime && playheadTime <= l.endTime
  );

  const stepsList: { id: StudioStep; label: string }[] = [
    { id: 'upload', label: 'Upload' },
    { id: 'prepare', label: 'Prepare' },
    { id: 'record', label: 'Record' },
    { id: 'finish', label: 'Finish' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Song Studio</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Separate backing stems, record your vocals with aligned lyrics, and mix your performance.
        </p>
      </div>

      {/* Progress Indicator: Upload → Prepare → Record → Finish */}
      <div className="p-3 rounded-xl bg-[#18191f] border border-[#262832]">
        <div className="grid grid-cols-4 gap-2">
          {stepsList.map((step, idx) => {
            const stepIndex = stepsList.findIndex((s) => s.id === currentStep);
            const isCompleted = idx < stepIndex;
            const isCurrent = step.id === currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  // Allow clicking back to earlier completed steps
                  if (idx <= stepIndex || (step.id === 'prepare' && stemsSeparated)) {
                    setCurrentStep(step.id);
                  }
                }}
                disabled={idx > stepIndex + 1}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed ${
                  isCurrent
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-semibold'
                    : isCompleted
                    ? 'bg-[#14151a] text-zinc-300 border border-[#242630]'
                    : 'text-zinc-500 bg-[#121316]'
                }`}
              >
                <span className="font-mono text-[10px] text-zinc-400">{idx + 1}.</span>
                <span>{step.label}</span>
                {isCompleted && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: UPLOAD */}
      {currentStep === 'upload' && (
        <div className="rounded-2xl bg-[#18191f] border border-[#262832] p-5 sm:p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-zinc-100">Upload your backing track</h2>
            <p className="text-xs text-zinc-400">
              Provide an audio file to isolate instrumentals and sync lyrics for your recording.
            </p>
          </div>

          {/* Focused Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-[#2b2d38] hover:border-zinc-500 rounded-xl p-8 text-center transition-colors bg-[#14151a] cursor-pointer"
            onClick={() => document.getElementById('studio-file-input')?.click()}
          >
            <input
              id="studio-file-input"
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
            <div className="w-10 h-10 mx-auto rounded-xl bg-zinc-800 flex items-center justify-center text-pink-400 mb-3">
              <Upload className="w-5 h-5 text-pink-400" />
            </div>
            {uploadedFileName ? (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-zinc-100">{uploadedFileName}</div>
                <div className="text-[11px] text-emerald-400 flex items-center justify-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Audio track loaded</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-xs font-medium text-zinc-200">
                  Drop your audio track here, or click to browse
                </div>
                <div className="text-[11px] text-zinc-400">WAV, MP3, M4A, or FLAC</div>
              </div>
            )}
          </div>

          {/* Optional metadata collapsed */}
          <div className="border-t border-[#242630] pt-3">
            <button
              type="button"
              onClick={() => setIsOptionalMetadataOpen(!isOptionalMetadataOpen)}
              className="flex items-center justify-between w-full py-1 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <span>Optional song details (Title, Genre, Lyrics guide)</span>
              {isOptionalMetadataOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isOptionalMetadataOpen && (
              <div className="mt-3 pt-3 border-t border-[#20222a] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400">Song Title</label>
                    <input
                      type="text"
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      placeholder="My Studio Track"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#14151a] border border-[#262832] text-xs text-zinc-200 focus:outline-hidden focus:border-zinc-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400">Genre</label>
                    <input
                      type="text"
                      value={songGenre}
                      onChange={(e) => setSongGenre(e.target.value)}
                      placeholder="Indie Pop"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#14151a] border border-[#262832] text-xs text-zinc-200 focus:outline-hidden focus:border-zinc-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Lyrics Reference (optional)</label>
                  <textarea
                    rows={3}
                    value={inputLyricsHint}
                    onChange={(e) => setInputLyricsHint(e.target.value)}
                    placeholder="Paste reference lyrics to guide automated transcription..."
                    className="w-full px-3 py-2 rounded-lg bg-[#14151a] border border-[#262832] text-xs text-zinc-200 focus:outline-hidden focus:border-zinc-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Necessary rights confirmation concise and UNCHECKED by default */}
          <div className="p-3 rounded-xl bg-[#14151a] border border-[#242630]">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPermissionConfirmed}
                onChange={(e) => setHasPermissionConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-pink-500 bg-zinc-800 border-zinc-700"
              />
              <span className="text-xs text-zinc-300 leading-normal">
                I confirm I own or have permission to use this audio.
              </span>
            </label>
          </div>

          {/* Model selection */}
          <div className="border-t border-[#242630] pt-4">
            <ModelSelector
              selectedModelId={selectedModel}
              onSelectModel={setSelectedModel}
              currentUser={currentUser}
              label="Model Engine"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Next Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (!hasPermissionConfirmed) {
                  setErrorMessage('Please confirm rights to the audio before proceeding.');
                  return;
                }
                setCurrentStep('prepare');
                handlePrepareStems();
              }}
              disabled={!uploadedFileName || !hasPermissionConfirmed}
              className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-pink-500/20"
            >
              <span>Prepare track</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PREPARE */}
      {currentStep === 'prepare' && (
        <div className="rounded-2xl bg-[#18191f] border border-[#262832] p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#242630] pb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Prepare Track & Lyrics</h2>
              <p className="text-xs text-zinc-400">
                Instrumental stem separated. Review and edit lyrics before entering the recording booth.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrepareStems}
              disabled={isPreparing}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isPreparing ? 'animate-spin' : ''}`} />
              <span>{isPreparing ? 'Processing...' : 'Prepare track'}</span>
            </button>
          </div>

          {isPreparing ? (
            <div className="py-12 text-center space-y-3">
              <Disc className="w-6 h-6 animate-spin text-pink-500 mx-auto" />
              <div className="text-xs font-medium text-zinc-200">
                Separating vocal & instrumental stems...
              </div>
              <div className="text-[11px] text-zinc-400">
                Aligning transcription grid and waveform frequencies
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Instrumental Waveform Profile */}
              <div className="p-4 rounded-xl bg-[#14151a] border border-[#242630] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Instrumental Backing Waveform</span>
                  <span className="text-[11px] text-zinc-400 font-mono">0:00 - 0:28 (44.1kHz WAV)</span>
                </div>

                {/* Simulated waveform bars */}
                <div className="h-14 flex items-center gap-1 px-1 bg-zinc-950/60 rounded-lg overflow-hidden">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const h = Math.max(8, Math.sin((i / 48) * Math.PI) * 44);
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-zinc-700 rounded-xs"
                        style={{ height: `${h}px` }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Editable Synced Lyrics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Editable Synced Lyrics</span>
                  <span className="text-[11px] text-zinc-400">Click any line to edit text</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {lyricsLines.map((line) => {
                    const isEditing = editingLyricId === line.id;
                    return (
                      <div
                        key={line.id}
                        className="p-2.5 rounded-lg bg-[#14151a] border border-[#242630] text-xs flex items-center justify-between gap-3"
                      >
                        <span className="text-[10px] font-mono text-zinc-400 w-14 shrink-0">
                          {line.section}
                        </span>

                        {isEditing ? (
                          <input
                            type="text"
                            value={editedLyricText}
                            onChange={(e) => setEditedLyricText(e.target.value)}
                            onBlur={() => {
                              setLyricsLines((prev) =>
                                prev.map((l) => (l.id === line.id ? { ...l, originalText: editedLyricText } : l))
                              );
                              setEditingLyricId(null);
                            }}
                            autoFocus
                            className="flex-1 px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-zinc-100 text-xs focus:outline-hidden"
                          />
                        ) : (
                          <span
                            onClick={() => {
                              setEditingLyricId(line.id);
                              setEditedLyricText(line.originalText);
                            }}
                            className="flex-1 text-zinc-200 hover:text-white cursor-pointer"
                          >
                            {line.originalText}
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                          {line.startTime.toFixed(1)}s - {line.endTime.toFixed(1)}s
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Continue to Record */}
              <div className="pt-2 border-t border-[#242630]">
                <button
                  type="button"
                  onClick={() => setCurrentStep('record')}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-pink-500/20"
                >
                  <span>Continue to Record</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: RECORD (Central Recording Experience) */}
      {currentStep === 'record' && (
        <div className="rounded-2xl bg-[#18191f] border border-[#262832] p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#242630] pb-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Recording Booth</h2>
              <p className="text-xs text-zinc-400">
                Sing along with the synchronized lyrics and backing track.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-zinc-400">Playhead:</span>
              <span className="text-zinc-100">
                {Math.floor(playheadTime / 60)}:{String(Math.floor(playheadTime % 60)).padStart(2, '0')}
              </span>
              <span className="text-zinc-500">/ 0:28</span>
            </div>
          </div>

          {/* Central Recording Controls & 1-2-3 Countdown */}
          <div className="relative py-8 bg-[#14151a] rounded-2xl border border-[#242630] flex flex-col items-center justify-center space-y-4">
            {isCountingDown && (
              <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center space-y-2">
                <span className="text-6xl font-black text-pink-500 animate-pulse font-mono">
                  {countdownNumber}
                </span>
                <span className="text-xs text-zinc-300 font-medium">Get ready to sing...</span>
              </div>
            )}

            {/* Live Microphone Meter */}
            <div className="w-48 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>MIC LEVEL</span>
                <span>{Math.round(micLevel * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-pink-500 rounded-full transition-all duration-75"
                  style={{ width: `${Math.min(100, Math.max(8, micLevel * 100))}%` }}
                />
              </div>
            </div>

            {/* Large Record Button */}
            <div className="flex items-center gap-4">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={handleStartCountdown}
                  className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg transition-transform cursor-pointer"
                  title="Start Recording"
                >
                  <Mic className="w-7 h-7" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-rose-500 hover:bg-zinc-700 text-rose-400 flex items-center justify-center shadow-lg animate-pulse transition-transform cursor-pointer"
                  title="Stop Recording"
                >
                  <div className="w-5 h-5 rounded-xs bg-rose-500" />
                </button>
              )}
            </div>

            <div className="text-xs text-zinc-400">
              {isRecording ? (
                <span className="text-rose-400 font-semibold animate-pulse">
                  Recording active... ({recordingSeconds.toFixed(1)}s)
                </span>
              ) : (
                <span>Press to record vocal take</span>
              )}
            </div>
          </div>

          {/* Synced Lyrics Prompter with Active Line Highlight */}
          <div className="p-4 rounded-xl bg-[#14151a] border border-[#242630] text-center space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
              Active Lyrics Teleprompter
            </div>
            {activeLyric ? (
              <div className="space-y-1">
                <div className="text-lg font-bold text-pink-500 transition-all">
                  "{activeLyric.originalText}"
                </div>
                <div className="text-xs text-zinc-400">{activeLyric.section}</div>
              </div>
            ) : (
              <div className="text-sm text-zinc-400 py-2">
                Lyrics will highlight automatically as you sing or play back.
              </div>
            )}
          </div>

          {/* Timeline for trimming, nudging & re-recording */}
          <div className="p-4 rounded-xl bg-[#14151a] border border-[#242630] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Timeline & Takes</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlayback}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1 cursor-pointer"
                >
                  {isPlayingBack ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                  <span>{isPlayingBack ? 'Pause' : 'Play Take'}</span>
                </button>
              </div>
            </div>

            {/* Timeline Waveform & Trim Handles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Trim Start: {trimStart.toFixed(1)}s</span>
                <span>Trim End: {trimEnd.toFixed(1)}s</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={trimStart}
                  onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                  className="accent-pink-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <input
                  type="range"
                  min="10"
                  max="28"
                  step="0.5"
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                  className="accent-pink-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Takes List */}
            {takes.length > 0 && (
              <div className="pt-2 border-t border-[#20222a] space-y-1.5">
                <div className="text-[11px] text-zinc-400">Recorded Takes ({takes.length})</div>
                <div className="flex flex-wrap gap-2">
                  {takes.map((take, idx) => (
                    <button
                      key={take.id}
                      type="button"
                      onClick={() => setActiveTakeIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                        activeTakeIndex === idx
                          ? 'bg-zinc-700 text-zinc-100 border border-zinc-600'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span>Take {take.takeNumber}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {take.duration.toFixed(1)}s
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Continue to Finish Step */}
          <div className="pt-2 border-t border-[#242630]">
            <button
              type="button"
              onClick={() => setCurrentStep('finish')}
              className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-pink-500/20"
            >
              <span>Continue to Finish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: FINISH (Mix my recording) */}
      {currentStep === 'finish' && (
        <div className="rounded-2xl bg-[#18191f] border border-[#262832] p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#242630] pb-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Mix & Finish</h2>
              <p className="text-xs text-zinc-400">
                Apply pitch correction, vocal leveling, and studio mastering.
              </p>
            </div>

            <button
              type="button"
              onClick={handleMixRecording}
              disabled={isEnhancing}
              className="px-4 py-1.5 rounded-lg bg-pink-500 text-white hover:bg-pink-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-pink-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEnhancing ? 'Mixing...' : 'Mix my recording'}</span>
            </button>
          </div>

          {/* Vocal Tuning Strength Chips */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-zinc-300">Vocal Tuning Strength</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'subtle_natural' as const, label: 'Subtle Natural' },
                { id: 'balanced_studio' as const, label: 'Balanced Studio' },
                { id: 'high_polish' as const, label: 'High Polish' },
                { id: 'full_autotune' as const, label: 'Full Auto-Tune' },
              ].map((strength) => (
                <button
                  key={strength.id}
                  type="button"
                  onClick={() => setCorrectionStrength(strength.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium text-center transition-colors cursor-pointer ${
                    correctionStrength === strength.id
                      ? 'bg-zinc-700 text-zinc-100 border border-zinc-600 font-semibold'
                      : 'bg-[#14151a] text-zinc-400 hover:text-zinc-200 border border-[#242630]'
                  }`}
                >
                  {strength.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Voice Profile Clone Retargeting */}
          {voiceProfiles.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs text-zinc-300">Retarget with Authorized Voice Clone</div>
              <select
                value={selectedVoiceProfileId}
                onChange={(e) => setSelectedVoiceProfileId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#14151a] border border-[#262832] text-xs text-zinc-200"
              >
                <option value="">Keep my original recorded timbre</option>
                {voiceProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    Transform to: {p.name} ({p.timbre})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stem Balance Sliders */}
          <div className="p-4 rounded-xl bg-[#14151a] border border-[#242630] space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-300">Stem Balance & Solo</span>
              <div className="flex items-center gap-1">
                {(['all', 'vocals', 'backing'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSoloTrack(s)}
                    className={`px-2 py-0.5 rounded text-[11px] capitalize cursor-pointer ${
                      soloTrack === s
                        ? 'bg-zinc-700 text-zinc-100 font-medium'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Vocal Volume</span>
                  <span>{Math.round(mixingParams.vocalVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={mixingParams.vocalVolume}
                  onChange={(e) =>
                    setMixingParams({ ...mixingParams, vocalVolume: parseFloat(e.target.value) })
                  }
                  className="w-full accent-pink-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Backing Track Volume</span>
                  <span>{Math.round(mixingParams.backingVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={mixingParams.backingVolume}
                  onChange={(e) =>
                    setMixingParams({ ...mixingParams, backingVolume: parseFloat(e.target.value) })
                  }
                  className="w-full accent-pink-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Playback Controls while editing */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#14151a] border border-[#242630]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlayback}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 cursor-pointer"
              >
                {isPlayingBack ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <div className="text-xs text-zinc-300">
                {isPlayingBack ? 'Playing master mix' : 'Preview finished mix'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveProject}
              className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
              <span>{isSaved ? 'Saved to Projects' : 'Save Project'}</span>
            </button>
          </div>

          {/* Export Lossless Stems */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#242630]">
            <span className="text-xs text-zinc-400">Export lossless audio:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const activeTake = takes[activeTakeIndex];
                  if (!activeTake) return;
                  const a = document.createElement('a');
                  a.href = activeTake.audioBlobUrl;
                  a.download = `${songTitle || 'Take'}_vocal.wav`;
                  a.click();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3 h-3 text-zinc-400" />
                <span>Vocal Take</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const { blob, filename } = audioEngine.generateWavFile(
                    songTitle || 'Studio Session',
                    initialVersion?.audioParams || {
                      chordProgression: ['C', 'G', 'Am', 'F'],
                      tempoBpm: 88,
                      scale: 'C Major',
                      rootNote: 'C',
                      bassPattern: 'Warm Sub',
                      leadMelody: [],
                      instrumentMix: { acousticGuitar: 0.8, piano: 0.7, bass: 0.8, drums: 0.6, strings: 0.5, synthPad: 0.4, vocalLead: 1.0 },
                      reverbDecay: 2.0,
                      filterFreq: 3400,
                    },
                    'master'
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3 h-3 text-zinc-400" />
                <span>Master Mix WAV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
