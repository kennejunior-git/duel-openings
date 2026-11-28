import { rpc } from '@/lib/db';
import { getSession } from '@/lib/session';

async function adminId() {
  const s = await getSession();
  return s?.role === 'admin' ? s.id : null;
}

export async function GET() {
  const id = await adminId();
  if (!id) return Response.json({}, { status: 403 });
  return Response.json(await rpc('app_admin_codes', { p_admin_id: id }));
}

export async function POST(req: Request) {
  const id = await adminId();
  if (!id) return Response.json({}, { status: 403 });
  const { role, count, adminCode } = await req.json();
  const allowed = ['admin', 'participant', 'voter', 'jury'];
  const amount = Number(count);

  if (!allowed.includes(role)) {
    return Response.json({ error: 'Rôle invalide. Choisis Admin, Participant, Votant ou Jury.' }, { status: 400 });
  }
  if (!Number.isInteger(amount) || amount < 1 || amount > 60) {
    return Response.json({ error: 'Le nombre de codes doit être compris entre 1 et 60.' }, { status: 400 });
  }

  if (role === 'admin') {
    if (typeof adminCode !== 'string' || !adminCode.trim()) {
      return Response.json({ error: 'Saisis à nouveau ton code Admin pour confirmer cette génération.' }, { status: 400 });
    }
    const check = await rpc<{ ok: boolean; id?: string; role?: string }>('app_login', {
      p_code: adminCode.trim(),
      p_pseudo: null
    });
    if (!check.ok || check.role !== 'admin' || check.id !== id) {
      return Response.json({ error: 'Le code saisi ne correspond pas à ta session administrateur.' }, { status: 403 });
    }
  }

  try {
    return Response.json({ codes: await rpc<string[]>('app_gen_codes', { p_admin_id: id, p_role: role, p_count: amount }) });
  } catch (e) {
    console.error('Génération des codes impossible:', e);
    const message = e instanceof Error ? e.message : '';
    if (message.includes('Admin requis')) {
      return Response.json({ error: 'Session administrateur non reconnue. Reconnecte-toi avec un code Admin actif.' }, { status: 403 });
    }
    return Response.json({ error: 'La base de données a refusé la génération. Consulte les journaux administrateur pour le détail.' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const id = await adminId();
  if (!id) return Response.json({}, { status: 403 });
  const { id: codeId, active } = await req.json();
  await rpc('app_toggle_code', { p_admin_id: id, p_id: codeId, p_active: !!active });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const id = await adminId();
  if (!id) return Response.json({}, { status: 403 });
  const { id: codeId } = await req.json();
  try {
    await rpc('app_delete_code', { p_admin_id: id, p_id: codeId });
    return Response.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (message.includes('Seuls les codes jamais utilisés')) {
      return Response.json({ error: 'Ce code a déjà été utilisé. Désactive-le plutôt que de le supprimer pour conserver l’historique.' }, { status: 409 });
    }
    console.error('Suppression du code impossible:', e);
    return Response.json({ error: 'Impossible de supprimer ce code.' }, { status: 400 });
  }
}
