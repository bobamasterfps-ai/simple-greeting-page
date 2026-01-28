/**
 * Walkable Area System - Auto-snap abilities to valid positions
 * 
 * CORE PRINCIPLES:
 * 1. Abilities CANNOT be placed outside walkable area
 * 2. If position is invalid, snap to nearest valid point
 * 3. If snap fails, reject the ability entirely
 */

import { Vec2, Polygon } from './mapGeometryTypes';
import { pointInPolygon, clampToPlayableArea, distance } from './geometryUtils';
import { clampVec2 } from './mapTransform';

/**
 * Check if a position is within the walkable area
 */
export function isWalkable(pos: Vec2, playableArea: Polygon): boolean {
  // If no playable area defined, treat entire map as walkable
  if (!playableArea || playableArea.length < 3) {
    return true;
  }
  return pointInPolygon(pos, playableArea);
}

/**
 * Snap a position to the nearest valid walkable point
 * Returns null if snapping fails (position too far from walkable area)
 * 
 * @param pos - The position to snap
 * @param playableArea - The polygon defining the walkable area
 * @param maxSearchRadius - Maximum distance to search (normalized, default 0.1 = 10% of map)
 * @returns Snapped position or null if failed
 */
export function snapToWalkable(
  pos: Vec2,
  playableArea: Polygon,
  maxSearchRadius: number = 0.1
): Vec2 | null {
  // If no playable area defined, just clamp to map bounds
  if (!playableArea || playableArea.length < 3) {
    return clampVec2(pos);
  }

  // If already valid, return clamped position
  if (isWalkable(pos, playableArea)) {
    return clampVec2(pos);
  }

  // Spiral search for nearest valid point
  for (let r = 0.01; r <= maxSearchRadius; r += 0.01) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
      const testPos: Vec2 = {
        x: pos.x + Math.cos(angle) * r,
        y: pos.y + Math.sin(angle) * r,
      };
      
      if (isWalkable(testPos, playableArea)) {
        return clampVec2(testPos);
      }
    }
  }

  // If spiral search fails, try edge snap
  const edgeSnapped = clampToPlayableArea(pos, playableArea);
  if (isWalkable(edgeSnapped, playableArea)) {
    return clampVec2(edgeSnapped);
  }

  // Failed to find valid position
  return null;
}

/**
 * Validate and snap an ability position
 * This is the main function to use before rendering abilities
 */
export function validateAbilityPosition(
  pos: Vec2,
  playableArea: Polygon
): { valid: boolean; position: Vec2; wasSnapped: boolean } {
  // Clamp first
  const clamped = clampVec2(pos);
  
  // Check if already valid
  if (isWalkable(clamped, playableArea)) {
    return { valid: true, position: clamped, wasSnapped: false };
  }
  
  // Try to snap
  const snapped = snapToWalkable(clamped, playableArea);
  
  if (snapped) {
    return { valid: true, position: snapped, wasSnapped: true };
  }
  
  // Failed - return original clamped position but mark as invalid
  return { valid: false, position: clamped, wasSnapped: false };
}

/**
 * Get the center of a polygon (for site positions)
 */
export function getPolygonCenter(polygon: Polygon): Vec2 {
  if (!polygon || polygon.length === 0) {
    return { x: 0.5, y: 0.5 };
  }
  
  const sum = polygon.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 }
  );
  
  return {
    x: sum.x / polygon.length,
    y: sum.y / polygon.length,
  };
}

/**
 * Check if a path between two points crosses a wall
 */
export function isPathValid(
  from: Vec2,
  to: Vec2,
  playableArea: Polygon
): boolean {
  // Both endpoints must be valid
  if (!isWalkable(from, playableArea) || !isWalkable(to, playableArea)) {
    return false;
  }
  
  // Sample points along the path
  const steps = 10;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const midPoint: Vec2 = {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
    
    if (!isWalkable(midPoint, playableArea)) {
      return false;
    }
  }
  
  return true;
}
