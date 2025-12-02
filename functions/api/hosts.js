export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // ============ 初始化 /api/hosts/init ============
  if (url.pathname.endsWith("/init") && request.method === "POST") {
    const existing = await env.HOSTS_DB.list();

    if (existing.keys.length > 0) {
      return new Response(
        JSON.stringify({ ok: false, msg: "数据库非空，无法初始化" }),
        { status: 400 }
      );
    }

    // 关键路径 —— JSON 必须放在 functions/api/data 下
    const initial = await import("./data/inital_hosts.json");

    for (const item of initial.default) {
      await env.HOSTS_DB.put(item.public_ip, JSON.stringify(item));
    }

    return new Response(
      JSON.stringify({ ok: true, msg: "初始化完成" }),
      { status: 200 }
    );
  }

  // ============ GET /api/hosts 读取所有 ============
  if (request.method === "GET") {
    const list = await env.HOSTS_DB.list();
    const items = [];

    for (const entry of list.keys) {
      const value = await env.HOSTS_DB.get(entry.name);
      items.push(JSON.parse(value));
    }

    return new Response(JSON.stringify(items), { status: 200 });
  }

  // ============ POST /api/hosts 新增或更新 ============
  if (request.method === "POST") {
    const data = await request.json();

    if (!data.public_ip) {
      return new Response("public_ip required", { status: 400 });
    }

    await env.HOSTS_DB.put(data.public_ip, JSON.stringify(data));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // ============ DELETE /api/hosts?public_ip=xx ============
  if (request.method === "DELETE") {
    const ip = url.searchParams.get("public_ip");

    if (!ip) {
      return new Response("public_ip required", { status: 400 });
    }

    await env.HOSTS_DB.delete(ip);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // 其它方法不允许
  return new Response("Method Not Allowed", { status: 405 });
}
