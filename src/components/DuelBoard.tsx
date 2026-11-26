'use client';
import './duel.css';
import { useCallback, useEffect, useState } from 'react';
type S = { entry_id: string; audio_key: string; duration_sec: number; mine: boolean };
type M = { id: string; round: number; n: number; closes_at: string; open: boolean; can_jury_tiebreak?: boolean; my_tiebreak?: string | null; slot_1: S; slot_2: S; my_vote: string | null };
type D = { tournament: { name: string } | null; matches: M[]; publicBase: string };
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
function Left({ to }: { to: string }) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => { const t = () => setMs(new Date(to).getTime() - Date.now()); t(); const i = setInterval(t, 1000); return () => clearInterval(i); }, [to]);
  if (ms === null) return null;
  if (ms <= 0) return <span>Vote terminé</span>;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = s % 60;
  return <span>Fin du vote dans {h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min ${String(sec).padStart(2, '0')} s`}</span>;
}
function Side({ s, letter, base, picked, dim, canVote, busy, onVote }: { s: S; letter: 'A' | 'B'; base: string; picked: boolean; dim: boolean; canVote: boolean; busy: boolean; onVote: () => void }) {
  return (
    <div className={`side ${letter === 'A' ? 'a' : 'b'}${picked ? ' picked' : ''}${dim ? ' dim' : ''}`}>
      <div className="side-head"><b>Opening {letter}</b><span className="muted small">{mmss(s.duration_sec)}</span></div>
      <audio controls preload="metadata" src={`${base}/${s.audio_key}`} />
      {s.mine
        ? <p className="note">C'est ton opening.</p>
        : <button type="button" onClick={onVote} disabled={!canVote || busy} aria-pressed={picked}>{picked ? 'Ton vote ✓' : `Voter pour ${letter}`}</button>}
    </div>
  );
}
export default function DuelBoard({ canVote = true }: { canVote?: boolean }) {
  const [d, setD] = useState<D | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { const r = await fetch('/api/duel', { cache: 'no-store' }); if (!r.ok) throw new Error(); setD(await r.json()); }
    catch { setErr('Impossible de charger les combats.'); }
  }, []);
  useEffect(() => { load(); const timer = setInterval(load, 10000); return () => clearInterval(timer); }, [load]);
  async function juryTiebreak(m: M, entry: string) {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/duel', { method: 'POST', body: JSON.stringify({ action: 'jury_tiebreak', match_id: m.id, entry_id: entry }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setErr(j.error || 'Vote du jury refusé.');
      await load();
    } catch { setErr('Connexion impossible.'); } finally { setBusy(false); }
  }
  async function vote(m: M, entry: string) {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/duel', { method: 'POST', body: JSON.stringify({ match_id: m.id, entry_id: entry }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setErr(j.error || 'Erreur.');
      await load();
    } catch { setErr('Connexion impossible.'); } finally { setBusy(false); }
  }
  if (!d) return <p className={err ? 'err' : 'muted'}>{err || 'Chargement…'}</p>;
  if (!d.tournament) return <p className="muted">Aucun tournoi en cours pour l'instant.</p>;
  if (d.matches.length === 0) return <p className="muted">{d.tournament.name} · Aucun combat pour l'instant. L'administrateur lance le prochain tour.</p>;
  return (
    <div className="board">
      <p className="muted">{d.tournament.name} · Tour {d.matches[0].round}</p>
      {err && <p className="err" role="alert">{err}</p>}
      {d.matches.map(m => {
        const mine = m.slot_1.mine || m.slot_2.mine;
        const votingOpen = canVote && m.open && Date.parse(m.closes_at) > Date.now() && !mine;
        const sides: ['A' | 'B', S][] = [['A', m.slot_1], ['B', m.slot_2]];
        return (
          <div className="match" key={m.id}>
            <div className="m-head"><b>Combat {m.n}</b><span><Left to={m.closes_at} /></span></div>
            {mine && <p className="note">Ton opening est dans ce combat : tu ne votes pas ici.</p>}{!canVote && <p className="note">Les administrateurs observent les combats, mais ne participent pas aux votes.</p>}
            <div className="sides">
              {sides.map(([L, s]) => (
                <Side key={L} s={s} letter={L} base={d.publicBase} picked={m.my_vote === s.entry_id} dim={!!m.my_vote && m.my_vote !== s.entry_id} canVote={votingOpen} busy={busy} onVote={() => vote(m, s.entry_id)} />
              ))}
            </div>
            {m.can_jury_tiebreak && (
              <div className="jury-tiebreak">
                <p className="note">Égalité : le jury doit départager ce combat.</p>
                <div className="sides">
                  <button type="button" disabled={busy} aria-pressed={m.my_tiebreak === m.slot_1.entry_id} onClick={() => juryTiebreak(m, m.slot_1.entry_id)}>{m.my_tiebreak === m.slot_1.entry_id ? 'Ton choix du jury ✓' : 'Le jury choisit A'}</button>
                  <button type="button" disabled={busy} aria-pressed={m.my_tiebreak === m.slot_2.entry_id} onClick={() => juryTiebreak(m, m.slot_2.entry_id)}>{m.my_tiebreak === m.slot_2.entry_id ? 'Ton choix du jury ✓' : 'Le jury choisit B'}</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
