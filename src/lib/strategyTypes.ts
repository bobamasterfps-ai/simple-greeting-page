/**
 * Strategy Types for Visual Strategy Engine
 * Pure data structures for canvas rendering
 */

// Visual types for ability effects
export type VisualType = 
  | 'smoke' 
  | 'flash' 
  | 'molly' 
  | 'recon' 
  | 'wall' 
  | 'stun' 
  | 'trap' 
  | 'movement';

// Single animation step in the timeline
// ALL positions are normalized 0-1 (NOT pixels!)
export interface TimelineStep {
  t: number; // Time in seconds
  type: 'spawn' | 'ability' | 'move' | 'plant';
  agent: string;
  ability?: string;
  abilitySlot?: 'Ability1' | 'Ability2' | 'Grenade' | 'Ultimate';
  from?: { x: number; y: number }; // Normalized 0-1
  to?: { x: number; y: number };   // Normalized 0-1
  path?: Array<{ x: number; y: number }>; // Normalized 0-1
  visual?: VisualType;
  radius?: number; // Normalized 0-1 (e.g., 0.08 = 8% of map)
}

// Complete strategy data from AI
export interface StrategyData {
  map: string;
  site: 'A' | 'B' | 'C';
  side: 'attack' | 'defense';
  duration: number; // Total duration in seconds
  steps: TimelineStep[];
  chatCall: string; // Short in-game comms text
}

// Renderer state
export interface RenderState {
  currentTime: number;
  isPlaying: boolean;
  speed: number;
  activeStep: number;
}

// Ability visual config
export const ABILITY_VISUALS: Record<VisualType, { 
  color: string; 
  fillColor: string;
  radius?: number;
  duration?: number;
}> = {
  smoke: { 
    color: 'rgba(150, 150, 150, 0.9)', 
    fillColor: 'rgba(100, 100, 100, 0.5)',
    radius: 35 
  },
  flash: { 
    color: 'rgba(255, 255, 100, 0.9)', 
    fillColor: 'rgba(255, 255, 200, 0.4)',
    radius: 25 
  },
  molly: { 
    color: 'rgba(255, 100, 50, 0.9)', 
    fillColor: 'rgba(255, 80, 30, 0.4)',
    radius: 30 
  },
  recon: { 
    color: 'rgba(100, 200, 255, 0.9)', 
    fillColor: 'rgba(80, 180, 255, 0.3)',
    radius: 50 
  },
  wall: { 
    color: 'rgba(100, 255, 150, 0.9)', 
    fillColor: 'rgba(80, 200, 120, 0.3)'
  },
  stun: { 
    color: 'rgba(200, 100, 255, 0.9)', 
    fillColor: 'rgba(180, 80, 255, 0.3)',
    radius: 25 
  },
  trap: { 
    color: 'rgba(255, 200, 50, 0.9)', 
    fillColor: 'rgba(255, 180, 30, 0.3)',
    radius: 15 
  },
  movement: { 
    color: 'rgba(0, 255, 200, 0.9)', 
    fillColor: 'rgba(0, 200, 180, 0.2)'
  },
};

// Map ability name to visual type
export function getVisualType(abilityName: string): VisualType {
  const name = abilityName.toLowerCase();
  
  // Smokes
  if (name.includes('smoke') || name.includes('dark cover') || name.includes('nebula') || 
      name.includes('sky smoke') || name.includes('poison cloud') || name.includes('ruse') ||
      name.includes('cloudburst') || name.includes('high tide') || name.includes('cascade')) {
    return 'smoke';
  }
  
  // Flashes
  if (name.includes('flash') || name.includes('blind') || name.includes('leer') || 
      name.includes('guiding light') || name.includes('dizzy') || name.includes('curveball') ||
      name.includes('paranoia')) {
    return 'flash';
  }
  
  // Mollies/damage
  if (name.includes('molly') || name.includes('snake bite') || name.includes('incendiary') ||
      name.includes('hot hands') || name.includes('paint shells') || name.includes('nanoswarm') ||
      name.includes('mosh pit') || name.includes('frag')) {
    return 'molly';
  }
  
  // Recon
  if (name.includes('recon') || name.includes('haunt') || name.includes('prowler') ||
      name.includes('owl drone') || name.includes('trailblazer') || name.includes('seekers') ||
      name.includes('spycam')) {
    return 'recon';
  }
  
  // Walls
  if (name.includes('wall') || name.includes('barrier') || name.includes('blaze') ||
      name.includes('toxic screen') || name.includes('fast lane') || name.includes('contingency')) {
    return 'wall';
  }
  
  // Stuns
  if (name.includes('stun') || name.includes('fault line') || name.includes('aftershock') ||
      name.includes('relay bolt') || name.includes('seize') || name.includes('zero/point') ||
      name.includes('sonic sensor')) {
    return 'stun';
  }
  
  // Traps
  if (name.includes('trap') || name.includes('turret') || name.includes('alarmbot') ||
      name.includes('trademark') || name.includes('tripwire') || name.includes('gravnet')) {
    return 'trap';
  }
  
  // Movement
  if (name.includes('dash') || name.includes('teleport') || name.includes('tailwind') ||
      name.includes('gatecrash') || name.includes('shrouded step') || name.includes('updraft') ||
      name.includes('blast pack') || name.includes('high gear')) {
    return 'movement';
  }
  
  return 'smoke'; // Default
}
