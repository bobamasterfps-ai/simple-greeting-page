import { useState, useEffect, useCallback } from 'react';
import { Zap, Volume2, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { clipAudioAnalyzer } from '@/lib/clipAudioAnalyzer';
import { clipVisualDetector } from '@/lib/clipVisualDetector';
import { clipDBManager } from '@/lib/clipIndexedDB';
import type { GameEvent } from '@/types/clipTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface EventDetectorProps {
  videoId: string;
  onDetectionComplete: (events: GameEvent[]) => void;
}

export function EventDetector({ videoId, onDetectionComplete }: EventDetectorProps) {
  const [status, setStatus] = useState('Initializing...');
  const [progress, setProgress] = useState(0);
  const [audioEvents, setAudioEvents] = useState<GameEvent[]>([]);
  const [visualEvents, setVisualEvents] = useState<GameEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'audio' | 'visual' | 'fusing' | 'complete'>('audio');

  const fuseEvents = useCallback((
    audio: GameEvent[],
    visual: GameEvent[]
  ): GameEvent[] => {
    const fused: GameEvent[] = [];
    const timeThreshold = 1500; // 1.5 seconds

    // Start with audio events
    for (const audioEvent of audio) {
      const nearbyVisual = visual.find(
        v => Math.abs(v.timestamp - audioEvent.timestamp) < timeThreshold
      );

      if (nearbyVisual) {
        // Boost confidence and upgrade type if both detected
        const typeOrder: GameEvent['type'][] = ['HEADSHOT', 'KILL', 'DOUBLE', 'TRIPLE', '4K', 'ACE', 'CLUTCH'];
        const audioTypeIndex = typeOrder.indexOf(audioEvent.type);
        const visualTypeIndex = typeOrder.indexOf(nearbyVisual.type);
        const bestType = visualTypeIndex > audioTypeIndex ? nearbyVisual.type : audioEvent.type;
        
        fused.push({
          ...audioEvent,
          type: bestType,
          confidence: Math.min(1, audioEvent.confidence + 0.3),
          visualDetected: true,
          score: Math.max(audioEvent.score, nearbyVisual.score)
        });
      } else {
        fused.push(audioEvent);
      }
    }

    // Add visual events that weren't matched
    for (const visualEvent of visual) {
      const alreadyAdded = fused.some(
        f => Math.abs(f.timestamp - visualEvent.timestamp) < timeThreshold
      );

      if (!alreadyAdded) {
        fused.push(visualEvent);
      }
    }

    // Sort by score (highest first)
    return fused.sort((a, b) => b.score - a.score);
  }, []);

  useEffect(() => {
    const detectEvents = async () => {
      try {
        const videoBlob = await clipDBManager.getVideo(videoId);
        if (!videoBlob) {
          setError('Video not found in storage');
          return;
        }

        // Step 1: Audio analysis
        setPhase('audio');
        setStatus('Analyzing audio for peaks...');
        setProgress(10);
        
        const audioEvts = await clipAudioAnalyzer.analyzeAudioPeaks(videoBlob, 0.6);
        setAudioEvents(audioEvts);
        setProgress(40);

        // Step 2: Visual analysis
        setPhase('visual');
        setStatus('Detecting kill feed changes...');
        
        const visualEvts = await clipVisualDetector.detectKillFeedChanges(
          videoBlob,
          (p) => setProgress(40 + p * 0.4)
        );
        setVisualEvents(visualEvts);
        setProgress(80);

        // Step 3: Fuse events
        setPhase('fusing');
        setStatus('Combining detections...');
        const fusedEvents = fuseEvents(audioEvts, visualEvts);
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
  }, [videoId, onDetectionComplete, fuseEvents]);

  const getPhaseIcon = (targetPhase: typeof phase) => {
    const phases: typeof phase[] = ['audio', 'visual', 'fusing', 'complete'];
    const currentIndex = phases.indexOf(phase);
    const targetIndex = phases.indexOf(targetPhase);

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
            Event Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
                    <span className="font-medium">Visual Detection</span>
                  </div>
                  {visualEvents.length > 0 && (
                    <Badge variant="secondary">{visualEvents.length} events</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getPhaseIcon('fusing')}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-medium">Fusing Results</span>
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
              <p className="font-medium">Found {audioEvents.length + visualEvents.length} potential highlights!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
