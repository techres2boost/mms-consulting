# 14 — Back-office et RBAC

## 14.1 Arborescence

```
/login                                  MFA obligatoire
/
├── /dashboard                          KPI temps réel (depuis les rollups)
│
├── /customers
│   ├── /                               liste, recherche, filtres
│   ├── /[id]                           fiche client
│   │   ├── /overview                   profil, statut, zone, opérateur, appareil
│   │   ├── /wallet                     solde + ledger complet + ajustement manuel
│   │   ├── /activity                   impressions, appels, synchros
│   │   ├── /redemptions                historique des conversions
│   │   ├── /fraud                      événements de fraude liés
│   │   └── /consents                   historique des consentements
│   └── /suspended                      file des comptes suspendus
│
├── /companies
│   ├── /                               liste, recherche
│   ├── /new
│   └── /[id]                           fiche + campagnes + factures
│
├── /campaigns
│   ├── /                               liste avec filtres statut/zone/annonceur
│   ├── /new                            assistant en 4 étapes
│   ├── /[id]
│   │   ├── /overview                   paramètres, dates, budget, priorité
│   │   ├── /creatives                  créatifs, upload, écoute, validation
│   │   ├── /zones                      ciblage géographique
│   │   ├── /stats                      impressions, reach, budget, par zone
│   │   └── /invoices                   arrêtés mensuels
│   └── /review                         **file de validation** (pending_review)
│
├── /rewards
│   ├── /packages                       catalogue data par opérateur
│   ├── /redemptions                    **file de traitement** ← écran le plus utilisé
│   │   └── /[id]                       traitement : exécuter, référence, preuve
│   └── /operators                      référentiel
│
├── /geography
│   ├── /zones                          arborescence gouvernorats/délégations
│   └── /coverage                        carte de répartition des utilisateurs
│
├── /fraud
│   ├── /queue                          événements ouverts, par sévérité
│   ├── /[id]                           instruction : preuves, décision, recours
│   └── /rules                          seuils (lecture ; écriture = admin)
│
├── /analytics
│   ├── /product                        DAU, MAU, rétention, activation
│   ├── /advertising                    impressions, reach, fréquence, fill rate
│   ├── /finance                        revenus, COGS, marge, points distribués
│   ├── /telecom                        appels, durées, taux de diffusion
│   └── /sync                           taux de synchro, erreurs, latence
│
├── /billing
│   ├── /invoices                        factures annonceurs
│   └── /new
│
├── /settings                            admin uniquement
│   ├── /employees                       CRUD, rôles, périmètres
│   ├── /point-rules                     barème versionné
│   ├── /system                          plafonds, TTL, feature flags
│   └── /audit                           journal d'audit, recherche
│
└── /account                             profil de l'employé, MFA
```

**Les deux écrans qui décident de la viabilité opérationnelle :**
`/rewards/redemptions` (traitement manuel des conversions — le coût humain récurrent) et
`/campaigns/review` (validation des créatifs). Ce sont eux qu'il faut concevoir en premier
et optimiser pour la vitesse, pas le dashboard.

---

## 14.2 RBAC

### Quatre rôles

| Rôle | Profil type | Principe |
|---|---|---|
| **admin** | Fondateur, CTO | Tout, y compris les employés et les barèmes |
| **manager** | Responsable d'exploitation | Tout l'opérationnel + **validation** + ajustement de points. Pas la gestion des employés ni des réglages système |
| **operator** | Employé back-office | **Saisie** : entreprises, campagnes, créatifs, traitement des conversions. **Aucune validation, aucun ajustement de points** |
| **analyst** | Analyste, investisseur, comptable | **Lecture seule** intégrale |

### Matrice de permissions

