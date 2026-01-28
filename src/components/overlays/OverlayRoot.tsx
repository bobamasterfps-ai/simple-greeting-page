/**
 * OBS OVERLAY ROOT - COMPLETELY ISOLATED & STANDALONE
 * 
 * Rules:
 * - NO shared state with dashboard
 * - NO Tailwind layout utilities
 * - INLINE styles only
 * - FIXED pixel sizes
 * - Fetches data from URL params via backend API
 * - Shows LATEST match always (no date filtering)
 * - Works in OBS without dashboard being open
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  OBSArcOverlay, 
  OBSCircleCompactOverlay, 
  OBSBarOverlay, 
  OBSGlassOverlay, 
  OBSHypeOverlay 
} from './OBSOverlays';

interface OverlayData {
  rr: number;
  tierName: string;
  tierId: number;
  wins: number;
  losses: number;
  lastChange: number;
  netRR: number;
  username: string;
  tag: string;
  status: 'active' | 'idle' | 'error' | 'loading';
}

// Theme dimensions for OBS - FIXED SIZES
const THEME_DIMENSIONS: Record<string, { width: number; height: number }> = {
  arc: { width: 800, height: 160 },
  circle: { width: 160, height: 200 },
  bar: { width: 470, height: 60 },
  glass: { width: 320, height: 180 },
  hype: { width: 400, height: 200 },
};

// Demo data for when API is not configured or fails
const DEMO_DATA: OverlayData = {
  rr: 68,
  tierName: 'Diamond 3',
  tierId: 18,
  wins: 8,
  losses: 4,
  lastChange: 23,
  netRR: 47,
  username: 'Player',
  tag: '0001',
  status: 'active',
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function OverlayRoot() {
  const [data, setData] = useState<OverlayData | null>(null);
  const [theme, setTheme] = useState('bar');
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<{ name: string; tag: string; region: string } | null>(null);

  // Parse URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTheme = urlParams.get('theme');
    const name = urlParams.get('name');
    const tag = urlParams.get('tag');
    const region = urlParams.get('region') || 'ap';

    if (urlTheme && Object.keys(THEME_DIMENSIONS).includes(urlTheme)) {
      setTheme(urlTheme);
    }

    if (name && tag) {
      setParams({ name, tag, region });
    } else {
      // Fallback: try localStorage for backwards compatibility
      try {
        const saved = localStorage.getItem('valorant-overlay-config');
        if (saved) {
          const parsed = JSON.parse(saved);
          const config = parsed.config || {};
          if (config.username && config.tag) {
            setParams({
              name: config.username,
              tag: config.tag,
              region: config.region || 'ap',
            });
          }
        }
      } catch (e) {
        console.error('Failed to read localStorage fallback:', e);
      }
    }
  }, []);

  // Fetch data from backend API
  const fetchData = useCallback(async () => {
    if (!params) return;

    try {
      const url = `${SUPABASE_URL}/functions/v1/overlay-data?name=${encodeURIComponent(params.name)}&tag=${encodeURIComponent(params.tag)}&region=${params.region}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch overlay data');
      }

      const result = await response.json();

      if (result.error) {
        setError(result.message || result.error);
        return;
      }

      setData({
        rr: result.rr ?? 0,
        tierName: result.tierName ?? 'Unranked',
        tierId: result.tierId ?? 0,
        wins: result.wins ?? 0,
        losses: result.losses ?? 0,
        lastChange: result.lastChange ?? 0,
        netRR: result.netRR ?? 0,
        username: result.username || params.name,
        tag: result.tag || params.tag,
        status: result.status || 'active',
      });
      setError(null);
    } catch (e) {
      console.error('Overlay fetch error:', e);
      setError('Failed to load data');
    }
  }, [params]);

  // Initial fetch and polling
  useEffect(() => {
    if (!params) return;

    // Initial fetch
    fetchData();

    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [params, fetchData]);

  // Get theme dimensions
  const dimensions = THEME_DIMENSIONS[theme] || THEME_DIMENSIONS.bar;

  // Use demo data if no params or data available - ALWAYS show something
  const displayData = data || DEMO_DATA;

  const overlayProps = {
    rr: displayData.rr,
    tierName: displayData.tierName,
    tierId: displayData.tierId,
    wins: displayData.wins,
    losses: displayData.losses,
    lastChange: displayData.lastChange,
    netRR: displayData.netRR,
    username: displayData.username,
    tag: displayData.tag,
  };

  const renderOverlay = () => {
    switch (theme) {
      case 'arc':
        return <OBSArcOverlay {...overlayProps} />;
      case 'circle':
        return <OBSCircleCompactOverlay {...overlayProps} />;
      case 'bar':
        return <OBSBarOverlay {...overlayProps} />;
      case 'glass':
        return <OBSGlassOverlay {...overlayProps} />;
      case 'hype':
        return <OBSHypeOverlay {...overlayProps} />;
      default:
        return <OBSBarOverlay {...overlayProps} />;
    }
  };

  // CRITICAL: Fixed size container, no layout utilities, inline styles only
  return (
    <div
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {renderOverlay()}
    </div>
  );
}
