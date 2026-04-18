'use client';

import { create } from 'zustand';
import { AudioData, VisualSettings, PlaybackState, VisualizerMode, Preset } from '@/types';

interface VisualizerStore {
  // Audio file
  audioFile: File | null;
  audioUrl: string | null;
  setAudioFile: (file: File | null) => void;

  // Playback state
  playback: PlaybackState;
  setPlayback: (state: Partial<PlaybackState>) => void;

  // Audio data (from analyzer)
  audioData: AudioData;
  setAudioData: (data: AudioData) => void;

  // Visual settings
  settings: VisualSettings;
  updateSettings: (settings: Partial<VisualSettings>) => void;
  setMode: (mode: VisualizerMode) => void;

  // Presets
  presets: Preset[];
  activePreset: string | null;
  applyPreset: (name: string) => void;

  // Reset
  reset: () => void;
}

const defaultSettings: VisualSettings = {
  mode: 'bars',
  primaryColor: '#00ffff',
  secondaryColor: '#ff00ff',
  backgroundColor: '#0a0a0a',
  glowIntensity: 0.5,
  lineThickness: 2,
  particleCount: 100,
  sensitivity: 1.0,
  speed: 1.0,
  smoothing: 0.8,
  bassToScale: true,
  midsToRotation: false,
  highsToColor: true,
};

const defaultAudioData: AudioData = {
  frequencyData: new Uint8Array(128),
  timeDomainData: new Uint8Array(128),
  bass: 0,
  mids: 0,
  highs: 0,
  amplitude: 0,
};

const defaultPlayback: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
};

const presets: Preset[] = [
  {
    name: 'Club',
    settings: {
      mode: 'bars',
      primaryColor: '#ff0080',
      secondaryColor: '#00ff80',
      backgroundColor: '#0a0a0a',
      glowIntensity: 0.8,
      sensitivity: 1.5,
      speed: 1.2,
    },
  },
  {
    name: 'Chill',
    settings: {
      mode: 'waveform',
      primaryColor: '#4a9eff',
      secondaryColor: '#a855f7',
      backgroundColor: '#0f172a',
      glowIntensity: 0.3,
      sensitivity: 0.6,
      speed: 0.7,
      smoothing: 0.9,
    },
  },
  {
    name: 'Minimal',
    settings: {
      mode: 'waveform',
      primaryColor: '#ffffff',
      secondaryColor: '#666666',
      backgroundColor: '#000000',
      glowIntensity: 0,
      lineThickness: 1,
      sensitivity: 0.8,
    },
  },
  {
    name: 'Neon Pulse',
    settings: {
      mode: 'circular',
      primaryColor: '#00ffff',
      secondaryColor: '#ff00ff',
      backgroundColor: '#0a0a0a',
      glowIntensity: 1.0,
      sensitivity: 1.2,
      bassToScale: true,
      midsToRotation: true,
      highsToColor: true,
    },
  },
];

export const useVisualizerStore = create<VisualizerStore>((set, get) => ({
  // Audio file
  audioFile: null,
  audioUrl: null,
  setAudioFile: (file) => {
    const currentUrl = get().audioUrl;
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }
    const url = file ? URL.createObjectURL(file) : null;
    set({ audioFile: file, audioUrl: url });
  },

  // Playback state
  playback: defaultPlayback,
  setPlayback: (state) =>
    set((s) => ({ playback: { ...s.playback, ...state } })),

  // Audio data
  audioData: defaultAudioData,
  setAudioData: (data) => set({ audioData: data }),

  // Visual settings
  settings: defaultSettings,
  updateSettings: (newSettings) =>
    set((s) => ({ settings: { ...s.settings, ...newSettings } })),
  setMode: (mode) =>
    set((s) => ({ settings: { ...s.settings, mode } })),

  // Presets
  presets,
  activePreset: null,
  applyPreset: (name) => {
    const preset = presets.find((p) => p.name === name);
    if (preset) {
      set((s) => ({
        settings: { ...s.settings, ...preset.settings },
        activePreset: name,
      }));
    }
  },

  // Reset
  reset: () =>
    set({
      audioFile: null,
      audioUrl: null,
      playback: defaultPlayback,
      audioData: defaultAudioData,
      settings: defaultSettings,
      activePreset: null,
    }),
}));
