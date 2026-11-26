# Duel Openings

Plateforme communautaire de tournois d'openings d'anime.

## Stack prévue
- Next.js 15 (App Router) et TypeScript
- Supabase pour l'authentification par codes, les données et les règles d'accès
- Vercel pour l'hébergement
- Cloudflare R2 prévu pour le stockage des fichiers audio

## Fonctionnement
- Chaque participant soumet trois openings audio.
- Les tournois organisent les duels par ordre d'opening : numéro 1, puis numéro 2, puis numéro 3.
- Les votes sont anonymes et modifiables jusqu'à la clôture du duel.
- Les identités restent masquées jusqu'à la fin du tournoi.
- Un jury peut être activé avec une pondération public/jury de 50/50.

## Configuration
Les secrets et clés d'accès doivent être configurés dans les variables d'environnement de l'hébergement. Ne jamais les committer dans ce dépôt.

## État du dépôt
Ce dépôt démarre avec cette documentation. Le code applicatif existant doit être récupéré ou reconstruit avant de déployer une nouvelle version.
