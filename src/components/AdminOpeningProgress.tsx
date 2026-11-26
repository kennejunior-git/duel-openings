'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import './admin.css';
type Participant = { pseudo: string; openings_count: number; opening_1: boolean; opening_2: boolean; opening_3: boolean };
type Data = { tournament: string | null; participants: Participant[]; jury_total: number; jury_voted: number };
export default function AdminOpeningProgress() {
  const [data, setData] = useState<Data | null>(null);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/admin/opening-progress', { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Chargement impossible.');
      setData(d);
    } catch (e) { setError(e instanceof Error ? e.message : 'Connexion impossible.'); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const shown = useMemo(() => (data?.participants || []).filter(p => filter === 'all' || (filter === 'none' ? p.openings_count === 0 : filter === 'one' ? p.openings_count === 1 : filter === 'two' ? p.openings_count === 2 : p.openings_count === 3)), [data, filter]);
  const totals = useMemo(() => [0,1,2,3].map(n => (data?.participants || []).filter(p => p.openings_count === n).length), [data]);
  return <section className="adm">
    <h2>Suivi des openings par participant</h2>
    {data?.tournament && <p className="muted">Tournoi : <b>{data.tournament}</b></p>}
    {!data?.tournament && data && <p className="muted">Aucun tournoi en préparation ou en cours.</p>}
    {data && <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(105px,1fr))',gap:8,marginBottom:14}}>
      <div style={{border:'1px solid var(--line,#333)',borderRadius:10,padding:10}}><div className="muted" style={{fontSize:12}}>Jury ayant voté</div><b style={{fontSize:24}}>{data.jury_voted}/{data.jury_total}</b><div className="muted" style={{fontSize:11}}>Membres distincts</div></div>
      {['Aucun','1 opening','2 openings','3 openings'].map((label,n)=><div key={label} style={{border:'1px solid var(--line,#333)',borderRadius:10,padding:10}}><div className="muted" style={{fontSize:12}}>{label}</div><b style={{fontSize:24}}>{totals[n]}</b></div>)}
    </div>}
    <div className="seg small" role="group" aria-label="Filtrer les participants">
      {[['all','Tous'],['none','0'],['one','1'],['two','2'],['three','3']].map(([v,label])=><button type="button" key={v} className={filter===v?'on':''} aria-pressed={filter===v} onClick={()=>setFilter(v)}>{label}</button>)}
    </div>
    {error && <p className="msg" role="alert">{error}</p>}
    {data && <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
        <thead><tr><th style={{textAlign:'left',padding:'9px 6px'}}>Participant</th><th style={{padding:6}}>Nombre</th><th style={{padding:6}}>OP 1</th><th style={{padding:6}}>OP 2</th><th style={{padding:6}}>OP 3</th></tr></thead>
        <tbody>{shown.map(p=><tr key={p.pseudo} style={{borderTop:'1px solid var(--line,#333)'}}>
          <td style={{padding:'10px 6px',fontWeight:600}}>{p.pseudo}</td>
          <td style={{padding:6,textAlign:'center',fontWeight:700}}>{p.openings_count}/3</td>
          {[p.opening_1,p.opening_2,p.opening_3].map((ok,i)=><td key={i} style={{padding:6,textAlign:'center'}}><span aria-label={ok?'Envoyé':'Manquant'}>{ok?'✓':'—'}</span></td>)}
        </tr>)}</tbody>
      </table>
      {shown.length===0 && <p className="muted">Aucun participant dans cette catégorie.</p>}
    </div>}
    <button type="button" className="ghost" onClick={load} disabled={busy}>{busy?'Actualisation…':'Actualiser la liste'}</button>
  </section>;
}
