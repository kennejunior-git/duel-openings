'use client';
import './duel.css';
import { useCallback, useEffect, useState } from 'react';
type S = { entry_id: string; audio_key: string; duration_sec: number; mine: boolean; liked?: boolean; likes?: number | null };
type M = { id: string; round: number; n: number; closes_at: string; open: boolean; can_jury_vote?: boolean; can_jury_tiebreak?: boolean; my_tiebreak?: string | null; slot_1: S; slot_2: S; my_vote: string | null };
type D = { tournament: { name: string } | null; role?: string; matches: M[]; publicBase: string };
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
function Left({ to }: { to: string }) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => { const t = () => setMs(new Date(to).getTime() - Date.now()); t(); const i = setInterval(t, 1000); return () => clearInterval(i); }, [to]);
  if (ms === null) return null;
  if (ms <= 0) return <span className="vote-ended">Vote terminé</span>;
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = s % 60;
  return <span>Fin dans {h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min ${String(sec).padStart(2, '0')} s`}</span>;
}
function Side({ s, letter, base, picked, pending, dim, canVote, canLike, busy, onChoose, onLike }: {
  s: S; letter: 'A' | 'B'; base: string; picked: boolean; pending: boolean; dim: boolean;
  canVote: boolean; canLike: boolean; busy: boolean; onChoose: () => void; onLike: () => void;
}) {
  return (
    <article className={`side ${letter === 'A' ? 'a' : 'b'}${picked ? ' picked' : ''}${pending ? ' pending' : ''}${dim ? ' dim' : ''}`}>
      <div className="side-head"><div><span className="side-kicker">OPENING {letter}</span><b>{letter === 'A' ? 'Choix A' : 'Choix B'}</b></div><span className="audio-duration">{mmss(s.duration_sec)}</span></div>
      <audio controls preload="metadata" src={`${base}/${s.audio_key}`} aria-label={`Écouter l'opening ${letter}`} />
      <div className="side-actions">
        {s.mine ? <span className="note">Ton opening</span> : <button type="button" className="choose-button" onClick={onChoose} disabled={!canVote || busy} aria-pressed={pending}>{pending ? 'Sélectionné ✓' : picked ? 'Ton vote actuel' : `Choisir ${letter}`}</button>}
        {!s.mine && <button type="button" className={`like-button${s.liked ? ' liked' : ''}`} onClick={onLike} disabled={busy || !canLike} aria-pressed={!!s.liked} aria-label={s.liked ? 'Retirer le like' : 'Aimer cet opening'}>♥ <span>{s.likes == null ? (s.liked ? 'Aimé' : 'J’aime') : s.likes}</span></button>}
      </div>
    </article>
  );
}
export default function DuelBoard({ canVote = true }: { canVote?: boolean }) {
  const [d, setD] = useState<D | null>(null);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ matchId: string; entryId: string } | null>(null);
  const load = useCallback(async () => {
    try { const r = await fetch('/api/duel', { cache: 'no-store' }); if (!r.ok) throw new Error(); setD(await r.json()); setErr(''); }
    catch { setErr('Impossible de charger les combats.'); }
  }, []);
  useEffect(() => { load(); const timer = setInterval(load, 12000); return () => clearInterval(timer); }, [load]);

  async function post(url: string, body: object, success: string) {
    setBusy(true); setErr(''); setNotice('');
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Action refusée.');
      setNotice(success); await load(); return true;
    } catch (e) { setErr(e instanceof Error ? e.message : 'Connexion impossible.'); return false; }
    finally { setBusy(false); }
  }
  async function confirmVote(m: M) {
    if (!pending || pending.matchId !== m.id) return;
    const ok = await post('/api/duel', { match_id: m.id, entry_id: pending.entryId }, 'Ton vote a bien été enregistré.');
    if (ok) setPending(null);
  }
  async function juryTiebreak(m: M, entry: string) {
    const ok = await post('/api/duel', { action: 'jury_tiebreak', match_id: m.id, entry_id: entry }, 'Ton choix pour le départage du jury est enregistré.');
    if (ok) setPending(null);
  }
  async function like(entry: string) { await post('/api/like', { entry_id: entry }, 'Like mis à jour.'); }

  if (!d) return <p className={err ? 'err' : 'muted'}>{err || 'Chargement…'}</p>;
  if (!d.tournament) return <div className="duel-empty"><span>⚔️</span><b>Aucun tournoi en cours</b><p>Les combats apparaîtront ici dès le lancement du tournoi.</p></div>;
  if (d.matches.length === 0) return <div className="duel-empty"><span>🎧</span><b>{d.tournament.name}</b><p>Aucun combat pour le moment. L'administrateur lancera le prochain tour.</p></div>;
  return (
    <div className="board">
      <header className="duel-overview"><span className="eyebrow">ARÈNE MUSICALE</span><h2>{d.tournament.name}</h2><p>Tour {d.matches[0].round} · {d.matches.length} combat{d.matches.length > 1 ? 's' : ''}</p></header>
      {err && <p className="err" role="alert">{err}</p>}
      {notice && <p className="duel-notice" role="status">{notice}</p>}
      {d.matches.map(m => {
        const mine = m.slot_1.mine || m.slot_2.mine;
        const votingOpen = canVote && !mine && ((m.open && Date.parse(m.closes_at) > Date.now()) || (d.role === 'jury' && !!m.can_jury_vote));
        const selected = pending?.matchId === m.id ? pending.entryId : null;
        const sides: ['A' | 'B', S][] = [['A', m.slot_1], ['B', m.slot_2]];
        return (
          <section className="match" key={m.id}>
            <div className="m-head"><div><span className="eyebrow">DUEL {String(m.n).padStart(2, '0')}</span><b>Combat {m.n}</b></div><span className={m.open ? 'timer-active' : 'timer-closed'}><Left to={m.closes_at} /></span></div>
            {mine && <p className="note">Ton opening participe à ce combat : tu ne peux pas voter contre toi-même.</p>}
            {d.role === 'jury' && m.can_jury_vote && !m.open && <p className="note">Le délai est dépassé, mais ton vote du jury reste attendu. Tu peux encore voter tant que l’administrateur n’a pas clôturé ce combat.</p>}
            {!canVote && <p className="note">Mode administrateur : consultation uniquement, aucun vote ni like.</p>}
            <div className="sides">
              {sides.map(([L, s]) => (
                <Side key={L} s={s} letter={L} base={d.publicBase} picked={m.my_vote === s.entry_id} pending={selected === s.entry_id} dim={!!selected && selected !== s.entry_id} canVote={votingOpen} canLike={canVote} busy={busy} onChoose={() => setPending({ matchId: m.id, entryId: s.entry_id })} onLike={() => like(s.entry_id)} />
              ))}
            </div>
            {votingOpen && selected && (
              <div className="vote-confirm">
                <p>Tu as sélectionné <b>{selected === m.slot_1.entry_id ? 'Opening A' : 'Opening B'}</b>.</p>
                <button type="button" disabled={busy} onClick={() => confirmVote(m)}>{busy ? 'Enregistrement…' : 'Confirmer mon vote'}</button>
                <button type="button" className="ghost" disabled={busy} onClick={() => setPending(null)}>Annuler</button>
              </div>
            )}
            {m.my_vote && votingOpen && !selected && <p className="note vote-saved">✓ Ton vote est enregistré. Tu peux encore choisir l'autre opening avant la fin du temps.</p>}
            {m.can_jury_tiebreak && (
              <div className="jury-tiebreak">
                <div><span className="eyebrow">DÉPARTAGE DU JURY</span><p className="note">Le score est à égalité. Choisis le gagnant pour départager ce combat.</p></div>
                <div className="sides">
                  <button type="button" className={m.my_tiebreak === m.slot_1.entry_id ? 'on' : ''} disabled={busy} aria-pressed={m.my_tiebreak === m.slot_1.entry_id} onClick={() => juryTiebreak(m, m.slot_1.entry_id)}>{m.my_tiebreak === m.slot_1.entry_id ? 'Ton choix A ✓' : 'Choisir A'}</button>
                  <button type="button" className={m.my_tiebreak === m.slot_2.entry_id ? 'on' : ''} disabled={busy} aria-pressed={m.my_tiebreak === m.slot_2.entry_id} onClick={() => juryTiebreak(m, m.slot_2.entry_id)}>{m.my_tiebreak === m.slot_2.entry_id ? 'Ton choix B ✓' : 'Choisir B'}</button>
                </div>
                <p className="note">Tu peux modifier ton choix tant que le combat n'est pas clôturé.</p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
