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
      // 检查是否强制重新初始化
      const force = url.searchParams.get('force') === 'true';

      const existing = await env.HOSTS_DB.list();

      if (existing.keys.length > 0 && !force) {
        return new Response(
          JSON.stringify({ ok: false, msg: "数据库非空，无法初始化。如需强制重新初始化，请使用 /api/hosts/init?force=true" }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 如果强制重新初始化，先清空数据库
      if (force && existing.keys.length > 0) {
        for (const entry of existing.keys) {
          await env.HOSTS_DB.delete(entry.name);
        }
      }

      // 从 KV 读取初始数据
      let initial = [];

      try {
        // 尝试从 KV 的 INITIAL_DATA_DB 读取数据
        if (env.INITIAL_DATA_DB) {
          const kvData = await env.INITIAL_DATA_DB.get("__initial_hosts__");
          if (kvData) {
            initial = JSON.parse(kvData);
            console.log(`从 KV 获取到 ${initial.length} 条记录`);
          } else {
            console.log('KV 中未找到初始数据，使用默认数据');
            initial = getDefaultData();
          }
        } else {
          console.log('INITIAL_DATA_DB 未绑定，使用默认数据');
          initial = getDefaultData();
        }
      } catch (error) {
        console.log('从 KV 读取数据时出错:', error.message);
        initial = getDefaultData();
      }

      // 导入所有记录
      let importedCount = 0;
      for (const item of initial) {
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

        // 检查必要字段是否存在
        if (mappedItem.public_ip && mappedItem.owner && mappedItem.email && mappedItem.department) {
          await env.HOSTS_DB.put(mappedItem.public_ip, JSON.stringify(mappedItem));
          importedCount++;
        }
      }

      return new Response(
        JSON.stringify({ ok: true, msg: `初始化完成，导入了 ${importedCount} 条记录` }),
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

// 辅助函数：获取默认测试数据
function getDefaultData() {
  return [
    {"运行 状态": "使用中", "主机公网IP 【必填】": "192.168.1.1", "第一联系人姓名 【必填】": "测试用户1", "第一联系人邮箱 【必填】": "test1@example.com", "用户单位名称 【必填】": "测试单位1", "客户经理": "测试经理"},
    {"运行 状态": "使用中", "主机公网IP 【必填】": "192.168.1.2", "第一联系人姓名 【必填】": "测试用户2", "第一联系人邮箱 【必填】": "test2@example.com", "用户单位名称 【必填】": "测试单位2", "客户经理": "测试经理"}
  ];
}
