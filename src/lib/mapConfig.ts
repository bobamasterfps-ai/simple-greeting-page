/**
 * Map Configuration System - DATA-DRIVEN ARCHITECTURE
 * 
 * CORE PRINCIPLES:
 * 1. Side-based rotation: Maps rotate based on attack/defense perspective
 * 2. Site labels are ABSOLUTE to the map - they rotate WITH the map
 * 3. All coordinates use normalized 0-1 values measured from actual map images
 * 4. Positions are pixel-mapped, not dynamically guessed
 * 
 * MAPS INCLUDED:
 * - Ascent, Abyss, Bind, Breeze, Corode, Haven, Icebox, Lotus, Pearl, Split, Sunset, Fracture
 */

export type MapSide = 'attack' | 'defense';

export interface SitePosition {
  x: number;  // 0-1 normalized (measured from top-left)
  y: number;  // 0-1 normalized
}

export interface MapOrientation {
  /** Rotation in degrees for attacking view (default: 0) */
  attacking: number;
  /** Rotation in degrees for defending view (usually 180 for mirrored) */
  defending: number;
}

export interface MapTransform {
  rotation: number;      // Computed based on side
  flipX: boolean;        // Mirror horizontally
  flipY: boolean;        // Mirror vertically
}

export interface MapConfig {
  id: string;
  name: string;
  image: string;
  /** Side-based rotation angles */
  orientation: MapOrientation;
  /** Computed transform (set by getMapTransform) */
  transform: MapTransform;
  /** Site positions - ABSOLUTE to map image (top-left origin) */
  sites: Record<string, SitePosition>;
  /** Spawn positions */
  spawn: {
    attack: SitePosition;
    defense: SitePosition;
  };
  /** Valid bounds for placing elements */
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  /** Map-specific notes */
  notes?: string;
}

/**
 * MAP CONFIGURATIONS
 * 
 * Site positions are measured from the ATTACKING perspective (attackers at bottom).
 * The reference images show:
 * - Image 1: Ascent - A on right, B on left
 * - Image 2: Abyss - A on right, B on left
 * - Image 3: Bind - A on right, B on left
 * - Image 4: Breeze - A on right, B on left
 * - Image 5: Corode (new map) - A on right, B on left
 * - Image 6: Haven - A on right, B middle, C on left
 * - Image 7: Pearl - A on right, B on left
 * - Image 8: Split - A on right, B on left
 */
