import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AdminCodes from '@/components/AdminCodes';
import AdminStats from '@/components/AdminStats';
import AdminTournaments from '@/components/AdminTournaments';
import AdminRounds from '@/components/AdminRounds';
import AdminOpeningProgress from '@/components/AdminOpeningProgress';
import LogoutButton from '@/components/LogoutButton';
export const dynamic = 'force-dynamic';
const LABEL: Record<string, string> = { admin: 'Administrateur', participant: 'Participant', voter: 'Votant', jury: 'Jury' };
export default async function Profil() {
  const s = await getSession();
  if (!s) redirect('/login');
  return (
    <section className="page">
      <h1>{s.pseudo}</h1>
      <p className="muted">{LABEL[s.role]}</p>
      <LogoutButton />
      {s.role === 'admin' && <><AdminStats /><AdminTournaments /><AdminRounds /><AdminOpeningProgress /><AdminCodes /></>}
    </section>
  );
}
