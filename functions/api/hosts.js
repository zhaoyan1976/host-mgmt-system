export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // ============ 初始化 /api/hosts/init ============
  if (url.pathname.includes("/init") && request.method === "POST") {
    try {
      const existing = await env.HOSTS_DB.list();

      if (existing.keys.length > 0) {
        return new Response(
          JSON.stringify({ ok: false, msg: "数据库非空，无法初始化" }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 关键路径 —— 从 GitHub 获取 JSON 数据
      const response = await fetch('https://raw.githubusercontent.com/zhaoyan1976/host-mgmt-system/main/functions/api/data/initial_hosts.json');
      if (!response.ok) {
        return new Response(
          JSON.stringify({ ok: false, msg: "无法获取数据文件" }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const initial = await response.json();

      for (const item of initial.slice(0, 5)) { // 只导入前5条测试
        // 映射中文字段到前端期望的英文字段
        const mappedItem = {
          public_ip: item["主机公网IP 【必填】"],
          hostname: item["主机公网IP 【必填】"], // 使用IP作为hostname
          ip: item["主机公网IP 【必填】"],
          owner: item["第一联系人姓名 【必填】"],
          email: item["第一联系人邮箱 【必填】"],
          department: item["用户单位名称 【必填】"],
          status: item["运行 状态"],
          os: "Unknown", // 默认值
          cabinet_location: "",
          description: `客户经理: ${item["客户经理"] || ""}`
        };
        await env.HOSTS_DB.put(mappedItem.public_ip, JSON.stringify(mappedItem));
      }

      return new Response(
        JSON.stringify({ ok: true, msg: `初始化完成，导入了 ${Math.min(5, initial.length)} 条记录` }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ ok: false, msg: `初始化失败: ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // ============ GET /api/hosts 读取所有 ============
  if (request.method === "GET") {
    try {
      const list = await env.HOSTS_DB.list();
      const items = [];

      console.log('Database keys found:', list.keys.length);

      for (const entry of list.keys) {
        const value = await env.HOSTS_DB.get(entry.name);
        if (value) {
          items.push(JSON.parse(value));
        }
      }

      console.log('Returning items:', items.length);

      return new Response(JSON.stringify(items), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    } catch (error) {
      console.error('Error in GET /api/hosts:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
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
  return new Response(`Method Not Allowed. Path: ${url.pathname}, Method: ${request.method}`, { status: 405 });
}
