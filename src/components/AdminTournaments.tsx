'use client';
import './admin.css';
import './tournaments.css';
import { useCallback, useEffect, useState } from 'react';
type T = { id: string; name: string; starts_at: string; status: string; jury_enabled: boolean };
const STATUS = [['draft', 'Brouillon'], ['upload', 'Envoi des openings'], ['live', 'En cours'], ['done', 'Terminé']] as const;
const label = (s: string) => STATUS.find(x => x[0] === s)?.[1] ?? s;
const p = (n: number) => String(n).padStart(2, '0');
const toLocal = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(20, 0, 0, 0); return toLocal(d); };
export default function AdminTournaments() {
  const [list, setList] = useState<T[]>([]);
  const [form, setForm] = useState<{ id: string | null; name: string; when: string; jury: boolean; status: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { const r = await fetch('/api/admin/tournaments', { cache: 'no-store' }); if (r.ok) setList(await r.json()); else setMsg('Impossible de charger les tournois.'); }
    catch { setMsg('Connexion impossible.'); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const openNew = () => { setMsg(''); setConfirmDel(false); setForm({ id: null, name: '', when: tomorrow(), jury: false, status: 'draft' }); };
  const openEdit = (t: T) => { setMsg(''); setConfirmDel(false); setForm({ id: t.id, name: t.name, when: toLocal(new Date(t.starts_at)), jury: t.jury_enabled, status: t.status }); };
  async function save() {
    if (!form) return;
    const d = new Date(form.when);
    if (form.name.trim().length < 2 || isNaN(d.getTime())) { setMsg('Mets un nom et une date valides.'); return; }
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/admin/tournaments', { method: 'POST', body: JSON.stringify({ id: form.id, name: form.name, starts_at: d.toISOString(), jury_enabled: form.jury, status: form.status }) });
      const j = await r.json();
      if (j.ok) { setForm(null); setMsg('Enregistré.'); load(); } else setMsg(j.error || 'Erreur.');
    } catch { setMsg('Connexion impossible.'); } finally { setBusy(false); }
  }
  async function del() {
    if (!form?.id) return;
    if (!confirmDel) { setConfirmDel(true); return; }
    setBusy(true);
    try { const r = await fetch('/api/admin/tournaments', { method: 'DELETE', body: JSON.stringify({ id: form.id }) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Suppression impossible.'); setForm(null); setMsg('Tournoi supprimé. Les openings liés à ce tournoi ne sont plus modifiables.'); load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : 'Connexion impossible.'); } finally { setBusy(false); setConfirmDel(false); }
  }
  return (
    <section className="tour">
      <h2>Tournois</h2>
      {!form && <button type="button" onClick={openNew}>Nouveau tournoi</button>}
      {msg && <p className="msg" role="status">{msg}</p>}
      {form && (
        <div className="tform">
          <label>Nom du tournoi<input type="text" value={form.name} maxLength={60} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Duel d'openings #1" /></label>
          <label>Début du tournoi<input type="datetime-local" value={form.when} onChange={e => setForm({ ...form, when: e.target.value })} /></label>
          <label className="sw"><input type="checkbox" role="switch" checked={form.jury} onChange={e => setForm({ ...form, jury: e.target.checked })} />Jury activé</label>
          <p className="muted small">Avec le jury, les jurys comptent pour 50 % du résultat et les autres votes pour les 50 % restants.</p>
          <div className="seg" role="group" aria-label="Statut">
            {STATUS.map(([v, l]) => <button key={v} type="button" className={form.status === v ? 'on' : ''} aria-pressed={form.status === v} onClick={() => setForm({ ...form, status: v })}>{l}</button>)}
          </div>
          <p className="muted small">Brouillon : visible par toi seulement. Les autres statuts sont visibles sur l'accueil.</p>
          <div className="acts">
            <button type="button" onClick={save} disabled={busy}>{busy ? '…' : 'Enregistrer'}</button>
            <button type="button" className="ghost" onClick={() => setForm(null)}>Annuler</button>
          </div>
          {form.id && <button type="button" className="danger" onClick={del} disabled={busy}>{confirmDel ? 'Touche encore pour confirmer' : 'Supprimer ce tournoi'}</button>}
        </div>
      )}
      {list.map(t => (
        <div className="tcard" key={t.id}>
          <h3>{t.name}</h3>
          <span className="when">{new Date(t.starts_at).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</span>
          <div className="chips"><span className="chip st">{label(t.status)}</span>{t.jury_enabled && <span className="chip jr">Jury</span>}</div>
          {!form && <button type="button" className="ghost" onClick={() => openEdit(t)}>Modifier</button>}
        </div>
      ))}
      {list.length === 0 && !form && <p className="muted">Aucun tournoi pour l'instant.</p>}
    </section>
  );
}
