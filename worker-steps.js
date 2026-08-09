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

    // CORS Headers for Astro frontend
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle OPTIONS request for CORS
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    /* --------------------------------------------------------
     * ENDPOINT: /status
     * Handles the Laptop LIVE/SOON badge
     * -------------------------------------------------------- */
    if (url.pathname === "/status") {
      if (method === "GET") {
        const status = await env.STATUS_KV.get("laptop_status") || "SOON";
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
     * ENDPOINT: /steps
     * Handles the Footer Step Counter
     * -------------------------------------------------------- */
    if (url.pathname === "/steps") {
      if (method === "GET") {
        const stepsData = await env.STATUS_KV.get("daily_steps");
        let steps = 0;
        let lastUpdated = null;
        
        if (stepsData) {
          const parsed = JSON.parse(stepsData);
          steps = parsed.steps;
          lastUpdated = parsed.lastUpdated;
        }

        return new Response(JSON.stringify({ steps, lastUpdated }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (method === "POST") {
        try {
          const body = await request.json();
          if (body.secret !== SECRET_KEY) {
            return new Response("Unauthorized", { status: 401, headers: corsHeaders });
          }
          
          const payload = {
            steps: body.steps,
            lastUpdated: new Date().toISOString()
          };
          
          await env.STATUS_KV.put("daily_steps", JSON.stringify(payload));
          return new Response("Steps updated", { status: 200, headers: corsHeaders });
        } catch (e) {
          return new Response("Bad Request", { status: 400, headers: corsHeaders });
        }
      }
    }

    // Default route
    return new Response("Chitra-Chaalak API Running", { 
      status: 200, 
      headers: corsHeaders 
    });
  }
};
