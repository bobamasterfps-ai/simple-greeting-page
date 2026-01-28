import { getRankInfo, getRankIcon } from '@/lib/overlayThemes';

interface CompactOverlayProps {
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

// COMPACT OVERLAY - Matches reference image 4: small vertical card with username on top, rank below, stats on right
export function CompactOverlay({
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
}: CompactOverlayProps) {
  const rankInfo = getRankInfo(tierId);
  const rankIcon = getRankIcon(tierId);

  return (
    <div
      className="relative"
      style={{
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        width: 240,
        height: 130,
        borderRadius: 14,
        background: transparent 
          ? 'rgba(20, 22, 28, 0.95)' 
          : 'linear-gradient(180deg, rgba(25, 27, 32, 1) 0%, rgba(20, 22, 28, 1) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: 14,
        boxShadow: '0 0 30px rgba(0,0,0,0.8)',
      }}
    >
      {/* Top: Username & Tag */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-white/80 text-xs font-medium">{username} FPS#{tag} •</p>
          <p className="text-white/40 text-[10px] uppercase">ASIA PACIFIC</p>
        </div>
      </div>

      {/* Main content row */}
      <div className="flex items-center gap-3">
        {/* Rank icon */}
        <div className="flex-shrink-0">
          <img 
            src={rankIcon} 
            alt={tierName}
            className="w-8 h-8 object-contain"
            style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.9))' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        {/* Rank name */}
        <p className="text-red-400 font-bold text-xs">{tierName}</p>

        {/* RR */}
        <div className="flex items-baseline gap-0.5">
          <span className="text-white font-black text-2xl leading-none">{rr}</span>
          <span className="text-white/40 text-xs">RR</span>
        </div>
      </div>

      {/* Bottom stats row */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold text-xs">{wins}W</span>
          <span className="text-red-400 font-bold text-xs">{losses}L</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className={`font-bold text-xs ${lastChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {lastChange >= 0 ? '+' : ''}{lastChange}
            </span>
          </div>
          <div className="text-right">
            <span className="text-white/30 text-[10px]">Net: </span>
            <span className={`font-bold text-xs ${netRR >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {netRR >= 0 ? '+' : ''}{netRR}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
