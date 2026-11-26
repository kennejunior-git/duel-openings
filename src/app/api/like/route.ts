import { rpc } from '@/lib/db';
import { getSession } from '@/lib/session';
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: 'Session expirée.' }, { status: 401 });
  if (s.role === 'admin') return Response.json({ error: 'Les administrateurs sont en consultation uniquement.' }, { status: 403 });
  let body: { entry_id?: string };
  try { body = await req.json(); } catch { return Response.json({ error: 'Requête invalide.' }, { status: 400 }); }
  if (typeof body.entry_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.entry_id)) {
    return Response.json({ error: 'Opening invalide.' }, { status: 400 });
  }
  try {
    return Response.json(await rpc('app_toggle_like', { p_code_id: s.id, p_entry_id: body.entry_id }));
  } catch {
    return Response.json({ error: "Impossible d'aimer cet opening." }, { status: 400 });
  }
}
