/**
 * Henrik API Edge Function
 * Server-side proxy for Valorant stats API
 * Keeps API key secure on server
 * 
 * SECURITY: API key never exposed to client
 */
import { corsHeaders, authGuard } from "../_shared/auth-guard.ts";

const HENRIK_API_BASE = "https://api.henrikdev.xyz";
const HENRIK_API_KEY = Deno.env.get("HENRIK_API_KEY");

interface RequestBody {
  endpoint: string;
  region?: string;
  name?: string;
  tag?: string;
  mode?: string;
  size?: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if API key is configured
    if (!HENRIK_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Henrik API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { endpoint, region, name, tag, mode, size } = body;

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: "Missing endpoint" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the Henrik API URL based on endpoint type
    let apiUrl: string;

    switch (endpoint) {
      case "account":
        if (!name || !tag) {
          return new Response(
            JSON.stringify({ error: "Name and tag required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        apiUrl = `${HENRIK_API_BASE}/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
        break;

      case "mmr":
        if (!region || !name || !tag) {
          return new Response(
            JSON.stringify({ error: "Region, name and tag required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        apiUrl = `${HENRIK_API_BASE}/valorant/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
        break;

      case "matches":
        if (!region || !name || !tag) {
          return new Response(
            JSON.stringify({ error: "Region, name and tag required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const matchMode = mode || "competitive";
        const matchSize = size || 10;
        apiUrl = `${HENRIK_API_BASE}/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?mode=${matchMode}&size=${matchSize}`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid endpoint" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Make request to Henrik API
    const headers: HeadersInit = {};
    if (HENRIK_API_KEY) {
      headers["Authorization"] = HENRIK_API_KEY;
    }

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Henrik API error: ${response.status} ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: "API request failed",
          status: response.status,
          message: errorText,
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Henrik API proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
