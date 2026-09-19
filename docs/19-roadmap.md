# 19 — Roadmap

## Vue d'ensemble

```
Phase 0    POC + validation commerciale        4–6 sem.    BLOQUANTE
Phase 1    MVP plateforme (ALT-D)              10–14 sem.
Phase 2    Automatisation et anti-fraude        8–10 sem.
Phase 3    Intégration opérateurs              12–20 sem.  dépend de tiers
Phase 4    Scaling et publicité avancée        continu
```

**Deux chantiers démarrent à J0 et ne bloquent personne :** la négociation opérateur
(ALT-A) et le dossier INPDP. Leurs délais ne sont pas sous votre contrôle ; les lancer
tard est la première cause de retard sur ce type de projet.

---

## Phase 0 — Proof of Concept (4 à 6 semaines) — **BLOQUANTE**

### Fonctionnalités

**Chantier A — POC technique du mécanisme d'appel** (2–3 sem., 1 développeur)
Application Capacitor jetable, non connectée à la plateforme :
1. Écran « Appeler » avec saisie d'un numéro.
2. Lecture d'un créatif Opus de 4 s embarqué (aucun réseau).
3. Lancement de l'appel natif via `tel:`.
4. Plugin natif Android : `TelephonyCallback` → début/fin d'appel, durée sur horloge
   monotone.
5. iOS : documenter précisément ce qui est observable.
6. Journal local et écran de debug.
7. **Spike ALT-E** (3–5 jours, exploratoire) : faisabilité de `CallRedirectionService` +
   rôle de dialer par défaut. Objectif : savoir si c'est atteignable, pas le livrer.

**Chantier B — Validation commerciale** (parallèle, non technique)
1. Rencontrer 15 à 20 annonceurs locaux potentiels (restaurants, pharmacies, garages,
   commerces) dans 2 gouvernorats.
2. **Obtenir un CPM ou un prix de forfait mensuel qu'ils accepteraient réellement de
   payer**, par écrit.
3. Viser **5 lettres d'intention** signées.
4. Obtenir des devis de gros data auprès des trois opérateurs ou d'un agrégateur.
5. Obtenir des devis SMS auprès de deux agrégateurs locaux.

