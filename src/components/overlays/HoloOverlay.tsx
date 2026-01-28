import { getRankInfo } from '@/lib/overlayThemes';
import { useEffect, useState } from 'react';

interface HoloOverlayProps {
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

export function HoloOverlay({
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
}: HoloOverlayProps) {
  const rankInfo = getRankInfo(tierId);
  const [showFlash, setShowFlash] = useState(false);
  
  useEffect(() => {
    if (isAnimating && lastResult) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, lastResult]);

  // Circular progress calculation
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (rr / 100) * circumference;

  return (
    <div 
      className="relative w-[400px] h-[180px] overflow-hidden font-display"
      style={{
        background: transparent 
          ? 'rgba(10, 15, 30, 0.4)' 
          : 'linear-gradient(180deg, rgba(10, 15, 30, 0.95), rgba(20, 25, 45, 0.95))',
        backdropFilter: 'blur(24px)',
        borderRadius: '20px',
        border: '1px solid rgba(100, 200, 255, 0.2)',
        boxShadow: '0 0 40px rgba(100, 200, 255, 0.1), inset 0 0 60px rgba(100, 200, 255, 0.03)',
      }}
    >
      {/* Holographic shimmer */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(100, 200, 255, 0.05) 50%, transparent 70%)',
          animation: 'holo-shift 4s ease infinite',
        }}
      />

      {/* Flash */}
      {showFlash && (
        <div 
          className="absolute inset-0 pointer-events-none z-20 rounded-[20px]"
          style={{
            background: lastResult === 'win'
              ? 'radial-gradient(circle at center, rgba(100, 255, 150, 0.4) 0%, transparent 60%)'
              : 'radial-gradient(circle at center, rgba(255, 100, 100, 0.4) 0%, transparent 60%)',
            animation: 'holo-flash 0.6s ease-out',
          }}
        />
      )}

      <div className="relative p-5 h-full flex items-center gap-6">
        {/* Circular RR Gauge */}
        <div className="relative w-[100px] h-[100px] flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="rgba(100, 200, 255, 0.1)"
              strokeWidth="6"
            />
            {/* Progress ring */}
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke={rankInfo.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ 
                filter: `drop-shadow(0 0 10px ${rankInfo.color})`,
                transition: 'stroke-dashoffset 0.5s ease',
              }}
            />
            {/* Inner glow */}
            <circle
              cx="50" cy="50" r="35"
              fill={rankInfo.color + '10'}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{rr}</span>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: rankInfo.color }}>
              {tierName.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="glass rounded-lg p-3 text-center" style={{ background: 'rgba(60, 255, 120, 0.05)', border: '1px solid rgba(60, 255, 120, 0.2)' }}>
            <p className="text-2xl font-black text-success">{wins}</p>
            <p className="text-[10px] uppercase tracking-wider text-success/60">Wins</p>
          </div>
          <div className="glass rounded-lg p-3 text-center" style={{ background: 'rgba(255, 80, 80, 0.05)', border: '1px solid rgba(255, 80, 80, 0.2)' }}>
            <p className="text-2xl font-black text-destructive">{losses}</p>
            <p className="text-[10px] uppercase tracking-wider text-destructive/60">Losses</p>
          </div>
          <div className="glass rounded-lg p-3 text-center col-span-2" style={{ background: 'rgba(100, 200, 255, 0.05)', border: '1px solid rgba(100, 200, 255, 0.2)' }}>
            <p className={`text-xl font-black ${netRR >= 0 ? 'text-success' : 'text-destructive'}`}>
              {netRR >= 0 ? '+' : ''}{netRR}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-white/40">Net RR This Session</p>
          </div>
        </div>

        {/* Player tag */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium text-white/60 bg-white/5 border border-white/10">
          {username}#{tag}
        </div>

        {/* Last change indicator */}
        <div className={`absolute bottom-3 right-3 px-2 py-1 rounded text-sm font-bold ${lastChange >= 0 ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'}`}>
          {lastChange >= 0 ? '↑' : '↓'} {Math.abs(lastChange)}
        </div>
      </div>

      <style>{`
        @keyframes holo-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes holo-flash {
          0% { opacity: 1; transform: scale(0.95); }
          100% { opacity: 0; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
