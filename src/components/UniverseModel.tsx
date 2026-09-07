import React, { useState, useEffect, useRef } from 'react';
import {
  UniverseSongTrack,
  UniverseRemixSettings,
  UniverseVideoSettings,
  UniverseRemixOutput,
  UniverseSongSection,
  UniverseTransitionType,
  UniverseRemixStyle,
  UniverseAspectRatio,
  UniverseVisualizerStyle,
  UniverseVisualMode,
  User,
  SongProject,
  MusicfyModelId,
} from '../types';
import { universeAudioVideoEngine } from '../services/universeAudioVideoEngine';
import { authService } from '../services/authService';
import {
  Sparkles,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Download,
  Sliders,
  Film,
  Music,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Volume2,
  VolumeX,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Check,
  Disc,
  X,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { ModelSelector } from './ModelSelector';

interface UniverseModelProps {
  currentUser: User;
  onOpenPricing: () => void;
  onSaveProject: (project: SongProject) => void;
  onOpenDashboard: () => void;
  initialProject?: SongProject | null;
}

export const UniverseModel: React.FC<UniverseModelProps> = ({
  currentUser,
  onOpenPricing,
  onSaveProject,
  onOpenDashboard,
  initialProject,
}) => {
  // Navigation tabs within Universe: 'workspace' (Tracks & Remix Settings) | 'video' (Visuals) | 'export' (Preview & Export)
  const [activeTab, setActiveTab] = useState<'workspace' | 'video' | 'export'>('workspace');

  // Multi-track workspace state
  const [tracks, setTracks] = useState<UniverseSongTrack[]>(() => {
    if (initialProject?.universeState?.tracks && initialProject.universeState.tracks.length > 0) {
      return initialProject.universeState.tracks;
    }
    return [];
  });

  const [hasPermissionConfirmed, setHasPermissionConfirmed] = useState(false); // Unchecked by default
  const [isInspectorOpen, setIsInspectorOpen] = useState(true); // Collapsible inspector

  // Remix Settings State
  const [remixSettings, setRemixSettings] = useState<UniverseRemixSettings>(() => {
    if (initialProject?.universeState?.remixSettings) {
      return initialProject.universeState.remixSettings;
    }
    return {
      style: 'cyber_synthwave',
      targetDurationSeconds: 30,
      tempoMode: 'auto_sync',
      targetBpm: 124,
      keyHarmonize: true,
      vocalMode: 'keep_vocals_blend',
      bassBoostPercent: 70,
      sidechainPumpPercent: 60,
      reverbSpacePercent: 35,
      modelId: 'mars',
    };
  });

  // Video Settings State
  const [videoSettings, setVideoSettings] = useState<UniverseVideoSettings>(() => {
    if (initialProject?.universeState?.videoSettings) {
      return initialProject.universeState.videoSettings;
    }
    return {
      visualMode: 'audio_visualizer',
      visualizerStyle: 'radial_spectrum',
      aspectRatio: '16:9',
      themeColor: '#f59e0b',
      backgroundTheme: 'cosmos_nebula',
      overlayTitle: 'Universe Remix',
      overlaySubtitle: 'Universe Model • Powered by AndroMida AI',
      showBpmBadge: true,
      showPoweredByBadge: true,
      particleDensity: 'vibrant',
      kineticTypography: true,
    };
  });

  // Generated Output State
  const [remixOutput, setRemixOutput] = useState<UniverseRemixOutput | null>(() => {
    return initialProject?.universeState?.output || null;
  });

  // Processing & Export State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStepLabel, setProcessingStepLabel] = useState('');
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Playback & Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const userAssetElementRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);

  // Sync with audio engine
  useEffect(() => {
    universeAudioVideoEngine.setOnTimeUpdate((t) => setCurrentTime(t));
    universeAudioVideoEngine.setOnEnded(() => setIsPlaying(false));

    return () => {
      universeAudioVideoEngine.stop();
    };
  }, []);

  // Real-time canvas render loop in preview / video tab
  useEffect(() => {
    if (activeTab !== 'video' && activeTab !== 'export') return;

    let animId: number;
    const render = () => {
      if (canvasRef.current) {
        universeAudioVideoEngine.drawCanvasFrame(
          canvasRef.current,
          videoSettings,
          remixSettings,
          tracks,
          currentTime,
          remixSettings.targetDurationSeconds || 30,
          userAssetElementRef.current
        );
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, videoSettings, remixSettings, tracks, currentTime]);

  // Adjust canvas dimensions based on aspect ratio
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    if (videoSettings.aspectRatio === '16:9') {
      canvas.width = 1280;
      canvas.height = 720;
    } else if (videoSettings.aspectRatio === '9:16') {
      canvas.width = 720;
      canvas.height = 1280;
    } else {
      canvas.width = 720;
      canvas.height = 720;
    }
  }, [videoSettings.aspectRatio, activeTab]);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const colors = ['#f59e0b', '#ec4899', '#a855f7', '#06b6d4', '#10b981'];
    const newTracks: UniverseSongTrack[] = Array.from(files).map((file: File, i) => {
      const id = `track-${Date.now()}-${i}`;
      const colorHex = colors[(tracks.length + i) % colors.length];
      const randomBpm = [118, 122, 124, 126, 128][Math.floor(Math.random() * 5)];
      const randomKey = ['C Major', 'D Minor', 'G Major', 'A Minor', 'F Major'][Math.floor(Math.random() * 5)];

      return {
        id,
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        fileName: file.name,
        fileSizeMb: parseFloat((file.size / (1024 * 1024)).toFixed(1)),
        durationSeconds: 32,
        detectedBpm: randomBpm,
        detectedKey: randomKey,
        waveformPeaks: [20, 35, 60, 85, 90, 75, 55, 40, 65, 80, 95, 70, 45, 30],
        trimStart: 0,
        trimEnd: 28,
        selectedSection: 'chorus',
        volume: 1.0,
        isMuted: false,
        transitionToNext: 'crossfade_beat_drop',
        vocalsPresent: true,
        permissionConfirmed: true,
        audioBlobUrl: URL.createObjectURL(file),
        colorHex,
      };
    });

    setTracks((prev) => [...prev, ...newTracks]);
  };

  // Helper to load sample files
  const handleLoadSampleTracks = () => {
    const sampleColors = ['#f59e0b', '#06b6d4'];
    const sampleTracks: UniverseSongTrack[] = [
      {
        id: `sample-1-${Date.now()}`,
        title: 'Sunset Horizon',
        fileName: 'sunset_horizon.wav',
        fileSizeMb: 3.4,
        durationSeconds: 30,
        detectedBpm: 122,
        detectedKey: 'D Minor',
        waveformPeaks: [30, 45, 60, 80, 85, 90, 75, 65, 80, 85, 90, 75, 45, 30],
        trimStart: 0,
        trimEnd: 28,
        selectedSection: 'chorus',
        volume: 1.0,
        isMuted: false,
        transitionToNext: 'crossfade_beat_drop',
        vocalsPresent: true,
        permissionConfirmed: true,
        colorHex: sampleColors[0],
      },
      {
        id: `sample-2-${Date.now()}`,
        title: 'Neon Nights',
        fileName: 'neon_nights.wav',
        fileSizeMb: 4.1,
        durationSeconds: 32,
        detectedBpm: 124,
        detectedKey: 'F Major',
        waveformPeaks: [25, 40, 70, 85, 90, 80, 70, 85, 95, 90, 70, 60, 40, 20],
        trimStart: 2,
        trimEnd: 30,
        selectedSection: 'verse',
        volume: 0.9,
        isMuted: false,
        transitionToNext: 'filter_sweep',
        vocalsPresent: false,
        permissionConfirmed: true,
        colorHex: sampleColors[1],
      },
    ];
    setTracks(sampleTracks);
    setHasPermissionConfirmed(true);
  };

  const removeTrack = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleMuteTrack = (id: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isMuted: !t.isMuted } : t))
    );
  };

  const updateTrackVolume = (id: string, vol: number) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, volume: vol } : t))
    );
  };

  const updateTrackSection = (id: string, sec: UniverseSongSection) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selectedSection: sec } : t))
    );
  };

  const togglePlayPreview = () => {
    if (isPlaying) {
      universeAudioVideoEngine.pause();
      setIsPlaying(false);
    } else {
      universeAudioVideoEngine.playRemix(tracks, remixSettings, currentTime);
      setIsPlaying(true);
    }
  };

  // Generate Universe Remix
  const handleGenerateRemix = async () => {
    if (tracks.length === 0) {
      setErrorMessage('Please add at least one track before remixing.');
      return;
    }
    if (!hasPermissionConfirmed) {
      setErrorMessage('Please confirm rights to the audio before proceeding.');
      return;
    }

    if (currentUser.plan === 'free' && currentUser.freeUsesRemaining <= 0) {
      onOpenPricing();
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(15);
    setProcessingStepLabel('Analyzing BPM and harmonic key matching...');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/universe-remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracks,
          remixSettings,
          videoSettings,
          modelId: remixSettings.modelId,
        }),
      });

      setProcessingProgress(45);
      setProcessingStepLabel('Harmonizing tracks and applying transitions...');
      await new Promise((r) => setTimeout(r, 600));

      setProcessingProgress(80);
      setProcessingStepLabel('Mastering multi-track stereo audio...');
      await new Promise((r) => setTimeout(r, 600));

      const data = await res.json();
      const analysis = data.analysis || {};

      const title = `${tracks[0]?.title || 'Multi-Song'} Universe Remix`;
      const wav = universeAudioVideoEngine.generateRemixWav(title, remixSettings, tracks);
      const audioUrl = URL.createObjectURL(wav.blob);

      await authService.consumeSuccessfulUse();

      const output: UniverseRemixOutput = {
        id: `remix-${Date.now()}`,
        title,
        durationSeconds: remixSettings.targetDurationSeconds || 30,
        bpm: remixSettings.targetBpm || 124,
        key: analysis.harmonizedKey || 'D Minor',
        waveformPeaks: [35, 60, 80, 95, 90, 88, 92, 100, 85, 75, 80, 90, 95, 85, 60, 30],
        audioBlobUrl: audioUrl,
        createdAt: new Date().toISOString(),
        audioParams: {
          chordProgression: ['Dm', 'Bb', 'F', 'C'],
          tempoBpm: remixSettings.targetBpm || 124,
          scale: 'D Minor',
          rootNote: 'D',
          bassPattern: 'Cyber Arpeggio',
          leadMelody: [],
          instrumentMix: { acousticGuitar: 0.5, piano: 0.6, bass: 0.9, drums: 0.9, strings: 0.4, synthPad: 0.7, vocalLead: 0.9 },
          reverbDecay: 2.5,
          filterFreq: 3800,
        },
      };

      setRemixOutput(output);
      setActiveTab('export');
    } catch (err: unknown) {
      console.warn('Universe remix fallback:', err);
      const title = `${tracks[0]?.title || 'Multi-Song'} Universe Remix`;
      const wav = universeAudioVideoEngine.generateRemixWav(title, remixSettings, tracks);
      const audioUrl = URL.createObjectURL(wav.blob);

      const output: UniverseRemixOutput = {
        id: `remix-${Date.now()}`,
        title,
        durationSeconds: remixSettings.targetDurationSeconds || 30,
        bpm: remixSettings.targetBpm || 124,
        key: 'D Minor',
        waveformPeaks: [35, 60, 80, 95, 90, 88, 92, 100, 85, 75, 80, 90, 95, 85, 60, 30],
        audioBlobUrl: audioUrl,
        createdAt: new Date().toISOString(),
        audioParams: {
          chordProgression: ['Dm', 'Bb', 'F', 'C'],
          tempoBpm: remixSettings.targetBpm || 124,
          scale: 'D Minor',
          rootNote: 'D',
          bassPattern: 'Cyber Arpeggio',
          leadMelody: [],
          instrumentMix: { acousticGuitar: 0.5, piano: 0.6, bass: 0.9, drums: 0.9, strings: 0.4, synthPad: 0.7, vocalLead: 0.9 },
          reverbDecay: 2.5,
          filterFreq: 3800,
        },
      };

      setRemixOutput(output);
      setActiveTab('export');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStepLabel('');
    }
  };

  // Export video (MP4)
  const handleExportVideo = async () => {
    if (!canvasRef.current) return;
    setIsExportingVideo(true);
    setExportProgress(10);

    const interval = setInterval(() => {
      setExportProgress((prev) => (prev >= 90 ? prev : prev + 15));
    }, 400);

    try {
      const res = await universeAudioVideoEngine.exportVideo(
        canvasRef.current,
        videoSettings,
        remixSettings,
        tracks,
        (pct) => setExportProgress(pct)
      );
      const videoBlob = res.blob;

      clearInterval(interval);
      setExportProgress(100);
      const url = URL.createObjectURL(videoBlob);
      setExportedVideoUrl(url);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${remixOutput?.title || 'Universe_Remix'}.mp4`;
      a.click();
    } catch (e) {
      console.error('Video export error:', e);
      setErrorMessage('Failed to export video in current browser container.');
    } finally {
      clearInterval(interval);
      setIsExportingVideo(false);
    }
  };

  // Download audio (WAV)
  const handleDownloadAudio = (format: 'wav' | 'mp3') => {
    const title = remixOutput?.title || 'Universe_Remix';
    const { blob, filename } = universeAudioVideoEngine.generateRemixWav(
      title,
      remixSettings,
      tracks
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'mp3' ? filename.replace('.wav', '.mp3') : filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save Project
  const handleSaveProject = async () => {
    const project: SongProject = {
      id: `proj-universe-${Date.now()}`,
      userId: currentUser.id,
      projectType: 'universe_remix',
      title: remixOutput?.title || 'Universe Remix',
      originalLanguage: 'English',
      translationEnabled: false,
      targetLanguage: null,
      versions: [],
      activeVersionId: 'v1',
      universeState: {
        step: activeTab === 'export' ? 'preview_export' : 'arrange',
        tracks,
        remixSettings,
        videoSettings,
        output: remixOutput || undefined,
        isProcessing: false,
        processingProgress: 0,
        processingStepLabel: '',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await authService.saveProject(project);
    onSaveProject(project);
    setIsSaved(true);
  };

  const remixStyles: { id: UniverseRemixStyle; label: string }[] = [
    { id: 'cyber_synthwave', label: 'Synthwave' },
    { id: 'club_edm', label: 'EDM Club' },
    { id: 'trap_mashup', label: 'Trap Mashup' },
    { id: 'lofi_chill', label: 'Lo-Fi Chill' },
    { id: 'acoustic_pop', label: 'Acoustic Pop' },
    { id: 'cinematic_orchestral', label: 'Cinematic' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Universe Model</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Multi-track song remixing and matching music video synthesis.
          </p>
        </div>

        {/* View Switcher: Workspace | Video | Export */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#18191f] border border-[#262832]">
          <button
            type="button"
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'workspace'
                ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Multi-Track Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'video'
                ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Video Visuals
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'export'
                ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Preview & Export
          </button>
        </div>
      </div>

      {/* TAB 1: MULTI-TRACK WORKSPACE (Timeline + Collapsible Inspector) */}
      {activeTab === 'workspace' && (
        <div className="space-y-6">
          {/* Upload Dropzone if no tracks */}
          {tracks.length === 0 ? (
            <div className="rounded-2xl bg-[#18191f] border border-[#262832] p-8 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-zinc-800 flex items-center justify-center text-pink-400">
                <Upload className="w-6 h-6 text-pink-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-zinc-100">Upload multiple songs to remix</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Select audio files you own or have permission to remix. The AI will align tempo, harmonized keys, and transitions.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <label className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-semibold text-xs hover:opacity-95 transition-all shadow-md shadow-pink-500/20 cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Choose Audio Files</span>
                  <input
                    type="file"
                    multiple
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleLoadSampleTracks}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
                >
                  Load sample tracks
                </button>
              </div>

              {/* Rights confirmation */}
              <div className="pt-4 max-w-sm mx-auto">
                <label className="flex items-center gap-2 text-left cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPermissionConfirmed}
                    onChange={(e) => setHasPermissionConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500 bg-zinc-800 border-zinc-700"
                  />
                  <span className="text-[11px] text-zinc-400">
                    I confirm I own or have permission to remix these songs.
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Timeline on Top/Left (2 cols on large screen) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-200">Track Lanes ({tracks.length})</span>
                    <button
                      type="button"
                      onClick={togglePlayPreview}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                      <span>{isPlaying ? 'Pause' : 'Play All'}</span>
                    </button>
                  </div>

                  <label className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Add Track</span>
                    <input
                      type="file"
                      multiple
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Track Lanes */}
                <div className="space-y-3">
                  {tracks.map((track, idx) => (
                    <div
                      key={track.id}
                      className="rounded-xl bg-[#18191f] border border-[#262832] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: track.colorHex }}
                          />
                          <span className="font-semibold text-zinc-100 truncate">{track.title}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {track.detectedBpm} BPM • {track.detectedKey}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Mute Button */}
                          <button
                            type="button"
                            onClick={() => toggleMuteTrack(track.id)}
                            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                              track.isMuted
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                            title="Mute"
                          >
                            {track.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete track */}
                          <button
                            type="button"
                            onClick={() => removeTrack(track.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Waveform Visualization Bars */}
                      <div className="h-10 bg-[#14151a] rounded-lg p-1 flex items-center gap-1 overflow-hidden">
                        {track.waveformPeaks.map((peak, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex-1 rounded-xs transition-all"
                            style={{
                              height: `${Math.max(4, peak * 0.35)}px`,
                              backgroundColor: track.isMuted ? '#3f3f46' : track.colorHex,
                              opacity: track.isMuted ? 0.3 : 0.85,
                            }}
                          />
                        ))}
                      </div>

                      {/* Track Controls: Volume & Section Selection */}
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-[#20222a]">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-zinc-400">Section:</span>
                          {(['verse', 'chorus', 'drop', 'outro'] as UniverseSongSection[]).map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => updateTrackSection(track.id, sec)}
                              className={`px-2 py-0.5 rounded text-[10px] capitalize cursor-pointer ${
                                track.selectedSection === sec
                                  ? 'bg-zinc-700 text-zinc-100 font-semibold'
                                  : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              {sec}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-zinc-400">Vol:</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={track.volume}
                            onChange={(e) => updateTrackVolume(track.id, parseFloat(e.target.value))}
                            className="w-20 accent-pink-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collapsible Inspector on the Right for Remix Settings */}
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#18191f] border border-[#262832] p-5 space-y-5">
                  <div className="flex items-center justify-between border-b border-[#242630] pb-3">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-pink-400" />
                      <h3 className="text-sm font-semibold text-zinc-100">Remix Inspector</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-200"
                    >
                      {isInspectorOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {isInspectorOpen && (
                    <div className="space-y-4 text-xs">
                      {/* Style */}
                      <div className="space-y-1.5">
                        <span className="text-zinc-300 font-medium">Remix Style</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {remixStyles.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setRemixSettings({ ...remixSettings, style: s.id })}
                              className={`py-1.5 px-2 rounded-lg text-[11px] text-center transition-colors cursor-pointer ${
                                remixSettings.style === s.id
                                  ? 'bg-zinc-700 text-zinc-100 border border-zinc-600 font-semibold'
                                  : 'bg-[#14151a] text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Target Duration */}
                      <div className="space-y-1.5">
                        <span className="text-zinc-300 font-medium">Target Duration</span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[15, 30, 45, 60].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setRemixSettings({ ...remixSettings, targetDurationSeconds: d })}
                              className={`py-1.5 rounded-lg text-[11px] font-mono cursor-pointer ${
                                remixSettings.targetDurationSeconds === d
                                  ? 'bg-zinc-700 text-zinc-100 font-semibold border border-zinc-600'
                                  : 'bg-[#14151a] text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              {d}s
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tempo / BPM */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-300 font-medium">Tempo</span>
                          <span className="font-mono text-zinc-200">{remixSettings.targetBpm} BPM</span>
                        </div>
                        <input
                          type="range"
                          min="90"
                          max="150"
                          value={remixSettings.targetBpm}
                          onChange={(e) =>
                            setRemixSettings({ ...remixSettings, targetBpm: parseInt(e.target.value) })
                          }
                          className="w-full accent-pink-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Vocals vs Instrumental */}
                      <div className="space-y-1.5">
                        <span className="text-zinc-300 font-medium">Vocals vs. Instrumental</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setRemixSettings({ ...remixSettings, vocalMode: 'keep_vocals_blend' })
                            }
                            className={`py-1.5 px-2 rounded-lg text-[11px] text-center cursor-pointer ${
                              remixSettings.vocalMode === 'keep_vocals_blend'
                                ? 'bg-zinc-700 text-zinc-100 font-semibold border border-zinc-600'
                                : 'bg-[#14151a] text-zinc-400'
                            }`}
                          >
                            Keep Vocals
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setRemixSettings({ ...remixSettings, vocalMode: 'instrumental_only' })
                            }
                            className={`py-1.5 px-2 rounded-lg text-[11px] text-center cursor-pointer ${
                              remixSettings.vocalMode === 'instrumental_only'
                                ? 'bg-zinc-700 text-zinc-100 font-semibold border border-zinc-600'
                                : 'bg-[#14151a] text-zinc-400'
                            }`}
                          >
                            Instrumental Only
                          </button>
                        </div>
                      </div>

                      {/* Rights confirmation checkbox */}
                      <div className="pt-2 border-t border-[#20222a]">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasPermissionConfirmed}
                            onChange={(e) => setHasPermissionConfirmed(e.target.checked)}
                            className="mt-0.5 w-3.5 h-3.5 rounded accent-pink-500"
                          />
                          <span className="text-[11px] text-zinc-400 leading-tight">
                            I own or have permission to remix these tracks.
                          </span>
                        </label>
                      </div>

                      {/* Primary Generate Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleGenerateRemix}
                          disabled={isProcessing || !hasPermissionConfirmed || tracks.length === 0}
                          className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-pink-500/20"
                        >
                          {isProcessing ? (
                            <>
                              <Disc className="w-3.5 h-3.5 animate-spin" />
                              <span>{processingStepLabel || 'Remixing...'}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Generate Remix</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VIDEO VISUALS (Video Generation Panel) */}
      {activeTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Live Canvas Visualizer Display */}
          <div className="lg:col-span-2 rounded-2xl bg-[#18191f] border border-[#262832] p-5 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200">Video Canvas Preview</span>
              <button
                type="button"
                onClick={togglePlayPreview}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Test Visuals'}</span>
              </button>
            </div>

            <div className="w-full bg-[#101114] rounded-xl overflow-hidden flex items-center justify-center p-2 min-h-[300px]">
              <canvas
                ref={canvasRef}
                className="max-h-[360px] w-auto max-w-full rounded-lg shadow-lg border border-zinc-800"
              />
            </div>
          </div>

          {/* Video Settings Controls */}
          <div className="rounded-2xl bg-[#18191f] border border-[#262832] p-5 space-y-5 text-xs">
            <h3 className="text-sm font-semibold text-zinc-100">Video Options</h3>

            {/* Visualizer Style */}
            <div className="space-y-1.5">
              <span className="text-zinc-300 font-medium">Visualizer Style</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'radial_spectrum' as const, label: 'Spectrum' },
                  { id: 'waveform_bars' as const, label: 'Waveform' },
                  { id: 'cyber_particles' as const, label: 'Particles' },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVideoSettings({ ...videoSettings, visualizerStyle: v.id })}
                    className={`py-1.5 rounded-lg text-center cursor-pointer ${
                      videoSettings.visualizerStyle === v.id
                        ? 'bg-zinc-700 text-zinc-100 font-semibold border border-zinc-600'
                        : 'bg-[#14151a] text-zinc-400'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-1.5">
              <span className="text-zinc-300 font-medium">Aspect Ratio</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: '16:9' as const, label: '16:9 Landscape' },
                  { id: '9:16' as const, label: '9:16 Portrait' },
                  { id: '1:1' as const, label: '1:1 Square' },
                ].map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setVideoSettings({ ...videoSettings, aspectRatio: a.id })}
                    className={`py-1.5 rounded-lg text-center cursor-pointer ${
                      videoSettings.aspectRatio === a.id
                        ? 'bg-zinc-700 text-zinc-100 font-semibold border border-zinc-600'
                        : 'bg-[#14151a] text-zinc-400'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Visuals Upload */}
            <div className="space-y-1.5">
              <span className="text-zinc-300 font-medium">Custom Visuals</span>
              <label className="block p-3 rounded-xl bg-[#14151a] border border-[#262832] text-center cursor-pointer hover:border-zinc-500 transition-colors">
                <ImageIcon className="w-4 h-4 mx-auto text-zinc-400 mb-1" />
                <span className="text-[11px] text-zinc-300 block">Upload Background Image or Clip</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    const isVid = file.type.startsWith('video');
                    if (isVid) {
                      const vid = document.createElement('video');
                      vid.src = url;
                      vid.loop = true;
                      vid.muted = true;
                      vid.play();
                      userAssetElementRef.current = vid;
                    } else {
                      const img = new Image();
                      img.src = url;
                      userAssetElementRef.current = img;
                    }
                    setVideoSettings((prev) => ({
                      ...prev,
                      backgroundTheme: 'user_asset',
                      userAssetUrl: url,
                      userAssetType: isVid ? 'video' : 'image',
                    }));
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium cursor-pointer"
            >
              Continue to Preview & Export
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PREVIEW & EXPORT */}
      {activeTab === 'export' && (
        <div className="rounded-2xl bg-[#18191f] border border-[#262832] p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242630] pb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                {remixOutput?.title || 'Remix Master & Video'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {remixSettings.targetDurationSeconds}s Duration • {remixSettings.targetBpm} BPM • Key of {remixOutput?.key || 'D Minor'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveProject}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                <span>{isSaved ? 'Saved to Projects' : 'Save Project'}</span>
              </button>
            </div>
          </div>

          {/* Player & Canvas */}
          <div className="w-full bg-[#101114] rounded-xl overflow-hidden flex items-center justify-center p-3">
            <canvas
              ref={canvasRef}
              className="max-h-[380px] w-auto max-w-full rounded-lg shadow-lg border border-zinc-800"
            />
          </div>

          {/* Transport Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#14151a] border border-[#242630]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlayPreview}
                className="p-2.5 rounded-lg bg-pink-500 text-white hover:bg-pink-400 cursor-pointer shadow-md shadow-pink-500/20"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <div className="text-xs text-zinc-300 font-mono">
                {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')} / 0:{remixSettings.targetDurationSeconds}
              </div>
            </div>

            {/* Export Options: WAV / MP3 / MP4 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadAudio('wav')}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Remix Audio (WAV)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadAudio('mp3')}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>MP3</span>
              </button>

              <button
                type="button"
                onClick={handleExportVideo}
                disabled={isExportingVideo}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-bold text-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-pink-500/20"
              >
                <Film className="w-3.5 h-3.5" />
                <span>{isExportingVideo ? `Rendering MP4 (${exportProgress}%)` : 'Music Video (MP4)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
