import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import BracketBoard from '@/components/BracketBoard';
import Leaderboard from '@/components/Leaderboard';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const s = await getSession();
  if (!s) redirect('/login');
  return <section className="page"><h1>Tableau</h1><BracketBoard /><Leaderboard /></section>;
}
