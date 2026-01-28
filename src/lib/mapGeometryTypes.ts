/**
 * Map Geometry System - Vector-based precision
 * 
 * RULES:
 * 1. All coordinates are normalized 0-1
 * 2. Playable area is a polygon - abilities cannot be placed outside
 * 3. Walls are line segments - abilities cannot cross them
 * 4. Sites are circles with center + radius
 */

export type Vec2 = { x: number; y: number };

// A polygon defined by an array of points (closed automatically)
export type Polygon = Vec2[];

// A wall segment defined by two points
export type Wall = { from: Vec2; to: Vec2 };

// A site (bomb plant zone)
export interface Site {
  id: string; // "A", "B", "C"
  center: Vec2;
  radius: number; // Normalized radius (0-1)
  label: string;
}

// Spawn positions
export interface Spawn {
  side: 'attack' | 'defense';
  positions: Vec2[];
}

// Choke points (common utility spots)
export interface Choke {
  id: string;
  position: Vec2;
  label: string;
}

// Complete map geometry
export interface MapGeometryData {
  id: string; // Map name lowercase
  name: string; // Display name
  version: number; // Schema version for updates
  
  // Core geometry
  playableArea: Polygon;
  walls: Wall[];
  sites: Site[];
  
  // Optional data
  spawns?: Spawn[];
  chokes?: Choke[];
  
  // Metadata
  lastUpdated?: string;
  author?: string;
}

// Default empty geometry for new maps
export function createEmptyGeometry(mapId: string, mapName: string): MapGeometryData {
  return {
    id: mapId,
    name: mapName,
    version: 1,
    playableArea: [],
    walls: [],
    sites: [],
    spawns: [],
    chokes: [],
    lastUpdated: new Date().toISOString(),
  };
}

// Validate geometry data
export function isValidGeometry(geo: MapGeometryData): boolean {
  // Must have at least 3 points for playable area (triangle minimum)
  if (geo.playableArea.length < 3) return false;
  
  // All points must be in 0-1 range
  const validPoint = (p: Vec2) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
  
  if (!geo.playableArea.every(validPoint)) return false;
  if (!geo.walls.every(w => validPoint(w.from) && validPoint(w.to))) return false;
  if (!geo.sites.every(s => validPoint(s.center) && s.radius > 0 && s.radius <= 0.2)) return false;
  
  return true;
}
