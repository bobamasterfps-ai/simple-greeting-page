/**
 * Canvas Strategy Renderer - Visual Strategy Engine
 * 
 * Features:
 * - Normalized coordinates (0-1) clamped to map bounds
 * - Proper ability visuals (no white circles)
 * - Fast animation (12-15s default)
 * - Site labels locked to map
 * - Watermark branding
 * - Stream Mode, Eco Mode, Counter-Strat toggle
 * - Voice narrator
 * - Download animation
 */
import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AGENTS, MAPS, Agent } from '@/lib/valorantData';
import { getMapConfig } from '@/lib/mapConfig';
import { StrategyData, TimelineStep, getVisualType, VisualType } from '@/lib/strategyTypes';
import { renderAbility, drawAbilityArrow } from '@/lib/abilityRenderer';
import { recordCanvas, downloadBlob, isRecordingSupported } from '@/lib/canvasRecorder';
import { useVoiceNarrator, generateVoiceScript, formatChatCallouts } from '@/hooks/useVoiceNarrator';
import { getRankSpeed, Rank } from '@/lib/rankModifiers';
import { 
  getVectorGeometry, 
  normalizeVec2, 
  clampVec2, 
  transformForSide,
  snapToWalkable,
  processPosition,
  getPlayableArea,
  clamp01
} from '@/lib/mapGeometry';
import { 
  normalizedToCanvas, 
  normalizedRadiusToCanvas,
  createBoundsFromSize,
  CanvasBounds 
} from '@/lib/canvasPositioning';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Play, Pause, SkipForward, RotateCcw, Copy, Check, Maximize2, X, 
  Download, Volume2, VolumeX, Monitor, DollarSign, Shield, Save, Loader2, MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  strategy: StrategyData;
  selectedAgents: Agent[];
  mapName: string;
  rank?: Rank;
  isFullscreen?: boolean;
  onClose?: () => void;
  onOpenFullscreen?: () => void;
  onSave?: () => void;
  canSave?: boolean;
}

export interface CanvasRendererRef {
  getCanvas: () => HTMLCanvasElement | null;
  getCurrentTime: () => number;
}

// Speed multiplier for faster animation
const DEFAULT_SPEED = 1.5;
const DEFAULT_DURATION = 15;

// Image cache
const imageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

