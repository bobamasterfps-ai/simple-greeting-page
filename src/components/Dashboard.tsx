import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { OverviewPage } from './pages/OverviewPage';
import { OverlayPage } from './pages/OverlayPage';
import { SessionPage } from './pages/SessionPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CreatorPage } from './pages/CreatorPage';
import { LineupsPage } from './pages/LineupsPage';
import { CoachPage } from './pages/CoachPage';
import { ClipAnalysisPage } from './pages/ClipAnalysisPage';
import { AutoStatPage } from './pages/AutoStatPage';
import { StrategyLibraryPage } from './pages/StrategyLibraryPage';
import { TeamsPage } from './pages/TeamsPage';
import { ShortsGeneratorPage } from './pages/ShortsGeneratorPage';
import { useOverlay } from '@/context/OverlayContext';

export function Dashboard() {
  const [activePage, setActivePage] = useState('overview');
  const { isAnimating, lastResult, settings } = useOverlay();

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage />;
      case 'overlay':
        return <OverlayPage />;
      case 'session':
        return <SessionPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'lineups':
        return <LineupsPage />;
      case 'autostat':
        return <AutoStatPage />;
      case 'library':
        return <StrategyLibraryPage />;
      case 'coach':
        return <CoachPage />;
      case 'clips':
        return <ClipAnalysisPage />;
      case 'teams':
        return <TeamsPage />;
      case 'shorts':
        return <ShortsGeneratorPage />;
      case 'settings':
        return <SettingsPage />;
      case 'creator':
        return <CreatorPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed gradient-orb gradient-orb-1 pointer-events-none" />
      <div className="fixed gradient-orb gradient-orb-2 pointer-events-none" />

      {/* Flash animations */}
      {isAnimating && lastResult === 'win' && settings.showWinFlash && (
        <div className="fixed inset-0 pointer-events-none animate-win-flash z-50" />
      )}
      {isAnimating && lastResult === 'loss' && settings.showLossFlash && (
        <div className="fixed inset-0 pointer-events-none animate-loss-flash z-50" />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activePage={activePage} onPageChange={setActivePage} />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav activePage={activePage} onPageChange={setActivePage} />
      </div>

      {/* Main Content */}
      <main className="lg:ml-[280px] min-h-screen p-4 md:p-6 lg:p-8 relative z-10 pb-24 lg:pb-8">
        <div className="max-w-6xl mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
