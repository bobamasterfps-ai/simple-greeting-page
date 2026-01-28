import { 
  LayoutDashboard, 
  Layers, 
  Zap,
  BarChart3, 
  Settings, 
  Crosshair,
  Brain,
  MoreHorizontal,
  Users,
  Film,
  FolderOpen,
  Video
} from 'lucide-react';
import { useState } from 'react';

interface MobileNavProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const mainNavItems = [
  { id: 'overview', label: 'Home', icon: LayoutDashboard },
  { id: 'autostat', label: 'AutoStat', icon: Zap },
  { id: 'library', label: 'Library', icon: FolderOpen },
  { id: 'analytics', label: 'Stats', icon: BarChart3 },
];

const moreNavItems = [
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'shorts', label: 'Shorts', icon: Film },
  { id: 'lineups', label: 'Lineups', icon: Crosshair },
  { id: 'overlay', label: 'Overlay', icon: Layers },
  { id: 'coach', label: 'AI Coach', icon: Brain },
  { id: 'clips', label: 'Clips', icon: Video },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function MobileNav({ activePage, onPageChange }: MobileNavProps) {
  const [showMore, setShowMore] = useState(false);
  
  return (
    <>
      {/* More Menu Popup */}
      {showMore && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setShowMore(false)}
        >
          <div 
            className="absolute bottom-20 left-4 right-4 glass-strong rounded-xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-2">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPageChange(item.id);
                      setShowMore(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activePage === item.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary/50 text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/30 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
          
          {/* More Button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${
              moreNavItems.some(i => i.id === activePage)
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
