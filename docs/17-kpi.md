# 17 — KPI

## 17.1 Les trois indicateurs qui décident du sort du produit

Avant la liste exhaustive : si vous ne suiviez que trois chiffres, ce seraient ceux-là.

| KPI | Définition | Seuil d'alerte | Pourquoi |
|---|---|---|---|
| **Marge brute** | (revenu pub − COGS récompenses) / revenu pub | **< 20 %** | Chaque utilisateur supplémentaire aggrave la perte si négative (§16) |
| **Impressions par utilisateur actif / mois** | `complete_impressions` / MAU | **< 100** | En dessous, le revenu par utilisateur ne couvre plus les coûts fixes |
| **Fill rate** | % de tentatives de diffusion ayant trouvé un créatif éligible | **< 85 %** | Un fill rate faible signifie un inventaire publicitaire insuffisant — le symptôme précoce de l'échec de Blyk |

---

## 17.2 Produit

| KPI | Définition | Source | Cible MVP |
|---|---|---|---|
| **DAU** | Utilisateurs distincts avec ≥ 1 événement/jour | `daily_user_stats` | — |
| **MAU** | Idem sur 30 j glissants | `daily_user_stats` | — |
| **DAU/MAU** | Intensité d'usage | calculé | **> 25 %** |
| **Activation** | % d'inscrits ayant ≥ 1 impression complète dans les 48 h | `profiles` + `daily_user_stats` | **> 60 %** |
| **Rétention J1 / J7 / J30** | Par cohorte d'inscription | cohortes | **35 % / 20 % / 12 %** |
| **Rétention à la 1ʳᵉ conversion** | J30 des utilisateurs ayant converti vs non | calculé | Mesure si la récompense fonctionne |
| **Temps jusqu'à la 1ʳᵉ conversion** | Médiane | `reward_redemptions` | **< 45 j** |
| Taux de complétion de l'onboarding | inscrits / installations | analytics mobile | > 70 % |
| **Taux d'abandon sur l'écran de pub** | % d'annulations pendant les 4 s | `impression_state='partial'` | **< 10 %** — mesure la friction du §01 |
| Désinstallations | par semaine | consoles store | — |

**Le taux d'abandon sur l'écran de publicité est le KPI produit le plus spécifique à ce
projet.** C'est la mesure directe du risque n°4 du registre (§20) : si les utilisateurs
annulent leurs appels pour éviter les 4 secondes, le produit ne fonctionne pas, quels que
soient les autres chiffres.

---

## 17.3 Téléphonie

| KPI | Définition | Limite |
|---|---|---|
| Appels/jour | `count(calls)` | **Android uniquement** |
| Minutes/jour | `sum(duration_seconds)/60` | **Android uniquement** |
| Durée moyenne | | Android |
| **Taux de mesure** | % d'appels avec `measured = true` | Mesure la part Android réelle. ~0 % sur iOS |
| **Taux de diffusion publicitaire** | impressions / appels | Indique combien d'appels déclenchent une pub après plafonds |
| Taux d'échec de diffusion | impressions `partial` / total | Qualité technique |
| Appels sans impression | plafond atteint, ou pas de créatif éligible | Diagnostic du fill rate |

**Avertissement de méthode :** les KPI téléphonie ne couvrent **que les appels passés
depuis l'application, sur Android**. Ils ne représentent ni l'usage téléphonique réel de
l'utilisateur, ni les utilisateurs iOS. **Ne jamais les présenter à un investisseur ou un
annonceur comme des « appels des utilisateurs »** — c'est un sous-ensemble mesuré, et le
présenter autrement serait trompeur. Documenter cette limite dans chaque export.

---

## 17.4 Publicité

| KPI | Définition | Source |
|---|---|---|
| **Impressions** | `complete_impressions` | `daily_campaign_stats` |
| Impressions facturables | `billable_impressions` | idem |
| **Reach** | `count(distinct user_id)` par campagne | idem |
| **Fréquence moyenne** | impressions / reach | calculé |
| Répartition par zone | impressions par `zone_id` | idem |
| **Fill rate** | tentatives servies / tentatives totales | à instrumenter côté client |
| Part de voix par annonceur | impressions annonceur / total | vérifie l'équilibrage (§08) |
| Écart poids/impressions réelles | conformité du moteur | contrôle anti-fraude `R-WEIGHT-MISMATCH` |
| Campagnes actives | | `campaigns` |
| **Taux d'occupation de l'inventaire** | impressions servies / capacité théorique | Le KPI commercial clé |
| Délai moyen de mise en ligne | activation → 1ʳᵉ impression | mesure le délai de propagation du bundle (§09) |
| Taux de rejet de créatif | rejetés / soumis | qualité des annonceurs |

