import { useState, useMemo } from 'react';
import { 
  Play, Loader2, Sparkles, Clock, Zap, Star, TrendingUp, 
  Flame, Target, CheckCircle2, Volume2, Eye 
} from 'lucide-react';
import { clipFFmpegWorker } from '@/lib/clipFFmpegWorker';
import { clipAudioAnalyzer } from '@/lib/clipAudioAnalyzer';
import { clipVisualDetector } from '@/lib/clipVisualDetector';
import { clipDBManager } from '@/lib/clipIndexedDB';
import type { GameEvent, ClipData, SubtitleSegment } from '@/types/clipTypes';
import type { ClipSettings } from '@/types/shortsTypes';
import { MODE_CONFIGS, SUBTITLE_COLORS } from '@/types/shortsTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EnhancedClipEditorProps {
  videoId: string;
  events: GameEvent[];
  settings: ClipSettings;
  onClipGenerated: () => void;
}

const EVENT_ICONS: Record<GameEvent['type'], React.ReactNode> = {
  KILL: <Target className="w-4 h-4" />,
  DOUBLE: <Star className="w-4 h-4" />,
  TRIPLE: <Flame className="w-4 h-4" />,
  '4K': <TrendingUp className="w-4 h-4" />,
  ACE: <Sparkles className="w-4 h-4" />,
  CLUTCH: <CheckCircle2 className="w-4 h-4" />,
  HEADSHOT: <Target className="w-4 h-4" />,
};

const EVENT_SCORES: Record<GameEvent['type'], number> = {
  HEADSHOT: 2,
  KILL: 3,
  DOUBLE: 5,
  TRIPLE: 7,
  '4K': 9,
  ACE: 10,
  CLUTCH: 10,
};

