import { rpc } from '@/lib/db';
import { getSession } from '@/lib/session';
async function adminId() { const s = await getSession(); return s?.role === 'admin' ? s.id : null; }
const no = () => Response.json({}, { status: 403 });
export async function GET() {
  const id = await adminId(); if (!id) return no();
  return Response.json(await rpc('app_admin_tournaments', { p_admin_id: id }));
}
export async function POST(req: Request) {
  const id = await adminId(); if (!id) return no();
  const b = await req.json();
  const prizes = [b.prize_first, b.prize_second, b.prize_third].map(Number);
  if (prizes.some(n => !Number.isSafeInteger(n) || n < 0 || n > 1000000000)) {
    return Response.json({ error: 'Les récompenses doivent être des montants entiers positifs.' }, { status: 400 });
  }
  try {
    const tid = await rpc<string>('app_save_tournament', { p_admin_id: id, p_id: b.id || null, p_name: String(b.name || ''), p_starts_at: b.starts_at, p_jury: !!b.jury_enabled, p_status: b.status });
    await rpc('app_save_tournament_prizes', { p_admin_id: id, p_id: tid, p_first: prizes[0], p_second: prizes[1], p_third: prizes[2] });
    return Response.json({ ok: true });
  } catch (e) {
    console.error('Enregistrement du tournoi impossible:', e);
    return Response.json({ error: 'Impossible d’enregistrer le tournoi ou ses récompenses.' }, { status: 400 });
  }
}
export async function DELETE(req: Request) {
  const id = await adminId(); if (!id) return no();
  const { id: tid } = await req.json();
  try {
    await rpc('app_delete_tournament', { p_admin_id: id, p_id: tid });
    return Response.json({ ok: true });
  } catch { return Response.json({ error: 'Ce tournoi existe peut-être déjà supprimé.' }, { status: 404 }); }
}
