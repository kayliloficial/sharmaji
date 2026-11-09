# Sharmaji · carte interactive

Site statique (GitHub Pages : https://kayliloficial.github.io/sharmaji/) pour le restaurant Sharmaji, 16 rue Frémicourt, Paris 15e.

| Page | Rôle |
|---|---|
| `index.html` | Carte : filtres (viande / mer / végétarien, allergènes), lexique, assistant |
| `plat.html?d=Nom du plat` | Fiche d'un plat : photo, vue éclatée, 3D |
| `simulation.html` | Simulation client avec Raj, serveur virtuel (voix) |
| `caisse.html` | Simulateur de caisse (mode serveur, non indexé) |
| `voice worker.js` | Cloudflare Worker qui relaie la voix ElevenLabs (clé côté serveur) |
| `404.html`, `favicon.svg`, `sitemap.xml`, `og-image.jpg` | Page d’erreur, icône, plan du site, image de partage |

## Langue
La langue choisie (FR/EN) est mémorisée (`localStorage`, clé `sj-lang`) et partagée entre la carte, les fiches plats et la simulation. On peut aussi forcer la langue avec `?lang=en` dans l'adresse (pratique pour un QR code en anglais).

## Après mise en ligne
1. Google Search Console : ajouter le site et soumettre `sitemap.xml`.
2. Tester `index.html` dans le Rich Results Test de Google (données structurées `Restaurant` + `Menu`).
3. Si l'adresse du site change, remplacer `https://kayliloficial.github.io/sharmaji/` dans les balises `canonical`/`og:url` et dans `sitemap.xml`.

## Contenu de la page d'accueil
Badges (ouvert/fermé en direct, Guide MICHELIN, Time Out), carte filtrable, « Le chef » (régions cliquables), « L'expérience incontournable », infos pratiques (horaires, accès, services), FAQ, réservation TheFork.
Les plats de `index.html` sont une **avant-première** : aucun prix n'est affiché. Les horaires viennent des fiches publiques du restaurant : à mettre à jour dans la constante `HR` du script si besoin.