export function EnhancedClipEditor({ 
  videoId, 
  events, 
  settings,
  onClipGenerated 
}: EnhancedClipEditorProps) {
  const [processing, setProcessing] = useState(false);
  const [processingEventId, setProcessingEventId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [filter, setFilter] = useState<'all' | 'top' | 'multi'>('all');

  const filteredEvents = useMemo(() => {
    let filtered = [...events];
    
    switch (filter) {
      case 'top':
        filtered = filtered.filter(e => e.score >= 7 || EVENT_SCORES[e.type] >= 7);
        break;
      case 'multi':
        filtered = filtered.filter(e => 
          ['DOUBLE', 'TRIPLE', '4K', 'ACE', 'CLUTCH'].includes(e.type)
        );
        break;
    }
    
    return filtered.sort((a, b) => {
      const scoreA = EVENT_SCORES[a.type] + a.confidence * 2;
      const scoreB = EVENT_SCORES[b.type] + b.confidence * 2;
      return scoreB - scoreA;
    });
  }, [events, filter]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const getScoreColor = (type: GameEvent['type']) => {
    const score = EVENT_SCORES[type];
    if (score >= 9) return 'text-yellow-500';
    if (score >= 7) return 'text-orange-500';
    if (score >= 5) return 'text-purple-500';
    return 'text-blue-500';
  };

  const generateClip = async (event: GameEvent) => {
    setProcessingEventId(event.id);
    setProcessing(true);
    setProgress(0);

    try {
      setProgressLabel('Loading video...');
      const videoBlob = await clipDBManager.getVideo(videoId);
      if (!videoBlob) throw new Error('Video not found');

      // Get mode-specific config
      const modeConfig = MODE_CONFIGS[settings.mode];

      // Step 1: Extract clip segment
      setProgressLabel('Extracting clip...');
      setProgress(10);
      
      const startTime = Math.max(0, event.timestamp - settings.preRollMs);
      const duration = settings.preRollMs + settings.postRollMs;

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
          
          // Get subtitle color
          const colorConfig = SUBTITLE_COLORS.find(c => c.id === settings.subtitleColor);
          const subColor = colorConfig?.hex === 'auto' ? '#FFFFFF' : colorConfig?.hex || '#FFFFFF';
          
          clipBlob = await clipFFmpegWorker.addSubtitles(
            clipBlob,
            subtitles,
            {
              fontName: settings.fontStyle,
              fontSize: 28,
              primaryColor: subColor,
              outlineColor: '#000000'
            },
            (p) => setProgress(30 + p * 0.15)
          );
        }
      }
      setProgress(45);

      // Step 3: Crop to aspect ratio
      setProgressLabel('Cropping video...');
      const presetMap = {
        'SHORTS': 'CROPPED' as const,
        'STACKED': 'STACKED_FACECAM' as const,
        'SQUARE': 'CENTERED' as const,
        'LANDSCAPE': 'FULLSCREEN' as const,
      };
      
      clipBlob = await clipFFmpegWorker.cropToAspectRatio(
        clipBlob,
        presetMap[settings.preset],
        (p) => setProgress(45 + p * 0.25)
      );
      setProgress(70);

      // Step 4: Apply mode-specific effects
      setProgressLabel(`Applying ${settings.mode.toLowerCase()} effects...`);
      
      if (modeConfig.effects.slowMo || modeConfig.effects.colorGrade) {
        const effectsConfig: any = {};
        
        if (modeConfig.effects.slowMo) {
          effectsConfig.slowMo = {
            startMs: settings.preRollMs - 500,
            endMs: settings.preRollMs + 500,
            speed: 0.6
          };
        }
        
        if (modeConfig.effects.colorGrade) {
          effectsConfig.colorGrade = modeConfig.effects.colorGrade;
        }
        
        clipBlob = await clipFFmpegWorker.applyEffects(
          clipBlob,
          effectsConfig,
          (p) => setProgress(70 + p * 0.15)
        );
      }
      setProgress(85);

      // Step 5: Generate thumbnail
      setProgressLabel('Generating thumbnail...');
      const thumbnailUrl = await clipVisualDetector.generateThumbnail(clipBlob, settings.preRollMs);
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
        preset: presetMap[settings.preset],
        subtitles,
        processedVideoBlob: clipBlob,
        thumbnailUrl,
        createdAt: new Date(),
        status: 'READY'
      };

      await clipDBManager.saveClip(clipData);
      setProgress(100);
      
      toast.success(`${event.type} clip generated!`, {
        description: `Ready in your library`
      });
      onClipGenerated();
    } catch (error) {
      console.error('Clip generation failed:', error);
      toast.error('Clip generation failed');
    } finally {
      setProcessing(false);
      setProcessingEventId(null);
    }
  };

  const generateAllTop = async () => {
    const topEvents = filteredEvents.slice(0, 5);
    for (const event of topEvents) {
      await generateClip(event);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Current Mode Info */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{MODE_CONFIGS[settings.mode].emoji}</div>
              <div>
                <h3 className="font-semibold">{MODE_CONFIGS[settings.mode].label} Mode</h3>
                <p className="text-sm text-muted-foreground">
                  {MODE_CONFIGS[settings.mode].description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{(settings.preRollMs / 1000).toFixed(1)}s + {(settings.postRollMs / 1000).toFixed(1)}s</span>
              </div>
              {settings.enableSubtitles && (
                <Badge variant="outline" className="gap-1">
                  <Volume2 className="w-3 h-3" />
                  Subtitles
                </Badge>
              )}
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Detected Events ({filteredEvents.length})
              </CardTitle>
              <CardDescription>
                Select events to generate clips
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="top">Top Plays</TabsTrigger>
                  <TabsTrigger value="multi">Multi-Kills</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {filteredEvents.length > 0 && (
                <Button
                  onClick={generateAllTop}
                  disabled={processing}
                  size="sm"
                  variant="secondary"
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Top 5
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No events match the current filter.</p>
              <p className="text-sm">Try adjusting detection sensitivity or select "All" events.</p>
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl bg-card border transition-all",
                  "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
                  processingEventId === event.id && "border-primary bg-primary/5"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    getScoreColor(event.type),
                    "bg-current/10"
                  )}>
                    {EVENT_ICONS[event.type]}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={cn("font-semibold", getScoreColor(event.type))}
                      >
                        {event.type}
                      </Badge>
                      {index < 3 && (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                          #{index + 1}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(event.timestamp)}
                      </span>
                      <span>Score: {EVENT_SCORES[event.type]}/10</span>
                      <span>Confidence: {(event.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {event.audioSpike && (
                        <span className="flex items-center gap-1 text-xs text-blue-400">
                          <Volume2 className="w-3 h-3" /> Audio
                        </span>
                      )}
                      {event.visualDetected && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <Eye className="w-3 h-3" /> Visual
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => generateClip(event)}
                  disabled={processing}
                  size="sm"
                  className="gap-2"
                >
                  {processingEventId === event.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
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
