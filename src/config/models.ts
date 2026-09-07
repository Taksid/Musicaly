import { MusicfyModel, MusicfyModelId } from '../types';

export const MUSICFY_MODELS: Record<MusicfyModelId, MusicfyModel> = {
  mars: {
    id: 'mars',
    name: 'Mars',
    tagline: 'Free model for standard music composition & vocal tuning',
    tier: 'free',
    tierLabel: 'Free Model',
    isConfigured: true,
    isAvailable: true,
    backendStatus: 'connected',
    backendNotice: 'Configured & Active (Gemini API / Lyria routed)',
    speed: '1x Standard Speed',
    fidelity: '44.1kHz / 16-bit Broadcast WAV',
    capabilities: [
      'Multi-track song composition from text prompts or lyrics',
      'Stem isolation for vocal and instrumental tracks',
      'Studio 1-2-3 recording booth synchronization',
      'Standard EQ, dynamic compression, and reverb',
      'Included for all Free and Pro tier creators',
    ],
    recommendedFor: 'Everyday songwriting, demo tracking, and vocal practice',
  },
  earth: {
    id: 'earth',
    name: 'Earth',
    tagline: 'Pro model for advanced creation with harmonic depth',
    tier: 'pro',
    tierLabel: 'Pro Model',
    isConfigured: true,
    isAvailable: true,
    backendStatus: 'connected',
    backendNotice: 'Configured & Active (Gemini API routed)',
    speed: '0.9x Deep Polyphony Pass',
    fidelity: '48kHz / 24-bit Studio Master',
    capabilities: [
      'Advanced polyphonic harmony & modulation modeling',
      'Multi-layer backing vocal arrangements (SATB harmonies)',
      'Acoustic resonance & dynamic humanization',
      'Extended instrumental solos and complex bridges',
      'Analog console warmth emulation',
    ],
    recommendedFor: 'Producers composing intricate arrangements, film scores, and multi-vocal harmonies',
  },
  light_speed: {
    id: 'light_speed',
    name: 'Light Speed',
    tagline: 'Fast model for quicker processing & rapid iteration',
    tier: 'pro',
    tierLabel: 'Pro Model',
    isConfigured: true,
    isAvailable: true,
    backendStatus: 'connected',
    backendNotice: 'Configured & Active (Gemini API Flash routed)',
    speed: '3x Turbo (Sub-2s Turnaround)',
    fidelity: '44.1kHz High-Efficiency Master',
    capabilities: [
      'Ultra-fast turnaround (< 2 seconds generation time)',
      'Real-time vocal pitch retargeting during active takes',
      'Instant stem separation & chord breakdown',
      'Rapid ideation loops for live studio songwriting',
      'Low-latency GPU tensor architecture',
    ],
    recommendedFor: 'Live recording sessions, speed songwriting, and rapid take auditioning',
  },
  light_speed_power: {
    id: 'light_speed_power',
    name: 'Light Speed Power',
    tagline: 'Best model for the highest quality output & master fidelity',
    tier: 'pro',
    tierLabel: 'Pro Model',
    isConfigured: true,
    isAvailable: true,
    backendStatus: 'connected',
    backendNotice: 'Configured & Active (Gemini API Pro routed)',
    speed: 'Mastering Priority GPU',
    fidelity: '96kHz / 24-bit Ultra-Resolution Master',
    capabilities: [
      'Highest quality audio synthesis and acoustic modeling',
      'Zero-artifact formant tracking & micro-pitch stability',
      'Spatial 3D stereo imaging with binaural depth',
      'Broadcast-compliant LUFS mastering with multi-band limiting',
      'Audiophile-grade transient preservation and tape warmth',
    ],
    recommendedFor: 'Commercial radio releases, streaming distribution, and final studio mastering',
  },
};

export const MUSICFY_MODEL_LIST: MusicfyModel[] = Object.values(MUSICFY_MODELS);

export function getModelById(id: MusicfyModelId | string | undefined): MusicfyModel {
  if (id && id in MUSICFY_MODELS) {
    return MUSICFY_MODELS[id as MusicfyModelId];
  }
  return MUSICFY_MODELS.mars;
}
