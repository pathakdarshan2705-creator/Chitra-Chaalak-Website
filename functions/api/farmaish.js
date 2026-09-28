// functions/api/farmaish.js
// Cloudflare Pages Function for receiving viewer request postcards (Farmaish).

// Helper: Constant-time string hash for IP anonymization
async function hashIP(ip, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${ip}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const jsonHeaders = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff'
  };

  // 1. Content-Type check
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'invalid_content_type' }), {
      status: 415,
      headers: jsonHeaders
    });
  }

  // 2. Same-origin check
  const origin = request.headers.get('origin');
  const requestUrl = new URL(request.url);
  if (origin) {
    const originUrl = new URL(origin);
    const isSameHost = originUrl.host === requestUrl.host;
    const isPagesDev = originUrl.hostname.endsWith('.pages.dev');
    const isAllowedDomain = originUrl.hostname === 'chitrachaalak.art' || originUrl.hostname.endsWith('.chitrachaalak.art');
    const isLocalhost = originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1';

    if (!isSameHost && !isPagesDev && !isAllowedDomain && !isLocalhost) {
      return new Response(JSON.stringify({ error: 'forbidden_origin' }), {
        status: 403,
        headers: jsonHeaders
      });
    }
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: jsonHeaders
    });
  }

  const { message, from, turnstileToken, website } = body || {};

  // 3. Honeypot check: if website field is filled, silently succeed without storing
  if (website && typeof website === 'string' && website.trim().length > 0) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: jsonHeaders
    });
  }

  // 4. Validate message and from fields
  if (typeof message !== 'string') {
    return new Response(JSON.stringify({ error: 'invalid_message' }), {
      status: 400,
      headers: jsonHeaders
    });
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length < 3 || trimmedMessage.length > 500) {
    return new Response(JSON.stringify({ error: 'message_length_out_of_bounds' }), {
      status: 400,
      headers: jsonHeaders
    });
  }

  let trimmedFrom = '';
  if (from && typeof from === 'string') {
    trimmedFrom = from.trim().slice(0, 40);
  }

  const clientIP = request.headers.get('cf-connecting-ip') || '127.0.0.1';

  // 5. Server-side Turnstile verification
  const turnstileSecret = env.TURNSTILE_SECRET;
  if (turnstileSecret) {
    if (!turnstileToken || typeof turnstileToken !== 'string') {
      return new Response(JSON.stringify({ error: 'missing_turnstile_token' }), {
        status: 400,
        headers: jsonHeaders
      });
    }

    try {
      const formData = new FormData();
      formData.append('secret', turnstileSecret);
      formData.append('response', turnstileToken);
      formData.append('remoteip', clientIP);

      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        return new Response(JSON.stringify({ error: 'turnstile_verification_failed' }), {
          status: 403,
          headers: jsonHeaders
        });
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: 'turnstile_error' }), {
        status: 502,
        headers: jsonHeaders
      });
    }
  }

  // 6. Rate limit per visitor using Cloudflare KV
  // Note: KV is eventually consistent, which is completely acceptable for this volume.
  if (env.FARMAISH) {
    const salt = env.ADMIN_TOKEN ? env.ADMIN_TOKEN.slice(0, 16) : 'farmaish-default-salt';
    const hashedIP = await hashIP(clientIP, salt);

    const hourKey = `rate:h:${hashedIP}`;
    const dayKey = `rate:d:${hashedIP}`;

    try {
      const [hourCountStr, dayCountStr] = await Promise.all([
        env.FARMAISH.get(hourKey),
        env.FARMAISH.get(dayKey)
      ]);

      const hourCount = hourCountStr ? parseInt(hourCountStr, 10) : 0;
      const dayCount = dayCountStr ? parseInt(dayCountStr, 10) : 0;

      // Rate Limits: 3 per hour, 10 per day
      if (hourCount >= 3 || dayCount >= 10) {
        return new Response(JSON.stringify({
          error: 'rate_limited',
          limit: hourCount >= 3 ? 'hourly' : 'daily'
        }), {
          status: 429,
          headers: jsonHeaders
        });
      }

      // Increment counters with expirationTtl
      await Promise.all([
        env.FARMAISH.put(hourKey, String(hourCount + 1), { expirationTtl: 3600 }),
        env.FARMAISH.put(dayKey, String(dayCount + 1), { expirationTtl: 86400 })
      ]);
    } catch (e) {
      // Continue even if rate limiting KV read fails
      console.warn('KV rate limit read error:', e);
    }

    // 7. Store Message in KV
    // Key format: msg:<inverted-timestamp>:<uuid> ensures newest messages sort first
    const invertedTime = String(9999999999999 - Date.now()).padStart(13, '0');
    const msgId = crypto.randomUUID();
    const storageKey = `msg:${invertedTime}:${msgId}`;

    const userAgent = request.headers.get('user-agent') || '';
    const payload = {
      message: trimmedMessage,
      from: trimmedFrom,
      createdAt: new Date().toISOString(),
      ua: userAgent.slice(0, 120)
    };

    try {
      await env.FARMAISH.put(storageKey, JSON.stringify(payload));
    } catch (err) {
      return new Response(JSON.stringify({ error: 'storage_error' }), {
        status: 500,
        headers: jsonHeaders
      });
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: jsonHeaders
  });
}
