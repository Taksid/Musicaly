import { User, SongProject, SongVersion, VoiceProfile } from '../types';
import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, increment, query, where, Timestamp } from 'firebase/firestore';

const DEFAULT_DEMO_USER: User = {
  id: 'user-default-1',
  name: 'Creator',
  email: 'creator@musicfy.local',
  plan: 'free',
  freeUsesRemaining: 5,
  totalSuccessfulJobs: 0,
  createdAt: new Date().toISOString(),
};

const USERS_STORAGE_KEY = 'musicfy_users_v3';
const CURRENT_USER_ID_KEY = 'musicfy_current_user_id_v3';
const PROJECTS_STORAGE_KEY = 'musicfy_projects_v3';
const VOICE_PROFILES_STORAGE_KEY = 'musicfy_voice_profiles_v3';

// Seed demo song project (in English by default)
export const DEFAULT_ENGLISH_SEED_VERSION: SongVersion = {
  id: 'v1-starlight',
  versionNumber: 1,
  title: 'Echoes in the Starlight',
  language: 'English',
  targetLanguage: 'Spanish',
  genre: 'Indie Pop & Acoustic',
  mood: 'Lyrical & Uplifting',
  vocalType: 'Female Warm Ethereal',
  bpm: 88,
  tempo: 'Moderato (88 BPM)',
  instruments: ['Acoustic Guitar', 'Grand Piano', 'Sub Bass', 'Drum Machine', 'Ambient Strings'],
  songStructure: 'Verse 1 - Chorus - Verse 2 - Chorus - Outro',
  template: 'Cinematic Horizon',
  lyricsLines: [
    {
      id: 'l1',
      startTime: 0.0,
      endTime: 5.5,
      section: 'Verse 1',
      originalText: 'Walking beneath the silent golden sky',
      phoneticText: 'Walking beneath the silent golden sky',
      translatedText: 'Caminando bajo el silencioso cielo dorado',
      meaning: 'Finding peace under the warmth of the evening twilight',
    },
    {
      id: 'l2',
      startTime: 5.5,
      endTime: 11.2,
      section: 'Verse 1',
      originalText: 'Every memory begins to softly fly',
      phoneticText: 'Every memory begins to softly fly',
      translatedText: 'Cada recuerdo comienza a volar suavemente',
      meaning: 'Past feelings drifting away like gentle clouds',
    },
    {
      id: 'l3',
      startTime: 11.2,
      endTime: 17.0,
      section: 'Chorus',
      originalText: 'Your voice remains a whisper in the breeze',
      phoneticText: 'Your voice remains a whisper in the breeze',
      translatedText: 'Tu voz sigue siendo un susurro en la brisa',
      meaning: 'Unbroken connection across distance and time',
    },
    {
      id: 'l4',
      startTime: 17.0,
      endTime: 22.5,
      section: 'Chorus',
      originalText: 'Guiding my heartbeat through the roaring seas',
      phoneticText: 'Guiding my heartbeat through the roaring seas',
      translatedText: 'Guiando los latidos de mi corazón a través de mares bravos',
      meaning: 'An anchor of courage amidst chaos',
    },
    {
      id: 'l5',
      startTime: 22.5,
      endTime: 28.0,
      section: 'Outro',
      originalText: 'We shine forever in the midnight glow...',
      phoneticText: 'We shine forever in the midnight glow...',
      translatedText: 'Brillamos para siempre en el resplandor de la medianoche...',
      meaning: 'Eternal radiance that darkness cannot extinguish',
    },
  ],
  audioParams: {
    chordProgression: ['C', 'G', 'Am', 'F'],
    tempoBpm: 88,
    scale: 'C Major',
    rootNote: 'C',
    bassPattern: 'Warm Sub Pulse',
    leadMelody: [
      { note: 'C5', start: 0.5, duration: 1.2, freq: 523.25 },
      { note: 'E5', start: 2.0, duration: 1.5, freq: 659.25 },
      { note: 'D5', start: 4.0, duration: 1.0, freq: 587.33 },
      { note: 'G4', start: 6.0, duration: 2.0, freq: 392 },
    ],
    instrumentMix: {
      acousticGuitar: 0.85,
      piano: 0.75,
      bass: 0.8,
      drums: 0.65,
      strings: 0.6,
      synthPad: 0.5,
      vocalLead: 0.9,
    },
    reverbDecay: 2.2,
    filterFreq: 3400,
  },
  qualityReport: {
    overallScore: 98,
    status: 'excellent',
    steps: [
      { name: 'Music Generation', status: 'passed', details: 'Acoustic vocal arrangement synthesized at studio grade', metric: '44.1kHz High-Res' },
      { name: 'Artifact Detection', status: 'passed', details: 'Zero spectral distortion or comb filtering', metric: 'Artifact: 0.05%' },
      { name: 'Noise Detection', status: 'passed', details: 'Background noise dampened to broadcast standard', metric: '-71.8 dBFS' },
      { name: 'Clipping Detection', status: 'passed', details: 'Peak headroom verified with 0.8dB margin', metric: 'Peak: -0.8 dBFS' },
      { name: 'Vocal Quality Check', status: 'passed', details: 'Accurate English phoneme pitch tracking & vibrato', metric: 'Clarity: 99.2%' },
      { name: 'Loudness Normalization', status: 'passed', details: 'Integrated loudness matched to streaming targets', metric: '-14.0 LUFS' },
      { name: 'Audio Mastering', status: 'passed', details: 'Analog tape saturation & stereo width expansion active', metric: 'Width: 120%' },
      { name: 'Final Quality Check', status: 'passed', details: 'Studio master certified for preview and export', metric: 'Master Ready' },
    ],
    detectedIssues: [],
    recommendations: ['Certified broadcast-ready master'],
    peakDbfs: -0.8,
    rmsDbfs: -15.8,
    lufsTarget: -14.0,
    thdPercent: 0.06,
    noiseFloorDbfs: -71.8,
    hasArtifacts: false,
    hasClipping: false,
    hasNoise: false,
    hasBrokenVocals: false,
  },
  videoSettings: {
    template: 'Cinematic Horizon',
    backgroundEffect: 'aurora',
    visualizerStyle: 'bars',
    fontStyle: 'modern',
    aspectRatio: '16:9',
    colorPalette: 'Emerald Gold',
  },
  regenerationNotes: 'Original master version',
  createdAt: new Date().toISOString(),
};

