---
name: audit
description: Relecteur à froid de Paper Cart, lancé par l'auteur à la fin d'une étape importante (pas avant chaque push). Lance un agent en lecture seule, sans le contexte de la séance, qui relit les changements depuis un commit donné et rend une liste courte de problèmes.
---

# Audit : le relecteur à froid (demande de l'auteur, séance 53)

Quand l'auteur demande un audit (`/audit`, éventuellement suivi d'un commit de départ) :

1. Choisir le point de départ : le commit donné par l'auteur, sinon la dernière étape validée du tableau de `docs/JOURNAL.md`.
2. Lancer **un seul** agent avec l'outil Agent, `subagent_type: "Explore"` (lecture seule : il ne peut rien modifier), **sans lui résumer la séance** : il doit lire le code et les documents lui-même. Lui donner ce texte, en remplaçant `<commit>` :

   > Tu relis à froid le jeu Paper Cart (dépôt courant), en lecture seule. Lis `CLAUDE.md` (dont l'index « Où sont les règles »), les `CLAUDE.md` des dossiers touchés (`src/*/CLAUDE.md`) et `docs/ARCHITECTURE.md` (§1, puis ce qui concerne les fichiers changés). Liste les fichiers changés depuis `<commit>` (`git diff --stat <commit>..HEAD`) et relis ces changements (`git diff <commit>..HEAD -- <fichier>`), ainsi que le code qu'ils appellent. Cherche seulement :
   > 1. des objets, tableaux, fonctions ou chaînes **recréés à chaque image** dans la boucle (`frame`, `render`, `update…`, `step…`) alors qu'ils pourraient être créés une fois ; des éléments créés pendant le jeu ; des mesures de la page (`getBoundingClientRect`, `offsetWidth`) à chaque image ; **une lecture de la page faite après une modification dans la même image** (règle « lire avant d'écrire », `src/scene/CLAUDE.md`) ;
   > 2. des **règles de `CLAUDE.md`** (et des `CLAUDE.md` de dossier) non respectées : logique de jeu hors de `src/core/`, valeur réglable absente de `src/config.js`, contenu hors des JSON, texte provisoire sans `[TEMP]`, `setTimeout` ou hasard dans `src/core/`, CSS animé autrement qu'en `transform` et `opacity`, filtre ou flou ;
   > 3. des **écarts entre les documents et le code** (`docs/ARCHITECTURE.md`, `docs/SUIVI.md`, documents de conception) pour ce qui a changé.
   > Pour chaque point : fichier et ligne, le problème en une phrase, pourquoi il compte (joueur, fluidité ou suite), la correction proposée, l'effort (petit, moyen, gros). Classe par priorité. Au plus 15 points. Ne propose rien d'autre (pas de réécriture, pas de style). Si tu ne trouves rien dans une catégorie, dis-le.

3. Rendre à l'auteur le rapport de l'agent, **tel quel mais traduit en mots simples** (pas de jargon non expliqué), avec une recommandation des 3 points à corriger en premier.
4. **Ne rien corriger** : l'auteur choisit ce qu'il valide, une chose à la fois. Noter les points retenus dans la section « Ouvert » de `docs/SUIVI.md`.
