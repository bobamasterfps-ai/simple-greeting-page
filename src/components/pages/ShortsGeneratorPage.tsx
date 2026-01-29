/**
 * Shorts Generator Page - Full Step-Based Workflow
 * 
 * Features:
 * ✅ Step-based navigation: Upload → Detect → Edit → Library → Settings
 * ✅ 100% browser-based processing
 * ✅ Multiple clip modes (Funny, Flex, Teaching)
 * ✅ Aspect ratio presets (9:16, 1:1, 16:9)
 * ✅ Auto subtitle generation
 * ✅ Local clip library with IndexedDB storage
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, Video, HardDrive, Shield, Server, Sparkles } from 'lucide-react';
import { clipFFmpegWorker } from '@/lib/clipFFmpegWorker';
import type { GameEvent } from '@/types/clipTypes';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

// Import shorts components
import { ShortsHeader } from '@/components/shorts/ShortsHeader';
import { ShortsStepIndicator, type ShortsStep } from '@/components/shorts/ShortsStepIndicator';
import { ShortsUpload } from '@/components/shorts/ShortsUpload';
import { ShortsDetect } from '@/components/shorts/ShortsDetect';
import { ShortsSettings } from '@/components/shorts/ShortsSettings';
import { EnhancedClipEditor } from '@/components/shorts/EnhancedClipEditor';
import { EnhancedClipLibrary } from '@/components/shorts/EnhancedClipLibrary';
import { useShortsSettings } from '@/hooks/useShortsSettings';
import { DEFAULT_SETTINGS } from '@/types/shortsTypes';

export function ShortsGeneratorPage() {
  // Current step in workflow
  const [currentStep, setCurrentStep] = useState<ShortsStep>('upload');
  
  // Video state
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  // Detection state
  const [detectedEvents, setDetectedEvents] = useState<GameEvent[]>([]);
  
  // FFmpeg state
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [ffmpegProgress, setFfmpegProgress] = useState(0);
  
  // Library refresh trigger
  const [libraryRefresh, setLibraryRefresh] = useState(0);
  
  // Settings hook
  const { settings, loading: settingsLoading, updateSetting, saveSettings } = useShortsSettings();

  // Preload FFmpeg on mount
  useEffect(() => {
    if (clipFFmpegWorker.isLoaded()) {
      setFfmpegReady(true);
      return;
    }

    setFfmpegLoading(true);
    clipFFmpegWorker.load((p) => setFfmpegProgress(p))
      .then(() => {
        setFfmpegReady(true);
        setFfmpegLoading(false);
        toast.success('Video processor ready!');
      })
      .catch((err) => {
        console.error('FFmpeg preload failed:', err);
        setFfmpegLoading(false);
        toast.error('Failed to load video processor');
      });
  }, []);

  // Handle video upload complete
  const handleUploadComplete = useCallback((id: string, url: string) => {
    setVideoId(id);
    setVideoUrl(url);
    setDetectedEvents([]); // Reset events for new video
    setCurrentStep('detect'); // Auto-advance to detect step
  }, []);

  // Handle events detected
  const handleEventsDetected = useCallback((events: GameEvent[]) => {
    setDetectedEvents(events);
    if (events.length > 0) {
      // Auto-advance to edit step if we found events
      setCurrentStep('edit');
    }
  }, []);

  // Handle clip generated - refresh library
  const handleClipGenerated = useCallback(() => {
    setLibraryRefresh(prev => prev + 1);
  }, []);

  // Handle settings reset
  const handleResetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
    toast.success('Settings reset to defaults');
  }, [saveSettings]);

  // Handle step change
  const handleStepChange = useCallback((step: ShortsStep) => {
    setCurrentStep(step);
  }, []);

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <ShortsUpload 
            onUploadComplete={handleUploadComplete}
            currentVideoId={videoId || undefined}
          />
        );
      
      case 'detect':
        if (!videoId || !videoUrl) {
          return (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Please upload a video first</p>
            </div>
          );
        }
        return (
          <ShortsDetect
            videoId={videoId}
            videoUrl={videoUrl}
            sensitivity={settings.audioSensitivity}
            onSensitivityChange={(v) => updateSetting('audioSensitivity', v)}
            onEventsDetected={handleEventsDetected}
            detectedEvents={detectedEvents}
          />
        );
      
      case 'edit':
        if (!videoId || detectedEvents.length === 0) {
          return (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No events detected yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Go to "Detect" to find highlights in your video
              </p>
            </div>
          );
        }
        return (
          <EnhancedClipEditor
            videoId={videoId}
            events={detectedEvents}
            settings={settings}
            onClipGenerated={handleClipGenerated}
          />
        );
      
      case 'library':
        return <EnhancedClipLibrary refreshTrigger={libraryRefresh} />;
      
      case 'settings':
        return (
          <ShortsSettings
            settings={settings}
            onUpdate={updateSetting}
            onReset={handleResetSettings}
          />
        );
      
      default:
        return null;
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ShortsHeader />

      {/* FFmpeg Status */}
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant={ffmpegReady ? 'default' : 'secondary'}
          className="gap-1.5"
        >
          {ffmpegReady ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : ffmpegLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <AlertTriangle className="w-3 h-3" />
          )}
          {ffmpegReady 
            ? 'Processor Ready' 
            : ffmpegLoading 
              ? `Loading ${ffmpegProgress}%` 
              : 'Processor Not Loaded'
          }
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <Video className="w-3 h-3" />
          WASM Powered
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <HardDrive className="w-3 h-3" />
          Local Storage
        </Badge>
      </div>

      {/* Step Indicator */}
      <ShortsStepIndicator
        currentStep={currentStep}
        onStepChange={handleStepChange}
        hasVideo={!!videoId}
        hasEvents={detectedEvents.length > 0}
      />

      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Memory Warning */}
      {currentStep === 'edit' && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">Browser Memory Limits</p>
                <p className="text-muted-foreground mt-1">
                  Browser-based FFmpeg uses 1-2GB RAM. Very large videos may cause slowdowns. 
                  For best results, use clips under 10 minutes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
