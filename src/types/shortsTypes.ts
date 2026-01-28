/**
 * Types for the enhanced Shorts Generator system
 */

export type ClipMode = 'FUNNY' | 'FLEX' | 'TEACHING';

export type AspectPreset = 'SHORTS' | 'STACKED' | 'SQUARE' | 'LANDSCAPE';

export type FontStyle = 
  | 'Montserrat' 
  | 'Poppins' 
  | 'Rubik' 
  | 'Oswald' 
  | 'Anton' 
  | 'Impact';

export type SubtitleColor = 
  | 'white' 
  | 'yellow' 
  | 'lime' 
  | 'cyan' 
  | 'auto';

export interface ClipSettings {
  mode: ClipMode;
  preset: AspectPreset;
  fontStyle: FontStyle;
  subtitleColor: SubtitleColor;
  wordsPerLine: number;
  enableSubtitles: boolean;
  preRollMs: number;
  postRollMs: number;
  audioSensitivity: number;
}

export interface ModeConfig {
  id: ClipMode;
  label: string;
  emoji: string;
  description: string;
  preRoll: number;
  postRoll: number;
  effects: {
    slowMo?: boolean;
    speedRamp?: boolean;
    colorGrade?: { saturation: number; brightness: number; contrast: number };
    zoom?: boolean;
  };
}

export interface PresetConfig {
  id: AspectPreset;
  label: string;
  dimensions: string;
  icon: string;
}

export const MODE_CONFIGS: Record<ClipMode, ModeConfig> = {
  FUNNY: {
    id: 'FUNNY',
    label: 'Funny',
    emoji: '😂',
    description: 'Jump cuts, speed ramps, vibrant colors for comedy',
    preRoll: 3000,
    postRoll: 2000,
    effects: {
      speedRamp: true,
      colorGrade: { saturation: 1.3, brightness: 1.1, contrast: 1.1 },
    },
  },
  FLEX: {
    id: 'FLEX',
    label: 'Flex',
    emoji: '🔥',
    description: 'Slow-mo, cinematic zoom, dramatic color grading',
    preRoll: 5000,
    postRoll: 4000,
    effects: {
      slowMo: true,
      zoom: true,
      colorGrade: { saturation: 1.2, brightness: 1.05, contrast: 1 },
    },
  },
  TEACHING: {
    id: 'TEACHING',
    label: 'Teaching',
    emoji: '📚',
    description: 'Clean cuts, annotations, clear audio for learning',
    preRoll: 7000,
    postRoll: 3000,
    effects: {
      colorGrade: { saturation: 1, brightness: 1, contrast: 1 },
    },
  },
};

export const PRESET_CONFIGS: Record<AspectPreset, PresetConfig> = {
  SHORTS: {
    id: 'SHORTS',
    label: '9:16 Shorts',
    dimensions: '1080×1920',
    icon: '📱',
  },
  STACKED: {
    id: 'STACKED',
    label: '9:16 Stacked',
    dimensions: '1080×1920',
    icon: '📹',
  },
  SQUARE: {
    id: 'SQUARE',
    label: '1:1 Square',
    dimensions: '1080×1080',
    icon: '⬜',
  },
  LANDSCAPE: {
    id: 'LANDSCAPE',
    label: '16:9 Landscape',
    dimensions: '1920×1080',
    icon: '🖥️',
  },
};

export const FONT_STYLES: FontStyle[] = [
  'Montserrat',
  'Poppins',
  'Rubik',
  'Oswald',
  'Anton',
  'Impact',
];

export const SUBTITLE_COLORS: { id: SubtitleColor; label: string; hex: string }[] = [
  { id: 'white', label: 'White', hex: '#FFFFFF' },
  { id: 'yellow', label: 'Yellow', hex: '#FFFF00' },
  { id: 'lime', label: 'Lime', hex: '#00FF00' },
  { id: 'cyan', label: 'Cyan', hex: '#00FFFF' },
  { id: 'auto', label: 'Auto (AI)', hex: 'auto' },
];

export const DEFAULT_SETTINGS: ClipSettings = {
  mode: 'FLEX',
  preset: 'SHORTS',
  fontStyle: 'Montserrat',
  subtitleColor: 'white',
  wordsPerLine: 3,
  enableSubtitles: true,
  preRollMs: 5000,
  postRollMs: 4000,
  audioSensitivity: 0.6,
};
