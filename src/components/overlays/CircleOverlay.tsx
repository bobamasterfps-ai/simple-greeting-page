import { getRankInfo, getRankIcon } from '@/lib/overlayThemes';

interface CircleOverlayProps {
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

// CIRCLE OVERLAY - Large wide pill matching reference image 6 (the big one with full stats)
export function CircleOverlay({
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
}: CircleOverlayProps) {
  const rankInfo = getRankInfo(tierId);
  const rankIcon = getRankIcon(tierId);
  const rrPercent = rr / 100;

  return (
    <div
      className="relative flex items-center"
      style={{
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        width: 800,
        height: 160,
        borderRadius: 80,
        background: transparent 
          ? 'rgba(20, 22, 28, 0.95)' 
          : 'linear-gradient(90deg, rgba(120, 40, 55, 0.6) 0%, rgba(60, 25, 35, 0.8) 25%, rgba(25, 25, 30, 0.95) 50%, rgba(20, 22, 28, 1) 100%)',
        border: '3px solid rgba(100, 35, 50, 0.5)',
        padding: '0 36px',
        gap: 28,
        boxShadow: '0 0 60px rgba(0,0,0,0.95), inset 0 0 80px rgba(150, 40, 60, 0.1)',
      }}
    >
      {/* Left side red glow */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1/3 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at left center, rgba(180, 50, 70, 0.25) 0%, transparent 60%)',
        }}
      />

      {/* Rank Ring + Icon */}
      <div className="relative z-10 flex-shrink-0" style={{ width: 110, height: 110 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 110 110">
          {/* Gray crosshair lines */}
          <line x1="55" y1="8" x2="55" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="55" y1="90" x2="55" y2="102" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="8" y1="55" x2="20" y2="55" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="90" y1="55" x2="102" y2="55" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          {/* Background ring */}
          <circle
            cx="55"
            cy="55"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
          />
          {/* Progress ring */}
          <circle
            cx="55"
            cy="55"
            r="45"
            fill="none"
            stroke={rankInfo.color}
            strokeWidth="6"
            strokeDasharray={`${rrPercent * 283} 283`}
            strokeLinecap="round"
            transform="rotate(-90 55 55)"
            style={{ filter: `drop-shadow(0 0 10px ${rankInfo.color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src={rankIcon} 
            alt={tierName}
            className="w-14 h-14 object-contain"
            style={{ filter: 'drop-shadow(0 0 15px rgba(0,0,0,0.95))' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </div>

      {/* Rank Name & RR */}
      <div className="relative z-10 flex-shrink-0">
        <p className="text-white font-bold text-xl">{tierName}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-white font-black text-6xl leading-none">{rr}</span>
          <span className="text-white/50 text-2xl font-bold">RR</span>
        </div>
      </div>

      {/* Stats pills */}
      <div className="relative z-10 flex flex-col items-start gap-2 ml-4">
        <div className="flex items-center gap-2">
          <div 
            className="px-5 py-2 rounded-full text-sm font-bold"
            style={{ 
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#10b981'
            }}
          >
            {wins}W
          </div>
          <div 
            className="px-5 py-2 rounded-full text-sm font-bold"
            style={{ 
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444'
            }}
          >
            {losses}L
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="px-4 py-1.5 rounded-full text-sm font-bold"
            style={{ 
              background: lastChange >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${lastChange >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: lastChange >= 0 ? '#10b981' : '#ef4444'
            }}
          >
            Last: {lastChange >= 0 ? '+' : ''}{lastChange}
          </div>
          <div 
            className="px-4 py-1.5 rounded-full text-sm font-bold"
            style={{ 
              background: netRR >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${netRR >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: netRR >= 0 ? '#10b981' : '#ef4444'
            }}
          >
            Net: {netRR >= 0 ? '+' : ''}{netRR}
          </div>
        </div>
      </div>

      {/* Username section */}
      <div 
        className="relative z-10 ml-auto px-6 py-4 rounded-2xl text-right"
        style={{
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <p className="text-white font-bold text-lg">{username}#{tag}</p>
        <p className="text-white/50 text-sm uppercase tracking-wider">APAC</p>
        <p className="text-white/30 text-xs uppercase mt-0.5">COMPETITIVE • LIVE</p>
      </div>
    </div>
  );
}
