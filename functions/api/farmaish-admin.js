// functions/api/farmaish-admin.js
// Authenticated API for reading and managing viewer requests (Farmaish).

// Helper: Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function verifyAuth(request, env) {
  const adminToken = env.ADMIN_TOKEN;
  if (!adminToken) return false;

  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return false;

  const providedToken = authHeader.slice(7).trim();
  return timingSafeEqual(providedToken, adminToken);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const jsonHeaders = {
    'Content-Type': 'application/json',
    'X-Robots-Tag': 'noindex, nofollow',
    'X-Content-Type-Options': 'nosniff'
  };

  if (!verifyAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: jsonHeaders
    });
  }

  if (!env.FARMAISH) {
    return new Response(JSON.stringify({ messages: [], cursor: null }), {
      status: 200,
      headers: jsonHeaders
    });
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor') || undefined;

  try {
    const listResult = await env.FARMAISH.list({
      prefix: 'msg:',
      limit: 50,
      cursor
    });

    const messages = [];
    for (const key of listResult.keys) {
      const dataStr = await env.FARMAISH.get(key.name);
      if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr);
          messages.push({
            id: key.name,
            ...parsed
          });
        } catch (e) {
          // ignore corrupted items
        }
      }
    }

    return new Response(JSON.stringify({
      messages,
      cursor: listResult.list_complete ? null : listResult.cursor
    }), {
      status: 200,
      headers: jsonHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'fetch_error' }), {
      status: 500,
      headers: jsonHeaders
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const jsonHeaders = {
    'Content-Type': 'application/json',
    'X-Robots-Tag': 'noindex, nofollow',
    'X-Content-Type-Options': 'nosniff'
  };

  if (!verifyAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: jsonHeaders
    });
  }

  if (!env.FARMAISH) {
    return new Response(JSON.stringify({ error: 'kv_not_configured' }), {
      status: 500,
      headers: jsonHeaders
    });
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

  const { id } = body || {};
  if (!id || typeof id !== 'string' || !id.startsWith('msg:')) {
    return new Response(JSON.stringify({ error: 'invalid_id' }), {
      status: 400,
      headers: jsonHeaders
    });
  }

  try {
    await env.FARMAISH.delete(id);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: jsonHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'delete_error' }), {
      status: 500,
      headers: jsonHeaders
    });
  }
}
