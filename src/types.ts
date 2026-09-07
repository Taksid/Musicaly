export type QualityStepName =
  | 'Music Generation'
  | 'Artifact Detection'
  | 'Noise Detection'
  | 'Clipping Detection'
  | 'Vocal Quality Check'
  | 'Loudness Normalization'
  | 'Audio Mastering'
  | 'Final Quality Check';

export interface QualityStep {
  name: QualityStepName;
  status: 'passed' | 'warning' | 'failed' | 'processing';
  details: string;
  metric?: string;
}

export interface QualityReport {
  overallScore: number; // 0-100
  status: 'excellent' | 'good' | 'quality_needs_improvement';
  steps: QualityStep[];
  detectedIssues: string[];
  recommendations: string[];
  peakDbfs: number;
  rmsDbfs: number;
  lufsTarget: number;
  thdPercent: number;
  noiseFloorDbfs: number;
  hasArtifacts: boolean;
  hasClipping: boolean;
  hasNoise: boolean;
  hasBrokenVocals: boolean;
}

export interface LyricLine {
  id: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  section: string;   // e.g. "Verse 1", "Chorus", "Verse 2", "Bridge", "Outro"
  originalText: string;
  phoneticText?: string;
  translatedText: string;
  meaning: string;
}

export interface MelodyNote {
  note: string;
  start: number;
  duration: number;
  freq: number;
}

export interface AudioSynthesisParams {
  chordProgression: string[];
  tempoBpm: number;
  scale: string;
  rootNote: string;
  bassPattern: string;
  leadMelody: MelodyNote[];
  instrumentMix: {
    acousticGuitar: number;
    piano: number;
    bass: number;
    drums: number;
    strings: number;
    synthPad: number;
    vocalLead: number;
  };
  reverbDecay: number;
  filterFreq: number;
}

export interface VideoSettings {
  template: string;
  backgroundEffect: 'aurora' | 'particles' | 'waveform' | 'sunset' | 'vinyl' | 'geometric';
  visualizerStyle: 'bars' | 'circular' | 'wave' | 'frequency-dots';
  fontStyle: 'serif' | 'modern' | 'handwriting' | 'display';
  aspectRatio: '16:9' | '9:16' | '1:1';
  colorPalette: string;
}

export type RegenerationModeId =
  | 'same_lyrics_new_music'
  | 'same_music_better_version'
  | 'new_music_same_lyrics'
  | 'new_vocal_performance'
  | 'new_instrumental'
  | 'completely_new_version';

export interface RegenerationModeOption {
  id: RegenerationModeId;
  label: string;
  description: string;
  iconName: string;
}

export interface KeepChangeConfig {
  keepLyrics: boolean;
  keepLanguage: boolean;
  keepGenre: boolean;
  keepMood: boolean;
  changeVocal: boolean;
  newVocalType?: string;
  changeInstruments: boolean;
  newInstruments?: string[];
  changeBpm: boolean;
  newBpm?: number;
  changeStyle: boolean;
  newStyle?: string;
  changeSongStructure: boolean;
  newSongStructure?: string;
  targetLanguage?: string;
  template?: string;
  induceQualityDefect?: boolean;
}

export type MusicfyModelId = 'mars' | 'earth' | 'light_speed' | 'light_speed_power';

export interface MusicfyModel {
  id: MusicfyModelId;
  name: string;
  tagline: string;
  tier: 'free' | 'pro';
  tierLabel: 'Free Model' | 'Pro Model';
  isConfigured: boolean;
  isAvailable: boolean;
  backendStatus: 'connected' | 'integration_pending';
  backendNotice: string;
  speed: string;
  fidelity: string;
  capabilities: string[];
  recommendedFor: string;
}

