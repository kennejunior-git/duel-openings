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
  const allowed = ['participant', 'voter', 'jury'];
  const amount = Number(count);
  if (!allowed.includes(role)) {
    return Response.json({ error: 'Rôle non autorisé. Tu peux générer des codes Participant, Votant ou Jury. Les codes Admin sont protégés.' }, { status: 400 });
  }
  if (!Number.isInteger(amount) || amount < 1 || amount > 60) {
    return Response.json({ error: 'Le nombre de codes doit être compris entre 1 et 60.' }, { status: 400 });
  }
  try {
    return Response.json({ codes: await rpc<string[]>('app_gen_codes', { p_admin_id: id, p_role: role, p_count: amount }) });
  } catch (e) {
    console.error('Génération des codes impossible:', e);
    return Response.json({ error: 'La génération a échoué. Vérifie les droits administrateur et réessaie.' }, { status: 400 });
  }
}
export async function PATCH(req: Request) {
  const id = await adminId(); if (!id) return Response.json({}, { status: 403 });
  const { id: codeId, active } = await req.json();
  await rpc('app_toggle_code', { p_admin_id: id, p_id: codeId, p_active: !!active });
  return Response.json({ ok: true });
}
