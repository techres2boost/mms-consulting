# 11 — Architecture des récompenses : points, ledger, conversion data

## 11.1 Les quatre modèles de points, évalués

| Critère | A — 100 pts/mois | B — 1 pt/minute | C — par annonce entendue | D — hybride |
|---|---|---|---|---|
| Mesurable sur Android | ✅ | ✅ | ✅ | ✅ |
| **Mesurable sur iOS** | ✅ | ❌ **impossible** | ✅ | ⚠️ partiel |
| Aligné sur la valeur créée pour l'annonceur | ❌ aucun lien | ❌ lien faible | ✅ **lien direct** | ✅ |
| Résistant à la fraude | ⚠️ incite au multi-compte | ❌ appels artificiels faciles | ⚠️ plafonnable | ✅ |
| Incite à utiliser le service | ❌ **aucune incitation** | ✅ | ✅ | ✅ |
| Coût prévisible | ✅ **totalement** | ❌ non borné | ⚠️ plafonnable | ✅ |
| Compréhensible par l'utilisateur | ✅✅ | ✅✅ | ✅ | ⚠️ |
| Vendable à l'annonceur | ❌ | ❌ | ✅ | ✅ |

### Pourquoi le modèle B est à écarter

**Il est techniquement inapplicable.** Sur iOS, la durée des appels GSM n'est pas
observable (§01). Sur Android, elle l'est, mais reste une **déclaration du client** :
un appareil rooté peut annoncer 600 minutes/jour. Et surtout, la minute d'appel n'est
corrélée à **aucune** valeur pour l'annonceur — vous payeriez pour des conversations
téléphoniques, ce qui n'est pas votre métier.

### Pourquoi le modèle A seul est à écarter

Il n'incite à rien. Un utilisateur qui reçoit 100 points sans rien faire n'écoute aucune
publicité, et vous n'avez rien à vendre. C'est précisément le piège dans lequel Blyk est
tombé : une base d'abonnés sans inventaire publicitaire réellement consommé.

### Recommandation : modèle D, dominé par C

```
Accrual principal   : 2 points par impression complète validée      ← 80 % de la valeur
Bonus d'engagement  : +1 point par appel confirmé ≥ 30 s (Android)  ← 10 %
Bonus de fidélité   : +20 points/mois si ≥ 10 jours actifs          ← 10 %
Amorçage            : +20 points à l'inscription vérifiée
Parrainage          : +30 points après 5 impressions du filleul
```

**Pourquoi cette combinaison :**
- **C est le socle** parce que c'est la seule métrique qui soit à la fois mesurable sur
  les deux OS, alignée sur ce que paie l'annonceur, et plafonnable.
