import { useState, useMemo, useCallback } from 'react';
import { 
  Play, Loader2, Sparkles, Clock, Zap, Star, TrendingUp, 
  Flame, Target, CheckCircle2, Volume2, Eye, User, Download,
  Filter, Wand2, ArrowRight
} from 'lucide-react';
import { clipFFmpegWorker } from '@/lib/clipFFmpegWorker';
import { clipAudioAnalyzer } from '@/lib/clipAudioAnalyzer';
import { clipVisualDetector } from '@/lib/clipVisualDetector';
import { clipDBManager } from '@/lib/clipIndexedDB';
import { highlightScorer, type ScoredHighlight } from '@/lib/highlightScorer';
import { clipTimingEngine } from '@/lib/clipTimingEngine';
import type { GameEvent, ClipData, SubtitleSegment } from '@/types/clipTypes';
import type { ClipSettings } from '@/types/shortsTypes';
import { MODE_CONFIGS, SUBTITLE_COLORS } from '@/types/shortsTypes';
import type { FusedEvent } from '@/lib/eventFusionEngine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProClipEditorProps {
  videoId: string;
  events: (FusedEvent | GameEvent)[];
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

const TIER_COLORS = {
  S: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  A: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  B: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  C: 'text-muted-foreground bg-muted/50 border-muted',
};

