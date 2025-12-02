export async function onRequestPost(context) {
  const { request, env } = context;

  const { username, password } = await request.json();

  if (!username || !password) {
    return new Response(JSON.stringify({ ok: false, msg: "缺少字段" }), {
      status: 400
    });
  }

  const user = await env.USERS_DB.get(username);

  if (!user) {
    return new Response(JSON.stringify({ ok: false, msg: "用户不存在" }), {
      status: 400
    });
  }

  const info = JSON.parse(user);

  if (info.password !== password) {
    return new Response(JSON.stringify({ ok: false, msg: "密码错误" }), {
      status: 401
    });
  }

  return new Response(JSON.stringify({ ok: true, username }), { status: 200 });
}
