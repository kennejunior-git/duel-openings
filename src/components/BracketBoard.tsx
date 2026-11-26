'use client';
import './bracket.css';
import { useCallback, useEffect, useState } from 'react';

type Slot = { entry_id: string; mine: boolean; votes: number | null; pub?: number | null; jury?: number | null; score?: number | null; won: boolean | null; picked: boolean; pseudo: string | null; title: string | null } | null;
type VoteDetail = { pseudo: string | null; role: string; entry_id: string };
type M = { n: number; id: string; state: 'open' | 'closing' | 'bye' | 'closed'; decided_by: string | null; slot_1: Slot; slot_2: Slot; vote_details?: VoteDetail[] | null; tiebreak_details?: VoteDetail[] | null };
type R = { round: number; matches: M[] };
type P = { pseudo: string; title: string };
type D = { tournament: { name: string; status: string; jury_enabled?: boolean } | null; champion?: P | null; finalist?: P | null; rounds?: R[] };

const HOW: Record<string, string> = { votes: 'Décision aux votes', jury: 'Départagé par le jury', pondere: 'Score public + jury', tirage: 'Décision par tirage au sort' };

function Row({ s, letter, total, jury }: { s: NonNullable<Slot>; letter: 'A' | 'B'; total: number; jury: boolean }) {
  const weighted = jury && s.score != null;
  const pct = weighted ? (s.score as number) : total > 0 && s.votes !== null ? Math.round((s.votes / total) * 100) : 0;
  return (
    <div className={`result-row ${letter === 'A' ? 'result-a' : 'result-b'}${s.won ? ' is-winner' : ''}${s.won === false ? ' is-loser' : ''}`}>
      <div className="result-heading">
        <div className="result-name">
          <span className="result-letter">{letter}</span>
          <div><b>{s.pseudo || `Opening ${letter}`}</b>{s.title && <span className="result-title">{s.title}</span>}{s.mine && <span className="you-tag">Ton opening</span>}</div>
        </div>
        {s.votes !== null && <div className="result-score">{weighted ? `${s.score}%` : `${s.votes} vote${s.votes > 1 ? 's' : ''}`}</div>}
      </div>
      {s.votes !== null && <div className="result-track"><i style={{ width: `${pct}%` }} /></div>}
      <div className="result-foot">
        {s.won ? <span className="winner-label">✓ Qualifié</span> : s.won === false ? <span className="muted">Éliminé</span> : <span className="muted">{s.picked ? 'Ton choix' : 'Résultat en attente'}</span>}
        {weighted && <span className="vote-detail">Public {s.pub ?? 0} · Jury {s.jury ?? 0}</span>}
        {!weighted && s.picked && <span className="vote-detail">Tu as voté ici</span>}
      </div>
    </div>
  );
}

function Match({ m, jury }: { m: M; jury: boolean }) {
  const total = (m.slot_1?.votes ?? 0) + (m.slot_2?.votes ?? 0);
  const chip = m.state === 'open' ? ['En vote', 'live'] : m.state === 'closing' ? ['Clôture', 'live'] : m.state === 'bye' ? ['Qualifié d’office', 'bye'] : ['Terminé', 'done'];
  const method = m.decided_by ? HOW[m.decided_by] ?? 'Résultat enregistré' : '';
  return (
    <article className="bracket-match">
      <header className="bracket-match-head"><b>Combat {m.n}</b><span className={`match-state ${chip[1]}`}>{chip[0]}</span></header>
      <div className="match-results">
        {m.slot_1 && <Row s={m.slot_1} letter="A" total={total} jury={jury} />}
        {m.slot_2 && <Row s={m.slot_2} letter="B" total={total} jury={jury} />}
      </div>
      {method && <p className="decision-method">{method}</p>}
      {m.state === 'closed' && <details className="match-vote-details">
        <summary>Voir les votes et les votants</summary>
        <div className="vote-details-content">
          <b>Votes du combat ({(m.vote_details ?? []).length})</b>
          {(m.vote_details ?? []).length === 0 ? <p className="muted">Aucun vote enregistré.</p> :
            <ul>{(m.vote_details ?? []).map((v, i) => <li key={i}><b>{v.pseudo || 'Pseudo indisponible'}</b> <span>({v.role === 'jury' ? 'Jury' : v.role === 'voter' ? 'Votant' : v.role === 'participant' ? 'Participant' : v.role})</span> — {v.entry_id === m.slot_1?.entry_id ? 'Opening A' : 'Opening B'}</li>)}</ul>}
          {(m.tiebreak_details ?? []).length > 0 && <>
            <b>Départage du jury</b>
            <ul>{(m.tiebreak_details ?? []).map((v, i) => <li key={i}><b>{v.pseudo || 'Pseudo indisponible'}</b> — {v.entry_id === m.slot_1?.entry_id ? 'Opening A' : 'Opening B'}</li>)}</ul>
          </>}
        </div>
      </details>}
    </article>
  );
}