export const MAP_CONFIGS: Record<string, MapConfig> = {
  ascent: {
    id: 'ascent',
    name: 'Ascent',
    image: '/maps/ascent.png',
    orientation: {
      attacking: 0,
      defending: 0,
    },
    transform: { rotation: 0, flipX: false, flipY: false },
    sites: {
      // ACCURATE from uploaded reference image (image-3.png)
      // A site: right side, B site: left side
      A: { x: 0.82, y: 0.18 },
      B: { x: 0.18, y: 0.18 },
    },
    spawn: {
      attack: { x: 0.50, y: 0.88 },
      defense: { x: 0.50, y: 0.12 },
    },
    bounds: { minX: 0.10, minY: 0.06, maxX: 0.90, maxY: 0.92 },
  },

  abyss: {
    id: 'abyss',
    name: 'Abyss',
    image: '/maps/abyss.png',
    orientation: {
      attacking: 0,
      defending: 0,
    },
    transform: { rotation: 0, flipX: false, flipY: false },
    sites: {
      // From reference image 2: A site is right side, B site is left side
      A: { x: 0.75, y: 0.32 },
      B: { x: 0.27, y: 0.30 },
    },
    spawn: {
      attack: { x: 0.50, y: 0.90 },
      defense: { x: 0.50, y: 0.10 },
    },
    bounds: { minX: 0.10, minY: 0.08, maxX: 0.90, maxY: 0.92 },
    notes: 'Asymmetric map with unique verticality',
  },

  bind: {
    id: 'bind',
    name: 'Bind',
    image: '/maps/bind.png',
    orientation: {
      attacking: 0,
      defending: 0,
    },
    transform: { rotation: 0, flipX: false, flipY: false },
    sites: {
      // ACCURATE from uploaded reference image (image-2.png)
      // A site: left side, B site: right side
      A: { x: 0.22, y: 0.22 },
      B: { x: 0.78, y: 0.22 },
    },
    spawn: {
      attack: { x: 0.50, y: 0.88 },
      defense: { x: 0.50, y: 0.12 },
    },
    bounds: { minX: 0.08, minY: 0.08, maxX: 0.92, maxY: 0.92 },
    notes: 'No mid area - uses teleporters',
  },

  breeze: {
    id: 'breeze',
    name: 'Breeze',
    image: '/maps/breeze.png',
    orientation: {
      attacking: 0,
      defending: 0,
    },
    transform: { rotation: 0, flipX: false, flipY: false },
    sites: {
      // From reference image 4: A site is right, B site is left with circle marker
      A: { x: 0.78, y: 0.38 },
      B: { x: 0.30, y: 0.22 },
    },
    spawn: {
      attack: { x: 0.50, y: 0.92 },
      defense: { x: 0.50, y: 0.08 },
    },
    bounds: { minX: 0.12, minY: 0.05, maxX: 0.88, maxY: 0.94 },
    notes: 'Large scale map with long sightlines',
  },

  corode: {
    id: 'corode',
    name: 'Corode',
    image: '/maps/corode.png',
    orientation: {
      attacking: 0,
      defending: 0,
    },
    transform: { rotation: 0, flipX: false, flipY: false },
    sites: {
      // From reference image 5: A site is right-upper, B site is left-center
      A: { x: 0.75, y: 0.32 },
      B: { x: 0.35, y: 0.32 },
    },
    spawn: {
      attack: { x: 0.50, y: 0.90 },
      defense: { x: 0.50, y: 0.10 },
    },
    bounds: { minX: 0.12, minY: 0.08, maxX: 0.88, maxY: 0.92 },
    notes: 'Newest map with unique layout',
  },

  haven: {
    id: 'haven',
    name: 'Haven',
    image: '/maps/haven.png',
    orientation: {
      attacking: 0,
      defending: 0,
    },
    transform: { rotation: 0, flipX: false, flipY: false },
    sites: {
      // From reference image 6: A site right, B site center, C site left
      A: { x: 0.78, y: 0.28 },
      B: { x: 0.52, y: 0.30 },
      C: { x: 0.28, y: 0.28 },
    },
    spawn: {
      attack: { x: 0.50, y: 0.90 },
      defense: { x: 0.50, y: 0.10 },
    },
    bounds: { minX: 0.10, minY: 0.06, maxX: 0.90, maxY: 0.92 },
    notes: '3-site map',
  },

  icebox: {
    id: 'icebox',
    name: 'Icebox',
    image: '/maps/icebox.png',
    orientation: {
      attacking: 0,
      defending: 0,
    },
    transform: { rotation: 0, flipX: false, flipY: false },
    sites: {
      A: { x: 0.78, y: 0.32 },
      B: { x: 0.28, y: 0.20 },
    },
    spawn: {
      attack: { x: 0.50, y: 0.90 },
      defense: { x: 0.50, y: 0.10 },
    },
    bounds: { minX: 0.10, minY: 0.08, maxX: 0.90, maxY: 0.92 },
    notes: 'Verticality with zip lines',
  },

  lotus: {
    id: 'lotus',
    name: 'Lotus',
    image: '/maps/lotus.png',
    orientation: {
      attacking: 0,
      defending: 0,
    },
    transform: { rotation: 0, flipX: false, flipY: false },
    sites: {
      // ACCURATE from uploaded reference image (image.png)
      // A site: right side, B site: center-top, C site: left side
      A: { x: 0.85, y: 0.22 },
      B: { x: 0.50, y: 0.16 },
      C: { x: 0.15, y: 0.22 },
    },
    spawn: {
      attack: { x: 0.50, y: 0.88 },
      defense: { x: 0.50, y: 0.12 },
    },
    bounds: { minX: 0.06, minY: 0.04, maxX: 0.94, maxY: 0.92 },
    notes: '3-site map with rotating doors',
  },

  pearl: {
    id: 'pearl',
    name: 'Pearl',
    image: '/maps/pearl.png',
    orientation: {
      attacking: 0,
      defending: 0,
    },
    transform: { rotation: 0, flipX: false, flipY: false },
    sites: {
      // From reference image 7: A site right, B site left
      A: { x: 0.78, y: 0.26 },
      B: { x: 0.30, y: 0.32 },
    },
    spawn: {
      attack: { x: 0.50, y: 0.92 },
      defense: { x: 0.50, y: 0.08 },
    },
    bounds: { minX: 0.12, minY: 0.06, maxX: 0.88, maxY: 0.94 },
    notes: 'Long corridors',
  },

  split: {
    id: 'split',
    name: 'Split',
    image: '/maps/split.png',
    orientation: {
      attacking: 0,
      defending: 0,
    },
    transform: { rotation: 0, flipX: false, flipY: false },
    sites: {
      // From reference image 8: A site right, B site left
      A: { x: 0.78, y: 0.24 },
      B: { x: 0.30, y: 0.28 },
    },
    spawn: {
      attack: { x: 0.50, y: 0.90 },
      defense: { x: 0.50, y: 0.08 },
    },
    bounds: { minX: 0.12, minY: 0.08, maxX: 0.88, maxY: 0.92 },
    notes: 'Verticality with ropes',
  },

  sunset: {
    id: 'sunset',
    name: 'Sunset',
    image: '/maps/sunset.png',
    orientation: {
      attacking: 0,
      defending: 0,
    },
    transform: { rotation: 0, flipX: false, flipY: false },
    sites: {
      A: { x: 0.72, y: 0.28 },
      B: { x: 0.26, y: 0.30 },
    },
    spawn: {
      attack: { x: 0.50, y: 0.90 },
      defense: { x: 0.50, y: 0.10 },
    },
    bounds: { minX: 0.12, minY: 0.08, maxX: 0.88, maxY: 0.92 },
  },

  fracture: {
    id: 'fracture',
    name: 'Fracture',
    image: '/maps/fracture.png',
    orientation: {
      attacking: 0,
      defending: 0,
    },
    transform: { rotation: 0, flipX: false, flipY: false },
    sites: {
      // Fracture is unique: attackers spawn from multiple sides
      A: { x: 0.75, y: 0.45 },
      B: { x: 0.25, y: 0.45 },
    },
    spawn: {
      attack: { x: 0.50, y: 0.92 },
      defense: { x: 0.50, y: 0.50 },
    },
    bounds: { minX: 0.08, minY: 0.15, maxX: 0.92, maxY: 0.85 },
    notes: 'Unique H-shaped layout with attackers spawning on both ends',
  },
};

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Convert percentage (0-100) to normalized (0-1) and clamp to bounds
 */
