/**
 * Unified Event Detection System
 * Multi-source fusion combining Audio, Visual, and Facecam detection
 */
import type { GameEvent } from '@/types/clipTypes';
import type { FacecamEvent } from './facecamDetector';
import type { FusedEvent, FusionConfig } from './eventFusionEngine';
import { facecamDetector } from './facecamDetector';
import { clipVisualDetector } from './clipVisualDetector';
import { highlightScorer, type ScoredHighlight } from './highlightScorer';
import type { ClipMode } from '@/types/shortsTypes';

export interface DetectionProgress {
  stage: 'audio' | 'visual' | 'facecam' | 'fusion' | 'scoring';
  progress: number;
  message: string;
}

export interface DetectionConfig {
  audioSensitivity: number;
  enableVisual: boolean;
  enableFacecam: boolean;
  mode: ClipMode;
  timeThreshold: number; // ms window for fusion
}

export interface DetectionResult {
  events: FusedEvent[];
  scoredHighlights: ScoredHighlight[];
  stats: {
    audioEvents: number;
    visualEvents: number;
    facecamEvents: number;
    fusedEvents: number;
    processingTime: number;
  };
}

const DEFAULT_CONFIG: DetectionConfig = {
  audioSensitivity: 0.7,
  enableVisual: true,
  enableFacecam: true,
  mode: 'FLEX',
  timeThreshold: 1500,
};

/**
 * Source weights for fusion scoring
 */
const SOURCE_WEIGHTS = {
  audio: 1.0,
  visual: 1.3,
  facecam: 1.5,
};

/**
 * Facecam reaction boosts by mode
 */
const FACECAM_BOOSTS: Record<ClipMode, Record<FacecamEvent['type'], number>> = {
  FUNNY: { HYPE: 1.3, RAGE: 1.8, FUNNY: 2.0, CALM: 0.5 },
  FLEX: { HYPE: 1.5, RAGE: 1.0, FUNNY: 0.8, CALM: 1.2 },
  TEACHING: { HYPE: 0.8, RAGE: 0.5, FUNNY: 0.7, CALM: 1.5 },
};

export class UnifiedEventDetector {
  private config: DetectionConfig;
  private abortController: AbortController | null = null;

  constructor(config: Partial<DetectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setConfig(config: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...config };
    highlightScorer.setMode(this.config.mode);
  }

  abort(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  /**
   * Run full multi-source detection on a video
   */
  async detectAll(
    videoBlob: Blob,
    onProgress?: (progress: DetectionProgress) => void
  ): Promise<DetectionResult> {
    const startTime = performance.now();
    this.abortController = new AbortController();

    // Parallel detection for all enabled sources
    const detectionPromises: Promise<{
      audio: GameEvent[];
      visual: GameEvent[];
      facecam: FacecamEvent[];
    }>[] = [];

    onProgress?.({
      stage: 'audio',
      progress: 0,
      message: 'Starting multi-source detection...',
    });

    // Always run audio detection
    const audioPromise = this.detectAudioEvents(videoBlob, (p) => {
      onProgress?.({ stage: 'audio', progress: p, message: 'Analyzing audio peaks...' });
    });

    // Visual detection if enabled
    const visualPromise = this.config.enableVisual
      ? clipVisualDetector.detectKillFeedChanges(videoBlob, (p) => {
          onProgress?.({ stage: 'visual', progress: p, message: 'Scanning kill feed...' });
        })
      : Promise.resolve([]);

    // Facecam detection if enabled
    const facecamPromise = this.config.enableFacecam
      ? facecamDetector.detectFacecamMotion(videoBlob, (p) => {
          onProgress?.({ stage: 'facecam', progress: p, message: 'Detecting reactions...' });
        })
      : Promise.resolve([]);

    // Run all detections in parallel
    const [audioEvents, visualEvents, facecamEvents] = await Promise.all([
      audioPromise,
      visualPromise,
      facecamPromise,
    ]);

    onProgress?.({
      stage: 'fusion',
      progress: 80,
      message: 'Fusing detection sources...',
    });

    // Fuse all events
    const fusedEvents = this.fuseAllSources(audioEvents, visualEvents, facecamEvents);

    onProgress?.({
      stage: 'scoring',
      progress: 90,
      message: 'Scoring highlights...',
    });

    // Score and rank
    highlightScorer.setMode(this.config.mode);
    const scoredHighlights = highlightScorer.scoreAndRank(fusedEvents);

    const processingTime = performance.now() - startTime;

    onProgress?.({
      stage: 'scoring',
      progress: 100,
      message: `Found ${fusedEvents.length} highlights`,
    });

    return {
      events: fusedEvents,
      scoredHighlights,
      stats: {
        audioEvents: audioEvents.length,
        visualEvents: visualEvents.length,
        facecamEvents: facecamEvents.length,
        fusedEvents: fusedEvents.length,
        processingTime,
      },
    };
  }

  /**
   * Audio-only detection using Web Audio API
   */
  private async detectAudioEvents(
    videoBlob: Blob,
    onProgress?: (progress: number) => void
  ): Promise<GameEvent[]> {
    return new Promise(async (resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoBlob);
      video.muted = true;

      try {
        await new Promise<void>((res, rej) => {
          video.onloadedmetadata = () => res();
          video.onerror = () => rej(new Error('Failed to load video'));
        });

        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(video);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        analyser.fftSize = 2048;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const events: GameEvent[] = [];
        const threshold = Math.round(200 - this.config.audioSensitivity * 150);
        let lastPeakTime = -3;

        // Speed up analysis
        video.playbackRate = 6;
        await video.play();

        const scan = () => {
          if (video.paused || video.ended) {
            audioContext.close();
            URL.revokeObjectURL(video.src);
            resolve(events);
            return;
          }

          if (this.abortController?.signal.aborted) {
            video.pause();
            audioContext.close();
            URL.revokeObjectURL(video.src);
            resolve(events);
            return;
          }

          const progress = (video.currentTime / video.duration) * 100;
          onProgress?.(progress);

          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

          if (avg > threshold && video.currentTime - lastPeakTime >= 2) {
            const eventType = this.classifyAudioEvent(avg, threshold);
            const confidence = Math.min(1, avg / (threshold * 1.5));

            events.push({
              id: `audio-${Date.now()}-${events.length}`,
              timestamp: video.currentTime * 1000,
              type: eventType,
              score: Math.min(10, Math.round((avg / threshold) * 5)),
              confidence,
              audioSpike: true,
            });

            lastPeakTime = video.currentTime;
          }

          requestAnimationFrame(scan);
        };

        scan();
      } catch (error) {
        URL.revokeObjectURL(video.src);
        reject(error);
      }
    });
  }

