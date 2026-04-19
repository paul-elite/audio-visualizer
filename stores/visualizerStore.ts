'use client';

import { create } from 'zustand';
import { AudioData } from '@/types';

interface AudioSettings {
  speed: number;
  pitch: number;
  bass: number;
  treble: number;
  reverb: boolean;
  echo: boolean;
  vocalsOnly: boolean;
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

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

  // Audio settings
  settings: AudioSettings;
  updateSettings: (settings: Partial<AudioSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: AudioSettings = {
  speed: 1.0,
  pitch: 0,
  bass: 0,
  treble: 0,
  reverb: false,
  echo: false,
  vocalsOnly: false,
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

  // Audio settings
  settings: defaultSettings,
  updateSettings: (newSettings) =>
    set((s) => ({ settings: { ...s.settings, ...newSettings } })),
  resetSettings: () => set({ settings: defaultSettings }),
}));
