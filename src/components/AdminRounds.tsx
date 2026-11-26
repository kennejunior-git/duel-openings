'use client';
import './admin.css';
import './duel.css';
import { useCallback, useEffect, useState } from 'react';
type I = { tournament: { name: string; jury_enabled?: boolean } | null; finished?: boolean; round?: number | null; next_round?: number; next_opening?: number; matches?: number; open?: number; votes?: number; jury_votes?: number; jury_required?: number; closes_at?: string | null; participants?: number; complete_participants?: number; jurors?: number; openings?: Record<string, number> };
export default function AdminRounds() {
  const [i, setI] = useState<I | null>(null);
  const [minutes, setMinutes] = useState(15);
  const [confirm, setConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const load = useCallback(async () => {
    try { const r = await fetch('/api/admin/rounds', { cache: 'no-store' }); if (r.ok) setI(await r.json()); else setMsg('Impossible de charger les combats.'); }
    catch { setMsg('Connexion impossible.'); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  async function go(body: object, ok: (j: any) => string) {
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/admin/rounds', { method: 'POST', body: JSON.stringify(body) });
      const j = await r.json();
      setMsg(r.ok ? ok(j) : j.error || 'Erreur.'); load();
    } catch { setMsg('Connexion impossible.'); } finally { setBusy(false); setConfirm(false); setResetConfirm(false); }
  }
  return (
    <section className="rounds">
      <h2>Combats</h2>
      {msg && <p className="msg" role="status">{msg}</p>}
      {!i && <p className="muted">Chargement…</p>}
      {i && <div className="stat"><b>{i.tournament ? 'Préparation du tournoi en cours' : 'Préparation du prochain tournoi'}</b>{!i.tournament && <p className="muted small">Aucun tournoi n’est actuellement ouvert aux envois. Les compteurs d’openings se rempliront lorsque tu passeras un nouveau tournoi au statut « Envoi des openings ».</p>}<p className="muted small">Participants inscrits : {i.participants ?? 0} · Avec 3 openings : {i.complete_participants ?? 0}</p><p className="muted small">Openings reçus : n°1 {i.openings?.['1'] ?? 0} · n°2 {i.openings?.['2'] ?? 0} · n°3 {i.openings?.['3'] ?? 0}</p><p className="muted small">Jurés inscrits : {i.jurors ?? 0} · un nombre impair est obligatoire.</p>{![2, 4, 8, 16, 32].includes(i.participants ?? 0) && <p className="err small">Effectif invalide : il faut 2, 4, 8, 16 ou 32 participants.</p>}{(i.complete_participants ?? 0) < (i.participants ?? 0) && <p className="err small">Il manque les trois openings à {Math.max(0, (i.participants ?? 0) - (i.complete_participants ?? 0))} participant(s).</p>}{(i.jurors ?? 0) < 1 || (i.jurors ?? 0) % 2 === 0 ? <p className="err small">Le jury doit compter 1, 3, 5, 7… jurés actifs.</p> : <p className="muted small">Effectif du jury valide.</p>}</div>}
      {i && !i.tournament && <p className="muted">{i.finished ? 'Le tournoi est terminé. ' : ''}Passe un tournoi au statut « En cours » pour lancer les combats.</p>}
      {i?.tournament && (i.open ?? 0) > 0 && (
        <div className="stat">
          <p><b>Tour {i.round}</b> en cours · {i.matches} combats · {i.votes} votes</p>
          {i.closes_at && <p className="muted small">Fin du vote : {new Date(i.closes_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
          <p className="muted small">À la fin du compte à rebours, les votes sont bloqués. Chaque juré doit avoir voté dans chaque combat avant la clôture. En cas d’égalité, le jury effectue ensuite un vote de départage.</p>
          {i.tournament.jury_enabled && <p className="muted small">Votes du jury : {i.jury_votes ?? 0} / {i.jury_required ?? 0} sur l’ensemble des combats.</p>}
          <button type="button" className={confirm ? 'danger' : ''} disabled={busy || (!!i.closes_at && Date.parse(i.closes_at) > now) || (!!i.tournament.jury_enabled && (i.jury_votes ?? 0) < (i.jury_required ?? 0))} onClick={() => (confirm ? go({ action: 'close' }, j => (j.finished ? 'Tournoi terminé !' : `Tour ${j.round} clôturé.`)) : setConfirm(true))}>{busy ? '…' : i.closes_at && Date.parse(i.closes_at) > now ? 'Votes en cours…' : i.tournament.jury_enabled && (i.jury_votes ?? 0) < (i.jury_required ?? 0) ? 'En attente du jury…' : confirm ? 'Touche encore pour clôturer' : 'Clôturer maintenant'}</button>
        </div>
      )}
      {i?.tournament && (i.open ?? 0) === 0 && (
        <div className="stat">
          <p>Prêt pour le <b>tour {i.next_round}</b> (opening n°{i.next_opening}).</p>
          <div className="seg" role="group" aria-label="Durée du vote en minutes">
            {[5, 15, 30, 60].map(m => <button key={m} type="button" className={minutes === m ? 'on' : ''} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>{m} min</button>)}
          </div>
          <button type="button" disabled={busy} onClick={() => go({ action: 'start', minutes }, j => `Tour ${j.round} lancé : ${j.matches} combats.`)}>{busy ? '…' : `Lancer le tour ${i.next_round}`}</button>
          <p className="muted small">Aucun gagnant d’office : seuls les tableaux complets de 2, 4, 8, 16 ou 32 participants sont acceptés. Chaque participant actif doit avoir envoyé ses trois openings. Le jury doit être activé et compter un nombre impair de membres inscrits.</p>
        </div>
      )}
      {i?.tournament && (
        <div className="stat reset-stat">
          <p><b>Recommencer les combats</b></p>
          <p className="muted small">Efface les combats, votes et points de ce tournoi. Les participants, codes et openings sont conservés. Cette action est irréversible.</p>
          <button type="button" className="danger" disabled={busy} onClick={() => resetConfirm ? go({ action: 'reset' }, j => `Réinitialisation terminée : ${j.removed_matches} combats supprimés. Le prochain lancement sera le tour 1.`) : setResetConfirm(true)}>{busy ? '…' : resetConfirm ? 'Confirmer la réinitialisation' : 'Réinitialiser les combats'}</button>
          {resetConfirm && <button type="button" className="ghost" disabled={busy} onClick={() => setResetConfirm(false)}>Annuler</button>}
        </div>
      )}
    </section>
  );
}