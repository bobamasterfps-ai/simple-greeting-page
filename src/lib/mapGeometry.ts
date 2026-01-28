/**
 * Map Geometry System - Vector-based precision with collision detection
 * 
 * CORE PRINCIPLES:
 * 1. All coordinates are normalized 0-1
 * 2. Defense = mirror X axis (x = 1 - x, y stays same)
 * 3. Abilities auto-snap to walkable areas
 * 4. Invalid positions are rejected
 */

import { Vec2, Polygon, Wall, Site, MapGeometryData } from './mapGeometryTypes';
import { DEFAULT_GEOMETRIES, getGeometry } from './mapGeometryStore';
import { pointInPolygon, clampToPlayableArea, pathCrossesWall } from './geometryUtils';

// ============= LEGACY TYPES (for backward compatibility) =============
export interface MapSite {
  name: string;
  center: [number, number];
  plant: [number, number];
}

export interface MapChoke {
  name: string;
  position: [number, number];
}

export interface MapSpawn {
  attack: [number, number];
  defense: [number, number];
}

export interface MapGeometry {
  id: string;
  name: string;
  sites: MapSite[];
  chokes: MapChoke[];
  spawn: MapSpawn;
}

// ============= LEGACY DATA (UPDATED WITH ACCURATE POSITIONS) =============
export const MAP_GEOMETRY: Record<string, MapGeometry> = {
  ascent: {
    id: 'ascent',
    name: 'Ascent',
    sites: [
      // A site: right side (x ~82%), B site: left side (x ~18%)
      { name: 'A', center: [82, 18], plant: [84, 16] },
      { name: 'B', center: [18, 18], plant: [16, 16] },
    ],
    chokes: [
      { name: 'A Main', position: [75, 45] },
      { name: 'A Short', position: [65, 25] },
      { name: 'Mid', position: [50, 50] },
      { name: 'B Main', position: [25, 50] },
      { name: 'Market', position: [32, 35] },
    ],
    spawn: { attack: [50, 88], defense: [50, 12] },
  },
  abyss: {
    id: 'abyss',
    name: 'Abyss',
    sites: [
      { name: 'A', center: [75, 32], plant: [77, 30] },
      { name: 'B', center: [27, 30], plant: [25, 28] },
    ],
    chokes: [
      { name: 'A Main', position: [70, 50] },
      { name: 'A Short', position: [65, 35] },
      { name: 'Mid', position: [50, 50] },
      { name: 'B Main', position: [30, 50] },
      { name: 'B Long', position: [20, 40] },
    ],
    spawn: { attack: [50, 90], defense: [50, 10] },
  },
  corode: {
    id: 'corode',
    name: 'Corode',
    sites: [
      { name: 'A', center: [75, 32], plant: [77, 30] },
      { name: 'B', center: [35, 32], plant: [33, 30] },
    ],
    chokes: [
      { name: 'A Main', position: [70, 50] },
      { name: 'A Short', position: [65, 35] },
      { name: 'Mid', position: [50, 50] },
      { name: 'B Main', position: [35, 55] },
      { name: 'B Link', position: [40, 40] },
    ],
    spawn: { attack: [50, 90], defense: [50, 10] },
  },
  bind: {
    id: 'bind',
    name: 'Bind',
    sites: [
      // A site: LEFT side (x ~22%), B site: RIGHT side (x ~78%)
      { name: 'A', center: [22, 22], plant: [20, 20] },
      { name: 'B', center: [78, 22], plant: [80, 20] },
    ],
    chokes: [
      { name: 'A Short', position: [30, 40] },
      { name: 'A Bath', position: [18, 45] },
      { name: 'B Long', position: [70, 55] },
      { name: 'B Short', position: [65, 40] },
      { name: 'Hookah', position: [72, 32] },
    ],
    spawn: { attack: [50, 88], defense: [50, 12] },
  },
  haven: {
    id: 'haven',
    name: 'Haven',
    sites: [
      { name: 'A', center: [80, 25], plant: [78, 22] },
      { name: 'B', center: [50, 25], plant: [50, 22] },
      { name: 'C', center: [20, 25], plant: [22, 22] },
    ],
    chokes: [
      { name: 'A Long', position: [85, 45] },
      { name: 'A Short', position: [70, 40] },
      { name: 'Mid', position: [50, 50] },
      { name: 'C Long', position: [15, 45] },
      { name: 'Garage', position: [35, 50] },
    ],
    spawn: { attack: [50, 85], defense: [50, 15] },
  },
  split: {
    id: 'split',
    name: 'Split',
    sites: [
      { name: 'A', center: [80, 25], plant: [82, 22] },
      { name: 'B', center: [25, 28], plant: [23, 25] },
    ],
    chokes: [
      { name: 'A Main', position: [75, 45] },
      { name: 'A Ramps', position: [65, 35] },
      { name: 'Mid', position: [50, 50] },
      { name: 'B Main', position: [25, 50] },
      { name: 'Vents', position: [40, 40] },
    ],
    spawn: { attack: [50, 85], defense: [50, 15] },
  },
  icebox: {
    id: 'icebox',
    name: 'Icebox',
    sites: [
      { name: 'A', center: [75, 25], plant: [73, 22] },
      { name: 'B', center: [25, 30], plant: [27, 27] },
    ],
    chokes: [
      { name: 'A Belt', position: [70, 45] },
      { name: 'A Pipes', position: [80, 40] },
      { name: 'Mid', position: [50, 50] },
      { name: 'B Orange', position: [30, 45] },
      { name: 'B Green', position: [20, 50] },
    ],
    spawn: { attack: [50, 85], defense: [50, 15] },
  },
  breeze: {
    id: 'breeze',
    name: 'Breeze',
    sites: [
      { name: 'A', center: [75, 25], plant: [73, 22] },
      { name: 'B', center: [25, 28], plant: [27, 25] },
    ],
    chokes: [
      { name: 'A Main', position: [70, 45] },
      { name: 'A Hall', position: [80, 35] },
      { name: 'Mid', position: [50, 55] },
      { name: 'B Tunnel', position: [30, 50] },
      { name: 'B Elbow', position: [20, 40] },
    ],
    spawn: { attack: [50, 85], defense: [50, 15] },
  },
  fracture: {
    id: 'fracture',
    name: 'Fracture',
    sites: [
      { name: 'A', center: [75, 50], plant: [73, 48] },
      { name: 'B', center: [25, 50], plant: [27, 48] },
    ],
    chokes: [
      { name: 'A Main', position: [70, 65] },
      { name: 'A Drop', position: [80, 45] },
      { name: 'B Main', position: [30, 65] },
      { name: 'B Arcade', position: [20, 45] },
      { name: 'Mid', position: [50, 50] },
    ],
    spawn: { attack: [50, 85], defense: [50, 15] },
  },
  pearl: {
    id: 'pearl',
    name: 'Pearl',
    sites: [
      { name: 'A', center: [75, 25], plant: [73, 22] },
      { name: 'B', center: [25, 30], plant: [27, 27] },
    ],
    chokes: [
      { name: 'A Main', position: [70, 45] },
      { name: 'A Art', position: [65, 35] },
      { name: 'Mid', position: [50, 50] },
      { name: 'B Main', position: [30, 50] },
      { name: 'B Link', position: [35, 40] },
    ],
    spawn: { attack: [50, 85], defense: [50, 15] },
  },
  lotus: {
    id: 'lotus',
    name: 'Lotus',
    sites: [
      // A site: RIGHT side (x ~85%), B site: CENTER (x ~50%), C site: LEFT side (x ~15%)
      { name: 'A', center: [85, 22], plant: [87, 20] },
      { name: 'B', center: [50, 16], plant: [50, 14] },
      { name: 'C', center: [15, 22], plant: [13, 20] },
    ],
    chokes: [
      { name: 'A Main', position: [78, 45] },
      { name: 'A Root', position: [88, 35] },
      { name: 'B Main', position: [50, 50] },
      { name: 'C Main', position: [22, 45] },
      { name: 'C Mound', position: [12, 35] },
    ],
    spawn: { attack: [50, 88], defense: [50, 12] },
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    sites: [
      { name: 'A', center: [75, 25], plant: [73, 22] },
      { name: 'B', center: [25, 30], plant: [27, 27] },
    ],
    chokes: [
      { name: 'A Main', position: [70, 45] },
      { name: 'A Elbow', position: [65, 35] },
      { name: 'Mid', position: [50, 50] },
      { name: 'B Main', position: [30, 50] },
      { name: 'Market', position: [35, 40] },
    ],
    spawn: { attack: [50, 85], defense: [50, 15] },
  },
};

