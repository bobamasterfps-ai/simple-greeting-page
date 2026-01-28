/**
 * Enhanced Shorts Generator - Create viral 9:16 vertical videos from gameplay
 * 100% Browser-Based using FFmpeg.wasm, Web Audio API, Canvas
 */
import { useState, useEffect, useCallback } from 'react';
import { Video, ArrowLeft } from 'lucide-react';
import { clipDBManager } from '@/lib/clipIndexedDB';
import type { GameEvent } from '@/types/clipTypes';
import { DEFAULT_SETTINGS } from '@/types/shortsTypes';
import { useShortsSettings } from '@/hooks/useShortsSettings';
import { ShortsHeader } from '@/components/shorts/ShortsHeader';
import { ShortsStepIndicator, type ShortsStep } from '@/components/shorts/ShortsStepIndicator';
import { ShortsSettings } from '@/components/shorts/ShortsSettings';
import { EnhancedClipEditor } from '@/components/shorts/EnhancedClipEditor';
import { EnhancedClipLibrary } from '@/components/shorts/EnhancedClipLibrary';
import { VideoUpload } from '@/components/clips/VideoUpload';
import { EventDetector } from '@/components/clips/EventDetector';
import { Button } from '@/components/ui/button';

export function ShortsGeneratorPage() {
  const [currentStep, setCurrentStep] = useState<ShortsStep>('upload');
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [detectedEvents, setDetectedEvents] = useState<GameEvent[]>([]);
  const [clipRefreshTrigger, setClipRefreshTrigger] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const { settings, loading: settingsLoading, updateSetting, saveSettings } = useShortsSettings();

  // Initialize IndexedDB
  useEffect(() => {
    clipDBManager.init()
      .then(() => setInitialized(true))
      .catch(console.error);
  }, []);

  const handleUploadComplete = useCallback((videoId: string) => {
    setCurrentVideoId(videoId);
    setCurrentStep('detect');
  }, []);

  const handleDetectionComplete = useCallback((events: GameEvent[]) => {
    setDetectedEvents(events);
    setCurrentStep('edit');
  }, []);

  const handleClipGenerated = useCallback(() => {
    setClipRefreshTrigger(prev => prev + 1);
  }, []);

  const handleStepChange = useCallback((step: ShortsStep) => {
    if (step === 'upload') {
      // Reset state when going back to upload
      setCurrentVideoId(null);
      setDetectedEvents([]);
    }
    setCurrentStep(step);
  }, []);

  const handleResetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  if (!initialized || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Initializing Shorts Generator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ShortsHeader />

      {/* Step Indicator */}
      <ShortsStepIndicator
        currentStep={currentStep}
        onStepChange={handleStepChange}
        hasVideo={!!currentVideoId}
        hasEvents={detectedEvents.length > 0}
      />

      {/* Back Button (when in workflow) */}
      {(currentStep === 'detect' || currentStep === 'edit') && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleStepChange('upload')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Start Over
        </Button>
      )}

      {/* Main Content */}
      <div className="min-h-[400px]">
        {currentStep === 'upload' && (
          <VideoUpload onUploadComplete={handleUploadComplete} />
        )}

        {currentStep === 'detect' && currentVideoId && (
          <EventDetector
            videoId={currentVideoId}
            onDetectionComplete={handleDetectionComplete}
          />
        )}

        {currentStep === 'edit' && currentVideoId && (
          <EnhancedClipEditor
            videoId={currentVideoId}
            events={detectedEvents}
            settings={settings}
            onClipGenerated={handleClipGenerated}
          />
        )}

        {currentStep === 'library' && (
          <EnhancedClipLibrary refreshTrigger={clipRefreshTrigger} />
        )}

        {currentStep === 'settings' && (
          <ShortsSettings
            settings={settings}
            onUpdate={updateSetting}
            onReset={handleResetSettings}
          />
        )}
      </div>

      {/* Quick Library Access (floating) - only show when in workflow */}
      {(currentStep === 'upload' || currentStep === 'detect' || currentStep === 'edit') && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={() => setCurrentStep('library')}
            className="shadow-lg gap-2"
            size="lg"
          >
            <Video className="w-5 h-5" />
            View Clips
          </Button>
        </div>
      )}
    </div>
  );
}
