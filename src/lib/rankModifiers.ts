/**
 * Rank-Aware Strategy Modifiers
 * Controls execution complexity, timing, and utility usage based on rank
 */

export type Rank = 
  | 'Iron' 
  | 'Bronze' 
  | 'Silver' 
  | 'Gold' 
  | 'Platinum' 
  | 'Diamond' 
  | 'Ascendant' 
  | 'Immortal' 
  | 'Radiant';

export const RANKS: Rank[] = [
  'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 
  'Diamond', 'Ascendant', 'Immortal', 'Radiant'
];

export interface RankModifier {
  steps: number;
  complexity: 'low' | 'medium' | 'high';
  speed: number; // Animation speed multiplier
  abilities: string[];
  movement: string;
  description: string;
}

export const RANK_MODIFIERS: Record<Rank, RankModifier> = {
  Iron: {
    steps: 3,
    complexity: 'low',
    speed: 0.7,
    abilities: ['smoke'],
    movement: 'direct push',
    description: 'Simple, safe executes with minimal utility',
  },
  Bronze: {
    steps: 4,
    complexity: 'low',
    speed: 0.75,
    abilities: ['smoke', 'flash'],
    movement: 'basic entry',
    description: 'Basic utility with straightforward entries',
  },
  Silver: {
    steps: 4,
    complexity: 'low',
    speed: 0.8,
    abilities: ['smoke', 'flash'],
    movement: 'timed entry',
    description: 'Timed entries with basic utility combo',
  },
  Gold: {
    steps: 5,
    complexity: 'medium',
    speed: 0.85,
    abilities: ['smoke', 'flash', 'molly'],
    movement: 'basic split',
    description: 'Split pushes with coordinated utility',
  },
  Platinum: {
    steps: 5,
    complexity: 'medium',
    speed: 0.9,
    abilities: ['smoke', 'flash', 'molly', 'recon'],
    movement: 'trade-ready',
    description: 'Trade-ready entries with info gathering',
  },
  Diamond: {
    steps: 6,
    complexity: 'medium',
    speed: 1.0,
    abilities: ['combo util'],
    movement: 'timed entry',
    description: 'Combo utility with precise timing',
  },
  Ascendant: {
    steps: 7,
    complexity: 'high',
    speed: 1.1,
    abilities: ['layered util'],
    movement: 'trade-based',
    description: 'Layered utility with trade chains',
  },
  Immortal: {
    steps: 8,
    complexity: 'high',
    speed: 1.2,
    abilities: ['multi-layer'],
    movement: 'conditional',
    description: 'Multi-layer executes with reads',
  },
  Radiant: {
    steps: 10,
    complexity: 'high',
    speed: 1.3,
    abilities: ['bait + punish'],
    movement: 'conditional adapt',
    description: 'Adaptive plays with bait and punish',
  },
};

/**
 * Get speed multiplier for a rank
 */
export function getRankSpeed(rank: Rank): number {
  return RANK_MODIFIERS[rank]?.speed || 1.0;
}

/**
 * Get complexity description
 */
export function getRankComplexity(rank: Rank): string {
  return RANK_MODIFIERS[rank]?.description || '';
}