// ============= PLAYSTYLES =============
export const PLAYSTYLES = [
  { id: 'fast', name: 'Fast Entry', description: 'Speed, flashes, smokes' },
  { id: 'default', name: 'Slow Default', description: 'Map control first' },
  { id: 'split', name: 'Split Push', description: 'Multi-angle pressure' },
  { id: 'fake', name: 'Fake & Rotate', description: 'Noise + late rotate' },
  { id: 'retake', name: 'Retake', description: 'Utility saving, grouping' },
  { id: 'postplant', name: 'Post-plant', description: 'Lineups + crossfires' },
] as const;

export type PlaystyleId = typeof PLAYSTYLES[number]['id'];

// ============= NEW VECTOR-BASED FUNCTIONS =============

/**
 * Clamp value to 0-1 range
 */
export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Normalize a value from 0-100 to 0-1 (or keep if already 0-1)
 */
export function normalizeValue(v: number): number {
  if (v > 1) return clamp01(v / 100);
  return clamp01(v);
}

/**
 * Normalize a position from any format to 0-1 range
 */
export function normalizeVec2(pos: { x: number; y: number }): Vec2 {
  return {
    x: normalizeValue(pos.x),
    y: normalizeValue(pos.y),
  };
}

/**
 * Clamp a Vec2 to valid map bounds (0-1)
 */
