import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Henrik API base URL
const HENRIK_API = "https://api.henrikdev.xyz";

// Input validation constants
const VALID_REGIONS = ['na', 'eu', 'ap', 'kr', 'latam', 'br'];
const NAME_REGEX = /^[a-zA-Z0-9 ]{1,16}$/;
const TAG_REGEX = /^[a-zA-Z0-9]{1,5}$/;

interface OverlayParams {
  name: string;
  tag: string;
  region: string;
}

function validateParams(url: URL): OverlayParams {
  const name = url.searchParams.get("name");
  const tag = url.searchParams.get("tag");
  const region = url.searchParams.get("region") || "ap";

  if (!name || typeof name !== 'string') {
    throw new Error("Name parameter is required");
  }
  
  if (!tag || typeof tag !== 'string') {
    throw new Error("Tag parameter is required");
  }
  
  // Validate name format (Riot ID: 1-16 chars, alphanumeric + spaces)
  if (!NAME_REGEX.test(name)) {
    throw new Error("Invalid name format. Use 1-16 alphanumeric characters.");
  }
  
  // Validate tag format (1-5 alphanumeric chars)
  if (!TAG_REGEX.test(tag)) {
    throw new Error("Invalid tag format. Use 1-5 alphanumeric characters.");
  }
  
  // Validate region
  const normalizedRegion = region.toLowerCase();
  if (!VALID_REGIONS.includes(normalizedRegion)) {
    throw new Error(`Invalid region. Must be one of: ${VALID_REGIONS.join(', ')}`);
  }
  
  return {
    name: name.trim(),
    tag: tag.trim(),
    region: normalizedRegion,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Validate input parameters
    let params: OverlayParams;
    try {
      params = validateParams(url);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e instanceof Error ? e.message : "Invalid parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { name, tag, region } = params;

    const HENRIK_API_KEY = Deno.env.get("HENRIK_API_KEY");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (HENRIK_API_KEY) {
      headers["Authorization"] = HENRIK_API_KEY;
    }

    // Fetch MMR data
    const mmrResponse = await fetch(
      `${HENRIK_API}/valorant/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
      { headers }
    );

    if (!mmrResponse.ok) {
      console.error("MMR fetch failed:", mmrResponse.status);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch MMR data",
          status: "idle",
          message: "Unable to load rank data"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mmrData = await mmrResponse.json();
    const currentData = mmrData.data?.current_data || {};
    const highestData = mmrData.data?.highest_rank || {};

    // Fetch match history for wins/losses
    const matchResponse = await fetch(
      `${HENRIK_API}/valorant/v1/stored-matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?mode=competitive&size=10`,
      { headers }
    );

    let wins = 0;
    let losses = 0;
    let lastChange = 0;
    let netRR = 0;

    if (matchResponse.ok) {
      const matchData = await matchResponse.json();
      const matches = matchData.data || [];

      if (matches.length > 0) {
        // Get last match RR change
        const lastMatch = matches[0];
        if (lastMatch.stats?.team === "Blue") {
          lastChange = lastMatch.teams?.blue?.has_won ? (lastMatch.mmr_change_to_last_game || 0) : -(lastMatch.mmr_change_to_last_game || 0);
        } else {
          lastChange = lastMatch.teams?.red?.has_won ? (lastMatch.mmr_change_to_last_game || 0) : -(lastMatch.mmr_change_to_last_game || 0);
        }

        // Calculate session stats - ALWAYS use latest matches, no date filtering
        for (const match of matches) {
          const playerTeam = match.stats?.team;
          const blueWon = match.teams?.blue?.has_won;
          const redWon = match.teams?.red?.has_won;
          
          const isWin = (playerTeam === "Blue" && blueWon) || (playerTeam === "Red" && redWon);
          
          if (isWin) {
            wins++;
          } else {
            losses++;
          }

          netRR += match.mmr_change_to_last_game || 0;
        }
      }
    }

    // Build response
    const response = {
      status: "active",
      rr: currentData.ranking_in_tier || 0,
      tierName: currentData.currenttierpatched || "Unranked",
      tierId: currentData.currenttier || 0,
      wins,
      losses,
      lastChange,
      netRR,
      username: name,
      tag,
      region,
      highestRank: highestData.patched_tier || null,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Overlay data error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
