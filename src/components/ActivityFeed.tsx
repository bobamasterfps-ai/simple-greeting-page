import { useOverlay } from '@/context/OverlayContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Play, Pause, Trophy, Skull, Radio } from 'lucide-react';

export function ActivityFeed() {
  const { activityFeed } = useOverlay();

  const getIcon = (type: string) => {
    switch (type) {
      case 'win': return <Trophy className="w-4 h-4 text-success" />;
      case 'loss': return <Skull className="w-4 h-4 text-destructive" />;
      case 'rr': return <TrendingUp className="w-4 h-4 text-primary" />;
      case 'session': return <Radio className="w-4 h-4 text-muted-foreground" />;
      default: return <Radio className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const mins = Math.floor((Date.now() - timestamp) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  if (activityFeed.length === 0) {
    return (
      <div className="glass rounded-xl p-4">
        <h3 className="font-display font-semibold text-sm mb-3">Activity</h3>
        <p className="text-muted-foreground text-xs text-center py-4">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border/30">
        <h3 className="font-display font-semibold text-sm">Live Activity</h3>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="p-2 space-y-1">
          {activityFeed.map((activity) => (
            <div 
              key={activity.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/20 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.message}</p>
                <p className="text-[10px] text-muted-foreground">{formatTime(activity.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