  /**
   * Classify audio event based on intensity
   */
  private classifyAudioEvent(intensity: number, threshold: number): GameEvent['type'] {
    const ratio = intensity / threshold;
    if (ratio > 1.8) return 'ACE';
    if (ratio > 1.6) return '4K';
    if (ratio > 1.4) return 'TRIPLE';
    if (ratio > 1.2) return 'DOUBLE';
    if (ratio > 1.1) return 'KILL';
    return 'HEADSHOT';
  }

  /**
   * Fuse events from all three sources with confidence scoring
   */
  private fuseAllSources(
    audioEvents: GameEvent[],
    visualEvents: GameEvent[],
    facecamEvents: FacecamEvent[]
  ): FusedEvent[] {
    const { timeThreshold, mode } = this.config;
    const fusedMap = new Map<string, FusedEvent>();

    // Process audio events first (primary source)
    for (const audio of audioEvents) {
      const key = this.getTimeKey(audio.timestamp);

      // Find nearby visual event
      const nearbyVisual = visualEvents.find(
        (v) => Math.abs(v.timestamp - audio.timestamp) < timeThreshold
      );

      // Find nearby facecam reaction
      const nearbyFacecam = facecamEvents.find(
        (f) => Math.abs(f.timestamp - audio.timestamp) < timeThreshold
      );

      // Build fused event
      const sources: FusedEvent['sources'] = ['audio'];
      let score = audio.score * SOURCE_WEIGHTS.audio;
      let confidence = audio.confidence;
      let eventType = audio.type;

      if (nearbyVisual) {
        sources.push('visual');
        score *= SOURCE_WEIGHTS.visual;
        confidence = Math.min(1, confidence + 0.25);

        // Upgrade type if visual found better
        const typeOrder: GameEvent['type'][] = [
          'HEADSHOT', 'KILL', 'DOUBLE', 'TRIPLE', '4K', 'ACE', 'CLUTCH',
        ];
        if (typeOrder.indexOf(nearbyVisual.type) > typeOrder.indexOf(eventType)) {
          eventType = nearbyVisual.type;
        }
      }

      let facecamReaction: FacecamEvent['type'] | undefined;
      if (nearbyFacecam) {
        sources.push('facecam');
        facecamReaction = nearbyFacecam.type;
        const boost = FACECAM_BOOSTS[mode][nearbyFacecam.type];
        score *= SOURCE_WEIGHTS.facecam * boost;
        confidence = Math.min(1, confidence + 0.2);
      }

      fusedMap.set(key, {
        ...audio,
        type: eventType,
        score: Math.round(score),
        confidence,
        sources,
        fusedScore: score,
        facecamReaction,
        audioSpike: true,
        visualDetected: !!nearbyVisual,
        facecamDetected: !!nearbyFacecam,
      });
    }

    // Add visual-only events not matched to audio
    for (const visual of visualEvents) {
      const key = this.getTimeKey(visual.timestamp);
      if (fusedMap.has(key)) continue;

      // Check if close to any existing fused event
      const isNearExisting = Array.from(fusedMap.values()).some(
        (f) => Math.abs(f.timestamp - visual.timestamp) < timeThreshold
      );
      if (isNearExisting) continue;

      const nearbyFacecam = facecamEvents.find(
        (f) => Math.abs(f.timestamp - visual.timestamp) < timeThreshold
      );

      const sources: FusedEvent['sources'] = ['visual'];
      let score = visual.score * SOURCE_WEIGHTS.visual;

      let facecamReaction: FacecamEvent['type'] | undefined;
      if (nearbyFacecam) {
        sources.push('facecam');
        facecamReaction = nearbyFacecam.type;
        score *= SOURCE_WEIGHTS.facecam * FACECAM_BOOSTS[mode][nearbyFacecam.type];
      }

      fusedMap.set(key, {
        ...visual,
        sources,
        fusedScore: score,
        facecamReaction,
        score: Math.round(score),
        facecamDetected: !!nearbyFacecam,
      });
    }

    // Convert to array and sort by score
    const fusedEvents = Array.from(fusedMap.values());
    return fusedEvents.sort((a, b) => b.fusedScore - a.fusedScore);
  }

  /**
   * Generate time bucket key for deduplication
   */
  private getTimeKey(timestamp: number): string {
    return String(Math.floor(timestamp / 1000));
  }
}

// Singleton instance
export const unifiedEventDetector = new UnifiedEventDetector();
