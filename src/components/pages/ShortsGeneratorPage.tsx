/**
 * Enhanced Shorts Generator Pro - VALORANT CLIPS MASTER SYSTEM
 * 
 * FEATURES:
 * - Multi-source event detection (Audio + Visual + Facecam)
 * - AI-powered event fusion with mode-based scoring
 * - S/A/B/C tier highlight ranking
 * - Batch clip generation
 * - Mode-specific effects (Funny/Flex/Teaching)
 * - Auto 9:16 TikTok/Shorts crop
 * - Browser-based (FFmpeg.wasm)
 * - Local storage (IndexedDB)
 */
import { useState, useEffect, useCallback } from 'react';
import { Video, ArrowLeft, Sparkles, Cpu, Download } from 'lucide-react';
import { clipDBManager } from '@/lib/clipIndexedDB';
import type { GameEvent } from '@/types/clipTypes';
import type { FusedEvent } from '@/lib/eventFusionEngine';
import { DEFAULT_SETTINGS } from '@/types/shortsTypes';
import { useShortsSettings } from '@/hooks/useShortsSettings';
import { ShortsHeader } from '@/components/shorts/ShortsHeader';
import { ShortsStepIndicator, type ShortsStep } from '@/components/shorts/ShortsStepIndicator';
import { ShortsSettings } from '@/components/shorts/ShortsSettings';
import { ProClipEditor } from '@/components/shorts/ProClipEditor';
import { EnhancedClipLibrary } from '@/components/shorts/EnhancedClipLibrary';
import { VideoUpload } from '@/components/clips/VideoUpload';
import { EnhancedEventDetector } from '@/components/clips/EnhancedEventDetector';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ShortsGeneratorPage() {
  const [currentStep, setCurrentStep] = useState<ShortsStep>('upload');
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [detectedEvents, setDetectedEvents] = useState<(FusedEvent | GameEvent)[]>([]);
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

  const handleDetectionComplete = useCallback((events: FusedEvent[]) => {
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
          <p className="text-muted-foreground">Initializing Shorts Generator Pro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">
              Shorts Generator Pro
            </h1>
            <p className="text-muted-foreground">
              AI-powered clip detection • Multi-source fusion • Auto-edit
            </p>
          </div>
        </div>
        
        {/* Feature badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <Cpu className="w-3 h-3" />
            Browser-Only
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Video className="w-3 h-3" />
            FFmpeg.wasm
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Download className="w-3 h-3" />
            Local Storage
          </Badge>
        </div>
      </div>

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
          <div className="space-y-6">
            <VideoUpload onUploadComplete={handleUploadComplete} />
            
            {/* Mode Preview */}
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {settings.mode === 'FUNNY' ? '😂' : settings.mode === 'FLEX' ? '🔥' : '📚'}
                    </div>
                    <div>
                      <p className="font-medium">{settings.mode} Mode Active</p>
                      <p className="text-sm text-muted-foreground">
                        {settings.mode === 'FUNNY' 
                          ? 'Speed ramps, vibrant colors' 
                          : settings.mode === 'FLEX' 
                            ? 'Slow-mo, cinematic effects' 
                            : 'Clean cuts, clear audio'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentStep('settings')}
                  >
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'detect' && currentVideoId && (
          <EnhancedEventDetector
            videoId={currentVideoId}
            mode={settings.mode}
            sensitivity={settings.audioSensitivity}
            onDetectionComplete={handleDetectionComplete}
          />
        )}

        {currentStep === 'edit' && currentVideoId && (
          <ProClipEditor
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
