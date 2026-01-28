import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAPIPolling } from './useAPIPolling';
import { HenrikDevAPI, parseMatchData, ParsedMatch } from '@/lib/henrikApi';

export interface MatchData {
  id: string;
  result: 'win' | 'loss';
  map: string;
  score: string;
  rrChange: number;
  timestamp: number;
  agent?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  headshots?: number;
  bodyshots?: number;
  legshots?: number;
}

export interface PlayerConfig {
  username: string;
  tag: string;
  region: string;
  apiKey: string;
  platform: string;
}

export interface Settings {
  theme: string;
  refreshInterval: number;
  showWinFlash: boolean;
  showLossFlash: boolean;
  showParticles: boolean;
  showPromoGlow: boolean;
  showDonationBadge: boolean;
  showMascot: boolean;
}

export interface MMRData {
  rr: number;
  tierName: string;
  tierId: number;
  lastChange: number;
}

export interface SessionState {
  wins: number;
  losses: number;
  prevRR: number;
  lastChange: number;
  startingRR: number;
  matchHistory: MatchData[];
  sessionStart: number;
  isPaused: boolean;
}

export interface DailyStats {
  wins: number;
  losses: number;
  matches: number;
  netRR: number;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  kd: number;
  winRate: number;
  kda: string;
}

export interface LifetimeStats {
  wins: number;
  losses: number;
  matches: number;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  kd: number;
  winRate: number;
  headshotPercent: number;
  agentStats: AgentStat[];
  mostPlayedAgent: string | null;
  favoriteAgent: string | null;
}

export interface AgentStat {
  name: string;
  matches: number;
  wins: number;
  kills: number;
  deaths: number;
  kd: number;
  winRate: number;
}

// Global state for OBS overlays
declare global {
  interface Window {
    __STREAMSPIKE_STATE__?: {
      dailyStats: DailyStats;
      lifetimeStats: LifetimeStats | null;
      latestMatch: MatchData | null;
      rank: string;
      rr: number;
      tierId: number;
      lastRR: number;
      netRR: number;
      username: string;
      tag: string;
      wins: number;
      losses: number;
    };
  }
}

const defaultConfig: PlayerConfig = {
  username: '',
  tag: '',
  region: 'na',
  apiKey: '',
  platform: 'pc',
};

const defaultSettings: Settings = {
  theme: 'bar',
  refreshInterval: 30000,
  showWinFlash: true,
  showLossFlash: true,
  showParticles: true,
  showPromoGlow: true,
  showDonationBadge: false,
  showMascot: true,
};

const defaultState: SessionState = {
  wins: 0,
  losses: 0,
  prevRR: 0,
  lastChange: 0,
  startingRR: 0,
  matchHistory: [],
  sessionStart: Date.now(),
  isPaused: false,
};

const STORAGE_KEY = 'valorant-overlay-config';

