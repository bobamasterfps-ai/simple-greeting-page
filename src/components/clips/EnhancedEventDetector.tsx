import { useState, useEffect, useCallback } from 'react';
import { Zap, Volume2, Eye, CheckCircle2, AlertCircle, User } from 'lucide-react';
import { clipAudioAnalyzer } from '@/lib/clipAudioAnalyzer';
import { clipVisualDetector } from '@/lib/clipVisualDetector';
import { facecamDetector, type FacecamEvent } from '@/lib/facecamDetector';
import { eventFusionEngine, type FusedEvent } from '@/lib/eventFusionEngine';
import { clipDBManager } from '@/lib/clipIndexedDB';
import type { GameEvent } from '@/types/clipTypes';
import type { ClipMode } from '@/types/shortsTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface EnhancedEventDetectorProps {
  videoId: string;
  mode: ClipMode;
  sensitivity: number;
  onDetectionComplete: (events: FusedEvent[]) => void;
}

type DetectionPhase = 'audio' | 'visual' | 'facecam' | 'fusing' | 'complete';

export function EnhancedEventDetector({ 
  videoId, 
  mode,
  sensitivity,
  onDetectionComplete 
}: EnhancedEventDetectorProps) {
  const [status, setStatus] = useState('Initializing...');
  const [progress, setProgress] = useState(0);
  const [audioEvents, setAudioEvents] = useState<GameEvent[]>([]);
  const [visualEvents, setVisualEvents] = useState<GameEvent[]>([]);
  const [facecamEvents, setFacecamEvents] = useState<FacecamEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<DetectionPhase>('audio');
  
  // Detection toggles
  const [enableFacecam, setEnableFacecam] = useState(true);

  useEffect(() => {
    const detectEvents = async () => {
      try {
        const videoBlob = await clipDBManager.getVideo(videoId);
        if (!videoBlob) {
          setError('Video not found in storage');
          return;
        }

        // Set mode for fusion engine
        eventFusionEngine.setMode(mode);

        // Step 1: Audio analysis
        setPhase('audio');
        setStatus('Analyzing audio for peaks...');
        setProgress(5);
        
        const audioEvts = await clipAudioAnalyzer.analyzeAudioPeaks(videoBlob, sensitivity);
        setAudioEvents(audioEvts);
        setProgress(30);

        // Step 2: Visual analysis (kill feed)
        setPhase('visual');
        setStatus('Detecting kill feed changes...');
        
        const visualEvts = await clipVisualDetector.detectKillFeedChanges(
          videoBlob,
          (p) => setProgress(30 + p * 0.25)
        );
        setVisualEvents(visualEvts);
        setProgress(55);

        // Step 3: Facecam analysis (optional)
        let facecamEvts: FacecamEvent[] = [];
        if (enableFacecam) {
          setPhase('facecam');
          setStatus('Detecting facecam reactions...');
          
          facecamEvts = await facecamDetector.detectFacecamMotion(
            videoBlob,
            (p) => setProgress(55 + p * 0.25)
          );
          setFacecamEvents(facecamEvts);
        }
        setProgress(80);

        // Step 4: Fuse events
        setPhase('fusing');
        setStatus('Combining detections with AI scoring...');
        const fusedEvents = eventFusionEngine.fuseEvents(audioEvts, visualEvts, facecamEvts);
        setProgress(100);

        setPhase('complete');
        setStatus('Detection complete!');
        
        // Short delay before moving to next step
        setTimeout(() => {
          onDetectionComplete(fusedEvents);
        }, 1000);
      } catch (err) {
        console.error('Detection failed:', err);
        setError(err instanceof Error ? err.message : 'Detection failed');
      }
    };

    detectEvents();
  }, [videoId, onDetectionComplete, mode, sensitivity, enableFacecam]);

  const getPhaseIcon = (targetPhase: DetectionPhase) => {
    const phases: DetectionPhase[] = ['audio', 'visual', 'facecam', 'fusing', 'complete'];
    const currentIndex = phases.indexOf(phase);
    const targetIndex = phases.indexOf(targetPhase);

    // Skip facecam if disabled
    if (targetPhase === 'facecam' && !enableFacecam) {
      return <div className="w-5 h-5 rounded-full bg-muted" />;
    }

    if (targetIndex < currentIndex || phase === 'complete') {
      return <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success))]" />;
    }
    if (targetIndex === currentIndex) {
      return <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />;
    }
    return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />;
  };

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card className="border-destructive">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">Detection Failed</h3>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Multi-Source Event Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Detection Options */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm">Facecam Detection</Label>
            </div>
            <Switch 
              checked={enableFacecam} 
              onCheckedChange={setEnableFacecam}
              disabled={phase !== 'audio'}
            />
          </div>

          {/* Progress Steps */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {getPhaseIcon('audio')}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-primary" />
                    <span className="font-medium">Audio Analysis</span>
                  </div>
                  {audioEvents.length > 0 && (
                    <Badge variant="secondary">{audioEvents.length} peaks</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getPhaseIcon('visual')}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    <span className="font-medium">Kill Feed Detection</span>
                  </div>
                  {visualEvents.length > 0 && (
                    <Badge variant="secondary">{visualEvents.length} events</Badge>
                  )}
                </div>
              </div>
            </div>

            {enableFacecam && (
              <div className="flex items-center gap-3">
                {getPhaseIcon('facecam')}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-medium">Facecam Reactions</span>
                    </div>
                    {facecamEvents.length > 0 && (
                      <Badge variant="secondary">{facecamEvents.length} reactions</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              {getPhaseIcon('fusing')}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-medium">AI Fusion & Scoring</span>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted-foreground">{status}</span>
              <span className="font-mono">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {phase === 'complete' && (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-[hsl(var(--success))] mx-auto mb-2" />
              <p className="font-medium">
                Found {audioEvents.length + visualEvents.length + facecamEvents.length} potential highlights!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Multi-source fusion applied for {mode.toLowerCase()} mode
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
