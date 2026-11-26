import './globals.css';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import { getSession } from '@/lib/session';
import BottomNav from '@/components/BottomNav';
import OneAudio from '@/components/OneAudio';
const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--f-display' });
const body = Figtree({ subsets: ['latin'], variable: '--f-body' });
export const metadata = { title: "Duel d'openings" };
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' as const };
export default async function Root({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body><OneAudio /><main className={s ? 'with-nav' : ''}>{children}</main>{s && <BottomNav role={s.role} />}</body>
    </html>
  );
}