export function ProClipEditor({ 
  videoId, 
  events, 
  settings,
  onClipGenerated 
}: ProClipEditorProps) {
  const [processing, setProcessing] = useState(false);
  const [processingEventId, setProcessingEventId] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, label: '' });
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [filter, setFilter] = useState<'all' | 'top' | 's-tier' | 'multi'>('all');
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  // Score and rank all events
  const scoredHighlights = useMemo(() => {
    highlightScorer.setMode(settings.mode);
    return highlightScorer.scoreAndRank(events);
  }, [events, settings.mode]);

  // Filter highlights based on current filter
  const filteredHighlights = useMemo(() => {
    let filtered = [...scoredHighlights];
    
    switch (filter) {
      case 'top':
        filtered = filtered.filter(h => h.clipPriority >= 7);
        break;
      case 's-tier':
        filtered = highlightScorer.getByTier(filtered, 'S');
        break;
      case 'multi':
        filtered = filtered.filter(h => 
          ['DOUBLE', 'TRIPLE', '4K', 'ACE', 'CLUTCH'].includes(h.event.type)
        );
        break;
    }
    
    return filtered;
  }, [scoredHighlights, filter]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const toggleEventSelection = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const selectAllVisible = () => {
    const newSelected = new Set(filteredHighlights.map(h => h.event.id));
    setSelectedEvents(newSelected);
  };

  const clearSelection = () => {
    setSelectedEvents(new Set());
  };

  const generateClip = useCallback(async (highlight: ScoredHighlight) => {
    setProcessingEventId(highlight.event.id);
    setProcessing(true);
    setProgress(0);

    try {
      setProgressLabel('Loading video...');
      const videoBlob = await clipDBManager.getVideo(videoId);
      if (!videoBlob) throw new Error('Video not found');

      // Get mode-specific config
      const modeConfig = MODE_CONFIGS[settings.mode];

      // Calculate clip window using timing engine
      clipTimingEngine.setMode(settings.mode);
      const clipWindow = clipTimingEngine.calculateClipWindow(highlight.event, settings.preRollMs, settings.postRollMs);

      // Step 1: Extract clip segment
      setProgressLabel('Extracting clip...');
      setProgress(10);
      
      let clipBlob = await clipFFmpegWorker.extractClip(
        videoBlob,
        clipWindow.startTime,
        clipWindow.duration,
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
      setProgressLabel('Cropping to vertical format...');
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
        const effectsConfig: Parameters<typeof clipFFmpegWorker.applyEffects>[1] = {};
        
        if (modeConfig.effects.slowMo) {
          effectsConfig.slowMo = {
            startMs: Math.max(0, clipWindow.preRoll - 500),
            endMs: clipWindow.preRoll + 500,
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
      const thumbnailUrl = await clipVisualDetector.generateThumbnail(clipBlob, clipWindow.preRoll);
      setProgress(90);

      // Step 6: Save clip
      setProgressLabel('Saving clip...');
      const clipData: ClipData = {
        id: `clip-${Date.now()}`,
        sourceVideoId: videoId,
        event: highlight.event,
        startTime: clipWindow.startTime,
        endTime: clipWindow.endTime,
        duration: clipWindow.duration,
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
      
      return clipData;
    } catch (error) {
      console.error('Clip generation failed:', error);
      throw error;
    } finally {
      setProcessing(false);
      setProcessingEventId(null);
    }
  }, [videoId, settings]);

  const handleSingleGenerate = async (highlight: ScoredHighlight) => {
    try {
      await generateClip(highlight);
      toast.success(`${highlight.tier}-Tier ${highlight.event.type} clip generated!`);
      onClipGenerated();
    } catch {
      toast.error('Clip generation failed');
    }
  };

  const handleBatchGenerate = async (highlights: ScoredHighlight[]) => {
    setBatchProcessing(true);
    setBatchProgress({ current: 0, total: highlights.length, label: 'Starting batch generation...' });

    let successCount = 0;
    for (let i = 0; i < highlights.length; i++) {
      setBatchProgress({ 
        current: i + 1, 
        total: highlights.length, 
        label: `Processing clip ${i + 1}/${highlights.length}...` 
      });

      try {
        await generateClip(highlights[i]);
        successCount++;
      } catch (error) {
        console.error(`Failed to generate clip ${i + 1}:`, error);
      }
    }

    setBatchProcessing(false);
    toast.success(`Generated ${successCount}/${highlights.length} clips!`);
    onClipGenerated();
    clearSelection();
  };

  const autoClipCandidates = highlightScorer.getAutoClipCandidates(scoredHighlights);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Mode & Stats Bar */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{MODE_CONFIGS[settings.mode].emoji}</div>
              <div>
                <h3 className="font-semibold">{MODE_CONFIGS[settings.mode].label} Mode</h3>
                <p className="text-sm text-muted-foreground">
                  {scoredHighlights.length} events scored • {autoClipCandidates.length} auto-clip ready
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Tier breakdown */}
              <div className="flex gap-2">
                {(['S', 'A', 'B'] as const).map(tier => {
                  const count = highlightScorer.getByTier(scoredHighlights, tier).length;
                  return (
                    <Badge 
                      key={tier}
                      variant="outline" 
                      className={cn('font-bold', TIER_COLORS[tier])}
                    >
                      {tier}: {count}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {autoClipCandidates.length > 0 && !batchProcessing && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Wand2 className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Auto-Clip Ready</p>
                  <p className="text-sm text-muted-foreground">
                    {autoClipCandidates.length} high-quality highlights detected
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => handleBatchGenerate(autoClipCandidates.slice(0, 5))}
                disabled={processing || batchProcessing}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate Top 5
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch Processing Overlay */}
      {batchProcessing && (
        <Card className="border-primary">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <div className="flex-1">
                  <div className="font-medium">{batchProgress.label}</div>
                  <Progress 
                    value={(batchProgress.current / batchProgress.total) * 100} 
                    className="h-2 mt-2" 
                  />
                </div>
                <span className="font-mono text-sm">
                  {batchProgress.current}/{batchProgress.total}
                </span>
              </div>
              {processing && (
                <div className="pl-10 text-sm text-muted-foreground">
                  {progressLabel} ({Math.round(progress)}%)
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single Processing Overlay */}
      {processing && !batchProcessing && (
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
                Scored Highlights ({filteredHighlights.length})
              </CardTitle>
              <CardDescription>
                AI-ranked by {settings.mode.toLowerCase()} mode scoring
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="top">Top Plays</TabsTrigger>
                  <TabsTrigger value="s-tier">S-Tier</TabsTrigger>
                  <TabsTrigger value="multi">Multi-Kills</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>

        {/* Selection Actions */}
        {selectedEvents.size > 0 && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <span className="text-sm font-medium">
                {selectedEvents.size} clip{selectedEvents.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => {
                    const selected = filteredHighlights.filter(h => selectedEvents.has(h.event.id));
                    handleBatchGenerate(selected);
                  }}
                  disabled={batchProcessing}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Generate Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        <CardContent className="space-y-3">
          {/* Select All Button */}
          {filteredHighlights.length > 0 && (
            <div className="flex justify-end mb-2">
              <Button variant="ghost" size="sm" onClick={selectAllVisible}>
                Select All ({filteredHighlights.length})
              </Button>
            </div>
          )}

          {filteredHighlights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No events match the current filter.</p>
              <p className="text-sm">Try selecting "All" to see all detected events.</p>
            </div>
          ) : (
            filteredHighlights.map((highlight) => (
              <div
                key={highlight.event.id}
                onClick={() => toggleEventSelection(highlight.event.id)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl bg-card border transition-all cursor-pointer",
                  "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
                  selectedEvents.has(highlight.event.id) && "border-primary bg-primary/5",
                  processingEventId === highlight.event.id && "border-primary bg-primary/10"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Tier Badge */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex flex-col items-center justify-center border",
                    TIER_COLORS[highlight.tier]
                  )}>
                    <span className="font-bold text-lg">{highlight.tier}</span>
                    <span className="text-[10px] opacity-70">#{highlight.rank}</span>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="secondary" 
                        className="font-semibold gap-1"
                      >
                        {EVENT_ICONS[highlight.event.type]}
                        {highlight.event.type}
                      </Badge>
                      
                      {/* Facecam reaction */}
                      {'facecamReaction' in highlight.event && highlight.event.facecamReaction && (
                        <Badge variant="outline" className="gap-1 text-purple-500 border-purple-500/30">
                          <User className="w-3 h-3" />
                          {highlight.event.facecamReaction}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(highlight.event.timestamp)}
                      </span>
                      <span>Score: {highlight.finalScore.toFixed(1)}</span>
                      <span>Priority: {highlight.clipPriority}/10</span>
                    </div>
                    
                    {/* Detection sources */}
                    <div className="flex items-center gap-2 mt-1">
                      {'sources' in highlight.event && (highlight.event as FusedEvent).sources && (
                        <>
                          {(highlight.event as FusedEvent).sources.includes('audio') && (
                            <span className="flex items-center gap-1 text-xs text-blue-400">
                              <Volume2 className="w-3 h-3" /> Audio
                            </span>
                          )}
                          {(highlight.event as FusedEvent).sources.includes('visual') && (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <Eye className="w-3 h-3" /> Visual
                            </span>
                          )}
                          {(highlight.event as FusedEvent).sources.includes('facecam') && (
                            <span className="flex items-center gap-1 text-xs text-purple-400">
                              <User className="w-3 h-3" /> Facecam
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSingleGenerate(highlight);
                  }}
                  disabled={processing || batchProcessing}
                  size="sm"
                  className="gap-2"
                >
                  {processingEventId === highlight.event.id ? (
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
