import { getRankInfo } from '@/lib/overlayThemes';

interface NeonOverlayProps {
  rr: number;
  tierName: string;
  tierId: number;
  wins: number;
  losses: number;
  lastChange: number;
  netRR: number;
  showDonationBadge?: boolean;
}

export function NeonOverlay({
  rr,
  tierName,
  tierId,
  wins,
  losses,
  lastChange,
  netRR,
  showDonationBadge = false,
}: NeonOverlayProps) {
  const rankInfo = getRankInfo(tierId);

  return (
    <div 
      className="relative w-[500px] h-[200px] rounded-2xl overflow-hidden font-body"
      style={{
        backgroundColor: 'rgba(10, 10, 20, 1)',
        border: `2px solid ${rankInfo.color}`,
        boxShadow: `0 0 30px ${rankInfo.color}40, inset 0 0 30px ${rankInfo.color}10`,
      }}
    >
      {/* Animated border glow */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          background: `linear-gradient(45deg, transparent 40%, ${rankInfo.color}20 50%, transparent 60%)`,
          animation: 'shimmer 3s infinite',
        }}
      />

      <div className="relative p-6 h-full flex items-center gap-8">
        {/* Rank Circle */}
        <div className="relative">
          <div 
            className="w-24 h-24 rounded-full flex flex-col items-center justify-center"
            style={{
              background: `radial-gradient(circle, ${rankInfo.color}30 0%, transparent 70%)`,
              border: `3px solid ${rankInfo.color}`,
              boxShadow: `0 0 20px ${rankInfo.color}60`,
            }}
          >
            <span className="text-3xl font-display font-black text-white">{rr}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/70">RR</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-lg" style={{ color: rankInfo.color }}>
              {tierName}
            </span>
            {showDonationBadge && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary text-background">
                ⚡ Supporter
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: `${rankInfo.color}10` }}>
              <p className="text-xs text-white/50 uppercase">W/L</p>
              <p className="font-display font-bold text-white">
                {wins}/{losses}
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-success/10">
              <p className="text-xs text-white/50 uppercase">Net</p>
              <p className={`font-display font-bold ${netRR >= 0 ? 'text-success' : 'text-destructive'}`}>
                {netRR >= 0 ? '+' : ''}{netRR}
              </p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: lastChange >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
              <p className="text-xs text-white/50 uppercase">Last</p>
              <p className={`font-display font-bold ${lastChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                {lastChange >= 0 ? '+' : ''}{lastChange}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
