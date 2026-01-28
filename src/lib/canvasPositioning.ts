/**
 * Canvas Positioning System - Normalized coordinates with bounds conversion
 * 
 * ALL positions are normalized 0-1 range. Canvas pixel conversion happens ONLY at render time.
 * This ensures abilities stay on-map regardless of canvas size.
 */

export interface CanvasBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NormalizedPosition {
  x: number; // 0 to 1
  y: number; // 0 to 1
}

/**
 * Clamp value to 0-1 range - abilities cannot escape map
 */
export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Convert normalized position (0-1) to canvas pixel coordinates
 */
export function normalizedToCanvas(
  normalized: NormalizedPosition,
  bounds: CanvasBounds
): { x: number; y: number } {
  // Always clamp to prevent off-map rendering
  const x = clamp01(normalized.x);
  const y = clamp01(normalized.y);
  
  return {
    x: bounds.x + x * bounds.width,
    y: bounds.y + y * bounds.height,
  };
}

/**
 * Convert canvas pixel coordinates back to normalized (0-1)
 */
export function canvasToNormalized(
  canvas: { x: number; y: number },
  bounds: CanvasBounds
): NormalizedPosition {
  return {
    x: clamp01((canvas.x - bounds.x) / bounds.width),
    y: clamp01((canvas.y - bounds.y) / bounds.height),
  };
}

/**
 * Convert normalized radius to canvas pixels
 * Radius is relative to the smaller dimension for consistent circles
 */
export function normalizedRadiusToCanvas(
  normalizedRadius: number,
  bounds: CanvasBounds
): number {
  const minDimension = Math.min(bounds.width, bounds.height);
  return clamp01(normalizedRadius) * minDimension;
}

/**
 * Normalize a value from any format to 0-1 range
 * Handles: 0-1, 0-100, and out-of-range values
 */
export function normalizeValue(v: number): number {
  if (v < 0) return 0;
  if (v > 1 && v <= 100) return v / 100;
  if (v > 100) return 1;
  return v;
}

/**
 * Normalize a position from any format to 0-1 range
 */
export function normalizePosition(pos: { x: number; y: number }): NormalizedPosition {
  return {
    x: normalizeValue(pos.x),
    y: normalizeValue(pos.y),
  };
}

/**
 * Transform position for defense side (mirror X axis only)
 */
export function transformForDefense(pos: NormalizedPosition): NormalizedPosition {
  return {
    x: 1 - pos.x,
    y: pos.y, // Y never changes
  };
}

/**
 * Full transform pipeline for rendering
 * normalize → transform for side → clamp → to canvas
 */
export function transformAndConvert(
  pos: { x: number; y: number },
  side: 'attack' | 'defense',
  bounds: CanvasBounds
): { x: number; y: number } {
  // 1. Normalize
  let p = normalizePosition(pos);
  
  // 2. Transform for side
  if (side === 'defense') {
    p = transformForDefense(p);
  }
  
  // 3. Convert to canvas (includes clamp)
  return normalizedToCanvas(p, bounds);
}

/**
 * Create bounds from canvas dimensions
 */
export function createBounds(canvas: HTMLCanvasElement): CanvasBounds {
  return {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Create bounds from width/height
 */
export function createBoundsFromSize(width: number, height: number): CanvasBounds {
  return {
    x: 0,
    y: 0,
    width,
    height,
  };
}
