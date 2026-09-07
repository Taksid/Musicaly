import React, { useState, useEffect } from 'react';
import {
  SongVersion,
  SongProject,
  User,
  SupportedInterfaceLanguage,
  AppView,
  RegenerationModeId,
  KeepChangeConfig,
  VideoRegenerationTarget,
  VoiceProfile,
} from './types';
import { authService, DEFAULT_ENGLISH_SEED_VERSION, INITIAL_DEMO_PROJECT } from './services/authService';
import { UI_TRANSLATIONS } from './i18n/translations';
import { audioEngine } from './services/audioEngine';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { SongGenerator } from './components/SongGenerator';
import { SongStudio } from './components/SongStudio';
import { VoiceCloner } from './components/VoiceCloner';
import { UniverseModel } from './components/UniverseModel';
import { UploadSongView } from './components/UploadSongView';
import { WaveformPlayer } from './components/WaveformPlayer';
import { AudioQualityReport } from './components/AudioQualityReport';
import { LyricsTranslationView } from './components/LyricsTranslationView';
import { VersionsList } from './components/VersionsList';
import { RegenerationPanel } from './components/RegenerationPanel';
import { VersionComparisonModal } from './components/VersionComparisonModal';
import { VideoStudioModal } from './components/VideoStudioModal';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import {
  Sparkles,
  Layers,
  Languages,
  ShieldCheck,
  Disc,
  ArrowRightLeft,
  Film,
  Plus,
  RefreshCw,
  LayoutDashboard,
  Upload,
  Mic,
  Radio,
} from 'lucide-react';

