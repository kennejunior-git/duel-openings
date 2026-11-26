'use client';
import './openings.css';
import { useCallback, useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
type E = { id: string; position: number; title: string; audio_key: string; duration_sec: number; size_bytes: number };
type D = { tournament: { id: string; name: string; status: string } | null; entries: E[]; publicBase: string };
const MAX_BYTES = 3_500_000, MAX_SEC = 150;
const MIME: Record<string, string> = { mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg' };
const BY_TYPE: Record<string, string> = { 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac', 'audio/ogg': 'ogg' };
const ROUND = ['Combat 1', 'Combat 2', 'Combat 3'];
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const mo = (b: number) => (b / 1e6).toFixed(1).replace('.', ',') + ' Mo';
async function post(body: object) {
  const r = await fetch('/api/openings', { method: 'POST', body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Erreur.');
  return j;
}
function duration(file: File): Promise<number> {
  return new Promise((ok, ko) => {
    const a = new Audio(), u = URL.createObjectURL(file);
    a.preload = 'metadata';
    a.onloadedmetadata = () => { URL.revokeObjectURL(u); isFinite(a.duration) ? ok(a.duration) : ko(new Error()); };
    a.onerror = () => { URL.revokeObjectURL(u); ko(new Error()); };
    a.src = u;
  });
}
function Slot({ pos, entry, base, locked, onChange }: { pos: number; entry?: E; base: string; locked: boolean; onChange: () => void }) {
  const [title, setTitle] = useState(entry?.title ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function send() {
    setErr('');
    if (title.trim().length < 2) return setErr("Écris le titre (anime et nom de l'opening).");
    if (!file) return setErr('Choisis un fichier audio.');
    const name = file.name.toLowerCase();
    const ext = BY_TYPE[file.type] ?? ['mp3', 'm4a', 'aac', 'ogg'].find(x => name.endsWith('.' + x));
    if (!ext) return setErr('Format accepté : MP3, M4A, AAC ou OGG.');
    if (file.size > MAX_BYTES) return setErr(`Fichier trop lourd (${mo(file.size)}). Maximum ${mo(MAX_BYTES)}.`);
    setBusy(true);
    try {
      const d = await duration(file).catch(() => { throw new Error('Impossible de lire ce fichier audio.'); });
      if (d > MAX_SEC) throw new Error(`Trop long (${mmss(Math.round(d))}). Maximum 2:30.`);
      const prep = await post({ action: 'prepare', ext });
      const up = await fetch(prep.uploadUrl, { method: 'POST', headers: { apikey: prep.key, Authorization: `Bearer ${prep.key}`, 'Content-Type': MIME[ext] }, body: file });
      if (!up.ok) throw new Error("L'envoi du fichier a été refusé. Réessaie.");
      await post({ action: 'save', position: pos, title, path: prep.path, duration: d });
      setFile(null); setEditing(false); onChange();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Erreur.'); } finally { setBusy(false); }
  }
  async function act(body: object) { setBusy(true); setErr(''); try { await post(body); onChange(); } catch (e) { setErr(e instanceof Error ? e.message : 'Erreur.'); } finally { setBusy(false); setConfirmDel(false); } }
  const showForm = !locked && (!entry || editing);
  return (
    <div className="slot">
      <div className="slot-head"><span className="badge">{pos}</span><b>{ROUND[pos - 1]}</b>{entry && !locked && (
        <span className="moves">
          <button type="button" className="ghost" aria-label="Monter" disabled={busy || pos === 1} onClick={() => act({ action: 'swap', a: pos, b: pos - 1 })}><ArrowUp size={18} /></button>
          <button type="button" className="ghost" aria-label="Descendre" disabled={busy || pos === 3} onClick={() => act({ action: 'swap', a: pos, b: pos + 1 })}><ArrowDown size={18} /></button>
        </span>)}
      </div>
      {entry && (
        <div className="slot-body">
          <p className="etitle">{entry.title}</p>
          <p className="muted small">{mmss(entry.duration_sec)} · {mo(entry.size_bytes)}</p>
          <audio controls preload="none" src={`${base}/${entry.audio_key}`} />
        </div>
      )}
      {!entry && locked && <p className="muted">Aucun opening envoyé.</p>}
      {showForm && (
        <div className="slot-form">
          <input type="text" value={title} maxLength={80} onChange={e => setTitle(e.target.value)} placeholder="Titre (ex. Anime – nom de l'opening)" />
          <input type="file" accept="audio/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <p className="muted small">MP3, M4A, AAC ou OGG, 2:30 et 3,5 Mo maximum.</p>
          <div className="acts"><button type="button" onClick={send} disabled={busy}>{busy ? 'Envoi…' : entry ? 'Remplacer' : 'Envoyer'}</button>{editing && <button type="button" className="ghost" onClick={() => setEditing(false)} disabled={busy}>Annuler</button>}</div>
        </div>
      )}
      {entry && !locked && !editing && (
        <div className="acts">
          <button type="button" className="ghost" onClick={() => { setTitle(entry.title); setEditing(true); }} disabled={busy}>Remplacer</button>
          <button type="button" className="danger" onClick={() => (confirmDel ? act({ action: 'delete', position: pos }) : setConfirmDel(true))} disabled={busy}>{confirmDel ? 'Confirmer' : 'Supprimer'}</button>
        </div>
      )}
      {err && <p className="err" role="alert">{err}</p>}
    </div>
  );
}
export default function OpeningsManager() {
  const [d, setD] = useState<D | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try { const r = await fetch('/api/openings', { cache: 'no-store' }); if (!r.ok) throw new Error(); setD(await r.json()); setErr(''); }
    catch { setErr('Impossible de charger tes openings.'); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (err) return <p className="err" role="alert">{err}</p>;
  if (!d) return <p className="muted">Chargement…</p>;
  if (!d.tournament) return <p className="muted">Aucun tournoi n'est ouvert aux envois pour l'instant.</p>;
  const locked = d.tournament.status !== 'upload';
  return (
    <div className="openings">
      <p className="muted">{d.tournament.name} · {locked ? "Les openings sont verrouillés, le tournoi a commencé." : "Envoie jusqu'à 3 openings et choisis l'ordre dans lequel ils passent."}</p>
      {[1, 2, 3].map(p => <Slot key={`${p}-${d.entries.find(e => e.position === p)?.id ?? 'vide'}`} pos={p} entry={d.entries.find(e => e.position === p)} base={d.publicBase} locked={locked} onChange={load} />)}
    </div>
  );
}
