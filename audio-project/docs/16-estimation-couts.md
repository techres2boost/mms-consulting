# 16 — Estimation des coûts et économie unitaire

> **Prix vérifiés en septembre 2026.** Les sources sont en fin de document. Les tarifs
> cloud évoluent : re-vérifier avant tout engagement budgétaire.

## 16.1 La conclusion à lire en premier

**L'infrastructure ne sera jamais votre problème.** Elle représente 2 à 5 % de vos coûts.
**Le coût des récompenses (les Go distribués) est 20 à 30 fois supérieur**, et il est
directement piloté par votre barème de points.

Et surtout — c'est le résultat le plus important de tout ce dossier :

> **Le barème suggéré dans le brief (100 points → 500 Mo, 500 points → 3 Go, avec
> ~1 000 points gagnables par mois) produit une marge de −766 % à un CPM de 5 TND.
> Il est intenable d'un facteur ~10.**

Détail du calcul en 16.5. Le barème a été recalculé, et le seed SQL
([`sql/0009_seed.sql`](sql/0009_seed.sql)) contient désormais des valeurs **dérivées de
l'économie unitaire**, pas de l'intuition.

---

## 16.2 Prix de référence (septembre 2026)

| Poste | Prix | Source |
|---|---|---|
| Supabase Free | 0 USD | supabase.com/pricing |
| Supabase Pro | **25 USD/mois** — inclut 8 Go de base, 100 Go de Storage, 250 Go d'egress, 50 000 MAU Auth, 2 M d'invocations Edge Functions, 200 connexions Realtime | supabase.com/pricing |
| Supabase — egress au-delà | **0,09 USD/Go** (non caché), **0,03 USD/Go** (caché) | Supabase Docs — Manage Egress |
| Supabase Team | 599 USD/mois | supabase.com/pricing |
| Supabase — compute additionnel | Micro inclus ; Small ~15 USD ; Medium ~60 USD ; Large ~110 USD (ordres de grandeur, à vérifier) | supabase.com/pricing |
| Vercel Hobby | 0 USD — **usage commercial non autorisé** | vercel.com/docs/pricing |
| Vercel Pro | **20 USD/mois/siège**, chaque siège apportant 20 USD de crédit d'usage, **plus** 1 To de Fast Data Transfer et 10 M de requêtes Edge hors crédit | vercel.com/docs/pricing |
| Vercel — bande passante au-delà | **0,15 USD/Go** | vercel.com/docs/pricing |
| **Apple Developer Program** | **99 USD/an** | developer.apple.com |
| **Google Play** | **25 USD, une seule fois** | Play Console Help |
| Sentry Developer / Team | 0 / ~26 USD/mois | sentry.io |
| Domaine `.tn` ou `.com` | ~12 à 40 USD/an | registrars |
| GitHub Actions | 2 000 min/mois gratuites (dépôt privé) | github.com |
| Cloudflare CDN | 0 USD (offre gratuite suffisante) | cloudflare.com |
| **SMS OTP vers la Tunisie** | **~0,03 à 0,08 USD/SMS** (CPaaS international) ; **3 à 10× moins** chez un agrégateur local | à négocier — **non vérifié publiquement** |
| Coût de gros data Tunisie | **~3 millimes/Mo** (~3 TND/Go) — **hypothèse à valider** | à négocier |

**Non vérifiable publiquement, à confirmer avant tout engagement :** tarifs de terminaison
voix vers la Tunisie, disponibilité de numéros +216 chez les CPaaS, tarifs de gros data
des opérateurs tunisiens, tarifs des agrégateurs SMS locaux. Ces quatre inconnues sont
des tâches de Phase 0.

---

## 16.3 Coûts d'infrastructure par palier

### 100 utilisateurs

| Poste | Type | Coût/mois | Note |
|---|---|---|---|
| Supabase | fixe | **0** | Plan gratuit suffisant techniquement. Passer à Pro dès qu'il y a de vrais utilisateurs, pour le PITR |
| Vercel Pro (1 siège) | fixe | **20** | Hobby interdit en usage commercial |
| Domaine | fixe | 2 | ~24 USD/an |
| Apple Developer | fixe | 8,25 | 99 USD/an ; **0 si Android seul** |
| Google Play | fixe | ~0 | 25 USD une fois |
| Sentry | fixe | 0 | Offre gratuite |
| CI/CD | fixe | 0 | Minutes GitHub incluses |
| SMS OTP | **variable** | ~5 | ~100 inscriptions + renvois |
| Storage / egress | variable | 0 | Négligeable |
| **Total** | | **~35 USD** | |
| **Par utilisateur** | | **0,35 USD** | |

