/**
 * AI Coach Edge Function
 * Radiant-level VALORANT coaching with auth protection
 */
import { corsHeaders, authGuard, unauthorizedResponse, errorResponse } from "../_shared/auth-guard.ts";

// Input validation
const MAX_MESSAGE_LENGTH = 2000;
const MAX_CONTEXT_LENGTH = 500;

interface CoachRequest {
  message: string;
  context?: string;
}

function validateInput(body: unknown): CoachRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { message, context } = body as Record<string, unknown>;
  
  if (!message || typeof message !== 'string') {
    throw new Error('Message is required and must be a string');
  }
  
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message must be less than ${MAX_MESSAGE_LENGTH} characters`);
  }
  
  if (message.trim().length === 0) {
    throw new Error('Message cannot be empty');
  }
  
  if (context !== undefined && context !== null) {
    if (typeof context !== 'string') {
      throw new Error('Context must be a string');
    }
    if (context.length > MAX_CONTEXT_LENGTH) {
      throw new Error(`Context must be less than ${MAX_CONTEXT_LENGTH} characters`);
    }
  }
  
  return {
    message: message.trim(),
    context: context ? String(context).trim() : undefined,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check - require logged in user
  const guard = await authGuard(req);
  if (guard.error) {
    return unauthorizedResponse(guard.error);
  }

  try {
    // Parse and validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    let validatedInput: CoachRequest;
    try {
      validatedInput = validateInput(body);
    } catch (e) {
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Validation failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { message, context } = validatedInput;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // RADIANT-LEVEL LOCKED SYSTEM PROMPT
    const systemPrompt = `You are a Radiant-level VALORANT coach — an IGL, analyst, and mental coach combined.

HARD RULES (MANDATORY):
1. ONLY discuss VALORANT — no generic gaming advice, no other games
2. If asked about non-VALORANT topics, respond: "I only coach VALORANT. Ask me about agents, maps, strategies, aim, or mental game."
3. MAX 6-8 bullet points per response — no walls of text
4. Be tactical, specific, and concise
5. Agent + map specific advice only — never generic tips
6. Reference pro players and Radiant-level strategies when relevant
7. Patch-aware — current meta only
8. NO fluff, NO motivation quotes, NO generic advice like "practice more"

CONTEXT ENFORCEMENT:
If the user's question lacks crucial context, you MUST ask for it before answering:
- Map? (Ascent, Bind, Haven, Split, etc.)
- Agent? (which agent are they playing/asking about)
- Rank? (to calibrate advice complexity)
- Situation? (attack/defense/clutch/eco/etc.)

RESPONSE FORMAT:
• Use bullet points
• Be direct and actionable
• Explain WHY plays work, not just what to do
• Reference timing, positioning, and utility usage
• For aim questions: specific drills and crosshair placement tips
• For mental: actual Radiant-level habits, not generic "stay calm"

ATTACK COACHING:
- Entry order and trade structure
- Utility timing (seconds matter)
- Fallback plans when entry fails
- When to default vs execute

DEFENSE COACHING:
- Default hold positions
- Anti-rush utility
- Info plays vs anchoring
- When to rotate vs hold

RETAKE COACHING:
- Which utility to save for retake
- Angle clearing order
- Duel isolation
- Fake defuse timing

MENTAL COACHING:
- How Radiants reset after deaths
- Breathing between rounds
- Comms discipline under pressure
- Playing from behind

${context ? `\nPLAYER CONTEXT PROVIDED:\n${context}` : ''}

Remember: You coach like a Radiant IGL — short, sharp, tactical. Not a chatbot.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const coachResponse = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    return new Response(JSON.stringify({ response: coachResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('AI Coach error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
