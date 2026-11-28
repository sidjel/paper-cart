---
trigger: always_on
description: "Règles propres au dossier src/core/ : logique pure du jeu (pas de DOM/window, pas fixe sans setTimeout, hasard à graine, tests unitaires obligatoires)."
---

# src/core/ — règles propres à ce dossier

Logique pure du jeu (vue d'ensemble : `docs/ARCHITECTURE.md`).
- Pas de page web : ni `document`, ni `window`, ni élément, ni CSS. Testable sous Node.
- Pas de `setTimeout` ni de `setInterval` : les délais avancent avec le temps de jeu (pas fixe), figés en pause.
- Pas de hasard sans graine : pas de `Math.random` ; un générateur à graine sera ajouté ici le jour où le jeu tirera au hasard.
- Tests obligatoires : chaque fichier a ses tests dans `tests/unit/`, même pour une petite règle.
- Les données du jeu viennent des JSON de `src/data/` et des réglages de `src/config.js` (passés en paramètre).
