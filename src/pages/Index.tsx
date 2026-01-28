import { useState, useEffect } from 'react';
import { OverlayProvider } from '@/context/OverlayContext';
import { LandingPage } from '@/components/LandingPage';
import { Dashboard } from '@/components/Dashboard';
import { OverlayRoot } from '@/components/overlays/OverlayRoot';

const Index = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [isOverlayMode, setIsOverlayMode] = useState(false);

  // Check for overlay mode via URL params - MUST be first check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('overlay') === 'true') {
      setIsOverlayMode(true);
    }
  }, []);

  // Check if user has previously launched
  useEffect(() => {
    if (!isOverlayMode) {
      const hasLaunched = localStorage.getItem('spikes-overlay-launched');
      if (hasLaunched) {
        setShowDashboard(true);
      }
    }
  }, [isOverlayMode]);

  const handleLaunch = () => {
    localStorage.setItem('spikes-overlay-launched', 'true');
    setShowDashboard(true);
  };

  // OBS OVERLAY MODE - Completely isolated render tree
  // NO providers, NO shared state, NO Tailwind layout utilities
  if (isOverlayMode) {
    return <OverlayRoot />;
  }

  // Normal dashboard/landing flow
  return (
    <OverlayProvider>
      {showDashboard ? (
        <Dashboard />
      ) : (
        <LandingPage onLaunch={handleLaunch} />
      )}
    </OverlayProvider>
  );
};

export default Index;
