'use client';
import { useState } from 'react';
export default function Login() {
  const [code, setCode] = useState(''); const [pseudo, setPseudo] = useState('');
  const [needPseudo, setNeed] = useState(false); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await fetch('/api/login', { method: 'POST', body: JSON.stringify({ code, pseudo }) });
      const d = await r.json();
      if (d.ok) location.href = '/'; else if (d.needPseudo) setNeed(true); else setErr(d.error || 'Erreur.');
    } catch { setErr('Connexion impossible, réessaie.'); } finally { setBusy(false); }
  }
  return (
    <section className="page login">
      <h1>Duel d'openings</h1>
      <p className="muted">Entre le code que l'administrateur t'a envoyé. C'est le même à chaque connexion.</p>
      <form onSubmit={go}>
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="ABCD-EFGH" autoCapitalize="characters" autoComplete="off" disabled={needPseudo} />
        {needPseudo && <input value={pseudo} onChange={e => setPseudo(e.target.value)} placeholder="Choisis ton pseudo" maxLength={24} autoFocus />}
        {err && <p className="err" role="alert">{err}</p>}
        <button disabled={busy || !code}>{needPseudo ? 'Créer mon accès' : 'Entrer'}</button>
      </form>
    </section>
  );
}
