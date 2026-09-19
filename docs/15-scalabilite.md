# 15 — Scalabilité

## 15.1 Hypothèses

Trois scénarios d'usage, avec le plafond de **6 impressions créditables/jour** du barème
révisé (§16) :

| Scénario | Appels/jour/utilisateur | Pubs/appel | Impressions/jour (plafonnées) | Taux d'activité |
|---|---|---|---|---|
| **Faible** | 3 | 1 | 3 | 60 % de la base active |
| **Moyen** | 6 | 1 | 6 | 60 % |
| **Élevé** | 20 | 2 | 6 (plafonné, 40 tentées) | 60 % |

Autres hypothèses : 4 synchronisations/jour/utilisateur actif ; 1 ligne par impression et
1 par appel ; ~400 octets par ligne stockée (données + 5 index) ; créatif de 16 Ko ;
bundle de 20 créatifs (320 Ko) ; 5 % de nouveaux utilisateurs/mois ; rafraîchissement
hebdomadaire de ~50 Ko ; pic de trafic = 8× la moyenne.

**Note importante sur le scénario « Élevé » :** le plafond fait que les impressions
*créditées* sont identiques au scénario Moyen, mais les **lignes enregistrées** doublent
(les impressions rejetées sont conservées pour l'anti-fraude — §08). C'est le stockage,
pas le calcul, qui absorbe l'usage intensif.

---

## 15.2 Charge calculée

### 100 utilisateurs

| Scénario | Impressions/j | Événements/j | Lignes/mois | Go/mois (DB) | Synchros/j | rps moyen | rps pic | Egress audio |
|---|---|---|---|---|---|---|---|---|
| Faible | 180 | 360 | 10 800 | 0,004 | 240 | 0,003 | 0,02 | 0,01 Go |
| Moyen | 360 | 720 | 21 600 | 0,009 | 240 | 0,003 | 0,02 | 0,01 Go |
| Élevé | 360 | 1 560 | 46 800 | 0,019 | 240 | 0,003 | 0,02 | 0,01 Go |

**Verdict : le plan gratuit Supabase suffit techniquement.** Tout tient dans le bruit.

### 1 000 utilisateurs

| Scénario | Impressions/j | Événements/j | Lignes/mois | Go/mois | Synchros/j | rps pic | Egress audio |
|---|---|---|---|---|---|---|---|
| Faible | 1 800 | 3 600 | 108 000 | 0,04 | 2 400 | 0,2 | 0,14 Go |
| Moyen | 3 600 | 7 200 | 216 000 | 0,09 | 2 400 | 0,2 | 0,14 Go |
| Élevé | 3 600 | 15 600 | 468 000 | 0,19 | 2 400 | 0,2 | 0,14 Go |

**Verdict : Supabase Pro, compute Micro. Aucun changement d'architecture.**

### 10 000 utilisateurs

| Scénario | Impressions/j | Événements/j | Lignes/mois | Go/mois | Synchros/j | rps pic | Egress audio |
|---|---|---|---|---|---|---|---|
| Faible | 18 000 | 36 000 | 1,08 M | 0,43 | 24 000 | 2,2 | 1,45 Go |
| Moyen | 36 000 | 72 000 | 2,16 M | 0,86 | 24 000 | 2,2 | 1,45 Go |
| Élevé | 36 000 | 156 000 | 4,68 M | 1,87 | 24 000 | 2,2 | 1,45 Go |

**Verdict : Supabase Pro, compute Small ou Medium.** Ce qui bouge réellement :
- **Stockage cumulé** : à 90 jours de rétention, 2,6 à 5,6 Go de lignes brutes. Le plan Pro
  inclut 8 Go de base de données : **on arrive à la limite dans le scénario Élevé**.
  → la purge de partitions à 90 jours n'est pas une option, c'est une nécessité.
- **Invocations d'Edge Functions** : 24 000 synchros + ~10 000 bundles + divers
  ≈ 1,1 M/mois. Le plan Pro inclut 2 M : **~55 % de la quota consommée**.
- **Quota Play Integrity** : la quota par défaut est de l'ordre de 10 000 requêtes/jour.
  Avec un cache de verdict de 24 h, on consomme ~6 000/jour (utilisateurs actifs) →
  **on frôle la limite**. Demander une augmentation **avant** ce palier.
- rps pic de 2,2 : négligeable pour Postgres, mais c'est le **p95 de `/sync`** qu'il faut
  surveiller, pas le débit.

### 100 000 utilisateurs

| Scénario | Impressions/j | Événements/j | Lignes/mois | Go/mois | Synchros/j | rps pic | Egress audio |
|---|---|---|---|---|---|---|---|
| Faible | 180 000 | 360 000 | 10,8 M | 4,3 | 240 000 | 22 | 14,5 Go |
| Moyen | 360 000 | 720 000 | 21,6 M | 8,6 | 240 000 | 22 | 14,5 Go |
| Élevé | 360 000 | 1,56 M | 46,8 M | 18,7 | 240 000 | 22 | 14,5 Go |

**Verdict : changement d'architecture requis.** Les trois points de rupture :
1. **Stockage** : 13 à 56 Go de lignes brutes à 90 jours → réduire la rétention à 30 jours
   et/ou exporter vers un entrepôt analytique.
2. **Edge Functions** : ~11 M invocations/mois contre 2 M incluses.
3. **Ingestion** : 22 rps en pic sur `/sync`, avec une transaction par requête, devient le
   point chaud → découplage (voir 15.4).

---

## 15.3 Ce qui n'est *jamais* un problème

Contre-intuitif mais important pour ne pas mal prioriser :

| Ressource | Pire cas (100 k, Élevé) | Commentaire |
|---|---|---|
| **Stockage audio** | 200 créatifs × 16 Ko = **3,2 Mo** | Votre inquiétude du §3 était mal placée. L'audio ne pèse rien |
| **Egress audio** | 14,5 Go/mois | Le plan Pro inclut 250 Go. Un CDN gratuit devant le Storage règle le sujet définitivement |
| **Appels simultanés** | **Aucun** | Il n'y a pas d'appel sur votre infrastructure en ALT-D. Ce serait le goulot principal en ALT-B — argument de plus contre le bridge |
| **Realtime** | Non utilisé | Rien dans ce produit n'est temps réel |
| **Bande passante API** | ~5 Ko par synchro → 36 Go/mois à 100 k | Négligeable |

**Le vrai goulot est le nombre de lignes d'événements**, et il se traite par
partitionnement + rollups + rétention — tous les trois déjà en place dans
[`sql/0004_measurement.sql`](sql/0004_measurement.sql) et
[`sql/0010_jobs.sql`](sql/0010_jobs.sql).

---

## 15.4 Points de rupture et actions

| Palier | Ce qui casse | Action | Coût de l'action |
|---|---|---|---|
| ~2 000 utilisateurs | Rien | Passer Supabase Pro (pour le PITR, pas pour la charge) | +25 USD/mois |
| ~5 000 | Dashboards lents sur tables brutes | **Rollups obligatoires** (déjà écrits) | 0 — il faut juste les brancher |
| ~5 000 | Connexions Postgres épuisées par les Edge Functions | **Supavisor en mode transaction** | 0 — configuration |
| ~10 000 | Quota Play Integrity | Cache 24 h + demande d'augmentation en Play Console | 0, mais **délai administratif** |
| ~10 000 | CPU base sur `/sync` | Compute Small → Medium | +60 à 110 USD/mois |
| ~10 000 | 8 Go de base atteints | Purge de partitions à 90 j (déjà écrite) + surveillance | 0 |
| ~10 000 | Egress > 200 Go | CDN (Cloudflare) devant le Storage | 0 (offre gratuite) |
| ~15 000 | **Traitement manuel des conversions** | **Automatisation via agrégateur** | Le vrai mur — voir ci-dessous |
| ~30 000 | 2 M d'invocations Edge dépassées | Surcoût à l'usage, ou déplacer `/sync` sur Vercel (runtime Node) | Variable |
| ~50 000 | p95 `/sync` > 800 ms | **Découplage de l'ingestion** (voir ci-dessous) | 3 à 5 jours de dev |
| ~100 000 | Base saturée | Compute Large/XL, ou Postgres managé externe (Neon/RDS) en gardant Supabase Auth+Storage | +300 à 800 USD/mois |
| ~100 000 | Analytique concurrente de l'OLTP | Read replica, ou export vers ClickHouse/BigQuery | +100 à 400 USD/mois |

### Le vrai mur n'est pas technique

À ~15 000 utilisateurs, avec ~3 % de conversion mensuelle, cela fait **~450 conversions à
traiter manuellement par mois**. À 5 minutes chacune, c'est ~37 heures/mois — un
mi-temps. À 50 000 utilisateurs, c'est **deux personnes à temps plein**.

**L'automatisation de la conversion en data est la contrainte de scalabilité n°1 du
produit, et elle est commerciale (onboarding agrégateur) et non technique.** D'où la
recommandation du §11 : lancer l'onboarding agrégateur en Phase 2, pas en Phase 3.

### Découplage de l'ingestion (au-delà de ~50 000)

```
AVANT                              APRÈS
/sync ──► transaction complète     /sync ──► INSERT dans raw_sync_batches (append seul)
        ├ vérifications                    └─► réponse "accepté pour traitement"
        ├ INSERT impressions
        ├ post_ledger_entry                Worker (pgmq, 1 s) ──► traitement complet
        └ réponse avec solde                                  └─► solde confirmé en async
```

**Compromis :** le solde confirmé arrive en quelques secondes au lieu d'être immédiat.
L'app affiche déjà une distinction confirmé/en attente (§05), donc l'impact utilisateur est
**nul**. Gain : `/sync` devient un simple `INSERT`, dix fois plus rapide, et les pics
d'ingestion sont absorbés par la file.

**À ne pas faire avant d'en avoir besoin.** C'est exactement le genre d'optimisation qui,
faite trop tôt, ajoute de la complexité et des modes de panne pour rien.

---

## 15.5 Ce qu'il faut instrumenter dès le MVP

Sans ces métriques, vous ne saurez pas quand agir. Elles coûtent peu et doivent exister
dès la version 1 :

```
p50 / p95 / p99 de POST /sync                    ← le signal le plus important
Taux d'erreur de /sync (par motif de rejet)
Nombre de lignes dans advertisement_impressions (quotidien)
Taille de la base (quotidien)
CPU et connexions actives Postgres
Invocations d'Edge Functions (par fonction, quotidien)
Egress Storage (quotidien)
Requêtes Play Integrity / jour  ← quota
Profondeur de la file /rewards/redemptions        ← le mur opérationnel
Délai médian de traitement d'une conversion
Taux de synchro (utilisateurs actifs ayant synchronisé dans les 24 h)
Marge brute glissante sur 7 jours                 ← le signal business
```

**Seuils d'alerte à configurer immédiatement :**

| Métrique | Seuil | Gravité |
|---|---|---|
| p95 `/sync` | > 800 ms | avertissement |
| p95 `/sync` | > 2 s | critique |
| Taux d'erreur `/sync` | > 2 % | avertissement |
| Taille de la base | > 80 % de la quota | avertissement |
| File de conversions | > 100 | avertissement |
| **Marge brute** | **< 20 %** | **critique** |
| `verify_ledger_chain()` | toute rupture | **critique** |
| Cohérence wallet ↔ ledger | tout écart | **critique** |
| Volume d'OTP | > 3× la moyenne horaire | critique (SMS pumping) |
