import { useState } from 'react';
import { Play, Loader2, Sparkles, Clock, Zap } from 'lucide-react';
import { clipFFmpegWorker } from '@/lib/clipFFmpegWorker';
import { clipAudioAnalyzer } from '@/lib/clipAudioAnalyzer';
import { clipVisualDetector } from '@/lib/clipVisualDetector';
import { clipDBManager } from '@/lib/clipIndexedDB';
import type { GameEvent, ClipData, SubtitleSegment } from '@/types/clipTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface ClipEditorProps {
  videoId: string;
  events: GameEvent[];
  onClipGenerated: () => void;
}

const EVENT_COLORS: Record<GameEvent['type'], string> = {
  KILL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  DOUBLE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  TRIPLE: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  '4K': 'bg-red-500/20 text-red-400 border-red-500/30',
  ACE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CLUTCH: 'bg-green-500/20 text-green-400 border-green-500/30',
  HEADSHOT: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

export function ClipEditor({ videoId, events, onClipGenerated }: ClipEditorProps) {
  const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [settings, setSettings] = useState({
    mode: 'FLEX' as 'FUNNY' | 'FLEX' | 'TEACHING',
    preset: 'CROPPED' as 'STACKED_FACECAM' | 'FULLSCREEN' | 'CENTERED' | 'CROPPED',
    enableSubtitles: false,
    preRoll: 3000,
    postRoll: 2000,
  });

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const generateClip = async (event: GameEvent) => {
    setSelectedEvent(event);
    setProcessing(true);
    setProgress(0);

    try {
      setProgressLabel('Loading video...');
      const videoBlob = await clipDBManager.getVideo(videoId);
      if (!videoBlob) throw new Error('Video not found');

      // Step 1: Extract clip segment
      setProgressLabel('Extracting clip...');
      setProgress(10);
      
      const startTime = Math.max(0, event.timestamp - settings.preRoll);
      const duration = settings.preRoll + settings.postRoll;

      let clipBlob = await clipFFmpegWorker.extractClip(
        videoBlob,
        startTime,
        duration,
        (p) => setProgress(10 + p * 0.2)
      );

      // Step 2: Generate subtitles if enabled
      let subtitles: SubtitleSegment[] = [];
      if (settings.enableSubtitles) {
        setProgressLabel('Generating subtitles...');
        setProgress(30);
        subtitles = await clipAudioAnalyzer.generateSubtitles(clipBlob);
        
        if (subtitles.length > 0) {
          setProgressLabel('Adding subtitles...');
          clipBlob = await clipFFmpegWorker.addSubtitles(
            clipBlob,
            subtitles,
            {
              fontName: 'Montserrat',
              fontSize: 28,
              primaryColor: '#FFFFFF',
              outlineColor: '#000000'
            },
            (p) => setProgress(30 + p * 0.15)
          );
        }
      }
      setProgress(45);

      // Step 3: Crop to aspect ratio
      setProgressLabel('Cropping video...');
      clipBlob = await clipFFmpegWorker.cropToAspectRatio(
        clipBlob,
        settings.preset,
        (p) => setProgress(45 + p * 0.25)
      );
      setProgress(70);

      // Step 4: Apply mode-specific effects
      setProgressLabel('Applying effects...');
      if (settings.mode === 'FLEX') {
        clipBlob = await clipFFmpegWorker.applyEffects(clipBlob, {
          slowMo: { 
            startMs: settings.preRoll - 500, 
            endMs: settings.preRoll + 500, 
            speed: 0.6 
          },
          colorGrade: { saturation: 1.2, brightness: 1.05 }
        }, (p) => setProgress(70 + p * 0.15));
      } else if (settings.mode === 'FUNNY') {
        clipBlob = await clipFFmpegWorker.applyEffects(clipBlob, {
          colorGrade: { saturation: 1.3, brightness: 1.1, contrast: 1.1 }
        }, (p) => setProgress(70 + p * 0.15));
      }
      setProgress(85);

      // Step 5: Generate thumbnail
      setProgressLabel('Generating thumbnail...');
      const thumbnailUrl = await clipVisualDetector.generateThumbnail(clipBlob, settings.preRoll);
      setProgress(90);

      // Step 6: Save clip
      setProgressLabel('Saving clip...');
      const clipData: ClipData = {
        id: `clip-${Date.now()}`,
        sourceVideoId: videoId,
        event,
        startTime,
        endTime: startTime + duration,
        duration,
        mode: settings.mode,
        preset: settings.preset,
        subtitles,
        processedVideoBlob: clipBlob,
        thumbnailUrl,
        createdAt: new Date(),
        status: 'READY'
      };

      await clipDBManager.saveClip(clipData);
      setProgress(100);
      
      toast.success('Clip generated successfully!');
      onClipGenerated();
    } catch (error) {
      console.error('Clip generation failed:', error);
      toast.error('Clip generation failed');
    } finally {
      setProcessing(false);
      setSelectedEvent(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Clip Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Mode</label>
              <Select 
                value={settings.mode} 
                onValueChange={(v) => setSettings({ ...settings, mode: v as typeof settings.mode })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FLEX">🔥 Flex (Slow-mo + Grade)</SelectItem>
                  <SelectItem value="FUNNY">😂 Funny (Vibrant)</SelectItem>
                  <SelectItem value="TEACHING">📚 Teaching (Clean)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Aspect Ratio</label>
              <Select 
                value={settings.preset} 
                onValueChange={(v) => setSettings({ ...settings, preset: v as typeof settings.preset })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CROPPED">9:16 Portrait (Shorts)</SelectItem>
                  <SelectItem value="STACKED_FACECAM">9:16 Stacked</SelectItem>
                  <SelectItem value="CENTERED">1:1 Square</SelectItem>
                  <SelectItem value="FULLSCREEN">16:9 Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-6">
              <span className="text-sm font-medium">Auto Subtitles</span>
              <Switch 
                checked={settings.enableSubtitles} 
                onCheckedChange={(v) => setSettings({ ...settings, enableSubtitles: v })} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Overlay */}
      {processing && (
        <Card className="border-primary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <div className="flex-1">
                <div className="font-medium">{progressLabel}</div>
                <Progress value={progress} className="h-2 mt-2" />
              </div>
              <span className="font-mono text-sm">{Math.round(progress)}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Detected Events ({events.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No events detected. Try adjusting sensitivity settings.
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className={`flex items-center justify-between p-4 rounded-lg bg-card border transition-all hover:border-primary/50 ${
                  selectedEvent?.id === event.id ? 'border-primary' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <Badge className={EVENT_COLORS[event.type]}>
                    {event.type}
                  </Badge>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatTime(event.timestamp)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Score: {event.score}/10 • Confidence: {(event.confidence * 100).toFixed(0)}%
                      {event.audioSpike && ' • 🔊'}
                      {event.visualDetected && ' • 👁️'}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => generateClip(event)}
                  disabled={processing}
                  size="sm"
                >
                  {processing && selectedEvent?.id === event.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
