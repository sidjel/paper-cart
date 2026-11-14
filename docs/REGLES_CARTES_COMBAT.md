# Règles des cartes et du combat

> Lire seulement pour B et C (combat, vieillissement, combos). Balises : ✅ VALIDÉ · 🧪 À TESTER · ❓ À DÉFINIR · [TEMP] provisoire.
> Avant de coder B : une page de règles exactes et 12 cartes de départ, à faire valider (`PROTOTYPES.md`).

## Combat face à face ✅ VALIDÉ (prototype B)
- **Abandon de l'ancien plateau 5×2** de Maxi-Gouffre.
- Face à face, tour par tour, sans chrono (*Baten Kaitos*, *Final Fantasy*).
- Points de vie des deux côtés.
- Panier de 12 cartes, main de 5, jusqu'à 3 cartes jouées par tour.
- L'ennemi **annonce son prochain coup**.
- Jauge épique et attaque ultime mise en scène : prototype C.

## 4 familles d'évolution des cartes ✅ VALIDÉ (esprit *Baten Kaitos*)
1. **Stables** : ne vieillissent jamais (outils, objets fixes) ; utiles au combat ou en fusion.
2. **Périssables** : Frais = soin ou protection ; Mûr = meilleur effet ; Pourri = arme ou poison lancé.
3. **Évolutives (fermentation)** : se bonifient avec le temps (ex. Lait → Fromage Vivant, Kévin → Kévin Syndiqué).
4. **À potentiel de fusion** : fusionnables selon leurs propriétés ou à un stade précis.
- Règle **Surgelé** 🧪 À TESTER : longtemps Frais, très brièvement Mûr, puis Pourri.

## Déclenchement du vieillissement ❓ À DÉFINIR (avant B)
- **A** : temps de jeu écoulé, hors menus et pauses (comme *Baten Kaitos*).
- **B** : par actions de jeu ou cartes jouées.
- **C** : hybride.

## Réserve de cartes et de fusions 🧪 À TESTER
Reprise de `docs/archive/maxi-gouffre-GAME_DESIGN.md` §7.3 et §7.4. **Effets de plateau et puissances à réécrire** pour le face à face avant de coder B (ici : noms des stades et notes seulement).
- **20 familles** (Frais → Mûr → Pourri) :
  - banane : Banane Verte → Banane Parfaite → Bouillie Brune (malus)
  - steak : Steak Haché Premier Prix → Steak Douteux → Bactérie Mortelle
  - lait : Lait Entier → Lait Tourné → Fromage Vivant (fermentation)
  - baguette : Pain Baguette → Baguette Dure → Poussière de Pain
  - glace : Glace Vanille → Soupe Sucrée → Flotte Collante (surgelé, malus)
  - pizza : Pizza Ananas → Pizza Tiède → Scandale Culinaire (malus, ne fusionne avec rien)
  - pile : Pile LR6 Neuve → Pile Faible → Acide de Pile (malus)
  - céréales : Céréales Fluo → Céréales Molles → Sucre Toxique
  - influenceur : Influenceur Fitness → Influenceur Fatigué → Influenceur Annulé (malus)
  - enfant : Enfant Hurlant → Enfant Épuisé → Enfant Endormi
  - console : Console Portable → Console Rayée → Console Brickée
  - papier : Papier Toilette → Dernier Rouleau → Carton Vide (monnaie de troc)
  - bière : Bière Fraîche → Bière Chaude → Vomi de Soirée (malus)
  - kévin : Kévin (Caissier) → Kévin (Démissionnaire) → Kévin (Syndiqué) (fermentation)
  - mixeur : Mixeur Bon Marché → Mixeur Surchauffé → Explosion Électrique (outil)
  - scotch : Scotch Gris → Scotch Poussiéreux → Colle Sèche (outil joker)
  - plante : Plante Verte → Plante Florissante → Tige Morte
  - chat : Chat Errant → Gros Matou → Boule de Poils (mange la Bactérie Mortelle)
  - cassette : Cassette Maudite → Bande Démagnétisée → Entité Libérée (rare, fermentation)
  - grand-mère : Grand-Mère Perdue → Grand-Mère Paniquée → Héritage (PNJ allié, fermentation)
- **6 recettes** : Milkshake Protéiné (banane + lait) · Burger Gras (steak + baguette) · Petit-Dèj Épique (lait + céréales) · Ado Muet (enfant + console) · Plante Mutante (plante + pile pourrie) · Lance de Fortune (baguette + scotch).

## Déjà en place dans le jeu (provisoire, d'après le code)
- 12 produits scannables (`src/data/products.json`) : 10 sur l'étagère, 1 sur une table, 1 dans le caddie.
- Une carte = nom, puissance, stade de départ (Frais ou Mûr), propriétés ; icône de stade (forme + couleur).
- Le Panier liste les cartes, sans interaction. Pas de vieillissement, pas de familles, pas de combat.
