import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

/**
 * sync-user Edge Function
 *
 * Accepts validated write requests from the VibeProof app and executes them
 * with service_role privileges. The anon key can only READ tables — all
 * writes go through this function.
 *
 * Endpoints (via `action` field):
 *   upsert_user       — create/update user profile
 *   upsert_social     — link a social account
 *   delete_social     — unlink a social account
 *   upload_avatar_url  — save public avatar URL to users table
 *
 * Every request MUST include a `wallet` field.
 * Basic validation prevents the most obvious abuse.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action, wallet, ...data } = body;

    // Validate required fields
    if (!action || !wallet) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: action, wallet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate wallet format (base58 Solana address: 32-44 chars)
    if (typeof wallet !== "string" || wallet.length < 32 || wallet.length > 44) {
      return new Response(
        JSON.stringify({ error: "Invalid wallet address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service_role client for writes
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result;

    switch (action) {
      // ── Upsert user profile ──────────────────────
      case "upsert_user": {
        const allowedFields = ["username", "xp", "streak", "rank", "level", "avatar_url"];
        const payload: Record<string, unknown> = { wallet, updated_at: new Date().toISOString() };

        for (const field of allowedFields) {
          if (data[field] !== undefined) {
            // Type-check numeric fields
            if (["xp", "streak", "rank", "level"].includes(field)) {
              const val = Number(data[field]);
              if (!Number.isFinite(val) || val < 0 || val > 1_000_000) {
                return new Response(
                  JSON.stringify({ error: `Invalid value for ${field}` }),
                  { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
              payload[field] = val;
            } else if (field === "username") {
              // 3-20 chars, alphanumeric + underscore
              if (typeof data[field] !== "string" || !/^[a-zA-Z0-9_]{3,20}$/.test(data[field])) {
                return new Response(
                  JSON.stringify({ error: "Invalid username (3-20 chars, alphanumeric + underscore)" }),
                  { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
              payload[field] = data[field];
            } else {
              payload[field] = data[field];
            }
          }
        }

        const { error } = await supabase
          .from("users")
          .upsert(payload, { onConflict: "wallet" });

        if (error) throw error;
        result = { success: true, action: "upsert_user" };
        break;
      }

      // ── Upsert social link ──────────────────────
      case "upsert_social": {
        const { provider, provider_user_id, provider_username } = data;

        if (!provider || !provider_user_id || !provider_username) {
          return new Response(
            JSON.stringify({ error: "Missing social link fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate provider
        const validProviders = ["x", "github", "discord", "telegram"];
        if (!validProviders.includes(provider)) {
          return new Response(
            JSON.stringify({ error: "Invalid provider" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase.from("user_social_links").upsert(
          {
            user_wallet: wallet,
            provider,
            provider_user_id: String(provider_user_id),
            provider_username: String(provider_username),
            last_refresh: new Date().toISOString(),
          },
          { onConflict: "user_wallet,provider" }
        );

        if (error) throw error;
        result = { success: true, action: "upsert_social" };
        break;
      }

      // ── Delete social link ──────────────────────
      case "delete_social": {
        const { provider: delProvider } = data;
        if (!delProvider) {
          return new Response(
            JSON.stringify({ error: "Missing provider" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("user_social_links")
          .delete()
          .eq("user_wallet", wallet)
          .eq("provider", delProvider);

        if (error) throw error;
        result = { success: true, action: "delete_social" };
        break;
      }

      // ── Save avatar URL ─────────────────────────
      case "upload_avatar_url": {
        const { avatar_url } = data;
        if (!avatar_url || typeof avatar_url !== "string") {
          return new Response(
            JSON.stringify({ error: "Missing avatar_url" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("users")
          .update({ avatar_url, updated_at: new Date().toISOString() })
          .eq("wallet", wallet);

        if (error) throw error;
        result = { success: true, action: "upload_avatar_url" };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[sync-user]", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
