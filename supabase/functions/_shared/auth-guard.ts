/**
 * Auth Guard - Edge Function Authentication Wrapper
 * MUST be used at the top of every edge function for security
 */
import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthGuardResult {
  user: User | null;
  supabase: SupabaseClient | null;
  error?: string;
  status?: number;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Validate user authentication from request
 * Returns user and supabase client if valid, error otherwise
 */
export async function authGuard(req: Request): Promise<AuthGuardResult> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      user: null,
      supabase: null,
      error: "Missing or invalid authorization header",
      status: 401,
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      user: null,
      supabase: null,
      error: "Server configuration error",
      status: 500,
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const token = authHeader.replace("Bearer ", "");

  try {
    // Verify the JWT claims
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return {
        user: null,
        supabase: null,
        error: "Invalid or expired token",
        status: 401,
      };
    }

    return {
      user: data.user,
      supabase,
    };
  } catch (e) {
    console.error("Auth guard error:", e);
    return {
      user: null,
      supabase: null,
      error: "Authentication failed",
      status: 401,
    };
  }
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message: string = "Unauthorized"): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

/**
 * Create an error response
 */
export function errorResponse(message: string, status: number = 500): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

/**
 * Create a success response
 */
export function successResponse(data: unknown): Response {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
