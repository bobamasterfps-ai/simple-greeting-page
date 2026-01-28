import { getRankInfo } from '@/lib/overlayThemes';
import { useEffect, useState } from 'react';

interface CyberpunkOverlayProps {
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

export function CyberpunkOverlay({
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
}: CyberpunkOverlayProps) {
  const rankInfo = getRankInfo(tierId);
  const [showFlash, setShowFlash] = useState(false);
  const [flashType, setFlashType] = useState<'win' | 'loss' | null>(null);
  const [pulseRR, setPulseRR] = useState(false);
  
  useEffect(() => {
    if (isAnimating && lastResult) {
      setFlashType(lastResult);
      setShowFlash(true);
      setPulseRR(true);
      const flashTimer = setTimeout(() => setShowFlash(false), 800);
      const pulseTimer = setTimeout(() => setPulseRR(false), 600);
      return () => {
        clearTimeout(flashTimer);
        clearTimeout(pulseTimer);
      };
    }
  }, [isAnimating, lastResult]);

  const rrPercent = rr;

  return (
    <div 
      className="relative w-[500px] h-[220px] overflow-hidden font-display"
      style={{
        background: transparent ? 'rgba(10, 10, 15, 0.5)' : 'linear-gradient(135deg, rgba(10, 10, 20, 0.95), rgba(20, 10, 30, 0.95))',
        backdropFilter: 'blur(20px)',
        clipPath: 'polygon(0 0, 95% 0, 100% 15%, 100% 100%, 5% 100%, 0 85%)',
        border: '1px solid rgba(255, 0, 100, 0.3)',
      }}
    >
      {/* Scanline effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.3) 2px, rgba(0, 0, 0, 0.3) 4px)',
        }}
      />

      {/* Neon border glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 30px ${rankInfo.color}40, 0 0 40px ${rankInfo.color}20`,
        }}
      />

      {/* Flash overlay */}
      {showFlash && (
        <div 
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: flashType === 'win' 
              ? 'radial-gradient(circle, rgba(60, 255, 120, 0.4) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(255, 50, 50, 0.4) 0%, transparent 70%)',
            animation: flashType === 'win' ? 'cyber-win 0.6s ease-out' : 'cyber-loss 0.5s steps(4)',
          }}
        />
      )}

      <div className="relative p-6 h-full flex items-center gap-6">
        {/* Left: Hexagonal Rank Display */}
        <div className="relative">
          <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-2xl">
            {/* Outer hexagon progress */}
            <polygon 
              points="50,5 90,27 90,73 50,95 10,73 10,27" 
              fill="none" 
              stroke={rankInfo.color + '30'}
              strokeWidth="3"
            />
            <polygon 
              points="50,5 90,27 90,73 50,95 10,73 10,27" 
              fill="none" 
              stroke={rankInfo.color}
              strokeWidth="3"
              strokeDasharray={`${rrPercent * 3.4} 340`}
              style={{ filter: `drop-shadow(0 0 10px ${rankInfo.color})` }}
            />
            {/* Inner hexagon */}
            <polygon 
              points="50,15 80,32 80,68 50,85 20,68 20,32" 
              fill={rankInfo.color + '20'}
              stroke={rankInfo.color + '60'}
              strokeWidth="1"
            />
          </svg>
          {/* RR Value centered */}
          <div 
            className={`absolute inset-0 flex flex-col items-center justify-center ${pulseRR ? 'animate-pulse' : ''}`}
          >
            <span className="text-3xl font-black" style={{ color: rankInfo.color }}>{rr}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/50">RR</span>
          </div>
        </div>

        {/* Center: Info */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs text-pink-400/70 uppercase tracking-widest">Rank Status</p>
            <p className="text-2xl font-black text-white" style={{ textShadow: `0 0 20px ${rankInfo.color}60` }}>
              {tierName}
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-3">
            <div className="px-4 py-2 bg-black/50 rounded border border-success/30">
              <span className="text-success font-bold text-lg">{wins}</span>
              <span className="text-success/60 text-xs ml-1">W</span>
            </div>
            <div className="px-4 py-2 bg-black/50 rounded border border-destructive/30">
              <span className="text-destructive font-bold text-lg">{losses}</span>
              <span className="text-destructive/60 text-xs ml-1">L</span>
            </div>
            <div className="px-4 py-2 bg-black/50 rounded border border-white/10">
              <span className={`font-bold text-lg ${netRR >= 0 ? 'text-success' : 'text-destructive'}`}>
                {netRR >= 0 ? '+' : ''}{netRR}
              </span>
              <span className="text-white/40 text-xs ml-1">NET</span>
            </div>
          </div>
        </div>

        {/* Right: User */}
        <div className="text-right">
          <p className="text-white font-bold">{username}</p>
          <p className="text-pink-400/60 text-xs">#{tag}</p>
          <div className="mt-3 inline-block px-3 py-1 rounded bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30">
            <span className={`text-sm font-bold ${lastChange >= 0 ? 'text-success' : 'text-destructive'}`}>
              {lastChange >= 0 ? '+' : ''}{lastChange} RR
            </span>
          </div>
        </div>
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-pink-500/50" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-cyan-400/50" />

      <style>{`
        @keyframes cyber-win {
          0% { opacity: 0; transform: scale(0.9); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.2); }
        }
        @keyframes cyber-loss {
          0%, 100% { transform: translateX(0); opacity: 0; }
          25% { transform: translateX(-3px); opacity: 1; }
          50% { transform: translateX(3px); opacity: 0.8; }
          75% { transform: translateX(-2px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
