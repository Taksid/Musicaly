import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  Mic,
  Trash2,
  Check,
  Play,
  Pause,
  Upload,
  Plus,
  ArrowRight,
  Disc,
  X,
  Volume2,
} from 'lucide-react';
import { VoiceProfile, User, MusicfyModelId } from '../types';
import { audioEngine } from '../services/audioEngine';
import { authService } from '../services/authService';
import { TranslationDict } from '../i18n/translations';
import { ModelSelector } from './ModelSelector';

interface VoiceClonerProps {
  t: TranslationDict;
  currentUser: User | null;
  voiceProfiles: VoiceProfile[];
  onProfilesUpdated: () => void;
  onSelectProfileForGenerator?: (profile: VoiceProfile) => void;
  onOpenAuth: () => void;
}

export const VoiceCloner: React.FC<VoiceClonerProps> = ({
  t,
  currentUser,
  voiceProfiles,
  onProfilesUpdated,
  onSelectProfileForGenerator,
  onOpenAuth,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileGender, setProfileGender] = useState<'female' | 'male' | 'androgynous'>('female');
  const [profileDescription, setProfileDescription] = useState('');
  const [sampleType, setSampleType] = useState<'record' | 'upload'>('record');

  // Model Selection (Default to Mars)
  const [selectedModel, setSelectedModel] = useState<MusicfyModelId>('mars');

  // Recording State
  const [isRecordingSample, setIsRecordingSample] = useState(false);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [sampleAudioUrl, setSampleAudioUrl] = useState<string | null>(null);
  const recordingTimerRef = useRef<number | null>(null);

  // Consent & Verification
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [consentSpokenText, setConsentSpokenText] = useState(
    `I, ${currentUser?.name || 'Creator'}, authorize Musicfy AI to create an AI vocal profile using my voice for my private music creation.`
  );

  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.name) {
      setConsentSpokenText(
        `I, ${currentUser.name}, authorize Musicfy AI to create an AI vocal profile using my voice for my private music creation.`
      );
    }
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      audioEngine.stop();
    };
  }, []);

  const handleStartRecordingSample = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setErrorMessage(null);
    const res = await audioEngine.startMicrophoneRecording();
    if (!res.success) {
      setErrorMessage(res.error || 'Microphone access is required to record voice sample.');
      return;
    }

    setIsRecordingSample(true);
    setRecordedDuration(0);
    recordingTimerRef.current = window.setInterval(() => {
      setRecordedDuration((prev) => {
        const next = prev + 1;
        if (next >= 30) {
          handleStopRecordingSample();
        }
        return next;
      });
    }, 1000);
  };

  const handleStopRecordingSample = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingSample(false);
    const result = await audioEngine.stopMicrophoneRecording();
    setSampleAudioUrl(result.url);
  };

  const handleCreateProfile = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!profileName.trim()) {
      setErrorMessage('Please give your voice profile a name.');
      return;
    }

    if (!consentConfirmed) {
      setErrorMessage('You must confirm consent before creating a vocal model.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const consentRes = await fetch('/api/verify-voice-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentText: consentSpokenText,
          userName: currentUser.name || 'Creator',
        }),
      });

      const consentData = await consentRes.json();
      if (!consentData.verified) {
        throw new Error('Consent verification was not authorized.');
      }

      const profileRes = await fetch('/api/create-voice-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          gender: profileGender,
          description: profileDescription,
          sampleDuration: Math.max(15, recordedDuration || 20),
        }),
      });

      const profileData = await profileRes.json();
      if (!profileData.profile) {
        throw new Error('Failed to generate voice profile');
      }

      const newVoiceProfile: VoiceProfile = {
        ...profileData.profile,
        userId: currentUser.id,
        sampleUrl: sampleAudioUrl || undefined,
        consentSentenceRecorded: consentSpokenText,
        consentDate: consentData.consentDate || new Date().toISOString(),
      };

      await authService.saveVoiceProfile(newVoiceProfile);
      onProfilesUpdated();

      setSuccessMessage(`Voice Profile "${profileName}" created successfully.`);
      setIsCreatingNew(false);
      setProfileName('');
      setProfileDescription('');
      setConsentConfirmed(false);
      setSampleAudioUrl(null);
    } catch (err: unknown) {
      console.error('Error creating voice profile:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(`Failed to create voice profile: ${msg}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    await authService.deleteVoiceProfile(profileId);
    onProfilesUpdated();
    setProfileToDelete(null);
    setSuccessMessage('Voice profile permanently deleted.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242630] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Voice Cloner</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Enroll custom vocal profiles with verified consent to sing lead melodies in your own natural timbre.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreatingNew(true);
            setSuccessMessage(null);
            setErrorMessage(null);
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-bold text-xs hover:opacity-95 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-md shadow-pink-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Voice Model</span>
        </button>
      </div>

      {/* Model Selector */}
      <ModelSelector
        selectedModelId={selectedModel}
        onSelectModel={(m) => setSelectedModel(m)}
        currentUser={currentUser}
        onOpenPricing={onOpenAuth}
        label="Voice Cloning Model"
      />

      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Enrollment Modal / Form */}
      {isCreatingNew && (
        <div className="rounded-2xl bg-[#18191f] border border-[#262832] p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#242630] pb-3">
            <h2 className="text-base font-semibold text-zinc-100">Create New Voice Model</h2>
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-300 font-medium">Model Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. My Studio Voice"
                  className="w-full px-3 py-2 rounded-lg bg-[#14151a] border border-[#262832] text-xs text-zinc-100 focus:outline-hidden focus:border-zinc-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-300 font-medium">Vocal Range</label>
                <select
                  value={profileGender}
                  onChange={(e) => setProfileGender(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[#14151a] border border-[#262832] text-xs text-zinc-100 focus:outline-hidden focus:border-zinc-500"
                >
                  <option value="female">Female (Soprano / Alto)</option>
                  <option value="male">Male (Tenor / Baritone)</option>
                  <option value="androgynous">Neutral / Blend</option>
                </select>
              </div>
            </div>

            {/* Sample Recording */}
            <div className="p-4 rounded-xl bg-[#14151a] border border-[#262832] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-300">Voice Audio Sample</span>
                <span className="text-zinc-500">Record 15-30 seconds of clean speaking or singing</span>
              </div>

              <div className="flex items-center gap-3">
                {!isRecordingSample ? (
                  <button
                    type="button"
                    onClick={handleStartRecordingSample}
                    className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <Mic className="w-4 h-4 text-pink-500" />
                    <span>{sampleAudioUrl ? 'Re-record Sample' : 'Record Voice Sample'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecordingSample}
                    className="px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer animate-pulse"
                  >
                    <div className="w-2.5 h-2.5 rounded-xs bg-white" />
                    <span>Stop ({recordedDuration}s / 30s)</span>
                  </button>
                )}

                {sampleAudioUrl && !isRecordingSample && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Sample captured ({recordedDuration}s)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Consent Verification */}
            <div className="p-4 rounded-xl bg-[#14151a] border border-[#262832] space-y-3">
              <div className="text-xs font-medium text-zinc-300">Consent Verification</div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 italic">
                "{consentSpokenText}"
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-pink-500 bg-zinc-800 border-zinc-700"
                />
                <span className="text-xs text-zinc-300">
                  I confirm this is my own voice and authorize Musicfy to synthesize this vocal profile for my account.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#242630]">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateProfile}
                disabled={isVerifying || !profileName.trim() || !consentConfirmed}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-bold text-xs hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-md shadow-pink-500/20"
              >
                {isVerifying ? (
                  <>
                    <Disc className="w-3.5 h-3.5 animate-spin" />
                    <span>Enrolling Voice Model...</span>
                  </>
                ) : (
                  <span>Create Voice Model</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Profiles List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200">Enrolled Voice Models ({voiceProfiles.length})</h2>

        {voiceProfiles.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#18191f] border border-[#262832] text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
              <Radio className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-zinc-200">No vocal models enrolled yet</div>
            <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
              Create your first voice model by recording a brief vocal sample and verifying consent.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {voiceProfiles.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-[#18191f] border border-[#262832] flex items-center justify-between"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-100 truncate">{p.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 capitalize">
                      {p.gender}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Timbre: {p.timbre} • {p.clarityScore}% clarity
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onSelectProfileForGenerator && (
                    <button
                      type="button"
                      onClick={() => onSelectProfileForGenerator(p)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 cursor-pointer"
                    >
                      Use
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteProfile(p.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer"
                    title="Delete model"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
