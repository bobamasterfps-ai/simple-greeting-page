import { getRankInfo } from '@/lib/overlayThemes';

interface EliteOverlayProps {
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

export function EliteOverlay({
  rr,
  tierName,
  tierId,
  wins,
  losses,
  lastChange,
  netRR,
  transparent = false,
  showDonationBadge = false,
}: EliteOverlayProps) {
  const rankInfo = getRankInfo(tierId);
  const bgOpacity = transparent ? '0.4' : '0.9';

  return (
    <div 
      className="relative w-[480px] h-[190px] overflow-hidden font-body"
      style={{
        backgroundColor: `rgba(10, 10, 15, ${bgOpacity})`,
        backdropFilter: 'blur(24px)',
        clipPath: 'polygon(0 0, 100% 0, 100% 80%, 95% 100%, 5% 100%, 0 80%)',
      }}
    >
      {/* Premium border effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${rankInfo.color}30 0%, transparent 30%, transparent 70%, ${rankInfo.color}30 100%)`,
        }}
      />

      {/* Top accent line */}
      <div 
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ 
          background: `linear-gradient(90deg, transparent, ${rankInfo.color}, transparent)`,
          boxShadow: `0 0 20px ${rankInfo.color}`,
        }}
      />

      <div className="relative p-6 h-full flex items-center gap-8">
        {/* Rank Display */}
        <div className="text-center">
          <div 
            className="w-20 h-20 rounded-lg flex flex-col items-center justify-center relative"
            style={{
              background: `linear-gradient(145deg, ${rankInfo.color}20, transparent)`,
              border: `1px solid ${rankInfo.color}50`,
            }}
          >
            <span className="text-3xl font-display font-black text-white">{rr}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/50">RR</span>
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t" style={{ borderColor: rankInfo.color }} />
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t" style={{ borderColor: rankInfo.color }} />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b" style={{ borderColor: rankInfo.color }} />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b" style={{ borderColor: rankInfo.color }} />
          </div>
          <p className="mt-2 font-display font-semibold text-sm" style={{ color: rankInfo.color }}>
            {tierName}
          </p>
        </div>

        {/* Divider */}
        <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

        {/* Stats */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Session Record</p>
              <p className="font-display font-bold text-xl">
                <span className="text-success">{wins}</span>
                <span className="text-white/20 mx-1">/</span>
                <span className="text-destructive">{losses}</span>
              </p>
            </div>
            {showDonationBadge && (
              <div 
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ 
                  background: `linear-gradient(90deg, ${rankInfo.color}20, transparent)`,
                  borderLeft: `2px solid ${rankInfo.color}`,
                }}
              >
                ELITE
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Net Gain</p>
              <p className={`font-display font-bold text-lg ${netRR >= 0 ? 'text-success' : 'text-destructive'}`}>
                {netRR >= 0 ? '+' : ''}{netRR} RR
              </p>
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Last Match</p>
              <p className={`font-display font-bold text-lg ${lastChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                {lastChange >= 0 ? '+' : ''}{lastChange} RR
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