export default function App() {
  // Navigation & Localization State (English by default!)
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [interfaceLang, setInterfaceLang] = useState<SupportedInterfaceLanguage>('en');
  const t = UI_TRANSLATIONS[interfaceLang] || UI_TRANSLATIONS.en;

  // Authentication & Projects State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<SongProject[]>([]);
  const [currentProject, setCurrentProject] = useState<SongProject | null>(INITIAL_DEMO_PROJECT);

  // Voice Profiles State
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);

  // Active Song Versions State
  const [versions, setVersions] = useState<SongVersion[]>(() => {
    return currentProject?.versions || [DEFAULT_ENGLISH_SEED_VERSION];
  });
  const [activeVersionId, setActiveVersionId] = useState<string>(() => {
    return currentProject?.activeVersionId || DEFAULT_ENGLISH_SEED_VERSION.id;
  });

  // Song Studio handoff version
  const [studioInitialVersion, setStudioInitialVersion] = useState<SongVersion | null>(null);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingVersionId, setPlayingVersionId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Studio Tabs (for translation/regeneration view)
  const [activeTab, setActiveTab] = useState<'studio' | 'versions' | 'quality'>('studio');

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isRegeneratePanelOpen, setIsRegeneratePanelOpen] = useState(false);
  const [isVideoStudioOpen, setIsVideoStudioOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareVersionA, setCompareVersionA] = useState<SongVersion | null>(null);
  const [compareVersionB, setCompareVersionB] = useState<SongVersion | null>(null);

  // Operations loading flags
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  const [isUpdatingTranslation, setIsUpdatingTranslation] = useState(false);

  // Derive active version
  const activeVersion =
    versions.find((v) => v.id === activeVersionId) || versions[0] || DEFAULT_ENGLISH_SEED_VERSION;

  // Audio playback ticker
  useEffect(() => {
    audioEngine.setOnTimeUpdate((time) => {
      setCurrentTime(time);
      if (time >= audioEngine.getDuration() && isPlaying) {
        setIsPlaying(false);
      }
    });
    return () => {
      audioEngine.setOnTimeUpdate(() => {});
    };
  }, [isPlaying]);

  // Keep project versions in sync
  useEffect(() => {
    if (currentProject) {
      setVersions(currentProject.versions);
      setActiveVersionId(currentProject.activeVersionId);
    }
  }, [currentProject?.id]);

  // Refresh voice profiles when user changes
  useEffect(() => {
    const fetchData = async () => {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        const userProjects = await authService.getUserProjects();
        setProjects(userProjects);
        if (userProjects.length > 0) {
            setCurrentProject(userProjects[0]);
        }
        const profiles = await authService.getVoiceProfiles();
        setVoiceProfiles(profiles);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchUserSpecificData = async () => {
      if (currentUser?.id) {
         setVoiceProfiles(await authService.getVoiceProfiles());
      }
    };
    fetchUserSpecificData();
  }, [currentUser?.id]);

  // Navigation handlers
  const handleNavigate = (view: AppView) => {
    if ((view === 'dashboard' || view === 'upload') && !currentUser) {
      setAuthModalMode('signup');
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentView(view);
  };

  const handleOpenAuth = (mode: 'login' | 'signup' = 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    const userProjects = await authService.getUserProjects();
    setProjects(userProjects);
    setVoiceProfiles(await authService.getVoiceProfiles());
    if (userProjects.length > 0) {
      setCurrentProject(userProjects[0]);
    }
    setCurrentView('dashboard');
  };

  const handleLogOut = () => {
    authService.logOut();
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleOpenProject = (project: SongProject) => {
    setCurrentProject(project);
    if (project.projectType === 'universe_remix') {
      setCurrentView('universe_remix');
      return;
    }
    if (project.projectType === 'song_studio') {
      setStudioInitialVersion(project.versions[0] || null);
      setCurrentView('song_studio');
      return;
    }

    setVersions(project.versions);
    setActiveVersionId(project.activeVersionId);
    setCurrentView('studio');
    setActiveTab('studio');
  };

  const handleDeleteProject = async (projectId: string) => {
    await authService.deleteProject(projectId);
    const updated = await authService.getUserProjects();
    setProjects(updated);
    if (currentProject?.id === projectId) {
      setCurrentProject(updated[0] || null);
    }
  };

  const handleSongProcessed = async (newProject: SongProject) => {
    setCurrentUser(authService.getCurrentUser());
    setProjects(await authService.getUserProjects());
    setCurrentProject(newProject);
    setVersions(newProject.versions);
    setActiveVersionId(newProject.activeVersionId);
    setCurrentView('studio');
    setActiveTab('studio');

    // Automatically trigger audio playback
    const ver = newProject.versions[0];
    if (ver) {
      audioEngine.playVersion(ver.id, ver.audioParams, ver.lyricsLines, 0);
      setIsPlaying(true);
      setPlayingVersionId(ver.id);
    }
  };

  // Audio Play/Pause
  const handlePlayPause = (verToPlay = activeVersion) => {
    if (isPlaying && playingVersionId === verToPlay.id) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.playVersion(verToPlay.id, verToPlay.audioParams, verToPlay.lyricsLines, currentTime);
      setIsPlaying(true);
      setPlayingVersionId(verToPlay.id);
      setActiveVersionId(verToPlay.id);
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    audioEngine.seek(seconds);
    if (!isPlaying) {
      audioEngine.playVersion(activeVersion.id, activeVersion.audioParams, activeVersion.lyricsLines, seconds);
      setIsPlaying(true);
      setPlayingVersionId(activeVersion.id);
    }
  };

  // Regenerate Song Execution (Calls backend /api/regenerate-song)
  const handleGenerateNewVersion = async (
    mode: RegenerationModeId,
    config: KeepChangeConfig,
    induceDefect: boolean
  ) => {
    // Check quota if on free plan
    if (currentUser && currentUser.plan === 'free' && currentUser.freeUsesRemaining <= 0) {
      setIsRegeneratePanelOpen(false);
      setIsPricingModalOpen(true);
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        baseVersion: activeVersion,
        mode,
        config,
        induceDefect,
      };

      const response = await fetch('/api/regenerate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Regeneration server error');
      }

      const data = await response.json();
      if (data.success && data.version) {
        const newVer: SongVersion = data.version;
        const nextVersions = [newVer, ...versions];
        setVersions(nextVersions);
        setActiveVersionId(newVer.id);

        // Update current project if one exists
        if (currentProject) {
          const updatedProject: SongProject = {
            ...currentProject,
            versions: nextVersions,
            activeVersionId: newVer.id,
            updatedAt: new Date().toISOString(),
          };
          setCurrentProject(updatedProject);
          await authService.saveProject(updatedProject);
        }

        // Deduct 1 credit only on successful job
        await authService.consumeSuccessfulUse();
        setCurrentUser(authService.getCurrentUser());

        // Auto-play the fresh studio master
        setCurrentTime(0);
        audioEngine.playVersion(newVer.id, newVer.audioParams, newVer.lyricsLines, 0);
        setIsPlaying(true);
        setPlayingVersionId(newVer.id);

        setIsRegeneratePanelOpen(false);
      }
    } catch (error) {
      console.error('Error generating new song version:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Translation Regeneration (Calls /api/regenerate-translation)
  const handleRegenerateTranslation = async (targetLang: string) => {
    setIsUpdatingTranslation(true);
    try {
      const response = await fetch('/api/regenerate-translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyricsLines: activeVersion.lyricsLines,
          targetLanguage: targetLang,
          originalLanguage: activeVersion.language,
        }),
      });

      const data = await response.json();
      if (data.success && data.lyricsLines) {
        const updatedVersion: SongVersion = {
          ...activeVersion,
          targetLanguage: targetLang,
          lyricsLines: data.lyricsLines,
        };

        const nextVersions = versions.map((v) => (v.id === updatedVersion.id ? updatedVersion : v));
        setVersions(nextVersions);

        if (currentProject) {
          const updatedProj: SongProject = {
            ...currentProject,
            targetLanguage: targetLang,
            translationEnabled: true,
            versions: nextVersions,
            updatedAt: new Date().toISOString(),
          };
          setCurrentProject(updatedProj);
          await authService.saveProject(updatedProj);
        }
      }
    } catch (error) {
      console.error('Failed to regenerate translation:', error);
    } finally {
      setIsUpdatingTranslation(false);
    }
  };

  // Video target regeneration handler
  const handleVideoRegenerateTarget = async (target: VideoRegenerationTarget) => {
    setIsVideoProcessing(true);
    try {
      const response = await fetch('/api/regenerate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: activeVersion,
          target,
        }),
      });

      const data = await response.json();
      if (data.success && data.videoMetadata) {
        const updatedVer: SongVersion = {
          ...activeVersion,
          videoMetadata: data.videoMetadata,
        };
        const nextVersions = versions.map((v) => (v.id === updatedVer.id ? updatedVer : v));
        setVersions(nextVersions);

        if (currentProject) {
          const updatedProject: SongProject = {
            ...currentProject,
            versions: nextVersions,
            updatedAt: new Date().toISOString(),
          };
          setCurrentProject(updatedProject);
          await authService.saveProject(updatedProject);
        }
      }
    } catch (err) {
      console.error('Failed to regenerate video:', err);
    } finally {
      setIsVideoProcessing(false);
    }
  };

  // Compare versions handler
  const handleOpenCompare = (vA: SongVersion, vB?: SongVersion) => {
    setCompareVersionA(vA);
    setCompareVersionB(vB || versions.find((v) => v.id !== vA.id) || null);
    setIsCompareModalOpen(true);
  };

  // Download audio track handler
  const handleDownload = (version: SongVersion, format: 'wav' | 'mp3' = 'wav') => {
    const { blob, filename } = audioEngine.generateWavFile(version.title, version.audioParams);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (versionId: string) => {
    if (versions.length <= 1) return;
    const nextVersions = versions.filter((v) => v.id !== versionId);
    setVersions(nextVersions);
    if (activeVersionId === versionId) {
      setActiveVersionId(nextVersions[0].id);
    }

    if (currentProject) {
      const updatedProj: SongProject = {
        ...currentProject,
        versions: nextVersions,
        activeVersionId: activeVersionId === versionId ? nextVersions[0].id : activeVersionId,
        updatedAt: new Date().toISOString(),
      };
      setCurrentProject(updatedProj);
      await authService.saveProject(updatedProj);
    }
  };

  const handleFixDefects = (version: SongVersion) => {
    handleGenerateNewVersion(
      'same_music_better_version',
      {
        keepLyrics: true,
        keepLanguage: true,
        keepGenre: true,
        keepMood: true,
        changeVocal: false,
        changeInstruments: false,
        changeBpm: false,
        changeStyle: false,
        changeSongStructure: false,
      },
      false
    );
  };

  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-[#121316] text-[#f4f4f5] font-sans antialiased selection:bg-amber-500 selection:text-zinc-950">
        <LandingPage
          t={t}
          onGetStarted={() => {
            if (currentUser) {
              setCurrentView('generator');
            } else {
              setAuthModalMode('signup');
              setIsAuthModalOpen(true);
            }
          }}
          onLogIn={() => {
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }}
          onSelectSampleSong={() => {
            setCurrentView('generator');
          }}
          onOpenPricing={() => setIsPricingModalOpen(true)}
          onOpenGenerator={() => setCurrentView('generator')}
          onOpenStudio={() => setCurrentView('song_studio')}
          onOpenCloner={() => setCurrentView('voice_cloner')}
          onOpenUniverseModel={() => setCurrentView('universe_remix')}
        />

        {/* Global Modals */}
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />

        <PricingModal
          isOpen={isPricingModalOpen}
          currentUser={currentUser}
          onClose={() => setIsPricingModalOpen(false)}
          onUpgraded={(updated) => setCurrentUser(updated)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121316] text-[#f4f4f5] flex flex-col md:flex-row font-sans antialiased selection:bg-amber-500 selection:text-zinc-950">
      {/* Compact Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogOut={handleLogOut}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        currentInterfaceLang={interfaceLang}
        onSelectInterfaceLang={(l) => setInterfaceLang(l)}
        t={t}
      />

      <main className="flex-1 min-h-screen overflow-y-auto bg-[#121316]">

      {/* VIEW: DASHBOARD */}
      {currentView === 'dashboard' && currentUser && (
        <Dashboard
          t={t}
          currentUser={currentUser}
          projects={projects}
          onOpenUpload={() => setCurrentView('upload')}
          onOpenSongGenerator={() => setCurrentView('generator')}
          onOpenSongStudio={() => {
            setStudioInitialVersion(null);
            setCurrentView('song_studio');
          }}
          onOpenVoiceCloner={() => setCurrentView('voice_cloner')}
          onOpenUniverseModel={() => setCurrentView('universe_remix')}
          onOpenProject={handleOpenProject}
          onDeleteProject={handleDeleteProject}
          onOpenPricing={() => setIsPricingModalOpen(true)}
        />
      )}

      {/* VIEW 1: AI SONG GENERATOR */}
      {currentView === 'generator' && (
        <SongGenerator
          t={t}
          currentUser={currentUser}
          voiceProfiles={voiceProfiles}
          onSongCreated={async (newVersion, title) => {
            const newProj: SongProject = {
              id: `proj-gen-${Date.now()}`,
              userId: currentUser?.id || 'demo-user',
              projectType: 'song_generator',
              title,
              originalLanguage: newVersion.language,
              targetLanguage: newVersion.targetLanguage,
              translationEnabled: Boolean(newVersion.targetLanguage),
              versions: [newVersion],
              activeVersionId: newVersion.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await authService.saveProject(newProj);
            setProjects(await authService.getUserProjects());
            setCurrentUser(authService.getCurrentUser());
          }}
          onOpenStudioWithSong={(version) => {
            setStudioInitialVersion(version);
            setCurrentView('song_studio');
          }}
          onOpenAuth={() => {
            setAuthModalMode('signup');
            setIsAuthModalOpen(true);
          }}
        />
      )}

      {/* VIEW 2: AI SONG STUDIO — SING IN YOUR OWN VOICE */}
      {currentView === 'song_studio' && (
        <SongStudio
          t={t}
          currentUser={currentUser}
          voiceProfiles={voiceProfiles}
          initialVersion={studioInitialVersion}
          onStudioSessionFinished={async (savedProject) => {
            setProjects(await authService.getUserProjects());
            setCurrentUser(authService.getCurrentUser());
          }}
          onOpenAuth={() => {
            setAuthModalMode('signup');
            setIsAuthModalOpen(true);
          }}
        />
      )}

      {/* VIEW 3: AI VOICE CLONER */}
      {currentView === 'voice_cloner' && (
        <VoiceCloner
          t={t}
          currentUser={currentUser}
          voiceProfiles={voiceProfiles}
          onProfilesUpdated={async () => {
            setVoiceProfiles(await authService.getVoiceProfiles());
          }}
          onSelectProfileForGenerator={(profile) => {
            setCurrentView('generator');
          }}
          onOpenAuth={() => {
            setAuthModalMode('signup');
            setIsAuthModalOpen(true);
          }}
        />
      )}

      {/* VIEW 4: UNIVERSE MODEL (Powered by AndroMida AI) */}
      {currentView === 'universe_remix' && (
        <UniverseModel
          currentUser={currentUser || authService.getCurrentUser()!}
          onOpenPricing={() => setIsPricingModalOpen(true)}
          onSaveProject={async (savedProject) => {
            await authService.saveProject(savedProject);
            setProjects(await authService.getUserProjects());
            setCurrentUser(authService.getCurrentUser());
            setCurrentProject(savedProject);
          }}
          onOpenDashboard={() => setCurrentView('dashboard')}
          initialProject={currentProject?.projectType === 'universe_remix' ? currentProject : null}
        />
      )}

      {/* VIEW: UPLOAD SONG (Translation / Stems) */}
      {currentView === 'upload' && currentUser && (
        <UploadSongView
          t={t}
          currentUser={currentUser}
          onSongProcessed={handleSongProcessed}
          onCancel={() => setCurrentView('dashboard')}
          onOpenPricing={() => setIsPricingModalOpen(true)}
        />
      )}

      {/* VIEW: LEGACY MULTI-VERSION STUDIO (Synchronized Staves & Lyric Video) */}
      {currentView === 'studio' && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
          {/* Studio Navigation & Song Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
                  {currentProject?.title || activeVersion.title}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-300 font-mono">
                  v{activeVersion.versionNumber}.0
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                {activeVersion.title}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {activeVersion.genre} • {activeVersion.mood} • {activeVersion.bpm} BPM • {activeVersion.language}
                {activeVersion.targetLanguage && ` → ${activeVersion.targetLanguage}`}
              </p>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'studio'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lyrics Studio</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('versions')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'versions'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Versions ({versions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('quality')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'quality'
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Mastering Quality</span>
              </button>
            </div>
          </div>

          {/* Interactive Waveform Audio Player */}
          <WaveformPlayer
            version={activeVersion}
            isPlaying={isPlaying && playingVersionId === activeVersion.id}
            currentTime={currentTime}
            onPlayPause={() => handlePlayPause(activeVersion)}
            onSeek={handleSeek}
            onOpenRegenerate={() => setIsRegeneratePanelOpen(true)}
          />

          {/* Main Tab Content */}
          {activeTab === 'studio' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Synchronized Lyrics & Meaning Translation Staves */}
              <div className="lg:col-span-2">
                <LyricsTranslationView
                  version={activeVersion}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  onSeekLine={handleSeek}
                  onRegenerateTranslation={handleRegenerateTranslation}
                  isUpdatingTranslation={isUpdatingTranslation}
                />
              </div>

              {/* Sidebar: Music Video Snapshot & 8-Step Mastering */}
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Dynamic Lyric Video
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-purple-300 font-mono">
                      {activeVersion.template}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Auto-render responsive lyric video with frequency visualizer and customized motion staves.
                  </p>
                  <button
                    id="sidebar-create-video-btn"
                    type="button"
                    onClick={() => setIsVideoStudioOpen(true)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-purple-950/30"
                  >
                    <Film className="w-4 h-4" />
                    Open Video Studio
                  </button>
                </div>

                <AudioQualityReport
                  report={activeVersion.qualityReport}
                  versionNumber={activeVersion.versionNumber}
                  onRegenerateToFix={() => handleFixDefects(activeVersion)}
                />
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <VersionsList
              versions={versions}
              activeVersionId={activeVersionId}
              playingVersionId={playingVersionId}
              isPlaying={isPlaying}
              onPlayPause={(v) => handlePlayPause(v)}
              onSelectVersion={(v) => {
                setActiveVersionId(v.id);
                setCurrentTime(0);
                audioEngine.playVersion(v.id, v.audioParams, v.lyricsLines, 0);
                setIsPlaying(true);
                setPlayingVersionId(v.id);
              }}
              onCompare={(vA, vB) => handleOpenCompare(vA, vB)}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onOpenRegenerateModal={() => setIsRegeneratePanelOpen(true)}
              onFixDefects={handleFixDefects}
            />
          )}

          {activeTab === 'quality' && (
            <div className="space-y-4">
              <AudioQualityReport
                report={activeVersion.qualityReport}
                versionNumber={activeVersion.versionNumber}
                onRegenerateToFix={() => handleFixDefects(activeVersion)}
              />
            </div>
          )}
        </div>
      )}
      </main>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <PricingModal
        isOpen={isPricingModalOpen}
        currentUser={currentUser}
        onClose={() => setIsPricingModalOpen(false)}
        onUpgraded={(updated) => setCurrentUser(updated)}
      />

      <RegenerationPanel
        isOpen={isRegeneratePanelOpen}
        onClose={() => setIsRegeneratePanelOpen(false)}
        currentVersion={activeVersion}
        onGenerateNewVersion={handleGenerateNewVersion}
        isGenerating={isGenerating}
      />

      <VideoStudioModal
        isOpen={isVideoStudioOpen}
        onClose={() => setIsVideoStudioOpen(false)}
        version={activeVersion}
        onRegenerateTarget={handleVideoRegenerateTarget}
        isProcessing={isVideoProcessing}
      />

      {isCompareModalOpen && (
        <VersionComparisonModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          versions={versions}
          initialVersionA={compareVersionA}
          initialVersionB={compareVersionB}
          onSelectVersion={(v) => {
            setActiveVersionId(v.id);
            setCurrentTime(0);
            audioEngine.playVersion(v.id, v.audioParams, v.lyricsLines, 0);
            setIsPlaying(true);
            setPlayingVersionId(v.id);
          }}
        />
      )}
    </div>
  );
}
