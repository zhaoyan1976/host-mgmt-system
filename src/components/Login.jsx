import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [loading, setLoading] = useState(false);
  const API = '';

  const doLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });
      const j = await res.json();
      if (j.token) {
        localStorage.setItem('token', j.token);
        onLogin({ username: j.user.username, role: j.user.role });
      } else {
        alert('登录失败：' + (j.error || '未知错误'));
      }
    } catch (err) {
      alert('网络错误：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">推进办主机管理</h1>
        <label className="block text-sm text-gray-600">用户名</label>
        <input className="mt-1 mb-3 w-full rounded border p-2" value={u} onChange={e=>setU(e.target.value)} />
        <label className="block text-sm text-gray-600">密码</label>
        <input type="password" className="mt-1 mb-4 w-full rounded border p-2" value={p} onChange={e=>setP(e.target.value)} />
        <button onClick={doLogin} disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
          {loading ? '登录中...' : '登录'}
        </button>
        <p className="text-xs text-gray-500 mt-3">初始管理员：admin / 123（首次登录后请更改密码）</p>
      </div>
    </div>
  );
}
