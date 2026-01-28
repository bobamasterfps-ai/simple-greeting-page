import { getRankInfo, getRankIcon } from '@/lib/overlayThemes';

interface MinimalOverlayProps {
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

// MINIMAL OVERLAY - Matches reference image 5: circular centered design with ring, RR below, stats below that
export function MinimalOverlay({
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
}: MinimalOverlayProps) {
  const rankInfo = getRankInfo(tierId);
  const rankIcon = getRankIcon(tierId);
  const rrPercent = rr / 100;

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        width: 160,
        height: 200,
        borderRadius: 16,
        background: transparent 
          ? 'rgba(20, 22, 28, 0.95)' 
          : 'linear-gradient(180deg, rgba(30, 32, 38, 1) 0%, rgba(20, 22, 28, 1) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: 16,
        boxShadow: '0 0 30px rgba(0,0,0,0.8)',
      }}
    >
      {/* Ring with Rank Icon */}
      <div className="relative" style={{ width: 70, height: 70 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 70 70">
          {/* Background ring */}
          <circle
            cx="35"
            cy="35"
            r="30"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="4"
          />
          {/* Progress ring */}
          <circle
            cx="35"
            cy="35"
            r="30"
            fill="none"
            stroke={rankInfo.color}
            strokeWidth="4"
            strokeDasharray={`${rrPercent * 188} 188`}
            strokeLinecap="round"
            transform="rotate(-90 35 35)"
            style={{ filter: `drop-shadow(0 0 6px ${rankInfo.color})` }}
          />
          {/* Red accent dot at top */}
          <circle cx="35" cy="5" r="3" fill="#ef4444" />
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

      {/* RR Display */}
      <div className="text-center mt-2">
        <span className="text-white font-black text-3xl leading-none">{rr}</span>
        <p className="text-white/40 text-[10px] tracking-widest uppercase">RR</p>
      </div>

      {/* Win/Loss */}
      <div className="flex items-center gap-3 mt-2">
        <span className="text-emerald-400 font-bold text-sm">{wins}W</span>
        <span className="text-red-400 font-bold text-sm">{losses}L</span>
      </div>

      {/* Last change */}
      <div className="text-center mt-1">
        <span className={`font-bold text-sm ${lastChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {lastChange >= 0 ? '+' : ''}{lastChange}
        </span>
      </div>

      {/* Username */}
      <p className="text-white/40 text-[10px] text-center mt-1">{username} FPS</p>
    </div>
  );
}
