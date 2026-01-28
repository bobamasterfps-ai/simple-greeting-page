/**
 * Generate Strategy Edge Function
 * AI-powered strategy generation with auth protection
 */
import { corsHeaders, authGuard, unauthorizedResponse } from "../_shared/auth-guard.ts";

// Input validation constants
const VALID_MAPS = ['Ascent', 'Bind', 'Breeze', 'Fracture', 'Haven', 'Icebox', 'Lotus', 'Pearl', 'Split', 'Sunset', 'Abyss'];
const VALID_SIDES = ['attack', 'defense', 'Attack', 'Defense'];
const VALID_PLAYSTYLES = ['Fast Entry', 'Slow Default', 'Split Push', 'Fake & Rotate', 'Retake', 'Post-plant'];
const VALID_AGENTS = [
  'Astra', 'Breach', 'Brimstone', 'Chamber', 'Clove', 'Cypher', 'Deadlock',
  'Fade', 'Gekko', 'Harbor', 'Iso', 'Jett', 'KAY/O', 'Killjoy', 'Neon',
  'Omen', 'Phoenix', 'Raze', 'Reyna', 'Sage', 'Skye', 'Sova', 'Tejo', 'Viper', 'Vyse', 'Waylay', 'Yoru'
];
const MAX_AGENTS = 5;

interface StrategyRequest {
  map: string;
  side: string;
  playstyle: string;
  agents: string[];
  geometry?: Record<string, unknown>;
}

