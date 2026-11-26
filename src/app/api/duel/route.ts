import { rpc } from '@/lib/db';
import { getSession } from '@/lib/session';
const base = process.env.SUPABASE_URL!;
export async function GET() {
  const s = await getSession(); if (!s) return Response.json({}, { status: 401 });
  const d = await rpc<any>('app_duel', { p_code_id: s.id });
  return Response.json({ ...d, publicBase: `${base}/storage/v1/object/public/openings` });
}
export async function POST(req: Request) {
  const s = await getSession(); if (!s) return Response.json({}, { status: 401 });
  const b = await req.json();
  try {
    await rpc('app_vote', { p_code_id: s.id, p_match_id: String(b.match_id), p_entry_id: String(b.entry_id) });
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "Vote refusé : le combat est fermé ou ton opening y participe." }, { status: 400 }); }
}