export interface SongVersion {
  id: string;
  versionNumber: number;
  title: string;
  modelId?: MusicfyModelId;
  language: string;
  targetLanguage: string;
  genre: string;
  mood: string;
  vocalType: string;
  bpm: number;
  tempo: string;
  instruments: string[];
  songStructure: string;
  template: string;
  lyricsLines: LyricLine[];
  audioParams: AudioSynthesisParams;
  qualityReport: QualityReport;
  videoSettings: VideoSettings;
  regenerationMode?: string;
  regenerationNotes?: string;
  audioBase64?: string;
  audioBlobUrl?: string;
  createdAt: string;
}

export type VideoRegenerationTarget =
  | 'music'
  | 'lyrics'
  | 'translation'
  | 'video'
  | 'everything';

export type SupportedInterfaceLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'hi' | 'pt';

export type AppView =
  | 'landing'
  | 'dashboard'
  | 'generator'
  | 'song_studio'
  | 'voice_cloner'
  | 'universe_remix'
  | 'upload'
  | 'studio';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'premium';
  freeUsesRemaining: number; // Defaults to 5
  totalSuccessfulJobs: number;
  createdAt: string;
}

export interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
  detectedSample?: string;
  identifiedVocalType?: string;
}

export type ProjectType = 'song_generator' | 'song_studio' | 'voice_cloner' | 'song_translation' | 'universe_remix';

