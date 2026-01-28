import { getRankInfo } from '@/lib/overlayThemes';
import { useEffect, useState } from 'react';

interface ProOverlayProps {
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

export function ProOverlay({
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
}: ProOverlayProps) {
  const rankInfo = getRankInfo(tierId);
  const [showFlash, setShowFlash] = useState(false);
  const [flashType, setFlashType] = useState<'win' | 'loss' | null>(null);
  
  useEffect(() => {
    if (isAnimating && lastResult) {
      setFlashType(lastResult);
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, lastResult]);

  // Dynamic background based on rank
  const getCardBackground = () => {
    const tierNameLower = tierName.toLowerCase();
    if (tierNameLower.includes('radiant')) {
      return 'linear-gradient(90deg, rgba(160, 110, 30, 1), rgba(20, 20, 20, 1) 45%, rgba(255, 255, 200, 0.8))';
    } else if (tierNameLower.includes('immortal')) {
      return 'linear-gradient(90deg, rgba(80, 10, 20, 1), rgba(20, 20, 20, 1) 45%, rgba(180, 30, 50, 0.8))';
    } else if (tierNameLower.includes('ascendant')) {
      return 'linear-gradient(90deg, rgba(20, 80, 40, 1), rgba(20, 30, 30, 1) 45%, rgba(40, 160, 90, 0.8))';
    } else if (tierNameLower.includes('diamond')) {
      return 'linear-gradient(90deg, rgba(40, 30, 80, 1), rgba(20, 20, 30, 1) 45%, rgba(80, 60, 200, 0.8))';
    } else if (tierNameLower.includes('platinum')) {
      return 'linear-gradient(90deg, rgba(20, 60, 60, 1), rgba(20, 20, 30, 1) 45%, rgba(40, 140, 140, 0.8))';
    } else if (tierNameLower.includes('gold')) {
      return 'linear-gradient(90deg, rgba(100, 80, 20, 1), rgba(20, 20, 20, 1) 45%, rgba(200, 170, 50, 0.8))';
    }
    return 'linear-gradient(90deg, rgba(120, 20, 30, 1), rgba(20, 30, 30, 1) 45%, rgba(0, 120, 100, 0.8))';
  };

  const rrPercent = `${rr}%`;

  return (
    <div 
      className="relative w-[640px] h-[130px] rounded-[80px] flex items-center px-8 overflow-hidden font-display"
      style={{
        background: transparent ? 'rgba(20, 20, 30, 0.6)' : getCardBackground(),
        backdropFilter: 'blur(18px)',
        boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.9), 0 0 70px rgba(0, 0, 0, 0.95)',
        outline: '2px solid rgba(0, 0, 0, 0.9)',
      }}
    >
      {/* Light sweep animation */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(120deg, transparent 35%, rgba(255, 255, 255, 0.06), transparent 65%)',
          animation: 'sweep 10s linear infinite',
        }}
      />

      {/* Flash overlay */}
      {showFlash && (
        <div 
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            mixBlendMode: 'overlay',
            animation: flashType === 'win' ? 'win-burst 0.8s ease-out forwards' : 'loss-glitch 0.4s steps(3) forwards',
          }}
        />
      )}

      {/* Rank Icon with RR Ring */}
      <div className="relative w-[65px] h-[65px] mr-5 flex-shrink-0">
        {/* RR Progress Ring */}
        <div 
          className="absolute inset-[-5px] rounded-full"
          style={{
            background: `conic-gradient(${rankInfo.color} ${rrPercent}, rgba(255, 255, 255, 0.1) 0)`,
          }}
        />
        {/* Rank Badge */}
        <div 
          className="relative z-10 w-full h-full rounded-full flex items-center justify-center text-2xl font-black"
          style={{ 
            backgroundColor: rankInfo.color + '30',
            color: rankInfo.color,
            filter: 'drop-shadow(0 0 20px rgba(0, 0, 0, 0.95))',
          }}
        >
          {rr}
        </div>
      </div>

      {/* Rank Info */}
      <div className="flex flex-col z-10">
        <span className="text-white/90 font-bold text-lg">{tierName}</span>
        <span className="text-white text-4xl font-black leading-none">{rr} RR</span>
        
        {/* Stats Badges */}
        <div className="flex gap-2 mt-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-b from-success/30 to-black/60 text-success shadow-inner">
            {wins}W
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-b from-destructive/30 to-black/60 text-destructive shadow-inner">
            {losses}L
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-b from-white/15 to-black/65 ${lastChange >= 0 ? 'text-success' : 'text-destructive'}`}>
            {lastChange >= 0 ? '+' : ''}{lastChange}
          </span>
        </div>
      </div>

      {/* Right Section - User Info */}
      <div className="ml-auto text-right z-10 bg-black/80 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur">
        <p className="text-white font-bold text-sm">{username}#{tag}</p>
        <p className="text-white/70 text-xs tracking-wider uppercase">Competitive</p>
      </div>

      {showDonationBadge && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-primary/30 text-primary z-20">
          ⚡
        </div>
      )}

      <style>{`
        @keyframes sweep {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        @keyframes win-burst {
          0% { opacity: 0; transform: scale(0.8); background: radial-gradient(circle, #3cff7a 0%, transparent 60%); }
          10% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1.5); }
        }
        @keyframes loss-glitch {
          0% { opacity: 0; background: rgba(255, 50, 50, 0.4); transform: translate(0, 0); }
          20% { opacity: 1; transform: translate(-5px, 2px); }
          40% { opacity: 0.8; transform: translate(5px, -2px); }
          60% { opacity: 1; transform: translate(-2px, 2px); }
          80% { opacity: 0.5; transform: translate(2px, -2px); }
          100% { opacity: 0; transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
}
