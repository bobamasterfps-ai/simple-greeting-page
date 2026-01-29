/**
 * Clip Timing Engine
 * Calculates optimal clip windows based on mode and event type
 */
import type { GameEvent } from '@/types/clipTypes';
import type { ClipMode } from '@/types/shortsTypes';

export interface ClipWindow {
  startTime: number; // ms
  endTime: number; // ms
  duration: number; // ms
  eventTime: number; // ms (when the main action happens)
  preRoll: number; // ms
  postRoll: number; // ms
}

/**
 * Default timing configurations per mode
 */
const MODE_TIMING: Record<ClipMode, { preRoll: number; postRoll: number }> = {
  FUNNY: { preRoll: 3000, postRoll: 2500 },
  FLEX: { preRoll: 5000, postRoll: 4000 },
  TEACHING: { preRoll: 7000, postRoll: 3000 },
};

/**
 * Event-specific timing adjustments
 */
const EVENT_ADJUSTMENTS: Record<GameEvent['type'], { preRollBonus: number; postRollBonus: number }> = {
  HEADSHOT: { preRollBonus: 0, postRollBonus: 0 },
  KILL: { preRollBonus: 0, postRollBonus: 500 },
  DOUBLE: { preRollBonus: 500, postRollBonus: 1000 },
  TRIPLE: { preRollBonus: 1000, postRollBonus: 1500 },
  '4K': { preRollBonus: 1500, postRollBonus: 2000 },
  ACE: { preRollBonus: 2000, postRollBonus: 2500 },
  CLUTCH: { preRollBonus: 3000, postRollBonus: 2000 },
};

export class ClipTimingEngine {
  private mode: ClipMode = 'FLEX';
  private videoDuration: number = 0;

  setMode(mode: ClipMode): void {
    this.mode = mode;
  }

  setVideoDuration(durationMs: number): void {
    this.videoDuration = durationMs;
  }

  /**
   * Calculate clip window for a single event
   */
  calculateClipWindow(event: GameEvent, customPreRoll?: number, customPostRoll?: number): ClipWindow {
    const baseConfig = MODE_TIMING[this.mode];
    const eventAdjust = EVENT_ADJUSTMENTS[event.type];

    const preRoll = customPreRoll ?? (baseConfig.preRoll + eventAdjust.preRollBonus);
    const postRoll = customPostRoll ?? (baseConfig.postRoll + eventAdjust.postRollBonus);

    let startTime = Math.max(0, event.timestamp - preRoll);
    let endTime = event.timestamp + postRoll;

    // Clamp to video duration if set
    if (this.videoDuration > 0) {
      endTime = Math.min(endTime, this.videoDuration);
      // Adjust start if end was clamped
      if (endTime - startTime < preRoll + postRoll) {
        startTime = Math.max(0, endTime - (preRoll + postRoll));
      }
    }

    return {
      startTime,
      endTime,
      duration: endTime - startTime,
      eventTime: event.timestamp,
      preRoll: event.timestamp - startTime,
      postRoll: endTime - event.timestamp,
    };
  }

  /**
   * Calculate clip windows for multiple events, avoiding overlaps
   */
  calculateBatchClipWindows(
    events: GameEvent[],
    customPreRoll?: number,
    customPostRoll?: number,
    mergeThreshold: number = 3000
  ): ClipWindow[] {
    if (events.length === 0) return [];

    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
    const windows: ClipWindow[] = [];

    for (const event of sortedEvents) {
      const newWindow = this.calculateClipWindow(event, customPreRoll, customPostRoll);

      // Check if this window overlaps with the last one
      if (windows.length > 0) {
        const lastWindow = windows[windows.length - 1];

        // If events are close enough, merge the windows
        if (newWindow.startTime - lastWindow.endTime < mergeThreshold) {
          // Extend the last window to include this event
          lastWindow.endTime = newWindow.endTime;
          lastWindow.duration = lastWindow.endTime - lastWindow.startTime;
          continue;
        }
      }

      windows.push(newWindow);
    }

    return windows;
  }

  /**
   * Get optimal clip duration based on mode and platform
   */
  getOptimalDuration(platform: 'shorts' | 'tiktok' | 'reels' | 'twitter'): { min: number; max: number; ideal: number } {
    const platformLimits: Record<string, { min: number; max: number; ideal: number }> = {
      shorts: { min: 15000, max: 60000, ideal: 45000 },
      tiktok: { min: 15000, max: 60000, ideal: 30000 },
      reels: { min: 15000, max: 90000, ideal: 45000 },
      twitter: { min: 6000, max: 140000, ideal: 30000 },
    };

    return platformLimits[platform] || platformLimits.shorts;
  }

  /**
   * Adjust clip window to fit platform requirements
   */
  adjustForPlatform(
    window: ClipWindow,
    platform: 'shorts' | 'tiktok' | 'reels' | 'twitter'
  ): ClipWindow {
    const limits = this.getOptimalDuration(platform);
    let { startTime, endTime, eventTime, preRoll, postRoll } = window;
    let duration = endTime - startTime;

    // If too long, trim equally from both ends
    if (duration > limits.max) {
      const excess = duration - limits.max;
      const trimEach = excess / 2;
      startTime += trimEach;
      endTime -= trimEach;
      duration = limits.max;
    }

    // If too short, extend equally on both ends
    if (duration < limits.min && this.videoDuration > 0) {
      const needed = limits.min - duration;
      const extendEach = needed / 2;
      startTime = Math.max(0, startTime - extendEach);
      endTime = Math.min(this.videoDuration, endTime + extendEach);
      duration = endTime - startTime;
    }

    return {
      startTime,
      endTime,
      duration,
      eventTime,
      preRoll: eventTime - startTime,
      postRoll: endTime - eventTime,
    };
  }
}

export const clipTimingEngine = new ClipTimingEngine();