- **Le bonus d'appel (B, plafonné)** récompense l'usage réel du service, mais sa
  contribution est volontairement faible : ainsi l'asymétrie iOS/Android reste modeste
  (environ 10 % d'écart de rémunération, explicable).
- **Le bonus de fidélité (A, conditionnel)** crée de la rétention, sans être un revenu
  passif : il exige 10 jours d'activité réelle.
- **L'amorçage** résout le problème du « portefeuille vide » du premier jour, qui est un
  tueur de rétention classique.

**Plafond : 12 impressions créditables/jour.** Ce n'est pas un réglage, c'est
**l'instrument de contrôle de votre coût des récompenses** (§16). Il doit être calculé à
partir du revenu publicitaire réel par impression, pas de la générosité souhaitée.

---

## 11.2 Wallet + ledger : oui, sans hésitation

> *« Est-ce qu'un modèle de type wallet/ledger est préférable ? »*

**Oui.** `users.points = 100` est insuffisant pour trois raisons opérationnelles très
concrètes, qui apparaîtront dans les trois premiers mois d'exploitation :

1. **Le support client devient impossible.** « Pourquoi ai-je 340 points et pas 380 ? »
   est une question que vous recevrez toutes les semaines. Sans ledger, vous ne pouvez pas
   répondre, et vous perdrez la confiance des utilisateurs.
2. **La facturation annonceur devient indéfendable.** Il faut pouvoir montrer le lien
   impression → point → conversion. Un annonceur qui contexte sa facture veut voir la
   trace.
3. **Toute erreur devient irréparable.** Avec un compteur, corriger un bug qui a
   sur-crédité 200 utilisateurs revient à réécrire des soldes sans traçabilité. Avec un
   ledger, c'est un lot de mouvements de compensation, datés, motivés et auditables.

### Architecture retenue

```
points_ledger    = SOURCE DE VÉRITÉ, append-only, chaînée par hash
points_wallets   = SOLDE MATÉRIALISÉ, dérivé, reconstructible à tout moment
```

Le wallet est une optimisation de lecture. Il est **toujours** reconstructible :

```sql
-- Contrôle d'intégrité (job quotidien)
select w.user_id, w.confirmed_points as materialise,
       coalesce(sum(case when l.direction='C' then l.amount else -l.amount end),0) as recalcule
from points_wallets w
left join points_ledger l on l.user_id = w.user_id
group by w.user_id, w.confirmed_points
having w.confirmed_points <> coalesce(sum(case when l.direction='C'
                                          then l.amount else -l.amount end),0);
-- Doit toujours renvoyer 0 ligne. Sinon : incident majeur, alerte immédiate.
```

### Ce que le ledger permet de répondre

Votre liste du §6 est entièrement couverte :

| Question | Champ |
|---|---|
| crédit / débit | `direction` ('C'/'D') + `amount` (toujours positif) |
| origine | `origin` (9 valeurs énumérées) |
| date | `created_at` (**serveur**, jamais le client) |
| campagne | `campaign_id`, `advertisement_id` |
| appel | `call_id` |
| conversion | `redemption_id` |
| expiration | `expires_at`, `expired_by_entry_id` |
| correction manuelle | `origin='manual_correction'` + `reason` **obligatoire** + `actor_id` |
| transaction ID | `transaction_id` (regroupe les mouvements d'une opération) + `idempotency_key` (unicité) |
| solde après | `balance_after` — permet de rejouer l'historique sans recalcul |
| barème appliqué | `rule_version` — **le champ le plus sous-estimé** |
| intégrité | `prev_hash` / `row_hash` |

**`rule_version` mérite une note :** sans lui, quand vous changez le barème de 2 à 3 points
par impression, vous ne pouvez plus expliquer un mouvement ancien. Avec lui, chaque
mouvement porte son propre contexte de calcul, pour toujours.

### Pourquoi pas de la comptabilité en partie double complète

Une vraie comptabilité en partie double (chaque mouvement débite un compte et crédite un
autre, la somme de tous les soldes valant zéro) serait plus rigoureuse. Elle n'est pas
justifiée ici : les points ne sont ni de la monnaie, ni transférables entre utilisateurs,
ni échangeables contre de l'argent. Le modèle retenu — **ledger append-only avec
`balance_after` et chaînage** — apporte 90 % du bénéfice pour 30 % de la complexité.

Le jour où les points deviendraient transférables entre utilisateurs, il faudrait passer
en partie double. Le schéma s'y prête (`transaction_id` regroupe déjà les mouvements
d'une opération).

### Expiration

Points valables **12 mois** à compter du crédit, expirés en FIFO par
`job_expire_points()`. Motifs :
- borne le passif au bilan (les points non consommés sont une dette) ;
- pousse à la conversion, donc à l'engagement ;
- conforme aux pratiques des programmes de fidélité télécom locaux.

**Notifier à J−30 et J−7**, sinon l'expiration est vécue comme un vol et génère des
désinstallations. C'est une obligation d'expérience utilisateur, pas une option.

---

## 11.3 Conversion des points en data — l'analyse honnête

### Ce qui est techniquement possible aujourd'hui

| Voie | Techniquement possible ? | Nécessite un accord commercial ? | Automatisable ? | Verdict MVP |
|---|---|---|---|---|
| **1. API officielle des opérateurs tunisiens** | **Non vérifiable.** Aucune API publique de recharge data n'est documentée publiquement pour TT, Orange TN ou Ooredoo TN | **Oui, obligatoirement** | Oui, si l'accord existe | ❌ Ne pas compter dessus |
| **2. Partenariat B2B direct** | Oui — c'est ainsi que fonctionnent les programmes de fidélité télécom | **Oui**, et c'est long | Oui, après intégration | 🎯 Objectif Phase 3 |
| **3. API d'agrégateur** (Reloadly, Ding…) | **Oui — vérifié.** Reloadly documente une API airtime couvrant **Ooredoo, Tunisie Telecom et Orange en Tunisie**, avec des montants en dinar tunisien. Ding propose des recharges pour les trois opérateurs | Oui : onboarding B2B, KYC, prépaiement, change | **Oui** | ✅ **La voie réaliste** |
| **4. Achat manuel par le back-office** | Oui, trivialement | Non | Non | ✅ **MVP** |
| **5. Codes / vouchers** | Oui, si l'opérateur vend des lots de recharge | Oui, pour l'approvisionnement | Partiellement | ⚠️ Plan B |
| **6. Crédit d'appel plutôt que data** | Oui, souvent plus simple | Oui | Oui | ⚠️ À considérer |

### Les trois nuances critiques

**(a) Airtime ≠ data.** Les agrégateurs internationaux couvrent très bien le
**crédit d'appel** (airtime). Les **bundles data spécifiques** (« 3 Go valables 30 jours »)
sont un catalogue distinct, dont la disponibilité varie par opérateur et par pays.
**À vérifier produit par produit avec l'agrégateur avant d'annoncer un catalogue à vos
utilisateurs.** Repli acceptable : convertir en airtime et laisser l'utilisateur
souscrire lui-même son bundle data — c'est moins élégant, mais toujours livrable.

**(b) L'onboarding B2B d'un agrégateur n'est pas instantané.** KYC entreprise, contrat,
prépaiement d'un solde, gestion du change TND/USD/EUR. Comptez 4 à 10 semaines. À lancer
en Phase 2, pas en Phase 3, si vous voulez que ce soit prêt pour la Phase 3.

**(c) La marge de l'agrégateur s'ajoute à votre COGS.** Un agrégateur international
prend une commission et applique son taux de change. Un accord direct avec un opérateur
tunisien serait moins coûteux et permettrait des tarifs de gros — mais c'est un
partenariat, pas une intégration technique. **C'est la vraie raison de poursuivre la
voie 2 en parallèle.**

### Architecture de la conversion, conçue pour l'évolution

```
                      ┌──────────────────────────────────────┐
                      │  reward_redemptions (machine à états) │
                      └──────────────────────────────────────┘
   pending ──► approved ──► processing ──► fulfilled
      │            │             │
      └── cancelled└── failed ───┘
                    └─► REVERSAL au ledger (+points restitués)

   MVP        : pending → [humain] → fulfilled   (provider='manual')
   Phase 3    : pending → [règles] → approved → [API] → processing
                        → [webhook] → fulfilled | failed
```

**Le point de conception qui rend l'automatisation possible plus tard sans réécriture :**
l'interface `RewardProvider` est définie dès le MVP, avec une seule implémentation.

```ts
interface RewardProvider {
  readonly code: 'manual' | 'reloadly' | 'ding' | 'operator_direct';
  quote(pkg: DataPackage, msisdn: string): Promise<Quote>;
  /** DOIT être idempotent sur idempotencyKey : un doublon = un Go donné deux fois */
  fulfil(r: Redemption, idempotencyKey: string): Promise<FulfilResult>;
  status(providerRef: string): Promise<FulfilStatus>;
}
```

**L'idempotence de `fulfil()` est la contrainte n°1.** Un retry réseau sur un appel
d'agrégateur non idempotent coûte de l'argent réel, immédiatement et sans recours.
Toujours passer une clé d'idempotence, toujours vérifier le statut avant de réessayer,
jamais de retry aveugle.

### Barème de conversion

Votre exemple (100 pts → 500 Mo, 200 → 1 Go, 500 → 3 Go) est cohérent : la valeur par
point **augmente** avec le palier, ce qui pousse à l'accumulation et réduit le nombre de
conversions à traiter. Bon réflexe.

**Mais le barème doit être dérivé du revenu publicitaire, pas de l'intuition.** Chaîne de
calcul à figer avant le lancement :

```
1 impression créditée  = 2 points
Revenu par impression  = CPM / 1000                        ← À MESURER auprès d'annonceurs réels
Revenu par point       = (CPM / 1000) / 2
Coût d'un point        = cost_millimes(package) / points_cost(package)

CONTRAINTE DURE :   coût d'un point  <  0,5 × revenu par point
                    (l'autre moitié finance l'infra, l'équipe et la marge)
```

Avec le catalogue exemple : 500 Mo pour 100 points à 1 500 millimes d'achat
→ **15 millimes par point**. Il faut donc un revenu ≥ 30 millimes par point,
soit **un CPM ≥ 60 millimes (0,06 TND)**. C'est un CPM très bas, donc a priori
atteignable — **mais il doit être vérifié auprès de vrais annonceurs tunisiens avant
d'écrire le code**, car c'est l'hypothèse qui fait vivre ou mourir le produit (§16).

### Contrôles obligatoires avant fulfillment

| Contrôle | Seuil | Automatisable |
|---|---|---|
| Solde **confirmé** suffisant | strict | ✅ (contrainte de base) |
| Ancienneté du compte | ≥ 72 h | ✅ |
| Numéro cible vérifié | = numéro du compte, ou vérifié par OTP | ✅ |
| Aucun `fraud_event` ouvert de sévérité ≥ high | strict | ✅ |
| Une seule conversion en cours | strict | ✅ (index unique) |
| Montant cumulé sur 30 jours | ≤ seuil | ✅ |
| **Revue manuelle** au-delà d'un seuil de valeur | ex. > 5 Go/mois | ⚠️ humain |
| Opérateur cible = opérateur déclaré | avertissement, pas blocage | ✅ |

**Le contrôle « numéro cible = numéro du compte » est le plus important.** Sans lui, un
fraudeur crée 50 comptes et fait tout converger vers un seul numéro. Avec lui, chaque
compte frauduleux doit disposer d'une carte SIM distincte — ce qui a un coût réel et
change l'économie de l'attaque.
