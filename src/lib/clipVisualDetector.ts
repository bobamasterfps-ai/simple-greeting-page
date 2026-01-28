import type { GameEvent } from '@/types/clipTypes';

export class ClipVisualDetector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  async detectKillFeedChanges(
    videoBlob: Blob,
    onProgress?: (progress: number) => void
  ): Promise<GameEvent[]> {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);
    video.muted = true;
    
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Failed to load video'));
    });

    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;

    const events: GameEvent[] = [];
    const fps = 10; // Sample at 10 fps for performance
    const interval = 1 / fps;
    let previousFrame: ImageData | null = null;
    const totalFrames = Math.floor(video.duration * fps);
    let frameCount = 0;

    for (let time = 0; time < video.duration; time += interval) {
      video.currentTime = time;
      
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      this.ctx.drawImage(video, 0, 0);
      
      // Extract kill feed region (top-right corner - typical Valorant HUD)
      const killFeedX = Math.floor(this.canvas.width * 0.70);
      const killFeedY = 0;
      const killFeedWidth = Math.floor(this.canvas.width * 0.30);
      const killFeedHeight = Math.floor(this.canvas.height * 0.25);
      
      const killFeedRegion = this.ctx.getImageData(
        killFeedX,
        killFeedY,
        killFeedWidth,
        killFeedHeight
      );

      if (previousFrame) {
        const diff = this.calculateImageDifference(previousFrame, killFeedRegion);
        
        // Detect significant changes (kill feed updates)
        if (diff > 0.12) {
          // Check if this is likely a kill event by looking for red color (enemy kills)
          const hasRedPixels = this.detectRedPixels(killFeedRegion);
          
          events.push({
            id: `visual-${Date.now()}-${Math.floor(time * 1000)}`,
            timestamp: time * 1000,
            type: this.classifyEvent(diff, hasRedPixels),
            score: Math.min(10, Math.floor(diff * 40)),
            confidence: Math.min(1, diff * 3),
            visualDetected: true
          });
        }
      }

      previousFrame = killFeedRegion;
      frameCount++;
      
      if (onProgress) {
        onProgress((frameCount / totalFrames) * 100);
      }
    }

    URL.revokeObjectURL(video.src);
    
    // Merge events within 1 second of each other
    return this.mergeNearbyEvents(events, 1000);
  }

  private classifyEvent(diff: number, hasRedPixels: boolean): GameEvent['type'] {
    // Simple heuristic classification
    if (diff > 0.35) {
      return 'ACE'; // Very large change
    } else if (diff > 0.28) {
      return '4K';
    } else if (diff > 0.22) {
      return 'TRIPLE';
    } else if (diff > 0.17) {
      return 'DOUBLE';
    } else if (hasRedPixels) {
      return 'KILL';
    }
    return 'HEADSHOT';
  }

  private detectRedPixels(imageData: ImageData): boolean {
    let redCount = 0;
    const threshold = imageData.data.length / 4 * 0.01; // 1% of pixels
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      
      // Detect red/orange colors typical in kill feed
      if (r > 180 && g < 100 && b < 100) {
        redCount++;
        if (redCount > threshold) return true;
      }
    }
    
    return false;
  }

  private calculateImageDifference(img1: ImageData, img2: ImageData): number {
    if (img1.data.length !== img2.data.length) return 0;
    
    let diff = 0;
    
    for (let i = 0; i < img1.data.length; i += 4) {
      const r1 = img1.data[i];
      const g1 = img1.data[i + 1];
      const b1 = img1.data[i + 2];
      
      const r2 = img2.data[i];
      const g2 = img2.data[i + 1];
      const b2 = img2.data[i + 2];
      
      diff += Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
    }

    return diff / (img1.data.length * 255 / 4 * 3);
  }

  private mergeNearbyEvents(events: GameEvent[], threshold: number): GameEvent[] {
    if (events.length === 0) return [];

    const merged: GameEvent[] = [];
    let current = events[0];

    for (let i = 1; i < events.length; i++) {
      if (events[i].timestamp - current.timestamp < threshold) {
        // Merge - upgrade event type if new one is higher
        const typeOrder: GameEvent['type'][] = ['HEADSHOT', 'KILL', 'DOUBLE', 'TRIPLE', '4K', 'ACE', 'CLUTCH'];
        const currentIndex = typeOrder.indexOf(current.type);
        const newIndex = typeOrder.indexOf(events[i].type);
        
        if (newIndex > currentIndex) {
          current = {
            ...events[i],
            confidence: Math.min(1, current.confidence + 0.2)
          };
        } else {
          current = {
            ...current,
            confidence: Math.min(1, current.confidence + 0.2),
            score: Math.max(current.score, events[i].score)
          };
        }
      } else {
        merged.push(current);
        current = events[i];
      }
    }

    merged.push(current);
    return merged;
  }

  generateThumbnail(videoBlob: Blob, timestamp: number = 0): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoBlob);
      video.muted = true;
      
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(timestamp / 1000, video.duration * 0.5);
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(video.src);
        resolve(thumbnailUrl);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to generate thumbnail'));
      };
    });
  }
}

export const clipVisualDetector = new ClipVisualDetector();
