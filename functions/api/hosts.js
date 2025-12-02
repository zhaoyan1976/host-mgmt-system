// 初始化
if (url.pathname.endsWith("/init") && request.method === "POST") {
  const existing = await env.HOSTS_DB.list();
  if (existing.keys.length > 0) {
    return new Response(JSON.stringify({ ok: false, msg: "数据库非空，无法初始化" }), {
      status: 400
    });
  }

  // 文件路径改成 functions/api/data/
  const initial = await import("./data/initial_hosts.json");

  for (const item of initial.default) {
    await env.HOSTS_DB.put(item.public_ip, JSON.stringify(item));
  }

  return Response.json({ ok: true, msg: "初始化完成" });
}
