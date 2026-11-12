# Paper Cart: The Final Checkout

Un RPG de cartes en papier dans un supermarché sans fin, dont on cherche à sortir en atteignant la caisse finale. Le personnage scanne les produits des rayons pour en faire des cartes qui pourrissent avec le temps et changent de rôle.

Le jeu est en phase de **prototypes jouables** (voir `docs/VISION.md` et `docs/JOURNAL.md`).

## Jouer

- **En ligne** : https://sidjel.github.io/paper-cart/ (publié automatiquement à chaque push sur `main`, si les tests passent).
- Le numéro de version (commit et date) est affiché en bas à droite de l'écran.

## Lancer sur son ordinateur

Il faut [Node.js](https://nodejs.org/) 22 ou plus récent.

```bash
npm install          # une seule fois
npm run dev          # serveur de développement, rechargement instantané
```

La console affiche deux adresses :
- `Local` : à ouvrir sur le PC ;
- `Network` : à ouvrir sur le téléphone connecté au **même Wi-Fi**.

## Autres commandes

```bash
npm test             # tests de la logique de jeu (Vitest)
npm run test:e2e     # tests dans un vrai navigateur (Playwright)
npm run build        # construit le jeu dans dist/
npm run preview      # sert la version construite
```

## Organisation

| Dossier | Rôle |
|---|---|
| `src/core/` | Logique de jeu pure (sans affichage), testée |
| `src/scene/` | Décor, zone de marche, personnage, projection à l'écran |
| `src/ui/` | Interface : réglages, diagnostic, menus |
| `src/input/` | Clavier, souris, manette, tactile → actions |
| `src/data/` | Contenu en JSON (lieux, personnages…) |
| `src/config.js` | Toutes les valeurs réglables |
| `public/art/` | Images du jeu |
| `docs/` | Vision, journal des séances |

## Licence

Tous droits réservés (voir `LICENSE`).
