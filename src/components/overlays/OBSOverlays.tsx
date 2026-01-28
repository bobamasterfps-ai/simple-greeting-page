/**
 * OBS-SAFE OVERLAY COMPONENTS - StreamSpike Style
 * 
 * 5 Premium Overlays with animations and transparency support
 */

import { getRankIcon } from '@/lib/overlayThemes';

interface OBSOverlayProps {
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
}

// Arc / Curve Overlay - 800x160
export function OBSArcOverlay({ rr, tierName, tierId, wins, losses, lastChange, netRR, username, tag, transparent }: OBSOverlayProps) {
  const rankIcon = getRankIcon(tierId);
  
  return (
    <div style={{
      position: 'relative',
      width: '800px',
      height: '160px',
      background: transparent ? 'transparent' : 'linear-gradient(135deg, rgba(30,27,75,0.95) 0%, rgba(88,28,135,0.85) 50%, rgba(15,23,42,0.95) 100%)',
      borderRadius: '0 0 100px 100px',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
      border: transparent ? 'none' : '1px solid rgba(139,92,246,0.3)',
    }}>
      {/* Animated particles */}
      {!transparent && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              background: 'rgba(139,92,246,0.6)',
              borderRadius: '50%',
              left: `${15 + i * 15}%`,
              bottom: '10px',
              animation: `float-particle 8s ease-in-out infinite`,
              animationDelay: `${i * 1.2}s`,
            }} />
          ))}
        </div>
      )}

      {/* Glow effect */}
      {!transparent && (
        <div style={{
          position: 'absolute',
          inset: '-20px',
          background: 'radial-gradient(ellipse at center bottom, rgba(139,92,246,0.3) 0%, transparent 70%)',
          animation: 'glow-pulse 2s ease-in-out infinite',
        }} />
      )}

      {/* Content container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px',
        height: '100%',
      }}>
        {/* Left side - Rank icon with glow */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            position: 'absolute',
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'glow-pulse 2s ease-in-out infinite',
          }} />
          <img src={rankIcon} alt={tierName} style={{ width: '80px', height: '80px', position: 'relative', zIndex: 10 }} />
        </div>

        {/* Center - Rank info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {tierName}
          </div>
          <div style={{ fontSize: '36px', fontWeight: 900, color: '#a78bfa' }}>
            {rr} RR
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Competitive • Live Stats
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
            <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '14px' }}>{wins}W</span>
            <span style={{ color: '#f87171', fontWeight: 700, fontSize: '14px' }}>{losses}L</span>
            <span style={{ color: lastChange >= 0 ? '#4ade80' : '#f87171', fontWeight: 700, fontSize: '14px' }}>
              Last: {lastChange >= 0 ? '+' : ''}{lastChange}
            </span>
            <span style={{ color: netRR >= 0 ? '#4ade80' : '#f87171', fontWeight: 700, fontSize: '14px' }}>
              Net: {netRR >= 0 ? '+' : ''}{netRR}
            </span>
          </div>
        </div>

        {/* Right side - Player info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>
            {username || 'Player'}<span style={{ color: '#a78bfa' }}>#{tag || '0001'}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>AP</div>
        </div>
      </div>

      <style>{`
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0) rotate(0); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-100px) translateX(50px) rotate(180deg); opacity: 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// Circle Compact Overlay - 160x200
export function OBSCircleCompactOverlay({ rr, tierName, tierId, wins, losses, lastChange, username, transparent }: OBSOverlayProps) {
  const rankIcon = getRankIcon(tierId);
  const progress = (rr / 100) * 100;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div style={{
      position: 'relative',
      width: '160px',
      height: '200px',
      background: transparent ? 'transparent' : 'linear-gradient(180deg, rgba(30,27,75,0.95) 0%, rgba(15,23,42,0.98) 100%)',
      borderRadius: '20px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      fontFamily: "'Inter', sans-serif",
      border: transparent ? 'none' : '1px solid rgba(139,92,246,0.3)',
      boxShadow: transparent ? 'none' : '0 0 30px rgba(139,92,246,0.2)',
    }}>
      {/* Progress ring with rank icon */}
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
        <svg width="120" height="120" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="6" />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="url(#circleGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
          <defs>
            <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <img src={rankIcon} alt={tierName} style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60px',
          height: '60px',
        }} />
      </div>

      {/* RR Display */}
      <div style={{ fontSize: '32px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{rr}</div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '-4px' }}>RR</div>

      {/* Win/Loss */}
      <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
        <span style={{ color: '#4ade80', fontWeight: 700 }}>{wins}W</span>
        <span style={{ color: '#f87171', fontWeight: 700 }}>{losses}L</span>
      </div>

      {/* Last change */}
      <div style={{
        fontSize: '14px',
        fontWeight: 700,
        color: lastChange >= 0 ? '#4ade80' : '#f87171',
      }}>
        {lastChange >= 0 ? '+' : ''}{lastChange}
      </div>

      {/* Username */}
      <div style={{
        fontSize: '10px',
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        maxWidth: '140px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {username || 'Player'}
      </div>
    </div>
  );
}

// Bar / Progress Overlay - 470x60
export function OBSBarOverlay({ rr, tierName, tierId, wins, losses, lastChange, netRR, username, tag, transparent }: OBSOverlayProps) {
  const rankIcon = getRankIcon(tierId);
  const progress = (rr / 100) * 100;

  return (
    <div style={{
      position: 'relative',
      width: '470px',
      height: '60px',
      background: transparent ? 'transparent' : 'linear-gradient(90deg, rgba(30,27,75,0.95) 0%, rgba(88,28,135,0.9) 50%, rgba(15,23,42,0.95) 100%)',
      borderRadius: '12px',
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontFamily: "'Inter', sans-serif",
      border: transparent ? 'none' : '1px solid rgba(139,92,246,0.3)',
      boxShadow: transparent ? 'none' : '0 4px 20px rgba(139,92,246,0.2)',
      overflow: 'hidden',
    }}>
      {/* Sweep animation */}
      {!transparent && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
          animation: 'sweep 10s linear infinite',
        }} />
      )}

      {/* Rank icon */}
      <img src={rankIcon} alt={tierName} style={{ width: '40px', height: '40px', position: 'relative', zIndex: 10 }} />

      {/* Rank info with progress bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{tierName}</span>
          <span style={{ fontSize: '16px', fontWeight: 900, color: '#a78bfa' }}>{rr} RR</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
            Competitive • <span style={{ color: '#4ade80' }}>Live</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '2px', height: '4px' }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
            borderRadius: '2px',
          }} />
          <div style={{
            width: `${100 - progress}%`,
            height: '100%',
            background: 'rgba(139,92,246,0.2)',
            borderRadius: '2px',
          }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#4ade80' }}>{wins}W</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#f87171' }}>{losses}L</span>
        </div>
        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: lastChange >= 0 ? '#4ade80' : '#f87171' }}>
            {lastChange >= 0 ? '+' : ''}{lastChange}
          </span>
          <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Last</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: netRR >= 0 ? '#4ade80' : '#f87171' }}>
            {netRR >= 0 ? '+' : ''}{netRR}
          </span>
          <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Net</span>
        </div>
      </div>

      {/* Username */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', position: 'relative', zIndex: 10 }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>{username || 'Player'}</span>
        <span style={{ fontSize: '12px', color: '#a78bfa' }}>#{tag || '0001'}</span>
      </div>

      <style>{`
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// Glass Minimal Overlay - 320x180
export function OBSGlassOverlay({ rr, tierName, tierId, wins, losses, lastChange, netRR, username, tag, transparent }: OBSOverlayProps) {
  const rankIcon = getRankIcon(tierId);

  return (
    <div style={{
      position: 'relative',
      width: '320px',
      height: '180px',
      background: transparent ? 'transparent' : 'rgba(255,255,255,0.05)',
      backdropFilter: transparent ? 'none' : 'blur(20px)',
      borderRadius: '24px',
      border: transparent ? 'none' : '1px solid rgba(255,255,255,0.1)',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Gradient orbs */}
      {!transparent && (
        <>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '100px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
        </>
      )}

      {/* Rank icon */}
      <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
        <img src={rankIcon} alt={tierName} style={{ width: '56px', height: '56px' }} />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Top - Username */}
        <div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
            {username || 'Player'}<span style={{ color: '#a78bfa' }}>#{tag || '0001'}</span> • AP
          </div>
        </div>

        {/* Middle - Rank */}
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {tierName}
          </div>
          <div style={{ fontSize: '48px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
            {rr} RR
          </div>
        </div>

        {/* Bottom - Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#4ade80' }}>{wins}W</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#f87171' }}>{losses}L</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: lastChange >= 0 ? '#4ade80' : '#f87171' }}>
              {lastChange >= 0 ? '+' : ''}{lastChange}
            </span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              Net: {netRR >= 0 ? '+' : ''}{netRR}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hype / Promo Overlay - 400x200
export function OBSHypeOverlay({ rr, tierName, tierId, wins, losses, lastChange, netRR, username, tag, transparent }: OBSOverlayProps) {
  const rankIcon = getRankIcon(tierId);

  return (
    <div style={{
      position: 'relative',
      width: '400px',
      height: '200px',
      background: transparent ? 'transparent' : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #581c87 100%)',
      borderRadius: '20px',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
      border: transparent ? 'none' : '2px solid rgba(139,92,246,0.5)',
      boxShadow: transparent ? 'none' : '0 0 40px rgba(139,92,246,0.3)',
    }}>
      {/* Animated background particles */}
      {!transparent && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: `${6 + (i % 3) * 4}px`,
              height: `${6 + (i % 3) * 4}px`,
              background: i % 2 === 0 ? 'rgba(139,92,246,0.4)' : 'rgba(236,72,153,0.4)',
              borderRadius: '50%',
              left: `${10 + i * 12}%`,
              bottom: '20px',
              animation: `float-particle 8s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }} />
          ))}
        </div>
      )}

      {/* Rank icon with glow */}
      <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
        <div style={{
          position: 'absolute',
          inset: '-20px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'glow-pulse 2s ease-in-out infinite',
        }} />
        <img src={rankIcon} alt={tierName} style={{ width: '72px', height: '72px', position: 'relative', zIndex: 10 }} />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Rank info */}
        <div style={{ marginBottom: 'auto' }}>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {tierName}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '56px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{rr}</span>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#a78bfa' }}>RR</span>
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Competitive • Live Stats
          </div>
        </div>

        {/* Bottom section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{
                background: 'rgba(74,222,128,0.2)',
                color: '#4ade80',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
              }}>{wins}W</span>
              <span style={{
                background: 'rgba(248,113,113,0.2)',
                color: '#f87171',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
              }}>{losses}L</span>
            </div>
            <span style={{ fontSize: '16px', fontWeight: 700, color: lastChange >= 0 ? '#4ade80' : '#f87171' }}>
              {lastChange >= 0 ? '+' : ''}{lastChange}
            </span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              NET {netRR >= 0 ? '+' : ''}{netRR}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
            {username || 'Player'}<span style={{ color: '#a78bfa' }}>#{tag || '0001'}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0) rotate(0); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-100px) translateX(50px) rotate(180deg); opacity: 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
