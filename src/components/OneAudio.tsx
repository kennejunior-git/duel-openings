'use client';
import { useEffect } from 'react';
// Un seul audio à la fois : quand l'un démarre, tous les autres se mettent en pause.
export default function OneAudio() {
  useEffect(() => {
    const onPlay = (e: Event) => { document.querySelectorAll('audio').forEach(a => { if (a !== e.target) a.pause(); }); };
    document.addEventListener('play', onPlay, true);
    return () => document.removeEventListener('play', onPlay, true);
  }, []);
  return null;
}
