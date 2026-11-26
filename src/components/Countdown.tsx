'use client';
import { useEffect, useState } from 'react';
export default function Countdown({ to }: { to: string }) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => { const t = () => setMs(new Date(to).getTime() - Date.now()); t(); const i = setInterval(t, 1000); return () => clearInterval(i); }, [to]);
  if (ms === null) return <div className="cd" />;
  if (ms <= 0) return <p className="cd-live">Le tournoi est lancé</p>;
  const s = Math.floor(ms / 1000), u = [['j', Math.floor(s / 86400)], ['h', Math.floor(s / 3600) % 24], ['min', Math.floor(s / 60) % 60], ['s', s % 60]];
  return <div className="cd">{u.map(([l, v]) => <div key={l as string}><b>{String(v).padStart(2, '0')}</b><small>{l}</small></div>)}</div>;
}
