/**
 * Ability Renderer - Clean visual rendering for all ability types
 * 
 * IMPORTANT: All positions passed to renderAbility should already be
 * converted to canvas pixels. Radius should also be in pixels.
 * Use canvasPositioning.ts functions to convert normalized → canvas.
 */

import { VisualType } from './strategyTypes';

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  x: number;        // Canvas pixel X
  y: number;        // Canvas pixel Y
  fromX?: number;   // Canvas pixel X (for arrows/walls)
  fromY?: number;   // Canvas pixel Y (for arrows/walls)
  radius?: number;  // Canvas pixel radius
  fadeIn: number;
  time: number;
}

// Ability color palette - vibrant and distinguishable
const ABILITY_COLORS: Record<VisualType, { stroke: string; fill: string; glow: string }> = {
  smoke: {
    stroke: 'rgba(140, 140, 160, 0.9)',
    fill: 'rgba(100, 100, 120, 0.35)',
    glow: 'rgba(120, 120, 140, 0.2)',
  },
  flash: {
    stroke: 'rgba(255, 220, 80, 0.95)',
    fill: 'rgba(255, 255, 150, 0.25)',
    glow: 'rgba(255, 240, 100, 0.3)',
  },
  molly: {
    stroke: 'rgba(255, 100, 50, 0.95)',
    fill: 'rgba(255, 80, 30, 0.35)',
    glow: 'rgba(255, 120, 60, 0.25)',
  },
  recon: {
    stroke: 'rgba(80, 180, 255, 0.95)',
    fill: 'rgba(60, 160, 255, 0.2)',
    glow: 'rgba(100, 200, 255, 0.15)',
  },
  wall: {
    stroke: 'rgba(100, 255, 150, 0.95)',
    fill: 'rgba(80, 200, 120, 0.3)',
    glow: 'rgba(120, 255, 160, 0.2)',
  },
  stun: {
    stroke: 'rgba(180, 100, 255, 0.95)',
    fill: 'rgba(160, 80, 255, 0.25)',
    glow: 'rgba(200, 120, 255, 0.2)',
  },
  trap: {
    stroke: 'rgba(255, 180, 50, 0.95)',
    fill: 'rgba(255, 160, 30, 0.25)',
    glow: 'rgba(255, 200, 80, 0.2)',
  },
  movement: {
    stroke: 'rgba(0, 255, 200, 0.95)',
    fill: 'rgba(0, 200, 180, 0.15)',
    glow: 'rgba(0, 255, 220, 0.2)',
  },
};

/**
 * Draw smoke ability - soft radial gradient
 */
export function drawSmoke(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fadeIn: number): void {
  const colors = ABILITY_COLORS.smoke;
  
  // Outer glow
  const glowGradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 1.3);
  glowGradient.addColorStop(0, colors.glow);
  glowGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGradient;
  ctx.globalAlpha = fadeIn * 0.6;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.3, 0, Math.PI * 2);
  ctx.fill();
  
  // Main smoke body
  const mainGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  mainGradient.addColorStop(0, colors.fill);
  mainGradient.addColorStop(0.7, colors.fill);
  mainGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = mainGradient;
  ctx.globalAlpha = fadeIn * 0.8;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Edge ring
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 2;
  ctx.globalAlpha = fadeIn;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

/**
 * Draw flash ability - cone/burst effect
 */
export function drawFlash(ctx: CanvasRenderingContext2D, x: number, y: number, fromX: number, fromY: number, fadeIn: number): void {
  const colors = ABILITY_COLORS.flash;
  const angle = Math.atan2(y - fromY, x - fromX);
  const coneAngle = Math.PI / 4; // 45 degree cone
  const radius = 60;
  
  // Cone
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, radius, angle - coneAngle, angle + coneAngle);
  ctx.closePath();
  
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, colors.fill);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.globalAlpha = fadeIn * 0.6;
  ctx.fill();
  
  // Burst lines
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 2;
  ctx.globalAlpha = fadeIn;
  for (let i = -2; i <= 2; i++) {
    const lineAngle = angle + (i * coneAngle / 3);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(lineAngle) * radius * 0.7, y + Math.sin(lineAngle) * radius * 0.7);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/**
 * Draw molly/damage zone - pulsing impact
 */
