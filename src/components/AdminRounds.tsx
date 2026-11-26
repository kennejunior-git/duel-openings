'use client';
import './admin.css';
import './duel.css';
import { useCallback, useEffect, useState } from 'react';
type I = { tournament: { name: string } | null; finished?: boolean; round?: number | null; next_round?: number; next_opening?: number; matches?: number; open?: number; votes?: number; closes_at?: string | null };
export default function AdminRounds() {
  const [i, setI] = useState<I | null>(null);
  const [minutes, setMinutes] = useState(15);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { const r = await fetch('/api/admin/rounds', { cache: 'no-store' }); if (r.ok) setI(await r.json()); else setMsg('Impossible de charger les combats.'); }
    catch { setMsg('Connexion impossible.'); }
  }, []);
  useEffect(() => { load(); }, [load]);
  async function go(body: object, ok: (j: any) => string) {
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/admin/rounds', { method: 'POST', body: JSON.stringify(body) });
      const j = await r.json();
      setMsg(r.ok ? ok(j) : j.error || 'Erreur.'); load();
    } catch { setMsg('Connexion impossible.'); } finally { setBusy(false); setConfirm(false); }
  }
  return (
    <section className="rounds">
      <h2>Combats</h2>
      {msg && <p className="msg" role="status">{msg}</p>}
      {!i && <p className="muted">Chargement…</p>}
      {i && !i.tournament && <p className="muted">{i.finished ? 'Le tournoi est terminé. ' : ''}Passe un tournoi au statut « En cours » pour lancer les combats.</p>}
      {i?.tournament && (i.open ?? 0) > 0 && (
        <div className="stat">
          <p><b>Tour {i.round}</b> en cours · {i.matches} combats · {i.votes} votes</p>
          {i.closes_at && <p className="muted small">Fin du vote : {new Date(i.closes_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
          <p className="muted small">Le tour se clôture tout seul à la fin du temps. Toi seul décides quand lancer le suivant.</p>
          <button type="button" className={confirm ? 'danger' : ''} disabled={busy} onClick={() => (confirm ? go({ action: 'close' }, j => (j.finished ? 'Tournoi terminé !' : `Tour ${j.round} clôturé.`)) : setConfirm(true))}>{confirm ? 'Touche encore pour clôurer' : 'Cloturer maintenant'}</button>
        </div>
      ))}
      {i?.tournament && (i.open ?? 0) === 0 && (
        <div className="stat">
          <p>Prêt pour le <b>tour {i.next_round}</b> (opening n° {i.next_opening}).</p>
          <div className="seg" role="group" aria-label="Durée du vote">
            {[5, 15, 30, 60].map(m => <button key={m} type="button" className={minutes === m ? 'on' : ''} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>{m} min</button>)}}
          </div>
          <button type="button" disabled={busy} onClick={() => go({ action: 'start', minutes }, j => `Tour ${j.round} lancé : ${j.matches} combats.`)}>{busy ? '…' : `Lancer le tour ${i.next_round}`}</button>
          <p className="muted small">Tirage au sort automatique. Après le tour 3, on repart sur l'opening n°1 jusqu'à ce qu'il reste un seul gagnant.</p>
        </div>
      )}
    </section>
  );
}