| Permission | admin | manager | operator | analyst |
|---|---|---|---|---|
| `customers:read` | ✅ | ✅ | ✅ | ✅ |
| `customers:write` (suspendre, modifier) | ✅ | ✅ | ❌ | ❌ |
| `companies:read` / `:write` | ✅ | ✅ | ✅ | read |
| `campaigns:read` / `:write` | ✅ | ✅ | ✅ | read |
| **`campaigns:approve`** | ✅ | ✅ | ❌ | ❌ |
| `ads:read` / `:write` | ✅ | ✅ | ✅ | read |
| **`ads:approve`** | ✅ | ✅ | ❌ | ❌ |
| `zones:read` | ✅ | ✅ | ✅ | ✅ |
| `zones:write` | ✅ | ❌ | ❌ | ❌ |
| `wallets:read` | ✅ | ✅ | ❌ | ✅ |
| **`wallets:adjust`** | ✅ | ✅ | ❌ | ❌ |
| `redemptions:read` / `:write` | ✅ | ✅ | ✅ | read |
| `rewards:read` | ✅ | ✅ | ✅ | ✅ |
| `rewards:write` (catalogue et **prix**) | ✅ | ✅ | ❌ | ❌ |
| `fraud:read` / `:write` | ✅ | ✅ | ❌ | read |
| `analytics:read` | ✅ | ✅ | ✅ | ✅ |
| `audit:read` | ✅ | ✅ | ❌ | ❌ |
| `billing:read` | ✅ | ✅ | ❌ | ✅ |
| `billing:write` | ✅ | ❌ | ❌ | ❌ |
| `employees:*` | ✅ | ❌ | ❌ | ❌ |
| `settings:*` | ✅ | ❌ | ❌ | ❌ |

Implémenté en données dans `role_permissions` (§07, seedé en `sql/0009_seed.sql`) et
appliqué par RLS via `employee_has()` (§`sql/0008_rls.sql`). Modifier une permission ne
nécessite donc aucun déploiement.

### Les quatre séparations de rôles à ne pas négocier

1. **Celui qui saisit une campagne ne la valide pas.** Contrainte appliquée en base :
   `campaign_segregation check (approved_by <> created_by)`. Empêche qu'un opérateur
   mette en ligne un créatif non contrôlé.
2. **Un `operator` ne peut pas ajuster des points.** C'est le seul chemin de création de
   valeur arbitraire : il doit être réservé aux rôles responsables et **toujours motivé**
   (`reason` obligatoire en base).
3. **Un `operator` ne modifie pas les prix du catalogue.** Baisser `points_cost` d'un
   package est équivalent à distribuer de la valeur.
4. **Personne ne peut supprimer `audit_logs`.** Trigger + `REVOKE`, y compris pour
   `admin`.

### Portée géographique

`employees.zone_scope uuid[]` permet de limiter un opérateur à un périmètre (par exemple
un commercial au Sud). Vide = accès à toutes les zones. **Non exposé dans l'UI du MVP**
mais présent en base : c'est le genre de besoin qui apparaît au recrutement du troisième
commercial, et rétrofitter une portée dans un RBAC existant est pénible.

---

## 14.3 Écran critique : traitement d'une conversion

```
┌──────────────────────────────────────────────────────────────────────┐
│ Conversion #R-8821                                    ⚠ Score fraude 12│
├──────────────────────────────────────────────────────────────────────┤
│ Client      Amira B.  (+216 2X XXX XX8)          [Fiche client →]     │
│ Compte créé 12/07/2026  (69 jours)        Zone  Ariana                │
│ Statut      active     Appareil  Samsung A14 (attesté ✅)             │
│                                                                       │
│ Demande     500 points → 3 Go Ooredoo                                 │
│ Coût        6 500 millimes (6,50 TND)                                 │
│ Numéro      +216 2X XXX XX8  ✅ identique au compte                    │
│ Demandée    19/09/2026 14:32                                          │
│                                                                       │
│ CONTRÔLES AUTOMATIQUES                                                │
│ ✅ Solde confirmé suffisant (520 pts)                                  │
│ ✅ Ancienneté ≥ 72 h                                                   │
│ ✅ Numéro cible vérifié = numéro du compte                             │
│ ✅ Aucun événement de fraude ouvert                                    │
│ ✅ Cumul 30 j : 3 Go / 6 Go autorisés                                  │
│ ✅ Opérateur cohérent avec le profil déclaré                           │
│                                                                       │
│ HISTORIQUE   4 conversions, 4 honorées, 0 échec                       │
│                                                                       │
│ ─── TRAITEMENT ──────────────────────────────────────────────────────  │
│ Référence opérateur  [ OOR-________ ]                                 │
│ Preuve               [ Déposer un fichier ]                            │
│ Note                 [ ______________________________ ]                │
│                                                                       │
│      [ Honorer ]        [ Échec → restituer les points ]   [ Annuler ] │
└──────────────────────────────────────────────────────────────────────┘
```

**Points de conception :**
- Tous les contrôles sont **déjà faits** à l'affichage. L'opérateur ne vérifie rien
  manuellement : il exécute. C'est ce qui permet de traiter 50 conversions en 30 minutes
  au lieu de 3 heures.
- Le numéro est **masqué** (`+216 2X XXX XX8`) sauf action explicite « révéler », elle-même
  journalisée dans `audit_logs`.