export function normalizePosition(
  pos: { x: number; y: number },
  bounds: MapConfig['bounds']
): { x: number; y: number } {
  return {
    x: clamp(pos.x / 100, bounds.minX, bounds.maxX),
    y: clamp(pos.y / 100, bounds.minY, bounds.maxY),
  };
}

/**
 * Convert normalized position (0-1) to canvas coordinates
 */
export function toCanvasCoords(
  pos: { x: number; y: number },
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: pos.x * canvasWidth,
    y: pos.y * canvasHeight,
  };
}

/**
 * Get map transform based on side (attack/defense)
 * For defense, we flip positions to show defender perspective
 */
export function getMapTransform(mapConfig: MapConfig, side: MapSide): MapTransform {
  const rotation = side === 'attack' 
    ? mapConfig.orientation.attacking 
    : mapConfig.orientation.defending;

  return {
    rotation,
    flipX: false,
    flipY: false,
  };
}

/**
 * Transform a position based on side
 * Defense view mirrors X ONLY - Y stays the same!
 * This is because we use the same map image, just flipping perspective horizontally
 */
export function transformPositionForSide(
  pos: { x: number; y: number },
  side: MapSide
): { x: number; y: number } {
  if (side === 'defense') {
    // Mirror X position ONLY for defense view
    // Y NEVER changes - only mirror horizontally
    return {
      x: 1 - pos.x,
      y: pos.y,  // CRITICAL: Y stays the same!
    };
  }
  return pos;
}

/**
 * Get spawn position based on side
 */
export function getSpawnPosition(mapConfig: MapConfig, side: MapSide): SitePosition {
  return side === 'attack' ? mapConfig.spawn.attack : mapConfig.spawn.defense;
}

/**
 * Get map config by name (case-insensitive)
 */
export function getMapConfig(mapName: string): MapConfig | undefined {
  const normalized = mapName.toLowerCase().replace(/\s/g, '');
  return MAP_CONFIGS[normalized];
}

/**
 * Get all map names
 */
export function getAllMapNames(): string[] {
  return Object.values(MAP_CONFIGS).map(m => m.name);
}

/**
 * Get all maps as array
 */
export function getAllMaps(): MapConfig[] {
  return Object.values(MAP_CONFIGS);
}

/**
 * Check if a map has 3 sites
 */
export function hasThreeSites(mapName: string): boolean {
  const config = getMapConfig(mapName);
  return config ? Object.keys(config.sites).length === 3 : false;
}

/**
 * Get site names for a map
 */
export function getSiteNames(mapName: string): string[] {
  const config = getMapConfig(mapName);
  return config ? Object.keys(config.sites) : ['A', 'B'];
}
