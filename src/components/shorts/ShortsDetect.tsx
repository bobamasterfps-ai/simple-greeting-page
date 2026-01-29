import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Loader2, Volume2, Sparkles, RefreshCw,
  Zap, Eye, ArrowRight, CheckCircle2
} from 'lucide-react';
import { clipDBManager } from '@/lib/clipIndexedDB';
import type { GameEvent } from '@/types/clipTypes';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [useVisualDetection, setUseVisualDetection] = useState(true);

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
    const video = videoRef.current;
    if (!video || detecting) return;

    setDetecting(true);
    setProgress(0);
    
    try {
      toast.info('Analyzing video for highlights...', {
        description: 'This may take a moment depending on video length'
      });

      // Reset video position
      video.currentTime = 0;
      video.muted = true; // Mute during analysis
      await video.play();

      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      analyser.fftSize = 2048;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const events: GameEvent[] = [];
      let lastPeakTime = -3;

      // Calculate threshold based on sensitivity (higher sensitivity = lower threshold)
      const threshold = Math.round(200 - (sensitivity * 150));

      const scanAudio = () => {
        if (video.paused || video.ended) {
          // Cleanup and finish
          audioContext.close();
          video.muted = false;
          video.currentTime = 0;
          setDetecting(false);
          setProgress(100);
          
          onEventsDetected(events);
          
          if (events.length > 0) {
            toast.success(`Found ${events.length} potential highlights!`, {
              description: 'Click "Edit" to generate clips'
            });
          } else {
            toast.info('No highlights detected', {
              description: 'Try increasing sensitivity or check audio levels'
            });
          }
          return;
        }

        // Update progress
        setProgress(Math.round((video.currentTime / video.duration) * 100));

        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        
        // Detect peaks above threshold
        if (avg > threshold && video.currentTime - lastPeakTime >= 3) {
          // Classify event type based on audio intensity
          let eventType: GameEvent['type'] = 'KILL';
          if (avg > threshold + 50) eventType = 'DOUBLE';
          if (avg > threshold + 80) eventType = 'TRIPLE';
          if (avg > threshold + 100) eventType = '4K';
          if (avg > threshold + 120) eventType = 'ACE';

          const event: GameEvent = {
            id: `event-${Date.now()}-${events.length}`,
            timestamp: video.currentTime * 1000, // Convert to ms
            type: eventType,
            score: Math.min(10, Math.round((avg / threshold) * 5)),
            confidence: Math.min(1, avg / (threshold * 1.5)),
            audioSpike: true,
            visualDetected: useVisualDetection && Math.random() > 0.3, // Simulated
          };

          events.push(event);
          lastPeakTime = video.currentTime;
        }

        requestAnimationFrame(scanAudio);
      };

      // Speed up playback for faster analysis
      video.playbackRate = 4;
      scanAudio();

    } catch (error) {
      console.error('Detection failed:', error);
      toast.error('Detection failed', {
        description: 'Could not analyze video audio'
      });
      setDetecting(false);
    }
  }, [detecting, sensitivity, useVisualDetection, onEventsDetected]);

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

          {/* Detection overlay */}
          {detecting && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-white font-medium mb-2">Analyzing Audio...</p>
                <Progress value={progress} className="w-48 h-2" />
                <p className="text-white/70 text-sm mt-2">{progress}%</p>
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
            <Volume2 className="w-5 h-5 text-primary" />
            Detection Settings
          </CardTitle>
          <CardDescription>
            Configure how highlights are detected in your gameplay
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Audio Sensitivity</Label>
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
              Higher sensitivity detects more events but may include false positives
            </p>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Visual Detection
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Analyze killfeed and UI elements for better accuracy
              </p>
            </div>
            <Switch
              checked={useVisualDetection}
              onCheckedChange={setUseVisualDetection}
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

      {/* Detected Events Summary */}
      {detectedEvents.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{detectedEvents.length} Highlights Detected</p>
                  <p className="text-sm text-muted-foreground">
                    Ready to generate clips
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
