export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    const force = url.searchParams.get('force') === 'true';
    const existing = await env.HOSTS_DB.list();

    if (existing.keys.length > 0 && !force) {
      return new Response(
        JSON.stringify({ ok: false, msg: "数据库非空，无法初始化。如需强制重新初始化，请使用 /api/hosts/init?force=true" }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
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
      console.log('开始读取初始数据...');
      console.log('env.INITIAL_DATA_DB 是否存在:', !!env.INITIAL_DATA_DB);
      
      if (env.INITIAL_DATA_DB) {
        console.log('尝试从 KV 读取 key: __initial_hosts__');
        const kvData = await env.INITIAL_DATA_DB.get("__initial_hosts__");
        console.log('KV 数据是否存在:', !!kvData);
        console.log('KV 数据长度:', kvData ? kvData.length : 0);
        
        if (kvData) {
          initial = JSON.parse(kvData);
          console.log(`从 KV 获取到 ${initial.length} 条记录`);
        } else {
          console.log('KV 中未找到初始数据');
          return new Response(
            JSON.stringify({ ok: false, msg: "KV 中未找到初始数据，请先导入数据到 KV" }),
            { 
              status: 500, 
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              } 
            }
          );
        }
      } else {
        console.log('INITIAL_DATA_DB 未绑定');
        return new Response(
          JSON.stringify({ ok: false, msg: "INITIAL_DATA_DB 未绑定，请检查 KV 绑定配置" }),
          { 
            status: 500, 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            } 
          }
        );
      }
    } catch (error) {
      console.log('从 KV 读取数据时出错:', error.message);
      return new Response(
        JSON.stringify({ ok: false, msg: `从 KV 读取数据失败: ${error.message}` }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    // 导入所有记录
    let importedCount = 0;
    for (const item of initial) {
      const mappedItem = {
        public_ip: item["主机公网IP 【必填】"],
        hostname: item["主机公网IP 【必填】"],
        ip: item["主机公网IP 【必填】"],
        owner: item["第一联系人姓名 【必填】"],
        email: item["第一联系人邮箱 【必填】"],
        department: item["用户单位名称 【必填】"],
        status: item["运行 状态"],
        os: "Unknown",
        cabinet_location: "",
        description: `客户经理: ${item["客户经理"] || ""}`
      };

      if (mappedItem.public_ip && mappedItem.owner && mappedItem.email && mappedItem.department) {
        await env.HOSTS_DB.put(mappedItem.public_ip, JSON.stringify(mappedItem));
        importedCount++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, msg: `初始化完成，导入了 ${importedCount} 条记录` }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, msg: `初始化失败: ${error.message}` }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
}

// 处理 OPTIONS 请求（CORS preflight）
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
