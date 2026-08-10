/**
 * Cloudflare Worker for Chitra-Chaalak Status and Steps
 * 
 * KV Binding required: STATUS_KV
 * 
 * Endpoints:
 * GET /status  -> Returns { "status": "LIVE" | "SOON" }
 * POST /status -> Accepts { "status": "LIVE", "secret": "YOUR_SECRET_KEY" }
 * 
 * GET /steps   -> Returns { "steps": 5234, "last_updated": "2024-..." }
 * POST /steps  -> Accepts { "steps": 5234, "secret": "YOUR_SECRET_KEY" }
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // Hardcoded secret for simplicity. Change this to a secure password!
    const SECRET_KEY = "CHITRA_SECRET_KEY_123";

    // CORS and Cache Headers for Astro frontend
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-secret-token",
      "Cache-Control": "no-store, max-age=0",
    };

    // Handle OPTIONS request for CORS
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (!env.STATUS_KV) {
      return new Response(JSON.stringify({ error: "STATUS_KV binding missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    /* --------------------------------------------------------
     * ENDPOINT: /status
     * Handles the Laptop LIVE/SOON badge
     * -------------------------------------------------------- */
    if (url.pathname === "/status") {
      if (method === "GET") {
        const lastPingStr = await env.STATUS_KV.get("last_ping");
        let status = "SOON";

        if (lastPingStr) {
          const lastPing = new Date(lastPingStr).getTime();
          const now = Date.now();
          // If pinged within the last 5 minutes (300,000 ms), we're LIVE
          if (now - lastPing < 300000) {
            status = "LIVE";
          }
        }

        return new Response(JSON.stringify({ status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (method === "POST") {
        try {
          const body = await request.json();
          if (body.secret !== SECRET_KEY) {
            return new Response("Unauthorized", { status: 401, headers: corsHeaders });
          }
          await env.STATUS_KV.put("laptop_status", body.status);
          return new Response("Status updated", { status: 200, headers: corsHeaders });
        } catch (e) {
          return new Response("Bad Request", { status: 400, headers: corsHeaders });
        }
      }
    }

    /* --------------------------------------------------------
     * ENDPOINT: /ping
     * Receives heartbeat from heartbeat-windows.ps1
     * -------------------------------------------------------- */
    if (url.pathname === "/ping" && method === "POST") {
      const secretToken = request.headers.get("x-secret-token");
      if (secretToken !== "AboxNRpIvjYt2z634WkDeZhrcyPB7n8XsmalJ5Ku") {
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      }

      // Update last ping time
      await env.STATUS_KV.put("last_ping", new Date().toISOString());
      // Optionally also force status to LIVE
      await env.STATUS_KV.put("laptop_status", "LIVE");

      return new Response("Ping received", { status: 200, headers: corsHeaders });
    }



    // Default route
    return new Response("Chitra-Chaalak API Running", {
      status: 200,
      headers: corsHeaders
    });
  }
};
