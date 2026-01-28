/**
 * Strategy Library Page - Folder view of saved strategies
 * Grouped by map with ratings, win-rate, and actions
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStrategies, SavedStrategy } from '@/hooks/useStrategies';
import { AuthModal } from '@/components/AuthModal';
import { RatingModal } from '@/components/RatingModal';
import { MAPS } from '@/lib/valorantData';
import { getMapConfig } from '@/lib/mapConfig';
import { RANKS, Rank } from '@/lib/rankModifiers';

// Helper to get local map image
function getLocalMapImage(mapName: string): string {
  const config = getMapConfig(mapName);
  return config?.image || `/maps/${mapName.toLowerCase()}.png`;
}
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FolderOpen, 
  Star, 
  TrendingUp, 
  Lock, 
  Globe, 
  Users, 
  Play,
  Trash2,
  Share2,
  Eye,
  Loader2,
  Sparkles,
  ChevronRight,
  Sword,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

// Group strategies by map
function groupByMap(strategies: SavedStrategy[]): Record<string, SavedStrategy[]> {
  return strategies.reduce((acc, s) => {
    const map = s.map;
    if (!acc[map]) acc[map] = [];
    acc[map].push(s);
    return acc;
  }, {} as Record<string, SavedStrategy[]>);
}

function StrategyCard({ 
  strategy, 
  onPlay, 
  onDelete, 
  onShare,
  onRate,
  onChangeVisibility,
}: { 
  strategy: SavedStrategy;
  onPlay: () => void;
  onDelete: () => void;
  onShare: () => void;
  onRate: () => void;
  onChangeVisibility: (visibility: 'private' | 'team' | 'public') => void;
}) {
  const mapData = MAPS.find(m => m.name.toLowerCase() === strategy.map.toLowerCase());
  
  return (
    <div className="glass rounded-xl p-4 hover:border-primary/30 transition-all group">
      <div className="flex gap-4">
        {/* Map thumbnail - Using LOCAL images */}
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
          <img 
            src={getLocalMapImage(strategy.map)} 
            alt={strategy.map} 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold truncate">
              {strategy.title || `${strategy.map} ${strategy.site}`}
            </h4>
            {strategy.locked && (
              <Lock className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Badge variant={strategy.side === 'attack' ? 'destructive' : 'default'} className="text-xs">
              {strategy.side === 'attack' ? (
                <><Sword className="w-3 h-3 mr-1" /> ATK</>
              ) : (
                <><Shield className="w-3 h-3 mr-1" /> DEF</>
              )}
            </Badge>
            <span>{strategy.site} Site</span>
            <span>•</span>
            <span>{strategy.rank}</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            {strategy.avg_rating !== undefined && strategy.avg_rating > 0 && (
              <button 
                onClick={onRate}
                className="flex items-center gap-1 text-yellow-500 hover:text-yellow-400"
              >
                <Star className="w-3 h-3 fill-current" />
                <span>{strategy.avg_rating}</span>
              </button>
            )}
            {strategy.win_rate !== undefined && strategy.win_rate > 0 && (
              <div className="flex items-center gap-1 text-green-500">
                <TrendingUp className="w-3 h-3" />
                <span>{strategy.win_rate}% WR</span>
              </div>
            )}
            
            {/* Visibility selector */}
            <Select 
              value={strategy.visibility} 
              onValueChange={(v) => onChangeVisibility(v as 'private' | 'team' | 'public')}
            >
              <SelectTrigger className="h-6 w-24 text-xs">
                <div className="flex items-center gap-1">
                  {strategy.visibility === 'public' && <Globe className="w-3 h-3" />}
                  {strategy.visibility === 'team' && <Users className="w-3 h-3" />}
                  {strategy.visibility === 'private' && <Lock className="w-3 h-3" />}
                  <span className="capitalize">{strategy.visibility}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3" /> Private
                  </div>
                </SelectItem>
                <SelectItem value="team">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3" /> Team
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Public
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="default" onClick={onPlay}>
            <Play className="w-3 h-3 mr-1" />
            Play
          </Button>
          <Button size="sm" variant="outline" onClick={onShare}>
            <Share2 className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StrategyLibraryPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { 
    strategies, 
    isLoading, 
    fetchUserStrategies, 
    fetchPublicStrategies, 
    deleteStrategy,
    rateStrategy,
    updateVisibility,
  } = useStrategies();
  
  const [showAuth, setShowAuth] = useState(false);
  const [expandedMap, setExpandedMap] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'my' | 'community'>('my');
  const [mapFilter, setMapFilter] = useState<string>('all');
  const [sideFilter, setSideFilter] = useState<string>('all');
  const [rankFilter, setRankFilter] = useState<string>('all');
  
  // Rating modal
  const [showRating, setShowRating] = useState(false);
  const [ratingStrategy, setRatingStrategy] = useState<SavedStrategy | null>(null);
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === 'my' && user) {
      fetchUserStrategies({
        map: mapFilter !== 'all' ? mapFilter : undefined,
        side: sideFilter !== 'all' ? sideFilter : undefined,
        rank: rankFilter !== 'all' ? rankFilter : undefined,
      });
    } else if (viewMode === 'community') {
      fetchPublicStrategies({
        map: mapFilter !== 'all' ? mapFilter : undefined,
        side: sideFilter !== 'all' ? sideFilter : undefined,
        rank: rankFilter !== 'all' ? rankFilter : undefined,
      });
    }
  }, [viewMode, user, mapFilter, sideFilter, rankFilter, fetchUserStrategies, fetchPublicStrategies]);

  const groupedStrategies = groupByMap(strategies);
  const mapNames = Object.keys(groupedStrategies).sort();

  const handlePlay = (strategy: SavedStrategy) => {
    sessionStorage.setItem('currentStrategy', JSON.stringify({
      strategy: strategy.json_data,
      agents: [],
      rank: strategy.rank,
    }));
    navigate('/autostat/play');
  };

  const handleShare = (strategy: SavedStrategy) => {
    const url = `${window.location.origin}/strategy/${strategy.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleRate = (strategy: SavedStrategy) => {
    setRatingStrategy(strategy);
    setShowRating(true);
  };

  const handleSubmitRating = async (rating: number, worked?: boolean) => {
    if (ratingStrategy) {
      await rateStrategy(ratingStrategy.id, rating, worked);
      // Refresh list
      if (viewMode === 'my' && user) {
        fetchUserStrategies();
      } else {
        fetchPublicStrategies();
      }
    }
  };

  const handleDelete = async (id: string) => {
    await deleteStrategy(id);
    setDeleteConfirm(null);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display font-bold text-2xl">Strategy Library</h2>
          <p className="text-sm text-muted-foreground">
            {viewMode === 'my' ? 'Your saved strategies' : 'Community strategies'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            <Button 
              variant={viewMode === 'my' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('my')}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              My Strats
            </Button>
            <Button 
              variant={viewMode === 'community' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('community')}
            >
              <Globe className="w-4 h-4 mr-2" />
              Community
            </Button>
          </div>
          
          <Button onClick={() => navigate('/autostat')}>
            <Sparkles className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={mapFilter} onValueChange={setMapFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Maps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Maps</SelectItem>
            {MAPS.map(map => (
              <SelectItem key={map.id} value={map.name}>{map.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sideFilter} onValueChange={setSideFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Sides" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sides</SelectItem>
            <SelectItem value="attack">Attack</SelectItem>
            <SelectItem value="defense">Defense</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={rankFilter} onValueChange={setRankFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Ranks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ranks</SelectItem>
            {RANKS.map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {!user && viewMode === 'my' ? (
        <div className="glass rounded-xl p-12 flex flex-col items-center justify-center gap-4">
          <Lock className="w-12 h-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Login Required</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Create an account to save your strategies, rate community strats, and join teams.
          </p>
          <Button onClick={() => setShowAuth(true)}>
            Sign In to Continue
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : strategies.length === 0 ? (
        <div className="glass rounded-xl p-12 flex flex-col items-center justify-center gap-4">
          <Eye className="w-12 h-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No strategies yet</h3>
          <p className="text-muted-foreground text-center">
            {viewMode === 'my' 
              ? 'Generate your first strategy to get started!'
              : 'No community strategies match your filters.'
            }
          </p>
          {viewMode === 'my' && (
            <Button onClick={() => navigate('/autostat')}>
              <Sparkles className="w-4 h-4 mr-2" />
              Create Strategy
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {mapNames.map(mapName => {
            const mapStrategies = groupedStrategies[mapName];
            const isExpanded = expandedMap === mapName || expandedMap === null;
            const mapData = MAPS.find(m => m.name.toLowerCase() === mapName.toLowerCase());
            
            return (
              <div key={mapName} className="glass rounded-xl overflow-hidden">
                {/* Map header */}
                <button
                  onClick={() => setExpandedMap(isExpanded && expandedMap !== null ? null : mapName)}
                  className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={getLocalMapImage(mapName)} 
                      alt={mapName} 
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="text-left">
                      <h3 className="font-semibold">{mapName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {mapStrategies.length} {mapStrategies.length === 1 ? 'strategy' : 'strategies'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
                
                {/* Strategies */}
                {isExpanded && (
                  <div className="p-4 pt-0 space-y-3">
                    {mapStrategies.map(strategy => (
                      <StrategyCard
                        key={strategy.id}
                        strategy={strategy}
                        onPlay={() => handlePlay(strategy)}
                        onDelete={() => setDeleteConfirm(strategy.id)}
                        onShare={() => handleShare(strategy)}
                        onRate={() => handleRate(strategy)}
                        onChangeVisibility={(v) => updateVisibility(strategy.id, v)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
      
      <RatingModal
        open={showRating}
        onOpenChange={setShowRating}
        onSubmit={handleSubmitRating}
        strategyTitle={ratingStrategy?.title || undefined}
      />
      
      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Strategy?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The strategy will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
