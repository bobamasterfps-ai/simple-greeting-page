import { getRankInfo } from '@/lib/overlayThemes';

interface GlassOverlayProps {
  rr: number;
  tierName: string;
  tierId: number;
  wins: number;
  losses: number;
  lastChange: number;
  netRR: number;
  transparent?: boolean;
  showDonationBadge?: boolean;
}

export function GlassOverlay({
  rr,
  tierName,
  tierId,
  wins,
  losses,
  lastChange,
  netRR,
  transparent = false,
  showDonationBadge = false,
}: GlassOverlayProps) {
  const rankInfo = getRankInfo(tierId);
  const bgOpacity = transparent ? '0.4' : '0.8';

  return (
    <div 
      className="relative w-[450px] h-[180px] rounded-2xl overflow-hidden font-body"
      style={{
        backgroundColor: `rgba(15, 17, 26, ${bgOpacity})`,
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Gradient accent */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${rankInfo.color}, transparent)` }}
      />

      <div className="p-5 h-full flex items-center gap-6">
        {/* Rank Display */}
        <div className="flex flex-col items-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display font-bold"
            style={{ 
              backgroundColor: rankInfo.color + '30',
              border: `2px solid ${rankInfo.color}`,
              color: rankInfo.color,
            }}
          >
            {rr}
          </div>
          <p className="text-xs text-white/70 mt-2 font-medium">{tierName}</p>
        </div>

        {/* Stats */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider">Session</p>
            <p className="text-xl font-display font-bold text-white">
              <span className="text-success">{wins}W</span>
              <span className="text-white/30 mx-1">/</span>
              <span className="text-destructive">{losses}L</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider">Net RR</p>
            <p className={`text-xl font-display font-bold ${netRR >= 0 ? 'text-success' : 'text-destructive'}`}>
              {netRR >= 0 ? '+' : ''}{netRR}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-white/50 uppercase tracking-wider">Last Match</p>
            <p className={`text-lg font-display font-bold ${lastChange >= 0 ? 'text-success' : 'text-destructive'}`}>
              {lastChange >= 0 ? '+' : ''}{lastChange} RR
            </p>
          </div>
        </div>

        {/* Donation Badge */}
        {showDonationBadge && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary">
            Supporter
          </div>
        )}
      </div>
    </div>
  );
}
