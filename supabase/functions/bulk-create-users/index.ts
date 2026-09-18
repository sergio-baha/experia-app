import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const H = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: H });
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405, H);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization" }, 401, H);

  // Cliente con JWT del llamador — para verificar quién es
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Not authenticated" }, 401, H);

  const { data: profile } = await userClient
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return json({ error: "Forbidden: admin only" }, 403, H);

  // Cliente con service_role — solo en el servidor
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { users } = await req.json();
  if (!Array.isArray(users)) return json({ error: "users must be an array" }, 400, H);

  const results = [];
  for (const u of users) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.pass,
      email_confirm: true,
      user_metadata: {
        name: u.name, role: u.role || "student",
        area: u.area || null, institution_id: u.institution_id || null,
      },
    });
    results.push({ email: u.email, ok: !error, id: data?.user?.id, error: error?.message });
  }
  return json({ results }, 200, H);
});

// Allowlist de orígenes: producción + previews de Cloudflare Pages + dev local.
function allowOrigin(req: Request): string {
  const origin = req.headers.get("Origin") || "";
  const ok =
    origin === "https://experia-app.pages.dev" ||
    /^https:\/\/[a-z0-9-]+\.experia-app\.pages\.dev$/.test(origin) ||
    /^http:\/\/localhost:(5173|4173)$/.test(origin);
  return ok ? origin : "https://experia-app.pages.dev";
}
function corsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": allowOrigin(req),
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
function json(body: unknown, status = 200, H: Record<string, string> = {}) {
  return new Response(JSON.stringify(body),
    { status, headers: { "Content-Type": "application/json", ...H }});
}
