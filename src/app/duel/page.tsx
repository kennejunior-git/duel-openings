import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import DuelBoard from '@/components/DuelBoard';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const s = await getSession();
  if (!s) redirect('/login');
  return <section className="page"><h1>Duel</h1><DuelBoard /></section>;
}
