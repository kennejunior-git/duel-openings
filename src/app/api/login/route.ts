import { rpc } from '@/lib/db';
import { setSession } from '@/lib/session';
export async function POST(req: Request) {
  try {
    const { code, pseudo } = await req.json();
    const d = await rpc<any>('app_login', { p_code: String(code || ''), p_pseudo: pseudo ? String(pseudo) : null });
    if (d.ok) { await setSession({ id: d.id, role: d.role, pseudo: d.pseudo }); return Response.json({ ok: true }); }
    if (d.needPseudo) return Response.json({ needPseudo: true });
    return Response.json({ error: d.error || 'Erreur.' }, { status: String(d.error).includes('pseudo') ? 409 : 401 });
  } catch (e) { console.error(e); return Response.json({ error: 'Erreur du serveur, réessaie.' }, { status: 500 }); }
}
