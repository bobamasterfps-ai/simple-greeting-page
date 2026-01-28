/**
 * Strategy Rating Modal - Rate strategies and mark if they worked
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number, worked?: boolean) => void;
  strategyTitle?: string;
}

export function RatingModal({ open, onOpenChange, onSubmit, strategyTitle }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [worked, setWorked] = useState<boolean | null>(null);

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, worked ?? undefined);
      onOpenChange(false);
      // Reset
      setRating(0);
      setWorked(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate This Strategy</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {strategyTitle && (
            <p className="text-sm text-muted-foreground">{strategyTitle}</p>
          )}

          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-medium">How would you rate this strategy?</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'w-8 h-8 transition-colors',
                      (hoverRating || rating) >= star
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-muted-foreground'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Did it work? */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-medium">Did it work in-game?</p>
            <div className="flex gap-3">
              <Button
                variant={worked === true ? 'default' : 'outline'}
                size="lg"
                onClick={() => setWorked(true)}
                className={cn(
                  'flex-1',
                  worked === true && 'bg-green-600 hover:bg-green-700'
                )}
              >
                <ThumbsUp className="w-5 h-5 mr-2" />
                Yes, it worked!
              </Button>
              <Button
                variant={worked === false ? 'default' : 'outline'}
                size="lg"
                onClick={() => setWorked(false)}
                className={cn(
                  'flex-1',
                  worked === false && 'bg-red-600 hover:bg-red-700'
                )}
              >
                <ThumbsDown className="w-5 h-5 mr-2" />
                No, it failed
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            disabled={rating === 0}
          >
            Submit Rating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
