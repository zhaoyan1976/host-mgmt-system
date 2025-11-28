// functions/login.js
// POST /api/login
// body: { username, password }
// returns: { token, user: { username, role } }

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
  // bytes can be Uint8Array or string
  let str;
  if (bytes instanceof Uint8Array) {
    str = String.fromCharCode(...bytes);
  } else {
    str = bytes;
  }
  let b = btoa(str);
  return b.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function signJWT(payloadObj, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const headerB = toBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB = toBase64Url(new TextEncoder().encode(JSON.stringify(payloadObj)));
  const toSign = `${headerB}.${payloadB}`;
  const sigBytes = await hmacSha256(secret, toSign);
  const sigB = toBase64Url(sigBytes);
  return `${toSign}.${sigB}`;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const { USERS_DB, JWT_SECRET } = env;
  if (!USERS_DB) return new Response(JSON.stringify({ error: 'USERS_DB not bound' }), { status: 500 });

  try {
    const body = await request.json();
    const { username, password } = body || {};
    if (!username || !password) return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400 });

    // fetch user from KV (stored under key "user:<username>")
    const raw = await USERS_DB.get(`user:${username}`);
    if (!raw) return new Response(JSON.stringify({ error: 'invalid' }), { status: 401 });
    const user = JSON.parse(raw);

    // password stored as sha256 hex; compare
    const ph = await sha256Hex(password);
    if (ph !== user.password) return new Response(JSON.stringify({ error: 'invalid' }), { status: 401 });

    // sign token (payload: username, role, iat)
    const payload = { username: user.username, role: user.role || 'user', iat: Date.now() };
    const token = await signJWT(payload, JWT_SECRET || 'dev_secret');

    return new Response(JSON.stringify({ token, user: { username: user.username, role: user.role } }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
