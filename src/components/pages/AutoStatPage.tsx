/**
 * AutoStat Creator - Visual Valorant Strategy Generator
 * 
 * Complete feature set:
 * - All competitive maps
 * - Rank-aware strategies
 * - Stream Mode, Eco Mode, Counter-Strat
 * - Voice narrator (EN/HI)
 * - Download animation with watermark
 * - Save to library
 * - Timeline-driven animations
 * - Fullscreen cinematic mode
 * - Copy-to-chat feature
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AGENTS, MAPS, ROLE_ICONS, Agent } from '@/lib/valorantData';
import { PLAYSTYLES, getMapGeometry, PlaystyleId } from '@/lib/mapGeometry';
import { StrategyData } from '@/lib/strategyTypes';
import { RANKS, Rank, getRankComplexity } from '@/lib/rankModifiers';
import { CanvasStrategyRenderer, CanvasRendererRef } from '@/components/CanvasStrategyRenderer';
import { AuthModal } from '@/components/AuthModal';
import { RatingModal } from '@/components/RatingModal';
import { useAuth } from '@/hooks/useAuth';
import { useStrategies } from '@/hooks/useStrategies';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Sword, Shield, Sparkles, Loader2, RotateCcw, Check, X, Maximize2, 
  Zap, Brain, Ghost, RefreshCw, DollarSign, FolderOpen, Save, User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Playstyle icons
const PLAYSTYLE_ICONS: Record<PlaystyleId, React.ReactNode> = {
  fast: <Zap className="w-3 h-3" />,
  default: <Brain className="w-3 h-3" />,
  split: <Maximize2 className="w-3 h-3" />,
  fake: <Ghost className="w-3 h-3" />,
  retake: <RefreshCw className="w-3 h-3" />,
  postplant: <DollarSign className="w-3 h-3" />,
};

export function AutoStatPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<CanvasRendererRef>(null);
  
  const { user, profile } = useAuth();
  const { saveStrategy } = useStrategies();
  
  // Selection state
  const [selectedMap, setSelectedMap] = useState(MAPS[0]);
  const [side, setSide] = useState<'attack' | 'defense'>('attack');
  const [playstyle, setPlaystyle] = useState<PlaystyleId>('default');
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [rank, setRank] = useState<Rank>('Diamond');
  
  // Strategy state
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  
  // Modals
  const [showAuth, setShowAuth] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleAgent = (agent: Agent) => {
    if (selectedAgents.find(a => a.id === agent.id)) {
      setSelectedAgents(selectedAgents.filter(a => a.id !== agent.id));
    } else if (selectedAgents.length < 5) {
      setSelectedAgents([...selectedAgents, agent]);
    } else {
      toast.error('Maximum 5 agents allowed');
    }
  };

  const clearAll = () => {
    setSelectedAgents([]);
    setStrategy(null);
  };

  // Pending generation flag - triggers generation after login
  const [pendingGeneration, setPendingGeneration] = useState(false);

  const generateStrategy = async () => {
    if (selectedAgents.length < 3) {
      toast.error('Select at least 3 agents');
      return;
    }

    // Require login for strategy generation
    if (!user) {
      setPendingGeneration(true);
      setShowAuth(true);
      return;
    }

    await executeGeneration();
  };

  const executeGeneration = async () => {
    setIsGenerating(true);
    setStrategy(null);
    setPendingGeneration(false);

    const mapGeo = getMapGeometry(selectedMap.name);
    const agentNames = selectedAgents.map(a => a.name);
    const playstyleInfo = PLAYSTYLES.find(p => p.id === playstyle);

    try {
      const { data, error } = await supabase.functions.invoke('generate-strategy', {
        body: {
          map: selectedMap.name,
          side,
          playstyle: playstyleInfo?.name || 'Slow Default',
          agents: agentNames,
          geometry: mapGeo,
          rank,
        }
      });

      if (error) throw error;

      // Parse the AI response
      const parsed = typeof data.strategy === 'string' 
        ? JSON.parse(data.strategy) 
        : data.strategy;

      // Ensure proper StrategyData format
      const strategyData: StrategyData = {
        map: parsed.map || selectedMap.name,
        site: parsed.site || 'A',
        side: parsed.side || side,
        duration: parsed.duration || 15,
        steps: parsed.steps || [],
        chatCall: parsed.chatCall || agentNames.map((a, i) => 
          `${a}: ${i === 0 ? 'smoke' : i === 1 ? 'flash' : 'push'}`
        ).join('\n'),
      };

      setStrategy(strategyData);
      toast.success('Strategy generated!');
    } catch (err) {
      console.error('Strategy generation error:', err);
      toast.error('Failed to generate strategy. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const openFullscreen = () => {
    if (strategy) {
      // Store in sessionStorage for fullscreen page
      sessionStorage.setItem('currentStrategy', JSON.stringify({
        strategy,
        agents: selectedAgents,
        rank,
      }));
      navigate('/autostat/play');
    }
  };

  const handleSave = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    
    if (!strategy) return;
    
    setIsSaving(true);
    try {
      const playstyleInfo = PLAYSTYLES.find(p => p.id === playstyle);
      await saveStrategy(strategy, {
        map: selectedMap.name,
        site: strategy.site,
        side,
        rank,
        playstyle: playstyleInfo?.name || 'Default',
        title: `${selectedMap.name} ${strategy.site} ${side}`,
        visibility: 'private',
      });
      
      // Show rating modal after save
      setShowRating(true);
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRate = async (rating: number, worked?: boolean) => {
    // Rating is handled by the modal callback
    toast.success('Thanks for rating!');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display font-bold text-2xl">AutoStat Creator</h2>
          <p className="text-sm text-muted-foreground">Visual strategy generator with animated executions</p>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="outline" size="sm" onClick={() => navigate('/library')}>
              <FolderOpen className="w-4 h-4 mr-2" />
              My Library
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowAuth(true)}>
              <User className="w-4 h-4 mr-2" />
              Login to Save
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={clearAll}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button 
            size="sm" 
            onClick={generateStrategy} 
            disabled={isGenerating || selectedAgents.length < 3}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Strat
          </Button>
        </div>
      </div>

      {/* Selection Panel */}
      <div className="glass rounded-xl p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium">
              Competitive Maps ({MAPS.length})
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {MAPS.map(map => (
                <button
                  key={map.id}
                  onClick={() => setSelectedMap(map)}
                  className={`p-2 rounded-lg border transition-all ${
                    selectedMap.id === map.id 
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img src={map.icon} alt={map.name} className="w-8 h-8 mx-auto rounded" />
                  <span className="text-[10px] block text-center mt-1 truncate">{map.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Side & Playstyle */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block font-medium">Side</label>
              <div className="flex gap-2">
                <Button
                  variant={side === 'attack' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSide('attack')}
                  className="flex-1"
                >
                  <Sword className="w-4 h-4 mr-2" />
                  Attack
                </Button>
                <Button
                  variant={side === 'defense' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSide('defense')}
                  className="flex-1"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Defense
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-2 block font-medium">Playstyle</label>
              <div className="flex flex-wrap gap-2">
                {PLAYSTYLES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPlaystyle(p.id)}
                    title={p.description}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      playstyle === p.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {PLAYSTYLE_ICONS[p.id]}
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rank Selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium">Target Rank</label>
            <Select value={rank} onValueChange={(v) => setRank(v as Rank)}>
              <SelectTrigger>
                <SelectValue placeholder="Select rank" />
              </SelectTrigger>
              <SelectContent>
                {RANKS.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              {getRankComplexity(rank)}
            </p>
          </div>

          {/* Selected Agents */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium">
              Team Composition ({selectedAgents.length}/5)
            </label>
            <div className="bg-secondary/30 rounded-lg p-3 min-h-[100px]">
              {selectedAgents.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {selectedAgents.map(agent => (
                    <div 
                      key={agent.id}
                      className="relative group"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-primary">
                        <img src={agent.icon} alt={agent.name} className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={() => toggleAgent(agent)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] block text-center mt-1 truncate">{agent.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Select agents from below
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Selection by Role */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-medium mb-4">Select Agents by Role</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {(['Duelist', 'Initiator', 'Controller', 'Sentinel'] as const).map(role => (
            <div key={role}>
              <div className="flex items-center gap-2 mb-3">
                <img src={ROLE_ICONS[role]} alt={role} className="w-5 h-5 opacity-70" />
                <span className="text-xs font-medium text-muted-foreground">{role}s</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {AGENTS.filter(a => a.role === role).map(agent => {
                  const isSelected = selectedAgents.find(a => a.id === agent.id);
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent)}
                      title={agent.name}
                      className={`relative w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected 
                          ? 'border-primary ring-2 ring-primary/30 scale-105' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img src={agent.icon} alt={agent.name} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Display */}
      {isGenerating ? (
        <div className="glass rounded-xl p-8 flex flex-col items-center justify-center min-h-[500px] gap-4">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Generating {rank} strategy...</p>
          <p className="text-sm text-muted-foreground">
            {selectedAgents.length} agents • {selectedMap.name} • {side.toUpperCase()}
          </p>
        </div>
      ) : strategy ? (
        <div className="glass rounded-xl overflow-hidden">
          <CanvasStrategyRenderer
            ref={canvasRef}
            strategy={strategy}
            selectedAgents={selectedAgents}
            mapName={selectedMap.name}
            rank={rank}
            onOpenFullscreen={openFullscreen}
            onSave={handleSave}
            canSave={!!user}
          />
        </div>
      ) : (
        <div className="glass rounded-xl p-12 flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center max-w-md">
            <h3 className="text-lg font-medium mb-2">Visual Strategy Generator</h3>
            <p className="text-muted-foreground text-sm">
              Select a map, side, playstyle, rank, and at least 3 agents. 
              AI will generate an animated execution with ability usage, positions, and timing.
            </p>
          </div>
        </div>
      )}

      {/* Fullscreen Dialog - fallback if route not used */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-[1400px] h-[900px] p-0">
          {strategy && (
            <CanvasStrategyRenderer
              strategy={strategy}
              selectedAgents={selectedAgents}
              mapName={selectedMap.name}
              rank={rank}
              isFullscreen={true}
              onClose={() => setShowFullscreen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Auth Modal */}
      <AuthModal 
        open={showAuth} 
        onOpenChange={(open) => {
          setShowAuth(open);
          if (!open) setPendingGeneration(false);
        }}
        onSuccess={() => {
          if (pendingGeneration) {
            executeGeneration();
          } else if (strategy) {
            handleSave();
          }
        }}
      />

      {/* Rating Modal */}
      <RatingModal
        open={showRating}
        onOpenChange={setShowRating}
        onSubmit={handleRate}
        strategyTitle={strategy ? `${selectedMap.name} ${strategy.site} ${side}` : undefined}
      />
    </div>
  );
}
