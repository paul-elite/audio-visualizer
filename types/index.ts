export type VisualizerMode = 'bars' | 'waveform' | 'circular' | 'particles';

export interface AudioData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  bass: number;
  mids: number;
  highs: number;
  amplitude: number;
}

export interface VisualSettings {
  mode: VisualizerMode;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  glowIntensity: number;
  lineThickness: number;
  particleCount: number;
  sensitivity: number;
  speed: number;
  smoothing: number;
  bassToScale: boolean;
  midsToRotation: boolean;
  highsToColor: boolean;
}

export interface Preset {
  name: string;
  settings: Partial<VisualSettings>;
}

export interface ExportSettings {
  format: 'mp4' | 'gif' | 'png';
  resolution: '1080p' | '4k';
  duration: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}
