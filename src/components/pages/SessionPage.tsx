import { useOverlay } from '@/context/OverlayContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { getAgentImage } from '@/lib/agentImages';

export function SessionPage() {
  const { 
    state, 
    dailyStats,
    todayMatches,
    resetSession, 
    pauseSession, 
    resumeSession,
    fullMatchHistory,
    mmrData,
    statsComparison,
  } = useOverlay();

  // TODAY ONLY - Use todayMatches for session display
  const displayMatches = todayMatches.length > 0 
    ? todayMatches.map(m => ({
        id: m.id,
        result: m.result,
        map: m.map,
        score: m.score,
        rrChange: m.rrChange || 0,
        timestamp: m.timestamp,
        agent: m.agent,
        kills: m.kills,
        deaths: m.deaths,
        assists: m.assists,
      }))
    : state.matchHistory.length > 0 
      ? state.matchHistory 
      : fullMatchHistory.slice(0, 10).map(m => ({
          id: m.id,
          result: m.result,
          map: m.map,
          score: m.score,
          rrChange: m.rrChange || 0,
          timestamp: m.timestamp,
          agent: m.agent,
          kills: m.kills,
          deaths: m.deaths,
          assists: m.assists,
        }));

  const formatTime = (timestamp: number) => {
    const mins = Math.floor((Date.now() - timestamp) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m ago`;
  };

  const formatKDA = (match: typeof displayMatches[0]) => {
    return `${match.kills || 0}/${match.deaths || 0}/${match.assists || 0}`;
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-wide">Session Tracking</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Today's matches only</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => state.isPaused ? resumeSession() : pauseSession()}
          >
            {state.isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
            {state.isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="outline" onClick={resetSession}>
            <RotateCcw className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>
      </div>

      {/* Daily Stats Cards - Uses DAILY data only */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <div className="glass rounded-xl p-4 md:p-5">
          <p className="text-xs text-muted-foreground mb-2">Status</p>
          <Badge className={`${!state.isPaused ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'} border-0`}>
            {state.isPaused ? 'Paused' : 'Active'}
          </Badge>
        </div>
        
        <div className="glass rounded-xl p-4 md:p-5">
          <p className="text-xs text-muted-foreground mb-2">Wins / Losses</p>
          <p className="text-2xl md:text-3xl font-display font-bold">
            <span className="text-success">{dailyStats.wins}</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-destructive">{dailyStats.losses}</span>
          </p>
        </div>
        
        <div className="glass rounded-xl p-4 md:p-5">
          <p className="text-xs text-muted-foreground mb-2">Net RR</p>
          <p className={`text-2xl md:text-3xl font-display font-bold ${
            dailyStats.netRR > 0 ? 'text-success' : dailyStats.netRR < 0 ? 'text-destructive' : ''
          }`}>
            {dailyStats.netRR > 0 ? '+' : ''}{dailyStats.netRR}
          </p>
        </div>
        
        <div className="glass rounded-xl p-4 md:p-5">
          <p className="text-xs text-muted-foreground mb-2">Matches</p>
          <p className="text-2xl md:text-3xl font-display font-bold">{dailyStats.matches}</p>
        </div>

        <div className="glass rounded-xl p-4 md:p-5 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground mb-2">K/D Today</p>
          <p className="text-2xl md:text-3xl font-display font-bold">
            {dailyStats.kd.toFixed(2)}
            {statsComparison && (
              <span className={`text-sm ml-2 ${statsComparison.kdDiff >= 0 ? 'text-success' : 'text-destructive'}`}>
                ({statsComparison.kdDiff >= 0 ? '+' : ''}{statsComparison.kdDiff.toFixed(2)})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Current Rank Display */}
      {mmrData && (
        <div className="glass rounded-xl p-4 md:p-5">
          <div className="flex items-center gap-4">
            <img 
              src={`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${mmrData.tierId}/smallicon.png`}
              alt={mmrData.tierName}
              className="w-12 h-12 object-contain"
            />
            <div>
              <p className="text-foreground font-bold text-lg">{mmrData.tierName}</p>
              <p className="text-muted-foreground text-sm">
                {mmrData.rr} RR 
                <span className={`ml-2 ${mmrData.lastChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ({mmrData.lastChange >= 0 ? '+' : ''}{mmrData.lastChange} last game)
                </span>
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Win Rate Today</p>
              <p className="text-lg font-bold">{dailyStats.winRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Match History Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border/30">
          <h3 className="font-display font-semibold text-lg">Match History (Today)</h3>
        </div>

        {displayMatches.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No matches recorded today.</p>
            <p className="text-sm mt-1">Connect to the API and start tracking!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="px-4 md:px-6 py-4 text-left text-xs font-medium text-muted-foreground">Map</th>
                  <th className="px-4 md:px-6 py-4 text-left text-xs font-medium text-muted-foreground">Result</th>
                  <th className="px-4 md:px-6 py-4 text-left text-xs font-medium text-muted-foreground">RR</th>
                  <th className="px-4 md:px-6 py-4 text-left text-xs font-medium text-muted-foreground">K/D/A</th>
                  <th className="px-4 md:px-6 py-4 text-left text-xs font-medium text-muted-foreground">Agent</th>
                  <th className="px-4 md:px-6 py-4 text-left text-xs font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {displayMatches.map((match) => (
                  <tr 
                    key={match.id}
                    className="border-b border-border/20 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-4 md:px-6 py-4 font-medium">{match.map}</td>
                    <td className="px-4 md:px-6 py-4">
                      <Badge className={`${
                        match.result === 'win' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-destructive/20 text-destructive'
                      } border-0 text-xs uppercase`}>
                        {match.result}
                      </Badge>
                    </td>
                    <td className={`px-4 md:px-6 py-4 font-display font-bold ${
                      match.rrChange >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {match.rrChange >= 0 ? '+' : ''}{match.rrChange}
                    </td>
                    <td className="px-4 md:px-6 py-4 font-mono text-sm">{formatKDA(match)}</td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <img 
                          src={getAgentImage(match.agent || '')}
                          alt={match.agent}
                          className="w-5 h-5 rounded-full object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <span>{match.agent || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-muted-foreground text-sm">{formatTime(match.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
