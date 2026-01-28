/**
 * Coordinate System Utilities - SINGLE SOURCE OF TRUTH
 * 
 * RULES (NON-NEGOTIABLE):
 * 1. All positions are normalized 0-1 (NOT pixels, NOT percentages 0-100)
 * 2. Abilities CANNOT leave the map - hard clamped
 * 3. Defense = mirror X only (not Y, not rotate)
 * 4. Canvas coords are computed ONLY at render time
 */

export type Side = 'attack' | 'defense';

/**
 * Clamp value to 0-1 range (abilities cannot escape map)
 */
export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Clamp a point to valid map bounds (0-1)
 */
export function clampPoint(p: { x: number; y: number }): { x: number; y: number } {
  return {
    x: clamp01(p.x),
    y: clamp01(p.y),
  };
}

/**
 * Transform position for side (defense = mirror X axis)
 * Apply BEFORE clamping
 */
export function transformForSide(
  p: { x: number; y: number },
  side: Side
): { x: number; y: number } {
  if (side === 'defense') {
    return {
      x: 1 - p.x,
      y: p.y, // Y stays the same - only mirror horizontally
    };
  }
  return p;
}

/**
 * Normalize percentage (0-100) to 0-1 range
 * Use when receiving AI-generated coordinates
 */
export function normalizeFromPercent(v: number): number {
  // If already in 0-1 range, return as-is
  if (v <= 1) return clamp01(v);
  // Otherwise convert from 0-100
  return clamp01(v / 100);
}

/**
 * Normalize a point from any format to 0-1 range
 */
export function normalizePoint(p: { x: number; y: number }): { x: number; y: number } {
  return {
    x: normalizeFromPercent(p.x),
    y: normalizeFromPercent(p.y),
  };
}

/**
 * Convert normalized position to canvas pixel coordinates
 * THIS IS THE ONLY PLACE PIXELS EXIST
 */
export function toCanvas(
  p: { x: number; y: number },
  width: number,
  height: number
): { x: number; y: number } {
  // Always clamp before converting to pixels
  const clamped = clampPoint(p);
  return {
    x: clamped.x * width,
    y: clamped.y * height,
  };
}

/**
 * Full transform pipeline: normalize → transform for side → clamp → to canvas
 */
export function fullTransform(
  p: { x: number; y: number },
  side: Side,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  // 1. Normalize (handle 0-100 or 0-1)
  let pos = normalizePoint(p);
  
  // 2. Transform for side (defense = mirror X)
  pos = transformForSide(pos, side);
  
  // 3. Clamp to bounds
  pos = clampPoint(pos);
  
  // 4. Convert to canvas pixels
  return toCanvas(pos, canvasWidth, canvasHeight);
}
