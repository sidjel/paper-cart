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
| Banc d'essai (parcours automatique, rapport à copier) | 8 | ✅ | ⚙ → Diagnostic → « Lancer le banc d'essai » : chauffe 3 s + 3 tours (~1 min). Interrupteurs d'essai : sans rayon de devant, sans rayons lointains, sans poussière, sans ombre. **À lancer par l'auteur sur son téléphone.** |
| Test automatique des comptages | 8 | ✅ | À chaque publication. Mesures : 39 éléments, 4 calques, 10 images visibles, surface d'image 1,85 × l'écran, 5,5 Mpx ; rien créé pendant le jeu. Limites dans tests/e2e/comptages-limites.json. |
| Banc d'essai sur le téléphone (9756425) : 58 i/s, p95 16,6 ms, mais p99 32,9 ms, 5 images > 33 ms, 163 images > 20 ms (5 %), calcul JS pire 21,3 ms | 9 | 🔧 | Séance 10 : deux bancs (5973115). Normal : 124 images > 20 ms (3,7 %), 3 > 33 ms, calcul JS pire 15 ms. Caméra immobile : 47 images > 20 ms (1,4 %), 3 > 33 ms, calcul pire 8,9 ms. **Le défilement de la caméra cause environ 60 % des saccades ; le reste a une autre cause.** Saccades isolées (1 à 3 images). Décision de l'auteur attendue : essai PixiJS sur une branche, correctifs DOM, ou on continue. |
| Chargement du lieu : 3,9 s sur le téléphone avec le rayon long | 9 | 👀 | Séance 10 : 1,2 s au rechargement (décor du fond 0,39 s). Acceptable pour l'instant. |
| Chargement du lieu : 8,2 s sur le téléphone | 5 | 👀 | Séance 6 : 1,4 s au rechargement (le décor du fond prend 0,44 s). Les 8 s venaient sans doute du premier téléchargement. À surveiller quand les vrais dessins arriveront. |
| Son : latence de sortie 176 ms sur le téléphone | 6 | 👀 | Les pas peuvent sonner un peu en retard. À vérifier au ressenti. |

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
