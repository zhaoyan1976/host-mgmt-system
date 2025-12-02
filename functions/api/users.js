
// functions/users.js
// GET /api/users        -> list users (admin only)
// POST /api/users       -> create user (admin only)
// DELETE /api/users?username=xxx -> delete user (admin only)

async function sha256Hex(msg) {
  const enc = new TextEncoder();
  const data = enc.encode(msg);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}
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
  const { request, env, url } = context;
  const { USERS_DB, JWT_SECRET } = env;
  if (!USERS_DB) return new Response(JSON.stringify({ error: 'USERS_DB not bound' }), { status: 500 });

  // ensure admin exists on first call
  const ensure = await USERS_DB.get('user:admin');
  if (!ensure) {
    const passHash = await sha256Hex('123');
    await USERS_DB.put('user:admin', JSON.stringify({ username: 'admin', password: passHash, role: 'admin' }));
  }

  // auth
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const payload = await verifyJWT(token, JWT_SECRET || 'dev_secret');
  if (!payload || payload.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  // methods
  if (request.method === 'GET') {
    const list = await USERS_DB.list({ prefix: 'user:' });
    const ret = [];
    for (const k of list.keys) {
      const raw = await USERS_DB.get(k.name);
      if (!raw) continue;
      const u = JSON.parse(raw);
      ret.push({ username: u.username, role: u.role });
    }
    return new Response(JSON.stringify({ users: ret }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method === 'POST') {
    const body = await request.json();
    if (!body.username || !body.password) return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400 });
    const ph = await sha256Hex(body.password);
    await USERS_DB.put(`user:${body.username}`, JSON.stringify({ username: body.username, password: ph, role: body.role || 'user' }));
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method === 'DELETE') {
    const u = new URL(request.url);
    const username = u.searchParams.get('username');
    if (!username) return new Response(JSON.stringify({ error: 'missing username' }), { status: 400 });
    await USERS_DB.delete(`user:${username}`);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 });
}
