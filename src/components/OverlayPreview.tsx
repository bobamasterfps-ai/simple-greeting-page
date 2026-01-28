import { memo } from 'react';
import { useOverlay } from '@/context/OverlayContext';
import { 
  OBSArcOverlay, 
  OBSCircleCompactOverlay, 
  OBSBarOverlay, 
  OBSGlassOverlay, 
  OBSHypeOverlay 
} from './overlays/OBSOverlays';

interface OverlayData {
  rank?: string;
  rr?: number;
  tierId?: number;
  wins?: number;
  losses?: number;
  lastChange?: number;
  netRR?: number;
  username?: string;
  tag?: string;
}

export interface OverlayPreviewProps {
  theme?: string;
  scale?: number;
  data?: OverlayData;
  isTransparent?: boolean;
}

// Memoized for OBS performance
export const OverlayPreview = memo(function OverlayPreview({ 
  theme: themeProp, 
  scale = 1, 
  data, 
  isTransparent: isTransparentProp 
}: OverlayPreviewProps) {
  const { settings, mmrData, state, dailyStats, transparencies, config } = useOverlay();
  
  const currentTheme = themeProp || settings.theme;
  const isTransparent = isTransparentProp ?? (transparencies[currentTheme] ?? false);
  
  // Pass transparent prop to overlays

  // DEMO DATA for when no real data is available - always show something
  const demoData = {
    rr: 68,
    tierName: 'Diamond 3',
    tierId: 18,
    wins: 8,
    losses: 4,
    lastChange: 23,
    netRR: 47,
    username: 'Player',
    tag: '0001',
  };

  // Use provided data, then context data, then demo data as fallback
  const overlayProps = {
    rr: data?.rr ?? mmrData?.rr ?? demoData.rr,
    tierName: data?.rank ?? mmrData?.tierName ?? demoData.tierName,
    tierId: data?.tierId ?? mmrData?.tierId ?? demoData.tierId,
    wins: data?.wins ?? (dailyStats.wins > 0 ? dailyStats.wins : demoData.wins),
    losses: data?.losses ?? (dailyStats.losses > 0 ? dailyStats.losses : demoData.losses),
    lastChange: data?.lastChange ?? (state.lastChange !== 0 ? state.lastChange : demoData.lastChange),
    netRR: data?.netRR ?? (dailyStats.netRR !== 0 ? dailyStats.netRR : demoData.netRR),
    username: data?.username ?? config.username ?? demoData.username,
    tag: data?.tag ?? config.tag ?? demoData.tag,
  };

  const renderOverlay = () => {
    const props = { ...overlayProps, transparent: isTransparent };
    switch (currentTheme) {
      case 'bar':
        return <OBSBarOverlay {...props} />;
      case 'arc':
        return <OBSArcOverlay {...props} />;
      case 'circle':
        return <OBSCircleCompactOverlay {...props} />;
      case 'glass':
        return <OBSGlassOverlay {...props} />;
      case 'hype':
        return <OBSHypeOverlay {...props} />;
      default:
        return <OBSBarOverlay {...props} />;
    }
  };

  return (
    <div 
      className="relative"
      style={{ 
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        contain: 'layout paint size', // OBS optimization
      }}
    >
      {renderOverlay()}
    </div>
  );
});
