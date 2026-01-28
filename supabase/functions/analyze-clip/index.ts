/**
 * Analyze Clip Edge Function
 * AI-powered gameplay screenshot analysis with auth protection
 */
import { corsHeaders, authGuard, unauthorizedResponse } from "../_shared/auth-guard.ts";

// Input validation constants
const MAX_IMAGES = 8;
const MAX_CONTEXT_LENGTH = 500;
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

interface ClipRequest {
  imageUrls: string[];
  context?: string;
}

function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

function validateInput(body: unknown): ClipRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { imageUrl, imageUrls, context } = body as Record<string, unknown>;
  
  // Support both single URL and array
  let urls: string[] = [];
  
  if (imageUrls) {
    if (!Array.isArray(imageUrls)) {
      throw new Error('imageUrls must be an array');
    }
    urls = imageUrls;
  } else if (imageUrl) {
    if (typeof imageUrl !== 'string') {
      throw new Error('imageUrl must be a string');
    }
    urls = [imageUrl];
  }
  
  if (urls.length === 0) {
    throw new Error('At least one image URL is required');
  }
  
  if (urls.length > MAX_IMAGES) {
    throw new Error(`Maximum ${MAX_IMAGES} images allowed`);
  }
  
  // Validate each URL
  const validatedUrls: string[] = [];
  for (const url of urls) {
    if (typeof url !== 'string') {
      throw new Error('All image URLs must be strings');
    }
    if (!validateUrl(url)) {
      throw new Error(`Invalid URL format: ${url.substring(0, 50)}`);
    }
    validatedUrls.push(url);
  }
  
  // Validate context
  if (context !== undefined && context !== null) {
    if (typeof context !== 'string') {
      throw new Error('Context must be a string');
    }
    if (context.length > MAX_CONTEXT_LENGTH) {
      throw new Error(`Context must be less than ${MAX_CONTEXT_LENGTH} characters`);
    }
  }
  
  return {
    imageUrls: validatedUrls,
    context: context ? String(context).trim() : undefined,
  };
}

// Convert image URL to base64 for AI vision models
async function imageUrlToBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SpikeVista/1.0)',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    
    return { base64, mimeType: contentType.split(';')[0] };
  } catch (error) {
    console.error(`Error converting image to base64:`, error);
    return null;
  }
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
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Invalid JSON body' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    let validatedInput: ClipRequest;
    try {
      validatedInput = validateInput(body);
    } catch (e) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: e instanceof Error ? e.message : 'Validation failed' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { imageUrls, context } = validatedInput;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'AI service not configured' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert images to base64 for vision model
    const imageContents: Array<{ type: string; image_url: { url: string } }> = [];
    
    for (const url of imageUrls) {
      const imageData = await imageUrlToBase64(url);
      
      if (imageData) {
        // Use data URL format for base64
        imageContents.push({
          type: "image_url",
          image_url: { 
            url: `data:${imageData.mimeType};base64,${imageData.base64}` 
          }
        });
      } else {
        // Fallback: try direct URL (some models support it)
        imageContents.push({
          type: "image_url",
          image_url: { url }
        });
      }
    }

    if (imageContents.length === 0) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Could not process any of the provided images' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // RADIANT-LEVEL CLIP ANALYSIS PROMPT
    const systemPrompt = `You are a Radiant-level VALORANT gameplay analyst reviewing ${imageContents.length > 1 ? 'a sequence of frames from gameplay' : 'a gameplay screenshot'}.

ANALYSIS RULES:
1. Focus ONLY on what's visible in the image(s)
2. Be specific — reference exact positions, angles, elements you see
3. Use bullet points — max 4-5 per section
4. Radiant-level standards — compare to pro/Radiant plays
5. No generic advice — only what applies to THIS specific situation

ANALYZE THESE ASPECTS (in order):

**CROSSHAIR PLACEMENT:**
• Is it head-level?
• Is it pre-aimed at common angles?
• Distance from corners (too close/far?)

**POSITIONING:**
• Exposed angles?
• Cover usage?
• Trade-able position?
• Off-angles vs predictable spots

**UTILITY (if visible):**
• Timing of usage
• Efficiency
• Could it be used better?

**DECISION-MAKING:**
• Was this the right play?
• What would a Radiant do differently?
• Risk vs reward assessment

RESPONSE FORMAT:
Return exactly this structure:

**✅ Good Plays:**
• [specific thing done well]
• [another good element]

**❌ Mistakes:**
• [specific error with WHY it's wrong]
• [another mistake]

**🎯 Radiant-Level Improvements:**
• [what a Radiant would do instead]
• [specific actionable fix]

Keep it tactical and concise. No fluff.

${context ? `\nPLAYER CONTEXT: ${context}` : ''}`;

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { 
            type: "text", 
            text: imageContents.length > 1 
              ? `Analyze these ${imageContents.length} gameplay frames as a sequence (showing decision flow):`
              : "Analyze this VALORANT gameplay screenshot:"
          },
          ...imageContents
        ]
      }
    ];

    // Use vision-capable model (Gemini Pro supports vision)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          ok: false, 
          error: "Rate limit exceeded. Please try again in a moment." 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "AI analysis temporarily unavailable. Please try again." 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;
    
    if (!analysis) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Could not generate analysis. Please try with a different image." 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      analysis 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Analyze clip error:', error);
    
    // NEVER return 500 - always return graceful error
    return new Response(JSON.stringify({ 
      ok: false, 
      error: 'Analysis failed. Please try again with a different image.' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
