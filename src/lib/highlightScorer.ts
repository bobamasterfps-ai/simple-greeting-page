/**
 * Highlight Scoring System
 * Scores events based on mode, confidence, and detection sources
 */
import type { GameEvent } from '@/types/clipTypes';
import type { ClipMode } from '@/types/shortsTypes';
import type { FusedEvent } from './eventFusionEngine';

export interface ScoredHighlight {
  event: FusedEvent | GameEvent;
  finalScore: number;
  rank: number;
  tier: 'S' | 'A' | 'B' | 'C';
  clipPriority: number; // 1-10
}

/**
 * Base scores for event types
 */
const BASE_SCORES: Record<GameEvent['type'], number> = {
  HEADSHOT: 3,
  KILL: 4,
  DOUBLE: 6,
  TRIPLE: 8,
  '4K': 9,
  ACE: 10,
  CLUTCH: 10,
};

/**
 * Mode multipliers for each event type
 */
const MODE_MULTIPLIERS: Record<ClipMode, Record<GameEvent['type'], number>> = {
  FUNNY: {
    HEADSHOT: 0.5, // Not particularly funny
    KILL: 0.6,
    DOUBLE: 0.8,
    TRIPLE: 1.0,
    '4K': 1.2,
    ACE: 1.3,
    CLUTCH: 0.9, // Can be funny if chaotic
  },
  FLEX: {
    HEADSHOT: 1.2, // Clean shots are flex
    KILL: 1.0,
    DOUBLE: 1.3,
    TRIPLE: 1.5,
    '4K': 1.8,
    ACE: 2.0, // Maximum flex
    CLUTCH: 1.9,
  },
  TEACHING: {
    HEADSHOT: 1.3, // Good for aim tutorials
    KILL: 1.0,
    DOUBLE: 1.0,
    TRIPLE: 1.0,
    '4K': 1.0,
    ACE: 1.0,
    CLUTCH: 1.5, // Great for teaching game sense
  },
};

/**
 * Source bonuses for multi-source detections
 */
const SOURCE_BONUSES = {
  singleSource: 1.0,
  audioAndVisual: 1.3,
  audioAndFacecam: 1.4,
  visualAndFacecam: 1.3,
  allThree: 1.7,
};

export class HighlightScorer {
  private mode: ClipMode = 'FLEX';

  setMode(mode: ClipMode): void {
    this.mode = mode;
  }

  /**
   * Score a single event
   */
  scoreEvent(event: FusedEvent | GameEvent): ScoredHighlight {
    const baseScore = BASE_SCORES[event.type];
    const modeMultiplier = MODE_MULTIPLIERS[this.mode][event.type];

    // Calculate source bonus
    let sourceBonus = SOURCE_BONUSES.singleSource;
    if ('sources' in event) {
      const fusedEvent = event as FusedEvent;
      if (fusedEvent.sources.length === 3) {
        sourceBonus = SOURCE_BONUSES.allThree;
      } else if (fusedEvent.sources.includes('audio') && fusedEvent.sources.includes('visual')) {
        sourceBonus = SOURCE_BONUSES.audioAndVisual;
      } else if (fusedEvent.sources.includes('audio') && fusedEvent.sources.includes('facecam')) {
        sourceBonus = SOURCE_BONUSES.audioAndFacecam;
      } else if (fusedEvent.sources.includes('visual') && fusedEvent.sources.includes('facecam')) {
        sourceBonus = SOURCE_BONUSES.visualAndFacecam;
      }
    }

    // Confidence boost (0.5 - 1.3 multiplier based on confidence)
    const confidenceBoost = 0.5 + (event.confidence * 0.8);

    // Calculate final score
    const finalScore = baseScore * modeMultiplier * sourceBonus * confidenceBoost;

    // Determine tier
    let tier: ScoredHighlight['tier'] = 'C';
    if (finalScore >= 15) tier = 'S';
    else if (finalScore >= 10) tier = 'A';
    else if (finalScore >= 6) tier = 'B';

    // Clip priority (1-10)
    const clipPriority = Math.min(10, Math.max(1, Math.round(finalScore)));

    return {
      event,
      finalScore,
      rank: 0, // Will be set when ranking multiple events
      tier,
      clipPriority,
    };
  }

  /**
   * Score and rank multiple events
   */
  scoreAndRank(events: (FusedEvent | GameEvent)[]): ScoredHighlight[] {
    const scored = events.map(e => this.scoreEvent(e));

    // Sort by final score descending
    scored.sort((a, b) => b.finalScore - a.finalScore);

    // Assign ranks
    scored.forEach((s, i) => {
      s.rank = i + 1;
    });

    return scored;
  }

  /**
   * Get events by tier
   */
  getByTier(highlights: ScoredHighlight[], tier: ScoredHighlight['tier']): ScoredHighlight[] {
    return highlights.filter(h => h.tier === tier);
  }

  /**
   * Get top N highlights
   */
  getTop(highlights: ScoredHighlight[], count: number): ScoredHighlight[] {
    return highlights.slice(0, count);
  }

  /**
   * Get auto-clip candidates (top highlights above threshold)
   */
  getAutoClipCandidates(highlights: ScoredHighlight[], minPriority: number = 7): ScoredHighlight[] {
    return highlights.filter(h => h.clipPriority >= minPriority);
  }
}

export const highlightScorer = new HighlightScorer();
