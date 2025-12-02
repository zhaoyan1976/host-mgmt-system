export async function onRequestPost(context) {
  const { env } = context;

  const existing = await env.HOSTS_DB.list();
  if (existing.keys.length > 0) {
    return new Response(JSON.stringify({ ok: false, msg: "数据库非空，无法初始化" }), {
      status: 400
    });
  }

  // 读取 initial_hosts.json
  const initial = await import("../../../data/initial_hosts.json");

  for (const item of initial.default) {
    await env.HOSTS_DB.put(item.public_ip, JSON.stringify(item));
  }

  return new Response(JSON.stringify({ ok: true, msg: "初始化完成" }), { status: 200 });
}
