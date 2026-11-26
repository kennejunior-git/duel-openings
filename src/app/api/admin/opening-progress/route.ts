import { rpc } from '@/lib/db';
import { getSession } from '@/lib/session';
export const dynamic = 'force-dynamic';
export async function GET() {
  const s = await getSession();
  if (s?.role !== 'admin') return Response.json({}, { status: 403 });
  try { return Response.json(await rpc('app_admin_opening_progress', { p_admin_id: s.id })); }
  catch { return Response.json({ error: 'Impossible de charger le suivi des openings.' }, { status: 500 }); }
}
