export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 初始化导入：如果 KV 为空，就导入 initial_hosts.json
  if (url.pathname === "/api/hosts/init" && request.method === "POST") {
    const existing = await env.HOSTS_DB.list();
    if (existing.keys.length > 0) {
      return new Response(JSON.stringify({ ok: false, msg: "数据库非空，无法初始化" }), { status: 400 });
    }

    // 读取 initial_hosts.json（从项目的 /data 目录）
    const initial = await import("../../data/initial_hosts.json");
    for (const item of initial.default) {
      await env.HOSTS_DB.put(item.public_ip, JSON.stringify(item));
    }

    return new Response(JSON.stringify({ ok: true, msg: "初始化完成" }), { status: 200 });
  }

  // 获取全部主机
  if (request.method === "GET") {
    const all = await env.HOSTS_DB.list();
    const items = [];
    for (const key of all.keys) {
      const v = await env.HOSTS_DB.get(key.name);
      items.push(JSON.parse(v));
    }
    return new Response(JSON.stringify(items), { status: 200 });
  }

  // 新增/更新
  if (request.method === "POST") {
    const data = await request.json();
    if (!data.public_ip) {
      return new Response("public_ip required", { status: 400 });
    }
    await env.HOSTS_DB.put(data.public_ip, JSON.stringify(data));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // 删除
  if (request.method === "DELETE") {
    const public_ip = url.searchParams.get("public_ip");
    if (!public_ip) {
      return new Response("public_ip required", { status: 400 });
    }
    await env.HOSTS_DB.delete(public_ip);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  return new Response("Not allowed", { status: 405 });
}
