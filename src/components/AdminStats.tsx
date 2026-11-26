'use client';
import { useCallback, useEffect, useState } from 'react';
type Stats = {
  participants: number; jury: number; voters: number; admins: number;
  participants_pending: number; jury_pending: number; voters_pending: number;
  openings: number; matches: number; votes: number;
  tournament: { name: string; status: string } | null;
};
const number = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
export default function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/admin/stats', { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Chargement impossible.');
      setStats(d);
    } catch (e) { setError(e instanceof Error ? e.message : 'Connexion impossible.'); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const cards = stats ? [
    ['Participants inscrits', stats.participants, stats.participants_pending + ' codes disponibles'],
    ['Membres du jury', stats.jury, stats.jury_pending + ' codes disponibles'],
    ['Votants inscrits', stats.voters, stats.voters_pending + ' codes disponibles'],
    ['Administrateurs', stats.admins, 'Comptes admin activés'],
    ['Openings envoyés', stats.openings, 'Tournois non terminés'],
    ['Combats', stats.matches, 'Tournois non terminés'],
    ['Votes enregistrés', stats.votes, 'Tournois non terminés'],
  ] as const : [];
  return <section className="adm">
    <h2>Effectifs et statistiques</h2>
    {stats?.tournament && <p className="muted">Tournoi suivi : <b>{stats.tournament.name}</b></p>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:12}}>
      {cards.map(([label,value,note]) => <div key={label} style={{padding:14,border:'1px solid var(--line,#333)',borderRadius:12}}>
        <div className="muted" style={{fontSize:13}}>{label}</div>
        <div style={{fontSize:30,fontWeight:800,lineHeight:1.3}}>{number(value)}</div>
        <div className="muted" style={{fontSize:12}}>{note}</div>
      </div>)}
    </div>
    {error && <p className="msg" role="alert">{error}</p>}
    <button type="button" className="ghost" onClick={load} disabled={busy}>{busy ? 'Actualisation…' : 'Actualiser les chiffres'}</button>
  </section>;
}
