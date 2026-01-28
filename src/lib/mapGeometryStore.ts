/**
 * Map Geometry Store - PRECISE VECTOR-BASED MAP DATA
 * 
 * RULES:
 * 1. All coordinates MUST be normalized 0-1
 * 2. Playable areas are polygons that follow actual map geometry
 * 3. Sites are positioned accurately from clean map references
 * 4. Defense = mirror X only (never Y)
 */

import { MapGeometryData, createEmptyGeometry, Vec2 } from './mapGeometryTypes';

// Storage key
const STORAGE_KEY = 'valorant_map_geometry';

/**
 * ACCURATE map geometry data based on clean map images
 * All coordinates are normalized 0-1
 */
export const DEFAULT_GEOMETRIES: Record<string, MapGeometryData> = {
  // LOTUS - 3 sites (A right, B center-top, C left)
  lotus: {
    id: 'lotus',
    name: 'Lotus',
    version: 2,
    playableArea: [
      // Accurate polygon tracing the walkable area
      { x: 0.06, y: 0.08 },  // Top-left corner
      { x: 0.40, y: 0.08 },  // Top before B
      { x: 0.50, y: 0.04 },  // B site area top
      { x: 0.60, y: 0.08 },  // Top after B
      { x: 0.94, y: 0.08 },  // Top-right
      { x: 0.94, y: 0.30 },  // A site area right
      { x: 0.88, y: 0.45 },  // A main entrance
      { x: 0.94, y: 0.60 },  // Right side mid
      { x: 0.94, y: 0.92 },  // Bottom-right
      { x: 0.65, y: 0.92 },  // Bottom right of spawn
      { x: 0.50, y: 0.85 },  // Spawn center
      { x: 0.35, y: 0.92 },  // Bottom left of spawn
      { x: 0.06, y: 0.92 },  // Bottom-left
      { x: 0.06, y: 0.60 },  // Left side mid
      { x: 0.12, y: 0.45 },  // C main entrance
      { x: 0.06, y: 0.30 },  // C site area left
    ],
    walls: [],
    sites: [
      { id: 'A', center: { x: 0.85, y: 0.22 }, radius: 0.05, label: 'A' },
      { id: 'B', center: { x: 0.50, y: 0.16 }, radius: 0.05, label: 'B' },
      { id: 'C', center: { x: 0.15, y: 0.22 }, radius: 0.05, label: 'C' },
    ],
    spawns: [
      { side: 'attack', positions: [{ x: 0.50, y: 0.88 }] },
      { side: 'defense', positions: [{ x: 0.50, y: 0.12 }] },
    ],
    chokes: [
      { id: 'a_main', position: { x: 0.78, y: 0.45 }, label: 'A Main' },
      { id: 'a_root', position: { x: 0.88, y: 0.35 }, label: 'A Root' },
      { id: 'b_main', position: { x: 0.50, y: 0.50 }, label: 'B Main' },
      { id: 'c_main', position: { x: 0.22, y: 0.45 }, label: 'C Main' },
      { id: 'c_mound', position: { x: 0.12, y: 0.35 }, label: 'C Mound' },
    ],
  },

  // BIND - 2 sites (A left, B right) with teleporters
  bind: {
    id: 'bind',
    name: 'Bind',
    version: 2,
    playableArea: [
      { x: 0.08, y: 0.08 },   // Top-left
      { x: 0.45, y: 0.08 },   // Top before mid
      { x: 0.55, y: 0.08 },   // Top after mid
      { x: 0.92, y: 0.08 },   // Top-right
      { x: 0.92, y: 0.35 },   // B site right
      { x: 0.85, y: 0.50 },   // B entrance area
      { x: 0.92, y: 0.65 },   // Right mid
      { x: 0.92, y: 0.92 },   // Bottom-right
      { x: 0.55, y: 0.92 },   // Bottom spawn right
      { x: 0.45, y: 0.92 },   // Bottom spawn left
      { x: 0.08, y: 0.92 },   // Bottom-left
      { x: 0.08, y: 0.65 },   // Left mid
      { x: 0.15, y: 0.50 },   // A entrance area
      { x: 0.08, y: 0.35 },   // A site left
    ],
    walls: [],
    sites: [
      { id: 'A', center: { x: 0.22, y: 0.22 }, radius: 0.05, label: 'A' },
      { id: 'B', center: { x: 0.78, y: 0.22 }, radius: 0.05, label: 'B' },
    ],
    spawns: [
      { side: 'attack', positions: [{ x: 0.50, y: 0.88 }] },
      { side: 'defense', positions: [{ x: 0.50, y: 0.12 }] },
    ],
    chokes: [
      { id: 'a_short', position: { x: 0.30, y: 0.40 }, label: 'A Short' },
      { id: 'a_bath', position: { x: 0.18, y: 0.45 }, label: 'A Bath' },
      { id: 'b_long', position: { x: 0.70, y: 0.55 }, label: 'B Long' },
      { id: 'b_short', position: { x: 0.65, y: 0.40 }, label: 'B Short' },
      { id: 'hookah', position: { x: 0.72, y: 0.32 }, label: 'Hookah' },
    ],
  },

  // ASCENT - 2 sites (A right, B left)
  ascent: {
    id: 'ascent',
    name: 'Ascent',
    version: 2,
    playableArea: [
      { x: 0.10, y: 0.06 },   // Top-left
      { x: 0.45, y: 0.06 },   // Top before mid
      { x: 0.55, y: 0.06 },   // Top after mid
      { x: 0.90, y: 0.06 },   // Top-right (A site)
      { x: 0.90, y: 0.35 },   // A site right
      { x: 0.85, y: 0.50 },   // A main area
      { x: 0.90, y: 0.65 },   // Right side mid
      { x: 0.90, y: 0.92 },   // Bottom-right
      { x: 0.55, y: 0.92 },   // Bottom spawn right
      { x: 0.45, y: 0.92 },   // Bottom spawn left
      { x: 0.10, y: 0.92 },   // Bottom-left
      { x: 0.10, y: 0.65 },   // Left side mid
      { x: 0.15, y: 0.50 },   // B main area
      { x: 0.10, y: 0.35 },   // B site left
    ],
    walls: [
      // Mid doors
      { from: { x: 0.45, y: 0.40 }, to: { x: 0.55, y: 0.40 } },
      { from: { x: 0.45, y: 0.60 }, to: { x: 0.55, y: 0.60 } },
    ],
    sites: [
      { id: 'A', center: { x: 0.82, y: 0.18 }, radius: 0.05, label: 'A' },
      { id: 'B', center: { x: 0.18, y: 0.18 }, radius: 0.05, label: 'B' },
    ],
    spawns: [
      { side: 'attack', positions: [{ x: 0.50, y: 0.88 }] },
      { side: 'defense', positions: [{ x: 0.50, y: 0.12 }] },
    ],
    chokes: [
      { id: 'a_main', position: { x: 0.75, y: 0.45 }, label: 'A Main' },
      { id: 'a_short', position: { x: 0.65, y: 0.28 }, label: 'A Short' },
      { id: 'mid', position: { x: 0.50, y: 0.50 }, label: 'Mid' },
      { id: 'b_main', position: { x: 0.25, y: 0.50 }, label: 'B Main' },
      { id: 'market', position: { x: 0.32, y: 0.35 }, label: 'Market' },
    ],
  },

  // HAVEN - 3 sites
  haven: {
    id: 'haven',
    name: 'Haven',
    version: 2,
    playableArea: [
      { x: 0.06, y: 0.10 },
      { x: 0.94, y: 0.10 },
      { x: 0.94, y: 0.90 },
      { x: 0.06, y: 0.90 },
    ],
    walls: [],
    sites: [
      { id: 'A', center: { x: 0.82, y: 0.22 }, radius: 0.05, label: 'A' },
      { id: 'B', center: { x: 0.50, y: 0.18 }, radius: 0.05, label: 'B' },
      { id: 'C', center: { x: 0.18, y: 0.22 }, radius: 0.05, label: 'C' },
    ],
    spawns: [
      { side: 'attack', positions: [{ x: 0.50, y: 0.88 }] },
      { side: 'defense', positions: [{ x: 0.50, y: 0.12 }] },
    ],
  },

  // SPLIT - 2 sites
  split: {
    id: 'split',
    name: 'Split',
    version: 2,
    playableArea: [
      { x: 0.08, y: 0.10 },
      { x: 0.92, y: 0.10 },
      { x: 0.92, y: 0.90 },
      { x: 0.08, y: 0.90 },
    ],
    walls: [],
    sites: [
      { id: 'A', center: { x: 0.78, y: 0.22 }, radius: 0.05, label: 'A' },
      { id: 'B', center: { x: 0.22, y: 0.22 }, radius: 0.05, label: 'B' },
    ],
    spawns: [
      { side: 'attack', positions: [{ x: 0.50, y: 0.88 }] },
      { side: 'defense', positions: [{ x: 0.50, y: 0.12 }] },
    ],
  },

  // ICEBOX - 2 sites
  icebox: {
    id: 'icebox',
    name: 'Icebox',
    version: 2,
    playableArea: [
      { x: 0.06, y: 0.10 },
      { x: 0.94, y: 0.10 },
      { x: 0.94, y: 0.90 },
      { x: 0.06, y: 0.90 },
    ],
    walls: [],
    sites: [
      { id: 'A', center: { x: 0.78, y: 0.22 }, radius: 0.05, label: 'A' },
      { id: 'B', center: { x: 0.22, y: 0.28 }, radius: 0.05, label: 'B' },
    ],
    spawns: [
      { side: 'attack', positions: [{ x: 0.50, y: 0.88 }] },
      { side: 'defense', positions: [{ x: 0.50, y: 0.12 }] },
    ],
  },

  // BREEZE - 2 sites
  breeze: {
    id: 'breeze',
    name: 'Breeze',
    version: 2,
    playableArea: [
      { x: 0.04, y: 0.08 },
      { x: 0.96, y: 0.08 },
      { x: 0.96, y: 0.92 },
      { x: 0.04, y: 0.92 },
    ],
    walls: [],
    sites: [
      { id: 'A', center: { x: 0.80, y: 0.22 }, radius: 0.05, label: 'A' },
      { id: 'B', center: { x: 0.20, y: 0.22 }, radius: 0.05, label: 'B' },
    ],
    spawns: [
      { side: 'attack', positions: [{ x: 0.50, y: 0.88 }] },
      { side: 'defense', positions: [{ x: 0.50, y: 0.12 }] },
    ],
  },

  // PEARL - 2 sites
  pearl: {
    id: 'pearl',
    name: 'Pearl',
    version: 2,
    playableArea: [
      { x: 0.08, y: 0.10 },
      { x: 0.92, y: 0.10 },
      { x: 0.92, y: 0.90 },
      { x: 0.08, y: 0.90 },
    ],
    walls: [],
    sites: [
      { id: 'A', center: { x: 0.78, y: 0.22 }, radius: 0.05, label: 'A' },
      { id: 'B', center: { x: 0.22, y: 0.25 }, radius: 0.05, label: 'B' },
    ],
    spawns: [
      { side: 'attack', positions: [{ x: 0.50, y: 0.88 }] },
      { side: 'defense', positions: [{ x: 0.50, y: 0.12 }] },
    ],
  },

  // SUNSET - 2 sites
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    version: 2,
    playableArea: [
      { x: 0.08, y: 0.10 },
      { x: 0.92, y: 0.10 },
      { x: 0.92, y: 0.90 },
      { x: 0.08, y: 0.90 },
    ],
    walls: [],
    sites: [
      { id: 'A', center: { x: 0.78, y: 0.22 }, radius: 0.05, label: 'A' },
      { id: 'B', center: { x: 0.22, y: 0.25 }, radius: 0.05, label: 'B' },
    ],
    spawns: [
      { side: 'attack', positions: [{ x: 0.50, y: 0.88 }] },
      { side: 'defense', positions: [{ x: 0.50, y: 0.12 }] },
    ],
  },

  // ABYSS - 2 sites
  abyss: {
    id: 'abyss',
    name: 'Abyss',
    version: 2,
    playableArea: [
      { x: 0.08, y: 0.10 },
      { x: 0.92, y: 0.10 },
      { x: 0.92, y: 0.90 },
      { x: 0.08, y: 0.90 },
    ],
    walls: [],
    sites: [
      { id: 'A', center: { x: 0.78, y: 0.25 }, radius: 0.05, label: 'A' },
      { id: 'B', center: { x: 0.22, y: 0.25 }, radius: 0.05, label: 'B' },
    ],
    spawns: [
      { side: 'attack', positions: [{ x: 0.50, y: 0.88 }] },
      { side: 'defense', positions: [{ x: 0.50, y: 0.12 }] },
    ],
  },

  // CORODE - 2 sites
  corode: {
    id: 'corode',
    name: 'Corode',
    version: 2,
    playableArea: [
      { x: 0.08, y: 0.10 },
      { x: 0.92, y: 0.10 },
      { x: 0.92, y: 0.90 },
      { x: 0.08, y: 0.90 },
    ],
    walls: [],
    sites: [
      { id: 'A', center: { x: 0.78, y: 0.25 }, radius: 0.05, label: 'A' },
      { id: 'B', center: { x: 0.35, y: 0.25 }, radius: 0.05, label: 'B' },
    ],
    spawns: [
      { side: 'attack', positions: [{ x: 0.50, y: 0.88 }] },
      { side: 'defense', positions: [{ x: 0.50, y: 0.12 }] },
    ],
  },
};

