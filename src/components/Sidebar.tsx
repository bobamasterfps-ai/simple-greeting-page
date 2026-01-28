import { 
  LayoutDashboard, 
  Layers, 
  List, 
  BarChart3, 
  Settings, 
  Heart,
  Zap,
  Crosshair,
  Brain,
  Video,
  FolderOpen,
  Users,
  Film,
  ClipboardList
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'autostat', label: 'AutoStat AI', icon: Zap, highlight: true },
  { id: 'library', label: 'Strategy Library', icon: FolderOpen },
  { id: 'lineups', label: 'Lineups', icon: Crosshair },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'shorts', label: 'Shorts Generator', icon: Film },
  { id: 'overlay', label: 'Overlay', icon: Layers },
  { id: 'session', label: 'Session', icon: List },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'coach', label: 'AI Coach', icon: Brain },
  { id: 'clips', label: 'Clip Analysis', icon: Video },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'creator', label: 'Creator', icon: Heart },
];

export function Sidebar({ activePage, onPageChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] glass-strong border-r border-border/30 z-50">
      {/* Logo */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-6 h-6 text-background" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-wider text-foreground">
              SPIKES
            </h1>
            <p className="text-xs text-muted-foreground tracking-widest">OVERLAY</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const isHighlight = 'highlight' in item && item.highlight;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`nav-item w-full ${isActive ? 'active' : ''} ${isHighlight && !isActive ? 'ring-1 ring-primary/50 bg-primary/10' : ''}`}
            >
              <Icon className={`w-5 h-5 ${isHighlight ? 'text-primary' : ''}`} />
              <span className="font-medium">{item.label}</span>
              {isHighlight && !isActive && (
                <span className="ml-auto text-[10px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded">NEW</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/30">
        <div className="glass rounded-lg p-3">
          <p className="text-xs text-muted-foreground text-center">
            Made with <span className="text-destructive">♥</span> by BOBAMASTER
          </p>
        </div>
      </div>
    </aside>
  );
}
