import { rpc } from '@/lib/db';
import { getSession } from '@/lib/session';
export async function POST(req: Request) {
  const s = await getSession(); if (!s) return Response.json({}, { status: 401 });
  const b = await req.json();
  try { return Response.json(await rpc('app_toggle_like', { p_code_id: s.id, p_entry_id: String(b.entry_id) })); }
  catch { return Response.json({ error: "Impossible d'aimer cet opening." }, { status: 400 }); }
}