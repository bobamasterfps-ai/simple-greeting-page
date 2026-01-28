import { getRankInfo, getRankIcon } from '@/lib/overlayThemes';

interface CardOverlayProps {
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

// CARD OVERLAY - Matches reference image 2: centered card with rank name on top, large RR, badges below
export function CardOverlay({
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
}: CardOverlayProps) {
  const rankInfo = getRankInfo(tierId);
  const rankIcon = getRankIcon(tierId);
  const rrPercent = rr / 100;
  const nextRankRR = 100 - rr;
  const tierParts = tierName.split(' ');
  const tierBase = tierParts[0];
  const tierLevel = tierParts[1] || '1';

  const getNextRank = () => {
    const tiers = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'];
    if (tierLevel === '3') {
      const idx = tiers.indexOf(tierBase);
      return tiers[Math.min(idx + 1, tiers.length - 1)] + ' 1';
    }
    return tierBase + ' ' + (parseInt(tierLevel) + 1);
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        width: 320,
        height: 180,
        borderRadius: 16,
        background: transparent 
          ? 'rgba(20, 22, 28, 0.95)' 
          : 'linear-gradient(180deg, rgba(60, 25, 35, 0.8) 0%, rgba(25, 25, 30, 1) 50%, rgba(20, 22, 28, 1) 100%)',
        border: '1px solid rgba(80, 30, 40, 0.4)',
        boxShadow: '0 0 30px rgba(0,0,0,0.8)',
      }}
    >
      {/* Red accent gradient left side */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 20% 30%, rgba(180, 50, 70, 0.25) 0%, transparent 50%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full p-5">
        {/* Left: Rank Ring */}
        <div className="flex flex-col items-center justify-center" style={{ width: 80 }}>
          <div className="relative" style={{ width: 65, height: 65 }}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 65 65">
              <circle
                cx="32.5"
                cy="32.5"
                r="28"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="4"
              />
              <circle
                cx="32.5"
                cy="32.5"
                r="28"
                fill="none"
                stroke={rankInfo.color}
                strokeWidth="4"
                strokeDasharray={`${rrPercent * 176} 176`}
                strokeLinecap="round"
                transform="rotate(-90 32.5 32.5)"
                style={{ filter: `drop-shadow(0 0 6px ${rankInfo.color})` }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={rankIcon} 
                alt={tierName}
                className="w-9 h-9 object-contain"
                style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.95))' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </div>
        </div>

        {/* Center: Rank Name, RR, next rank info */}
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <p className="text-red-400 font-extrabold text-base uppercase tracking-wide">{tierName.toUpperCase()}</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-white font-black text-5xl leading-none">{rr}</span>
            <span className="text-white/50 text-lg font-semibold">RR</span>
          </div>
          <p className="text-white/30 text-[10px] mt-1">{nextRankRR} RR → {getNextRank()}</p>
        </div>

        {/* Right side stats */}
        <div className="flex flex-col justify-center items-end gap-1" style={{ width: 60 }}>
          <div className="flex items-center gap-1">
            <span className="text-emerald-400 font-bold text-sm">{wins}W</span>
            <span className="text-red-400 font-bold text-sm">{losses}L</span>
          </div>
          <div>
            <span className={`font-bold text-sm ${lastChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {lastChange >= 0 ? '+' : ''}{lastChange}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-white/40 text-[10px]">NET</span>
            <span className={`font-bold text-sm ${netRR >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {netRR >= 0 ? '+' : ''}{netRR}
            </span>
          </div>
          <p className="text-white/40 text-[10px] mt-0.5">{username} FPS</p>
        </div>
      </div>
    </div>
  );
}
