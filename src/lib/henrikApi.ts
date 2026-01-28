/**
 * Henrik API Client - Server-side proxy version
 * All calls go through the edge function with auth
 */
import { supabase } from '@/integrations/supabase/client';

export interface MMRResponse {
  status: number;
  data: {
    current_data: {
      currenttier: number;
      currenttierpatched: string;
      ranking_in_tier: number;
      mmr_change_to_last_game: number;
      elo: number;
    };
  };
}

export interface AccountResponse {
  status: number;
  data: {
    puuid: string;
    region: string;
    account_level: number;
    name: string;
    tag: string;
  };
}

export interface MatchPlayer {
  puuid: string;
  name: string;
  tag: string;
  team: string;
  character: string;
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    headshots: number;
    bodyshots: number;
    legshots: number;
  };
}

export interface MatchResponse {
  status: number;
  data: Array<{
    metadata: {
      matchid: string;
      map: string;
      game_start: number;
      mode: string;
    };
    players: {
      all_players: MatchPlayer[];
    };
    teams: {
      red: { has_won: boolean; rounds_won: number; rounds_lost: number };
      blue: { has_won: boolean; rounds_won: number; rounds_lost: number };
    };
  }>;
}

export interface ParsedMatch {
  id: string;
  map: string;
  result: 'win' | 'loss';
  score: string;
  timestamp: number;
  agent: string;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  rrChange?: number;
}

export interface LifetimeStats {
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  matches: number;
  kd: number;
  winPercent: number;
  headshotPercent: number;
  agentStats: Record<string, { matches: number; wins: number; kills: number; deaths: number }>;
}

/**
 * Server-side API client that proxies through edge function
 */
export class HenrikDevAPI {
  private async callEdgeFunction<T>(body: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.functions.invoke('henrik-api', {
      body,
    });

    if (error) {
      throw new Error(`API Error: ${error.message}`);
    }

    if (data?.error) {
      throw new Error(`API Error: ${data.error}`);
    }

    return data as T;
  }

  async getAccount(name: string, tag: string): Promise<AccountResponse> {
    return this.callEdgeFunction<AccountResponse>({
      endpoint: 'account',
      name,
      tag,
    });
  }

  async getMMR(region: string, name: string, tag: string): Promise<MMRResponse> {
    return this.callEdgeFunction<MMRResponse>({
      endpoint: 'mmr',
      region,
      name,
      tag,
    });
  }

  async getMatchHistory(
    region: string, 
    name: string, 
    tag: string, 
    mode: string = 'competitive', 
    size: number = 10
  ): Promise<MatchResponse> {
    return this.callEdgeFunction<MatchResponse>({
      endpoint: 'matches',
      region,
      name,
      tag,
      mode,
      size,
    });
  }
}

export function parseMMRData(response: MMRResponse) {
  const data = response.data.current_data;
  return {
    rr: data.ranking_in_tier,
    tierName: data.currenttierpatched,
    tierId: data.currenttier,
    lastChange: data.mmr_change_to_last_game,
    elo: data.elo,
  };
}

export function parseMatchData(response: MatchResponse, playerName: string, playerTag: string): ParsedMatch[] {
  return response.data.map(match => {
    const player = match.players.all_players.find(
      p => p.name.toLowerCase() === playerName.toLowerCase() && p.tag.toLowerCase() === playerTag.toLowerCase()
    );
    
    if (!player) return null;

    const playerTeam = player.team.toLowerCase() as 'red' | 'blue';
    const teamData = match.teams[playerTeam];
    const won = teamData.has_won;

    const result: 'win' | 'loss' = won ? 'win' : 'loss';

    return {
      id: match.metadata.matchid,
      map: match.metadata.map,
      result,
      score: `${teamData.rounds_won}-${teamData.rounds_lost}`,
      timestamp: match.metadata.game_start * 1000,
      agent: player.character || 'Unknown',
      kills: player.stats?.kills || 0,
      deaths: player.stats?.deaths || 0,
      assists: player.stats?.assists || 0,
      headshots: player.stats?.headshots || 0,
      bodyshots: player.stats?.bodyshots || 0,
      legshots: player.stats?.legshots || 0,
      rrChange: 0, // Will be populated from MMR data
    } as ParsedMatch;
  }).filter((m): m is ParsedMatch => m !== null);
}

export function calculateLifetimeStats(matches: ParsedMatch[]): LifetimeStats {
  const stats: LifetimeStats = {
    wins: 0,
    losses: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    headshots: 0,
    bodyshots: 0,
    legshots: 0,
    matches: matches.length,
    kd: 0,
    winPercent: 0,
    headshotPercent: 0,
    agentStats: {},
  };

  matches.forEach(match => {
    if (match.result === 'win') stats.wins++;
    else stats.losses++;
    
    stats.kills += match.kills;
    stats.deaths += match.deaths;
    stats.assists += match.assists;
    stats.headshots += match.headshots;
    stats.bodyshots += match.bodyshots;
    stats.legshots += match.legshots;
    
    // Agent stats
    const agent = match.agent || 'Unknown';
    if (!stats.agentStats[agent]) {
      stats.agentStats[agent] = { matches: 0, wins: 0, kills: 0, deaths: 0 };
    }
    stats.agentStats[agent].matches++;
    if (match.result === 'win') stats.agentStats[agent].wins++;
    stats.agentStats[agent].kills += match.kills;
    stats.agentStats[agent].deaths += match.deaths;
  });

  stats.kd = stats.deaths > 0 ? Math.round((stats.kills / stats.deaths) * 100) / 100 : stats.kills;
  stats.winPercent = stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : 0;
  const totalShots = stats.headshots + stats.bodyshots + stats.legshots;
  stats.headshotPercent = totalShots > 0 ? Math.round((stats.headshots / totalShots) * 100) : 0;

  return stats;
}
