'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, Music, Trophy, User } from 'lucide-react';
const ALL = [
  { href: '/', label: 'Accueil', Icon: Home },
  { href: '/duel', label: 'Duel', Icon: Swords },
  { href: '/openings', label: 'Openings', Icon: Music, only: ['participant'] },
  { href: '/tableau', label: 'Tableau', Icon: Trophy },
  { href: '/profil', label: 'Profil', Icon: User },
];
export default function BottomNav({ role }: { role: string }) {
  const path = usePathname();
  const tabs = ALL.filter(t => !t.only || t.only.includes(role));
  return (
    <nav className="nav" style={{ gridTemplateColumns: `repeat(${tabs.length},1fr)` }}>
      {tabs.map(({ href, label, Icon }) => {
        const on = href === '/' ? path === '/' : path.startsWith(href);
        return <Link key={href} href={href} className={on ? 'tab on' : 'tab'} aria-current={on ? 'page' : undefined}><Icon size={22} strokeWidth={on ? 2.4 : 1.8} /><span>{label}</span></Link>;
      })}
    </nav>
  );
}
