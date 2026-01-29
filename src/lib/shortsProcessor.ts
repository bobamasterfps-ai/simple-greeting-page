/**
 * Simplified Shorts Video Processor
 * Combines FFmpeg loading and video processing into a clean API
 */
import { clipFFmpegWorker } from './clipFFmpegWorker';

export interface ShortClip {
  blob: Blob;
  startTime: number;
  duration: number;
  index: number;
}

/**
 * Process a video file into a TikTok/Shorts format clip
 * 
 * @param file - Source video file
 * @param startSeconds - Start time in seconds
 * @param durationSeconds - Duration in seconds
 * @param onProgress - Progress callback (0-100)
 * @returns Processed video blob in 9:16 format
 */
export async function createShort(
  file: File | Blob,
  startSeconds: number,
  durationSeconds: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return clipFFmpegWorker.makeShort(file, startSeconds, durationSeconds, onProgress);
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate multiple shorts from a video at specific timestamps
 */
export async function generateShortsFromTimestamps(
  file: File | Blob,
  timestamps: number[],
  clipDuration: number = 7,
  preRoll: number = 4,
  onClipComplete?: (clip: ShortClip) => void,
  onProgress?: (current: number, total: number) => void
): Promise<ShortClip[]> {
  const clips: ShortClip[] = [];
  
  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i];
    const startTime = Math.max(0, timestamp - preRoll);
    
    if (onProgress) {
      onProgress(i + 1, timestamps.length);
    }
    
    try {
      const blob = await createShort(file, startTime, clipDuration);
      
      const clip: ShortClip = {
        blob,
        startTime,
        duration: clipDuration,
        index: i
      };
      
      clips.push(clip);
      
      if (onClipComplete) {
        onClipComplete(clip);
      }
    } catch (error) {
      console.error(`Failed to create clip at ${timestamp}s:`, error);
    }
  }
  
  return clips;
}

/**
 * Pre-load FFmpeg for faster subsequent operations
 */
export async function preloadFFmpeg(onProgress?: (progress: number) => void): Promise<void> {
  await clipFFmpegWorker.load(onProgress);
}

/**
 * Check if FFmpeg is loaded
 */
export function isFFmpegReady(): boolean {
  return clipFFmpegWorker.isLoaded();
}
