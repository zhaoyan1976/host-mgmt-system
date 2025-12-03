import React, { useEffect, useState } from 'react';
import HostTable from './HostTable';
import HostForm from './HostForm';

export default function Dashboard({ user, onLogout }) {
  const [hosts, setHosts] = useState([]);
  const [sort, setSort] = useState(null);
  const [editing, setEditing] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(()=> { fetchHosts(); }, []);

  async function fetchHosts(s) {
    const q = s ? `?sort=${s}` : '';
    const res = await fetch(`/api/hosts${q}`, { headers: { Authorization: `Bearer ${token}` }});
    const j = await res.json();
    setHosts(Array.isArray(j) ? j : j.hosts || []);
  }

  const saveHost = async (h) => {
    const method = h.id ? 'PUT' : 'POST';
    await fetch(`/api/hosts`, {
      method,
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(h)
    });
    setEditing(null);
    fetchHosts(sort);
  };

  const delHost = async (id) => {
    if (!confirm('确认删除该记录？')) return;
    await fetch(`/api/hosts?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
    fetchHosts(sort);
  };

  const exportCsv = () => {
    // open worker CSV route
    window.open(`/api/hosts/export`);
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
          <button onClick={exportCsv} className="px-3 py-1 bg-indigo-600 text-white rounded">导出 CSV</button>
        </div>
      </div>

      {editing && <div className="mb-4"><HostForm host={editing} onSave={saveHost} onCancel={()=>setEditing(null)} /></div>}

      <HostTable hosts={hosts} onEdit={h=>setEditing(h)} onDelete={delHost} isAdmin={user.role==='admin'} />
    </div>
  );
}