export const INITIAL_DEMO_PROJECT: SongProject = {
  id: 'proj-demo-1',
  userId: 'demo-user-1',
  projectType: 'song_generator',
  title: 'Echoes in the Starlight',
  originalLanguage: 'English',
  translationEnabled: true,
  targetLanguage: 'Spanish',
  versions: [DEFAULT_ENGLISH_SEED_VERSION],
  activeVersionId: DEFAULT_ENGLISH_SEED_VERSION.id,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const INITIAL_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'voice-alex-studio',
    userId: 'demo-user-1',
    name: 'Alex Rivera (Studio Vocal)',
    description: 'Crisp acoustic pop lead with warm natural vibrato and breath control',
    gender: 'female',
    timbre: 'Warm & Ethereal',
    sampleDurationSeconds: 24,
    consentVerified: true,
    consentSentenceRecorded: 'I, Alex Rivera, authorize Musicfy AI to create an AI vocal profile using my voice for my private music creation.',
    consentDate: new Date().toISOString(),
    isPrivate: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'voice-marcus-soul',
    userId: 'demo-user-1',
    name: 'Marcus Bell (Velvet Soul)',
    description: 'Deep resonant baritone ideal for R&B, lo-fi beats, and ballad hooks',
    gender: 'male',
    timbre: 'Velvet Baritone & Soulful',
    sampleDurationSeconds: 30,
    consentVerified: true,
    consentSentenceRecorded: 'I, Marcus Bell, authorize Musicfy AI to create an AI vocal profile using my voice for my private music creation.',
    consentDate: new Date().toISOString(),
    isPrivate: true,
    createdAt: new Date().toISOString(),
  },
];

class AuthService {
  private currentUser: User | null = null;
  private usersCollection = collection(db, 'users');
  private projectsCollection = collection(db, 'projects');
  private voiceProfilesCollection = collection(db, 'voiceProfiles');

