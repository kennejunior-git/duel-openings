'use client';
import './admin.css';
import { useCallback, useEffect, useState } from 'react';
type C = { id: string; code: string; role: string; pseudo: string | null; active: boolean };
const ROLES = [['participant', 'Participant'], ['voter', 'Votant'], ['jury', 'Jury']] as const;
const FILTERS = [['all', 'Tous'], ['participant', 'Participants'], ['voter', 'Votants'], ['jury', 'Jurys']] as const;
const LABEL: Record<string, string> = { admin: 'Admin', participant: 'Participant', voter: 'Votant', jury: 'Jury' };
export default function AdminCodes() {
  const [list, setList] = useState<C[]>([]);
  const [role, setRole] = useState('participant');
  const [count, setCount] = useState(5);
  const [fresh, setFresh] = useState<string[]>([]);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/codes', { cache: 'no-store' });
      if (r.ok) setList(await r.json()); else setMsg('Impossible de charger les codes.');
    } catch { setMsg('Connexion impossible.'); }
  }, []);
  useEffect(() => { load(); }, [load]);
  async function gen() {
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/admin/codes', { method: 'POST', body: JSON.stringify({ role, count }) });
      const d = await r.json();
      if (d.codes) { setFresh(d.codes); load(); } else setMsg(d.error || 'Erreur.');
    } catch { setMsg('Connexion impossible.'); } finally { setBusy(false); }
  }
  async function toggle(c: C) {
    setList(l => l.map(x => (x.id === c.id ? { ...x, active: !x.active } : x)));
    try { await fetch('/api/admin/codes', { method: 'PATCH', body: JSON.stringify({ id: c.id, active: !c.active }) }); } catch { load(); }
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setMsg('Copié.'); } catch { setMsg('Copie impossible : sélectionne le texte à la main.'); }
  }
  const shown = list.filter(c => filter === 'all' || c.role === filter);
  return (
    <section className="adm">
      <h2>Codes</h2>
      <div className="seg" role="group" aria-label="Rôle des nouveaux codes">
        {ROLES.map(([v, l]) => <button key={v} type="button" className={role === v ? 'on' : ''} aria-pressed={role === v} onClick={() => setRole(v)}>{l}</button>)}
      </div>
      <div className="row">
        <label>Nombre de codes<input type="number" inputMode="numeric" min={1} max={60} value={count} onChange={e => setCount(Math.max(1, Math.min(60, Number(e.target.value) || 1)))} /></label>
        <button type="button" className="go" onClick={gen} disabled={busy}>{busy ? '…' : 'Générer'}</button>
      </div>
      {fresh.length > 0 && (
        <div className="fresh">
          <p>{fresh.length} nouveaux codes</p>
          <pre>{fresh.join('\n')}</pre>
          <button type="button" onClick={() => copy(fresh.join('\n'))}>Copier la liste</button>
        </div>
      )}
      {msg && <p className="msg" role="status">{msg}</p>}
      <div className="seg small" role="group" aria-label="Filtrer la liste">
        {FILTERS.map(([v, l]) => <button key={v} type="button" className={filter === v ? 'on' : ''} aria-pressed={filter === v} onClick={() => setFilter(v)}>{l}</button>)}
      </div>
      <ul className="codes">
        {shown.map(c => (
          <li key={c.id} className={c.active ? '' : 'off'}>
            <div><code>{c.code}</code><span className={`chip ${c.role}`}>{LABEL[c.role]}</span></div>
            <div className="who">{c.pseudo ? <b>{c.pseudo}</b> : <em>En attente</em>}</div>
            {c.role !== 'admin' && <button type="button" className="ghost" onClick={() => toggle(c)}>{c.active ? 'Désactiver' : 'Activer'}</button>}
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="muted">Aucun code pour l'instant.</p>}
    </section>
  );
}