export function clampVec2(pos: Vec2): Vec2 {
  return {
    x: clamp01(pos.x),
    y: clamp01(pos.y),
  };
}

/**
 * Transform position for defense side (mirror X axis ONLY)
 * This is the CORRECT way to flip for defense - Y stays the same!
 */
export function mirrorForDefense(pos: Vec2): Vec2 {
  return {
    x: 1 - pos.x,
    y: pos.y, // Y NEVER changes - only mirror horizontally
  };
}

/**
 * Transform position based on side
 */
export function transformForSide(pos: Vec2, side: 'attack' | 'defense'): Vec2 {
  if (side === 'defense') {
    return mirrorForDefense(pos);
  }
  return { ...pos };
}

/**
 * Convert normalized position to canvas pixel coordinates
 */
export function toCanvasCoords(pos: Vec2, width: number, height: number): Vec2 {
  const clamped = clampVec2(pos);
  return {
    x: clamped.x * width,
    y: clamped.y * height,
  };
}

/**
 * Check if a position is within the walkable area
 */
export function isWalkable(pos: Vec2, playableArea: Polygon): boolean {
  if (!playableArea || playableArea.length < 3) return true;
  return pointInPolygon(pos, playableArea);
}

/**
 * Snap a position to the nearest valid walkable point
 * Returns the original clamped position if no playable area defined
 */
export function snapToWalkable(
  pos: Vec2,
  playableArea: Polygon,
  maxSearchRadius: number = 0.1
): Vec2 {
  const clamped = clampVec2(pos);
  
  // If no playable area or already valid, return clamped
  if (!playableArea || playableArea.length < 3) return clamped;
  if (isWalkable(clamped, playableArea)) return clamped;
  
  // Spiral search for nearest valid point
  for (let r = 0.01; r <= maxSearchRadius; r += 0.01) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
      const testPos: Vec2 = {
        x: clamped.x + Math.cos(angle) * r,
        y: clamped.y + Math.sin(angle) * r,
      };
      
      if (isWalkable(testPos, playableArea)) {
        return clampVec2(testPos);
      }
    }
  }
  
  // Fall back to edge snap
  const edgeSnapped = clampToPlayableArea(clamped, playableArea);
  return clampVec2(edgeSnapped);
}

/**
 * Full transform pipeline: normalize → snap → transform for side → clamp → to canvas
 */
export function processPosition(
  pos: { x: number; y: number },
  mapName: string,
  side: 'attack' | 'defense',
  canvasWidth: number,
  canvasHeight: number
): Vec2 {
  // 1. Normalize (handle 0-100 or 0-1)
  let p = normalizeVec2(pos);
  
  // 2. Get playable area and snap
  const geo = getVectorGeometry(mapName);
  if (geo.playableArea.length >= 3) {
    p = snapToWalkable(p, geo.playableArea);
  }
  
  // 3. Transform for side (defense = mirror X)
  p = transformForSide(p, side);
  
  // 4. Final clamp
  p = clampVec2(p);
  
  // 5. Convert to canvas pixels
  return toCanvasCoords(p, canvasWidth, canvasHeight);
}

/**
 * Get vector geometry for a map
 */
export function getVectorGeometry(mapName: string): MapGeometryData {
  const mapId = mapName.toLowerCase().replace(/\s+/g, '');
  return getGeometry(mapId);
}

/**
 * Get playable area polygon for a map
 */
export function getPlayableArea(mapName: string): Polygon {
  const geo = getVectorGeometry(mapName);
  return geo.playableArea || [];
}

/**
 * Validate ability position - check if it's in walkable area
 */
export function validateAbilityPosition(
  pos: Vec2,
  mapName: string
): { valid: boolean; position: Vec2; wasSnapped: boolean } {
  const playableArea = getPlayableArea(mapName);
  const clamped = clampVec2(pos);
  
  if (!playableArea || playableArea.length < 3) {
    return { valid: true, position: clamped, wasSnapped: false };
  }
  
  if (isWalkable(clamped, playableArea)) {
    return { valid: true, position: clamped, wasSnapped: false };
  }
  
  const snapped = snapToWalkable(clamped, playableArea);
  return {
    valid: isWalkable(snapped, playableArea),
    position: snapped,
    wasSnapped: true,
  };
}

// ============= LEGACY FUNCTION (for backward compatibility) =============
export function getMapGeometry(mapName: string): MapGeometry | undefined {
  const normalized = mapName.toLowerCase().replace(/\s/g, '');
  return MAP_GEOMETRY[normalized];
}
