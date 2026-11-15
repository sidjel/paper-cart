---
name: mesures
description: À utiliser pour toute question de fluidité de Paper Cart - diagnostic DBG, banc d'essai, test rapide, test des comptages et limites, traçage Android ; avant de proposer un correctif de performance.
---

# Mesures (texte déplacé mot pour mot depuis CLAUDE.md, « Fluidité », séance 51)

Les objectifs et les règles générales restent dans `CLAUDE.md` (« Fluidité »). Le détail des outils :

- Le **diagnostic intégré** (touche F3 ou bouton « DBG ») affiche images/s, pire image, temps de calcul, mémoire, et propose un bouton « Copier le rapport » : un **résumé court** (quelques milliers de caractères au plus), facile à coller dans la conversation.
- **Banc d'essai** (Options → Diagnostic) : le personnage parcourt tout seul chaque lieu, toujours de la même façon (même trajet, même vitesse, même caméra, mêmes actions, graine fixe). Il commence par une courte chauffe et répète le parcours plusieurs fois. À la fin, le résumé s'affiche, prêt à copier : images/s moyennes, **95e percentile** des temps d'image, **nombre d'images au-delà de 33 ms**, et temps de calcul JavaScript séparé du temps d'image total. Une moyenne seule ne prouve jamais que le jeu est fluide. Des **interrupteurs d'essai** prévus d'avance permettent de rejouer le même parcours avec ou sans une option (effet, calque, résolution…). Deux rapports se comparent alors vraiment : seule la version du jeu change.
- **Test automatique des comptages** (Playwright), avec une limite par lieu, qui échoue si une modification la dépasse. On compte ce qui ne dépend pas de la machine : éléments affichés et calques, images visibles et chargées (et leur surface en mémoire), surface d'image affichée (pixels qui se recouvrent pour rien), éléments et canevas créés pendant le jeu, lectures de pixels, objets du décor qui changent de calque (liste exacte : docs/ARCHITECTURE.md §6). Les objets JavaScript créés à chaque image ne sont pas comptés : on les évite à la relecture du code.
- Pour une saccade sans cause visible après banc d'essai et comptages : traçage système d'Android (Options pour les développeurs → Traçage système, fichier envoyé à Claude) ou débogage à distance de Chrome par USB depuis le PC. Seulement dans ce cas.