  constructor() {
    this.currentUser = DEFAULT_DEMO_USER;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public async signUp(name: string, email: string): Promise<User> {
    const q = query(this.usersCollection, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const existingUser = querySnapshot.docs[0].data() as User;
      this.currentUser = existingUser;
      return existingUser;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim() || 'New Creator',
      email: email.trim().toLowerCase(),
      plan: 'free',
      freeUsesRemaining: 5,
      totalSuccessfulJobs: 0,
      createdAt: new Date().toISOString(),
    };
    
    await setDoc(doc(this.usersCollection, newUser.id), newUser);
    this.currentUser = newUser;
    return newUser;
  }

  public async logIn(email: string): Promise<User | null> {
    const q = query(this.usersCollection, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const user = querySnapshot.docs[0].data() as User;
      this.currentUser = user;
      return user;
    }
    
    return await this.signUp(email.split('@')[0], email);
  }

  public logOut() {
    this.currentUser = null;
  }

  public switchDemoAccount(): User {
    this.currentUser = DEFAULT_DEMO_USER;
    return DEFAULT_DEMO_USER;
  }

  public async consumeSuccessfulUse(): Promise<{ success: boolean; remaining: number }> {
    const user = this.getCurrentUser();
    if (!user) return { success: false, remaining: 0 };
    
    // Only real users in firestore get updated
    if (user.id !== DEFAULT_DEMO_USER.id) {
       if (user.plan === 'premium') {
         user.totalSuccessfulJobs += 1;
         await updateDoc(doc(this.usersCollection, user.id), {
           totalSuccessfulJobs: increment(1)
         });
         return { success: true, remaining: 999 };
       }
       
       if (user.freeUsesRemaining <= 0) {
         return { success: false, remaining: 0 };
       }
       
       user.freeUsesRemaining -= 1;
       user.totalSuccessfulJobs += 1;
       await updateDoc(doc(this.usersCollection, user.id), {
         freeUsesRemaining: increment(-1),
         totalSuccessfulJobs: increment(1)
       });
       return { success: true, remaining: user.freeUsesRemaining };
    } else {
        if (user.plan === 'premium') {
            user.totalSuccessfulJobs += 1;
            return { success: true, remaining: 999 };
        }
        if (user.freeUsesRemaining <= 0) {
            return { success: false, remaining: 0 };
        }
        user.freeUsesRemaining -= 1;
        user.totalSuccessfulJobs += 1;
        return { success: true, remaining: user.freeUsesRemaining };
    }
  }

  public async upgradeToPremium(): Promise<User | null> {
    const user = this.getCurrentUser();
    if (!user) return null;
    
    user.plan = 'premium';
    user.freeUsesRemaining = 9999;
    
    if (user.id !== DEFAULT_DEMO_USER.id) {
      await updateDoc(doc(this.usersCollection, user.id), {
        plan: 'premium',
        freeUsesRemaining: 9999
      });
    }
    return user;
  }

  public async getUserProjects(): Promise<SongProject[]> {
    const user = this.getCurrentUser();
    if (!user) return [];
    
    if (user.id === DEFAULT_DEMO_USER.id) {
        return [];
    }
    
    const q = query(this.projectsCollection, where('userId', '==', user.id));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => d.data() as SongProject);
  }

  public async saveProject(project: SongProject) {
    const user = this.getCurrentUser();
    if (user?.id === DEFAULT_DEMO_USER.id) return;
    
    project.updatedAt = new Date().toISOString();
    await setDoc(doc(this.projectsCollection, project.id), project);
  }

  public async deleteProject(projectId: string) {
    const user = this.getCurrentUser();
    if (user?.id === DEFAULT_DEMO_USER.id) return;
    
    await deleteDoc(doc(this.projectsCollection, projectId));
  }

  public async getVoiceProfiles(): Promise<VoiceProfile[]> {
    const user = this.getCurrentUser();
    if (!user) return [];
    
    if (user.id === DEFAULT_DEMO_USER.id) {
        return [];
    }

    const q = query(this.voiceProfilesCollection, where('userId', '==', user.id));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => d.data() as VoiceProfile);
  }

  public async saveVoiceProfile(profile: VoiceProfile) {
    const user = this.getCurrentUser();
    if (user?.id === DEFAULT_DEMO_USER.id) return;
    
    await setDoc(doc(this.voiceProfilesCollection, profile.id), profile);
  }

  public async deleteVoiceProfile(profileId: string) {
    const user = this.getCurrentUser();
    if (user?.id === DEFAULT_DEMO_USER.id) return;
    
    await deleteDoc(doc(this.voiceProfilesCollection, profileId));
  }
}

export const authService = new AuthService();
