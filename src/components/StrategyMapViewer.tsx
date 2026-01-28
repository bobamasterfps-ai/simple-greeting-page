/**
 * ValoPlant-style Strategy Map Viewer
 * Shows agents and abilities on the map with visual icons and arrows
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { AGENTS, MAPS, Agent, Ability } from '@/lib/valorantData';
import { MAP_GEOMETRY } from '@/lib/mapGeometry';
import { getMapConfig } from '@/lib/mapConfig';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Maximize2, X, Play, Pause, SkipForward } from 'lucide-react';

export interface AbilityAction {
  agent: string;
  ability: string;
  abilitySlot: 'Ability1' | 'Ability2' | 'Grenade' | 'Ultimate';
  from: [number, number];
  to?: [number, number];
  time: string;
  description: string;
}

export interface StrategyPosition {
  agent: string;
  position: [number, number];
  action: string;
  time: string;
}

export interface VisualStrategy {
  map: string;
  site: string;
  side: 'attack' | 'defense';
  positions: StrategyPosition[];
  abilities: AbilityAction[];
  steps: string[];
}

interface Props {
  strategy: VisualStrategy;
  selectedAgents: Agent[];
  mapName: string;
  onClose?: () => void;
  isFullscreen?: boolean;
}

export function StrategyMapViewer({ strategy, selectedAgents, mapName, onClose, isFullscreen = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const mapData = MAPS.find(m => m.name.toLowerCase() === mapName.toLowerCase());
  const mapConfig = getMapConfig(mapName);
  const mapGeo = MAP_GEOMETRY[mapName.toLowerCase()];

  // Get agent by name
  const getAgent = useCallback((name: string): Agent | undefined => {
    return selectedAgents.find(a => a.name.toLowerCase() === name.toLowerCase()) ||
           AGENTS.find(a => a.name.toLowerCase() === name.toLowerCase());
  }, [selectedAgents]);

  // Get ability icon
  const getAbilityIcon = useCallback((agentName: string, abilitySlot: string): string | undefined => {
    const agent = getAgent(agentName);
    if (!agent) return undefined;
    const ability = agent.abilities.find(a => a.slot === abilitySlot);
    return ability?.icon;
  }, [getAgent]);

  // Draw the strategy on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mapSrc = mapConfig?.image || mapData?.displayIcon;
    if (!mapSrc) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw map background
    const mapImg = new Image();
    mapImg.crossOrigin = 'anonymous';
    mapImg.src = mapSrc;
    
    mapImg.onload = () => {
      ctx.drawImage(mapImg, 0, 0, width, height);
      
      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(15, 17, 26, 0.3)';
      ctx.fillRect(0, 0, width, height);

      // Draw site labels
      if (mapGeo) {
        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        mapGeo.sites.forEach(site => {
          const x = (site.center[0] / 100) * width;
          const y = (site.center[1] / 100) * height;
          
          // Site circle
          ctx.beginPath();
          ctx.arc(x, y, 30, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(96, 165, 255, 0.3)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(96, 165, 255, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Site label
          ctx.fillStyle = '#ffffff';
          ctx.fillText(site.name, x, y);
        });
      }

      // Draw ability actions with arrows
      strategy.abilities.forEach((action, idx) => {
        const fromX = (action.from[0] / 100) * width;
        const fromY = (action.from[1] / 100) * height;
        
        if (action.to) {
          const toX = (action.to[0] / 100) * width;
          const toY = (action.to[1] / 100) * height;
          
          // Draw arrow
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.strokeStyle = '#00ff88';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // Arrowhead
          const angle = Math.atan2(toY - fromY, toX - fromX);
          const headLen = 15;
          ctx.beginPath();
          ctx.moveTo(toX, toY);
          ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = '#00ff88';
          ctx.fill();

          // Draw ability icon at target
          const abilityIcon = new Image();
          abilityIcon.crossOrigin = 'anonymous';
          const iconUrl = getAbilityIcon(action.agent, action.abilitySlot);
          if (iconUrl) {
            abilityIcon.src = iconUrl;
            abilityIcon.onload = () => {
              ctx.drawImage(abilityIcon, toX - 16, toY - 16, 32, 32);
            };
          }
        }
      });

      // Draw agent positions
      strategy.positions.forEach((pos, idx) => {
        const agent = getAgent(pos.agent);
        if (!agent) return;

        const x = (pos.position[0] / 100) * width;
        const y = (pos.position[1] / 100) * height;

        // Agent circle background
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, Math.PI * 2);
        ctx.fillStyle = strategy.side === 'attack' ? 'rgba(255, 68, 68, 0.8)' : 'rgba(68, 200, 255, 0.8)';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Load and draw agent icon
        const agentImg = new Image();
        agentImg.crossOrigin = 'anonymous';
        agentImg.src = agent.icon;
        agentImg.onload = () => {
          // Clip to circle
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, 24, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(agentImg, x - 24, y - 24, 48, 48);
          ctx.restore();
        };

        // Direction arrow
        ctx.beginPath();
        ctx.moveTo(x, y + 30);
        ctx.lineTo(x - 8, y + 42);
        ctx.lineTo(x + 8, y + 42);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });
    };
  }, [strategy, mapConfig, mapData, mapGeo, getAgent, getAbilityIcon]);

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= strategy.steps.length - 1) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying, strategy.steps.length]);

  const renderContent = () => (
    <div className={`flex flex-col ${isFullscreen ? 'h-full' : 'h-auto'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">{mapName.toUpperCase()}</span>
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              strategy.side === 'attack' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {strategy.side.toUpperCase()}
            </span>
          </div>
          <span className="text-muted-foreground">→ {strategy.site} Site</span>
        </div>
        <div className="flex items-center gap-2">
          {!isFullscreen && (
            <Button variant="outline" size="sm" onClick={() => setShowFullscreen(true)}>
              <Maximize2 className="w-4 h-4 mr-2" />
              Fullscreen
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex ${isFullscreen ? 'flex-1' : ''} gap-4 p-4`}>
        {/* Map Canvas */}
        <div className={`relative ${isFullscreen ? 'flex-1' : 'w-[600px]'} aspect-square bg-background rounded-lg overflow-hidden border border-border`}>
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            className="w-full h-full"
          />
          
          {/* Agent Legend */}
          <div className="absolute bottom-4 left-4 flex gap-2 bg-background/90 rounded-lg p-2">
            {selectedAgents.map(agent => (
              <div key={agent.id} className="flex items-center gap-1">
                <img src={agent.icon} alt={agent.name} className="w-6 h-6 rounded-full" />
                <span className="text-xs text-muted-foreground">{agent.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps Panel */}
        <div className={`${isFullscreen ? 'w-80' : 'w-64'} flex flex-col`}>
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(prev => Math.min(prev + 1, strategy.steps.length - 1))}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground ml-2">
              Step {currentStep + 1}/{strategy.steps.length}
            </span>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto">
            {strategy.steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  idx === currentStep
                    ? 'border-primary bg-primary/10'
                    : idx < currentStep
                    ? 'border-border bg-secondary/30 opacity-60'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === currentStep ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-sm">{step}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Ability Actions */}
          {strategy.abilities.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-2">Ability Usage</h4>
              <div className="flex flex-col gap-2">
                {strategy.abilities.map((ability, idx) => {
                  const agent = getAgent(ability.agent);
                  const abilityIcon = getAbilityIcon(ability.agent, ability.abilitySlot);
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                      {agent && <img src={agent.icon} alt={agent.name} className="w-6 h-6 rounded-full" />}
                      {abilityIcon && <img src={abilityIcon} alt={ability.ability} className="w-5 h-5" />}
                      <div className="flex-1">
                        <span className="text-xs font-medium">{ability.ability}</span>
                        <span className="text-xs text-muted-foreground block">{ability.description}</span>
                      </div>
                      <span className="text-xs text-primary">{ability.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!isFullscreen && renderContent()}
      
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-[1400px] h-[900px]">
          <StrategyMapViewer
            strategy={strategy}
            selectedAgents={selectedAgents}
            mapName={mapName}
            onClose={() => setShowFullscreen(false)}
            isFullscreen={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