**Chantier C — Démarrages longs** (parallèle)
1. Premier contact avec TT, Orange TN, Ooredoo TN sur le RBT advertising (ALT-A).
2. Consultation juridique tunisienne : dossier INPDP (déclaration + autorisation de
   transfert à l'étranger), qualification du décret-loi 54.
3. Vérifier auprès de Twilio / Telnyx / Vonage / Infobip et d'un ITSP tunisien la
   disponibilité réelle de numéros +216 avec voix entrante (clôture la question ALT-B).

### Dépendances
Aucune. Peut démarrer immédiatement.

### Risques

| Risque | Mitigation |
|---|---|
| Les 4 s sont jugées trop pénibles par les utilisateurs | C'est précisément ce que le POC mesure. Un échec ici est un **résultat utile**, pas un accident |
| La détection d'appel Android est peu fiable sur l'entrée de gamme | Tester sur ≥ 6 modèles réels, pas sur émulateur |
| Les annonceurs refusent de citer un prix | Signal fort sur le risque n°1 — à remonter immédiatement |

### Complexité
**Faible techniquement** (~15 j/h). **Élevée commercialement.**

### Critères de validation (go / no-go)

```
TECHNIQUE
[ ] Lecture des 4 s fiable > 98 % sur ≥ 6 modèles Android + 2 iPhones
[ ] Démarrage à froid < 3 s sur Samsung A14 ou équivalent
[ ] Android : détection début/fin d'appel > 95 %, durée à ± 2 s
[ ] Aucune permission du groupe Call Log dans le manifeste
[ ] Comportement documenté sur iOS (attendu : aucune mesure possible)

UTILISATEUR
[ ] ≥ 70 % d'un panel de 20 personnes juge le délai acceptable
[ ] ≥ 60 % déclarent qu'elles utiliseraient l'app pour ~150 Mo/mois
[ ] Taux d'abandon sur l'écran de pub < 15 % en test

COMMERCIAL  ← LE PLUS IMPORTANT
[ ] ≥ 5 lettres d'intention d'annonceurs
[ ] CPM ou forfait accepté ≥ 4 TND équivalent  (§16 : seuil de viabilité)
[ ] Coût de gros data confirmé ≤ 4 millimes/Mo
[ ] Coût SMS confirmé ≤ 0,03 USD

JURIDIQUE
[ ] Chemin INPDP identifié, dossier engagé
```

> **Si le critère commercial échoue, ne passez pas en Phase 1.** Le risque n°1 du projet
> est la demande annonceur, pas la technique. Blyk et RingPlus avaient tous deux une
> technique qui fonctionnait.
>
> **Si le critère utilisateur échoue mais pas le commercial :** repensez le mécanisme
> (ALT-E sur Android, ou publicité écoutée à la demande dans l'app, sans lien avec
> l'appel) avant de construire la plateforme.

---

## Phase 1 — MVP (10 à 14 semaines)

### Fonctionnalités

| Lot | Contenu | Effort |
|---|---|---|
| **L1 — Fondations** | Monorepo, CI/CD, environnements, migrations 0001–0010, seed, design system RTL | 2 sem. |
| **L2 — Identité** | OTP SMS, profil, consentements, device binding + signature, rate limits | 2 sem. |
| **L3 — Inventaire** | Back-office : entreprises, campagnes, créatifs, upload + transcodage navigateur, validation, zones | 2,5 sem. |
| **L4 — Diffusion** | `AdDeliveryChannel`, moteur de sélection partagé, `/ad-bundle`, cache local, écran de diffusion | 2,5 sem. |
| **L5 — Valeur** | Ledger, wallet, `/sync`, plafonds, file locale, écrans points et historique | 2,5 sem. |
| **L6 — Récompenses** | Catalogue, `redeem_points()`, file back-office, fulfillment manuel, preuves | 1,5 sem. |
| **L7 — Pilotage** | Rollups, dashboard KPI, RBAC, audit, alertes critiques | 1,5 sem. |
| **L8 — Conformité** | Politique AR/FR, export, suppression, fiches store, mise en production | 1 sem. |

**Hors périmètre du MVP, volontairement :** portail web client, self-service annonceur,
facturation automatisée, Play Integrity, détection statistique, notifications push
avancées, mode sombre, délégations, ciblage par rayon, Realtime.

### Dépendances
Phase 0 validée. Fournisseur SMS contractualisé. Autorisation INPDP engagée.

### Risques

| Risque | Prob. | Mitigation |
|---|---|---|
| Rejet Play (permissions ou politique publicitaire) | Moyenne | Test CI sur le manifeste ; soumission de pré-revue dès la semaine 8 |
| Économie unitaire mal calibrée | Élevée | Barème en données ; alerte sur la marge dès le jour 1 ; §16 |
| Le transcodage navigateur est instable | Moyenne | Repli : accepter le MP3 tel quel, transcoder en Phase 2 |
| Performance Capacitor sur entrée de gamme | Moyenne | Mesuré en Phase 0 ; budget de performance en CI |
| SMS pumping dès l'ouverture | **Élevée** | Rate limits + plafond de dépense fournisseur **avant** la mise en production |

### Complexité
**Moyenne.** ~16 semaines-personnes. Équipe de 2 à 3 développeurs + 1 personne aux
opérations.

### Critères de validation

```
[ ] 100 utilisateurs réels pendant 4 semaines
[ ] > 90 % de taux de synchronisation
[ ] p95 /sync < 800 ms
[ ] 0 rupture d'intégrité du ledger sur 4 semaines
[ ] 0 écart wallet/ledger
[ ] ≥ 3 campagnes payantes réellement facturées
[ ] ≥ 20 conversions honorées, 0 point perdu ou dupliqué
[ ] Marge brute mesurée > 30 %
[ ] Applications acceptées sur Play (et App Store si retenu)
[ ] Autorisation INPDP obtenue ou en cours documenté
[ ] Restauration de sauvegarde testée
```

---

## Phase 2 — Automatisation et confiance (8 à 10 semaines)

### Fonctionnalités
1. **Onboarding agrégateur data** (Reloadly / Ding) — **à démarrer en semaine 1**, le
   délai KYC/contrat est de 4 à 10 semaines et il conditionne la Phase 3.
2. `RewardProvider` avec implémentation agrégateur, idempotence stricte, webhooks.
3. Play Integrity + App Attest, mode `limited`, canal de recours.
4. `verify_ledger_chain()` et contrôle de cohérence planifiés + alertes.
5. Règles de fraude de grappe (`R-CLUSTER-IP`, `R-CLUSTER-DEVICE`, `R-REINSTALL`).
6. Service de transcodage dédié + normalisation de loudness fiable.
7. **Kill-switch push** pour retirer un créatif en urgence.
8. Facturation annonceur : arrêté mensuel automatique, `campaign_invoices`.
9. Portail web client.
10. Notifications push : points validés, conversion honorée, expiration J−30 / J−7.

### Dépendances
MVP en production avec du volume réel. Données de fraude pour calibrer.

### Risques
Onboarding agrégateur plus long que prévu (**probable**) ; faux positifs d'attestation sur
le parc tunisien (**probable** — d'où le mode `limited` et le recours).

### Complexité
**Moyenne-élevée.** Le sujet le plus risqué est l'intégration agrégateur, et il est
majoritairement administratif.

### Critères de validation
```
[ ] > 80 % des conversions automatisées, 0 doublon de fulfillment
[ ] Faux positifs d'attestation < 10 %, recours traités < 48 h
[ ] Facturation mensuelle générée sans intervention
[ ] 1 000 utilisateurs actifs, marge brute > 30 %
```

---

## Phase 3 — Intégration opérateurs (12 à 20 semaines) — **dépend de tiers**

### Fonctionnalités
1. **Si un accord ALT-A aboutit :** ingesteur de CDR/logs d'exposition opérateur, nouvelle
   implémentation de `AdDeliveryChannel` côté serveur, réconciliation. **L'UX cible du §2
   devient enfin réelle**, et le volume d'impressions passe de ~6 à ~40/jour/utilisateur —
   ce qui rend finançable la promesse de plusieurs Go (§16).
2. **Si ALT-E est validé :** dialer Android natif, `CallRedirectionService`, revue Play.
3. Accord data direct avec un opérateur (meilleur COGS que l'agrégateur).
4. Détection d'anomalie statistique (nécessite 6 mois de données).
5. Délégations et segmentation avancée si le volume de campagnes le justifie.

### Dépendances
**Hors de votre contrôle.** Accord commercial opérateur, ou validation Play du rôle de
dialer.

### Risques
| Risque | Prob. | Impact |
|---|---|---|
| Aucun accord opérateur n'aboutit | **Élevée** | L'UX reste plafonnée à ALT-D, donc la récompense à ~150 Mo/mois |
| L'opérateur internalise le produit | Moyenne | Fatal — protéger par contrat d'exclusivité si possible |
| Rejet Play du rôle de dialer | Moyenne | Reste ALT-D sur Android |

### Critères de validation
```
[ ] 1 canal de diffusion supplémentaire en production
[ ] Impressions/utilisateur/mois multipliées par ≥ 3
[ ] Récompense mensuelle soutenable ≥ 500 Mo
```

---

## Phase 4 — Scaling (continu)

1. Découplage de l'ingestion (au-delà de ~50 000 utilisateurs, §15).
2. Read replica / entrepôt analytique.
3. Self-service annonceur.
4. Ciblage avancé, A/B testing de créatifs, optimisation de séquence.
5. Extension des récompenses : minutes d'appel, SMS, bons d'achat locaux.
6. Extension géographique (Maghreb) — **nouvelle analyse réglementaire par pays requise**.

---

## Chemin critique

```
S0 ──┬─ POC technique ────────┐
     ├─ Validation annonceurs ┤── GO/NO-GO ──► MVP ──► Production ──► Phase 2
     ├─ Dossier INPDP ────────┘   (S6)          (S20)     (S24)         (S34)
     ├─ Contact opérateurs ──────────────────────────────────────────► Phase 3 (S40+)
     └─ Onboarding agrégateur ─────────────────────────► prêt pour Phase 2 (S30)
```

**Le chemin critique n'est pas le développement.** C'est la validation commerciale
(semaine 6) puis l'onboarding agrégateur (à lancer en semaine 20 au plus tard pour être
prêt en semaine 30). Un projet de ce type échoue rarement faute de code.