export const CanvasStrategyRenderer = forwardRef<CanvasRendererRef, Props>(({
  strategy,
  selectedAgents,
  mapName,
  rank = 'Diamond',
  isFullscreen = false,
  onClose,
  onOpenFullscreen,
  onSave,
  canSave = false,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Mode toggles
  const [streamMode, setStreamMode] = useState(false);
  const [ecoMode, setEcoMode] = useState(false);
  const [showCounterStrat, setShowCounterStrat] = useState(false);
  const [showSiteLabels, setShowSiteLabels] = useState(false); // OFF by default - maps are pure geometry
  
  // Voice narrator
  const { speak, stop: stopVoice, isSpeaking, language, setLanguage, isSupported: voiceSupported } = useVoiceNarrator();
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const mapData = MAPS.find(m => m.name.toLowerCase() === mapName.toLowerCase());
  const mapConfig = getMapConfig(mapName);
  const mapImageSrc = mapConfig?.image || mapData?.displayIcon;
  const duration = Math.min(strategy.duration || DEFAULT_DURATION, 20);
  
  // Speed based on rank and mode
  const speedMultiplier = streamMode ? 0.8 : getRankSpeed(rank) * DEFAULT_SPEED;

  // Expose canvas ref
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    getCurrentTime: () => currentTime,
  }));

  // Get agent data
  const getAgent = useCallback((name: string): Agent | undefined => {
    return selectedAgents.find(a => a.name.toLowerCase() === name.toLowerCase()) ||
           AGENTS.find(a => a.name.toLowerCase() === name.toLowerCase());
  }, [selectedAgents]);

  // Get ability icon URL
  const getAbilityIcon = useCallback((agentName: string, abilitySlot?: string, abilityName?: string): string | undefined => {
    const agent = getAgent(agentName);
    if (!agent) return undefined;
    
    if (abilitySlot) {
      const ability = agent.abilities.find(a => a.slot === abilitySlot);
      return ability?.icon;
    }
    if (abilityName) {
      const ability = agent.abilities.find(a => 
        a.name.toLowerCase() === abilityName.toLowerCase()
      );
      return ability?.icon;
    }
    return undefined;
  }, [getAgent]);

  // Filter steps for eco mode (remove expensive abilities)
  const getActiveSteps = useCallback(() => {
    if (!ecoMode) return strategy.steps;
    
    // In eco mode, filter out ultimate abilities and reduce utility
    return strategy.steps.filter(step => {
      if (step.abilitySlot === 'Ultimate') return false;
      // Keep only essential utility
      if (step.type === 'ability' && step.visual) {
        const essentialVisuals: VisualType[] = ['smoke', 'flash'];
        return essentialVisuals.includes(step.visual);
      }
      return true;
    });
  }, [strategy.steps, ecoMode]);

  // Preload images
  useEffect(() => {
    const loadAllImages = async () => {
      const urls: string[] = [];
      
      if (mapImageSrc) urls.push(mapImageSrc);
      selectedAgents.forEach(a => urls.push(a.icon));
      AGENTS.forEach(a => urls.push(a.icon));
      
      strategy.steps.forEach(step => {
        if (step.ability && step.abilitySlot) {
          const icon = getAbilityIcon(step.agent, step.abilitySlot, step.ability);
          if (icon) urls.push(icon);
        }
      });

      try {
        await Promise.all(urls.map(url => loadImage(url)));
        setImagesLoaded(true);
      } catch (e) {
        console.error('Failed to load some images', e);
        setImagesLoaded(true);
      }
    };

    loadAllImages();
  }, [mapImageSrc, selectedAgents, strategy.steps, getAbilityIcon]);

  // Main draw function
  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded || !mapConfig || !mapImageSrc) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    
    // Create canvas bounds for normalized → pixel conversion
    const bounds: CanvasBounds = createBoundsFromSize(w, h);
    
    // Icon size scales to map width (3.5% default, 4.5% in stream mode)
    const ICON_SIZE = w * (streamMode ? 0.045 : 0.035);
    const LINE_WIDTH = streamMode ? 3 : 2;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw map background
    const mapImg = imageCache.get(mapImageSrc);
    if (mapImg) {
      ctx.drawImage(mapImg, 0, 0, w, h);
      
      // Darken overlay for better visibility
      ctx.fillStyle = 'rgba(10, 12, 20, 0.25)';
      ctx.fillRect(0, 0, w, h);
    }

    // Draw site labels ONLY if enabled (OFF by default)
    if (showSiteLabels && mapConfig.sites) {
      const fontSize = streamMode ? 42 : 32;
      ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      Object.entries(mapConfig.sites).forEach(([siteName, sitePos]) => {
        // Use geometry-aware position (already normalized 0-1)
        const normalized = clampVec2(normalizeVec2(sitePos));
        const canvasPos = normalizedToCanvas(normalized, bounds);
        
        // Subtle glow background
        const gradient = ctx.createRadialGradient(
          canvasPos.x, canvasPos.y, 0,
          canvasPos.x, canvasPos.y, 40
        );
        gradient.addColorStop(0, 'rgba(76, 201, 240, 0.25)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(canvasPos.x, canvasPos.y, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Label text with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(siteName, canvasPos.x, canvasPos.y);
        ctx.shadowBlur = 0;
      });
    }

    // Get playable area for geometry-aware snapping
    const playableArea = getPlayableArea(mapName);

    // Process steps and track agent positions with geometry-aware snapping
    // Each agent starts at a unique offset position to prevent clustering
    const activeSteps = getActiveSteps().filter(step => step.t <= time);
    const agentPositions = new Map<string, { x: number; y: number }>();
    const agentIndex = new Map<string, number>();
    
    // Assign index to each agent for spacing (uses diamond pattern)
    selectedAgents.forEach((agent, idx) => {
      agentIndex.set(agent.name, idx);
    });
    
    // Spread patterns for 5 agents (diamond formation)
    const spreadPatterns = [
      { x: 0, y: 0 },        // Center
      { x: -0.05, y: 0 },    // Left
      { x: 0.05, y: 0 },     // Right  
      { x: 0, y: -0.05 },    // Up
      { x: 0, y: 0.05 },     // Down
    ];

    activeSteps.forEach(step => {
      // Apply agent-specific offset to prevent stacking
      const idx = agentIndex.get(step.agent) || 0;
      const spreadOffset = spreadPatterns[idx % spreadPatterns.length];
      
      // Use geometry-aware normalization and snapping
      let normalizedFrom = step.from 
        ? normalizeVec2(step.from)
        : null;
      
      if (step.type === 'spawn' && normalizedFrom) {
        // Apply spread offset only at spawn (diamond pattern)
        const spread = {
          x: clamp01(normalizedFrom.x + spreadOffset.x),
          y: clamp01(normalizedFrom.y + spreadOffset.y)
        };
        agentPositions.set(step.agent, clampVec2(snapToWalkable(spread, playableArea)));
      } else if (step.type === 'move' && step.path && step.path.length > 0) {
        const stepDuration = 2.5;
        const progress = clamp01((time - step.t) / stepDuration);
        const pathIdx = Math.floor(progress * (step.path.length - 1));
        const pos = step.path[Math.min(pathIdx, step.path.length - 1)];
        // Snap path positions to walkable area - no spread needed for paths
        const normalizedPos = clampVec2(snapToWalkable(normalizeVec2(pos), playableArea));
        agentPositions.set(step.agent, normalizedPos);
      } else if (normalizedFrom) {
        // Apply slight offset for non-spawn positions too
        const spread = {
          x: clamp01(normalizedFrom.x + spreadOffset.x * 0.5),
          y: clamp01(normalizedFrom.y + spreadOffset.y * 0.5)
        };
        agentPositions.set(step.agent, clampVec2(snapToWalkable(spread, playableArea)));
      }
    });

    // Draw counter-strat overlay (defender positions)
    if (showCounterStrat && mapConfig.sites) {
      ctx.globalAlpha = 0.5;
      
      // Draw defender zones using geometry-aware positions
      const defenderZones = [
        { x: mapConfig.sites.A?.x || 0.75, y: (mapConfig.sites.A?.y || 0.25) + 0.1 },
        { x: mapConfig.sites.B?.x || 0.25, y: (mapConfig.sites.B?.y || 0.25) + 0.1 },
      ];
      
      defenderZones.forEach(zone => {
        const clamped = clampVec2(normalizeVec2(zone));
        const pos = normalizedToCanvas(clamped, bounds);
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 50, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Danger text
        ctx.font = 'bold 12px Inter';
        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
        ctx.textAlign = 'center';
        ctx.fillText('DEF', pos.x, pos.y);
      });
      
      ctx.globalAlpha = 1;
    }

    // Draw ability effects with STRICT normalized coordinate handling
    activeSteps.forEach(step => {
      if (step.type === 'ability' && step.to) {
        const visual: VisualType = step.visual || getVisualType(step.ability || '');
        
        // STEP 1: Normalize input coords (handle 0-100 OR 0-1 formats)
        const rawTo = step.to;
        const rawFrom = step.from || step.to;
        
        // Auto-detect and normalize: if > 1, assume 0-100 range
        const normalizeCoord = (v: number): number => {
          if (v > 1) return clamp01(v / 100);
          return clamp01(v);
        };
        
        const normTo = { x: normalizeCoord(rawTo.x), y: normalizeCoord(rawTo.y) };
        const normFrom = { x: normalizeCoord(rawFrom.x), y: normalizeCoord(rawFrom.y) };
        
        // STEP 2: Apply geometry snapping + bounds clamping
        const snappedTo = clampVec2(snapToWalkable(normTo, playableArea));
        const snappedFrom = clampVec2(snapToWalkable(normFrom, playableArea));
        
        // STEP 3: Convert normalized → canvas pixels
        const toCanvasPos = normalizedToCanvas(snappedTo, bounds);
        const fromCanvasPos = normalizedToCanvas(snappedFrom, bounds);
        
        const fadeIn = clamp01((time - step.t) / 0.4);
        
        // STEP 4: Handle radius normalization (0-1 expected, but handle legacy 1-100)
        let normalizedRadius = step.radius || 0.08; // Default 8% of map
        if (normalizedRadius > 1) {
          normalizedRadius = normalizedRadius / 100; // Convert old format
        }
        const radius = normalizedRadiusToCanvas(clamp01(normalizedRadius), bounds);

        renderAbility(visual, {
          ctx,
          x: toCanvasPos.x,
          y: toCanvasPos.y,
          fromX: fromCanvasPos.x,
          fromY: fromCanvasPos.y,
          radius,
          fadeIn,
          time,
        });
      }
    });

    // Draw ability arrows with strict normalization
    activeSteps.forEach(step => {
      if (step.type === 'ability' && step.from && step.to) {
        // Auto-normalize coords
        const normalizeCoord = (v: number): number => v > 1 ? clamp01(v / 100) : clamp01(v);
        
        const normFrom = { x: normalizeCoord(step.from.x), y: normalizeCoord(step.from.y) };
        const normTo = { x: normalizeCoord(step.to.x), y: normalizeCoord(step.to.y) };
        
        const snappedFrom = clampVec2(snapToWalkable(normFrom, playableArea));
        const snappedTo = clampVec2(snapToWalkable(normTo, playableArea));
        
        const fromCanvasPos = normalizedToCanvas(snappedFrom, bounds);
        const toCanvasPos = normalizedToCanvas(snappedTo, bounds);
        const fadeIn = clamp01((time - step.t) / 0.3);
        
        drawAbilityArrow(ctx, fromCanvasPos.x, fromCanvasPos.y, toCanvasPos.x, toCanvasPos.y, '#00ff88', fadeIn);

        // Draw ability icon at target (smaller, scaled to map)
        const icon = getAbilityIcon(step.agent, step.abilitySlot, step.ability);
        if (icon) {
          const abilityImg = imageCache.get(icon);
          if (abilityImg) {
            const abilityIconSize = w * 0.04; // 4% of map width
            ctx.globalAlpha = fadeIn;
            ctx.drawImage(abilityImg, toCanvasPos.x - abilityIconSize / 2, toCanvasPos.y - abilityIconSize / 2, abilityIconSize, abilityIconSize);
            ctx.globalAlpha = 1;
          }
        }
      }
    });

    // Draw movement paths with strict normalization
    activeSteps.forEach(step => {
      if (step.type === 'move' && step.path && step.path.length > 1) {
        const progress = clamp01((time - step.t) / 2.5);
        const normalizeCoord = (v: number): number => v > 1 ? clamp01(v / 100) : clamp01(v);
        
        ctx.beginPath();
        step.path.forEach((point, idx) => {
          const normalized = { x: normalizeCoord(point.x), y: normalizeCoord(point.y) };
          const snapped = clampVec2(snapToWalkable(normalized, playableArea));
          const canvasPos = normalizedToCanvas(snapped, bounds);
          
          if (idx === 0) ctx.moveTo(canvasPos.x, canvasPos.y);
          else ctx.lineTo(canvasPos.x, canvasPos.y);
        });
        
        ctx.strokeStyle = `rgba(0, 200, 255, ${0.6 * progress})`;
        ctx.lineWidth = LINE_WIDTH;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Draw agent icons (scaled to map - 3.5% or 4.5% in stream mode)
    agentPositions.forEach((pos, agentName) => {
      const agent = getAgent(agentName);
      if (!agent) return;

      const canvasPos = normalizedToCanvas(pos, bounds);

      // Team color ring
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, ICON_SIZE / 2 + 3, 0, Math.PI * 2);
      ctx.fillStyle = strategy.side === 'attack' 
        ? 'rgba(255, 70, 70, 0.95)' 
        : 'rgba(70, 170, 255, 0.95)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Agent icon
      const agentImg = imageCache.get(agent.icon);
      if (agentImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvasPos.x, canvasPos.y, ICON_SIZE / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(agentImg, canvasPos.x - ICON_SIZE / 2, canvasPos.y - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE);
        ctx.restore();
      }
    });

    // Timeline bar
    const timelineY = h - 35;
    const timelineWidth = w - 80;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(30, timelineY - 10, w - 60, 20);
    
    ctx.fillStyle = 'rgba(76, 201, 240, 0.9)';
    ctx.fillRect(40, timelineY - 5, (time / duration) * timelineWidth, 10);
    
    ctx.font = '12px Inter, system-ui';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'left';
    ctx.fillText(`${time.toFixed(1)}s`, 40, timelineY + 20);
    ctx.textAlign = 'right';
    ctx.fillText(`${duration}s`, w - 40, timelineY + 20);

    // Mode badges
    let badgeX = 20;
    ctx.font = 'bold 11px Inter';
    if (streamMode) {
      ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
      ctx.fillRect(badgeX, 15, 60, 20);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText('STREAM', badgeX + 8, 28);
      badgeX += 70;
    }
    if (ecoMode) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
      ctx.fillRect(badgeX, 15, 40, 20);
      ctx.fillStyle = '#fff';
      ctx.fillText('ECO', badgeX + 8, 28);
      badgeX += 50;
    }
    if (showCounterStrat) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.fillRect(badgeX, 15, 70, 20);
      ctx.fillStyle = '#fff';
      ctx.fillText('COUNTER', badgeX + 6, 28);
    }

    // Rank badge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(w - 90, 15, 70, 20);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(rank, w - 25, 28);

    // Watermark - ALWAYS ON
    ctx.globalAlpha = 0.6;
    ctx.font = 'bold 14px Inter, system-ui';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText('Spikes Valorant • Made by BoBaMASter FPS', w - 20, h - 50);
    ctx.globalAlpha = 1;

  }, [mapConfig, mapImageSrc, strategy, getAgent, getAbilityIcon, imagesLoaded, duration, 
      streamMode, ecoMode, showCounterStrat, showSiteLabels, rank, getActiveSteps]);

  // Animation loop with speed multiplier
  useEffect(() => {
    if (!isPlaying) return;

    startTimeRef.current = performance.now() - (currentTime / speedMultiplier) * 1000;

    const animate = (timestamp: number) => {
      const elapsed = ((timestamp - startTimeRef.current) / 1000) * speedMultiplier;
      
      if (elapsed >= duration) {
        setCurrentTime(0);
        setIsPlaying(false);
        return;
      }
      
      setCurrentTime(elapsed);
      draw(elapsed);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, draw, duration, currentTime, speedMultiplier]);

  // Draw when paused
  useEffect(() => {
    if (!isPlaying) {
      draw(currentTime);
    }
  }, [currentTime, isPlaying, draw, imagesLoaded]);

  // Voice narration
  useEffect(() => {
    if (voiceEnabled && isPlaying && currentTime < 0.5) {
      const script = generateVoiceScript(strategy.steps, strategy.site, language);
      speak(script);
    }
  }, [voiceEnabled, isPlaying, strategy, speak, currentTime, language]);

  const handleTimeChange = (value: number[]) => {
    setCurrentTime(value[0]);
    setIsPlaying(false);
  };

  // Format and copy chat callouts with brackets
  const copyChat = () => {
    const formatted = formatChatCallouts(strategy.steps, strategy.site, strategy.side);
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    toast.success('Callouts copied! Paste in Valorant chat');
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Toggle language between EN and HI
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
    toast.success(language === 'en' ? 'Hindi voice selected' : 'English voice selected');
  };

  const stepForward = () => {
    const steps = getActiveSteps();
    const nextStep = steps.find(s => s.t > currentTime);
    if (nextStep) {
      setCurrentTime(nextStep.t);
    } else {
      setCurrentTime(0);
    }
    setIsPlaying(false);
  };

  const reset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
    stopVoice();
  };

  const handleDownload = async () => {
    if (!canvasRef.current || !isRecordingSupported()) {
      toast.error('Recording not supported in this browser');
      return;
    }

    setIsRecording(true);
    toast.info('Recording animation...');

    try {
      // Reset and play for recording
      setCurrentTime(0);
      setIsPlaying(true);

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, (duration / speedMultiplier) * 1000 + 500));

      setIsPlaying(false);
      setCurrentTime(0);

      // Record the animation
      setIsPlaying(true);
      const blob = await recordCanvas(canvasRef.current, {
        duration: (duration / speedMultiplier) * 1000,
      });
      setIsPlaying(false);

      // Download
      const filename = `${strategy.map}_${strategy.site}_${strategy.side}_strategy.webm`;
      downloadBlob(blob, filename);
      toast.success('Animation downloaded!');
    } catch (e) {
      console.error('Recording failed:', e);
      toast.error('Failed to record animation');
    } finally {
      setIsRecording(false);
      setIsPlaying(false);
    }
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      stopVoice();
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
    }
  };

  const getCurrentStep = (): TimelineStep | undefined => {
    return [...getActiveSteps()].reverse().find(s => s.t <= currentTime);
  };

  const currentStep = getCurrentStep();
  const canvasSize = isFullscreen ? 800 : 600;

  return (
    <div className={`flex ${isFullscreen ? 'flex-col h-full' : 'flex-col'} gap-4`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold text-primary">{mapName.toUpperCase()}</span>
          <span className={`px-3 py-1 rounded text-sm font-bold ${
            strategy.side === 'attack' 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-blue-500/20 text-blue-400'
          }`}>
            {strategy.side.toUpperCase()}
          </span>
          <span className="text-muted-foreground">→ {strategy.site} Site</span>
          <Badge variant="outline">{rank}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mode toggles */}
          <Button 
            variant={streamMode ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setStreamMode(!streamMode)}
            title="Stream Mode - Bigger icons, slower animation"
          >
            <Monitor className="w-4 h-4" />
          </Button>
          <Button 
            variant={ecoMode ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setEcoMode(!ecoMode)}
            title="Eco Mode - Reduced utility"
            className={ecoMode ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <DollarSign className="w-4 h-4" />
          </Button>
          <Button 
            variant={showCounterStrat ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setShowCounterStrat(!showCounterStrat)}
            title="Counter-Strat - Show defender positions"
            className={showCounterStrat ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            <Shield className="w-4 h-4" />
          </Button>
          <Button 
            variant={showSiteLabels ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setShowSiteLabels(!showSiteLabels)}
            title="Show A/B/C site labels"
            className={showSiteLabels ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
          >
            <MapPin className="w-4 h-4" />
          </Button>
          
          {/* Voice controls with language toggle */}
          {voiceSupported && (
            <div className="flex items-center gap-1">
              <Button 
                variant={voiceEnabled ? 'default' : 'outline'} 
                size="sm" 
                onClick={toggleVoice}
                title="Toggle voice narration"
                className={voiceEnabled ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleLanguage}
                title={`Switch to ${language === 'en' ? 'Hindi' : 'English'}`}
                className="px-2 font-bold text-xs"
              >
                {language === 'en' ? 'EN' : 'HI'}
              </Button>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyChat}
            className="gap-2"
            title="Copy callouts for Valorant chat"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy
          </Button>
          
          {canSave && onSave && (
            <Button variant="outline" size="sm" onClick={onSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            disabled={isRecording}
          >
            {isRecording ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </Button>
          
          {!isFullscreen && onOpenFullscreen && (
            <Button variant="outline" size="sm" onClick={onOpenFullscreen}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          )}
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className={`flex ${isFullscreen ? 'flex-1' : ''} gap-4 p-4`}>
        {/* Canvas */}
        <div className={`relative ${isFullscreen ? 'flex-1' : ''}`}>
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            className="rounded-lg border border-border bg-background"
            style={{ width: '100%', aspectRatio: '1' }}
          />

          {/* Agent legend */}
          <div className="absolute bottom-20 left-4 flex gap-2 bg-background/90 backdrop-blur rounded-lg p-2">
            {selectedAgents.slice(0, 5).map(agent => (
              <div key={agent.id} className="flex items-center gap-1">
                <img src={agent.icon} alt={agent.name} className="w-6 h-6 rounded-full" />
                <span className="text-xs text-muted-foreground hidden sm:inline">{agent.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls panel */}
        <div className={`${isFullscreen ? 'w-96' : 'w-72'} flex flex-col gap-4`}>
          {/* Playback controls */}
          <div className="glass rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant={isPlaying ? 'secondary' : 'default'}
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={isRecording}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={stepForward} disabled={isRecording}>
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={reset} disabled={isRecording}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground ml-auto">
                {currentTime.toFixed(1)}s / {duration}s
              </span>
            </div>

            <Slider
              value={[currentTime]}
              min={0}
              max={duration}
              step={0.1}
              onValueChange={handleTimeChange}
              className="w-full"
              disabled={isRecording}
            />
          </div>

          {/* Current step info */}
          {currentStep && (
            <div className="glass rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2">Current Action</h4>
              <div className="flex items-center gap-3">
                {(() => {
                  const agent = getAgent(currentStep.agent);
                  return agent ? (
                    <img src={agent.icon} alt={agent.name} className="w-10 h-10 rounded-full" />
                  ) : null;
                })()}
                <div>
                  <p className="font-medium">{currentStep.agent}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentStep.ability || currentStep.type}
                  </p>
                </div>
                <span className="ml-auto text-primary text-sm font-mono">
                  {currentStep.t.toFixed(1)}s
                </span>
              </div>
            </div>
          )}

          {/* Timeline steps */}
          <div className="glass rounded-lg p-4 flex-1 overflow-auto max-h-64">
            <h4 className="text-sm font-medium mb-3">Timeline</h4>
            <div className="flex flex-col gap-2">
              {getActiveSteps().map((step, idx) => {
                const isActive = step.t <= currentTime;
                const isCurrent = currentStep === step;
                const agent = getAgent(step.agent);
                
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentTime(step.t);
                      setIsPlaying(false);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                      isCurrent
                        ? 'border-primary bg-primary/10'
                        : isActive
                        ? 'border-border bg-secondary/30 opacity-70'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCurrent ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                    }`}>
                      {step.t}s
                    </span>
                    {agent && (
                      <img src={agent.icon} alt={agent.name} className="w-6 h-6 rounded-full" />
                    )}
                    <span className="text-sm truncate flex-1">
                      {step.ability || step.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat callouts - simple one-liner */}
          <div className="glass rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-medium text-muted-foreground">In-Game Comms</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyChat}
                className="h-5 px-2 text-xs"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <p className="text-xs text-foreground bg-secondary/50 rounded px-2 py-1.5 font-mono leading-relaxed">
              {formatChatCallouts(strategy.steps, strategy.site, strategy.side)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

CanvasStrategyRenderer.displayName = 'CanvasStrategyRenderer';
