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
  try {
    await rpc('app_save_tournament', { p_admin_id: id, p_id: b.id || null, p_name: String(b.name || ''), p_starts_at: b.starts_at, p_jury: !!b.jury_enabled, p_status: b.status });
    return Response.json({ ok: true });
  } catch { return Response.json({ error: 'Nom, date ou statut invalide.' }, { status: 400 }); }
}
export async function DELETE(req: Request) {
  const id = await adminId(); if (!id) return no();
  const { id: tid } = await req.json();
  await rpc('app_delete_tournament', { p_admin_id: id, p_id: tid });
  return Response.json({ ok: true });
}
