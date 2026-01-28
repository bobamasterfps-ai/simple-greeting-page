import { useState, useEffect, useCallback, useRef } from 'react';
import { HenrikDevAPI, parseMMRData, parseMatchData } from '@/lib/henrikApi';
import { MatchData } from './useOverlayState';

interface UseAPIPollingProps {
  apiKey: string;
  username: string;
  tag: string;
  region: string;
  refreshInterval: number;
  enabled: boolean;
  onMMRUpdate: (data: { rr: number; tierName: string; tierId: number; lastChange: number }) => void;
  onNewMatch: (match: MatchData) => void;
  onStatusChange: (status: 'connected' | 'connecting' | 'error' | 'disconnected') => void;
}

export function useAPIPolling({
  apiKey,
  username,
  tag,
  region,
  refreshInterval,
  enabled,
  onMMRUpdate,
  onNewMatch,
  onStatusChange,
}: UseAPIPollingProps) {
  const [lastRR, setLastRR] = useState<number | null>(null);
  const [lastMatchId, setLastMatchId] = useState<string | null>(null);
  const apiRef = useRef<HenrikDevAPI | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!apiKey || !username || !tag || !region) return;

    try {
      onStatusChange('connecting');
      
      if (!apiRef.current) {
        apiRef.current = new HenrikDevAPI();
      }

      // Fetch MMR data
      const mmrResponse = await apiRef.current.getMMR(region, username, tag);
      const mmrData = parseMMRData(mmrResponse);
      
      if (!isMountedRef.current) return;
      
      onMMRUpdate(mmrData);
      onStatusChange('connected');

      // Check for RR changes (new match detected)
      if (lastRR !== null && mmrData.rr !== lastRR) {
        // Fetch latest match to get details
        try {
          const matchResponse = await apiRef.current.getMatchHistory(region, username, tag, 'competitive', 1);
          const matches = parseMatchData(matchResponse, username, tag);
          
          if (!isMountedRef.current) return;
          
          if (matches.length > 0) {
            const latestMatch = matches[0];
            if (latestMatch.id !== lastMatchId) {
              const newMatch: MatchData = {
                id: latestMatch.id,
                result: latestMatch.result,
                map: latestMatch.map,
                score: latestMatch.score,
                rrChange: mmrData.lastChange,
                timestamp: latestMatch.timestamp,
                agent: latestMatch.agent,
                kills: latestMatch.kills,
                deaths: latestMatch.deaths,
                assists: latestMatch.assists,
                headshots: latestMatch.headshots,
                bodyshots: latestMatch.bodyshots,
                legshots: latestMatch.legshots,
              };
              onNewMatch(newMatch);
              setLastMatchId(latestMatch.id);
            }
          }
        } catch (matchError) {
          console.error('Failed to fetch match history:', matchError);
        }
      }

      setLastRR(mmrData.rr);
    } catch (error) {
      console.error('API polling error:', error);
      if (isMountedRef.current) {
        onStatusChange('error');
      }
    }
  }, [apiKey, username, tag, region, lastRR, lastMatchId, onMMRUpdate, onNewMatch, onStatusChange]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (!enabled) {
      onStatusChange('disconnected');
      return;
    }

    // Initial fetch
    fetchData();

    // Set up polling interval
    const intervalId = setInterval(fetchData, refreshInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [enabled, refreshInterval, fetchData, onStatusChange]);

  const manualRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { manualRefresh };
}
