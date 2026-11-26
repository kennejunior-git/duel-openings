// Accès à la base via l'API HTTPS de Supabase (fonctions "rpc"), sans pooler ni mot de passe de base.
const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_KEY!;
export async function rpc<T = any>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify(args), cache: 'no-store' });
  const t = await r.text();
  if (!r.ok) throw new Error(`RPC ${fn} : ${r.status} ${t}`);
  return (t ? JSON.parse(t) : null) as T;
}
