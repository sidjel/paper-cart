# Outils de préparation des images (`tools/`)

Outils centralisés et versionnés dans le dépôt (règle de `CLAUDE.md` : un seul outil par tâche, pas un script par image).

- `video_to_sprites.ps1` : extrait les images natives d’une vidéo d’animation via FFmpeg, sélectionne le cycle demandé (ex. 16 images) et vérifie automatiquement qu’il n’existe **aucun doublon** (calcul de différence MAD entre images consécutives et bouclage).

> **Sources lourdes (`.kra` Krita, vidéos brutes)** : conservées hors Git dans `_assets_stock/` (exclu par `.gitignore`). Pensez à sauvegarder `_assets_stock/` sur un cloud ou un disque externe.
