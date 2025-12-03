import React, { useEffect, useState } from 'react';
import HostTable from './HostTable';
import HostForm from './HostForm';

export default function Dashboard({ user, onLogout }) {
  const [hosts, setHosts] = useState([]);
  const [sort, setSort] = useState(null);
  const [editing, setEditing] = useState(null);
  const [initializing, setInitializing] = useState(false);
  const token = localStorage.getItem('token');

  // Use production API in development, or configure for local wrangler
  const apiBase = import.meta.env.DEV
    ? 'https://host-mgmt-system.pages.dev'
    : '';

  useEffect(()=> { fetchHosts(); }, []);

  async function fetchHosts(s) {
    try {
      const q = s ? `?sort=${s}` : '';
      const res = await fetch(`${apiBase}/api/hosts${q}`, { headers: { Authorization: `Bearer ${token}` }});

      if (!res.ok) {
        console.error('API Error:', res.status, res.statusText);
        const errorText = await res.text();
        console.error('Error response:', errorText);
        setHosts([]);
        return;
      }

      const responseText = await res.text();
      console.log('Raw API Response:', responseText);

      if (!responseText || responseText.trim() === '') {
        console.warn('Empty response from API');
        setHosts([]);
        return;
      }

      try {
        const j = JSON.parse(responseText);
        console.log('Parsed API Response:', j);
        setHosts(Array.isArray(j) ? j : j.hosts || []);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response text that failed to parse:', responseText);
        setHosts([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setHosts([]);
    }
  }

  const saveHost = async (h) => {
    const method = h.id ? 'PUT' : 'POST';
    await fetch(`${apiBase}/api/hosts`, {
      method,
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(h)
    });
    setEditing(null);
    fetchHosts(sort);
  };

  const delHost = async (id) => {
    if (!confirm('确认删除该记录？')) return;
    await fetch(`${apiBase}/api/hosts?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
    fetchHosts(sort);
  };

  const exportCsv = () => {
    // open worker CSV route
    window.open(`${apiBase}/api/hosts/export`);
  };

  const initializeDatabase = async () => {
    try {
      setInitializing(true);
      const res = await fetch(`${apiBase}/api/hosts/init`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errorText = await res.text();
        alert(`初始化失败: ${errorText}`);
        return;
      }

      const result = await res.json();
      alert(`初始化成功: ${result.msg}`);
      fetchHosts(); // 重新获取数据
    } catch (error) {
      console.error('Initialization error:', error);
      alert('初始化过程中发生错误');
    } finally {
      setInitializing(false);
    }
  };

  return (
    <div className="container bg-white rounded-xl shadow mt-8 p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">推进办主机管理</h2>
          <div className="text-sm text-gray-600">当前用户：{user.username}（{user.role}）</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onLogout} className="px-3 py-1 border rounded">登出</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex gap-2 items-center text-sm">
          <span>排序：</span>
          {['ip','owner','email','hostname','department'].map(c => (
            <button key={c} onClick={() => { setSort(c); fetchHosts(c); }} className="px-2 py-1 border rounded text-xs">{c}</button>
          ))}
          <button onClick={()=>{ setSort(null); fetchHosts(null); }} className="px-2 py-1 border rounded text-xs">清除</button>
        </div>

        <div className="ml-auto flex gap-2">
          {user.role === 'admin' && <button onClick={()=>setEditing({})} className="px-3 py-1 bg-green-600 text-white rounded">新增</button>}
          {user.role === 'admin' && (
            <button
              onClick={initializeDatabase}
              disabled={initializing}
              className="px-3 py-1 bg-yellow-600 text-white rounded disabled:opacity-50"
            >
              {initializing ? '初始化中...' : '初始化数据库'}
            </button>
          )}
          <button onClick={exportCsv} className="px-3 py-1 bg-indigo-600 text-white rounded">导出 CSV</button>
        </div>
      </div>

      {editing && <div className="mb-4"><HostForm host={editing} onSave={saveHost} onCancel={()=>setEditing(null)} /></div>}

      {hosts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>暂无数据</p>
          <p className="text-sm mt-2">如果这是第一次使用，请点击"初始化数据库"按钮来加载数据</p>
        </div>
      )}

      <HostTable hosts={hosts} onEdit={h=>setEditing(h)} onDelete={delHost} isAdmin={user.role==='admin'} />
    </div>
  );
}