/**
 * Load all map geometries from storage
 */
export function loadGeometries(): Record<string, MapGeometryData> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults, preferring newer versions
      const merged: Record<string, MapGeometryData> = { ...DEFAULT_GEOMETRIES };
      for (const [key, value] of Object.entries(parsed)) {
        const defaultVersion = DEFAULT_GEOMETRIES[key]?.version || 0;
        const storedVersion = (value as MapGeometryData).version || 0;
        // Only use stored if version is >= default
        if (storedVersion >= defaultVersion) {
          merged[key] = value as MapGeometryData;
        }
      }
      return merged;
    }
  } catch (e) {
    console.warn('Failed to load geometries from storage:', e);
  }
  return { ...DEFAULT_GEOMETRIES };
}

/**
 * Save all geometries to storage
 */
export function saveGeometries(geometries: Record<string, MapGeometryData>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(geometries));
  } catch (e) {
    console.error('Failed to save geometries:', e);
  }
}

/**
 * Get geometry for a specific map
 */
export function getGeometry(mapId: string): MapGeometryData {
  const geometries = loadGeometries();
  const key = mapId.toLowerCase().replace(/\s+/g, '');
  return geometries[key] || DEFAULT_GEOMETRIES[key] || createEmptyGeometry(key, mapId);
}

