/**
 * Map Transform System - SINGLE SOURCE OF TRUTH
 * 
 * CRITICAL RULES:
 * 1. All coordinates are normalized 0-1
 * 2. Defense view = mirror X axis ONLY (x = 1 - x)
 * 3. Apply transform BEFORE clamping
 * 4. Never modify Y axis for defense
 */

import { Vec2 } from './mapGeometryTypes';

/**
 * Transform position for defense side (mirror horizontally)
 * This is the ONLY correct way to flip for defense
 */
export function mirrorForDefense(pos: Vec2): Vec2 {
  return {
    x: 1 - pos.x,
    y: pos.y, // Y stays the same - NEVER flip Y
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
 * Clamp value to 0-1 range
 */
export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
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
 * Normalize percentage (0-100) or 0-1 to 0-1 range
 */
export function normalizeValue(v: number): number {
  // If value is greater than 1, assume it's 0-100 range
  if (v > 1) {
    return clamp01(v / 100);
  }
  return clamp01(v);
}

/**
 * Normalize a position from any format to 0-1 range
 */
export function normalizeVec2(pos: Vec2): Vec2 {
  return {
    x: normalizeValue(pos.x),
    y: normalizeValue(pos.y),
  };
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
 * Full transform pipeline: normalize → transform for side → clamp → to canvas
 */
export function fullTransformToCanvas(
  pos: Vec2,
  side: 'attack' | 'defense',
  canvasWidth: number,
  canvasHeight: number
): Vec2 {
  // 1. Normalize (handle 0-100 or 0-1)
  let p = normalizeVec2(pos);
  
  // 2. Transform for side (defense = mirror X)
  p = transformForSide(p, side);
  
  // 3. Clamp to bounds
  p = clampVec2(p);
  
  // 4. Convert to canvas pixels
  return toCanvasCoords(p, canvasWidth, canvasHeight);
}
