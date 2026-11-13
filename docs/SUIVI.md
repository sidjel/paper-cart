# Suivi des demandes de l'auteur

Toutes les demandes et remarques de l'auteur, avec leur état, pour ne rien perdre.
Mis à jour à chaque séance. États : ✅ fait · 🔧 à faire · 👀 fait, à revoir plus tard · ❓ décision en attente.

## Personnage
| Demande | Séance | État | Notes |
|---|---|---|---|
| Retournement de la feuille gauche/droite, façon Paper Mario | 2 | 👀 | « C'est ok mais à voir ». Durée réglable (0,18 s). |
| Retournement aussi de face à dos | 2 | ✅ | Confirmé par l'auteur (séance 4). |
| Images de marche (4 face, 4 dos) | 2 | ✅ | Provisoires, générées. |
| Clignement des yeux à l'arrêt | 2 | ✅ | Provisoire. |
| De dos, aller à gauche/droite : voir son visage, pas l'arrière de la tête | 3 | ✅ | De dos seulement en allant vers le fond. |
| Jambes en « moonwalk » | 3 | ✅ | Le pied levé passe devant. |
| Rythme des jambes | 4 | ✅ | « Oui » (bon rythme). |
| Respiration à l'arrêt | 5 | ✅ | Faite en A2 (séance 6), avec rebond, écrasement à l'arrêt, ombre au sol et taille selon la profondeur. Tout réglable. |
| Petit nuage de poussière à chaque pas, comme dans Paper Mario | 5 | ✅ | Taille, durée, opacité réglables ; désactivable. |
| Saut (secrets, monter sur des tabourets…) | 5 | 🔧 | Choix B (séance 6) : **saut libre** avec un bouton, partout, comme dans Paper Mario. À construire après le prototype A. VISION.md non modifié (à la demande de l'auteur seulement). |

## Marche et contrôles
| Demande | Séance | État | Notes |
|---|---|---|---|
| Sensation de marche (vitesse, démarrage, arrêt) | 4 | ✅ | Profil « Paper Mario » choisi (séance 5), devenu la valeur par défaut. Les autres profils restent dans le menu. |
| Toucher ou joystick virtuel sur téléphone | 4 | ✅ | Séance 8 : toucher par défaut, **joystick désactivé par défaut** (option gardée dans ⚙ → Contrôles). Vérifié par un test automatique. |
| Contourner seul les objets quand on touche derrière | 4 | ✅ | Choix A, validé en séance 5. |
| Difficile de viser le bord de la zone au doigt | 7 | ✅ | Toucher hors du sol (étagère, rayon de devant) envoie jusqu'au bord de la zone. Testé automatiquement. Validé (séance 8). |

## Décor
| Demande | Séance | État | Notes |
|---|---|---|---|
| Passer derrière le caddie et le présentoir « -30 % » | 2 | ✅ | |
| Zone de marche jusqu'en bas de l'écran | 3 | ✅ | Séance 7 : agrandie encore, du pied de l'étagère du fond (z 264) au bord bas de l'écran (z -195). |
| Rayon en bas, en transparence (personnage entouré de rayons) | 3 | ✅ | Opacité 0,55 : « oui pour le moment ». |
| Le plein écran cachait une partie du décor (écran 20:9) | 6 | ✅ | Réglé avec la caméra : toute la hauteur est toujours visible, un écran allongé montre plus de largeur. Le personnage paraît un peu plus petit sur téléphone : réglage « Zoom ». |
| Rayon plus long que l'écran, caméra qui suit, rayons lointains (parallaxe) | 6 | ✅ | A2 (2/2). Validé par l'auteur (séance 7). |
| Plein écran sur d'autres formes d'écran | 7 | ✅ | Testé automatiquement en 4:3, 16:10, 16:9, 20:9 et 21:9 : toute la hauteur, personnage et boutons visibles. |

## Son
| Demande | Séance | État | Notes |
|---|---|---|---|
| Bruits de pas | 3 | ✅ | Son étouffé, volume 0,35 : validé en séance 5. Garder toutes les options dans le menu. |
| Petite musique de supermarché (provisoire) | 3 | 👀 | « On la changera plus tard. » |
| La musique grésille sur le téléphone | 5 | ✅ | Réglé (confirmé par l'auteur, séance 6). |

## Fluidité
| Constat | Séance | État | Notes |
|---|---|---|---|
| Téléphone : 61 images/s, p95 16,5 ms, calcul 0,6 ms en moyenne | 5 | ✅ | Objectifs presque atteints : 4 images > 33 ms sur 2206. |
| Test T3 : rayons lointains, ancien contre nouveau | 15 | ✅ | Même protocole que le test rapide (4 conditions, ≈ 6 min). |
| Test plus court mais exploitable | 13 | ✅ | **Test rapide T0/T1/T2** (≈ 7 min) : référence, « réduire les animations », rayon de devant invisible, mesurés en alternance par blocs de 20 s (ordre inversé un tour sur deux), en marche avec caméra fixe et caméra mobile. Verdict avec marge d'incertitude à 95 %. Remplace les trois tests séparés. |
| Banc d'essai (parcours automatique, rapport à copier) | 8 | ✅ | ⚙ → Diagnostic → « Lancer le banc d'essai » : chauffe 3 s + 3 tours (~1 min). Interrupteurs d'essai : sans rayon de devant, sans rayons lointains, sans poussière, sans ombre. **À lancer par l'auteur sur son téléphone.** |
| Test automatique des comptages | 8 | ✅ | À chaque publication. Mesures : 39 éléments, 4 calques, 10 images visibles, surface d'image 1,85 × l'écran, 5,5 Mpx ; rien créé pendant le jeu. Limites dans tests/e2e/comptages-limites.json. |
| Banc d'essai sur le téléphone (9756425) : 58 i/s, p95 16,6 ms, mais p99 32,9 ms, 5 images > 33 ms, 163 images > 20 ms (5 %), calcul JS pire 21,3 ms | 9 | 🔧 | Séance 10 : deux bancs (5973115). Normal : 124 images > 20 ms (3,7 %), 3 > 33 ms, calcul JS pire 15 ms. Caméra immobile : 47 images > 20 ms (1,4 %), 3 > 33 ms, calcul pire 8,9 ms. **Le défilement de la caméra cause environ 60 % des saccades ; le reste a une autre cause.** Saccades isolées (1 à 3 images). Séance 11 : l'auteur veut d'abord un diagnostic fiable → **diagnostic en 4 configurations** construit (marche oui/non × caméra mobile oui/non, 60 s de chauffe, 3 × 60 s par configuration). En attente du rapport. **Pas d'essai PixiJS avant d'avoir examiné les résultats ensemble.** Séance 12 : résultats analysés (voir journal). Décision de l'auteur : mesurer d'abord (tests T0, T1, T2 sur le téléphone, sans changer le code), puis corriger une chose à la fois avec comparaison avant/après. PixiJS seulement si le système actuel ne peut pas atteindre les objectifs. |
| Chargement du lieu : 3,9 s sur le téléphone avec le rayon long | 9 | 👀 | Séance 10 : 1,2 s au rechargement (décor du fond 0,39 s). Acceptable pour l'instant. |
| Chargement du lieu : 8,2 s sur le téléphone | 5 | 👀 | Séance 6 : 1,4 s au rechargement (le décor du fond prend 0,44 s). Les 8 s venaient sans doute du premier téléchargement. À surveiller quand les vrais dessins arriveront. |
| Son : latence de sortie 176 ms sur le téléphone | 6 | 👀 | Les pas peuvent sonner un peu en retard. À vérifier au ressenti. |

## Points techniques à corriger (en attente des tests T0–T2)
| Constat | Source | État |
|---|---|---|
| Le personnage est redessiné pixel par pixel à chaque image, même immobile (respiration, rebond, retournement appliqués à un élément sans calque propre) | Comptages du navigateur de test (organisation du rendu) | 👀 Séance 14 : **réfuté comme cause sur le téléphone**. « Réduire les animations » n'améliore rien en marche (caméra fixe ×1,50, marge 0,91–2,46 ; caméra mobile ×1,30, marge 1,06–1,60). Pas prioritaire. Effet à l'arrêt non mesuré. |
| La poussière est redessinée à chaque image tant qu'elle est visible | Comptages du navigateur de test | 👀 Même conclusion (testée avec les animations dans T1) |
| Rayon de premier plan transparent : très coûteux quand la caméra bouge | **Téléphone**, test rapide 11f9d39 | ✅ Démontré : l'enlever divise par 2,2 les images lentes en caméra mobile (×0,45, marge 0,34–0,59 ; images > 33 ms : 11 → 2). Décision de l'auteur attendue (aspect visuel). |
| Rayons lointains dessinés sur toute une bande (3600×470) alors qu'on ne les voit que par deux ouvertures | Lecture du code + surface dessinée dans le navigateur de test | ❌ Séance 16 : **optimisation rejetée**. T3 sur le téléphone : caméra mobile ×1,30 d'images lentes (marge 1,05–1,59, blocs sans chevauchement), images > 33 ms 10 → 20. Code revenu à 1543360 (commit 859e158). |
| Observation (non traitée) : fond de page et calque de l'interface comptent pour environ 1,36 écran de surface dessinée par image (navigateur de test) | Journal du moteur | ❓ À étudier plus tard, seulement avec l'accord de l'auteur |
| Pics rares de calcul du jeu (14 à 22 ms, objectif ≤ 8 ms) | Téléphone | 🔧 Cause inconnue, à étudier séparément |
| Le rapport affiche toujours « écran maintenu allumé : non » : le maintien est relâché avant d'écrire le rapport (erreur du rapport, pas forcément du maintien) | Lecture du code | 🔧 Petite correction du rapport, à faire avec l'accord de l'auteur |

## Investigation de la caméra (séance 16, sans modification)
| Piste | Confiance | Test proposé |
|---|---|---|
| La caméra oblige à recomposer tout l'écran à chaque image | Démontré (×5,7 à ×6,3) | — |
| Le rayon de devant (opacité 0,55, parallaxe 1,25, boîte de 4300×1080 pour une image de 300 px de haut) | Démontré qu'il pèse ; quelle propriété : inconnu | Variantes : opaque / 0,55 / invisible ; boîte ajustée à l'image |
| Effet non linéaire (fréquence de la carte graphique, rythme du pipeline) : T1 et T3 retirent du travail et dégradent tous deux d'environ ×1,3 | Faible à moyenne | Traçage sur le téléphone |
| Nombre de calques qui bougent | Faible | Variante « parallaxe coupée » |
| Surface cachée (fond de page, bande lointaine sous le décor) | Faible (T3 ne l'a pas confirmée, mais T3 ajoutait aussi deux calques) | Variante « sans rayons lointains » |
| Calcul, mise en page, redessin, ménage mémoire | Écarté (mesures) | — |

## Appareil de référence et conditions de test
- OPPO Reno2 (CPH1907), Qualcomm SDM730G (Snapdragon 730G), Android 11, ColorOS 11.1, 8 Go de RAM. Le navigateur annonce « Android 10 » : c'est normal, Chrome fige cette information.
- Séance 17 : l'auteur active le **mode haute performance** et l'**extension de RAM** (8 Go + 3 Go pris sur le stockage), puis redémarre. Les tests suivants sont donc faits dans des conditions différentes des précédents (séances 10 à 16, mode normal).

## Résultat clé (séances 17 et 18)
| Test rapide, caméra mobile (B-T0) | Images > 20 ms/min | > 33 ms | Calcul pire |
|---|---|---|---|
| Mode normal, avant redémarrage (séances 14, 16) | 137,6 et 132,6 | 11 et 10 | 17,5 et 13,9 ms |
| Haute performance, après redémarrage + extension de RAM (séance 17) | 0,8 | 0 | 4,3 ms |
| **Mode normal, après redémarrage + extension de RAM (séance 18)** | **10,0** | **0** | **5,8 ms** |

- **En mode normal, après le redémarrage, les trois objectifs sont atteints** (60,8 i/s, aucune image > 33 ms, calcul ≤ 8 ms). Il reste environ 10 images ratées par minute quand la caméra bouge (0,3 % des images).
- Le mode haute performance n'explique qu'une petite partie (10 → 0,8). L'essentiel du gain (≈ 130 → 10) vient d'un autre changement : redémarrage (le plus probable), extension de RAM, ou état du téléphone avant redémarrage. Non démontré.
- « Réduire les animations » dégrade la caméra mobile en mode normal (×2,42, démontré ; ×1,30 en séance 14), mais pas en haute performance. Cela va dans le sens d'un effet de la gestion d'énergie : moins de travail, fréquence plus basse.
- Les mesures des séances 10 à 16 ont probablement été prises dans un état dégradé du téléphone : leurs valeurs absolues sont à relativiser.
- **PixiJS non justifié. Aucune optimisation nécessaire pour atteindre les objectifs dans l'état actuel.**

## Campagne de vérification (séance 19, téléphone dans son état actuel)
Demandée par l'auteur : refaire T1, T2, T3 dans l'état actuel (après redémarrage), et séparer les deux effets de l'ancien T3. Tout en caméra mobile, variantes alternées, 6 tours (≈ 15 min), rien de changé dans le jeu.
| Variante | Rayons lointains | Isole |
|---|---|---|
| T0 | bande entière (jeu) | référence |
| T1 | — | animations réduites |
| T2 | — | rayon de devant invisible |
| F0 | aucun (diagnostic) | surface en moins (et un calque en moins), sans calque ajouté |
| F1 | 2 fenêtres en calques à part | ancien T3 |
| F2 | bande + 2 fenêtres en calques à part | coût de 2 calques ajoutés, surface inchangée |
| F3 | 2 fenêtres dessinées dans le décor | surface en moins sans calque ajouté, mais décor redessiné aux ouvertures à chaque mouvement |
État : 🔧 en attente du rapport de l'auteur. A2 sera validée après.

## Réflexion pour plus tard : un rendu « intelligent » de la profondeur
Demande de l'auteur : le personnage pourra changer de plan ; garder ce qui sert la profondeur et la direction artistique sans calculer les surfaces invisibles. Principes, à confirmer par les mesures avant toute construction :
- décrire dans les données de chaque lieu les plans de profondeur et ce qui cache quoi (déjà en partie : pile de calques, points de référence) ;
- ne rien dessiner qui soit toujours caché ; mais **mesurer** chaque façon de l'éviter (T3 a montré qu'une solution logique peut coûter plus cher) ;
- éviter de multiplier les calques qui bougent ; préférer peu de calques bien choisis ;
- le changement de plan du personnage passe par l'ordre d'affichage (déjà en place), pas par de nouveaux calques.

## Étapes
| Étape | État | Notes |
|---|---|---|
| A1 — le personnage est agréable à déplacer | ✅ | **A1 validée : 1445d25** (séance 6). |
| A2 — le personnage semble évoluer dans un décor profond | ❓ | Tout est construit (séance 8). Reste : rapport du banc d'essai sur le téléphone, puis validation finale de A2 par l'auteur. |

## Interface
| Demande | Séance | État | Notes |
|---|---|---|---|
| Menu des réglages rangé en onglets par thème | 7 | ✅ | Validé (séance 8). Garder toutes les options dans le menu. |

## Règles de travail ajoutées par l'auteur
- Donner le lien pour jouer à chaque fin de conversation (séance 4).
- Noter tous les changements et modifications pour ne pas se perdre : ce fichier (séance 4).
- Garder toutes les options dans le menu des réglages, même validées (séances 5 et 7).

## Questions de l'auteur (réponses données)
- Faut-il dessiner les personnages avant l'étape suivante ? Non : les dessins arrivent au prototype D, préparé une séance à l'avance avec docs/IMAGES.md (séance 5).
