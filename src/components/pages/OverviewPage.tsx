import { useOverlay } from '@/context/OverlayContext';
import { PlayerSetup } from '@/components/PlayerSetup';
import { PlayerHero } from '@/components/PlayerHero';
import { ActivityFeed } from '@/components/ActivityFeed';
import { AgentMastery } from '@/components/AgentMastery';
import { Radio, TrendingUp, TrendingDown } from 'lucide-react';

export function OverviewPage() {
  const { 
    dailyStats,
    lifetimeStats,
    statsComparison,
    sessionDuration,
    connectionStatus,
    state,
    mmrData,
  } = useOverlay();

  const isConnected = connectionStatus === 'connected';

  // Format last match time
  const getLastMatchTime = () => {
    if (state.matchHistory.length === 0) return 'No matches';
    const lastMatch = state.matchHistory[0];
    if (!lastMatch) return 'No matches';
    const mins = Math.floor((Date.now() - lastMatch.timestamp) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m ago`;
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Player Hero Section */}
      <PlayerHero />

      {/* Core Stats Grid - Daily Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <div className="glass rounded-xl p-4 md:p-5 glass-card">
          <p className="text-xs text-muted-foreground mb-2">Net RR (Today)</p>
          <p className={`text-2xl md:text-3xl font-display font-bold ${
            dailyStats.netRR > 0 ? 'text-success' : dailyStats.netRR < 0 ? 'text-destructive' : 'text-foreground'
          }`}>
            {dailyStats.netRR > 0 ? '+' : ''}{dailyStats.netRR}
          </p>
        </div>
        
        <div className="glass rounded-xl p-4 md:p-5 glass-card">
          <p className="text-xs text-muted-foreground mb-2">Win Rate</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-display font-bold">{dailyStats.winRate}%</p>
            {statsComparison && (
              <span className={`text-xs ${statsComparison.winRateDiff >= 0 ? 'text-success' : 'text-destructive'}`}>
                {statsComparison.winRateDiff >= 0 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                {Math.abs(statsComparison.winRateDiff)}%
              </span>
            )}
          </div>
        </div>
        
        <div className="glass rounded-xl p-4 md:p-5 glass-card">
          <p className="text-xs text-muted-foreground mb-2">Matches</p>
          <p className="text-2xl md:text-3xl font-display font-bold">{dailyStats.matches}</p>
        </div>
        
        <div className="glass rounded-xl p-4 md:p-5 glass-card">
          <p className="text-xs text-muted-foreground mb-2">Duration</p>
          <p className="text-2xl md:text-3xl font-display font-bold">{sessionDuration}</p>
        </div>
        
        <div className="glass rounded-xl p-4 md:p-5 glass-card col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground mb-2">Last Match</p>
          <p className="text-2xl md:text-3xl font-display font-bold">{getLastMatchTime()}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Agent Mastery */}
        <div className="lg:col-span-7 space-y-6">
          <AgentMastery limit={6} />
          
          {/* K/D and Performance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2">K/D Today</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-display font-bold">{dailyStats.kd.toFixed(2)}</p>
                {statsComparison && (
                  <span className={`text-sm ${statsComparison.kdDiff >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {statsComparison.kdDiff >= 0 ? '+' : ''}{statsComparison.kdDiff.toFixed(2)} vs avg
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{dailyStats.kda}</p>
            </div>
            
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2">Lifetime K/D</p>
              <p className="text-3xl font-display font-bold">{lifetimeStats?.kd.toFixed(2) || '-'}</p>
              <p className="text-xs text-muted-foreground mt-1">{lifetimeStats?.matches || 0} matches</p>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="lg:col-span-5">
          <ActivityFeed />
        </div>
      </div>

      {/* Player Setup Card */}
      <div className="glass rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-lg">Player Setup</h3>
          {isConnected && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-success/30 text-success text-sm">
              <Radio className="w-3 h-3" />
              <span>Connected</span>
            </div>
          )}
        </div>
        <PlayerSetup hideHeader />
      </div>
    </div>
  );
}
