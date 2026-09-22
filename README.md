# Plateforme de publicité audio adossée aux appels — Tunisie

Dossier d'analyse fonctionnelle et d'architecture technique.

**Date : 19 septembre 2026** · **Mise à jour : 20 septembre 2026** (analyse de la
spécification fonctionnelle Call Com V1.0)

> **⚠️ Lire [§23 — Analyse de la spécification Call Com](docs/23-analyse-spec-call-com.md)
> en complément.** La spécification porte sur l'appel **entrant** (l'appelant entend la
> publicité), alors que les §01–§22 analysent l'appel **sortant**. Le diagnostic de
> faisabilité est inchangé et renforcé, mais ALT-D n'est plus applicable et une
> architecture supplémentaire apparaît (**ALT-F**).

---

## En trois phrases

Le mécanisme envisagé — diffuser une publicité audio pendant la tonalité de retour d'un
appel GSM — **n'est réalisable depuis aucune application mobile**, sur aucun framework :
le canal audio appartient au modem, la fenêtre avant décroché est une fonction réseau, et
iOS ne permet même pas de *détecter* un appel cellulaire. Ce mécanisme ne représente
toutefois que 15 à 20 % du produit : le dossier propose de construire la plateforme
derrière une abstraction de diffusion, de lancer avec le seul mécanisme réalisable
aujourd'hui, et d'ouvrir en parallèle la négociation opérateur qui est le seul chemin vers
l'expérience cible. Enfin — et c'est le résultat le plus important — **le barème de points
envisagé perd de l'argent sur chaque utilisateur quel que soit le CPM**, et les deux
produits historiques qui ont tenté ce modèle sont morts de l'absence d'annonceurs, pas
d'un problème technique.

