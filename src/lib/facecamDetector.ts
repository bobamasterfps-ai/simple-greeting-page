/**
 * Facecam Motion Detection for reaction highlights
 * Detects sudden movements in the facecam region (typically bottom-left corner)
 */
import type { GameEvent } from '@/types/clipTypes';

export interface FacecamEvent {
  timestamp: number;
  motionScore: number;
  type: 'HYPE' | 'RAGE' | 'FUNNY' | 'CALM';
}

export class FacecamDetector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  /**
   * Detect facecam motion events by analyzing the bottom-left region
   * where webcams are typically placed in streams
   */
  async detectFacecamMotion(
    videoBlob: Blob,
    onProgress?: (progress: number) => void
  ): Promise<FacecamEvent[]> {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);
    video.muted = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Failed to load video'));
    });

    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;

    const events: FacecamEvent[] = [];
    const fps = 8; // Sample at 8 fps for facecam detection
    const interval = 1 / fps;
    let previousFrame: ImageData | null = null;
    const totalFrames = Math.floor(video.duration * fps);
    let frameCount = 0;

    // Motion history for smoothing
    const motionHistory: number[] = [];
    const historySize = 5;

    for (let time = 0; time < video.duration; time += interval) {
      video.currentTime = time;

      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      this.ctx.drawImage(video, 0, 0);

      // Extract facecam region (bottom-left, typically 20% of frame)
      const camWidth = Math.floor(this.canvas.width * 0.20);
      const camHeight = Math.floor(this.canvas.height * 0.25);
      const camX = 0;
      const camY = this.canvas.height - camHeight;

      const camRegion = this.ctx.getImageData(camX, camY, camWidth, camHeight);

      if (previousFrame) {
        const motion = this.calculateMotion(previousFrame, camRegion);
        motionHistory.push(motion);
        if (motionHistory.length > historySize) motionHistory.shift();

        // Calculate average motion for smoothing
        const avgMotion = motionHistory.reduce((a, b) => a + b, 0) / motionHistory.length;

        // Detect significant motion spikes
        if (motion > 0.15 && motion > avgMotion * 1.5) {
          const eventType = this.classifyMotion(motion);
          events.push({
            timestamp: time * 1000,
            motionScore: motion,
            type: eventType
          });
        }
      }

      previousFrame = camRegion;
      frameCount++;

      if (onProgress) {
        onProgress((frameCount / totalFrames) * 100);
      }
    }

    URL.revokeObjectURL(video.src);

    // Merge nearby events
    return this.mergeNearbyEvents(events, 1500);
  }

  /**
   * Classify motion intensity into reaction types
   */
  private classifyMotion(motion: number): FacecamEvent['type'] {
    if (motion > 0.40) return 'RAGE';
    if (motion > 0.30) return 'HYPE';
    if (motion > 0.20) return 'FUNNY';
    return 'CALM';
  }

  /**
   * Calculate motion difference between two frames
   */
  private calculateMotion(img1: ImageData, img2: ImageData): number {
    if (img1.data.length !== img2.data.length) return 0;

    let diff = 0;
    let pixelCount = 0;

    for (let i = 0; i < img1.data.length; i += 4) {
      const r1 = img1.data[i];
      const g1 = img1.data[i + 1];
      const b1 = img1.data[i + 2];

      const r2 = img2.data[i];
      const g2 = img2.data[i + 1];
      const b2 = img2.data[i + 2];

      // Use luminance for better motion detection
      const lum1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
      const lum2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;

      diff += Math.abs(lum1 - lum2);
      pixelCount++;
    }

    return diff / (pixelCount * 255);
  }

  /**
   * Merge events that are close together
   */
  private mergeNearbyEvents(events: FacecamEvent[], threshold: number): FacecamEvent[] {
    if (events.length === 0) return [];

    const merged: FacecamEvent[] = [];
    let current = events[0];

    for (let i = 1; i < events.length; i++) {
      if (events[i].timestamp - current.timestamp < threshold) {
        // Keep the higher motion score
        if (events[i].motionScore > current.motionScore) {
          current = events[i];
        }
      } else {
        merged.push(current);
        current = events[i];
      }
    }

    merged.push(current);
    return merged;
  }
}

export const facecamDetector = new FacecamDetector();
