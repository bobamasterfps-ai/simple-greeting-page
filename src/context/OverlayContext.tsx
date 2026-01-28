import React, { createContext, useContext, ReactNode } from 'react';
import { useOverlayState, UseOverlayStateReturn } from '@/hooks/useOverlayState';

const OverlayContext = createContext<UseOverlayStateReturn | null>(null);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const overlayState = useOverlayState();

  return (
    <OverlayContext.Provider value={overlayState}>
      {children}
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error('useOverlay must be used within an OverlayProvider');
  }
  return context;
}
