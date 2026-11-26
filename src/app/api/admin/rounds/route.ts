import { rpc } from '@/lib/db';
import { getSession } from '@/lib/session';
async function adminId() { const s = await getSession(); return s?.role === 'admin' ? s.id : null; }
export async function GET() {
  const id = await adminId(); if (!id) return Response.json({}, { status: 403 });
  return Response.json(await rpc('app_admin_round_info', { p_admin_id: id }));
}
export async function POST(req: Request) {
  const id = await adminId(); if (!id) return Response.json({}, { status: 403 });
  const b = await req.json();
  try {
    if (b.action === 'start') return Response.json({ ok: true, ...(await rpc<any>('app_admin_start_round', { p_admin_id: id, p_minutes: Number(b.minutes) || 15 })) });
    if (b.action === 'close') return Response.json({ ok: true, ...(await rpc<any>('app_admin_close_round', { p_admin_id: id })) });
    if (b.action === 'reset') return Response.json({ ok: true, ...(await rpc<any>('app_admin_reset_rounds', { p_admin_id: id })) });
  } catch { return Response.json({ error: "Impossible : vérifie que le tournoi est « En cours », qu'il y a au moins 2 participants avec un opening, et que le tour précédent est clôturé." }, { status: 400 }); }
  return Response.json({ error: 'Action inconnue.' }, { status: 400 });
}
