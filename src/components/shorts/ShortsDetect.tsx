import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Loader2, Volume2, Sparkles, RefreshCw,
  Zap, Eye, ArrowRight, CheckCircle2, Camera, Waves, Target
} from 'lucide-react';
import { clipDBManager } from '@/lib/clipIndexedDB';
import type { GameEvent } from '@/types/clipTypes';
import type { FusedEvent } from '@/lib/eventFusionEngine';
import { 
  unifiedEventDetector, 
  type DetectionProgress, 
  type DetectionResult 
} from '@/lib/unifiedEventDetector';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShortsDetectProps {
  videoId: string;
  videoUrl: string;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  onEventsDetected: (events: GameEvent[]) => void;
  detectedEvents: GameEvent[];
}

export function ShortsDetect({ 
  videoId, 
  videoUrl, 
  sensitivity,
  onSensitivityChange,
  onEventsDetected,
  detectedEvents
}: ShortsDetectProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [detecting, setDetecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Detection toggles
  const [enableVisual, setEnableVisual] = useState(true);
  const [enableFacecam, setEnableFacecam] = useState(true);
  
  // Stats from last detection
  const [detectionStats, setDetectionStats] = useState<DetectionResult['stats'] | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const detectHighlights = useCallback(async () => {
    if (detecting) return;

    setDetecting(true);
    setProgress(0);
    setProgressStage('Initializing...');
    
    try {
      toast.info('Starting multi-source fusion detection...', {
        description: `Audio${enableVisual ? ' + Visual' : ''}${enableFacecam ? ' + Facecam' : ''}`
      });

      // Fetch video blob from IndexedDB
      const videoBlob = await clipDBManager.getVideo(videoId);
      if (!videoBlob) {
        throw new Error('Video not found in storage');
      }

      // Configure detector
      unifiedEventDetector.setConfig({
        audioSensitivity: sensitivity,
        enableVisual,
        enableFacecam,
        mode: 'FLEX', // Default, will be configurable
      });

      // Run unified detection
      const result = await unifiedEventDetector.detectAll(
        videoBlob,
        (prog: DetectionProgress) => {
          setProgress(prog.progress);
          setProgressStage(prog.message);
        }
      );

      setDetectionStats(result.stats);
      
      // Convert FusedEvents to GameEvents for downstream compatibility
      const gameEvents: GameEvent[] = result.events.map(e => ({
        id: e.id,
        timestamp: e.timestamp,
        type: e.type,
        score: e.score,
        confidence: e.confidence,
        audioSpike: e.sources.includes('audio'),
        visualDetected: e.sources.includes('visual'),
        facecamDetected: e.sources.includes('facecam'),
      }));

      onEventsDetected(gameEvents);
      
      if (gameEvents.length > 0) {
        toast.success(`Found ${gameEvents.length} highlights!`, {
          description: `${result.stats.fusedEvents} fused from ${result.stats.audioEvents} audio, ${result.stats.visualEvents} visual, ${result.stats.facecamEvents} facecam events`
        });
      } else {
        toast.info('No highlights detected', {
          description: 'Try increasing sensitivity or check audio levels'
        });
      }

    } catch (error) {
      console.error('Detection failed:', error);
      toast.error('Detection failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setDetecting(false);
    }
  }, [detecting, sensitivity, enableVisual, enableFacecam, videoId, onEventsDetected]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.playbackRate = 1;
      video.play();
    } else {
      video.pause();
    }
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
  };

  const seekToEvent = (event: GameEvent) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = event.timestamp / 1000;
    video.play();
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Video Preview */}
      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            crossOrigin="anonymous"
            onClick={togglePlayPause}
          />
          
          {/* Play/Pause overlay */}
          {!detecting && (
            <button
              onClick={togglePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
            >
              <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
                {isPlaying ? (
                  <Pause className="w-12 h-12 text-white" />
                ) : (
                  <Play className="w-12 h-12 text-white" fill="white" />
                )}
              </div>
            </button>
          )}

          {/* Event markers on timeline */}
          {detectedEvents.length > 0 && duration > 0 && (
            <div className="absolute bottom-16 left-4 right-4 h-1 bg-white/20 rounded">
              {detectedEvents.map((event) => (
                <button
                  key={event.id}
                  className={cn(
                    "absolute w-2 h-3 -top-1 rounded-sm transform -translate-x-1/2 cursor-pointer hover:scale-150 transition-transform",
                    event.type === 'ACE' || event.type === 'CLUTCH' 
                      ? 'bg-accent' 
                      : event.type === '4K' || event.type === 'TRIPLE'
                      ? 'bg-primary'
                      : 'bg-foreground/70'
                  )}
                  style={{ left: `${(event.timestamp / 1000 / duration) * 100}%` }}
                  onClick={() => seekToEvent(event)}
                  title={`${event.type} at ${formatTime(event.timestamp / 1000)}`}
                />
              ))}
            </div>
          )}

          {/* Detection overlay */}
          {detecting && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="relative mb-6">
                  <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="text-white font-semibold text-lg mb-2">Multi-Source Fusion</p>
                <p className="text-white/80 text-sm mb-4">{progressStage}</p>
                <Progress value={progress} className="h-2 mb-2" />
                <div className="flex justify-center gap-4 text-xs text-white/60">
                    <span className={cn(
                    "flex items-center gap-1",
                    progress > 0 ? "text-primary" : ""
                  )}>
                    <Waves className="w-3 h-3" /> Audio
                  </span>
                  {enableVisual && (
                    <span className={cn(
                      "flex items-center gap-1",
                      progress > 33 ? "text-primary" : ""
                    )}>
                      <Eye className="w-3 h-3" /> Visual
                    </span>
                  )}
                  {enableFacecam && (
                    <span className={cn(
                      "flex items-center gap-1",
                      progress > 66 ? "text-primary" : ""
                    )}>
                      <Camera className="w-3 h-3" /> Facecam
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video controls */}
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlayPause}
              disabled={detecting}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <div className="flex-1">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={([v]) => seekTo(v)}
                disabled={detecting}
              />
            </div>
            
            <span className="text-sm text-muted-foreground font-mono min-w-[80px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Detection Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Full Fusion Detection
          </CardTitle>
          <CardDescription>
            Combine audio, visual, and facecam analysis for maximum accuracy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Audio Sensitivity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-primary" />
                Audio Sensitivity
              </Label>
              <span className="text-sm text-muted-foreground font-mono">
                {Math.round(sensitivity * 100)}%
              </span>
            </div>
            <Slider
              value={[sensitivity]}
              min={0.1}
              max={1}
              step={0.05}
              onValueChange={([v]) => onSensitivityChange(v)}
            />
            <p className="text-xs text-muted-foreground">
              Detects volume spikes from kills, abilities, and reactions
            </p>
          </div>

          {/* Visual Detection Toggle */}
          <div className="flex items-center justify-between py-2 border-t border-border pt-4">
            <div>
              <Label className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-accent-foreground" />
                Visual Kill Feed Detection
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Monitors top-right corner for kill feed changes
              </p>
            </div>
            <Switch
              checked={enableVisual}
              onCheckedChange={setEnableVisual}
            />
          </div>

          {/* Facecam Detection Toggle */}
          <div className="flex items-center justify-between py-2 border-t border-border pt-4">
            <div>
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-secondary-foreground" />
                Facecam Reaction Detection
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Detects reactions in bottom-left corner (streamers)
              </p>
            </div>
            <Switch
              checked={enableFacecam}
              onCheckedChange={setEnableFacecam}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex gap-4">
        <Button
          onClick={detectHighlights}
          disabled={detecting}
          size="lg"
          className="flex-1 gap-2"
        >
          {detecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : detectedEvents.length > 0 ? (
            <>
              <RefreshCw className="w-5 h-5" />
              Re-analyze
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Find Highlights
            </>
          )}
        </Button>
      </div>

      {/* Detection Stats */}
      {detectionStats && (
        <Card className="border-muted bg-muted/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{detectionStats.audioEvents}</p>
                <p className="text-xs text-muted-foreground">Audio Events</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent-foreground">{detectionStats.visualEvents}</p>
                <p className="text-xs text-muted-foreground">Visual Events</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary-foreground">{detectionStats.facecamEvents}</p>
                <p className="text-xs text-muted-foreground">Facecam Events</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{detectionStats.fusedEvents}</p>
                <p className="text-xs text-muted-foreground">Fused Total</p>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Processed in {(detectionStats.processingTime / 1000).toFixed(1)}s
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detected Events Summary */}
      {detectedEvents.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{detectedEvents.length} Highlights Detected</p>
                  <p className="text-sm text-muted-foreground">
                    Click markers on timeline to preview
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {['ACE', 'CLUTCH', '4K', 'TRIPLE', 'DOUBLE'].map(type => {
                  const count = detectedEvents.filter(e => e.type === type).length;
                  if (count === 0) return null;
                  return (
                    <Badge key={type} variant="secondary">
                      {count} {type}
                    </Badge>
                  );
                })}
              </div>
            </div>
            
            {/* Event List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {detectedEvents.slice(0, 10).map((event) => (
                <button
                  key={event.id}
                  onClick={() => seekToEvent(event)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors text-left"
                >
                  <Badge 
                    variant={event.type === 'ACE' || event.type === 'CLUTCH' ? 'default' : 'secondary'}
                    className="w-16 justify-center"
                  >
                    {event.type}
                  </Badge>
                  <span className="font-mono text-sm text-muted-foreground">
                    {formatTime(event.timestamp / 1000)}
                  </span>
                  <div className="flex-1" />
                  <div className="flex gap-1" title="Detection sources">
                    {event.audioSpike && (
                      <Waves className="w-3 h-3 text-primary" />
                    )}
                    {event.visualDetected && (
                      <Eye className="w-3 h-3 text-accent-foreground" />
                    )}
                    {event.facecamDetected && (
                      <Camera className="w-3 h-3 text-secondary-foreground" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(event.confidence * 100)}%
                  </span>
                </button>
              ))}
              {detectedEvents.length > 10 && (
                <p className="text-center text-xs text-muted-foreground py-2">
                  +{detectedEvents.length - 10} more events
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
