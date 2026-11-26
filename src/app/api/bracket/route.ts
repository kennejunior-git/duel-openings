import { rpc } from '@/lib/db';
import { getSession } from '@/lib/session';
export async function GET() {
  const s = await getSession(); if (!s) return Response.json({}, { status: 401 });
  return Response.json(await rpc('app_bracket', { p_code_id: s.id }));
}
