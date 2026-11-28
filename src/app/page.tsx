import { redirect } from 'next/navigation';
import { rpc } from '@/lib/db';
import { getSession } from '@/lib/session';
import Countdown from '@/components/Countdown';
export const dynamic = 'force-dynamic';
const STATUS: Record<string, string> = { upload: 'Inscriptions et envois ouverts', live: 'Tournoi en cours' };
const money = (n: number) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
export default async function Home() {
  const s = await getSession();
  if (!s) redirect('/login');
  const t = await rpc<{ name: string; starts_at: string; status: string; jury_enabled: boolean; prize_first: number; prize_second: number; prize_third: number } | null>('app_home');
  const hasPrizes = !!t && (t.prize_first > 0 || t.prize_second > 0 || t.prize_third > 0);
  return (
    <section className="page">
      <p className="hello">Salut {s.pseudo}</p>
      {t ? (<>
        <h1>{t.name}</h1>
        <p className="hello">{STATUS[t.status] ?? t.status}{t.jury_enabled ? ' · Jury activé' : ''}</p>
        <p className="muted">Début le {new Date(t.starts_at).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</p>
        <Countdown to={new Date(t.starts_at).toISOString()} status={t.status as 'upload' | 'live'} />
        {hasPrizes && (
          <section className="public-prizes" aria-label="Récompenses du tournoi">
            <div className="public-prizes-head"><span>🏆</span><div><h2>À gagner pour ce tournoi</h2><p>Les récompenses prévues par l’organisation</p></div></div>
            <div className="public-prize-grid">
              {t.prize_first > 0 && <div className="public-prize first"><span>🥇 1ère place</span><strong>{money(t.prize_first)}</strong></div>}
              {t.prize_second > 0 && <div className="public-prize second"><span>🥈 2ème place</span><strong>{money(t.prize_second)}</strong></div>}
              {t.prize_third > 0 && <div className="public-prize third"><span>🥉 3ème place</span><strong>{money(t.prize_third)}</strong></div>}
            </div>
          </section>
        )}
      </>) : (<>
        <h1>Pas de tournoi pour l'instant</h1>
        <p className="muted">L'administrateur annoncera le prochain ici.</p>
      </>)}
    </section>
  );
}
