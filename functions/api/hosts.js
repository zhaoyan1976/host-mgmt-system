export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // GET 所有主机
  if (request.method === "GET") {
    const all = await env.HOSTS_DB.list();
    const items = [];

    for (const k of all.keys) {
      const v = await env.HOSTS_DB.get(k.name);
      items.push(JSON.parse(v));
    }

    return new Response(JSON.stringify(items), { status: 200 });
  }

  // POST 新增或更新
  if (request.method === "POST") {
    const data = await request.json();
    if (!data.public_ip) {
      return new Response("public_ip required", { status: 400 });
    }

    await env.HOSTS_DB.put(data.public_ip, JSON.stringify(data));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // DELETE 删除
  if (request.method === "DELETE") {
    const ip = url.searchParams.get("public_ip");
    if (!ip) {
      return new Response("public_ip required", { status: 400 });
    }

    await env.HOSTS_DB.delete(ip);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  return new Response("Method Not Allowed", { status: 405 });
}
