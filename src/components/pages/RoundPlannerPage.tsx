/**
 * Round-by-Round Planner - Pre-match strategy planning
 * Plan each round with site, buy type, and linked strategies
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MAPS } from '@/lib/valorantData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Save, Plus, Trash2, Loader2, ChevronDown, ChevronUp,
  Sword, Shield, DollarSign, Coins, Banknote
} from 'lucide-react';
import { toast } from 'sonner';

interface PlannedRound {
  round: number;
  side: 'attack' | 'defense';
  site: string;
  buyType: 'eco' | 'half' | 'full' | 'bonus';
  strategyId?: string;
  notes?: string;
}

interface Strategy {
  id: string;
  map: string;
  site: string;
  side: string;
  title: string | null;
}

const BUY_TYPES = [
  { id: 'eco', label: 'Eco', icon: Coins, color: 'text-red-500' },
  { id: 'half', label: 'Half', icon: DollarSign, color: 'text-yellow-500' },
  { id: 'full', label: 'Full', icon: Banknote, color: 'text-green-500' },
  { id: 'bonus', label: 'Bonus', icon: DollarSign, color: 'text-blue-500' },
];

export function RoundPlannerPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedMap, setSelectedMap] = useState(MAPS[0].name);
  const [planTitle, setPlanTitle] = useState('');
  const [rounds, setRounds] = useState<PlannedRound[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  // Initialize 24 rounds (12 each half)
  useEffect(() => {
    const initialRounds: PlannedRound[] = [];
    
    // First half - Attack (rounds 1-12)
    for (let i = 1; i <= 12; i++) {
      initialRounds.push({
        round: i,
        side: 'attack',
        site: 'A',
        buyType: i === 1 ? 'eco' : 'full',
      });
    }
    
    // Second half - Defense (rounds 13-24)
    for (let i = 13; i <= 24; i++) {
      initialRounds.push({
        round: i,
        side: 'defense',
        site: 'A',
        buyType: i === 13 ? 'eco' : 'full',
      });
    }
    
    setRounds(initialRounds);
  }, []);

  // Load team strategies
  useEffect(() => {
    if (!teamId) return;
    
    async function loadStrategies() {
      const { data } = await supabase
        .from('strategies')
        .select('id, map, site, side, title')
        .eq('team_id', teamId)
        .eq('map', selectedMap);
      
      if (data) {
        setStrategies(data);
      }
    }
    
    loadStrategies();
  }, [teamId, selectedMap]);

  const updateRound = (roundNum: number, updates: Partial<PlannedRound>) => {
    setRounds(prev => prev.map(r => 
      r.round === roundNum ? { ...r, ...updates } : r
    ));
  };

  const savePlan = async () => {
    if (!user || !teamId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('round_plans')
        .insert({
          team_id: teamId,
          creator_id: user.id,
          map: selectedMap,
          side: 'attack' as const,
          title: planTitle || `${selectedMap} Plan`,
          rounds: JSON.stringify(rounds),
        });
      
      if (error) throw error;
      
      toast.success('Round plan saved!');
      navigate(`/coach/${teamId}`);
    } catch (e) {
      console.error('Failed to save plan:', e);
      toast.error('Failed to save plan');
    } finally {
      setIsSaving(false);
    }
  };

  const getSitesForMap = (mapName: string): string[] => {
    const threesSiteMaps = ['Haven', 'Lotus'];
    return threesSiteMaps.includes(mapName) ? ['A', 'B', 'C'] : ['A', 'B'];
  };

  const sites = getSitesForMap(selectedMap);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl">Round Planner</h2>
          <p className="text-sm text-muted-foreground">Plan your match round by round</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={savePlan} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Plan
          </Button>
        </div>
      </div>

      {/* Plan Settings */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Plan Title</label>
              <Input
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                placeholder="e.g., vs Team Alpha"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Map</label>
              <Select value={selectedMap} onValueChange={setSelectedMap}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAPS.map(map => (
                    <SelectItem key={map.id} value={map.name}>{map.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Round Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attack Half */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sword className="w-5 h-5 text-red-500" />
              Attack Half (Rounds 1-12)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rounds.filter(r => r.round <= 12).map(round => (
              <RoundRow
                key={round.round}
                round={round}
                sites={sites}
                strategies={strategies.filter(s => s.side === 'attack')}
                isExpanded={expandedRound === round.round}
                onToggleExpand={() => setExpandedRound(
                  expandedRound === round.round ? null : round.round
                )}
                onUpdate={(updates) => updateRound(round.round, updates)}
              />
            ))}
          </CardContent>
        </Card>

        {/* Defense Half */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Defense Half (Rounds 13-24)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rounds.filter(r => r.round >= 13).map(round => (
              <RoundRow
                key={round.round}
                round={round}
                sites={sites}
                strategies={strategies.filter(s => s.side === 'defense')}
                isExpanded={expandedRound === round.round}
                onToggleExpand={() => setExpandedRound(
                  expandedRound === round.round ? null : round.round
                )}
                onUpdate={(updates) => updateRound(round.round, updates)}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Round Row Component
interface RoundRowProps {
  round: PlannedRound;
  sites: string[];
  strategies: Strategy[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<PlannedRound>) => void;
}

function RoundRow({ round, sites, strategies, isExpanded, onToggleExpand, onUpdate }: RoundRowProps) {
  const buyType = BUY_TYPES.find(b => b.id === round.buyType);
  const BuyIcon = buyType?.icon || DollarSign;
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/20"
        onClick={onToggleExpand}
      >
        <Badge variant="outline" className="w-12 justify-center">
          R{round.round}
        </Badge>
        
        <div className="flex items-center gap-2 flex-1">
          {/* Buy Type */}
          <Badge variant="secondary" className={`gap-1 ${buyType?.color}`}>
            <BuyIcon className="w-3 h-3" />
            {buyType?.label}
          </Badge>
          
          {/* Site */}
          <Badge variant="outline">
            {round.site}
          </Badge>
          
          {/* Strategy */}
          {round.strategyId && (
            <Badge>
              Linked
            </Badge>
          )}
        </div>
        
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      
      {isExpanded && (
        <div className="p-3 pt-0 space-y-3 border-t bg-secondary/10">
          <div className="grid grid-cols-3 gap-3">
            {/* Buy Type */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Buy</label>
              <Select 
                value={round.buyType} 
                onValueChange={(v) => onUpdate({ buyType: v as PlannedRound['buyType'] })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUY_TYPES.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Site */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Site</label>
              <Select 
                value={round.site} 
                onValueChange={(v) => onUpdate({ site: v })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Strategy */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Strategy</label>
              <Select 
                value={round.strategyId || ''} 
                onValueChange={(v) => onUpdate({ strategyId: v || undefined })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {strategies.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title || `${s.site} Exec`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
            <Input
              value={round.notes || ''}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Round notes..."
              className="h-8"
            />
          </div>
        </div>
      )}
    </div>
  );
}
