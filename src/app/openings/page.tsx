import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import OpeningsManager from '@/components/OpeningsManager';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const s = await getSession();
  if (!s) redirect('/login');
  if (s.role !== 'participant') redirect('/profil');
  return <section className="page"><h1>Mes openings</h1><OpeningsManager /></section>;
}