**Le taux d'occupation de l'inventaire** mérite d'être suivi dès le premier mois : si vous
avez 10 000 utilisateurs générant 1,8 M d'impressions possibles par mois et seulement
5 annonceurs qui en achètent 300 000, vous avez un problème de demande — qui est
**le** risque n°1 du projet. C'est mieux de le voir au mois 2 qu'au mois 12.

---

## 17.5 Finance

| KPI | Définition | Seuil |
|---|---|---|
| **Revenu publicitaire** | `sum(spend_millimes)` | — |
| **COGS récompenses** | `sum(reward_redemptions.cost_millimes)` où `fulfilled` | — |
| **Marge brute** | (revenu − COGS) / revenu | **> 30 %** |
| **ARPU** | revenu / MAU | — |
| **Coût par utilisateur actif** | (infra + COGS) / MAU | — |
| Points distribués | crédits du ledger | — |
| Points consommés | débits `redemption` | — |
| Points expirés | débits `expiration` | — |
| **Points en circulation** | `sum(confirmed_points)` | **C'est un passif au bilan** |
| **Taux de consommation** | points consommés / points distribués | 40 à 70 % sain |
| Conversions data | `count(fulfilled)` | — |
| Volume de data distribué | `sum(data_mb)` | — |
| Coût par Go distribué | `sum(cost_millimes)/sum(data_mb)*1024` | Suit la négociation fournisseur |
| Taux d'échec de conversion | `failed` / total | **< 3 %** |
| **Coût de traitement manuel** | conversions × 5 min × coût horaire | Déclenche l'automatisation (§15) |

**« Points en circulation » est le KPI que les équipes oublient.** C'est une dette : si
4,2 M de points sont en circulation à 2,4 millimes/point, vous devez ~10 000 TND de data.
Une vague de conversions simultanées est un risque de trésorerie réel. L'expiration à
12 mois et le suivi de ce chiffre sont vos deux garde-fous.

---

## 17.6 Fraude et santé

| KPI | Définition | Seuil |
|---|---|---|
| Comptes suspects | `fraud_events` ouverts, sévérité ≥ medium | — |
| Appareils suspects | installations avec verdict d'intégrité négatif | **< 5 %** |
| Comptes en mode `limited` | | **< 3 %** |
| **Événements rejetés** | `rejected` / total reçus, par motif | **< 5 %** |
| Taux de faux positifs | recours acceptés / actions automatiques | **< 10 %** |
| Réenregistrements | > 3 en 30 j | — |
| Grappes détectées | `R-CLUSTER-*` | — |
| **Intégrité du ledger** | ruptures de `verify_ledger_chain()` | **0, toujours** |
| **Cohérence wallet/ledger** | écarts détectés | **0, toujours** |
| **Taux de synchronisation** | utilisateurs actifs synchronisés < 24 h | **> 90 %** |
| p95 `/sync` | latence | **< 800 ms** |
| Taux d'erreur `/sync` | | **< 2 %** |
| Volume d'OTP/heure | vs moyenne glissante | **< 3×** (SMS pumping) |

**Deux KPI doivent valoir exactement zéro en permanence :** l'intégrité du ledger et la
cohérence wallet/ledger. Toute valeur non nulle est un incident critique qui passe avant
tout le reste, y compris les incidents de production visibles.

**Le taux de faux positifs anti-fraude** est souvent omis et c'est une erreur : sans lui,
on ne sait pas si le dispositif anti-fraude protège la valeur ou détruit la base
d'utilisateurs. Il exige un canal de recours fonctionnel (§13).

---

## 17.7 Fréquence de restitution

| Vue | Fréquence | Destinataires | Source |
|---|---|---|---|
| Dashboard back-office | temps réel (rollups J-1) | tous les employés | `daily_*_stats` |
| **Alertes critiques** | immédiate | équipe technique | seuils du §15 |
| Rapport hebdomadaire | lundi | direction | export |
| **Arrêté mensuel de marge** | J+2 | direction | `campaign_invoices` + COGS |
| Rapport annonceur | mensuel | annonceurs | `campaign_invoices.snapshot` |
| Revue fraude | hebdomadaire | manager | `fraud_events` |
| Revue de cohortes | mensuelle | produit | cohortes |

**Tous les KPI sont calculés depuis les rollups, jamais depuis les tables brutes.** C'est
ce qui garantit qu'un dashboard reste instantané à 100 000 utilisateurs et qu'un
utilisateur du back-office ne peut pas, par une requête maladroite, dégrader la production.
