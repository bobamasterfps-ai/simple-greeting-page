/**
 * Event Fusion Engine
 * Combines audio, visual, and facecam detection into scored highlights
 */
import type { GameEvent } from '@/types/clipTypes';
import type { FacecamEvent } from './facecamDetector';
import type { ClipMode } from '@/types/shortsTypes';

export interface FusedEvent extends GameEvent {
  sources: ('audio' | 'visual' | 'facecam')[];
  fusedScore: number;
  facecamReaction?: FacecamEvent['type'];
}

export interface FusionConfig {
  mode: ClipMode;
  audioWeight: number;
  visualWeight: number;
  facecamWeight: number;
  timeThreshold: number; // ms
}

const DEFAULT_FUSION_CONFIG: FusionConfig = {
  mode: 'FLEX',
  audioWeight: 1.2,
  visualWeight: 1.3,
  facecamWeight: 1.5,
  timeThreshold: 1500,
};

/**
 * Mode-specific scoring weights
 */
const MODE_WEIGHTS: Record<ClipMode, { eventTypes: Record<GameEvent['type'], number>; facecamBoost: Record<FacecamEvent['type'], number> }> = {
  FUNNY: {
    eventTypes: {
      KILL: 0.6,
      DOUBLE: 0.7,
      TRIPLE: 0.8,
      '4K': 0.9,
      ACE: 1.0,
      CLUTCH: 0.7,
      HEADSHOT: 0.5,
    },
    facecamBoost: {
      HYPE: 1.3,
      RAGE: 1.5, // Rage is funny
      FUNNY: 2.0, // Best for funny clips
      CALM: 0.5,
    },
  },
  FLEX: {
    eventTypes: {
      KILL: 0.7,
      DOUBLE: 0.9,
      TRIPLE: 1.2,
      '4K': 1.5,
      ACE: 2.0, // Aces are the ultimate flex
      CLUTCH: 1.8,
      HEADSHOT: 1.0,
    },
    facecamBoost: {
      HYPE: 1.5,
      RAGE: 1.0,
      FUNNY: 0.8,
      CALM: 1.2, // Cool and calm during clutch = flex
    },
  },
  TEACHING: {
    eventTypes: {
      KILL: 1.0,
      DOUBLE: 1.0,
      TRIPLE: 1.0,
      '4K': 1.0,
      ACE: 1.0,
      CLUTCH: 1.5, // Clutches are great for teaching
      HEADSHOT: 1.3, // Clean headshots for aim tutorials
    },
    facecamBoost: {
      HYPE: 0.8,
      RAGE: 0.5,
      FUNNY: 0.7,
      CALM: 1.5, // Calm explanations are best
    },
  },
};

export class EventFusionEngine {
  private config: FusionConfig;

  constructor(config: Partial<FusionConfig> = {}) {
    this.config = { ...DEFAULT_FUSION_CONFIG, ...config };
  }

  /**
   * Fuse audio and visual events
   */
  fuseEvents(
    audioEvents: GameEvent[],
    visualEvents: GameEvent[],
    facecamEvents: FacecamEvent[] = []
  ): FusedEvent[] {
    const fused: FusedEvent[] = [];
    const { timeThreshold, audioWeight, visualWeight, facecamWeight, mode } = this.config;
    const modeWeights = MODE_WEIGHTS[mode];

    // Process all audio events first
    for (const audio of audioEvents) {
      const nearbyVisual = visualEvents.find(
        v => Math.abs(v.timestamp - audio.timestamp) < timeThreshold
      );
      const nearbyFacecam = facecamEvents.find(
        f => Math.abs(f.timestamp - audio.timestamp) < timeThreshold
      );

      const sources: FusedEvent['sources'] = ['audio'];
      let baseScore = audio.score * modeWeights.eventTypes[audio.type];
      let eventType = audio.type;
      let confidence = audio.confidence;

      // Apply audio weight
      baseScore *= audioWeight;

      if (nearbyVisual) {
        sources.push('visual');
        baseScore *= visualWeight;
        confidence = Math.min(1, confidence + 0.3);

        // Upgrade event type if visual detection found better
        const typeOrder: GameEvent['type'][] = ['HEADSHOT', 'KILL', 'DOUBLE', 'TRIPLE', '4K', 'ACE', 'CLUTCH'];
        if (typeOrder.indexOf(nearbyVisual.type) > typeOrder.indexOf(eventType)) {
          eventType = nearbyVisual.type;
          baseScore = nearbyVisual.score * modeWeights.eventTypes[eventType] * visualWeight;
        }
      }

      let facecamReaction: FacecamEvent['type'] | undefined;
      if (nearbyFacecam) {
        sources.push('facecam');
        facecamReaction = nearbyFacecam.type;
        baseScore *= facecamWeight * modeWeights.facecamBoost[nearbyFacecam.type];
        confidence = Math.min(1, confidence + 0.2);
      }

      fused.push({
        ...audio,
        type: eventType,
        score: Math.round(baseScore),
        confidence,
        sources,
        fusedScore: baseScore,
        facecamReaction,
        audioSpike: true,
        visualDetected: !!nearbyVisual,
      });
    }

    // Add visual events that weren't matched
    for (const visual of visualEvents) {
      const alreadyFused = fused.some(
        f => Math.abs(f.timestamp - visual.timestamp) < timeThreshold
      );

      if (!alreadyFused) {
        const nearbyFacecam = facecamEvents.find(
          f => Math.abs(f.timestamp - visual.timestamp) < timeThreshold
        );

        const sources: FusedEvent['sources'] = ['visual'];
        let baseScore = visual.score * modeWeights.eventTypes[visual.type] * visualWeight;

        let facecamReaction: FacecamEvent['type'] | undefined;
        if (nearbyFacecam) {
          sources.push('facecam');
          facecamReaction = nearbyFacecam.type;
          baseScore *= facecamWeight * modeWeights.facecamBoost[nearbyFacecam.type];
        }

        fused.push({
          ...visual,
          sources,
          fusedScore: baseScore,
          facecamReaction,
          score: Math.round(baseScore),
        });
      }
    }

    // Sort by fused score
    return fused.sort((a, b) => b.fusedScore - a.fusedScore);
  }

  /**
   * Set the clip mode for scoring
   */
  setMode(mode: ClipMode): void {
    this.config.mode = mode;
  }

  /**
   * Get top N events based on mode-specific scoring
   */
  getTopEvents(events: FusedEvent[], count: number = 5): FusedEvent[] {
    return events.slice(0, count);
  }

  /**
   * Filter events by minimum score
   */
  filterByScore(events: FusedEvent[], minScore: number): FusedEvent[] {
    return events.filter(e => e.fusedScore >= minScore);
  }
}

export const eventFusionEngine = new EventFusionEngine();