export default function BracketBoard() {
  const [d, setD] = useState<D | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/bracket', { cache: 'no-store' });
      if (!r.ok) throw new Error();
      setD(await r.json()); setErr('');
    } catch { setErr('Impossible de charger le tableau.'); }
  }, []);
  useEffect(() => { load(); const timer = setInterval(load, 20000); return () => clearInterval(timer); }, [load]);
  if (!d) return <p className={err ? 'err' : 'muted'}>{err || 'Chargement…'}</p>;
  if (!d.tournament) return <div className="empty-bracket"><b>Aucun tournoi disponible</b><p className="muted">Le tableau apparaîtra dès que le premier combat sera lancé.</p></div>;

  const done = d.tournament.status === 'done';
  const rounds = d.rounds ?? [];
  const matches = rounds.flatMap(r => r.matches);
  const completed = matches.filter(m => m.state === 'closed' || m.state === 'bye').length;
  const live = matches.filter(m => m.state === 'open' || m.state === 'closing').length;

  return (
    <div className="bracket">
      <section className="bracket-overview">
        <div className="overview-top"><span className="eyebrow">SUIVI DU TOURNOI</span><span className={`tournament-state ${done ? 'finished' : 'running'}`}>{done ? 'Terminé' : 'En cours'}</span></div>
        <h2>{d.tournament.name}</h2>
        <div className="overview-stats">
          <div><b>{rounds.length}</b><span>Tours</span></div>
          <div><b>{completed}</b><span>Combats terminés</span></div>
          <div><b>{live}</b><span>En cours</span></div>
        </div>
        {live > 0 && <p className="overview-note">Les résultats des combats en cours seront affichés dès leur clôture.</p>}
        {d.tournament.jury_enabled && <span className="jury-pill">Jury activé · 50 % du score</span>}
      </section>

      {err && <p className="err" role="alert">{err}</p>}

      {done && d.champion && (
        <section className="champion-card">
          <span className="champion-crown">🏆</span><span className="eyebrow">CHAMPION DU TOURNOI</span>
          <h2>{d.champion.pseudo}</h2><p>{d.champion.title}</p>
          {d.finalist && <div className="finalist-line">Finaliste : <b>{d.finalist.pseudo}</b> · {d.finalist.title}</div>}
        </section>
      )}
      {!done && <p className="privacy-note">Pour préserver l’anonymat des gagnants, le pseudo du participant éliminé est révélé après chaque combat terminé. Le pseudo du qualifié reste masqué jusqu’à la fin du tournoi.</p>}
      {rounds.length === 0 && <div className="empty-bracket"><b>Pas encore de combat</b><p className="muted">L’administrateur lancera le premier tour depuis son profil.</p></div>}
      {rounds.map(r => {
        const roundDone = r.matches.every(m => m.state === 'closed' || m.state === 'bye');
        return (
          <section className="round-section" key={r.round}>
            <header className="round-heading"><div><span className="eyebrow">PHASE {r.round}</span><h2>Tour {r.round}</h2></div><span className={`round-count ${roundDone ? 'complete' : ''}`}>{r.matches.length} combat{r.matches.length > 1 ? 's' : ''} · {roundDone ? 'Terminé' : 'En cours'}</span></header>
            <div className="round-matches">{r.matches.map(m => <Match key={m.id} m={m} jury={!!d.tournament?.jury_enabled} />)}</div>
          </section>
        );
      })}
    </div>
  );
}
