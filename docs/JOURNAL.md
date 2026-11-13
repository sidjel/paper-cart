# Journal des séances

Le rapport le plus récent est en haut. Les étapes validées par l'auteur y sont inscrites avec leur commit (points de retour sûrs).

## Étapes validées

| Étape | Commit | Date |
|---|---|---|
| A1 — le personnage est agréable à déplacer | `1445d25` (« A1 validée : 1445d25 ») | 12/11/2026 |
| A2 — le personnage semble évoluer dans un décor profond | `6be7130` (« A2 validée : 6be7130 ») — rayon de devant gardé entier, fluidité acceptée en l'état (choix C de l'auteur) | 13/11/2026 |

---

## Séance 26 — 13/11/2026 — Étape A3 : le scanner, les cartes et le Panier

**Décisions de l'auteur** : rayon de devant gardé entier (« on verra plus tard ») ; fluidité acceptée en l'état et passage à A3 (choix C). **A2 validée : 6be7130.**

**Jouable maintenant**
- **10 produits** sur l'étagère du fond, le long du rayon : banane, lait, céréales, baguette, steak, pile, glace, bière, plante, fromage (dessins provisoires).
- Au pied de l'étagère, le **produit le plus proche est mis en évidence** par un repère en papier qui flotte au-dessus. Un bouton « Scanner » apparaît.
- **Scanner** (Entrée, Espace, bouton A de la manette, ou bouton « Scanner » au doigt) : le personnage s'arrête et se tourne vers l'étagère, lève sa douchette (nouvelle pose, face et dos). Puis viennent le **laser** et le ***bip***, la **dissolution du produit en confettis** aspirés par la douchette (avec un son d'aspiration), et une **carte** qui apparaît avec un petit rebond, reste un instant, puis **file dans le Panier**. Le compteur du Panier sautille.
- **Panier** (bouton en bas à gauche, touche I, bouton Y de la manette) : les cartes, avec nom, puissance, stade et propriétés. Le stade se lit à la **couleur et à la forme** de son icône : Frais = cercle vert, Mûr = triangle doré, Pourri = carré brun. Fermer : Échap, bouton B ou « Fermer ».
- Pendant un scan, le personnage ne bouge pas. La pause fige tout le scan (délais liés à la boucle de jeu, sans minuterie).
- Un produit scanné quitte l'étagère.

**Vérifié, et comment**
- 79 tests de logique, dont : produit à portée, déroulé du scan (bip → aspiration → carte → fin), scan figé sans temps qui passe, cartes et Panier, chaque produit du rayon scannable depuis le sol, Panier dans la machine à états.
- 39 tests navigateur, sans erreur console : scan au clavier (repère, bouton, immobilité, carte dans le Panier, produit retiré, Panier ouvert et fermé) ; scan au doigt en téléphone simulé ; pause qui fige un scan.
- Captures PC et téléphone simulé regardées (repère, laser et confettis, carte, Panier).
- **Test des comptages** : 72 éléments (contre 39), 5 calques déclarés (le nouveau « produits »), 17 images visibles (contre 10), 29 images chargées (contre 17). Surface affichée presque inchangée (1,87 contre 1,85) ; rien n'est créé pendant le jeu. **Limites relevées en conséquence (80, 5, 20, 32) : à valider par l'auteur.**
- **Non vérifiable ici** : les sons (pas de haut-parleur), la manette, la fluidité sur le téléphone.

**Décisions prises seul (détails mineurs)**
- Les noms provisoires sont préfixés [TEMP] dans les données, mais affichés sans le préfixe sur les cartes.
- Stades de départ : la plupart des produits donnent une carte Fraîche, la banane et le fromage une carte Mûre (pour voir les deux icônes). Le vieillissement des cartes viendra avec le combat (prototype B).
- Le personnage se met de dos pour scanner (l'étagère est au fond).
- Les produits sont limités en hauteur par l'écart entre deux tablettes : ils sont un peu petits. Les dessins de l'auteur les rendront plus lisibles.

**Proposition pour la séance suivante** : après tes retours, étape A4 : le narrateur (bande « haut-parleur », effet machine à écrire, une dizaine de répliques [TEMP]), des finitions et une vérification de la fluidité avec le test rapide.

---

## Séance 25 — 13/11/2026 — Campagne « rayon de devant » n° 2 : bilan de l'optimisation DOM

**Conditions** : 00fd429 ; batterie 57 → 55 %, débranché, plein écran, mode normal, écran maintenu allumé ; indice de vitesse 4,1 → 4,3 ms. Le téléphone est donc « en bon état » selon la règle de la séance 24.

**Mesuré** — images > 20 ms par minute (blocs min–max) / > 33 / > 50 / calcul pire :
- T0 98,0 (87–110) / 7 / 0 / 13,8 ms ;
- G4 68,8 (57–83) / 3 / 1 / 14,8 ms ;
- G3 128,9 (103–157) / 15 / 0 / 14,5 ms.

**Démontré**
- Moitié haute du rayon de devant : ×0,70 (0,58–0,86), reproduit (×0,68 en séance 23).
- Rayon de devant qui glisse à la vitesse du sol : **×1,31 (1,11–1,56), dégradation**. Mon hypothèse « il coûte parce qu'il glisse plus vite » est réfutée.
- **Objectifs non atteints sur un téléphone en bon état**, ni en T0 ni en G4.

**Bilan des campagnes DOM (séances 14 à 25)**
- Leviers démontrés et reproduits : rayon de devant (entier ×0,35 s'il est retiré, ×0,70 en moitié haute ; le coût suit sa surface). Les calques ajoutés coûtent (×1,41).
- Sans effet : réduire la boîte du calque, l'opacité.
- Contre-intuitif, plusieurs fois : réduire les animations (×1,20), faire glisser le rayon à la vitesse du sol (×1,31), réduire la surface des rayons lointains avec des fenêtres. Retirer du travail peut dégrader : cause inconnue (gestion d'énergie du téléphone ? façon dont le navigateur organise ses calques ?).
- Pics de calcul de 12 à 18 ms dans toutes les variantes : ils ne viennent pas de l'affichage.
- L'indice de vitesse (calcul pur) est resté autour de 4,1–4,3 ms aussi bien dans un état « 85 images lentes/min » que dans celui-ci (98) : il ne suffit pas, seul, à repérer l'état du téléphone qui compte pour l'affichage.

**Conclusion** : avec la technique actuelle (DOM/CSS), les leviers qui restent touchent à l'aspect du rayon de devant, et aucun ne suffit à atteindre l'objectif. C'est le moment prévu par le cahier des charges pour proposer un essai comparatif PixiJS, chiffres à l'appui. Décisions demandées à l'auteur.

---

## Séance 24 — 13/11/2026 — Campagne « rayon de devant » n° 2 (G4, G3)

**Décisions de l'auteur** : chemin A (campagne courte, puis aspect et validation de A2) ; l'objectif « aucune image > 33 ms » est gardé, mais jugé sur un téléphone en bon état (batterie > 50 %, indice de vitesse comparable). Règle ajoutée à CLAUDE.md.

**G5 abandonnée avant mesure** : l'idée était de faire envoyer l'image du rayon de devant telle quelle à la carte graphique, au lieu de la redessiner par morceaux. Le navigateur de test montre que ça ne marche pas (redessin par morceaux ≈ 14/s, contre ≈ 15/s en T0). La mesurer n'aurait rien appris. Une vraie « définition réduite » demanderait une autre technique de dessin pour ce rayon.

**Campagne n° 2** (⚙ → Diagnostic, premier bouton) : T0, G4 (moitié haute, pour confirmer), G3 (rayon entier, glisse à la vitesse du sol) ; caméra mobile ; 8 tours ; 144 s par variante ; ≈ 8 min 30. Comparaisons G4/T0, G3/T0. Variantes appliquées seulement pendant la mesure ; code des variantes G1, G2 et « image » retiré.

**Vérifié** : 70 tests de logique, 36 tests navigateur (chaque variante appliquée puis jeu rétabli ; en G3 le rayon de devant ne se décale plus par rapport au sol). Comptages du jeu inchangés.

---

## Séance 23 — 13/11/2026 — Résultats de la campagne « rayon de devant »

**Conditions** : 18874a6 (bonne version), mode normal, plein écran, débranché, **batterie basse (25 → 22 %)**, écran maintenu allumé. Vitesse du téléphone : 4,3 ms au début comme à la fin (premier relevé : servira de repère).

**Mesuré** — images > 20 ms par minute (blocs min–max) / > 33 ms / calcul pire :
- T0 85,1 (63–100) / 3 / 17,8 ms ;
- T2 31,7 (23–40) / 1 / 12,1 ms ;
- G1 92,9 (57–137) / 3 / 12,2 ms ;
- G4 63,4 (43–83) / 4 / 15,5 ms ;
- G2 93,4 (70–120) / 2 / 14,1 ms.

**Démontré**
- Rayon de devant invisible : ×0,37 (marge 0,27–0,50), pour la troisième fois.
- **Moitié de hauteur contre calque réduit (G4/G1) : ×0,68 (0,54–0,87).** La surface dessinée du rayon de devant compte. Par rapport à T0 : ×0,75.
- G1 ne récupère pas le gain de T2 (×2,93).

**Non démontré (pas d'effet visible à cette précision)**
- Calque réduit à la taille de l'image (G1) : ×1,09 (0,88–1,36). La zone transparente inutile ne coûte pas.
- Rayon opaque (G2) : ×1,10 (0,88–1,37). La transparence n'est pas ce qui coûte, comme prévu.

**Hypothèses (non démontrées)**
- Le coût du rayon de devant semble à peu près proportionnel à sa surface dessinée (rien : ×0,37 ; moitié : ×0,75 ; entier : ×1).
- Par pixel d'écran, il coûte bien plus que la bande des rayons lointains : environ 0,3 écran pour un effet de ×0,37, contre environ 0,7 écran pour ×0,77. Pistes : il glisse plus vite que le reste (×1,25), donc de nouveaux morceaux doivent être dessinés plus vite quand la caméra bouge ; il est dessiné en dernier, par-dessus le personnage. **Ma prévision de la séance 21 (« une parallaxe moins forte ne changera rien ») est donc remise en question.**
- Les pics de calcul (12 à 18 ms) sont présents dans toutes les variantes : ils ne viennent pas du rendu graphique.

**Remarques** : la batterie était basse (25 %), contrairement au conseil. La référence (85,1) est plus basse que lors de la passe précédente (122,9), à batterie pourtant plus basse : l'état du téléphone varie sans lien simple avec la batterie. L'indice de vitesse permettra de mieux le suivre.

---

## Séance 22 — 13/11/2026 — Répétition involontaire de la campagne F0–F3 (version en cache)

Le téléphone a lancé l'ancienne version (ea49561, code identique à aa84366) au lieu de 18874a6 : c'est donc **une deuxième passe de la campagne de vérification**, dans les mêmes conditions (mode normal, plein écran, débranché 32 → 28 %, écran maintenu allumé).

**Mesuré (passe 2)** — images > 20 ms par minute / > 33 ms / > 50 ms : T0 122,9 / 4 / 1 · T1 149,0 / 12 / 0 · T2 46,1 / 1 / 0 · F0 107,2 / 8 / 4 · F1 160,7 / 21 / 4 · F2 180,2 / 27 / 8 · F3 166,3 / 43 / 23.

**Les deux passes réunies** (216 s par variante ; marge à 95 %) :

| Comparaison | Passe 1 | Passe 2 | Les deux |
|---|---|---|---|
| T1 (animations réduites) / T0 | ×1,18 | ×1,21 | ×1,20 [1,05–1,37] |
| T2 (rayon de devant invisible) / T0 | ×0,32 | ×0,38 | ×0,35 [0,29–0,42] |
| F0 (sans rayons lointains) / T0 | ×0,65 | ×0,87 | ×0,77 [0,67–0,89] |
| F2 (deux calques ajoutés) / T0 | ×1,34 | ×1,47 | ×1,41 [1,24–1,60] |
| F1 / F2 (bande retirée, calques gardés) | ×1,05 | ×0,89 | ×0,96 [0,85–1,08] |
| F1 (ancien T3) / T0 | ×1,41 | ×1,31 | ×1,35 [1,19–1,54] |
| F3 (fenêtres dans le décor) / T0 | ×1,23 | ×1,35 | ×1,30 [1,14–1,48] |

**Démontré et reproduit** : rayon de devant (×0,35) ; coût des deux calques ajoutés (×1,41) ; ancien T3 (×1,35) ; F3 (×1,30, avec beaucoup d'images > 33 et > 50 ms dans les deux passes) ; aucun gain à retirer la bande quand les fenêtres existent.
**Nouveau** : réduire les animations dégrade légèrement (×1,20, démontré une fois les deux passes réunies). On garde les animations.
**À nuancer** : sans rayons lointains (F0) aide, mais moins que ne le laissait croire la passe 1 (×0,77 au total, ×0,87 seule dans la passe 2).
**État du téléphone** : référence encore plus haute (122,9 contre 101,8), batterie plus basse (32 % contre 42 %).

La campagne « rayon de devant » (18874a6) reste à lancer.

---

## Séance 21 — 13/11/2026 — Campagne « rayon de devant », nettoyage, indice de vitesse

**Avis sur les suggestions de ChatGPT (transmises par l'auteur)** : réduire la surface réelle sans changer l'apparence = G1, retenue. Plusieurs opacités (0,35, 0,20) : coût prévu identique à 0,55, seule l'opacité 1 ou 0 change la nature du travail, donc écartées. Intégrer le rayon au décor : impossible avec la technique actuelle, puisqu'il passe devant le personnage, qui a son propre calque. Une parallaxe moins forte : coût prévu identique, car le calque bouge à l'écran de toute façon ; ma propre variante G3 est retirée pour la même raison.

**Décision de l'auteur** : variantes T0, T2, G1, G4, G2 ; retrait du code F1 à F3 ; indice de vitesse.

**Fait (diagnostic seulement, le jeu ne change pas)**
- Code des variantes F1 à F3 retiré : les fichiers stage.js, style.css et les données du lieu sont revenus exactement à leur état d'avant la campagne de la séance 19.
- Nouvelle campagne ⚙ → Diagnostic → « Lancer la campagne « rayon de devant » » : 5 variantes, caméra mobile, 6 tours, ≈ 11 min. Comparaisons : T2/T0, G1/T0, G4/G1, G2/T0, G1/T2.
- **Indice de vitesse du téléphone** dans les rapports des tests rapides : un calcul fixe chronométré au début et à la fin (plus petit = plus rapide), pour comparer l'état du téléphone d'un essai à l'autre.

**Vérifié** : 70 tests de logique, 37 tests navigateur (variantes appliquées puis jeu rétabli ; G1 donne la même image ; rapport avec indice de vitesse). Comptages du jeu revenus à leurs valeurs d'origine. Navigateur de test : G1 réduit le calque (4300×1080 → 4300×300) mais presque pas la surface dessinée (3,39 → 3,37), car ce navigateur ignore déjà les zones transparentes ; G4 la réduit (3,23). À vérifier sur le téléphone.

---

## Séance 20 — 13/11/2026 — Résultats de la campagne de vérification

**Conditions** : aa84366, mode normal, débranché (42 → 37 %), plein écran, écran maintenu allumé. Campagne de 23 min (de 10 h 11 à 10 h 34), 6 tours, 108 s mesurées par variante, en alternance.

**Mesuré (téléphone)** — images > 20 ms par minute (blocs min–max), images > 33 ms, images > 50 ms, calcul pire :
- T0 101,8 (70–143) · 3 · 0 · 18,3 ms ;
- T1 120,1 (100–153) · 4 · 0 · 26,3 ms ;
- T2 32,2 (20–43) · 0 · 0 · 13,6 ms ;
- F0 66,2 (53–93) · 3 · 0 · 12,8 ms ;
- F1 143,4 (117–173) · 18 · 6 · 13,9 ms ;
- F2 136,8 (110–167) · 16 · 6 · 11,0 ms ;
- F3 125,6 (103–134) · 41 · 21 · 12,7 ms.

**Démontré (téléphone, comparaisons dans le même essai)**
- Rayon de devant invisible : ×0,32 (marge 0,24–0,43) ; les blocs ne se chevauchent pas. C'est le levier le plus fort, retrouvé à chaque test (×0,45 en séance 14).
- Sans rayons lointains : ×0,65 (0,52–0,82).
- Deux calques ajoutés, surface inchangée (F2) : ×1,34 (1,11–1,63).
- Ancien T3 (F1) : ×1,41 (1,17–1,70). **Le résultat de T3 est confirmé** dans l'état actuel.
- Fenêtres dessinées dans le décor (F3) : ×1,23 (1,02–1,50), et surtout **41 images > 33 ms et 21 > 50 ms** (contre 3 et 0 pour T0).
- **La dégradation de T3 venait des deux calques ajoutés, pas de la réduction de surface** : F2 montre leur coût ; F1 contre F2 (bande retirée, calques gardés) ne montre aucun gain (×1,05, marge 0,88–1,25).

**Non démontré** : effet des animations (×1,18, marge 0,97–1,44). Aucun bénéfice à les réduire.

**Constat sur l'état du téléphone** : la référence est revenue à environ 100 images lentes par minute (contre 10 lors de la séance 18, 1 h 30 plus tôt), et les pics de calcul aussi (18 à 26 ms). Le redémarrage n'a donc donné qu'une amélioration temporaire. Causes possibles, non démontrées : chaleur après une heure de tests, niveau de batterie, temps écoulé depuis le redémarrage. Les comparaisons à l'intérieur d'un même essai restent valables ; les niveaux absolus varient d'un moment à l'autre.

**Hypothèses techniques (navigateur de test : organisation du rendu)**
- Un calque mobile placé sous le décor du fond (la bande ou les fenêtres) oblige le navigateur à donner au décor son propre grand calque. Sans rien dessous (F0, F3), le décor rejoint le calque de la scène. Nombre de grands calques : T0 5, F0 4, F1 6, F2 7, F3 4.
- Sur le téléphone, la fluidité suit à peu près ce nombre (F0 < T0 < F2), sauf F3, où redessiner le décor à chaque mouvement provoque de longues saccades.
- Les fenêtres en calques provoquent aussi plus d'images > 33 et > 50 ms (18/6 et 16/6 contre 3/0) : peut-être le dessin à la volée des parties de l'image qui entrent dans la fenêtre en glissant. Non démontré.

**Conséquences proposées** : abandonner les variantes F1, F2, F3 (code de diagnostic à retirer) ; garder les animations ; travailler en priorité le rayon de devant, avec des variantes qui respectent la direction artistique, mesurées par la même campagne ; ajouter aux rapports un indice de vitesse du téléphone pour suivre son état d'un essai à l'autre.

---

## Séance 19 — 13/11/2026 — Campagne de vérification dans l'état actuel du téléphone

**Vérification de l'auteur** : chrome://gpu → « Compositing : Hardware accelerated ».

**Demande de l'auteur** : les anciens T1 et T3 ont été mesurés sur un téléphone en état dégradé. Il veut les refaire dans l'état actuel (mode normal, même mémoire, débranché, refroidi, plein écran, caméra mobile, même trajet, variantes alternées, une seule modification par comparaison), et comprendre si la dégradation de T3 venait de la réduction de surface ou des deux calques ajoutés. Il demande aussi une variante qui réduise la surface sans calque ajouté. Pas d'A3 avant la validation définitive de A2.

**Construit (diagnostic seulement ; le jeu dessine toujours la bande entière)** : ⚙ → Diagnostic → « Lancer la campagne de vérification » (7 variantes, 6 tours, ≈ 15 min) : T0, T1, T2, F0 (sans rayons lointains), F1 (fenêtres en calques, ancien T3), F2 (bande + fenêtres en calques), F3 (fenêtres dessinées dans le décor). Comparaisons : T1/T0, T2/T0, F0/T0, F2/T0, F1/F2, F1/T0, F3/T0.

**Vérifications (navigateur de test ; organisation du rendu, pas performances)**
- Image : F1, F2, F3 identiques à T0 à 0,1 % de pixels près (écart maximal 14/255, lissage). F0 retire les rayons lointains, volontairement. Test automatique ajouté.
- Caractérisation pendant les mouvements de caméra :

  | Variante | Calques qui dessinent | Surface par image | Rendus de pixels/s |
  |---|---|---|---|
  | T0 | 10 | 3,39 | 182 |
  | F0 | 9 | 2,68 | 147 |
  | F1 | 11 | 2,76 | 153 |
  | F2 | 12 | 3,47 | 181 |
  | F3 | 9 | 2,68 | 292 |

  F0 retire aussi un calque (celui de la bande), en plus de la surface. F3 évite les calques ajoutés mais fait redessiner le décor aux ouvertures à chaque mouvement de caméra.
- Comptages du jeu inchangés (5 éléments masqués de plus pour le diagnostic : 44, pour une limite de 45).
- 70 tests de logique, 37 tests navigateur.

**À faire par l'auteur** : lancer la campagne et coller le rapport.

---

## Séance 18 — 13/11/2026 — Test de confirmation en mode normal : surprise

**Conditions** : mode haute performance désactivé, sans redémarrer ; extension de RAM toujours active ; plein écran, débranché (52 → 50 %), écran maintenu allumé.

**Résultats (images > 20 ms par minute)** : A-T0 1,7 ; A-T1 4,2 ; B-T0 10,0 ; B-T1 24,2 ; B-T2 5,8. Aucune image > 33 ms ; 60,6 à 61,0 i/s ; calcul du jeu 0,3–0,4 ms en moyenne, 7,2 ms au pire.

**Démontré**
- En mode normal, dans l'état actuel du téléphone, le jeu atteint les trois objectifs.
- Le mode haute performance n'était pas la cause principale de l'amélioration : en mode normal, la caméra mobile passe à 10 images lentes par minute, contre environ 130 lors des tests précédents en mode normal. Il apporte un gain supplémentaire, de 10 à 0,8.
- « Réduire les animations » dégrade la caméra mobile (×2,42, marge 1,23–4,74).

**Correction de mon analyse de la séance 17** : j'avais présenté la gestion d'énergie comme cause probable des saccades. Elle n'en explique qu'une petite partie. L'essentiel vient d'un autre changement, survenu entre la séance 16 et la séance 17.

**Probable** : l'état du téléphone avant le redémarrage (longue durée sans redémarrage, applications en arrière-plan, mémoire, ou un Chrome en mode dégradé). Le calcul du jeu s'est amélioré lui aussi (pire 13–22 ms → 6–7 ms), ce qui va dans le sens d'un téléphone globalement plus disponible.

**Inconnu** : quel changement compte (redémarrage, extension de RAM) ; si les saccades reviennent avec le temps.

**Propositions** (sans rien modifier dans le jeu) : vérifier chrome://gpu sur le téléphone ; refaire le test rapide après quelques jours sans redémarrer, ou dès qu'une saccade se fait sentir ; décider de la validation de A2.

---

## Séance 17 — 13/11/2026 — Mode haute performance : objectifs atteints

**Conditions** : l'auteur a activé le mode haute performance et l'extension de RAM (8 Go + 3 Go), puis redémarré le téléphone. Plein écran, débranché (56 → 53 %), écran maintenu allumé. Le réglage « Essai caméra immobile » restait coché (sans effet sur ce test).

**Résultats (images > 20 ms par minute)** : A-T0 0,8 ; A-T1 1,7 ; B-T0 0,8 ; B-T1 0,0 ; B-T2 2,5. Aucune image > 33 ms, 61 i/s partout, calcul du jeu 0,3 ms en moyenne, 4,3 ms au pire.

**Comparaison avec les séances précédentes (mode normal)** :

| | Mode normal (séances 14 et 16) | Mode haute performance |
|---|---|---|
| Caméra mobile, images lentes/min | 137,6 et 132,6 | **0,8** |
| Caméra fixe, images lentes/min | 21,7 et 23,4 | **0,8** |
| Images > 33 ms (caméra mobile) | 11 et 10 | **0** |
| Calcul du jeu, pire | 17,5 et 13,9 ms | **4,3 ms** |

**Démontré** (sur ce test) : dans ces conditions, le jeu atteint les trois objectifs du cahier des charges, caméra mobile comprise.

**Probable** : les saccades viennent de la gestion d'énergie du téléphone. En mode normal, il fait tourner le navigateur à des fréquences basses (ou sur ses petits cœurs), parce que le jeu est peu exigeant. Cela expliquerait aussi le paradoxe de T1 et T3 : retirer du travail dégradait.

**Pas encore démontré** : laquelle des trois modifications compte (mode haute performance, extension de RAM, redémarrage). L'extension de RAM est très peu probable, le redémarrage possible, le mode haute performance le plus probable.

**Test de confirmation proposé** : le même test, mode haute performance désactivé, sans redémarrer ni rien changer d'autre.

---

## Séance 16 — 13/11/2026 — T3 rejeté, retour à l'ancien rendu, investigation de la caméra

**Rapport T3 (bdc02db, plein écran, débranché 66 → 64 %, écran maintenu allumé)**, images > 20 ms par minute (blocs min–max) :
- A-ancien 23,4 (13–40) ; A-nouveau 22,5 (17–27) ;
- B-ancien 132,6 (113–153), > 33 ms : 10 ;
- B-nouveau 171,8 (154–197), > 33 ms : 20, > 50 ms : 4.

Comparaisons : nouveau/ancien en caméra mobile ×1,30 (marge 1,05–1,59) → **dégradation démontrée** (les 4 blocs du nouveau sont tous plus mauvais que les 4 de l'ancien) ; caméra fixe ×0,96 (pas de différence, contrôle cohérent) ; caméra mobile/fixe ×5,7.

**Décision** : optimisation rejetée. Code rétabli à l'identique de 1543360 (commit 859e158) ; tests repassés (67 + 35) ; comptages revenus aux valeurs d'avant.

**Leçons**
1. Pour la deuxième fois, les comptages du navigateur de test annonçaient un gain (surface dessinée −19 %) que le téléphone n'a pas confirmé. Le moteur de test ne modélise pas le coût réel de la carte graphique du téléphone.
2. La mesure elle-même est fiable : B-ancien (132,6) reproduit B-T0 de la séance 14 (137,6).
3. Deux changements qui retirent du travail (T1, T3) dégradent tous deux la caméra mobile d'environ ×1,3. Possible effet non linéaire (fréquence de la carte graphique, rythme d'affichage), non démontré.
4. T3 n'a pas seulement réduit la surface : il a aussi ajouté deux calques découpés qui bougent. Il ne prouve donc pas, à lui seul, que la surface cachée est sans effet.

**Investigation de la caméra (lecture du code + comptages déjà relevés ; aucune modification)** : voir le tableau « Investigation de la caméra » dans docs/SUIVI.md. Prochaine étape proposée : un traçage pris sur le téléphone, puis des variantes isolées dans le test rapide. Rien n'est construit avant validation.

---

## Séance 15 — 13/11/2026 — Correction n° 1 : rayons lointains limités aux ouvertures, et test T3

**Décision de l'auteur** : proposition A validée. Ne modifier que le rendu des rayons lointains ; garder l'ancien pour comparer ; même protocole ; vérifier la surface réellement rendue ; ne pas tenir le mécanisme GPU pour acquis ; ne toucher ni au rayon de devant, ni aux animations, ni à la poussière.

**Modification (seulement les rayons lointains)**
- Avant : une bande de 3600×470 dessinée entière, presque entièrement cachée par l'étagère du fond.
- Après : deux « fenêtres » placées sur les ouvertures de l'étagère (montants compris, avec une marge), qui découpent la même image. Elle y glisse avec la même parallaxe. Fenêtres décrites dans les données du lieu.
- L'ancien rendu reste disponible (réglage Diagnostic « Rayons lointains limités aux ouvertures », activé par défaut) ; un seul des deux est affiché à la fois.

**Vérifications (navigateur de test : organisation du rendu, pas une mesure de la carte graphique)**
- **Image identique** : hors des ouvertures, identique au pixel près ; dans les ouvertures, aucun décalage, seulement de légers écarts de lissage sur les contours (médiane 2/255). Test automatique ajouté.
- **Surface réellement dessinée par le compositeur** (rectangles dessinés, après découpage) : rayons lointains 0,71 → 0,06 écran (téléphone simulé) et 0,85 → 0,07 (PC) ; total par image 3,38 → 2,73 et 3,40 → 2,62. Les autres calques sont inchangés.
- Les fenêtres sont bien des calques à part : le décor du fond n'est pas redessiné quand la caméra bouge (redessin des grands calques 17,9 → 5 par seconde).
- Test des comptages : surface d'image affichée 1,85 → 1,51 écran (calcul corrigé pour tenir compte du découpage par les fenêtres) ; calques affichés : 4 ; rien créé pendant le jeu.

**Test T3** (⚙ → Diagnostic, premier bouton) : même protocole que le test rapide (chauffe 30 s, blocs de 20 s, 2 s ignorées, 4 tours, ordre inversé un tour sur deux, 72 s mesurées par condition). Conditions : A-ancien, A-nouveau (caméra fixe, contrôle), B-ancien, B-nouveau (caméra mobile). Mêmes indicateurs et même calcul de marge. Durée ≈ 6 min.

**Vérifié** : 70 tests de logique, 37 tests navigateur (dont T3 court : chaque variante affiche le bon rendu et tout est remis en place ; identité de l'image).

**À faire par l'auteur** : lancer T3 en plein écran, téléphone débranché, « Essai caméra immobile » décoché.

---

## Séance 14 — 13/11/2026 — Analyse du test rapide T0 / T1 / T2 (téléphone)

**Conditions** : téléphone débranché (89 → 87 %), écran maintenu allumé (oui), **pas en plein écran** (zone de jeu 800×272, 3002 px de rayon visibles). Les comparaisons entre variantes restent valables (même essai, même alternance), mais les chiffres absolus ne se comparent pas aux tests en plein écran. Le réglage « Essai caméra immobile » restait coché ; il ne joue pas sur le test rapide.

**Résultats (images > 20 ms par minute, blocs min–max)**
- A-T0 (marche, caméra fixe) : 21,7 (13–30) ; > 33 ms : 0.
- A-T1 (sans animations) : 32,5 (23–43) ; > 33 ms : 1.
- B-T0 (marche, caméra mobile) : 137,6 (113–177) ; > 33 ms : 11 ; > 50 ms : 2.
- B-T1 (sans animations) : 179,3 (167–197) ; > 33 ms : 14.
- B-T2 (sans rayon de devant) : 61,7 (57–67) ; > 33 ms : 2.
- Calcul du jeu : 0,6–0,7 ms en moyenne ; pires 14,6–22 ms.

**Démontré (téléphone)**
1. La caméra mobile multiplie les images lentes (×6,3, marge 4,2–9,6) : confirmé une troisième fois.
2. Le rayon de premier plan transparent pèse lourd en caméra mobile : sans lui, ×0,45 (marge 0,34–0,59). Les blocs ne se chevauchent pas (57–67 contre 113–177). Images > 33 ms : 11 → 2.
3. Couper les animations du personnage et la poussière **n'améliore pas** la fluidité en marche. L'hypothèse tirée des comptages du navigateur de test (personnage redessiné 60 fois/s) ne se traduit pas en coût réel sur ce téléphone.

**Probable** : le téléphone est limité par la quantité de pixels que la carte graphique doit assembler à chaque image quand tout l'écran bouge. Retirer environ 28 % de l'écran en pixels transparents suffit à diviser les saccades par deux : le travail est juste à la limite des 16 ms.

**Inconnu** : la cause de la légère dégradation avec T1 (peut-être le hasard : la marge suppose des images lentes indépendantes, et les blocs varient) ; l'effet de T1 personnage immobile ; la cause des pics de calcul (14–22 ms) ; le gain réel d'une correction des rayons lointains.

**Leçon** : les comptages du navigateur de test décrivent l'organisation du rendu, pas son coût sur le téléphone. Seules les mesures du téléphone décident.

---

## Séance 13 — 13/11/2026 — Test rapide T0 / T1 / T2 (≈ 7 min)

**Demande de l'auteur** : un test sur mesure, plus court mais exploitable.

**Construit (diagnostic seulement)** : ⚙ → Diagnostic → « Lancer le test rapide T0 / T1 / T2 ».
- Un seul essai : 30 s de chauffe, puis 4 tours. À chaque tour, 5 conditions de 20 s (les 2 premières secondes de chaque bloc sont ignorées).
- Conditions : A = marche, caméra fixe ; B = marche, caméra mobile ; T0 = référence, T1 = réduire les animations, T2 = rayon de devant invisible → A-T0, A-T1, B-T0, B-T1, B-T2.
- **Alternance** : l'ordre des conditions est inversé un tour sur deux. La chaleur et l'état du téléphone pèsent donc pareil sur toutes les variantes, ce qui est plus fiable que trois tests successifs, et sans rien régler à la main. Les variantes sont appliquées en mémoire seulement, puis tout est remis comme avant.
- Rapport : par condition, images, i/s, images > 20 ms par minute (avec l'écart entre blocs), > 33, > 50, p95, calcul du jeu. Puis 4 comparaisons (T1/T0 caméra fixe, T1/T0 caméra mobile, T2/T0 caméra mobile, caméra mobile/fixe) : rapport ×, marge d'incertitude à 95 %, et verdict « démontré » ou non. On y lit aussi la batterie (en charge ou non) et le maintien de l'écran, relevé au début.

**Puissance attendue**, d'après les mesures précédentes : environ 26 images lentes par condition en caméra fixe et environ 195 en caméra mobile. Un effet de moitié en caméra fixe est à la limite du démontrable ; si besoin, on passe à 6 tours (≈ 10 min).

**Vérifié** : 67 tests de logique (durée 430 s, même temps de mesure par condition, ordre alterné, marche continue sur l'aller-retour, calcul de la marge) ; 35 tests navigateur, dont un test rapide court complet (rayon de devant bien invisible pendant B-T2, réglages remis, rien d'enregistré).

---

## Séance 12 — 13/11/2026 — Analyse du diagnostic en 4 configurations ; plan des tests T0, T1, T2

**Mesures sur le téléphone (921b78d, Oppo Reno 2, en charge 70 → 78 %)** — images > 20 ms par minute (essais 1/2/3) :
1. immobile, caméra fixe : 11 (6/13/14) ;
2. marche, caméra fixe : 22 (18/26/21) ;
3. immobile, caméra mobile : 125 (117/129/130) ;
4. marche, caméra mobile : 162 (154/154/179).

Images > 33 ms : 0 / 0,7 / 5,7 / 4,7 par minute ; aucune > 50 ms. Calcul du jeu 0,5 à 0,7 ms ; rendu de la page 3,3 à 3,9 ms ; ménage mémoire 91 fois, lié à environ 1 % des images lentes seulement.

**Comptages du navigateur de test** (organisation du rendu ; ne prouvent rien sur la carte graphique du téléphone) :
- personnage redessiné environ 60 fois/s dans les 4 configurations, même immobile ;
- poussière redessinée 64 fois/s en marchant ;
- mises en page 1/s à l'arrêt, 17/s en marche ;
- la caméra mobile n'ajoute aucun redessin.

**Démontré (téléphone)** : le problème est reproductible ; la caméra mobile multiplie les images lentes par 11 ; ce sont des images ratées (exactement 2 ou 3 rafraîchissements), pas des calculs longs ; la caméra n'augmente pas le rendu côté page ; le ménage mémoire n'est pas la cause ; aucun chargement d'image pendant les mesures.

**Probable** : la caméra oblige la carte graphique à recomposer tout l'écran à pleine finesse (2400×1080), plusieurs calques empilés ; le redessin du personnage à chaque image pèse sur toutes les configurations.

**Inconnu** : temps réel de la carte graphique ; effet de la chaleur et de l'ordre des configurations ; pics isolés de la mesure de rendu ; part respective du dessin du personnage et de la poussière ; gain réel d'un passage à PixiJS.

**Décision de l'auteur** : mesurer avant de corriger. Tests sur le téléphone sans changer le code :
- T0 : référence, réglages par défaut ;
- T1 : « Réduire les animations » (coupe rebond, respiration, écrasements, retournement et poussière ; vérifié par comptage : personnage redessiné 1 fois/s à l'arrêt, 13 fois/s en marche, poussière 0) ;
- T2 : opacité du rayon de devant à 0.

Conditions identiques : téléphone débranché, refroidi, économie d'énergie coupée, « Ne pas déranger », mêmes durées (chauffe 30 s, 3 × 60 s). Ensuite : corrections une à une, avec comparaison avant/après. Pas de PixiJS pour l'instant.

---

## Séance 11 — 12/11/2026 — Diagnostic fiable en 4 configurations (aucune correction)

**Demande de l'auteur** : consolider le diagnostic avant tout essai PixiJS, sans modifier le moteur ni l'architecture. Quatre configurations (marche oui/non × caméra mobile oui/non) ; 60 s de chauffe, 3 mesures de 60 s chacune ; relever images/s, images > 20, 33 et 50 ms, p95, calcul du jeu, rendu si possible ; vérifier que les conditions sont identiques ; examiner les causes possibles (ménage mémoire, chargement d'images, caméra, autre traitement du navigateur). Ne pas commencer PixiJS avant d'avoir examiné les résultats ensemble.

**Construit (diagnostic seulement, le jeu normal ne change pas)**
- ⚙ → Diagnostic → **« Lancer le diagnostic complet »** : les 4 configurations s'enchaînent toutes seules, en 16 min environ. L'écran est maintenu allumé, un bandeau indique l'avancement et le temps restant.
- **Conditions identiques** : même endroit du rayon (aller-retour entre x 1300 et 2300 à la même profondeur), même vitesse, ligne droite (aucun calcul de chemin). Le personnage immobile est au milieu de cet aller-retour. La caméra fixe est centrée sur l'aller-retour. La caméra mobile suit le personnage (config. 4) ou un « fantôme » invisible qui fait le même aller-retour (config. 3), donc la même trajectoire de caméra.
- **Par mesure** : images/s, images > 20, > 33 et > 50 ms, médiane, p95, pire ; calcul du jeu moy/p95/pire ; **rendu côté page** moy/p95/pire (approximation : temps entre la fin du calcul et la fin de la préparation de l'image par le navigateur ; le travail de la carte graphique n'est pas mesurable depuis la page) ; images > 50 ms signalées par le navigateur (LoAF) ; tâches longues du navigateur.
- **Causes examinées** : pour chaque image lente, le rapport indique ce qui venait de se passer : ménage de la mémoire (détecté par des « objets témoins » que le navigateur signale quand il les jette ; la mesure de mémoire du navigateur s'est révélée figée, donc inutilisable), changement de dessin du personnage, retournement, poussière, mouvement de caméra. Il donne aussi la part normale de ces moments, pour distinguer un vrai lien d'une coïncidence. Il compte les images chargées pendant les mesures (doit être 0).
- **Contrôle des conditions** : taille de fenêtre, plein écran, densité, passage en arrière-plan, touchers pendant la mesure, batterie au début et à la fin. Toute mesure dont les conditions ont changé est marquée.

**Vérifié** : 63 tests de logique (ordre des phases, durée totale 16 min, chaque configuration fait bouger exactement ce qu'elle doit, aller-retour en ligne droite sur un trajet sans obstacle) ; 34 tests navigateur, dont un diagnostic raccourci complet (rapport à 4 configurations, 8 mesures, conditions inchangées). Les temps du navigateur de test ne valent rien.

**À faire par l'auteur** : lancer le diagnostic complet sur le téléphone et coller le rapport. Ensuite : tableau comparatif et bilan « démontré / probable / inconnu ».

---

## Séance 10 — 12/11/2026 — Analyse des saccades (deux bancs d'essai)

**Rapports de l'auteur (5973115, Oppo Reno 2, plein écran)**

| | Normal | Caméra immobile |
|---|---|---|
| Images/s moyennes | 58,8 | 60,1 |
| Médiane / p95 / p99 | 16,4 / 16,5 / 32,8 ms | 16,4 / 16,5 / 32,8 ms |
| Images > 20 ms | 124 (3,7 %) | 47 (1,4 %) |
| Images > 33 ms | 3 | 3 |
| Calcul JS pire | 15,0 ms | 8,9 ms |
| Rafales | 122 épisodes, 2 images au plus | 45 épisodes, 3 images au plus |
| Chargement | 1,2 s | 1,2 s |

**Ce que les mesures prouvent**
1. **Le défilement de la caméra cause environ 60 % des images lentes** (124 → 47 quand elle ne bouge plus).
2. **Il reste une autre cause** (47 images lentes caméra immobile, en marche comme à l'arrêt). Elle n'est pas encore identifiée.
3. Les saccades sont **isolées** : une image saute un rafraîchissement, pas de longue rafale.
4. Le **calcul du jeu** est très faible (0,7 ms), avec de rares pics à 9–15 ms, probablement le nettoyage automatique de la mémoire du navigateur (non prouvé).
5. Le calcul du chemin n'est pas la cause principale (3 images lentes sur 42).

**Ce que cela veut dire** : la technique d'affichage actuelle (DOM + CSS) tient 60 images/s en moyenne, mais ne tient pas encore l'objectif « aucune image > 33 ms ». C'est le point de décision prévu avant A3 : essayer PixiJS (WebGL), chiffres à l'appui.

**Décision demandée à l'auteur** : voir les options proposées en séance 10.

---

## Séance 9 — 12/11/2026 — Premier banc d'essai sur le téléphone : mesurer la cause des saccades

**Rapport de l'auteur (9756425, Oppo Reno 2, plein écran)** : 58,0 images/s ; médiane 16,4 ms ; p95 16,6 ms ; **p99 32,9 ms** ; pire 49,3 ms ; **5 images > 33 ms (0,15 %)** ; **163 images > 20 ms (5 %)** ; calcul JS moyen 0,74 ms, **pire 21,3 ms** ; chargement 3,9 s.

**Lecture** : 95 % des images sont parfaites. Environ 1 image sur 20 « saute » un rafraîchissement : elle dure 33 ms au lieu de 16. C'est une petite saccade, peut-être visible. Le calcul du jeu est presque toujours minuscule (0,7 ms), mais au moins une image a demandé 21 ms de calcul. Les objectifs ne sont donc pas tenus.

**Ce qui a été fait (mesure seulement, aucune correction)**
- Le rapport du banc classe maintenant les images lentes (> 20 ms) selon le moment : caméra en mouvement ou immobile, personnage en marche ou à l'arrêt, image où un chemin est calculé. Il dit si elles arrivent isolées ou en rafales, et à quel moment a eu lieu le calcul le plus long.
- Il indique aussi les images les plus lentes à préparer au chargement.
- Nouvel interrupteur d'essai : **caméra immobile**, pour prouver ou écarter le défilement du décor comme cause.

**Vérifié** : 58 tests de logique, 33 tests navigateur ; banc lancé dans le navigateur de test (nouvelles lignes du rapport correctes).

**À faire par l'auteur** : deux bancs d'essai sur le téléphone (un normal, un avec « Essai caméra immobile »), puis coller les deux rapports.

---

## Séance 8 — 12/11/2026 — Banc d'essai et test des comptages (fin de A2)

**Retours de l'auteur** : changements de la séance 7 validés ; joystick désactivé par défaut (il l'était déjà ; un test le garantit désormais).

**Jouable maintenant**
- **Banc d'essai** : ⚙ → onglet Diagnostic → « Lancer le banc d'essai ». Le personnage parcourt seul le rayon : derrière les présentoirs, derrière le caddie, en bas de l'écran derrière le rayon de devant, avec des allers-retours (retournements) et des arrêts (respiration), et toujours le même trajet. Il commence par 3 s de chauffe, puis fait 3 tours, soit environ une minute. Un bandeau indique l'avancement. À la fin, un rapport s'affiche avec « Copier le rapport » : images/s moyennes, temps d'image (médiane, 95e et 99e percentiles, pire), nombre d'images > 33 ms, calcul JavaScript séparé du temps total. Échap ou ⏸ annule, et le rapport indique alors « annulé ».
- **Interrupteurs d'essai** (même onglet) : refaire le même parcours sans rayon de devant, sans rayons lointains, sans poussière ou sans ombre, pour comparer deux rapports. Ils ne s'appliquent que pendant le banc.
- Réglages du banc : nombre de tours, durée de la chauffe.

**Vérifié, et comment**
- 58 tests de logique, dont le banc : chaque point du parcours est praticable et réellement atteint, le trajet est identique d'une fois à l'autre, chauffe puis tours, puis fin ; nouvel état « banc d'essai » dans la machine à états.
- 33 tests navigateur, dont :
  - le lancement depuis l'onglet Diagnostic, l'annulation et le rapport ;
  - le **test des comptages** pendant un tour complet : 39 éléments dans la scène, 4 calques, 10 images visibles au plus, surface d'image 1,85 × l'écran, 17 images (5,5 Mpx). Pendant le jeu : 0 élément créé, 0 canevas, 0 nœud ajouté, 0 lecture de pixels. Les limites sont fixées avec une petite marge ; le test échoue si une modification les dépasse.
- Banc complet lancé dans le navigateur de test : il dure environ 57 s et le rapport est correct. Ses temps ne valent rien (pas de carte graphique) ; seul le rapport du téléphone compte.
- **Limite honnête** : les « objets créés à chaque image » ne sont pas comptés directement (le navigateur ne le permet pas de façon fiable). On compte les éléments, images et canevas créés pendant le jeu (zéro). Seuls de petits textes de position sont recréés à chaque image, ce qui est inévitable avec l'affichage DOM.

**À faire par l'auteur** : lancer le banc d'essai sur le téléphone (plein écran, ne rien toucher pendant une minute), puis coller le rapport.

**Proposition pour la séance suivante** : si le rapport du téléphone est bon, validation de A2, puis étape A3 : les produits sur les étagères, le scanner et les premières cartes.

---

## Séance 7 — 12/11/2026 — Bords de la zone au doigt, zone agrandie, réglages en onglets

**Retours de l'auteur**
- Ce qui plaît : tout le travail de la séance 6 est validé.
- Ce qui gêne : difficile de viser le bord de la zone de marche au doigt.
- Ce qui manque : zone de marche encore plus grande en haut et en bas ; réglages en onglets par thème.
- Question : le plein écran marche-t-il sur d'autres écrans ?

**Jouable maintenant**
- **Toucher hors du sol** (sur une étagère, sur le rayon de devant, sur le plafond) : le personnage va jusqu'au bord de la zone de marche, au plus près de l'endroit touché. Ce comportement existait, il est rendu plus fiable (le point visé est placé juste à l'intérieur du bord).
- **Zone de marche agrandie** : jusqu'au pied de l'étagère du fond, et jusqu'au bord bas de l'écran.
- **Réglages en onglets** : Marche, Personnage, Contrôles, Son, Affichage, Caméra, Technique, Debug. Le dernier onglet ouvert est retenu.

**Vérifié, et comment**
- 52 tests de logique, 31 tests navigateur, sans erreur console. Nouveaux : toucher l'étagère du fond puis le bas de l'écran (au doigt et à la souris) amène bien au bord ; onglets (un seul par thème) ; formes d'écran 4:3, 16:10 et 21:9 (toute la hauteur, personnage et boutons visibles).
- Capture des onglets en téléphone simulé regardée.

**Proposition pour la séance suivante** : fin de A2 : banc d'essai et test automatique des comptages, puis validation de A2.

---

## Séance 6 — 12/11/2026 — A2 : profondeur, corps vivant, caméra et parallaxe

**Retours de l'auteur**
- A1 validée (1445d25). Saut : choix B (saut libre), après le prototype A. La musique ne grésille plus.
- Rapport du téléphone : 61 images/s, p95 16,5 ms, chargement 1,4 s (le décor du fond prend 0,44 s).
- Question : le plein écran cache une partie du décor (écran 20:9).

**Jouable maintenant**
- **Profondeur** : le personnage rapetisse en allant vers le fond et grandit un peu tout devant.
- **Ombre au sol**, séparée du dessin, qui s'amenuise quand il s'élève.
- **Corps vivant** : rebond à chaque pas avec léger écrasement au contact, respiration à l'arrêt, petit écrasement en s'arrêtant.
- **Rayon long (3600 px)** et **caméra** qui glisse pour le suivre. Elle regarde un peu devant lui et reste immobile tant qu'il est au centre.
- **Parallaxe** : par deux ouvertures dans l'étagère du fond, on voit des rayons lointains (« RAYON 41 », « RAYON ∞ »…) qui glissent plus lentement ; le rayon de devant glisse plus vite.
- **Plus rien n'est coupé** : toute la hauteur du décor est visible, quel que soit l'écran. Un écran allongé montre simplement plus de rayon. L'ancien choix « remplir / tout montrer » est remplacé par un zoom.

**Vérifié, et comment**
- 52 tests de logique : taille selon la profondeur, rebond, respiration, écrasement, caméra (placement, glissement, zone sans mouvement, bout du rayon, zoom).
- 22 tests navigateur (PC et téléphone simulé), sans erreur console. Nouveaux tests : ombre et taille au fond ; la caméra suit et les rayons lointains glissent moins vite ; toute la hauteur visible.
- Captures PC et téléphone simulé regardées.
- **À vérifier par l'auteur** : la sensation sur le téléphone, la fluidité (rapport DBG), le temps de chargement (le décor est plus grand).

**Décisions prises seul (détails mineurs)**
- Zoom 1 par défaut : sur téléphone, le personnage paraît environ 20 % plus petit qu'avant, en échange d'un décor entier. Réglage « Zoom » dans ⚙ → Caméra.
- Un deuxième présentoir Crousti-Gouffre plus loin dans le rayon (même image).

**Proposition pour la séance suivante** : fin de l'étape A2 : banc d'essai (parcours automatique du rayon, rapport à copier) et test automatique des comptages. Puis validation de A2.

---

## Séance 5 — 12/11/2026 — Poussière, profil Paper Mario par défaut, son et chargement

**Retours de l'auteur**
- Ce qui plaît : profil « Paper Mario » ; pas validés ; contournement validé.
- Ce qui gêne : la musique grésille sur le téléphone.
- Ce qui manque : un petit nuage de poussière à chaque pas ; la respiration (prévue en A2).
- Questions : faut-il dessiner avant l'étape suivante (non) ; le saut (décision en attente).
- Rapport du téléphone (ec1a29f) : 61 images/s, p95 16,5 ms, 4 images > 33 ms sur 2206, calcul 0,57 ms en moyenne (pire 4,8 ms), **chargement 8,2 s**.

**Jouable maintenant**
- **Poussière** : un petit nuage de papier se dégage derrière le pied à chaque pas, recule et s'efface.
- **Profil Paper Mario par défaut**, mis en évidence (✓) dans ⚙ → Marche. Les autres profils restent disponibles.
- **Son** : graves très basses coupées (elles font vibrer les petits haut-parleurs), limiteur en sortie, réserve de son « moyenne ». Nouveau réglage « Réserve de son ».
- **Rapport de diagnostic** : il indique maintenant les images les plus lentes à préparer et l'état du son.

**Vérifié, et comment**
- 43 tests de logique et 18 tests navigateur réussis (PC et téléphone simulé), sans erreur console. Nouveaux tests : la poussière apparaît en marchant puis disparaît ; le profil Paper Mario est sélectionné par défaut.
- Capture de la poussière regardée.
- **Pas vérifiable ici** : le grésillement (pas de haut-parleur) et le temps de chargement réel du téléphone (le PC de test charge en 0,4 s).

**Décisions prises seul (détails mineurs)**
- Poussière désactivée par l'option « réduire les animations ».
- Réserve de son « moyenne » par défaut.

**Proposition pour la séance suivante** : A2, avec en premier l'échelle selon la profondeur, l'ombre, le rebond et la respiration.

---

## Séance 4 — 12/11/2026 — Contournement des objets, pas plus doux, profils de marche, suivi

**Retours de l'auteur**
- Décisions : contourner seul les objets (A) ; A1 pas encore validée (marche encore en test) ; retournement face/dos gardé.
- Ce qui gêne : les pas, désagréables et pas assez discrets.
- À revoir plus tard : la musique, la durée du retournement.
- Question de l'auteur : quel comportement de marche serait agréable et moderne, façon Paper Mario ?
- Nouvelles règles : noter tous les changements (docs/SUIVI.md) ; donner le lien pour jouer à chaque fin de conversation.

**Jouable maintenant**
- **Toucher ou cliquer derrière un objet** : le personnage le contourne seul par le chemin le plus court. Un toucher sur l'objet lui-même l'envoie juste à côté.
- **Pas plus doux** : un frottement étouffé de semelle souple, sans claquement, à volume réduit de moitié (0,35).
- **Profils de marche** dans ⚙ → Marche : « Doux » (actuel), « Paper Mario », « Moderne ». Un toucher règle vitesse, accélération et freinage d'un coup.

**Vérifié, et comment**
- 41 tests de logique réussis, dont la recherche de chemin : ligne droite si rien ne gêne, contournement du présentoir et du caddie, point ramené hors d'un objet, chemin suivi jusqu'au bout.
- 15 tests navigateur réussis (PC et téléphone simulé, au doigt), sans erreur console. Nouveau test : toucher derrière le présentoir, il y arrive et passe derrière.
- **Pas vérifiable ici** : l'écoute des nouveaux pas. **À vérifier par l'auteur** : les profils de marche, le contournement au doigt.

**Comment tester**
1. Touche (ou clique) le sol derrière le caddie : il en fait le tour.
2. ⚙ → Marche → Profil : essaie « Paper Mario » puis « Moderne » ; marche quelques secondes avec chacun.
3. Écoute les pas.

**Quoi essayer**
1. Quel profil de marche te plaît le plus ?
2. Les pas sont-ils devenus assez discrets ?

**Décisions prises seul (détails mineurs)**
- Les profils ne changent pas les valeurs par défaut : c'est l'auteur qui choisira.

**Proposition pour la séance suivante** : une fois la marche validée (A1), suite de l'étape A2 (échelle selon la profondeur, ombre, rebond et respiration, caméra qui glisse, banc d'essai).

---

## Séance 3 — 12/11/2026 — Visage de profil, rayon du premier plan, vraie marche, sons

**Retours de l'auteur**
- Ce qui gêne : de dos, en allant sur le côté, on voyait l'arrière de sa tête ; les jambes faisaient du « moonwalk ».
- Ce qui manque : marcher jusqu'en bas de l'écran ; un rayon devant, en transparence ; des bruits de pas et une petite musique.

**Jouable maintenant**
- **Côté = visage** : il n'est de dos que quand il va vers le fond. Dès qu'il va à gauche ou à droite, on voit son visage, avec le retournement de la feuille.
- **Zone de marche agrandie** jusqu'en bas de l'écran.
- **Rayon du premier plan** en bas de l'écran, en transparence : le personnage marche entre deux rayons et passe derrière celui de devant.
- **Marche corrigée** : le pied posé recule sous le corps pendant que l'autre, levé, passe devant. Plus de « moonwalk ».
- **Son** : un bruit de pas chaque fois qu'un pied se pose, et une petite bossa de supermarché provisoire, un peu étouffée comme par les haut-parleurs du plafond, plus douce en pause. Tout est fabriqué par le jeu, aucun fichier audio. Le son démarre au premier geste (exigence des navigateurs). Bouton ♪ pour couper ou remettre le son.

**Vérifié, et comment**
- 36 tests de logique (Vitest) réussis. Ils couvrent le visage de face sur le côté, la zone jusqu'en bas, la partition de la musique et les pas sur les bonnes images.
- 14 tests navigateur (PC et téléphone simulé) réussis, sans erreur console. Nouveau test : descendre en bas, monter, aller sur le côté (il se remet de face), le son a démarré.
- Captures regardées : bas de l'écran derrière le rayon transparent, vue téléphone simulé.
- **Pas vérifiable ici** : l'écoute du son (le navigateur de test n'a pas de haut-parleur). **À vérifier par l'auteur** : le son, le volume sur téléphone, la sensation, la fluidité (rapport DBG).

**Comment tester**
1. Touche une touche ou le sol : la musique démarre.
2. Marche : un bruit de pas à chaque pied posé.
3. Monte vers le fond, puis va à droite : il se tourne de face.
4. Descends tout en bas : il passe derrière le rayon transparent.
5. ♪ coupe le son ; F2 → « Son » pour les volumes.

**Quoi essayer**
1. La musique : agréable, ou lassante au bout de quelques minutes ? Trop forte ?
2. Les pas : bien synchronisés avec les jambes, assez discrets ?
3. Le rayon de devant : assez transparent ? (réglage « Opacité du rayon de devant »)

**Nouveaux réglages (F2 ou ⚙)** : Son (couper, volume général, musique, pas, musique en pause) ; Affichage (opacité du rayon de devant).

**Décisions prises seul (détails mineurs)**
- En diagonale vers le fond, il reste de dos ; seul un mouvement surtout horizontal le remet de face.
- En mode « remplir l'écran », le cadrage privilégie le bas de la scène, pour que le rayon de devant et le sol restent visibles. Le haut (panneau « Rayon 7 ») est un peu coupé sur téléphone.
- Les images, la musique et les pas provisoires sont inscrits dans `CREDITS.md`.

**À préparer par l'auteur** : rien pour l'instant.

**Proposition pour la séance suivante** : suite de l'étape A2 (échelle selon la profondeur, ombre, rebond et respiration, caméra qui glisse, banc d'essai).

---

## Séance 2 — 12/11/2026 — Retournement, marche, clignement, passer derrière les objets

**Retours de l'auteur sur A1**
- Ce qui manque : retournement de la feuille façon Paper Mario ; images de marche et de clignement ; pouvoir passer derrière le caddie et le présentoir.

**Jouable maintenant**
- **Retournement** : quand le personnage change de côté, la feuille s'amincit jusqu'à sa tranche, puis se rouvre de l'autre côté. Même chose quand il passe de face à dos.
- **Marche** : 4 images de marche de face et 4 de dos. Les pas suivent la distance parcourue, donc les pieds ne glissent pas, même si on change la vitesse.
- **Clignement** : à l'arrêt et de face, il cligne des yeux, avec un double clignement de temps en temps.
- **Passer derrière** : le caddie et le présentoir « -30 % » sont maintenant des objets à part, décollés de l'étagère. Le personnage passe derrière eux : seule sa tête dépasse du présentoir, et on le voit à travers la grille du caddie.

**Vérifié, et comment**
- 31 tests de logique (Vitest) réussis. Ils couvrent les animations, le retournement, l'ordre devant/derrière, les couloirs derrière les objets et la distance parcourue.
- 13 tests navigateur (Playwright, PC et téléphone simulé) réussis, sans erreur console. Deux nouveaux tests : passer derrière le présentoir puis revenir devant ; la feuille passe par une largeur réduite puis finit retournée.
- Captures regardées : derrière le caddie, derrière le présentoir, retournement ralenti à mi-chemin, 4 instants de marche.
- **Reste à vérifier par l'auteur** : la sensation sur le vrai téléphone, la manette, la fluidité (rapport DBG).

**Comment tester**
1. Marche à gauche puis à droite : la feuille se retourne.
2. Reste immobile de face quelques secondes : il cligne des yeux.
3. Monte vers les étagères (Z ou flèche haut), puis longe le rayon : il passe derrière le présentoir et derrière le caddie.
4. F4 montre la zone de marche, avec en pointillés bleus la ligne où il passe de devant à derrière chaque objet.

**Quoi essayer**
1. Le retournement (0,18 s) : trop rapide, trop lent ? Et sur le passage face/dos, gardé ou gênant ?
2. Le rythme des pas : est-ce que les jambes vont trop vite ou trop lentement par rapport au déplacement ?
3. Toucher derrière un objet sur téléphone : il bute contre l'objet (pas de contournement automatique). Est-ce gênant ? (voir questions)

**Nouveaux réglages (F2 ou ⚙)**
- Personnage : durée du retournement, épaisseur de la tranche, retournement face/dos, vitesse des pas.
- Affichage : réduire les animations (retournement instantané).

**Décisions prises seul (détails mineurs)**
- L'ordre devant/derrière se décide par une ligne de profondeur par objet (données du lieu). Le personnage ne change de plan qu'en la franchissant.
- Le personnage ne rapetisse pas encore en s'éloignant : c'est prévu en A2, avec la caméra.
- Les nouvelles images sont provisoires et générées. Le format des animations accepte une durée par image, ce qui permet le clignement sans code.

**À préparer par l'auteur** : rien pour l'instant.

**Proposition pour la séance suivante** : suite de l'étape A2 (échelle selon la profondeur, ombre, rebond et respiration, caméra qui glisse, banc d'essai).

---

## Séance 1 — 12/11/2026 — Socle et étape A1 (« le personnage est agréable à déplacer »)

**Jouable maintenant** : un rayon provisoire en papier découpé (Rayon 7). Un petit personnage en papier y marche, accélère et freine en douceur, se tourne (face/dos, gauche/droite en miroir) et bute contre la tête de gondole et le caddie. Pause, réglages en jeu, diagnostic, version affichée.

**Vérifié, et comment**
- Tests automatiques de la logique (Vitest) : 19 tests verts (accélération, freinage, arrivée pile au point visé sans dépasser, arrêt contre un obstacle, glissement le long d'un obstacle, pas fixe, machine à états, réglages).
- Tests dans un navigateur Chromium (Playwright) : 11 tests verts en taille PC (1600×900) et en téléphone simulé (914×411, densité 2,625, tactile, comme un Reno 2 dans Chrome). Couverts : clavier, clic, toucher, pause, réglages, diagnostic, **aucune erreur ni alerte dans la console**.
- Captures PC et téléphone simulé regardées à l'œil.
- Les temps mesurés par ce navigateur de test (sans carte graphique) **ne valent rien** et n'ont servi à aucune décision.
- **Pas vérifié ici, à faire par l'auteur** : le vrai téléphone (fluidité, toucher, plein écran), la manette (aucune manette ici), Firefox et Edge, et la publication sur GitHub Pages (outils GitHub indisponibles pendant la séance).

**Comment tester**
- PC : ZQSD ou flèches, ou clic sur le sol (garder le bouton appuyé pour guider). Échap : pause. F2 : réglages. F3 : diagnostic. F4 : zone de marche.
- Manette : stick gauche ou croix pour marcher, Start pour la pause.
- Téléphone, en paysage : bouton ⛶ pour le plein écran, puis toucher le sol (garder le doigt pour guider). Joystick virtuel en option dans ⚙ (moitié gauche de l'écran).
- Diagnostic : DBG → jouer une minute → « Copier le rapport » → coller dans la conversation.

**Quoi essayer**
1. La vitesse de marche (480) : trop lente, trop rapide pour traverser le rayon ?
2. Le démarrage et l'arrêt : vifs ou « savonneux » ? (Accélération 3600, freinage 4800.)
3. Sur téléphone : toucher pour aller, ou joystick virtuel ?

**Réglages disponibles (F2 ou ⚙)** : vitesse de marche, accélération, freinage, vitesse vers le fond, précision d'arrivée, joystick virtuel (taille), zone morte du stick, cadrage (remplir / tout montrer), densité de pixels max, pas fixe de la logique, affichage de la zone de marche. Les réglages modifiés sont gardés dans le navigateur ; « Copier mes réglages » permet de me les envoyer pour en faire les valeurs par défaut.

**Décisions prises seul (détails mineurs)**
- Les images sont redessinées une fois au chargement, à la résolution utile, plafonnée (densité 2 au plus). C'est ce qui rend le plafond réel avec un affichage DOM. Sur le Reno 2 en plein écran, cela donne environ 1,9 Mpx d'images en mémoire.
- Logique à 60 pas par seconde, et affichage lissé entre deux pas : le jeu est aussi fluide sur un écran 120 ou 144 Hz.
- Un clic hors du sol (sur l'étagère) vise le bord du sol le plus proche.
- Les touches sont lues par position : ZQSD (AZERTY) et WASD (QWERTY) fonctionnent toutes les deux.
- Pas encore de planificateur de délais ni de file de travail lourd : rien n'en a besoin en A1. Ils arriveront avec le scanner (A3).
- Le panneau de réglages ne se pilote pas encore à la manette (souris, doigt et clavier seulement).
- Profondeur (taille selon la distance), ombre, rebond, respiration et pivot de la feuille sont prévus en A2, comme convenu. Le changement de sens est donc instantané pour l'instant.

**À préparer par l'auteur** : rien pour l'instant.

**Proposition pour la séance suivante** : étape A2. Le personnage rapetisse vers le fond, avec ombre au sol, pivot de la feuille, rebond et respiration. La caméra glisse dans un rayon plus large que l'écran, avec parallaxe et un pilier au premier plan. Banc d'essai et premier test des comptages.