export interface VoiceProfile {
  id: string;
  userId: string;
  name: string;
  description: string;
  gender: 'female' | 'male' | 'androgynous';
  timbre: string; // e.g., Warm & Breathy, Punchy Pop, Soulful Rasp
  sampleUrl?: string;
  sampleDurationSeconds: number;
  consentVerified: boolean;
  consentSentenceRecorded: string; // "I, [Name], authorize Musicfy AI to create an AI vocal profile using my voice for my private music creation."
  consentDate: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface StudioTake {
  id: string;
  takeNumber: number;
  audioBlobUrl: string;
  duration: number;
  offsetSeconds: number; // relative to backing track
  createdAt: string;
  waveformPeaks?: number[];
}

export interface StudioClipEdit {
  id: string;
  takeId: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  trackOffset: number; // offset in timeline
  volume: number; // 0.0 to 1.5
  isMuted: boolean;
}

export type VocalCorrectionStrength = 'subtle_natural' | 'balanced_studio' | 'high_polish' | 'full_autotune';

export interface VocalMixingParams {
  noiseReductionDb: number; // -12 to -48 dB
  pitchCorrectionAmount: number; // 0 to 100%
  correctionStrength: VocalCorrectionStrength;
  timingSnap: boolean;
  eqHighPassHz: number; // 80Hz default
  eqAirBoostDb: number; // +2dB to +5dB
  compressionRatio: number; // 2:1 to 8:1
  reverbAmount: number; // 0 to 100%
  vocalLevelDb: number; // -6 to +6 dB
  stereoSpread: number; // 0 to 100%
  backingVolume: number; // 0 to 1
  vocalVolume: number; // 0 to 1
  isClonedVoice?: boolean;
  clonedVoiceProfileId?: string;
  clonedVoiceProfileName?: string;
}

export interface SongProject {
  id: string;
  userId: string;
  projectType: ProjectType;
  title: string;
  originalLanguage: string;
  translationEnabled: boolean;
  targetLanguage: string | null;
  audioFileName?: string;
  originalLyricsText?: string;
  versions: SongVersion[];
  activeVersionId: string;
  // Studio specific properties
  studioState?: {
    startingMode: 'upload' | 'generate_backing' | 'scratch';
    backingTrackAudioUrl?: string;
    backingTrackName?: string;
    vocalStemAudioUrl?: string;
    instrumentalStemAudioUrl?: string;
    takes: StudioTake[];
    activeTakeId?: string;
    clipEdits: StudioClipEdit[];
    undoStack: string[];
    redoStack: string[];
    mixingParams: VocalMixingParams;
    mixedMasterAudioUrl?: string;
    mixedVocalStemAudioUrl?: string;
    isProcessed: boolean;
  };
  // Universe Model (Remix & Music Video) properties
  universeState?: UniverseProjectState;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// UNIVERSE MODEL (Remix & Music Video Generator)
// -------------------------------------------------------------

export type UniverseRemixStyle =
  | 'cyber_synthwave'
  | 'club_edm'
  | 'lofi_chill'
  | 'trap_mashup'
  | 'acoustic_pop'
  | 'cinematic_orchestral';

export type UniverseSongSection = 'intro' | 'verse' | 'chorus' | 'drop' | 'outro' | 'full';

export type UniverseTransitionType =
  | 'crossfade_beat_drop'
  | 'filter_sweep'
  | 'riser_sidechain'
  | 'energy_switch'
  | 'echo_tail'
  | 'cut_downbeat';

export interface UniverseSongTrack {
  id: string;
  title: string;
  fileName: string;
  fileSizeMb: number;
  durationSeconds: number;
  detectedBpm: number;
  detectedKey: string;
  waveformPeaks: number[];
  trimStart: number; // in seconds
  trimEnd: number;   // in seconds
  selectedSection: UniverseSongSection;
  volume: number;    // 0.0 to 1.2
  isMuted: boolean;
  transitionToNext: UniverseTransitionType;
  vocalsPresent: boolean;
  permissionConfirmed: boolean;
  audioBlobUrl?: string;
  colorHex: string;
}

export interface UniverseRemixSettings {
  style: UniverseRemixStyle;
  targetDurationSeconds: number; // 15, 30, 45, 60, 90
  tempoMode: 'auto_sync' | 'custom';
  targetBpm: number; // 70 to 160
  keyHarmonize: boolean;
  vocalMode: 'keep_vocals_blend' | 'instrumental_only' | 'acapella_only' | 'vocal_ducked_mix';
  bassBoostPercent: number; // 0 to 100
  sidechainPumpPercent: number; // 0 to 100
  reverbSpacePercent: number; // 0 to 100
  modelId: MusicfyModelId;
}

export type UniverseVisualMode = 'audio_visualizer' | 'lyric_video' | 'ai_visuals';
export type UniverseVisualizerStyle = 'neon_waveform' | 'radial_spectrum' | 'frequency_bars' | 'cosmic_rings';
export type UniverseAspectRatio = '16:9' | '9:16' | '1:1';
export type UniverseBackgroundTheme = 'cosmos_nebula' | 'cyber_grid' | 'aurora_borealis' | 'deep_twilight' | 'user_asset';

export interface UniverseVideoSettings {
  visualMode: UniverseVisualMode;
  visualizerStyle: UniverseVisualizerStyle;
  aspectRatio: UniverseAspectRatio;
  themeColor: string; // hex
  backgroundTheme: UniverseBackgroundTheme;
  userAssetUrl?: string;
  userAssetType?: 'image' | 'video';
  overlayTitle: string;
  overlaySubtitle: string;
  showBpmBadge: boolean;
  showPoweredByBadge: boolean;
  particleDensity: 'subtle' | 'vibrant' | 'hyper';
  kineticTypography: boolean;
  customLyrics?: string;
}

export interface UniverseRemixOutput {
  id: string;
  title: string;
  durationSeconds: number;
  bpm: number;
  key: string;
  waveformPeaks: number[];
  audioBlobUrl?: string;
  videoBlobUrl?: string;
  exportedFormat?: 'wav' | 'mp4' | 'webm';
  createdAt: string;
  audioParams: AudioSynthesisParams;
}

export interface UniverseProjectState {
  tracks: UniverseSongTrack[];
  remixSettings: UniverseRemixSettings;
  videoSettings: UniverseVideoSettings;
  output?: UniverseRemixOutput;
  step: 'upload' | 'arrange' | 'settings' | 'video' | 'preview_export';
  isProcessing: boolean;
  processingProgress: number;
  processingStepLabel: string;
  lastGeneratedAt?: string;
}
