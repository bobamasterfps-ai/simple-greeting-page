/**
 * Geometry Utilities - Collision Detection & Validation
 * 
 * All calculations use normalized 0-1 coordinates
 */

import { Vec2, Polygon, Wall } from './mapGeometryTypes';

/**
 * Check if a point is inside a polygon (ray casting algorithm)
 */
export function pointInPolygon(point: Vec2, polygon: Polygon): boolean {
  if (polygon.length < 3) return false;
  
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Check if two line segments intersect
 */
export function linesIntersect(
  a1: Vec2, a2: Vec2,
  b1: Vec2, b2: Vec2
): boolean {
  const ccw = (A: Vec2, B: Vec2, C: Vec2) => {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  };
  
  return (
    ccw(a1, b1, b2) !== ccw(a2, b1, b2) &&
    ccw(a1, a2, b1) !== ccw(a1, a2, b2)
  );
}

/**
 * Check if a path from A to B crosses any wall
 */
export function pathCrossesWall(from: Vec2, to: Vec2, walls: Wall[]): boolean {
  return walls.some(wall => linesIntersect(from, to, wall.from, wall.to));
}

/**
 * Check if a point can be placed (inside playable area, not crossing walls)
 */
export function isValidPlacement(
  point: Vec2,
  playableArea: Polygon,
  walls: Wall[]
): boolean {
  // Must be inside playable area
  if (!pointInPolygon(point, playableArea)) {
    return false;
  }
  
  return true;
}

/**
 * Check if a path is valid (both ends in playable area, no wall crossings)
 */
export function isValidPath(
  from: Vec2,
  to: Vec2,
  playableArea: Polygon,
  walls: Wall[]
): boolean {
  // Both points must be in playable area
  if (!pointInPolygon(from, playableArea) || !pointInPolygon(to, playableArea)) {
    return false;
  }
  
  // Path cannot cross any wall
  if (pathCrossesWall(from, to, walls)) {
    return false;
  }
  
  return true;
}

/**
 * Clamp a point to the nearest edge of the playable area
 */
export function clampToPlayableArea(point: Vec2, playableArea: Polygon): Vec2 {
  if (playableArea.length < 3) return point;
  if (pointInPolygon(point, playableArea)) return point;
  
  // Find the closest point on the polygon edge
  let closestPoint = point;
  let minDist = Infinity;
  
  for (let i = 0; i < playableArea.length; i++) {
    const a = playableArea[i];
    const b = playableArea[(i + 1) % playableArea.length];
    
    const closest = closestPointOnSegment(point, a, b);
    const dist = distance(point, closest);
    
    if (dist < minDist) {
      minDist = dist;
      closestPoint = closest;
    }
  }
  
  return closestPoint;
}

/**
 * Find the closest point on a line segment to a given point
 */
function closestPointOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  
  if (dx === 0 && dy === 0) return a;
  
  const t = Math.max(0, Math.min(1, 
    ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)
  ));
  
  return {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };
}

/**
 * Calculate distance between two points
 */
export function distance(a: Vec2, b: Vec2): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

/**
 * Calculate the area of a polygon (for validation)
 */
export function polygonArea(polygon: Polygon): number {
  if (polygon.length < 3) return 0;
  
  let area = 0;
  const n = polygon.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  
  return Math.abs(area) / 2;
}

/**
 * Check if polygon points are in clockwise order
 */
export function isClockwise(polygon: Polygon): boolean {
  if (polygon.length < 3) return true;
  
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    sum += (next.x - current.x) * (next.y + current.y);
  }
  
  return sum > 0;
}

/**
 * Ensure polygon is in clockwise order (for consistent rendering)
 */
export function ensureClockwise(polygon: Polygon): Polygon {
  if (isClockwise(polygon)) return polygon;
  return [...polygon].reverse();
}