👉 **Commencer par [l'executive summary](docs/00-executive-summary.md)**, puis
[la section de faisabilité](docs/01-faisabilite-modele-coeur.md) qui est bloquante.

---

## Sommaire

| Doc | Contenu |
|---|---|
| [00 — Executive summary](docs/00-executive-summary.md) | Le projet en 2-3 pages, verdict, coûts, 5 risques, POC |
| **[01 — Feasibility of the core business model](docs/01-faisabilite-modele-coeur.md)** | **Section bloquante.** Ce qui est impossible et pourquoi ; 5 architectures alternatives comparées |
| [02 — Analyse fonctionnelle](docs/02-analyse-fonctionnelle.md) | Acteurs, domaines, workflows, règles métier |
| [03 — User journeys](docs/03-user-journeys.md) | 9 parcours détaillés avec points de rupture |
| [04 — Architecture technique](docs/04-architecture-technique.md) | Architecture cible, flux, 4 paliers |
| [05 — Architecture mobile](docs/05-architecture-mobile.md) | Capacitor vs React Native vs Flutter vs natif |
| [06 — Architecture backend](docs/06-architecture-backend.md) | Supabase, RLS, Edge Functions, jobs, files |
| [07 — Database schema](docs/07-database-schema.md) | 24 tables, index, partitionnement |
| [08 — Moteur de sélection](docs/08-moteur-selection-pub.md) | Ciblage géographique, pondération, rotation, facturation |
| [09 — Architecture audio](docs/09-architecture-audio.md) | Format, upload, transcodage, CDN, cache offline, purge |
| [10 — Architecture offline](docs/10-architecture-offline.md) | Synchronisation, conflits, limites de sécurité réelles |
| [11 — Architecture récompenses](docs/11-architecture-recompenses.md) | 4 modèles de points, ledger, conversion data |
| [12 — Sécurité et conformité](docs/12-securite-privacy-conformite.md) | Auth, RLS, loi 2004-63, INPDP, minimisation |
| [13 — Anti-fraude](docs/13-anti-fraude.md) | 8 scénarios traités, protection réellement atteignable |
| [14 — Back-office et RBAC](docs/14-back-office-rbac.md) | Arborescence, 4 rôles, écrans critiques |
| [15 — Scalabilité](docs/15-scalabilite.md) | Charge calculée de 100 à 100 000 utilisateurs |
| **[16 — Coûts et économie unitaire](docs/16-estimation-couts.md)** | **Le calcul décisif du projet** |
| [17 — KPI](docs/17-kpi.md) | Produit, téléphonie, publicité, finance, fraude |
| [18 — UX et écrans](docs/18-ux-ecrans.md) | Mobile, web client, back-office |
| [19 — Roadmap](docs/19-roadmap.md) | Phases 0 à 4, dépendances, critères de sortie |
| [20 — Risk register](docs/20-risk-register.md) | 13 risques : probabilité, impact, mitigation |
| [21 — Déploiement et monitoring](docs/21-deploiement-monitoring.md) | CI/CD, environnements, alertes, runbook |
| [22 — Conclusion](docs/22-conclusion.md) | Réponse aux 12 questions du brief |
| **[23 — Analyse de la spécification Call Com](docs/23-analyse-spec-call-com.md)** | **Écart spec ↔ dossier, ALT-F, accord opérateur, risque business** |
| **[24 — Étude d'intégration Orange Tunisie](docs/24-etude-orange-integration.md)** | **Faisabilité télécom, 3 architectures d'intégration, POC, stratégie Orange Fab, checklist de 22 questions** |
| [25 — Chiffrage de la mission](docs/25-chiffrage-mission.md) | Tarifs marché tunisien, chiffrage par livrable, formules commerciales, fiscalité, négociation |
| [99 — Sources](docs/99-sources.md) | Références + **12 points à vérifier en Phase 0** |

## Code

| Dossier | Contenu | État |
|---|---|---|
| [`docs/sql/`](docs/sql/) | 10 migrations PostgreSQL | **Exécutées avec succès sur PostgreSQL 16** |
| [`docs/sql/tests/`](docs/sql/tests/) | 14 tests fonctionnels du ledger | **14/14 passent** |
| [`docs/presentation/`](docs/presentation/) | Deck client (15 slides) + pitch Orange 5 min (9 slides) | Validés, générateurs inclus |
| [`docs/devis/`](docs/devis/) | Devis ajustable (TJM, jours, TVA paramétrables) | 75 formules, 27 contrôles OK |

Les tests vérifient notamment l'idempotence, le rejet des débits excédant le solde, le
reversal sur échec de conversion, l'immuabilité append-only du ledger, et le fait qu'une
falsification commise **en contournant les triggers** est détectée par le chaînage de
hash. Détail dans [`docs/sql/README.md`](docs/sql/README.md).

---

## Les 5 conclusions à retenir

1. **La publicité pendant la tonalité de retour d'appel est une fonction réseau**, pas
   applicative. Elle exige un accord opérateur (RBT advertising). Aucun framework mobile ne
   change cela.
2. **iOS ne peut ni diffuser pendant un appel, ni détecter un appel GSM.** Le modèle
   « 1 minute = 1 point » y est inapplicable. La parité Android/iOS est structurellement
   impossible sur ce mécanisme.
3. **Le barème de points envisagé produit −767 % de marge à un CPM de 5 TND.** Le barème
   révisé, dérivé de l'économie unitaire, situe la récompense soutenable autour de
   **150 Mo/mois** — et non 3 Go. Les 3 Go ne deviennent finançables qu'en captant *tous*
   les appels (accord opérateur ou dialer Android).
4. **La stack Next.js / Vercel / Supabase / Capacitor est conservée**, avec trois
   corrections : Supavisor obligatoire, Realtime désactivé, plugins natifs Android maison.
   L'hébergement hors de Tunisie exige une **autorisation préalable de l'INPDP**.
5. **Les deux risques fatals sont commerciaux, pas techniques.** Blyk et RingPlus ont
   construit ce produit et sont morts faute d'annonceurs. La Phase 0 doit consacrer autant
   d'effort à vingt rendez-vous annonceurs qu'au POC technique.
6. **La voie opérateur a un précédent chiffré.** Turkcell « Tone&Win » (2008) est
   exactement le modèle de Call Com, récompense utilisateur incluse : 50 marques,
   72 campagnes, 200 000+ membres, ~20 minutes offertes par abonné et par mois. Et Orange
   Tunisie **exploite déjà** une plateforme de tonalité d'attente. Détail et checklist de
   négociation en [§24](docs/24-etude-orange-integration.md).
