---
name: valider
description: À utiliser quand l'auteur valide une étape de Paper Cart (A1, A2…) - l'inscrire avec son commit dans docs/JOURNAL.md (tableau « Étapes validées ») et docs/PROTOTYPES.md (tableau d'état).
---

# Valider une étape (texte déplacé mot pour mot depuis CLAUDE.md, « Git », séance 51)

- Quand l'auteur valide une étape, l'inscrire dans `docs/JOURNAL.md` avec l'identifiant du commit (par exemple « A1 validée : abc1234 »). Ce sont les points de retour sûrs : « reviens à la version A1 validée » doit suffire. Pas de tag (les tags sont bloqués dans cet environnement).

Où l'écrire (ajout, séance 51) :
- `docs/JOURNAL.md`, tableau « Étapes validées » : une ligne `| Étape — question du prototype | \`commit\` (« A… validée : commit ») — précisions | date |`.
- `docs/PROTOTYPES.md`, tableau « État et décisions » : `✅ validée : \`commit\``.
- `docs/SUIVI.md` : la ligne de l'étape passe en ✅ (puis dans `docs/SUIVI-archive.md`).
- Choisir comme commit la dernière version qui contient l'étape complète, sans travail à moitié fait de l'étape suivante.
