/**
 * Fullscreen Strategy Viewer - Cinematic Mode
 * Dedicated route for viewing strategies without UI clutter
 * Perfect for second monitor / streaming / coaching
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CanvasStrategyRenderer } from '@/components/CanvasStrategyRenderer';
import { StrategyData } from '@/lib/strategyTypes';
import { AGENTS, Agent } from '@/lib/valorantData';
import { Rank } from '@/lib/rankModifiers';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Maximize, Minimize } from 'lucide-react';

export function StrategyFullscreenPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [rank, setRank] = useState<Rank>('Diamond');
  const [isActualFullscreen, setIsActualFullscreen] = useState(false);

  useEffect(() => {
    // Get strategy from URL params or sessionStorage
    const strategyData = searchParams.get('data');
    const agentNames = searchParams.get('agents');
    const rankParam = searchParams.get('rank');
    
    if (strategyData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(strategyData));
        setStrategy(parsed);
      } catch (e) {
        console.error('Failed to parse strategy data', e);
      }
    } else {
      // Try sessionStorage
      const stored = sessionStorage.getItem('currentStrategy');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setStrategy(parsed.strategy);
          setAgents(parsed.agents || []);
          if (parsed.rank) setRank(parsed.rank);
        } catch (e) {
          console.error('Failed to parse stored strategy', e);
        }
      }
    }

    if (agentNames) {
      const names = agentNames.split(',');
      const foundAgents = names
        .map(name => AGENTS.find(a => a.name.toLowerCase() === name.toLowerCase()))
        .filter((a): a is Agent => a !== undefined);
      setAgents(foundAgents);
    }
    
    if (rankParam) {
      setRank(rankParam as Rank);
    }
  }, [searchParams]);

  // Handle actual browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsActualFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsActualFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsActualFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!strategy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No strategy loaded</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Control buttons */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/')}
          className="bg-background/80 backdrop-blur"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleFullscreen}
          className="bg-background/80 backdrop-blur"
        >
          {isActualFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Fullscreen renderer */}
      <div className="h-screen">
        <CanvasStrategyRenderer
          strategy={strategy}
          selectedAgents={agents}
          mapName={strategy.map}
          rank={rank}
          isFullscreen={true}
          onClose={() => navigate('/')}
        />
      </div>
    </div>
  );
}
