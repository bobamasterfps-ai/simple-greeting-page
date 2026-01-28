/**
 * Shorts Generator - Create viral 9:16 vertical videos from strategies
 * Perfect for YouTube Shorts, Instagram Reels, TikTok
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStrategies } from '@/hooks/useStrategies';
import { MAPS } from '@/lib/valorantData';
import { getMapConfig, toCanvasCoords, normalizePosition, clamp } from '@/lib/mapConfig';
import { renderAbility } from '@/lib/abilityRenderer';
import { recordCanvas, downloadBlob, isRecordingSupported } from '@/lib/canvasRecorder';
import { StrategyData, TimelineStep, getVisualType } from '@/lib/strategyTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Video, Download, Loader2, Play, Pause, Volume2, VolumeX, Sparkles 
} from 'lucide-react';
import { toast } from 'sonner';

const SHORTS_WIDTH = 720;
const SHORTS_HEIGHT = 1280;
const SHORTS_DURATION = 9000; // 9 seconds

export function ShortsGeneratorPage() {
  const { user } = useAuth();
  const { strategies } = useStrategies();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [includeVoice, setIncludeVoice] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Load strategy data when selected
  useEffect(() => {
    if (!selectedStrategyId || !strategies) return;
    
    const found = strategies.find(s => s.id === selectedStrategyId);
    if (found && found.json_data) {
      try {
        const parsed = typeof found.json_data === 'string' 
          ? JSON.parse(found.json_data) 
          : found.json_data;
        setSelectedStrategy(parsed as StrategyData);
      } catch (e) {
        console.error('Failed to parse strategy:', e);
      }
    }
  }, [selectedStrategyId, strategies]);

  // Draw function for shorts canvas
  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedStrategy) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = SHORTS_WIDTH;
    const h = SHORTS_HEIGHT;
    
    // Clear
    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, w, h);

    // Get map config
    const mapConfig = getMapConfig(selectedStrategy.map);
    if (!mapConfig) return;

    // Draw map (zoomed and centered on site)
    const mapY = 200;
    const mapSize = 600;
    
    ctx.save();
    ctx.translate(w / 2, mapY + mapSize / 2);
    ctx.scale(1.4, 1.4); // Zoom for shorts
    
    // Draw site glow
    const sitePos = mapConfig.sites[selectedStrategy.site];
    if (sitePos) {
      const gradient = ctx.createRadialGradient(
        (sitePos.x - 0.5) * mapSize, (sitePos.y - 0.5) * mapSize, 0,
        (sitePos.x - 0.5) * mapSize, (sitePos.y - 0.5) * mapSize, 100
      );
      gradient.addColorStop(0, 'rgba(76, 201, 240, 0.4)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(-mapSize / 2, -mapSize / 2, mapSize, mapSize);
    }
    
    // Draw ability effects
    const duration = selectedStrategy.duration || 9;
    const activeSteps = selectedStrategy.steps.filter(step => step.t <= time);
    
    activeSteps.forEach(step => {
      if (step.type === 'ability' && step.to) {
        const visual = step.visual || getVisualType(step.ability || '');
        const normalizedTo = normalizePosition(step.to, mapConfig.bounds);
        const toCanvas = {
          x: (normalizedTo.x - 0.5) * mapSize,
          y: (normalizedTo.y - 0.5) * mapSize,
        };
        const fadeIn = clamp((time - step.t) / 0.3, 0, 1);
        const radius = ((step.radius || 8) / 100) * mapSize * 1.5;

        renderAbility(visual, {
          ctx,
          x: toCanvas.x,
          y: toCanvas.y,
          radius,
          fadeIn,
          time,
        });
      }
    });
    
    ctx.restore();

    // Title area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, w, 180);
    
    ctx.font = 'bold 48px Inter, system-ui';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`${selectedStrategy.map} ${selectedStrategy.site}`, w / 2, 80);
    
    ctx.font = '28px Inter, system-ui';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(selectedStrategy.side.toUpperCase(), w / 2, 130);

    // Timeline at bottom
    const timelineY = h - 100;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, h - 160, w, 160);
    
    // Progress bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(40, timelineY, w - 80, 8);
    ctx.fillStyle = 'rgba(76, 201, 240, 0.9)';
    ctx.fillRect(40, timelineY, (time / duration) * (w - 80), 8);

    // Current step text
    const currentStep = activeSteps[activeSteps.length - 1];
    if (currentStep) {
      ctx.font = 'bold 32px Inter';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      const stepText = currentStep.type === 'ability' 
        ? `${currentStep.agent}: ${currentStep.ability}`
        : `${currentStep.agent} moving`;
      ctx.fillText(stepText, w / 2, h - 50);
    }

    // Watermark
    ctx.globalAlpha = 0.7;
    ctx.font = 'bold 20px Inter';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Spikes Valorant • BoBaMASter FPS', w / 2, h - 20);
    ctx.globalAlpha = 1;
  }, [selectedStrategy]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !selectedStrategy) return;

    const duration = selectedStrategy.duration || 9;
    const startTime = performance.now() - currentTime * 1000;

    const animate = (timestamp: number) => {
      const elapsed = (timestamp - startTime) / 1000;
      
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
  }, [isPlaying, selectedStrategy, draw, currentTime]);

  // Initial draw
  useEffect(() => {
    if (selectedStrategy && !isPlaying) {
      draw(currentTime);
    }
  }, [selectedStrategy, currentTime, draw, isPlaying]);

  const handleRecord = async () => {
    if (!canvasRef.current || !selectedStrategy) return;
    
    if (!isRecordingSupported()) {
      toast.error('Recording not supported in this browser');
      return;
    }
    
    setIsRecording(true);
    setCurrentTime(0);
    setIsPlaying(true);
    
    try {
      const blob = await recordCanvas(canvasRef.current, { duration: SHORTS_DURATION });
      downloadBlob(blob, `${selectedStrategy.map}_${selectedStrategy.site}_short.webm`);
      toast.success('Short downloaded!');
    } catch (e) {
      console.error('Recording failed:', e);
      toast.error('Recording failed');
    } finally {
      setIsRecording(false);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentTime >= (selectedStrategy?.duration || 9)) {
        setCurrentTime(0);
      }
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            Shorts Generator
          </h2>
          <p className="text-sm text-muted-foreground">
            Create viral 9:16 videos for Shorts, Reels, TikTok
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Strategy Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select Strategy</label>
              <Select value={selectedStrategyId} onValueChange={setSelectedStrategyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a strategy" />
                </SelectTrigger>
                <SelectContent>
                  {strategies?.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.map} {s.site} ({s.side})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {includeVoice ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="text-sm">Include Voice</span>
              </div>
              <Switch checked={includeVoice} onCheckedChange={setIncludeVoice} />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4">
              <Button 
                className="w-full" 
                onClick={togglePlay}
                disabled={!selectedStrategy}
              >
                {isPlaying ? (
                  <><Pause className="w-4 h-4 mr-2" /> Pause</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" /> Preview</>
                )}
              </Button>
              
              <Button 
                className="w-full" 
                variant="secondary"
                onClick={handleRecord}
                disabled={!selectedStrategy || isRecording}
              >
                {isRecording ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Recording...</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" /> Download Short</>
                )}
              </Button>
            </div>

            {/* Info */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Generated shorts are 720x1280 (9:16 ratio), 9 seconds long, 
                with watermark. Perfect for YouTube Shorts, Instagram Reels, and TikTok.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Preview</CardTitle>
              {selectedStrategy && (
                <Badge variant="outline">
                  {currentTime.toFixed(1)}s / {selectedStrategy.duration || 9}s
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="relative bg-black rounded-xl overflow-hidden" style={{ width: 360, height: 640 }}>
              <canvas
                ref={canvasRef}
                width={SHORTS_WIDTH}
                height={SHORTS_HEIGHT}
                style={{ width: 360, height: 640 }}
                className="rounded-xl"
              />
              
              {!selectedStrategy && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a strategy to preview
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
