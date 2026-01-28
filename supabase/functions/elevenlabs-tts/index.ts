/**
 * ElevenLabs TTS Edge Function
 * Generates natural voice audio for strategy callouts
 * Supports English and Hindi
 */
import { corsHeaders, authGuard, unauthorizedResponse, errorResponse, successResponse } from "../_shared/auth-guard.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

// Voice IDs for different languages
const VOICE_IDS = {
  en: "JBFqnCBsd6RMkjVDRZzb", // George - calm, professional
  hi: "pFZP5JQG7iQjIQuC4Bku", // Lily - works for Hindi
};

interface TTSRequest {
  text: string;
  language?: "en" | "hi";
  voiceId?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for API key
    if (!ELEVENLABS_API_KEY) {
      console.log("ElevenLabs API key not configured, falling back to browser TTS");
      return new Response(
        JSON.stringify({ 
          fallback: true, 
          message: "Use browser TTS - ElevenLabs not configured" 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Parse request
    const body: TTSRequest = await req.json();
    const { text, language = "en", voiceId } = body;

    if (!text || text.trim().length === 0) {
      return errorResponse("Text is required", 400);
    }

    // Limit text length for cost control
    if (text.length > 500) {
      return errorResponse("Text too long (max 500 characters)", 400);
    }

    const selectedVoiceId = voiceId || VOICE_IDS[language] || VOICE_IDS.en;

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5", // Fast, high quality
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
            speed: 1.1, // Slightly faster for tactical comms
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      return errorResponse(`Voice generation failed: ${response.status}`, 500);
    }

    // Return audio directly as binary
    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error("TTS error:", error);
    return errorResponse("Voice generation failed", 500);
  }
});
