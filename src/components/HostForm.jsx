import React, { useState } from 'react';

export default function HostForm({ host, onSave, onCancel }) {
  const [h, setH] = useState(host || {});
  const set = (k,v) => setH(prev => ({ ...prev, [k]: v }));

  return (
    <div className="p-4 border rounded bg-gray-50">
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Hostname" value={h.hostname||''} onChange={e=>set('hostname', e.target.value)} className="p-2 border rounded" />
        <input placeholder="IP" value={h.ip||''} onChange={e=>set('ip', e.target.value)} className="p-2 border rounded" />
        <input placeholder="OS" value={h.os||''} onChange={e=>set('os', e.target.value)} className="p-2 border rounded" />
        <input placeholder="Department" value={h.department||''} onChange={e=>set('department', e.target.value)} className="p-2 border rounded" />
        <input placeholder="Owner" value={h.owner||''} onChange={e=>set('owner', e.target.value)} className="p-2 border rounded" />
        <input placeholder="Email" value={h.email||''} onChange={e=>set('email', e.target.value)} className="p-2 border rounded" />
        <input placeholder="Cabinet location" value={h.cabinet_location||''} onChange={e=>set('cabinet_location', e.target.value)} className="p-2 border rounded" />
        <input placeholder="Description" value={h.description||''} onChange={e=>set('description', e.target.value)} className="p-2 border rounded" />
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={()=>onSave(h)} className="px-3 py-1 bg-blue-600 text-white rounded">保存</button>
        <button onClick={onCancel} className="px-3 py-1 border rounded">取消</button>
      </div>
    </div>
  );
}
