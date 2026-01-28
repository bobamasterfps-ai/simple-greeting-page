import { useState } from 'react';
import { AGENTS, MAPS, ROLE_ICONS, Agent } from '@/lib/valorantData';
import { getMapConfig } from '@/lib/mapConfig';
import { Button } from '@/components/ui/button';
import { Sword, Shield, Sparkles, Users, MapPin, Trash2, Plus, Loader2, Save, Play, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Helper to get local map image
function getMapImage(mapName: string): string {
  const config = getMapConfig(mapName);
  return config?.image || `/maps/${mapName.toLowerCase()}.png`;
}

interface PlacedAgent {
  id: string;
  agent: Agent;
  x: number;
  y: number;
  isAlly: boolean;
}

interface StrategyStep {
  id: number;
  agents: PlacedAgent[];
  description: string;
}

export function StrategyPage() {
  const [selectedMap, setSelectedMap] = useState(MAPS[0]);
  const [side, setSide] = useState<'attack' | 'defense'>('attack');
  const [placedAgents, setPlacedAgents] = useState<PlacedAgent[]>([]);
  const [draggedAgent, setDraggedAgent] = useState<Agent | null>(null);
  const [isAllyMode, setIsAllyMode] = useState(true);
  const [selectedSequence, setSelectedSequence] = useState(1);
  const [sequences, setSequences] = useState<StrategyStep[]>([{ id: 1, agents: [], description: '' }]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStrat, setGeneratedStrat] = useState<string | null>(null);
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  const handleDragStart = (agent: Agent) => {
    setDraggedAgent(agent);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggedAgent) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newAgent: PlacedAgent = {
      id: `${draggedAgent.id}-${Date.now()}`,
      agent: draggedAgent,
      x,
      y,
      isAlly: isAllyMode,
    };

    setPlacedAgents([...placedAgents, newAgent]);
    setDraggedAgent(null);
  };

  const removeAgent = (id: string) => {
    setPlacedAgents(placedAgents.filter(a => a.id !== id));
  };

  const clearAll = () => {
    setPlacedAgents([]);
    setGeneratedStrat(null);
  };

  const saveSequence = () => {
    const updated = sequences.map(s => 
      s.id === selectedSequence ? { ...s, agents: [...placedAgents] } : s
    );
    setSequences(updated);
    toast.success(`Sequence ${selectedSequence} saved`);
  };

  const loadSequence = (id: number) => {
    const seq = sequences.find(s => s.id === id);
    if (seq) {
      setPlacedAgents([...seq.agents]);
      setSelectedSequence(id);
    }
  };

  const addSequence = () => {
    const newId = sequences.length + 1;
    setSequences([...sequences, { id: newId, agents: [], description: '' }]);
    setSelectedSequence(newId);
    setPlacedAgents([]);
  };

  const generateStrategy = async () => {
    const allyAgents = placedAgents.filter(a => a.isAlly).map(a => a.agent.name);
    
    if (allyAgents.length === 0) {
      toast.error('Place at least one ally agent on the map');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          message: `Generate a Radiant-level ${side} strategy for ${selectedMap.name} with these agents: ${allyAgents.join(', ')}. Include:
• Entry/Hold positions
• Utility timing (in seconds)
• Who goes first
• Fallback plan
Format as numbered steps, max 6-8 bullet points.`,
          context: {
            map: selectedMap.name,
            agent: allyAgents[0],
            rank: 'Radiant',
            situation: side,
          }
        }
      });

      if (error) throw error;
      setGeneratedStrat(data.response);
      toast.success('Strategy generated!');
    } catch (err) {
      console.error('Strategy generation error:', err);
      toast.error('Failed to generate strategy');
    } finally {
      setIsGenerating(false);
    }
  };

  const allyAgents = placedAgents.filter(a => a.isAlly);
  const enemyAgents = placedAgents.filter(a => !a.isAlly);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl">Strategy Creator</h2>
          <p className="text-sm text-muted-foreground">Build and share Radiant-level strategies</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearAll}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button size="sm" onClick={generateStrategy} disabled={isGenerating || allyAgents.length === 0}>
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate Strat
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        {/* Map Selector */}
        <div className="glass rounded-lg p-3">
          <label className="text-xs text-muted-foreground mb-2 block">Map</label>
          <div className="relative">
            <button
              onClick={() => setShowAgentPicker(!showAgentPicker)}
              className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 min-w-[140px]"
            >
              <img src={selectedMap.icon} alt={selectedMap.name} className="w-6 h-6 rounded" />
              <span className="font-medium">{selectedMap.name}</span>
              <ChevronDown className="w-4 h-4 ml-auto" />
            </button>
            {showAgentPicker && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg p-2 z-50 grid grid-cols-3 gap-1 min-w-[200px]">
                {MAPS.map(map => (
                  <button
                    key={map.id}
                    onClick={() => { setSelectedMap(map); setShowAgentPicker(false); }}
                    className={`flex items-center gap-2 p-2 rounded hover:bg-secondary/50 ${selectedMap.id === map.id ? 'bg-secondary' : ''}`}
                  >
                    <img src={map.icon} alt={map.name} className="w-5 h-5 rounded" />
                    <span className="text-xs">{map.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Toggle */}
        <div className="glass rounded-lg p-3">
          <label className="text-xs text-muted-foreground mb-2 block">Side</label>
          <div className="flex gap-1">
            <Button
              variant={side === 'attack' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSide('attack')}
              className="gap-1"
            >
              <Sword className="w-4 h-4" />
              Attack
            </Button>
            <Button
              variant={side === 'defense' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSide('defense')}
              className="gap-1"
            >
              <Shield className="w-4 h-4" />
              Defense
            </Button>
          </div>
        </div>

        {/* Team Toggle */}
        <div className="glass rounded-lg p-3">
          <label className="text-xs text-muted-foreground mb-2 block">Placing</label>
          <div className="flex gap-1">
            <Button
              variant={isAllyMode ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setIsAllyMode(true)}
              className="gap-1 bg-success/20 hover:bg-success/30 text-success"
            >
              <Users className="w-4 h-4" />
              Ally
            </Button>
            <Button
              variant={!isAllyMode ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setIsAllyMode(false)}
              className="gap-1 bg-destructive/20 hover:bg-destructive/30 text-destructive"
            >
              <Users className="w-4 h-4" />
              Enemy
            </Button>
          </div>
        </div>

        {/* Sequence Steps */}
        <div className="glass rounded-lg p-3">
          <label className="text-xs text-muted-foreground mb-2 block">Sequence</label>
          <div className="flex gap-1">
            {sequences.map(seq => (
              <button
                key={seq.id}
                onClick={() => loadSequence(seq.id)}
                className={`w-8 h-8 rounded font-bold text-sm ${
                  selectedSequence === seq.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                {seq.id}
              </button>
            ))}
            <button
              onClick={addSequence}
              className="w-8 h-8 rounded bg-secondary hover:bg-secondary/80 flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
            <Button size="sm" variant="outline" onClick={saveSequence} className="ml-2">
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        {/* Map Canvas */}
        <div className="glass rounded-xl p-4">
          <div
            className="relative aspect-square bg-card rounded-lg overflow-hidden border border-border"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {/* Map Background - Using LOCAL images */}
            <img
              src={getMapImage(selectedMap.name)}
              alt={selectedMap.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:5%_5%]" />

            {/* Site Labels */}
            <div className="absolute top-[20%] right-[25%] text-2xl font-bold text-foreground/60">A</div>
            <div className="absolute top-[25%] left-[25%] text-2xl font-bold text-foreground/60">B</div>

            {/* Placed Agents */}
            {placedAgents.map((placed) => (
              <div
                key={placed.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${placed.x}%`, top: `${placed.y}%` }}
                onClick={() => removeAgent(placed.id)}
              >
                <div className={`relative w-12 h-12 rounded-full border-2 overflow-hidden ${
                  placed.isAlly ? 'border-success ring-2 ring-success/30' : 'border-destructive ring-2 ring-destructive/30'
                }`}>
                  <img
                    src={placed.agent.icon}
                    alt={placed.agent.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-foreground" />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap bg-background/80 px-1 rounded">
                  {placed.agent.name}
                </div>
                <button className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full hidden group-hover:flex items-center justify-center">
                  <span className="text-[10px]">×</span>
                </button>
              </div>
            ))}

            {/* Drag hint */}
            {placedAgents.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="glass rounded-lg p-4 text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Drag agents onto the map</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Agent Picker + Generated Strat */}
        <div className="space-y-4">
          {/* Agent Picker */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Agents</h3>
            
            {/* By Role */}
            {(['Duelist', 'Initiator', 'Controller', 'Sentinel'] as const).map(role => (
              <div key={role} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <img src={ROLE_ICONS[role]} alt={role} className="w-4 h-4 opacity-60" />
                  <span className="text-xs text-muted-foreground">{role}s</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {AGENTS.filter(a => a.role === role).map(agent => (
                    <div
                      key={agent.id}
                      draggable
                      onDragStart={() => handleDragStart(agent)}
                      className="w-10 h-10 rounded-lg overflow-hidden border border-border hover:border-primary cursor-grab active:cursor-grabbing transition-all hover:scale-110"
                    >
                      <img
                        src={agent.icon}
                        alt={agent.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Team Summary */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Team Composition</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-success">Allies ({allyAgents.length})</span>
                <div className="flex gap-1 flex-1">
                  {allyAgents.map(a => (
                    <img key={a.id} src={a.agent.icon} alt={a.agent.name} className="w-6 h-6 rounded-full border border-success" />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">Enemies ({enemyAgents.length})</span>
                <div className="flex gap-1 flex-1">
                  {enemyAgents.map(a => (
                    <img key={a.id} src={a.agent.icon} alt={a.agent.name} className="w-6 h-6 rounded-full border border-destructive" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Generated Strategy */}
          {generatedStrat && (
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Strategy
              </h3>
              <div className="text-sm text-foreground/80 whitespace-pre-wrap">
                {generatedStrat}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
