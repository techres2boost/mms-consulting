# 08 — Moteur de sélection publicitaire et ciblage géographique

## 8.1 Une contrainte qui change tout : la sélection se fait **sur le téléphone**

Puisque le produit doit fonctionner hors ligne (§10), le moteur de sélection ne peut pas
vivre uniquement côté serveur. Conséquence :

- **Le serveur calcule l'éligibilité et les poids** (travail lourd, données sensibles,
  budgets) et les envoie dans le *ad bundle*.
- **Le client choisit le créatif** dans l'ensemble déjà filtré, en appliquant les plafonds
  locaux.
- **Le serveur revalide à l'ingestion** : si le client a servi une campagne inéligible à
  la date de diffusion, l'impression est enregistrée mais **non créditée et non
  facturée**.

C'est une architecture à deux étages où la même logique de pondération existe des deux
côtés. **Elle doit être écrite une seule fois**, dans un paquet TypeScript partagé
(`packages/adengine`), compilé pour le client et exécuté dans une Edge Function pour la
validation. Sinon les deux implémentations divergent et la facturation devient
indéfendable.

---

## 8.2 Ciblage géographique — ce qui est pertinent pour le MVP

| Niveau | Cardinalité | MVP ? | Verdict |
|---|---|---|---|
| Gouvernorat | 24 | ✅ **Oui, exclusivement** | Suffisant, compréhensible par l'annonceur, cache de bundle trivial |
| Délégation | ~264 | Modélisé, non exposé | Utile au-delà de ~100 campagnes. Fragmente le cache de bundle |
| Ville / localité | ~2 000+ | Non | Aucun annonceur local ne raisonne à cette granularité au départ |
| Zone personnalisée (polygone) | n | Non | Demande PostGIS + une UI de dessin. Faible retour sur investissement |
| Rayon autour d'un point | n | **Non** | **Exige la localisation précise**, donc un consentement supplémentaire, un risque INPDP accru (§12) et une consommation de batterie. À n'envisager que si un annonceur le paie explicitement |
| Segments (âge, centres d'intérêt) | n | Non | Nécessite de collecter des données que vous n'avez pas et que vous ne devriez pas collecter au MVP |

**Décision : ciblage par gouvernorat au MVP, hiérarchie `ltree` en place pour descendre
sans migration.** Un annonceur qui veut « Tunis + Ariana + Ben Arous » sélectionne trois
gouvernorats. C'est exactement votre exemple du §4, et c'est suffisant.

**Pourquoi refuser le rayon au MVP :** il transforme votre produit, du point de vue de la
loi 2004-63, d'un service qui connaît une *zone déclarée* en un service qui trace des
*déplacements*. Le coût de conformité (déclaration INPDP, base légale, minimisation) est
disproportionné face au gain publicitaire à ce stade.

### Structure de données

Déjà en place dans `geographic_zones` (§07) : hiérarchie `parent_id` + chemin matérialisé
`ltree`. Cela permet, sans changer le schéma :

```sql
-- Campagnes éligibles pour un utilisateur, en remontant la hiérarchie :
-- une campagne ciblant « Tunisie » entière atteint tout le monde,
-- une campagne ciblant « Tunis » atteint aussi ses délégations.
select distinct c.id
from campaigns c
join campaign_zones cz on cz.campaign_id = c.id
join geographic_zones tz on tz.id = cz.zone_id
join geographic_zones uz on uz.id = :user_zone_id
where c.status = 'active'
  and uz.path <@ tz.path      -- la zone de l'utilisateur est sous la zone ciblée
;
```

---

## 8.3 Le moteur de sélection

### Étage 1 — Éligibilité (serveur, à chaque construction de bundle)

Une campagne entre dans le bundle d'une zone si **toutes** ces conditions sont vraies :

```
campaign.status = 'active'
AND current_date BETWEEN campaign.starts_on AND campaign.ends_on
AND EXISTS un créatif approved (dans la langue de l'utilisateur, sinon fallback)
AND la zone de l'utilisateur est sous une zone ciblée (ltree <@)
AND (budget_millimes IS NULL OR spent_millimes < budget_millimes)
AND (target_operator_ids = '{}' OR user.operator_id = ANY(target_operator_ids))
AND (daily_impression_cap IS NULL OR impressions_aujourdhui < daily_impression_cap)
```

### Étage 2 — Pondération (serveur, envoyée au client)

Chaque campagne éligible reçoit un **poids effectif** :

```
poids_effectif = weight
               × facteur_priorite(priority)
               × facteur_rythme(pacing)
               × facteur_equilibrage(annonceur)
```

**`facteur_priorite`** — la priorité 1..10 est convertie en multiplicateur, pas en tri
strict. Un tri strict signifierait qu'une campagne de priorité 1 monopolise 100 % de
l'inventaire, ce qui est exactement le problème que vous voulez éviter.

```
facteur_priorite(p) = 2 ^ ((p - 5) / 2)
   p=1 → 0,25   p=3 → 0,50   p=5 → 1,00   p=8 → 2,83   p=10 → 5,66
```

**`facteur_rythme`** (*pacing*) — évite qu'une campagne épuise son budget le premier jour :

```
part_budget_attendue = jours_ecoules / jours_total
part_budget_reelle   = spent_millimes / budget_millimes
facteur_rythme = clamp(part_attendue / max(part_reelle, 0.01), 0.25, 4.0)
```
En avance sur le budget → le facteur descend, la campagne est moins servie. En retard →
elle est davantage servie. C'est le mécanisme standard et il est indispensable dès que des
budgets existent.

**`facteur_equilibrage`** — empêche un gros annonceur d'écraser les petits :

```
part_annonceur = impressions_annonceur_7j / impressions_totales_7j
part_cible     = poids_annonceur / somme_des_poids
facteur_equilibrage = clamp(part_cible / max(part_annonceur, 0.001), 0.5, 2.0)
```

### Étage 3 — Filtres locaux (client, à chaque diffusion)

```
POUR chaque campagne du bundle :
  REJETER SI  impressions_utilisateur_aujourdhui(campagne) >= campaign.user_daily_cap
  REJETER SI  minutes_depuis_derniere(campagne) < campaign.user_freq_cap_minutes
  REJETER SI  campagne.valid_to < maintenant   (fenêtre embarquée dans le bundle)
  REJETER SI  créatif absent du cache OU hash invalide
```

### Étage 4 — Randomisation contrôlée (client)

**Sélection proportionnelle au poids** (roue de la fortune) et non `ORDER BY random()` :

```ts
function select(candidates: Candidate[], rng: () => number): Candidate | null {
  if (candidates.length === 0) return null;

  // Anti-répétition : on pénalise le dernier créatif servi plutôt que de l'exclure,
  // sinon avec 1 seule campagne éligible on ne diffuse plus rien.
  const lastId = getLastServedId();
  const weighted = candidates.map(c => ({
    c,
    w: Math.max(c.effectiveWeight * (c.id === lastId ? 0.15 : 1), 0.0001),
  }));

  const total = weighted.reduce((s, x) => s + x.w, 0);
  let r = rng() * total;
  for (const x of weighted) {
    r -= x.w;
    if (r <= 0) return x.c;
  }
  return weighted[weighted.length - 1].c;
}
```

**Trois propriétés de ce choix :**
1. **Pas de répétition systématique** — la pénalité de 0,15 sur le dernier servi suffit,
   et n'entraîne pas de blocage quand une seule campagne est éligible.
2. **La part de voix est prévisible** — un annonceur avec 30 % du poids obtient ~30 % des
   impressions. C'est ce qu'on peut promettre commercialement.
3. **Déterministe à partir d'une graine** — la graine est dérivée de
   `(install_id, jour, compteur)`, ce qui rend la séquence **reproductible côté serveur**
   lors d'un audit. Un client qui prétend avoir servi une distribution improbable est
   détectable.

### Étage 5 — Revalidation serveur (à l'ingestion)

```
POUR chaque impression reçue :
  SI campagne inactive à occurred_at        → state=rejected, reject_reason='campaign_inactive'
  SI zone utilisateur non ciblée            → rejected, 'zone_mismatch'
  SI budget déjà épuisé à occurred_at       → credited=false MAIS facturable=false
  SI plafond journalier dépassé             → credited=false, 'daily_cap'
  SI plafond de fréquence non respecté      → credited=false, 'freq_cap'
  SI bundle périmé > TTL + grâce            → credited=false, 'stale_bundle'
  SINON                                     → credited=true, points selon point_rules
```

**Point important :** une impression rejetée est **quand même enregistrée**. Elle est
précieuse pour l'anti-fraude et le diagnostic. Elle n'est simplement ni créditée ni
facturée.

---

## 8.4 Modèles de facturation — quelles métriques enregistrer

| Modèle | Métrique facturable | Enregistré ? | Commentaire |
|---|---|---|---|
| **CPM** (coût pour mille) | `count(impressions complete AND credited)` | ✅ | Le standard. Recommandé comme défaut |
| **CPL** (coût par écoute) | idem, facturé à l'unité | ✅ | Plus lisible pour un petit annonceur local (« 1 millime par écoute ») |
| **Forfait mensuel** | présence dans l'inventaire | ✅ | Le plus simple à vendre en Tunisie. Recommandé pour les premiers clients |
| **CPC** | — | ❌ | **Non pertinent.** Il n'y a pas de clic sur une publicité audio pendant un appel. Ne pas le proposer |
| **Coût par reach** | `count(distinct user_id)` | ✅ | Utile pour un annonceur qui veut « toucher 5 000 personnes à Sousse » |

**Recommandation commerciale :** démarrer en **forfait mensuel par zone** (« votre
publicité à Sfax, 1 mois, X TND »). C'est ce qu'un restaurateur ou un garagiste comprend
et achète. Le CPM devient pertinent quand vous avez assez d'inventaire pour que
l'annonceur veuille optimiser. Les deux modèles sont dans le schéma dès le départ.

**Métriques à enregistrer impérativement pour pouvoir facturer sans contestation :**
`impression_id`, `campaign_id`, `advertisement_id` (version du créatif),
`user_id` (pour le reach unique), `zone_id`, `occurred_at` **serveur**, `completion_pct`,
`state`, `credited`. Toutes sont dans `advertisement_impressions`, et figées mensuellement
dans `campaign_invoices.snapshot`.

---

## 8.5 Exemple traité (votre §5)

Utilisateur en **Ariana**. Campagnes actives :

| Campagne | Zones | Priorité | Poids | Budget consommé | Jours écoulés |
|---|---|---|---|---|---|
| A | Tunis + Ariana | 5 | 100 | 40 % | 50 % |
| B | Sousse | 5 | 100 | — | — |
| C | Ariana | 8 | 100 | 80 % | 50 % |

**Étage 1 — éligibilité :** B est écartée (zone incompatible). A et C restent.

**Étage 2 — pondération :**
- A : `100 × 2^((5-5)/2)=1 × rythme(0,5/0,4=1,25) = 125`
- C : `100 × 2^((8-5)/2)=2,83 × rythme(0,5/0,8=0,625) = 177`

**Étage 4 — sélection :** A obtient `125/302 ≈ 41 %`, C obtient `59 %`.
Si C vient d'être servie, son poids tombe à `177×0,15 ≈ 27` pour cette diffusion, et A
passe à `82 %`. La rotation est assurée sans jamais bloquer.

**Lecture :** C est prioritaire (8 vs 5) donc plus servie, mais elle consomme son budget
trop vite, ce qui la freine automatiquement. C'est le comportement souhaitable et il ne
demande aucune intervention humaine.

---

## 8.6 Ce que ce moteur ne fait pas (volontairement)

- **Pas d'enchères en temps réel.** Aucun sens avec 20 annonceurs locaux et un
  fonctionnement hors ligne.
- **Pas de ciblage comportemental.** Vous n'avez pas les données, et les collecter
  créerait une obligation de conformité lourde pour un gain marginal.
- **Pas d'optimisation par apprentissage.** Il n'y a pas de signal de conversion à
  optimiser (pas de clic). Un moteur pondéré déterministe est le bon niveau de complexité,
  et il reste lisible et auditable — ce qui compte davantage quand un annonceur contexte
  sa facture.
