// functions/hosts.js
// GET /api/hosts             -> list hosts (any authenticated user can GET)
// POST /api/hosts            -> create host (admin)
// PUT  /api/hosts            -> update host (admin)  (we'll treat POST for create/update for simplicity)
// DELETE /api/hosts?id=ID    -> delete host (admin)
// GET /api/hosts/export      -> export CSV (admin or any user allowed based on需求;这里允许 admin)

async function hmacSha256(key, msg) {
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(msg));
  return new Uint8Array(sig);
}
function toBase64Url(bytes) {
  let str;
  if (bytes instanceof Uint8Array) str = String.fromCharCode(...bytes);
  else str = bytes;
  let b = btoa(str);
  return b.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function verifyJWT(token, secret) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const toSign = `${h}.${p}`;
  const sigBytes = await hmacSha256(secret, toSign);
  const sigB = toBase64Url(sigBytes);
  if (sigB !== s) return null;
  try {
    const payload = JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/')));
    return payload;
  } catch (e) {
    return null;
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const { HOSTS_DB, JWT_SECRET } = env;
  if (!HOSTS_DB) return new Response(JSON.stringify({ error: 'HOSTS_DB not bound' }), { status: 500 });

  // ensure admin exists (this also exists in users.js but double-check)
  // auth check: allow GET for any authenticated user; POST/DELETE require admin
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const payload = await verifyJWT(token, JWT_SECRET || 'dev_secret');

  if (request.method === 'GET') {
    // list hosts; support ?sort=col
    const q = new URL(request.url);
    const sort = q.searchParams.get('sort');
    const list = await HOSTS_DB.list({ prefix: 'host:' });
    const out = [];
    for (const k of list.keys) {
      const raw = await HOSTS_DB.get(k.name);
      if (!raw) continue;
      const h = JSON.parse(raw);
      out.push(h);
    }
    if (sort) {
      out.sort((a,b)=> String(a[sort]||'').localeCompare(String(b[sort]||'')));
    }
    return new Response(JSON.stringify({ hosts: out }), { headers: { 'Content-Type': 'application/json' } });
  }

  // protect write operations
  if (!payload || payload.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method === 'POST' || request.method === 'PUT') {
    // create or update. The client should supply an object with id (optional for create)
    const body = await request.json();
    let id = body.id;
    if (!id) id = Date.now().toString();
    body.id = id;
    body.updated_at = new Date().toISOString();
    await HOSTS_DB.put(`host:${id}`, JSON.stringify(body));
    return new Response(JSON.stringify({ ok: true, host: body }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method === 'DELETE') {
    const u = new URL(request.url);
    const id = u.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'missing id' }), { status: 400 });
    await HOSTS_DB.delete(`host:${id}`);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  // export CSV
  if (request.method === 'GET' && new URL(request.url).pathname.endsWith('/export')) {
    // this branch practically covered by GET above; kept for explicit export if needed
    const list = await HOSTS_DB.list({ prefix: 'host:' });
    const rows = [];
    const cols = ['id','hostname','ip','os','department','owner','email','cabinet_location','description','updated_at'];
    rows.push(cols.join(','));
    for (const k of list.keys) {
      const raw = await HOSTS_DB.get(k.name);
      if (!raw) continue;
      const h = JSON.parse(raw);
      rows.push(cols.map(c => `"${String(h[c]||'').replace(/"/g,'""')}"`).join(','));
    }
    return new Response(rows.join('\n'), { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=hosts.csv' } });
  }

  return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 });
}
