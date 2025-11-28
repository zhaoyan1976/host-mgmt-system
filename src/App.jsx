import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const API_BASE = import.meta.env.VITE_API_BASE ?? ''; // leave empty to use relative /api

function App() {
  const [user, setUser] = useState(null);

  useEffect(()=> {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
        setUser({ username: payload.username, role: payload.role });
      } catch(e){ localStorage.removeItem('token'); }
    }
  }, []);

  if (!user) return <Login onLogin={setUser} />;
  return <Dashboard user={user} onLogout={() => { localStorage.removeItem('token'); setUser(null); }} apiBase={API_BASE} />;
}

export default App;
