import { getRankInfo } from '@/lib/overlayThemes';
import { useEffect, useState } from 'react';

interface ValorantOverlayProps {
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

export function ValorantOverlay({
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
}: ValorantOverlayProps) {
  const rankInfo = getRankInfo(tierId);
  const [showFlash, setShowFlash] = useState(false);
  const [flashType, setFlashType] = useState<'win' | 'loss' | null>(null);
  
  useEffect(() => {
    if (isAnimating && lastResult) {
      setFlashType(lastResult);
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, lastResult]);

  // Valorant-style red gradient
  const bgOpacity = transparent ? 0.5 : 0.95;

  return (
    <div 
      className="relative w-[450px] h-[160px] overflow-hidden font-body"
      style={{
        background: `linear-gradient(135deg, rgba(15, 25, 35, ${bgOpacity}) 0%, rgba(30, 15, 25, ${bgOpacity}) 100%)`,
        backdropFilter: 'blur(16px)',
        borderLeft: '4px solid #ff4655',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 0 60px rgba(255, 70, 85, 0.05)',
      }}
    >
      {/* Valorant-style diagonal line */}
      <div 
        className="absolute top-0 right-0 w-32 h-full opacity-20"
        style={{
          background: 'linear-gradient(135deg, transparent 45%, #ff4655 45%, #ff4655 55%, transparent 55%)',
        }}
      />

      {/* Flash effect */}
      {showFlash && (
        <div 
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: flashType === 'win' 
              ? 'linear-gradient(90deg, rgba(60, 255, 120, 0.3), transparent)'
              : 'linear-gradient(90deg, rgba(255, 70, 85, 0.4), transparent)',
            animation: 'val-flash 1s ease-out forwards',
          }}
        />
      )}

      <div className="relative p-5 h-full flex items-center gap-5">
        {/* Rank Shield */}
        <div className="relative flex-shrink-0">
          <svg width="80" height="90" viewBox="0 0 80 90" className="drop-shadow-lg">
            {/* Shield shape */}
            <path 
              d="M40 5 L75 20 L75 55 Q75 75 40 88 Q5 75 5 55 L5 20 Z" 
              fill={rankInfo.color + '20'}
              stroke={rankInfo.color}
              strokeWidth="2"
              style={{ filter: `drop-shadow(0 0 15px ${rankInfo.color}60)` }}
            />
            {/* Progress indicator at bottom */}
            <rect 
              x="15" y="70" 
              width="50" height="5" 
              rx="2" 
              fill="rgba(255,255,255,0.1)"
            />
            <rect 
              x="15" y="70" 
              width={rr / 2} height="5" 
              rx="2" 
              fill={rankInfo.color}
              style={{ filter: `drop-shadow(0 0 8px ${rankInfo.color})` }}
            />
          </svg>
          {/* RR centered in shield */}
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: '15px' }}>
            <span className="text-3xl font-display font-black text-white">{rr}</span>
            <span className="text-[9px] uppercase tracking-wider text-white/50">RR</span>
          </div>
        </div>

        {/* Middle: Rank & Stats */}
        <div className="flex-1">
          <p className="text-xs text-[#ff4655] font-semibold tracking-wider uppercase">Current Rank</p>
          <p className="text-xl font-display font-bold text-white mb-3">{tierName}</p>
          
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-success/10 border border-success/30">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-success font-bold text-sm">{wins}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-destructive/10 border border-destructive/30">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-destructive font-bold text-sm">{losses}</span>
            </div>
            <div className="px-3 py-1.5 rounded bg-white/5 border border-white/10">
              <span className={`font-bold text-sm ${lastChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                {lastChange >= 0 ? '↑' : '↓'} {Math.abs(lastChange)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Player */}
        <div className="text-right">
          <p className="text-white font-display font-bold text-sm">{username}</p>
          <p className="text-[#ff4655]/60 text-xs">#{tag}</p>
          <div className={`mt-3 px-4 py-2 rounded ${netRR >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
            <span className={`text-lg font-display font-bold ${netRR >= 0 ? 'text-success' : 'text-destructive'}`}>
              {netRR >= 0 ? '+' : ''}{netRR}
            </span>
            <span className="text-white/40 text-xs ml-1">NET</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes val-flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