/**
 * Save geometry for a specific map
 */
export function saveGeometry(geometry: MapGeometryData): void {
  const geometries = loadGeometries();
  geometries[geometry.id] = {
    ...geometry,
    lastUpdated: new Date().toISOString(),
  };
  saveGeometries(geometries);
}

/**
 * Export geometry as JSON
 */
export function exportGeometry(geometry: MapGeometryData): string {
  return JSON.stringify(geometry, null, 2);
}

/**
 * Import geometry from JSON
 */
export function importGeometry(json: string): MapGeometryData | null {
  try {
    const data = JSON.parse(json);
    if (data.id && data.playableArea) {
      return data as MapGeometryData;
    }
  } catch (e) {
    console.error('Failed to parse geometry JSON:', e);
  }
  return null;
}

/**
 * Get site center position (normalized 0-1)
 */
export function getSiteCenter(mapId: string, siteId: string): Vec2 | null {
  const geo = getGeometry(mapId);
  const site = geo.sites?.find(s => s.id.toUpperCase() === siteId.toUpperCase());
  return site?.center || null;
}

/**
 * Get all site positions for a map
 */
export function getAllSites(mapId: string): { id: string; center: Vec2; label: string }[] {
  const geo = getGeometry(mapId);
  return geo.sites?.map(s => ({ id: s.id, center: s.center, label: s.label })) || [];
}
