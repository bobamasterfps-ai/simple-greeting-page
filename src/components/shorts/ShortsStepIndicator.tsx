import { Upload, Zap, Scissors, FolderOpen, Settings, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ShortsStep = 'upload' | 'detect' | 'edit' | 'library' | 'settings';

interface ShortsStepIndicatorProps {
  currentStep: ShortsStep;
  onStepChange: (step: ShortsStep) => void;
  hasVideo: boolean;
  hasEvents: boolean;
}

const STEPS: { id: ShortsStep; label: string; icon: React.ElementType }[] = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'detect', label: 'Detect', icon: Zap },
  { id: 'edit', label: 'Edit', icon: Scissors },
  { id: 'library', label: 'Library', icon: FolderOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function ShortsStepIndicator({
  currentStep,
  onStepChange,
  hasVideo,
  hasEvents,
}: ShortsStepIndicatorProps) {
  const getCurrentIndex = () => STEPS.findIndex(s => s.id === currentStep);
  
  const isStepAccessible = (step: ShortsStep): boolean => {
    switch (step) {
      case 'upload':
        return true;
      case 'detect':
        return hasVideo;
      case 'edit':
        return hasVideo && hasEvents;
      case 'library':
        return true;
      case 'settings':
        return true;
      default:
        return false;
    }
  };

  const isStepComplete = (step: ShortsStep): boolean => {
    const currentIndex = getCurrentIndex();
    const stepIndex = STEPS.findIndex(s => s.id === step);
    
    if (step === 'upload') return hasVideo;
    if (step === 'detect') return hasEvents;
    if (step === 'library' || step === 'settings') return false;
    
    return stepIndex < currentIndex;
  };

  return (
    <div className="flex items-center justify-between bg-card/50 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-border/50">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isComplete = isStepComplete(step.id);
        const isAccessible = isStepAccessible(step.id);
        
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-initial">
            <button
              onClick={() => isAccessible && onStepChange(step.id)}
              disabled={!isAccessible}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                isActive && "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
                !isActive && isAccessible && "hover:bg-muted/80 text-muted-foreground hover:text-foreground",
                !isAccessible && "opacity-40 cursor-not-allowed",
                isComplete && !isActive && "text-primary"
              )}
            >
              <div className={cn(
                "relative",
                isComplete && !isActive && "text-primary"
              )}>
                {isComplete && !isActive ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className="hidden sm:inline text-sm font-medium">
                {step.label}
              </span>
            </button>
            
            {index < STEPS.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2 rounded-full min-w-[20px]",
                isComplete || (isActive && index < getCurrentIndex()) 
                  ? "bg-primary/60" 
                  : "bg-muted/40"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
