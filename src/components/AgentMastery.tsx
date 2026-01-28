import { useOverlay } from '@/context/OverlayContext';
import { getAgentImage } from '@/lib/agentImages';

interface AgentMasteryProps {
  limit?: number;
}

export function AgentMastery({ limit = 6 }: AgentMasteryProps) {
  const { lifetimeStats } = useOverlay();

  if (!lifetimeStats || lifetimeStats.agentStats.length === 0) {
    return (
      <div className="glass rounded-xl p-4">
        <h3 className="font-display font-semibold text-sm mb-3">Agent Mastery</h3>
        <p className="text-muted-foreground text-xs text-center py-4">No agent data yet</p>
      </div>
    );
  }

  const agents = lifetimeStats.agentStats.slice(0, limit);
  const mostPlayed = lifetimeStats.mostPlayedAgent;

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-sm">Agent Mastery</h3>
        {mostPlayed && (
          <span className="text-[10px] text-muted-foreground">
            Most played: <span className="text-foreground font-medium">{mostPlayed}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {agents.map((agent, i) => {
          const isBest = agent.name === mostPlayed;
          const winRateProgress = agent.winRate / 100;

          return (
            <div 
              key={agent.name}
              className={`relative p-3 rounded-xl transition-all hover:scale-[1.02] ${
                isBest 
                  ? 'bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30' 
                  : 'bg-secondary/30 border border-transparent hover:border-border/50'
              }`}
            >
              {/* Agent Icon */}
              <div className="flex items-center gap-2 mb-2">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-background/50">
                  <img 
                    src={getAgentImage(agent.name)}
                    alt={agent.name}
                    className="w-full h-full object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  {/* Win rate ring */}
                  <svg 
                    className="absolute inset-0 w-full h-full" 
                    viewBox="0 0 40 40"
                    style={{ transform: 'rotate(-90deg)' }}
                  >
                    <circle
                      cx="20" cy="20" r="18"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="2"
                    />
                    <circle
                      cx="20" cy="20" r="18"
                      fill="none"
                      stroke={agent.winRate >= 55 ? 'hsl(var(--success))' : agent.winRate >= 45 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                      strokeWidth="2"
                      strokeDasharray={`${winRateProgress * 113} 113`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{agent.name}</p>
                  <p className="text-[10px] text-muted-foreground">{agent.matches} games</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-[10px]">
                <div>
                  <span className="text-muted-foreground">K/D:</span>
                  <span className="ml-1 font-bold text-foreground">{agent.kd.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">WR:</span>
                  <span className={`ml-1 font-bold ${agent.winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                    {agent.winRate}%
                  </span>
                </div>
              </div>

              {/* Best badge */}
              {isBest && (
                <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] font-bold rounded-full uppercase">
                  Main
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