function validateInput(body: unknown): StrategyRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { map, side, playstyle, agents, geometry } = body as Record<string, unknown>;
  
  if (!map || typeof map !== 'string') throw new Error('Map is required');
  if (!VALID_MAPS.includes(map)) throw new Error(`Invalid map. Must be one of: ${VALID_MAPS.join(', ')}`);
  if (!side || typeof side !== 'string') throw new Error('Side is required');
  if (!VALID_SIDES.includes(side)) throw new Error('Side must be "attack" or "defense"');
  if (!playstyle || typeof playstyle !== 'string') throw new Error('Playstyle is required');
  if (!VALID_PLAYSTYLES.includes(playstyle)) throw new Error(`Invalid playstyle`);
  if (!agents || !Array.isArray(agents)) throw new Error('Agents must be an array');
  if (agents.length === 0 || agents.length > MAX_AGENTS) throw new Error(`Must provide 1-${MAX_AGENTS} agents`);
  
  const validatedAgents: string[] = [];
  for (const agent of agents) {
    if (typeof agent !== 'string') throw new Error('All agents must be strings');
    if (!VALID_AGENTS.includes(agent)) throw new Error(`Invalid agent: ${agent}`);
    validatedAgents.push(agent);
  }
  
  let validatedGeometry: Record<string, unknown> | undefined;
  if (geometry !== undefined && geometry !== null) {
    if (typeof geometry !== 'object' || Array.isArray(geometry)) throw new Error('Geometry must be an object');
    const allowedKeys = ['sites', 'chokes', 'spawn'];
    const geo = geometry as Record<string, unknown>;
    validatedGeometry = {};
    for (const key of allowedKeys) {
      if (geo[key] !== undefined) validatedGeometry[key] = geo[key];
    }
  }
  
  return { map, side: side.toLowerCase(), playstyle, agents: validatedAgents, geometry: validatedGeometry };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check - require logged in user for strategy generation
  const guard = await authGuard(req);
  if (guard.error) {
    return unauthorizedResponse(guard.error);
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    let validatedInput: StrategyRequest;
    try {
      validatedInput = validateInput(body);
    } catch (e) {
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Validation failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { map, side, playstyle, agents, geometry } = validatedInput;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // PURE JSON SYSTEM PROMPT - ALL COORDINATES ARE NORMALIZED 0-1
    const systemPrompt = `You are a Radiant-level VALORANT IGL and visual strategy engine.

ABSOLUTE RULES (MUST FOLLOW):
1. Output ONLY valid JSON - NO markdown, NO explanations, NO text
2. ALL coordinates are NORMALIZED 0-1 range (0.05 to 0.95 is safe zone)
3. x: 0.05=far left, 0.95=far right
4. y: 0.05=top (defender spawn), 0.95=bottom (attacker spawn)
5. Duration should be 12-15 seconds maximum for fast, engaging animations
6. ALL radius values are NORMALIZED 0-1 (e.g., 0.08 = 8% of map)

AGENT ROLES:
- Duelist: Entry (Jett, Reyna, Raze, Phoenix, Yoru, Neon, Iso, Waylay)
- Initiator: Flash/info (Sova, Breach, Skye, KAY/O, Fade, Gekko, Tejo)
- Controller: Smokes (Brimstone, Omen, Viper, Astra, Harbor, Clove)
- Sentinel: Flank/anchor (Sage, Cypher, Killjoy, Chamber, Deadlock, Vyse)

ABILITY SLOTS:
- Ability1: First purchasable (C key)
- Ability2: Second purchasable (Q key)
- Grenade: Signature (E key, free)
- Ultimate: Ultimate (X key)

VISUAL TYPES with NORMALIZED RADIUS:
- smoke: smokes, orbs, dark cover (radius: 0.08)
- flash: flashes, blinds, curveball (radius: 0.06)
- molly: mollies, incendiary, snake bite (radius: 0.07)
- recon: reveals, drones, recon bolt (radius: 0.12)
- wall: walls, barriers, toxic screen (radius: 0.15)
- stun: stuns, concuss, fault line (radius: 0.06)
- trap: traps, tripwires, turrets (radius: 0.04)
- movement: dashes, teleports (radius: 0.05)

SITE POSITIONS (NORMALIZED 0-1):
- A Site: x=0.75, y=0.25
- B Site: x=0.25, y=0.25
- C Site (Haven/Lotus): x=0.50, y=0.25
- Attack Spawn: y=0.80-0.85
- Defense Spawn: y=0.15-0.20

OUTPUT SCHEMA (STRICT JSON):
{
  "map": "MapName",
  "site": "A",
  "side": "attack",
  "duration": 12,
  "steps": [
    {"t": 0, "type": "spawn", "agent": "Omen", "from": {"x": 0.45, "y": 0.82}},
    {"t": 3, "type": "ability", "agent": "Omen", "ability": "Dark Cover", "abilitySlot": "Grenade", "from": {"x": 0.45, "y": 0.70}, "to": {"x": 0.75, "y": 0.28}, "visual": "smoke", "radius": 0.08},
    {"t": 5, "type": "move", "agent": "Jett", "path": [{"x": 0.50, "y": 0.65}, {"x": 0.70, "y": 0.40}]}
  ],
  "chatCall": "Omen smoke site Jett dash entry"
}

Keep strategies tight and realistic - 12-15 seconds total, 8-12 steps.`;

    const userPrompt = `Generate a ${side.toUpperCase()} strategy for ${map} with playstyle: ${playstyle}.

Team: ${agents.join(", ")}

${geometry ? `Map geometry:
- Sites: ${JSON.stringify(geometry.sites)}
- Chokes: ${JSON.stringify(geometry.chokes)}
- Spawn: ${JSON.stringify(geometry.spawn)}` : ""}

Output ONLY valid JSON. No markdown code blocks. No explanations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let strategy;
    try {
      // Remove markdown if present
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      strategy = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse strategy JSON:", content);
      // Generate fallback strategy with NORMALIZED 0-1 coordinates
      const sites = geometry?.sites as Array<{name: string; center: [number, number]}> || [{ name: 'A', center: [0.75, 0.25] }];
      const targetSite = sites[0];
      // Normalize site coords if they're in 0-100 range
      const siteX = targetSite.center[0] > 1 ? targetSite.center[0] / 100 : targetSite.center[0];
      const siteY = targetSite.center[1] > 1 ? targetSite.center[1] / 100 : targetSite.center[1];
      const spawn = side === 'attack' ? { x: 0.50, y: 0.85 } : { x: 0.50, y: 0.15 };
      
      const fallbackSteps: unknown[] = [];
      agents.forEach((agent, idx) => {
        // Spread agents with 0.08 offset (normalized)
        fallbackSteps.push({ t: idx * 2, type: 'spawn', agent, from: { x: spawn.x + (idx - 2) * 0.08, y: spawn.y } });
      });
      agents.slice(0, 3).forEach((agent, idx) => {
        fallbackSteps.push({
          t: 6 + idx * 2, type: 'ability', agent, ability: 'Signature', abilitySlot: 'Grenade',
          from: { x: 0.50, y: 0.70 }, to: { x: siteX, y: siteY },
          visual: idx === 0 ? 'smoke' : idx === 1 ? 'flash' : 'recon', 
          radius: idx === 0 ? 0.08 : idx === 1 ? 0.06 : 0.12 // Normalized radius
        });
      });
      agents.slice(0, 2).forEach((agent, idx) => {
        fallbackSteps.push({
          t: 12 + idx * 3, type: 'move', agent,
          path: [{ x: 0.50, y: 0.65 }, { x: siteX - 0.05 + idx * 0.10, y: siteY + 0.10 }]
        });
      });
      
      strategy = {
        map, site: targetSite.name, side, duration: 15,
        steps: fallbackSteps,
        chatCall: agents.map((a, i) => 
          i === 0 ? `${a} smoke site` : 
          i === 1 ? `${a} flash entry` : 
          i === 2 ? `${a} recon` :
          `${a} hold`
        ).join(' ')
      };
    }

    return new Response(JSON.stringify({ strategy }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Strategy generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
