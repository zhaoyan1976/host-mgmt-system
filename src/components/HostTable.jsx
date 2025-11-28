import React from 'react';

export default function HostTable({ hosts, onEdit, onDelete, isAdmin }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Hostname</th>
            <th className="p-2 border">IP</th>
            <th className="p-2 border">OS</th>
            <th className="p-2 border">Department</th>
            <th className="p-2 border">Owner</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Cabinet</th>
            <th className="p-2 border">Updated</th>
            {isAdmin && <th className="p-2 border">操作</th>}
          </tr>
        </thead>
        <tbody>
          {hosts.map(h => (
            <tr key={h.id} className="odd:bg-white even:bg-gray-50">
              <td className="p-2 border">{h.hostname}</td>
              <td className="p-2 border">{h.ip}</td>
              <td className="p-2 border">{h.os}</td>
              <td className="p-2 border">{h.department}</td>
              <td className="p-2 border">{h.owner}</td>
              <td className="p-2 border">{h.email}</td>
              <td className="p-2 border">{h.cabinet_location}</td>
              <td className="p-2 border">{h.updated_at}</td>
              {isAdmin && (
                <td className="p-2 border">
                  <button onClick={()=>onEdit(h)} className="px-2 py-1 bg-yellow-300 rounded mr-2">编辑</button>
                  <button onClick={()=>onDelete(h.id)} className="px-2 py-1 bg-red-500 text-white rounded">删除</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
