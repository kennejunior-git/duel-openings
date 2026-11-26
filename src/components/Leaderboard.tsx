'use client';
import { useCallback, useEffect, useState } from 'react';
import './leaderboard.css';

type Person = { rank: number; pseudo: string; total: number; tournaments: number; wins: number; me: boolean };
export default function Leaderboard() {
  const [rows, setRows] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/leaderboard', { cache: 'no-store' });
      if (!r.ok) throw new Error('Classement indisponible pour le moment.');
      const data = await r.json();
      setRows(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger le classement.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, [load]);

  return (
    <section className="leaderboard" aria-labelledby="leaderboard-title">
      <header className="leaderboard-head">
        <div><span className="eyebrow">PALMARÈS GLOBAL</span><h2 id="leaderboard-title">Classement des champions</h2></div>
        <span className="leaderboard-live">Mis à jour automatiquement</span>
      </header>
      {loading && <p className="muted">Chargement du classement…</p>}
      {!loading && error && <div className="leaderboard-empty" role="alert"><p>{error}</p><button type="button" className="ghost" onClick={load}>Réessayer</button></div>}
      {!loading && !error && rows.length === 0 && (
        <div className="leaderboard-empty"><span className="leaderboard-empty-icon">🏆</span><b>Le podium attend son premier champion</b><p>Les points apparaîtront ici à la fin du premier tournoi.</p></div>
      )}
      {!loading && !error && rows.length > 0 && <>
        <div className="podium">
          {rows.slice(0, 3).map((p, index) => <article key={p.pseudo} className={`podium-card place-${index + 1}${p.me ? ' is-me' : ''}`}>
            <span className="podium-medal">{index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}</span>
            <span className="podium-rank">{p.rank}{p.rank === 1 ? 'ER' : 'E'}</span>
            <b className="podium-name">{p.pseudo}{p.me && <small>TOI</small>}</b>
            <strong>{p.total.toLocaleString('fr-FR')} <small>pts</small></strong>
            <span className="podium-meta">{p.wins} victoire{p.wins > 1 ? 's' : ''}</span>
          </article>)}
        </div>
        <div className="leaderboard-list" role="list" aria-label="Classement complet">
          {rows.map(p => <article key={p.pseudo} className={`leaderboard-row${p.me ? ' is-me' : ''}`} role="listitem">
            <span className="leaderboard-position">{String(p.rank).padStart(2, '0')}</span>
            <div className="leaderboard-player"><b>{p.pseudo}</b>{p.me && <span>Ton profil</span>}<small>{p.tournaments} tournoi{p.tournaments > 1 ? 's' : ''} · {p.wins} victoire{p.wins > 1 ? 's' : ''}</small></div>
            <strong>{p.total.toLocaleString('fr-FR')} <small>pts</small></strong>
          </article>)}
        </div>
      </>}
    </section>
  );
}