export function drawMolly(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fadeIn: number, time: number): void {
  const colors = ABILITY_COLORS.molly;
  const pulse = 1 + Math.sin(time * 4) * 0.1;
  const r = radius * pulse;
  
  // Outer ring pulse
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 3;
  ctx.globalAlpha = fadeIn * 0.8;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner fire gradient
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, colors.fill);
  gradient.addColorStop(0.5, colors.fill);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.globalAlpha = fadeIn * 0.6;
  ctx.fill();
  
  // Hot center
  ctx.fillStyle = 'rgba(255, 200, 100, 0.4)';
  ctx.globalAlpha = fadeIn * 0.7;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * Draw recon/reveal - scanning waves
 */
export function drawRecon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fadeIn: number, time: number): void {
  const colors = ABILITY_COLORS.recon;
  
  // Scanning rings
  for (let i = 0; i < 3; i++) {
    const ringProgress = ((time * 0.5) + i * 0.33) % 1;
    const ringRadius = radius * ringProgress;
    const ringAlpha = (1 - ringProgress) * fadeIn * 0.6;
    
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 2;
    ctx.globalAlpha = ringAlpha;
    ctx.beginPath();
    ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Center point
  ctx.fillStyle = colors.stroke;
  ctx.globalAlpha = fadeIn;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * Draw wall - line between two points
 */
export function drawWall(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, fadeIn: number): void {
  const colors = ABILITY_COLORS.wall;
  
  // Glow behind
  ctx.strokeStyle = colors.glow;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.globalAlpha = fadeIn * 0.5;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  
  // Main wall line
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 6;
  ctx.globalAlpha = fadeIn;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  
  // Inner bright line
  ctx.strokeStyle = colors.fill;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/**
 * Draw stun zone
 */
export function drawStun(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fadeIn: number, time: number): void {
  const colors = ABILITY_COLORS.stun;
  const pulse = 1 + Math.sin(time * 6) * 0.15;
  
  // Lightning effect
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 2;
  ctx.globalAlpha = fadeIn;
  
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + time;
    const endX = x + Math.cos(angle) * radius * pulse;
    const endY = y + Math.sin(angle) * radius * pulse;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
  
  // Center
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.4);
  gradient.addColorStop(0, colors.fill);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.globalAlpha = fadeIn * 0.6;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * Draw trap marker
 */
export function drawTrap(ctx: CanvasRenderingContext2D, x: number, y: number, fadeIn: number): void {
  const colors = ABILITY_COLORS.trap;
  const size = 12;
  
  // Warning triangle
  ctx.fillStyle = colors.fill;
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 2;
  ctx.globalAlpha = fadeIn;
  
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y + size * 0.7);
  ctx.lineTo(x - size, y + size * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Exclamation
  ctx.fillStyle = colors.stroke;
  ctx.font = 'bold 10px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', x, y);
  ctx.globalAlpha = 1;
}

/**
 * Draw movement dash/teleport
 */
export function drawMovement(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, fadeIn: number): void {
  const colors = ABILITY_COLORS.movement;
  
  // Trail
  const gradient = ctx.createLinearGradient(fromX, fromY, toX, toY);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(1, colors.stroke);
  
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.globalAlpha = fadeIn * 0.8;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // End burst
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = fadeIn * 0.5;
  ctx.beginPath();
  ctx.arc(toX, toY, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * Draw arrow from source to target
 */
export function drawAbilityArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  fadeIn: number
): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headLen = 14;
  
  // Gradient line
  const gradient = ctx.createLinearGradient(fromX, fromY, toX, toY);
  gradient.addColorStop(0, `${color}33`);
  gradient.addColorStop(1, color);
  
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.globalAlpha = fadeIn;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Arrowhead
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * Main ability render dispatcher
 */
export function renderAbility(
  visual: VisualType,
  ctx: RenderContext
): void {
  const { ctx: context, x, y, fromX = x, fromY = y, radius = 40, fadeIn, time } = ctx;
  
  switch (visual) {
    case 'smoke':
      drawSmoke(context, x, y, radius, fadeIn);
      break;
    case 'flash':
      drawFlash(context, x, y, fromX, fromY, fadeIn);
      break;
    case 'molly':
      drawMolly(context, x, y, radius, fadeIn, time);
      break;
    case 'recon':
      drawRecon(context, x, y, radius, fadeIn, time);
      break;
    case 'wall':
      drawWall(context, fromX, fromY, x, y, fadeIn);
      break;
    case 'stun':
      drawStun(context, x, y, radius, fadeIn, time);
      break;
    case 'trap':
      drawTrap(context, x, y, fadeIn);
      break;
    case 'movement':
      drawMovement(context, fromX, fromY, x, y, fadeIn);
      break;
  }
}