### 1 000 utilisateurs

| Poste | Type | Coût/mois |
|---|---|---|
| Supabase Pro (compute Micro) | fixe | **25** |
| Vercel Pro (1 siège) | fixe | 20 |
| Domaine + stores | fixe | ~10 |
| Sentry Team | fixe | 26 |
| SMS OTP (~200 nouveaux/mois) | variable | ~10 |
| Egress / Storage | variable | ~0 |
| **Total** | | **~91 USD** |
| **Par utilisateur** | | **0,09 USD** |

### 10 000 utilisateurs

| Poste | Type | Faible | Élevé |
|---|---|---|---|
| Supabase Pro | fixe | 25 | 25 |
| Supabase compute (Small → Medium) | variable | 15 | 60 |
| Supabase stockage au-delà de 8 Go | variable | 0 | ~10 |
| Vercel Pro (2 sièges) | fixe | 40 | 40 |
| Vercel bande passante | variable | ~0 | ~5 |
| Sentry Team | fixe | 26 | 26 |
| Uptime + monitoring | fixe | 10 | 10 |
| SMS OTP (~1 500 nouveaux/mois) | **variable** | **50** | **120** |
| CDN | fixe | 0 | 0 |
| Sauvegarde externe | fixe | 5 | 5 |
| Stores + domaine | fixe | 10 | 10 |
| **Total infra** | | **~181 USD** | **~311 USD** |
| **Par utilisateur** | | **0,018 USD** | **0,031 USD** |

### 100 000 utilisateurs

| Poste | Type | Faible | Élevé |
|---|---|---|---|
| Supabase Team **ou** Pro + gros compute | fixe | 599 | 599 |
| Compute Large/XL | variable | 110 | 400 |
| Stockage (rétention 30 j) | variable | 30 | 90 |
| Egress au-delà (≈ 0,03–0,09 USD/Go) | variable | 10 | 40 |
| Invocations Edge au-delà de 2 M | variable | 50 | 200 |
| Read replica / entrepôt analytique | variable | 100 | 400 |
| Vercel Pro (4 sièges) + bande passante | fixe/var | 90 | 150 |
| Sentry Business | fixe | 80 | 80 |
| Monitoring + uptime + logs | fixe | 50 | 50 |
| SMS OTP (~10 000 nouveaux/mois) | **variable** | **300** | **800** |
| Sauvegarde externe + DR | fixe | 40 | 40 |
| Stores + domaine | fixe | 10 | 10 |
| **Total infra** | | **~1 469 USD** | **~2 859 USD** |
| **Par utilisateur** | | **0,015 USD** | **0,029 USD** |

### Séparation fixe / variable

| Palier | Coûts fixes | Coûts variables | Part variable |
|---|---|---|---|
| 100 | ~30 USD | ~5 USD | 14 % |
| 1 000 | ~81 USD | ~10 USD | 11 % |
| 10 000 | ~101 USD | ~80 à 210 USD | 44 à 68 % |
| 100 000 | ~869 USD | ~600 à 1 990 USD | 41 à 70 % |

**Lecture :** les coûts fixes sont dérisoires. Le poste variable dominant à tous les
paliers n'est ni la base, ni la bande passante — **c'est le SMS OTP**, qui peut représenter
jusqu'à 28 % de la facture d'infrastructure à 100 000 utilisateurs. D'où la recommandation
du §06 : négocier un agrégateur SMS **local** avant le lancement, avec un plafond de
dépense quotidien.

---

## 16.4 Coûts hors infrastructure

| Poste | 100 | 1 000 | 10 000 | 100 000 |
|---|---|---|---|---|
| **COGS récompenses** (voir 16.5) | 0 | ~130 USD | ~1 300 USD | ~13 000 USD |
| Traitement manuel des conversions | 0 | ~50 USD | ~600 USD | *non viable* |
| Équipe (hors périmètre de ce chiffrage) | — | — | — | — |
| Télécom (ALT-D) | **0** | **0** | **0** | **0** |
| Télécom (ALT-B, pour comparaison) | — | **~2 000 USD** | **~20 000 USD** | **~200 000 USD** |

