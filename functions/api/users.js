export async function onRequest(context) {
  const { request, env } = context;

  const initial = {
      username: "admin",
      password: "123"
    };

  if (request.method === "GET") {
    const list = await env.USERS_DB.list();
    const users = [];

    for (const entry of list.keys) {
      const v = await env.USERS_DB.get(entry.name);
      users.push(JSON.parse(v));
    }

    return new Response(JSON.stringify(users), { status: 200 });
  }

  if (request.method === "POST") {
    const data = await request.json();

    if (!data.username || !data.password) {
      return new Response("username/password required", { status: 400 });
    }

    await env.USERS_DB.put(data.username, JSON.stringify(data));

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  return new Response("Method Not Allowed", { status: 405 });
}