- « Échec » déclenche automatiquement le reversal au ledger (`fail_redemption()`,
  vérifié par le test T6). L'opérateur n'a jamais à toucher aux points.
- Aucun bouton ne permet de modifier le montant de points. La demande est immuable.

---

## 14.4 Dashboard KPI

Alimenté **exclusivement** par `daily_campaign_stats` et `daily_user_stats` — jamais par
les tables brutes. C'est ce qui garantit qu'un dashboard reste instantané à 100 000
utilisateurs.

```
┌─ UTILISATEURS ──────────────┬─ PUBLICITÉ ────────────────┐
│ Total inscrits      12 480  │ Impressions (J-1)  184 220 │
│ Actifs 7 j           6 210  │ Complètes           94,2 % │
│ Actifs 30 j          9 840  │ Campagnes actives       27 │
│ Nouveaux (J-1)         142  │ Reach unique (J-1)   5 890 │
│ Suspendus               38  │ Fréquence moyenne     3,1  │
│                             │ Fill rate            98,4 % │
├─ TÉLÉPHONIE ────────────────┼─ POINTS ───────────────────┤
│ Appels (J-1)        58 400  │ Distribués (J-1)   372 100 │
│ Minutes (J-1)       96 200  │ Consommés (J-1)    128 400 │
│ Durée moyenne        1,6 mn │ En circulation    4 210 000 │
│ Taux de diffusion    71,3 % │ Expirés (J-1)       18 200 │
│ Mesurés (Android)    82,1 % │                             │
├─ FINANCE ───────────────────┼─ SANTÉ ────────────────────┤
│ Revenus pub (mois)  8 420 TND│ Taux de synchro     96,8 % │
│ Coût data (mois)    6 180 TND│ Erreurs /sync        0,4 % │
│ Marge brute         2 240 TND│ p95 /sync           340 ms │
│ MARGE               26,6 % ⚠ │ Fraude ouverte           12 │
│ Conversions à traiter    47 ⚠ │ Intégrité ledger      ✅ OK │
└─────────────────────────────┴────────────────────────────┘
```

**Les trois indicateurs à mettre en évidence permanente, parce qu'ils peuvent tuer le
produit :**
1. **Marge brute** (revenus pub − coût data). Si elle passe sous 20 %, il faut agir sur
   les plafonds ou le barème **le jour même**. Une alerte automatique est nécessaire.
2. **Conversions à traiter.** Si la file dépasse 100, le coût humain devient le goulot.
3. **Intégrité du ledger** (`verify_ledger_chain` + cohérence wallet/ledger). Rouge =
   incident majeur, tout le reste attend.

---

## 14.5 Gestion des créatifs (validation)

```
┌──────────────────────────────────────────────────────────────┐
│ File de validation — 6 créatifs en attente                    │
├──────────────────────────────────────────────────────────────┤
│ ▶ Restaurant XYZ · v1 · AR · 4,12 s · 16,2 Ko                │
│   ▓▓▒▒▓▓▓▒▒▓▓▒░  [◀◀ ▶ ▶▶]  volume ▬▬▬▬●▬▬               │
│   Campagne  Promo rentrée · Tunis + Ariana · 15/09 → 15/10    │
│   Déposé par  Sami (operator) · 18/09 16:04                   │
│                                                               │
│   CONTRÔLES AUTOMATIQUES                                      │
│   ✅ Durée 4,12 s (2–8 s)      ✅ Opus 32 kbps mono            │
│   ✅ Loudness −16,1 LUFS        ✅ Pic −1,2 dBTP               │
│   ✅ Silence 18 % (< 50 %)       ✅ Taille 16,2 Ko (< 200 Ko)   │
│   ✅ Hash unique                                               │
│                                                               │
│   À CONTRÔLER HUMAINEMENT                                     │
│   ☐ Contenu conforme (pas de contenu interdit / trompeur)     │
│   ☐ Marque annoncée = entreprise enregistrée                  │
│   ☐ Qualité d'enregistrement acceptable                       │
│   ☐ Langue cohérente avec le ciblage                          │
│                                                               │
│        [ Approuver ]   [ Rejeter avec motif ]   [ Écouter ]   │
└──────────────────────────────────────────────────────────────┘
```

**Le rejet exige un motif**, transmis à l'opérateur qui a déposé — sans quoi le même
créatif est redéposé à l'identique.

**La forme d'onde est plus utile qu'on ne le croit** : elle révèle instantanément un
fichier silencieux, tronqué, ou saturé, sans avoir à l'écouter.