export function useOverlayState() {
  const [config, setConfig] = useState<PlayerConfig>(defaultConfig);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [state, setState] = useState<SessionState>(defaultState);
  const [mmrData, setMmrData] = useState<MMRData | null>(null);
  const [transparencies, setTransparencies] = useState<Record<string, boolean>>({
    bar: true,
    card: true,
    compact: true,
    circle: true,
    minimal: true,
  });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error' | 'disconnected'>('disconnected');
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastResult, setLastResult] = useState<'win' | 'loss' | null>(null);
  const [apiEnabled, setApiEnabled] = useState(false);
  const [fullMatchHistory, setFullMatchHistory] = useState<ParsedMatch[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activityFeed, setActivityFeed] = useState<Array<{ id: string; message: string; type: 'win' | 'loss' | 'rr' | 'session'; timestamp: number }>>([]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.config) setConfig(parsed.config);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.state) setState(parsed.state);
        if (parsed.transparencies) setTransparencies({ ...transparencies, ...parsed.transparencies });
        if (parsed.mmrData) setMmrData(parsed.mmrData);
        if (parsed.apiEnabled) setApiEnabled(parsed.apiEnabled);
      } catch (e) {
        console.error('Failed to parse saved state:', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    const data = { config, settings, state, transparencies, mmrData, apiEnabled };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [config, settings, state, transparencies, mmrData, apiEnabled]);

  // TODAY-ONLY MATCH FILTER (Critical for daily stats)
  const todayMatches = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return fullMatchHistory.filter(m => {
      const gameTime = new Date(m.timestamp);
      return gameTime >= today;
    });
  }, [fullMatchHistory]);

  // DAILY STATS (Today only)
  const dailyStats = useMemo((): DailyStats => {
    let wins = 0, losses = 0, kills = 0, deaths = 0, assists = 0, headshots = 0, netRR = 0;
    
    todayMatches.forEach(m => {
      if (m.result === 'win') wins++;
      else losses++;
      
      kills += m.kills;
      deaths += m.deaths;
      assists += m.assists;
      headshots += m.headshots;
      netRR += m.rrChange || 0;
    });

    const matches = todayMatches.length;
    const kd = deaths > 0 ? Math.round((kills / deaths) * 100) / 100 : kills;
    const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;

    return {
      wins,
      losses,
      matches,
      netRR,
      kills,
      deaths,
      assists,
      headshots,
      kd,
      winRate,
      kda: `${kills}/${deaths}/${assists}`,
    };
  }, [todayMatches]);

  // LIFETIME STATS (All matches)
  const lifetimeStats = useMemo((): LifetimeStats | null => {
    if (fullMatchHistory.length === 0) return null;

    let wins = 0, losses = 0, kills = 0, deaths = 0, assists = 0, headshots = 0, bodyshots = 0, legshots = 0;
    const agentMap: Record<string, { matches: number; wins: number; kills: number; deaths: number }> = {};

    fullMatchHistory.forEach(m => {
      if (m.result === 'win') wins++;
      else losses++;

      kills += m.kills;
      deaths += m.deaths;
      assists += m.assists;
      headshots += m.headshots;
      bodyshots += m.bodyshots;
      legshots += m.legshots;

      // Agent stats
      const agent = m.agent || 'Unknown';
      if (!agentMap[agent]) {
        agentMap[agent] = { matches: 0, wins: 0, kills: 0, deaths: 0 };
      }
      agentMap[agent].matches++;
      if (m.result === 'win') agentMap[agent].wins++;
      agentMap[agent].kills += m.kills;
      agentMap[agent].deaths += m.deaths;
    });

    const matches = fullMatchHistory.length;
    const kd = deaths > 0 ? Math.round((kills / deaths) * 100) / 100 : kills;
    const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
    const totalShots = headshots + bodyshots + legshots;
    const headshotPercent = totalShots > 0 ? Math.round((headshots / totalShots) * 100) : 0;

    const agentStats: AgentStat[] = Object.entries(agentMap)
      .map(([name, s]) => ({
        name,
        matches: s.matches,
        wins: s.wins,
        kills: s.kills,
        deaths: s.deaths,
        kd: s.deaths > 0 ? Math.round((s.kills / s.deaths) * 100) / 100 : s.kills,
        winRate: s.matches > 0 ? Math.round((s.wins / s.matches) * 100) : 0,
      }))
      .sort((a, b) => b.matches - a.matches);

    const mostPlayedAgent = agentStats.length > 0 ? agentStats[0].name : null;
    const favoriteAgent = agentStats.reduce((best, curr) => 
      !best || (curr.winRate > best.winRate && curr.matches >= 3) ? curr : best
    , agentStats[0])?.name || null;

    return {
      wins,
      losses,
      matches,
      kills,
      deaths,
      assists,
      headshots,
      kd,
      winRate,
      headshotPercent,
      agentStats,
      mostPlayedAgent,
      favoriteAgent,
    };
  }, [fullMatchHistory]);

  // Daily vs Lifetime comparison
  const statsComparison = useMemo(() => {
    if (!lifetimeStats) return null;
    return {
      kdDiff: Math.round((dailyStats.kd - lifetimeStats.kd) * 100) / 100,
      winRateDiff: dailyStats.winRate - lifetimeStats.winRate,
    };
  }, [dailyStats, lifetimeStats]);

  // Session stats (from state, for current session)
  const sessionNetRR = (mmrData?.rr || 0) - state.startingRR;
  const totalMatches = state.wins + state.losses;
  const winRate = totalMatches > 0 ? Math.round((state.wins / totalMatches) * 100) : 0;
  const sessionDuration = Date.now() - state.sessionStart;

  // Update global state for OBS overlays
  useEffect(() => {
    window.__STREAMSPIKE_STATE__ = {
      dailyStats,
      lifetimeStats,
      latestMatch: state.matchHistory[0] || null,
      rank: mmrData?.tierName || 'Unranked',
      rr: mmrData?.rr || 0,
      tierId: mmrData?.tierId || 0,
      lastRR: mmrData?.lastChange || 0,
      netRR: dailyStats.netRR,
      username: config.username,
      tag: config.tag,
      wins: dailyStats.wins,
      losses: dailyStats.losses,
    };
  }, [dailyStats, lifetimeStats, state, mmrData, config]);

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const addActivity = useCallback((message: string, type: 'win' | 'loss' | 'rr' | 'session') => {
    setActivityFeed(prev => [{
      id: Date.now().toString(),
      message,
      type,
      timestamp: Date.now(),
    }, ...prev].slice(0, 50));
  }, []);

  const updateConfig = useCallback((updates: Partial<PlayerConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const updateState = useCallback((updates: Partial<SessionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateTransparency = useCallback((theme: string, value: boolean) => {
    setTransparencies(prev => ({ ...prev, [theme]: value }));
  }, []);

  const resetSession = useCallback(() => {
    setState({
      wins: 0,
      losses: 0,
      prevRR: mmrData?.rr || 0,
      lastChange: 0,
      startingRR: mmrData?.rr || 0,
      matchHistory: [],
      sessionStart: Date.now(),
      isPaused: false,
    });
    addActivity('New session started', 'session');
  }, [mmrData, addActivity]);

  const pauseSession = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: true }));
    addActivity('Session paused', 'session');
  }, [addActivity]);

  const resumeSession = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: false }));
    addActivity('Session resumed', 'session');
  }, [addActivity]);

  const clearAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setConfig(defaultConfig);
    setSettings(defaultSettings);
    setState(defaultState);
    setMmrData(null);
    setTransparencies({ bar: true, card: true, compact: true, circle: true, minimal: true });
    setConnectionStatus('disconnected');
    setApiEnabled(false);
    setFullMatchHistory([]);
    setActivityFeed([]);
  }, []);

  const handleMMRUpdate = useCallback((data: MMRData) => {
    setMmrData(prev => {
      // Check for rank change
      if (prev && prev.tierId !== data.tierId) {
        addActivity(`Rank changed: ${data.tierName}`, 'rr');
      }
      return data;
    });
    setState(prev => ({
      ...prev,
      lastChange: data.lastChange,
    }));
  }, [addActivity]);

  const addMatch = useCallback((match: MatchData) => {
    if (state.isPaused) return;
    
    setState(prev => ({
      ...prev,
      matchHistory: [match, ...prev.matchHistory].slice(0, 20),
      wins: match.result === 'win' ? prev.wins + 1 : prev.wins,
      losses: match.result === 'loss' ? prev.losses + 1 : prev.losses,
      lastChange: match.rrChange,
    }));
    setLastResult(match.result);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);

    // Add to activity feed
    const rrText = match.rrChange >= 0 ? `+${match.rrChange}` : `${match.rrChange}`;
    addActivity(`${match.result === 'win' ? 'Win' : 'Loss'} on ${match.map} (${rrText} RR)`, match.result);
  }, [state.isPaused, addActivity]);

  // Fetch full match history when API is enabled
  const fetchFullMatchHistory = useCallback(async () => {
    if (!config.apiKey || !config.username || !config.tag || !config.region) return;
    
    setIsLoadingHistory(true);
    try {
      const api = new HenrikDevAPI();
      const response = await api.getMatchHistory(config.region, config.username, config.tag, 'competitive', 20);
      const matches = parseMatchData(response, config.username, config.tag);
      setFullMatchHistory(matches);
    } catch (error) {
      console.error('Failed to fetch match history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [config.apiKey, config.username, config.tag, config.region]);

  const enableAPI = useCallback(() => {
    setApiEnabled(true);
    if (mmrData) {
      setState(prev => ({
        ...prev,
        startingRR: mmrData.rr,
        prevRR: mmrData.rr,
      }));
    }
    fetchFullMatchHistory();
    addActivity('Connected to Henrik API', 'session');
  }, [mmrData, fetchFullMatchHistory, addActivity]);

  const disableAPI = useCallback(() => {
    setApiEnabled(false);
    setConnectionStatus('disconnected');
    addActivity('Disconnected from API', 'session');
  }, [addActivity]);

  // API Polling
  useAPIPolling({
    apiKey: config.apiKey,
    username: config.username,
    tag: config.tag,
    region: config.region,
    refreshInterval: settings.refreshInterval,
    enabled: apiEnabled && !!config.apiKey && !!config.username && !!config.tag && !state.isPaused,
    onMMRUpdate: handleMMRUpdate,
    onNewMatch: addMatch,
    onStatusChange: setConnectionStatus,
  });

  // Get last played agent
  const lastPlayedAgent = useMemo(() => {
    if (fullMatchHistory.length === 0) return null;
    return fullMatchHistory[0]?.agent || null;
  }, [fullMatchHistory]);

  return {
    config,
    settings,
    state,
    mmrData,
    transparencies,
    connectionStatus,
    isAnimating,
    lastResult,
    apiEnabled,
    sessionNetRR,
    totalMatches,
    winRate,
    sessionDuration: formatDuration(sessionDuration),
    fullMatchHistory,
    todayMatches,
    dailyStats,
    lifetimeStats,
    statsComparison,
    isLoadingHistory,
    activityFeed,
    lastPlayedAgent,
    updateConfig,
    updateSettings,
    updateState,
    updateTransparency,
    resetSession,
    pauseSession,
    resumeSession,
    clearAllData,
    addMatch,
    setMmrData,
    setConnectionStatus,
    enableAPI,
    disableAPI,
    fetchFullMatchHistory,
    addActivity,
  };
}

export type UseOverlayStateReturn = ReturnType<typeof useOverlayState>;
