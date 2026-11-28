'use client';
import './admin.css';
import './tournaments.css';
import { useCallback, useEffect, useState } from 'react';
type T = { id: string; name: string; starts_at: string; status: string; jury_enabled: boolean; prize_first: number; prize_second: number; prize_third: number };
type Form = { id: string | null; name: string; when: string; jury: boolean; status: string; first: string; second: string; third: string };
const STATUS = [['draft', 'Brouillon'], ['upload', 'Envoi des openings'], ['live', 'En cours'], ['done', 'Terminé']] as const;
const label = (s: string) => STATUS.find(x => x[0] === s)?.[1] ?? s;
const p = (n: number) => String(n).padStart(2, '0');
const toLocal = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(20, 0, 0, 0); return toLocal(d); };
const money = (n: number) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
export default function AdminTournaments() {
  const [list, setList] = useState<T[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { const r = await fetch('/api/admin/tournaments', { cache: 'no-store' }); if (r.ok) setList(await r.json()); else setMsg('Impossible de charger les tournois.'); }
    catch { setMsg('Connexion impossible.'); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const openNew = () => { setMsg(''); setConfirmDel(false); setForm({ id: null, name: '', when: tomorrow(), jury: false, status: 'draft', first: '0', second: '0', third: '0' }); };
  const openEdit = (t: T) => { setMsg(''); setConfirmDel(false); setForm({ id: t.id, name: t.name, when: toLocal(new Date(t.starts_at)), jury: t.jury_enabled, status: t.status, first: String(t.prize_first || 0), second: String(t.prize_second || 0), third: String(t.prize_third || 0) }); };
  async function save() {
    if (!form) return;
    const d = new Date(form.when);
    const amounts = [form.first, form.second, form.third].map(v => v.trim() === '' ? 0 : Number(v));
    if (form.name.trim().length < 2 || isNaN(d.getTime())) { setMsg('Mets un nom et une date valides.'); return; }
    if (amounts.some(n => !Number.isSafeInteger(n) || n < 0 || n > 1000000000)) { setMsg('Entre des montants entiers entre 0 et 1 000 000 000 FCFA.'); return; }
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/admin/tournaments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: form.id, name: form.name, starts_at: d.toISOString(), jury_enabled: form.jury, status: form.status, prize_first: amounts[0], prize_second: amounts[1], prize_third: amounts[2] }) });
      const j = await r.json();
      if (j.ok) { setForm(null); setMsg('Tournoi et récompenses enregistrés.'); await load(); } else setMsg(j.error || 'Erreur.');
    } catch { setMsg('Connexion impossible.'); } finally { setBusy(false); }
  }
  async function del() {
    if (!form?.id) return;
    if (!confirmDel) { setConfirmDel(true); return; }
    setBusy(true);
    try { const r = await fetch('/api/admin/tournaments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: form.id }) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Suppression impossible.'); setForm(null); setMsg('Tournoi supprimé. Les openings liés à ce tournoi ne sont plus modifiables.'); load(); }
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
          <div className="prize-editor">
            <div><strong>Récompenses du tournoi</strong><p className="muted small">Définis les montants à remettre aux trois premiers. Mets 0 si aucune récompense n’est prévue.</p></div>
            <label>🥇 1ère place (FCFA)<input type="number" min="0" max="1000000000" step="1" inputMode="numeric" value={form.first} onChange={e => setForm({ ...form, first: e.target.value })} placeholder="5000" /></label>
            <label>🥈 2ème place (FCFA)<input type="number" min="0" max="1000000000" step="1" inputMode="numeric" value={form.second} onChange={e => setForm({ ...form, second: e.target.value })} placeholder="3000" /></label>
            <label>🥉 3ème place (FCFA)<input type="number" min="0" max="1000000000" step="1" inputMode="numeric" value={form.third} onChange={e => setForm({ ...form, third: e.target.value })} placeholder="1000" /></label>
          </div>
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
          {(t.prize_first > 0 || t.prize_second > 0 || t.prize_third > 0) && <p className="prize-summary">🥇 {money(t.prize_first)} · 🥈 {money(t.prize_second)} · 🥉 {money(t.prize_third)}</p>}
          {!form && <button type="button" className="ghost" onClick={() => openEdit(t)}>Modifier</button>}
        </div>
      ))}
      {list.length === 0 && !form && <p className="muted">Aucun tournoi pour l'instant.</p>}
    </section>
  );
}
