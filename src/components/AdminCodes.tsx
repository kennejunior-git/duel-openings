'use client';
import './admin.css';
import { useCallback, useEffect, useState } from 'react';

type C = { id: string; code: string; role: string; pseudo: string | null; active: boolean; used_at: string | null };
const ROLES = [['admin', 'Admin'], ['participant', 'Participant'], ['voter', 'Votant'], ['jury', 'Jury']] as const;
const FILTERS = [['all', 'Tous'], ['participant', 'Participants'], ['voter', 'Votants'], ['jury', 'Jurys'], ['admin', 'Admins']] as const;
const LABEL: Record<string, string> = { admin: 'Admin', participant: 'Participant', voter: 'Votant', jury: 'Jury' };

export default function AdminCodes() {
  const [list, setList] = useState<C[]>([]);
  const [role, setRole] = useState('participant');
  const [count, setCount] = useState('5');
  const [adminCode, setAdminCode] = useState('');
  const [fresh, setFresh] = useState<string[]>([]);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyCode, setBusyCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/codes', { cache: 'no-store' });
      if (r.ok) setList(await r.json());
      else setMsg('Impossible de charger les codes.');
    } catch { setMsg('Connexion impossible.'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function gen() {
    const quantity = Number(count);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 60) {
      setMsg('Entre un nombre compris entre 1 et 60.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, count: quantity, ...(role === 'admin' ? { adminCode } : {}) })
      });
      const d = await r.json();
      if (d.codes) {
        setFresh(d.codes);
        setAdminCode('');
        await load();
      } else setMsg(d.error || 'Erreur.');
    } catch { setMsg('Connexion impossible.'); }
    finally { setBusy(false); }
  }

  async function toggle(c: C) {
    setBusyCode(c.id);
    setMsg('');
    setList(l => l.map(x => x.id === c.id ? { ...x, active: !x.active } : x));
    try {
      const r = await fetch('/api/admin/codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, active: !c.active })
      });
      if (!r.ok) throw new Error('Action refusée.');
      setMsg(c.active ? 'Code désactivé.' : 'Code réactivé.');
    } catch (e) {
      setList(l => l.map(x => x.id === c.id ? { ...x, active: c.active } : x));
      setMsg(e instanceof Error ? e.message : 'Impossible de modifier ce code.');
    } finally { setBusyCode(null); }
  }

  async function remove(c: C) {
    if (!window.confirm(`Supprimer définitivement le code ${c.code} ? Cette action est irréversible.`)) return;
    setBusyCode(c.id);
    setMsg('');
    try {
      const r = await fetch('/api/admin/codes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Suppression refusée.');
      setList(l => l.filter(x => x.id !== c.id));
      setMsg('Code supprimé.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Impossible de supprimer ce code.');
    } finally { setBusyCode(null); }
  }

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setMsg('Copié.'); }
    catch { setMsg('Copie impossible : sélectionne le texte à la main.'); }
  }

  const shown = list.filter(c => filter === 'all' || c.role === filter);

  return (
    <section className="adm">
      <h2>Codes</h2>
      <div className="seg" role="group" aria-label="Rôle des nouveaux codes">
        {ROLES.map(([v, l]) => <button key={v} type="button" className={role === v ? 'on' : ''} aria-pressed={role === v} onClick={() => setRole(v)}>{l}</button>)}
      </div>
      {role === 'admin' && (
        <label className="admin-code-confirm">Confirme ton identité avec ton code Admin
          <input type="password" autoComplete="off" value={adminCode} onChange={e => setAdminCode(e.target.value.toUpperCase())} placeholder="Saisis ton code Admin" />
        </label>
      )}
      <div className="row">
        <label>Nombre de codes<input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={count} onChange={e => setCount(e.target.value.replace(/\D/g, '').slice(0, 2))} onBlur={() => { const n = Number(count); setCount(String(!count || n < 1 ? 1 : Math.min(60, n))); }} /></label>
        <button type="button" className="go" onClick={gen} disabled={busy || (role === 'admin' && !adminCode.trim())}>{busy ? '…' : 'Générer'}</button>
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
            <div className="code-line"><code>{c.code}</code><span className={`chip ${c.role}`}>{LABEL[c.role]}</span><button type="button" className="ghost copy-code" onClick={() => copy(c.code)}>Copier</button></div>
            <div className="who">{c.pseudo ? <b>{c.pseudo}</b> : c.used_at ? <b>{c.role === 'admin' ? 'Administration' : 'Connecté'}</b> : <em>En attente</em>}</div>
            {c.role !== 'admin' && <button type="button" className="ghost" onClick={() => toggle(c)} disabled={busyCode === c.id}>{busyCode === c.id ? '…' : c.active ? 'Désactiver' : 'Activer'}</button>}
            {c.used_at === null && <button type="button" className="ghost delete-code" onClick={() => remove(c)} disabled={busyCode === c.id}>{busyCode === c.id ? '…' : 'Supprimer'}</button>}
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="muted">Aucun code pour l'instant.</p>}
    </section>
  );
}
