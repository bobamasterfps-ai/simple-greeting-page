/**
 * Shorts Generator - Create viral 9:16 vertical videos from gameplay
 * 100% Browser-Based using FFmpeg.wasm, Web Audio API, Canvas
 */
import { useState, useEffect, useCallback } from 'react';
import { Video, Upload, Zap, Scissors, FolderOpen, ArrowLeft } from 'lucide-react';
import { clipDBManager } from '@/lib/clipIndexedDB';
import type { GameEvent } from '@/types/clipTypes';
import { VideoUpload } from '@/components/clips/VideoUpload';
import { EventDetector } from '@/components/clips/EventDetector';
import { ClipEditor } from '@/components/clips/ClipEditor';
import { ClipLibrary } from '@/components/clips/ClipLibrary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Step = 'upload' | 'detect' | 'edit' | 'library';

export function ShortsGeneratorPage() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [detectedEvents, setDetectedEvents] = useState<GameEvent[]>([]);
  const [clipRefreshTrigger, setClipRefreshTrigger] = useState(0);
  const [initialized, setInitialized] = useState(false);

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

  const resetToUpload = useCallback(() => {
    setCurrentVideoId(null);
    setDetectedEvents([]);
    setCurrentStep('upload');
  }, []);

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
    { id: 'detect', label: 'Detect', icon: <Zap className="w-4 h-4" /> },
    { id: 'edit', label: 'Edit', icon: <Scissors className="w-4 h-4" /> },
    { id: 'library', label: 'Library', icon: <FolderOpen className="w-4 h-4" /> },
  ];

  const getCurrentStepIndex = () => steps.findIndex(s => s.id === currentStep);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            Shorts Generator
          </h2>
          <p className="text-sm text-muted-foreground">
            Create viral 9:16 clips — 100% browser-based, no uploads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            🔒 Private & Secure
          </Badge>
          <Badge variant="secondary" className="text-xs">
            No Server Upload
          </Badge>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between bg-card rounded-lg p-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => {
                // Only allow going back or to library
                if (step.id === 'library' || index < getCurrentStepIndex()) {
                  if (step.id === 'upload') {
                    resetToUpload();
                  } else {
                    setCurrentStep(step.id);
                  }
                }
              }}
              disabled={step.id !== 'library' && index > getCurrentStepIndex()}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === step.id
                  ? 'bg-primary text-primary-foreground'
                  : index < getCurrentStepIndex()
                  ? 'bg-secondary text-foreground hover:bg-secondary/80'
                  : 'text-muted-foreground'
              } ${
                step.id === 'library' ? 'cursor-pointer hover:bg-secondary/80' : ''
              }`}
            >
              {step.icon}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${
                index < getCurrentStepIndex() ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Back Button (when not on upload or library) */}
      {currentStep !== 'upload' && currentStep !== 'library' && (
        <Button variant="ghost" size="sm" onClick={resetToUpload}>
          <ArrowLeft className="w-4 h-4 mr-2" />
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
          <ClipEditor
            videoId={currentVideoId}
            events={detectedEvents}
            onClipGenerated={handleClipGenerated}
          />
        )}

        {currentStep === 'library' && (
          <ClipLibrary refreshTrigger={clipRefreshTrigger} />
        )}
      </div>

      {/* Quick Library Access (floating) */}
      {currentStep !== 'library' && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={() => setCurrentStep('library')}
            className="shadow-lg"
            size="lg"
          >
            <FolderOpen className="w-5 h-5 mr-2" />
            View Clips
          </Button>
        </div>
      )}
    </div>
  );
}
