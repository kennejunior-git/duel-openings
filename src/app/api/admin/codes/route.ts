import { rpc } from '@/lib/db';
import { getSession } from '@/lib/session';
async function adminId() { const s = await getSession(); return s?.role === 'admin' ? s.id : null; }
export async function GET() {
  const id = await adminId(); if (!id) return Response.json({}, { status: 403 });
  return Response.json(await rpc('app_admin_codes', { p_admin_id: id }));
}
export async function POST(req: Request) {
  const id = await adminId(); if (!id) return Response.json({}, { status: 403 });
  const { role, count } = await req.json();
  try { return Response.json({ codes: await rpc<string[]>('app_gen_codes', { p_admin_id: id, p_role: role, p_count: Number(count) || 1 }) }); }
  catch { return Response.json({ error: 'Rôle invalide' }, { status: 400 }); }
}
export async function PATCH(req: Request) {
  const id = await adminId(); if (!id) return Response.json({}, { status: 403 });
  const { id: codeId, active } = await req.json();
  await rpc('app_toggle_code', { p_admin_id: id, p_id: codeId, p_active: !!active });
  return Response.json({ ok: true });
}