**La ligne ALT-B mérite d'être regardée :** à 10 000 utilisateurs, 6 appels/jour de
2 minutes bridgés (donc 4 minutes facturées) à ~0,05 USD/minute donnent
~20 000 USD/mois de coût télécom, contre un revenu publicitaire de ~1 800 USD. **C'est
la démonstration chiffrée de l'inviabilité du bridge d'appel** annoncée au §01.

---

## 16.5 Économie unitaire — le calcul décisif

### La contrainte

```
Pour être viable :   COGS_récompenses  ≤  50 % du revenu publicitaire
                     (les 50 % restants financent infra, équipe et marge)

revenu_par_point  =  CPM_en_TND / points_par_impression       [millimes]
coût_par_point    =  Mo_par_point × 3 millimes/Mo             [hypothèse de gros]

CONTRAINTE :         coût_par_point  ≤  0,5 × revenu_par_point
```

### Le barème du brief, testé

Hypothèse : 2 points/impression, plafond 12/jour, bonus d'appel 10/jour, bonus mensuel 20,
catalogue 100 points → 500 Mo (soit 5 Mo/point).
→ **1 040 points gagnables/mois, 360 impressions/mois.**

| CPM | Revenu/utilisateur/mois | COGS récompenses | COGS/revenu | Marge |
|---|---|---|---|---|
| 2 TND | 720 millimes | 15 600 millimes | **2 167 %** | **−2 067 %** |
| 5 TND | 1 800 millimes | 15 600 millimes | **867 %** | **−767 %** |
| 8 TND | 2 880 millimes | 15 600 millimes | **542 %** | **−442 %** |
| 20 TND | 7 200 millimes | 15 600 millimes | **217 %** | **−117 %** |

**Même à un CPM de 20 TND — irréaliste pour de la publicité audio locale en Tunisie — le
modèle perd de l'argent sur chaque utilisateur.** Ce n'est pas un problème d'échelle :
c'est structurellement déficitaire, et chaque utilisateur supplémentaire aggrave la perte.

### Le barème révisé

1 point/impression, plafond **6/jour**, **bonus d'appel désactivé**, bonus mensuel 10.
→ **190 points/mois, 180 impressions/mois.** Catalogue à ~0,8 Mo/point.

| CPM | Revenu/utilisateur/mois | COGS récompenses | COGS/revenu | Marge |
|---|---|---|---|---|
| 2 TND | 360 millimes | 428 millimes | 119 % | **−19 %** |
| **5 TND** | **900 millimes** | **428 millimes** | **47,5 %** | **+52,5 %** ✅ |
| 8 TND | 1 440 millimes | 428 millimes | 29,7 % | **+70,3 %** ✅ |

**Le modèle devient viable à partir d'un CPM d'environ 4 TND.** C'est l'hypothèse
critique à valider auprès d'annonceurs réels avant d'écrire une ligne de code.

### Tableau de sensibilité : récompense mensuelle soutenable

Ce tableau est, à mon sens, le plus utile du dossier. Il donne la récompense maximale que
vous pouvez offrir, par utilisateur et par mois, pour que le COGS reste à 50 % du revenu.

| Pubs/jour | CPM 2 TND | CPM 5 TND | CPM 8 TND | CPM 15 TND |
|---|---|---|---|---|
| 3 | 30 Mo | 75 Mo | 120 Mo | 225 Mo |
| **6** (plafond retenu) | 60 Mo | **150 Mo** | 240 Mo | 450 Mo |
| 12 | 120 Mo | 300 Mo | 480 Mo | 900 Mo |
| **40** (ALT-A / ALT-E, tous les appels) | 400 Mo | **1 000 Mo** | 1 600 Mo | **3 000 Mo** |

### Trois lectures stratégiques de ce tableau

1. **En ALT-D (publicité in-app seulement), la récompense réaliste est de ~150 Mo/mois**,
   pas 3 Go. C'est un message commercial très différent de celui envisagé : « un peu de
   data offerte chaque mois » plutôt que « vos forfaits data gratuits ». Il faut le
   décider maintenant, pas après avoir promis 3 Go aux utilisateurs.
2. **Les 3 Go/mois du brief ne deviennent atteignables qu'en captant *tous* les appels**
   (~40 pubs/jour) **et** avec un CPM ≥ 15 TND. Cela signifie ALT-A (opérateur) ou ALT-E
   (dialer Android). C'est **la justification économique** de poursuivre la négociation
   opérateur : ce n'est pas seulement une question d'UX, c'est ce qui rend la promesse
   produit finançable.
