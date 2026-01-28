import { getRankInfo, getRankIcon } from '@/lib/overlayThemes';

interface BarOverlayProps {
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

// BAR OVERLAY - Matches reference image 1: horizontal bar with rank ring, RR, small rank badge, W/L, Last, Net, Username
export function BarOverlay({
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
}: BarOverlayProps) {
  const rankInfo = getRankInfo(tierId);
  const rankIcon = getRankIcon(tierId);
  const rrPercent = rr / 100;

  return (
    <div
      className="relative flex items-center"
      style={{
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        width: 470,
        height: 60,
        borderRadius: 30,
        background: transparent 
          ? 'rgba(20, 22, 28, 0.92)' 
          : 'linear-gradient(90deg, #1a1c22 0%, #1a1c22 100%)',
        border: '1px solid rgba(0,0,0,0.9)',
        padding: '0 16px 0 6px',
        gap: 8,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      {/* RR Ring + Rank Icon */}
      <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 48">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke={rankInfo.color}
            strokeWidth="3"
            strokeDasharray={`${rrPercent * 126} 126`}
            strokeLinecap="round"
            transform="rotate(-90 24 24)"
            style={{ filter: `drop-shadow(0 0 3px ${rankInfo.color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src={rankIcon} 
            alt={tierName}
            className="w-7 h-7 object-contain"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.9))' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </div>

      {/* Rank Name + RR */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-red-400 text-sm font-semibold">{tierName}</span>
        <span className="text-white text-xl font-black">{rr}</span>
        <span className="text-white/40 text-xs font-medium">RR</span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/10 mx-1" />

      {/* Small rank badge */}
      <div 
        className="flex items-center gap-1 px-2 py-0.5 rounded"
        style={{ background: 'rgba(139,50,60,0.3)' }}
      >
        <img 
          src={rankIcon} 
          alt=""
          className="w-4 h-4 object-contain opacity-80"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <span className="text-white/60 text-[10px] font-medium">{tierName}</span>
      </div>

      {/* Win/Loss */}
      <div className="flex items-center gap-1.5">
        <span className="text-emerald-400 font-bold text-sm">{wins}W</span>
        <span className="text-red-400 font-bold text-sm">{losses}L</span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/10 mx-1" />

      {/* Last & Net */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5">
          <span className={`font-bold text-sm ${lastChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {lastChange >= 0 ? '+' : ''}{lastChange}
          </span>
          <span className="text-white/30 text-[10px] uppercase">last</span>
        </div>
        <div className="flex items-center gap-0.5">
          <span className={`font-bold text-sm ${netRR >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {netRR >= 0 ? '+' : ''}{netRR}
          </span>
          <span className="text-white/30 text-[10px] uppercase">net</span>
        </div>
      </div>

      {/* Username */}
      <div className="ml-auto text-right flex flex-col items-end">
        <p className="text-white font-bold text-sm leading-tight">{username}</p>
        <p className="text-white/40 text-[10px] leading-tight">FPS</p>
      </div>
    </div>
  );
}
