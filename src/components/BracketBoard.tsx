'use client';
import './bracket.css';
import { useCallback, useEffect, useState } from 'react';
type Slot = { entry_id: string; mine: boolean; votes: number | null; pub?: number | null; jury?: number | null; score?: number | null; won: boolean | null; picked: boolean; pseudo: string | null; title: string | null } | null;
type M = { n: number; id: string; state: 'open' | 'closing' | 'bye' | 'closed'; decided_by: string | null; slot_1: Slot; slot_2: Slot };
type R = { round: number; matches: M[] };
type P = { pseudo: string; title: string };
type D = { tournament: { name: string; status: string; jury_enabled?: boolean } | null; champion?: P | null; finalist?: P | null; rounds?: R[] };
const HOW: Record<string, string> = { votes: 'Aux votes', jury: 'Départagé par le jury', pondere: 'Aux votes (jury 50 %)', tirage: 'Tirage au sort' };
function Row({ s, letter, total, jury }: { s: NonNullable<Slot>; letter: 'A' | 'B'; total: number; jury: boolean }) {
  const weighted = jury && s.score != null;
  const pct = weighted ? (s.score as number) : total > 0 && s.votes !== null ? Math.round((s.votes / total) * 100) : 0;
  return (
    <div className={`row-s ${letter === 'A' ? 'a' : 'b'}${s.won ? ' won' : ''}${s.won === false ? ' lost' : ''}`}>
      <div className="row-top">
        <span>{s.pseudo ? <><b>{s.pseudo}</b><span className="muted small"> · {s.title}</span></> : <b>Opening {letter}</b>}{s.mine && <em className="you"> · toi</em>}</span>
        {s.votes !== null && <span className="cnt">{weighted ? <>{s.score} %<span className="sub">Public {s.pub} · Jury {s.jury}</span></> : <>{s.votes} vote{s.votes > 1 ? 's' : ''}</>}{s.picked ? ' · ton vote ✓' : ''}</span>}
      </div>
      {s.votes !== null && <div className="bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>}
      {s.won && <span className="win">Gagnant</span>}
    </div>
  );
}
function Match({ m, jury }: { m: M; jury: boolean }) {
  const total = (m.slot_1?.votes ?? 0) + (m.slot_2?.votes ?? 0);
  const chip = m.state === 'open' ? ['Vote en cours', 'live'] : m.state === 'closing' ? ['Clôture en cours…', 'live'] : m.state === 'bye' ? ['Qualifié sans adversaire', ''] : [m.decided_by ? HOW[m.decided_by] ?? 'Terminé' : 'Terminé', ''];
  return (
    <div className="mcard">
      <div className="mhead"><b>Combat {m.n}</b><span className={`chip2 ${chip[1]}`}>{chip[0]}</span></div>
      {m.slot_1 && <Row s={m.slot_1} letter="A" total={total} jury={jury} />}
      {m.slot_2 && <Row s={m.slot_2} letter="B" total={total} jury={jury} />}
    </div>
  );
}
export default function BracketBoard() {
  const [d, setD] = useState<D | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try { const r = await fetch('/api/bracket', { cache: 'no-store' }); if (!r.ok) throw new Error(); setD(await r.json()); setErr(''); }
    catch { setErr('Impossible de charger le tableau.'); }
  }, []);
  useEffect(() => { load(); const i = setInterval(load, 20000); return () => clearInterval(i); }, [load]);
  if (!d) return <p className={err ? 'err' : 'muted'}>{err || 'Chargement…'}</p>;
  if (!d.tournament) return <p className="muted">Aucun tournoi en cours ni terminé pour l'instant.</p>;
  const done = d.tournament.status === 'done';
  const rounds = d.rounds ?? [];
  return (
    <div className="bracket">
      <p className="muted">{d.tournament.name} · {done ? 'Terminé' : 'En cours'}</p>
      {err && <p className="err" role="alert">{err}</p>}
      {done && d.champion && (
        <div className="podium">
          <p className="k">Champion</p>
          <p className="big">{d.champion.pseudo}</p>
          <p className="muted">{d.champion.title}</p>
          {d.finalist && <p className="muted small">Finaliste : {d.finalist.pseudo} · {d.finalist.title}</p>}
        </div>
      )}
      {!done && <p className="note">Les pseudos et les titres seront révélés à la fin du tournoi.</p>}
      {rounds.length === 0 && <p className="muted">Aucun combat pour l'instant.</p>}
      {rounds.map(r => (
        <section className="round" key={r.round}>
          <h2>Tour {r.round}</h2>
          {r.matches.map(m => <Match key={m.id} m={m} jury={!!d.tournament?.jury_enabled} />)}
        </section>
      ))}
    </div>
  );
}
