export async function onRequestPost(context) {
  const { request, env } = context;

  const { username, password } = await request.json();

  if (!username || !password) {
    return new Response(JSON.stringify({ error: "缺少字段" }), {
      status: 400
    });
  }

  // Initialize admin user if not exists
  let user = await env.USERS_DB.get(username);
  if (!user && username === 'admin') {
    const initialAdmin = {
      username: "admin",
      password: "123",
      role: "admin"
    };
    await env.USERS_DB.put(username, JSON.stringify(initialAdmin));
    user = JSON.stringify(initialAdmin);
  }

  if (!user) {
    return new Response(JSON.stringify({ error: "用户不存在" }), {
      status: 400
    });
  }

  const info = JSON.parse(user);

  if (info.password !== password) {
    return new Response(JSON.stringify({ error: "密码错误" }), {
      status: 401
    });
  }

  // Generate a simple JWT-like token (not cryptographically secure, but works for demo)
  const payload = {
    username: info.username,
    role: info.role || 'user'
  };
  const header = { alg: 'HS256', typ: 'JWT' };
  const token = btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload)) + '.signature';

  return new Response(JSON.stringify({
    token: token,
    user: payload
  }), { status: 200 });
}
