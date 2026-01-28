import { getRankInfo } from '@/lib/overlayThemes';
import { useEffect, useState } from 'react';

interface StreamerOverlayProps {
  rr: number;
  tierName: string;
  tierId: number;
  wins: number;
  losses: number;
  lastChange: number;
  netRR: number;
  username?: string;
  tag?: string;
  transparent?: boolean;
  showDonationBadge?: boolean;
  isAnimating?: boolean;
  lastResult?: 'win' | 'loss' | null;
}

export function StreamerOverlay({
  rr,
  tierName,
  tierId,
  wins,
  losses,
  lastChange,
  netRR,
  username = 'Player',
  tag = 'NA1',
  transparent = false,
  showDonationBadge = false,
  isAnimating = false,
  lastResult = null,
}: StreamerOverlayProps) {
  const rankInfo = getRankInfo(tierId);
  const [showFlash, setShowFlash] = useState(false);
  const [showWinParticles, setShowWinParticles] = useState(false);
  
  useEffect(() => {
    if (isAnimating && lastResult) {
      setShowFlash(true);
      if (lastResult === 'win') {
        setShowWinParticles(true);
        setTimeout(() => setShowWinParticles(false), 2000);
      }
      const timer = setTimeout(() => setShowFlash(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, lastResult]);

  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  return (
    <div 
      className="relative w-[520px] h-[140px] overflow-hidden font-display"
      style={{
        background: transparent 
          ? 'rgba(0, 0, 0, 0.5)' 
          : `linear-gradient(135deg, ${rankInfo.color}15 0%, rgba(0, 0, 0, 0.95) 50%, ${rankInfo.color}15 100%)`,
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: `2px solid ${rankInfo.color}40`,
        boxShadow: `0 0 30px ${rankInfo.color}20`,
      }}
    >
      {/* Animated border glow */}
      <div 
        className="absolute inset-0 rounded-[14px] pointer-events-none"
        style={{
          boxShadow: `inset 0 0 20px ${rankInfo.color}10`,
          animation: 'border-pulse 3s ease infinite',
        }}
      />

      {/* Win particles */}
      {showWinParticles && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-success"
              style={{
                left: `${10 + Math.random() * 80}%`,
                bottom: 0,
                animation: `particle-rise 1.5s ease-out forwards`,
                animationDelay: `${i * 0.1}s`,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      )}

      {/* Flash */}
      {showFlash && (
        <div 
          className="absolute inset-0 pointer-events-none z-20 rounded-[14px]"
          style={{
            background: lastResult === 'win'
              ? `linear-gradient(90deg, rgba(60, 255, 120, 0.3) 0%, transparent 50%)`
              : `linear-gradient(90deg, rgba(255, 60, 60, 0.3) 0%, transparent 50%)`,
            animation: 'stream-flash 0.8s ease-out',
          }}
        />
      )}

      <div className="relative p-4 h-full flex items-center gap-5">
        {/* Rank Badge with Progress Bar */}
        <div className="relative flex-shrink-0">
          <div 
            className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              background: `linear-gradient(180deg, ${rankInfo.color}20 0%, ${rankInfo.color}05 100%)`,
              border: `2px solid ${rankInfo.color}60`,
            }}
          >
            {/* RR progress bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${rr}%`, 
                  background: rankInfo.color,
                  boxShadow: `0 0 10px ${rankInfo.color}`,
                }}
              />
            </div>
            
            <span className="text-4xl font-black text-white">{rr}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: rankInfo.color }}>
              RR
            </span>
          </div>
        </div>

        {/* Center Stats */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-white">{tierName}</h2>
            <div className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white/70">
              {winRate}% WR
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20">
              <span className="text-2xl font-black text-success">{wins}</span>
              <span className="text-xs font-bold text-success/60 uppercase">W</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <span className="text-2xl font-black text-destructive">{losses}</span>
              <span className="text-xs font-bold text-destructive/60 uppercase">L</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${netRR >= 0 ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'} border`}>
              <span className={`text-2xl font-black ${netRR >= 0 ? 'text-success' : 'text-destructive'}`}>
                {netRR >= 0 ? '+' : ''}{netRR}
              </span>
              <span className="text-xs font-bold text-white/40 uppercase">Net</span>
            </div>
          </div>
        </div>

        {/* Right: Last Change */}
        <div className="flex flex-col items-end gap-2">
          <div className="text-xs text-white/50 font-medium">{username}#{tag}</div>
          <div 
            className={`px-4 py-3 rounded-xl text-center ${
              lastChange >= 0 
                ? 'bg-success/20 border-success/40' 
                : 'bg-destructive/20 border-destructive/40'
            } border`}
          >
            <span className={`text-xl font-black block ${lastChange >= 0 ? 'text-success' : 'text-destructive'}`}>
              {lastChange >= 0 ? '+' : ''}{lastChange}
            </span>
            <span className="text-[10px] uppercase text-white/40 font-bold">Last</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes border-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes particle-rise {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-100px) scale(0); opacity: 0; }
        }
        @keyframes stream-flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
