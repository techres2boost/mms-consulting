# 20 — Risk register

Échelles : **Probabilité** faible / moyenne / élevée — **Impact** mineur / modéré /
majeur / fatal (met fin au projet).

Trié par criticité décroissante.

---

## Risques fatals

### R1 — Demande annonceur insuffisante
**Probabilité : élevée · Impact : fatal**

Deux précédents documentés ont échoué exactement là : **Blyk** (MVNO financé par la
publicité, fermé — diagnostic public : manque de couverture pour intéresser les
annonceurs, base restée dans les basses centaines de milliers, et annonceurs plus
intéressés par l'étude de marché que par la campagne de marque) et **RingPlus**
(publicité entre numérotation et connexion, fermé en 2017 faute d'annonceurs suffisants
par zone).

**Mitigation**
- **Bloquer la Phase 1** sur l'obtention de 5 lettres d'intention annonceurs (§19).
- Exiger un CPM ou forfait écrit ≥ 4 TND équivalent avant tout développement.
- Suivre le **taux d'occupation de l'inventaire** dès le mois 1 (§17).
- Démarrer sur 2 gouvernorats seulement : mieux vaut un inventaire dense sur Tunis-Ariana
  qu'un inventaire vide sur 24 gouvernorats.
- Plan B : pivoter vers un forfait mensuel par zone (plus facile à vendre localement
  qu'un CPM).

**Indicateur d'alerte précoce :** fill rate < 85 % ou moins de 10 annonceurs actifs au
mois 3.

---

### R2 — Économie unitaire négative
**Probabilité : élevée · Impact : fatal**

Le barème initialement envisagé (~1 000 points/mois, 500 points → 3 Go) produit **−767 %
de marge à un CPM de 5 TND** (§16, calcul vérifié). Le risque n'est pas théorique : il
était présent dans l'hypothèse de départ.

**Mitigation**
- Barème **dérivé** de la contrainte `coût_par_point ≤ 0,5 × revenu_par_point`, et
  encodé comme tel dans le seed.
- Barème et catalogue en **données** (`point_rules`, `data_packages`), modifiables sans
  déploiement.
- **Alerte critique sur la marge brute < 20 %** dès la mise en production.
- Plafond journalier bas par défaut (6), à augmenter seulement après mesure du CPM réel.
- Kill-switch : possibilité de suspendre l'accrual sans couper le service.

**Indicateur d'alerte :** marge brute glissante 7 jours < 25 %.

---

## Risques majeurs

### R3 — Aucun accord opérateur n'aboutit
**Probabilité : élevée · Impact : majeur**

ALT-A est le seul chemin vers l'UX du §2 **et** vers le volume d'impressions qui finance
une récompense de plusieurs Go. Sans accord, le produit reste plafonné à ~150 Mo/mois.

**Mitigation**
- **Ne jamais mettre ALT-A dans le chemin critique de développement** (§04, principe P4 :
  abstraction `AdDeliveryChannel`).
- Contacter les trois opérateurs dès J0, en parallèle.
- Préparer ALT-E (dialer Android) comme montée en gamme alternative, sans dépendance
  tierce.
- Caler la promesse marketing sur ALT-D, pas sur ALT-A.

---

### R4 — Friction des 4 secondes → contournement ou abandon
**Probabilité : moyenne · Impact : majeur**

Rien n'empêche l'utilisateur d'appeler depuis son dialer natif. Si les 4 s sont pénibles,
l'app devient un simple portefeuille sans inventaire.

**Mitigation**
- Mesuré en Phase 0 sur panel réel (critère de sortie : < 15 % d'abandon).
- Plafond de fréquence : 1 pub toutes les 10 min, pas à chaque appel.
- **Récompenser, ne jamais contraindre** : l'app doit être le chemin le plus avantageux,
  pas le seul.
- Bouton « Annuler l'appel » toujours actif (§18).
- Suivre le **taux d'abandon sur l'écran de diffusion** comme KPI produit principal.

---

### R5 — Rejet ou retrait des stores
**Probabilité : moyenne · Impact : majeur**

Motifs plausibles : permissions du groupe Call Log, politique sur les récompenses liées à
la publicité, fiche Data Safety incohérente, rôle de dialer par défaut (ALT-E).

**Mitigation**
- **Test CI qui échoue** si `READ_CALL_LOG` / `WRITE_CALL_LOG` /
  `PROCESS_OUTGOING_CALLS` apparaît dans le manifeste.
- Points **ni transférables ni convertibles en argent**, formulés comme un programme de
  fidélité télécom.
- Récompense sur **écoute**, jamais sur clic.
- Fiches Data Safety / App Privacy remplies avec exactitude.
- Soumission de pré-revue dès la semaine 8 de la Phase 1.
- Envisager **Android seul** au lancement (§05) : réduit la surface de risque de 50 %.

---

### R6 — Fraude sur les événements offline
**Probabilité : élevée · Impact : modéré** (borné par conception)

Un appareil rooté peut produire des événements signés décrivant des faits inexistants.
C'est irréductible (§10).

**Mitigation**
- **Plafonds serveur** : perte maximale ~190 points/mois/compte ≈ 0,14 USD.
- **Numéro cible = numéro du compte** : une ferme de N comptes exige N cartes SIM.
- Ancienneté minimale de 72 h avant conversion.
- Attestation Play Integrity / App Attest en Phase 2, avec mode `limited`.
- Détection statistique en Phase 3.
- **Budgéter 2 à 5 % des points distribués comme perte de fraude acceptée.**

---

### R7 — Le traitement manuel des conversions devient le goulot
**Probabilité : élevée · Impact : majeur**

À ~15 000 utilisateurs : ~450 conversions/mois ≈ un mi-temps. À 50 000 : deux temps pleins
(§15).

**Mitigation**
- `RewardProvider` défini dès le MVP, avec une seule implémentation.
- **Onboarding agrégateur lancé en Phase 2 semaine 1** (délai KYC 4 à 10 semaines).
- Suivre la **profondeur de la file de conversions** avec alerte à 100.
- Paliers de conversion élevés : cela réduit le nombre de demandes à traiter.

---

### R8 — Facture SMS explosive (*SMS pumping*)
**Probabilité : moyenne · Impact : majeur**

Attaque automatisée sur l'envoi d'OTP vers des numéros surtaxés. Plusieurs milliers
d'euros en une nuit, avant le premier utilisateur payant.

**Mitigation**
- Rate-limit multi-dimension (numéro, préfixe, IP, appareil) dès le jour 1.
- **Plafond de dépense quotidien configuré chez le fournisseur** — le filet ultime.
- Liste blanche des préfixes mobiles tunisiens valides.
- Alerte si le volume horaire dépasse 3× la moyenne.
- Délai croissant entre renvois (60 s, 180 s, 600 s).

---

## Risques modérés

### R9 — Non-conformité INPDP / transfert de données à l'étranger
**Probabilité : moyenne · Impact : majeur**

La loi 2004-63 impose une **déclaration préalable** du traitement et une **autorisation
préalable** pour tout transfert de données personnelles hors de Tunisie (art. 47, 50–52).
Héberger sur Supabase (AWS) et Vercel constitue un tel transfert.

**Mitigation**
- **Engager le dossier en Phase 0**, avec un conseil juridique tunisien.
- Minimisation maximale par conception : pas de numéro appelé, pas de localisation
  précise, gouvernorat seulement (§12) — c'est le meilleur argument du dossier.
- Faire qualifier l'interaction avec le décret-loi 54 de 2022 par un juriste local.
- Plan de repli : hébergement en Tunisie ou dans une région européenne, avec dossier
  adapté.

---

### R10 — Performance insuffisante de Capacitor sur l'entrée de gamme
**Probabilité : moyenne · Impact : modéré**

Le parc tunisien réel comporte beaucoup d'appareils à 2–3 Go de RAM.

**Mitigation**
- Testé en Phase 0 sur ≥ 6 modèles réels (critère : démarrage à froid < 3 s).
- Budget de performance vérifié en CI (taille de bundle, temps de démarrage).
- Voie de sortie identifiée : React Native ou Flutter, ou Android natif si ALT-E est
  retenu (§05).

---

### R11 — Dépendance à un fournisseur unique (Supabase / Vercel)
**Probabilité : faible · Impact : modéré**

**Mitigation**
- La base est du **PostgreSQL standard** : aucun runtime propriétaire dans le métier.
- Toute la logique de valeur est en fonctions SQL, portables telles quelles.
- `pg_dump` hebdomadaire chiffré vers un stockage objet tiers.
- Les Edge Functions sont du TypeScript/Deno, portable vers des Route Handlers Node.
- Migration évaluée au palier 100 k (§15), sur critère de coût et non de principe.

---

### R12 — Asymétrie iOS mal acceptée
**Probabilité : moyenne · Impact : modéré**

Les utilisateurs iOS gagnent structurellement moins (pas de bonus d'appel) et ne peuvent
pas être mesurés.

**Mitigation**
- **Bonus d'appel désactivé par défaut dans le barème retenu** : l'écart devient nul.
  C'est la mitigation la plus propre, et elle est déjà appliquée dans le seed.
- Si le bonus est activé plus tard : l'expliquer honnêtement dans l'aide.
- Envisager de ne pas lancer iOS au MVP (§05).

---

### R13 — L'opérateur partenaire internalise le produit
**Probabilité : moyenne · Impact : fatal** (si ALT-A devient la base du modèle)

Un opérateur qui voit fonctionner le RBT advertising peut le reprendre en interne.

**Mitigation**
- **Ne pas faire dépendre le modèle économique d'ALT-A** : ALT-D doit être rentable seul.
- Négocier une exclusivité limitée dans le temps.
- Votre actif défendable est la **base d'annonceurs locaux et la relation commerciale**,
  pas la technique — l'opérateur n'a ni l'un ni l'autre.
- Diversifier : viser les trois opérateurs plutôt qu'un seul.

---

## Synthèse

| # | Risque | Prob. | Impact | Criticité |
|---|---|---|---|---|
| R1 | Demande annonceur insuffisante | élevée | fatal | 🔴🔴🔴 |
| R2 | Économie unitaire négative | élevée | fatal | 🔴🔴🔴 |
| R3 | Aucun accord opérateur | élevée | majeur | 🔴🔴 |
| R4 | Friction des 4 s | moyenne | majeur | 🔴🔴 |
| R7 | Goulot du traitement manuel | élevée | majeur | 🔴🔴 |
| R5 | Rejet des stores | moyenne | majeur | 🔴 |
| R6 | Fraude offline | élevée | modéré | 🔴 |
| R8 | Facture SMS | moyenne | majeur | 🔴 |
| R9 | Conformité INPDP | moyenne | majeur | 🔴 |
| R13 | Internalisation par l'opérateur | moyenne | fatal* | 🔴 |
| R10 | Performance entrée de gamme | moyenne | modéré | 🟠 |
| R12 | Asymétrie iOS | moyenne | modéré | 🟠 |
| R11 | Dépendance fournisseur | faible | modéré | 🟡 |

\* fatal seulement si ALT-A devient le socle du modèle — d'où la recommandation de ne
jamais l'y placer.

**Observation d'ensemble : les deux risques fatals sont commerciaux, pas techniques.**
Le dossier technique de ce projet est maîtrisable ; son modèle économique est le vrai
sujet. C'est pourquoi la Phase 0 consacre autant d'effort à la validation annonceur qu'au
POC, et pourquoi le critère de sortie commercial est bloquant.
