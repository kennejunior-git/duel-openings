import { rpc } from '@/lib/db';
import { getSession } from '@/lib/session';
const base = process.env.SUPABASE_URL!;
async function me() { const s = await getSession(); return s?.role === 'participant' ? s.id : null; }
const no = () => Response.json({ error: 'Accès refusé.' }, { status: 403 });
const fail = (m = 'Action refusée (envoi fermé ou données invalides).') => Response.json({ error: m }, { status: 400 });
export async function GET() {
  const id = await me(); if (!id) return no();
  const d = await rpc<any>('app_my_entries', { p_code_id: id });
  return Response.json({ ...d, publicBase: `${base}/storage/v1/object/public/openings` });
}
export async function POST(req: Request) {
  const id = await me(); if (!id) return no();
  const b = await req.json();
  try {
    if (b.action === 'prepare') {
      const path = await rpc<string>('app_prepare_upload', { p_code_id: id, p_ext: String(b.ext) });
      return Response.json({ path, uploadUrl: `${base}/storage/v1/object/openings/${path}`, key: process.env.SUPABASE_ANON_JWT });
    }
    if (b.action === 'save') {
      await rpc('app_save_entry', { p_code_id: id, p_position: Number(b.position), p_title: String(b.title || ''), p_path: String(b.path), p_duration: Math.round(Number(b.duration)) });
      return Response.json({ ok: true });
    }
    if (b.action === 'swap') { await rpc('app_swap_entries', { p_code_id: id, p_a: Number(b.a), p_b: Number(b.b) }); return Response.json({ ok: true }); }
    if (b.action === 'delete') { await rpc('app_delete_entry', { p_code_id: id, p_position: Number(b.position) }); return Response.json({ ok: true }); }
  } catch { return fail(); }
  return fail('Action inconnue.');
}
