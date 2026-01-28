export interface GameEvent {
  id: string;
  timestamp: number; // milliseconds
  type: 'KILL' | 'DOUBLE' | 'TRIPLE' | '4K' | 'ACE' | 'CLUTCH' | 'HEADSHOT';
  score: number;
  confidence: number;
  audioSpike?: boolean;
  visualDetected?: boolean;
}

export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
  color?: string;
}

export interface ClipData {
  id: string;
  sourceVideoId: string;
  event: GameEvent;
  startTime: number;
  endTime: number;
  duration: number;
  mode: 'FUNNY' | 'FLEX' | 'TEACHING';
  preset: 'STACKED_FACECAM' | 'FULLSCREEN' | 'CENTERED' | 'CROPPED';
  subtitles?: SubtitleSegment[];
  processedVideoBlob?: Blob;
  thumbnailUrl?: string;
  createdAt: Date;
  status: 'PROCESSING' | 'READY' | 'ERROR';
}

export interface UserClipSettings {
  defaultMode: 'FUNNY' | 'FLEX' | 'TEACHING';
  defaultPreset: 'STACKED_FACECAM' | 'FULLSCREEN' | 'CENTERED' | 'CROPPED';
  fontStyle: string;
  subtitleColor: string;
  wordsPerLine: number;
  enableSubtitles: boolean;
  audioSensitivity: number; // 0-1
}

export interface VideoStorageItem {
  id: string;
  blob: Blob;
  uploadedAt: Date;
  fileName?: string;
  fileSize?: number;
}
