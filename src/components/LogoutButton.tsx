'use client';
import './admin.css';
export default function LogoutButton() {
  return <button type="button" className="ghost out" onClick={async () => { await fetch('/api/logout', { method: 'POST' }); location.href = '/login'; }}>Me déconnecter</button>;
}
