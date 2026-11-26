import { redirect } from 'next/navigation';
import { rpc } from '@/lib/db';
import { getSession } from '@/lib/session';
import Countdown from '@/components/Countdown';
export const dynamic = 'force-dynamic';
const STATUS: Record<string, string> = { upload: 'Envoi des openings ouvert', live: 'Tournoi en cours' };
export default async function Home() {
  const s = await getSession();
  if (!s) redirect('/login');
  const t = await rpc<{ name: string; starts_at: string; status: string; jury_enabled: boolean } | null>('app_home');
  return (
    <section className="page">
      <p className="hello">Salut {s.pseudo}</p>
      {t ? (<>
        <h1>{t.name}</h1>
        <p className="hello">{STATUS[t.status] ?? t.status}{t.jury_enabled ? ' · Jury activé' : ''}</p>
        <p className="muted">Début le {new Date(t.starts_at).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</p>
        <Countdown to={new Date(t.starts_at).toISOString()} />
      </>) : (<>
        <h1>Pas de tournoi pour l'instant</h1>
        <p className="muted">L'administrateur annoncera le prochain ici.</p>
      </>)}
    </section>
  );
}
