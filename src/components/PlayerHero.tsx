import { useOverlay } from '@/context/OverlayContext';
import { getRankIcon } from '@/lib/overlayThemes';
import { getAgentFullbody, getAgentImage } from '@/lib/agentImages';
import { Radio } from 'lucide-react';

export function PlayerHero() {
  const { 
    mmrData, 
    config, 
    connectionStatus, 
    dailyStats, 
    lastPlayedAgent,
    state,
  } = useOverlay();

  const isLive = connectionStatus === 'connected';
  const rankIcon = getRankIcon(mmrData?.tierId || 0);
  const agentArt = lastPlayedAgent ? getAgentFullbody(lastPlayedAgent) : null;
  const agentIcon = lastPlayedAgent ? getAgentImage(lastPlayedAgent) : null;

  return (
    <div 
      className="relative glass rounded-2xl overflow-hidden"
      style={{ height: '220px' }}
    >
      {/* Agent full-body art on left */}
      {agentArt && (
        <div className="absolute left-0 top-0 bottom-0 w-1/3 overflow-hidden pointer-events-none">
          <img 
            src={agentArt}
            alt={lastPlayedAgent || ''}
            className="absolute -left-16 -top-8 h-[130%] w-auto object-contain opacity-60"
            style={{ filter: 'drop-shadow(0 0 40px hsl(var(--primary) / 0.3))' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card" />
        </div>
      )}

      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      
      {/* Radial accent */}
      <div className="absolute inset-0 bg-radial-fade pointer-events-none" />

      {/* Content */}
      <div className="relative h-full flex items-center justify-between p-6 md:p-8">
        {/* Left: Spacer for agent art */}
        <div className="w-1/4" />

        {/* Center: Player info */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Riot ID */}
          <div className="flex items-center gap-2 mb-2">
            {agentIcon && (
              <img 
                src={agentIcon}
                alt={lastPlayedAgent || ''}
                className="w-6 h-6 rounded-full"
              />
            )}
            <h1 className="text-xl md:text-2xl font-display font-bold tracking-wide">
              {config.username || 'Player'}
              <span className="text-muted-foreground">#{config.tag || '0001'}</span>
            </h1>
          </div>

          {/* Rank display */}
          <div className="flex items-center gap-4">
            <img 
              src={rankIcon}
              alt={mmrData?.tierName || 'Rank'}
              className="w-16 h-16 md:w-20 md:h-20 object-contain animate-float"
              style={{ filter: 'drop-shadow(0 0 20px hsl(var(--primary) / 0.5))' }}
            />
            <div className="text-left">
              <p className="text-2xl md:text-3xl font-display font-bold text-foreground">
                {mmrData?.tierName || 'Unranked'}
              </p>
              <p className="text-3xl md:text-4xl font-display font-black text-foreground">
                {mmrData?.rr ?? 0} <span className="text-lg text-muted-foreground font-normal">RR</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Session stats */}
        <div className="flex flex-col items-end gap-3">
          {/* Live indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
            isLive 
              ? 'border-success/40 text-success bg-success/10' 
              : state.isPaused 
                ? 'border-muted-foreground/40 text-muted-foreground bg-muted/20'
                : 'border-destructive/40 text-destructive bg-destructive/10'
          }`}>
            <Radio className="w-3 h-3" />
            <span className="text-xs font-medium uppercase tracking-wider">
              {isLive ? 'Live' : state.isPaused ? 'Paused' : 'Offline'}
            </span>
          </div>

          {/* Session Net RR */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Session Net RR</p>
            <p className={`text-3xl font-display font-bold ${
              dailyStats.netRR > 0 ? 'text-success' : dailyStats.netRR < 0 ? 'text-destructive' : 'text-foreground'
            }`}>
              {dailyStats.netRR > 0 ? '+' : ''}{dailyStats.netRR}
            </p>
          </div>

          {/* Win/Loss */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-lg font-bold">
                <span className="text-success">{dailyStats.wins}W</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-destructive">{dailyStats.losses}L</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
