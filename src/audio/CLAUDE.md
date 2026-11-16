# src/audio/ — règles propres à ce dossier

Le son du jeu (vue d'ensemble : `docs/ARCHITECTURE.md` §12). Règles décidées par l'auteur (séance 64),
écrites ici seulement. À appliquer au chantier « son » (séance B) ; l'état réel est noté dans `docs/SUIVI.md`.

- **Un seul contexte audio** pour tout le jeu, démarré ou repris dans un geste du joueur (toucher, clic, touche).
- Le jeu **surveille l'état du son** : s'il est suspendu ou interrompu (appel, autre application, écran éteint), il le reprend au **prochain geste** du joueur, et le diagnostic le note.
- **Aucun nœud audio ne s'accumule** : chaque son joué libère ce qu'il a créé quand il se termine (`onended` → `disconnect`).
- Les sons **courts et répétitifs** (pas, bips, froissements) sont **préparés une fois au démarrage** avec un `OfflineAudioContext`, à la fréquence d'échantillonnage du contexte audio. En jeu, jouer un tel son = **une seule source** (`AudioBufferSourceNode`) branchée sur un bus permanent : aucun filtre ni oscillateur créé à la volée. (Cela ne bloque pas les futurs effets ponctuels complexes : combat, attaque ultime.)
- Un **compteur interne de nœuds actifs** (+1 à la création, −1 au nettoyage après `disconnect`), car le navigateur ne permet pas de les compter. Le nettoyage de chaque source est **idempotent** (garde `cleanedUp` : le compteur ne baisse qu'une fois, même après `stop()` puis `onended`). Affiché dans le diagnostic, vérifié par les tests : il revient à zéro quand plus rien ne joue.
- La musique est programmée **en avance** sur l'horloge audio (`currentTime` + marge), jamais au rythme des images : une image lente ne la fait pas trébucher.
- **Nombre maximum de sons simultanés par catégorie et priorité** : les sons de faible priorité (pas, froissements) ne coupent jamais les sons prioritaires (narrateur, combat, attaque ultime, interface). Si une catégorie est saturée, son son le plus ancien s'arrête.
