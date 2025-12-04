export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

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

 
        );
      }
    } else {
      // 如果不是 POST 方法，返回 405
      return new Response(
        JSON.stringify({ error: "Method Not Allowed", message: `Only POST method is allowed for /api/hosts/init` }),
        { 
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Allow': 'POST'
          }
        }
      );
    }
  }

  // ============ GET /api/hosts 读取所有 ============
  if (request.method === "GET" && pathname === "/api/hosts") {
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
  // 重要：排除 /init 路径
  if (request.method === "POST" && pathname === "/api/hosts") {
    try {
      const data = await request.json();

      if (!data.public_ip) {
        return new Response(
          JSON.stringify({ error: "public_ip required" }), 
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }

      await env.HOSTS_DB.put(data.public_ip, JSON.stringify(data));
      return new Response(
        JSON.stringify({ ok: true }), 
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
        JSON.stringify({ error: error.message }), 
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

  // ============ DELETE /api/hosts?public_ip=xx ============
  if (request.method === "DELETE" && pathname === "/api/hosts") {
    try {
      const ip = url.searchParams.get("public_ip");

      if (!ip) {
        return new Response(
          JSON.stringify({ error: "public_ip required" }), 
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }

      await env.HOSTS_DB.delete(ip);
      return new Response(
        JSON.stringify({ ok: true }), 
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
        JSON.stringify({ error: error.message }), 
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

  // 其它方法不允许
  return new Response(
    JSON.stringify({ error: `Method Not Allowed. Path: ${pathname}, Method: ${request.method}` }), 
    { 
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}
