import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { connect } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getDb() {
  return await connect({
    hostname: Deno.env.get("MYSQL_HOST")!,
    port: parseInt(Deno.env.get("MYSQL_PORT") || "3306"),
    username: Deno.env.get("MYSQL_USER")!,
    password: Deno.env.get("MYSQL_PASSWORD")!,
    db: Deno.env.get("MYSQL_DATABASE")!,
  });
}

// Simple hash for password (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, username, password } = await req.json();
    const db = await getDb();

    if (action === "login") {
      const hashed = await hashPassword(password);
      const rows = await db.query(
        "SELECT id, username FROM users WHERE username = ? AND password_hash = ?",
        [username, hashed]
      );
      await db.close();

      if ((rows as any[]).length === 0) {
        return new Response(
          JSON.stringify({ error: "Identifiants incorrects" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const user = (rows as any[])[0];
      // Generate a simple session token
      const token = crypto.randomUUID();

      return new Response(
        JSON.stringify({ ok: true, user: { id: user.id, username: user.username }, token }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await db.close();
    return new Response(
      JSON.stringify({ error: "Action inconnue" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("auth error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