3. **Le levier le plus puissant est le volume d'impressions, pas le CPM.** Passer de 6 à
   40 pubs/jour multiplie la récompense soutenable par 6,7. Négocier un CPM de 5 à 8 TND
   ne la multiplie que par 1,6. C'est une hiérarchie de priorités : **capter plus
   d'inventaire avant d'optimiser le prix**.

### Coût par unité

| Unité | À 10 000 utilisateurs, scénario Moyen |
|---|---|
| Coût infra / utilisateur / mois | **0,018 à 0,031 USD** |
| COGS récompenses / utilisateur / mois | **~0,13 USD** (150 Mo à 3 millimes/Mo) |
| Coût total / utilisateur / mois | **~0,15 USD** |
| Coût infra / impression | **~0,0000017 USD** (négligeable) |
| Coût récompense / impression | **~0,00072 USD** |
| Revenu / impression (CPM 5 TND) | **~0,0016 USD** |
| **Marge / impression** | **~0,0009 USD** |
| Coût / appel | **0 USD** (ALT-D) |
| Coût / minute | **0 USD** (ALT-D) |

---

## 16.6 Seuil de rentabilité

À un CPM de 5 TND, un plafond de 6 pubs/jour et 60 % d'utilisateurs actifs :

```
Revenu par utilisateur actif / mois     = 900 millimes   ≈ 0,29 USD
COGS récompenses                        = 428 millimes   ≈ 0,14 USD
Marge brute par utilisateur actif       = 472 millimes   ≈ 0,15 USD
```

| Coûts fixes mensuels à couvrir | Utilisateurs actifs nécessaires | Base totale (60 % actifs) |
|---|---|---|
| 100 USD (infra seule, MVP) | ~670 | ~1 100 |
| 1 000 USD (infra + 1 personne à temps partiel) | ~6 700 | ~11 000 |
| 5 000 USD (petite équipe de 3) | ~33 000 | ~55 000 |
| 15 000 USD (équipe de 8) | ~100 000 | ~167 000 |

**Lecture :** le produit ne devient auto-finançant pour une équipe de trois personnes
qu'autour de **55 000 utilisateurs**, à condition que le CPM de 5 TND soit réel et que la
conversion soit automatisée. C'est un ordre de grandeur à confronter à votre plan de
financement — et une raison supplémentaire de valider la demande annonceur avant
d'investir en développement.

---

## 16.7 Les cinq leviers de pilotage

Tous sont des **données** (`point_rules`, `data_packages`), modifiables sans déploiement
(§07, principe P5) — ce qui est précisément l'intérêt de ce choix d'architecture.

| Levier | Effet | Risque |
|---|---|---|
| `daily_impression_cap` | Plafonne directement le COGS | Baisser déçoit les utilisateurs |
| `points_per_impression` | Change la valeur d'un point | Idem |
| `data_packages.data_mb` | Change le taux de conversion | **Le plus sensible en perception** |
| `monthly_bonus_points` | Coût fixe par utilisateur actif | Faible impact sur la rétention si retiré tôt |
| CPM / prix de campagne | Côté revenu | Limité par le marché |

**Conseil d'exploitation :** commencez **conservateur** et augmentez la générosité une fois
le CPM réel connu. Baisser une récompense déjà annoncée produit des désinstallations et de
mauvaises notes ; l'augmenter produit de la satisfaction. C'est asymétrique, et cette
asymétrie doit gouverner votre réglage initial.

---

## Sources

- [Pricing & Fees — Supabase](https://supabase.com/pricing)
- [Manage Egress usage — Supabase Docs](https://supabase.com/docs/guides/platform/manage-your-usage/egress)
- [Supabase Pricing 2026: Plans, Overage Rates, and Real Monthly Costs — Flexprice](https://flexprice.io/blog/supabase-pricing-breakdown)
- [Pricing on Vercel](https://vercel.com/docs/pricing)
- [Vercel Cost in 2026 — MakerKit](https://makerkit.dev/blog/saas/vercel-cost)
- [Apple Developer Fee 2026: What $99 a Year Actually Covers — Magora](https://magora-systems.com/apple-developer-fee/)
- [Google Play Developer Fee 2026: $25 — IconikAI](https://www.iconikai.com/blog/google-play-developer-account-fee-2026)
- [Cost to Publish an App on the App Stores (2026) — Axon](https://axonbuild.com/blog/cost-to-publish-an-app-to-the-app-stores)
