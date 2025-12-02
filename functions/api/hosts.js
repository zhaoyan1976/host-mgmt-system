export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // /api/hosts/init —— 初始化接口（POST）
  if (url.pathname.endsWith("/init") && request.method === "POST") {
    const existing = await env.HOSTS_DB.list();
    if (existing.keys.length > 0) {
      return new Response(JSON.stringify({ ok: false, msg: "数据库非空，无法初始化" }), {
        status: 400
      });
    }

    // 导入 initial_hosts.json
    const initial = await import("../../../data/initial_hosts.json");

    for (const item of initial.default) {
      await env.HOSTS_DB.put(item.public_ip, JSON.stringify(item));
    }

    return new Response(JSON.stringify({ ok: true, msg: "初始化完成" }), {
      status: 200
    });
  }

  // /api/hosts —— 获取全部主机（GET）
  if (request.method === "GET") {
    const list = await env.HOSTS_DB.list();
    const result = [];
    for (const key of list.keys) {
      const val = await env.HOSTS_DB.get(key.name);
      result.push(JSON.parse(val));
    }
    return Response.json({ ok: true, data: result });
  }

  // /api/hosts —— 添加或更新（POST）
  if (request.method === "POST") {
    const body = await request.json();
    await env.HOSTS_DB.put(body.public_ip, JSON.stringify(body));
    return Response.json({ ok: true });
  }

  return new Response("Method Not Allowed", { status: 405 });
}
