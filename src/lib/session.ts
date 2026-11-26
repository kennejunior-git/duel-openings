import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { rpc } from './db';
export type Session = { id: string; role: 'admin' | 'participant' | 'voter' | 'jury'; pseudo: string };
const sign = (p: string) => createHmac('sha256', process.env.SESSION_SECRET!).update(p).digest('base64url');
export async function setSession(s: Session) {
  const p = Buffer.from(JSON.stringify(s)).toString('base64url');
  (await cookies()).set('sid', `${p}.${sign(p)}`, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 90 });
}
export async function getSession(): Promise<Session | null> {
  const v = (await cookies()).get('sid')?.value;
  const [p, m] = v?.split('.') ?? [];
  if (!p || !m) return null;
  const a = Buffer.from(sign(p)), b = Buffer.from(m);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const s: Session = JSON.parse(Buffer.from(p, 'base64url').toString());
    return (await rpc<boolean>('app_session_ok', { p_id: s.id })) ? s : null;
  } catch { return null; }
}
