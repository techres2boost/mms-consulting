# 00 — Executive Summary

**Projet :** plateforme tunisienne de publicité audio adossée aux appels téléphoniques,
rémunérant les utilisateurs en points convertibles en data mobile.
**Date du dossier :** 19 septembre 2026.
**Audience :** fondateur + future équipe de développement.

---

## 1. Verdict en une page

### Ce qui ne marche pas

Le mécanisme décrit au §2 du brief — *bip → publicité de 4 s → publicité répétée jusqu'au
décroché → conversation* sur un appel GSM classique — **n'est pas réalisable depuis une
application mobile.** Ni avec Capacitor, ni avec React Native, ni avec Flutter, ni avec du
natif. Trois raisons indépendantes :

1. **Le canal audio d'un appel GSM n'appartient pas à l'OS** mais au modem baseband et au
   RIL du vendeur. Android l'a toujours documenté (« You cannot play sound files in the
   conversation audio during a call ») ; iOS refuse d'activer une session audio pendant un
   appel cellulaire (`AVAudioSessionErrorInsufficientPriority`).
2. **La fenêtre « avant décroché » est une fonction réseau.** Ce que l'appelant entend est
   la tonalité de retour d'appel générée par le réseau. La remplacer par de la publicité
   s'appelle le *RBT advertising* et se fait dans le cœur de réseau de l'opérateur.
3. **Sur iOS, on ne peut même pas *compter* les appels GSM.** CallKit ne voit que les
   appels VoIP de votre propre app ; `CTCallCenter` est mort. Il n'existe aucun chemin
   App Store-conforme pour connaître le nombre ou la durée des appels d'un utilisateur iOS.
   Votre modèle de points « 1 minute = 1 point » est donc **inapplicable sur iOS**.

Corollaire à accepter comme contrainte produit : **la parité Android/iOS est
structurellement impossible sur ce mécanisme.**

### Ce qui marche

Le mécanisme n'est que **15 à 20 % du produit**. Les 80 % restants — ad server, ciblage
géographique, ledger de points, synchronisation offline, anti-fraude, back-office,
conversion en data — sont **identiques quelle que soit l'architecture d'appel retenue**.

D'où la recommandation centrale de ce dossier :

> **Ne bloquez pas la plateforme sur le mécanisme d'appel. Construisez la plateforme
> derrière une abstraction de diffusion, lancez avec le seul mécanisme réalisable
> aujourd'hui (publicité interstitielle avant l'appel, ALT-D), et ouvrez en parallèle,
> dès J0, la négociation opérateur qui est le seul chemin vers l'UX cible (ALT-A).**

### Le vrai risque n'est pas technique

Deux précédents documentés ont construit exactement ce produit et ont échoué **sur la
demande annonceur**, pas sur la technique : **Blyk** (MVNO financé par la pub, fermé,
diagnostic : manque de couverture pour intéresser les annonceurs) et **RingPlus**
(publicité entre la numérotation et la connexion, fermé en 2017, faute d'annonceurs
suffisants par zone). Avant d'écrire une ligne de code, il faut valider qu'on peut vendre
~300 à 1 200 impressions audio par utilisateur et par mois à un CPM couvrant le coût des
Go distribués. L'analyse d'économie unitaire (§16) montre une marge **mince**.

---

## 2. Architecture recommandée pour le MVP (résumé)

| Couche | Choix | Pourquoi |
|---|---|---|
| Mécanisme pub | **ALT-D « ad-then-dial »** : lecture locale d'un créatif de 4 s dans l'app, puis appel natif via `tel:` | Seule option réalisable aujourd'hui sur les deux OS, coût marginal nul, 100 % offline |
| Mobile | **Capacitor + 1 plugin natif Android maison** (état d'appel) | Votre stack tient. Le framework n'est pas le facteur limitant : aucun framework ne débloque iOS |
| Backend | **Supabase** (Postgres + Auth + Storage + Edge Functions + RLS) | Adapté jusqu'à ~10 k utilisateurs actifs sans changement structurel |
| Web | **Next.js sur Vercel** — back-office + dashboard client | Adapté, sans réserve |
| Base | **PostgreSQL**, ledger append-only, partitionnement des événements dès la conception | Le ledger est le cœur de confiance du produit |
| Attribution pub | **Moteur serveur** : éligibilité → pondération → plafonds de fréquence → `ORDER BY random()*poids` | Simple, auditable, suffisant jusqu'à ~100 campagnes |
| Points | **Modèle hybride C+A** : accrual par impression validée, plafonné mensuellement | Le seul modèle vérifiable des deux côtés et résistant à la fraude |
| Offline | **Offline-first en affichage, server-authoritative en valeur** | Les événements offline sont des *déclarations*, jamais des transactions |
| Data | **Fulfillment manuel en back-office** au MVP, machine à états prête pour l'automatisation via agrégateur (Reloadly / Ding) en Phase 3 | Aucune API opérateur publique n'existe ; l'agrégateur est réel mais l'onboarding B2B est long |
| Audio | **Opus 32 kbps mono** (fallback AAC-LC pour iOS ancien), ~16 Ko par créatif de 4 s | Catalogue entier cacheable localement |

**Ce que je change dans votre proposition initiale :** rien sur Next.js / Vercel /
Supabase / GitHub — ces choix sont bons. Je change **le mécanisme d'appel** (irréalisable
tel que décrit), **le modèle de points** (les minutes ne sont pas mesurables sur iOS) et
**le format audio** (MP4 n'est pas un format audio, c'est un conteneur ; Opus est le bon
choix). J'ajoute un plugin natif Android, un partitionnement de table dès le départ, et
une abstraction de canal de diffusion.

---

## 3. Coûts d'infrastructure (ordre de grandeur, septembre 2026)

| Palier | Infra / mois | Coût infra / utilisateur / mois |
|---|---|---|
| 100 utilisateurs | ~55 USD | ~0,55 USD |
| 1 000 | ~85 USD | ~0,085 USD |
| 10 000 | ~300–550 USD | ~0,04 USD |
| 100 000 | ~1 800–3 200 USD | ~0,025 USD |

**L'infrastructure n'est jamais le problème.** Le coût dominant est le **COGS des
récompenses** : si chaque utilisateur gagne l'équivalent de 500 Mo/mois, à un coût de
gros de ~0,65–1,00 USD, cela représente **6 500 à 10 000 USD/mois à 10 000 utilisateurs** —
soit 20 à 30 fois l'infrastructure. Détail et scénarios en §16.

---

## 4. Les 5 risques principaux

| # | Risque | Prob. | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **Demande annonceur insuffisante** (précédents Blyk / RingPlus) | Élevée | Fatal | 5 LOI annonceurs signées avant la Phase 1 ; CPM plancher contractuel |
| 2 | **Économie unitaire négative** (COGS data > revenu pub) | Élevée | Fatal | Points plafonnés ; barème de conversion pilotable en back-office ; kill-switch sur le ratio |
| 3 | **Aucun accord opérateur n'aboutit** → UX plafonnée à ALT-D | Élevée | Majeur | Ne jamais dépendre de ALT-A dans le plan de dev ; abstraction de diffusion |
| 4 | **Friction des 4 s → abandon de l'app**, l'utilisateur revient au dialer natif | Moyenne | Majeur | Test utilisateur en Phase 0 ; plafonner à 1 pub / N minutes ; récompenser au lieu d'imposer |
| 5 | **Fraude sur les événements offline** (root, émulateurs, multi-comptes) | Élevée | Moyen | Plafonds durs, attestation Play Integrity / App Attest, ledger append-only, accrual confirmé côté serveur uniquement |

Registre complet (12 risques) en §20.

---

## 5. Le POC à construire en premier

**Un seul livrable, 2 à 4 semaines, avant toute décision d'architecture.**

Application Capacitor jetable, non branchée sur la plateforme :
1. Écran « Appeler » → saisie d'un numéro.
2. Lecture d'un créatif Opus de 4 s embarqué (pas de réseau).
3. Lancement de l'appel natif via `tel:`.
4. Android : plugin natif qui remonte `CALL_STATE_OFFHOOK` / `IDLE` et calcule une durée.
5. iOS : documenter précisément ce qui est observable (réponse attendue : rien).
6. Journal local des événements, écran de debug.

**Critères de sortie (go/no-go) :**
- La lecture des 4 s est fiable > 98 % des tentatives sur ≥ 6 modèles Android réels du
  marché tunisien (dont entrée de gamme) + 2 iPhones.
- Le délai ajouté perçu est acceptable pour ≥ 70 % d'un panel de 20 utilisateurs réels.
- Android : la détection début/fin d'appel est fiable > 95 % et la durée mesurée est à
  ± 2 s de la réalité.
- Confirmation écrite que le manifeste ne déclare **aucune** permission du groupe
  *Call Log* (sinon la politique Play impose le rôle de dialer par défaut).

**Si le critère de friction échoue**, le produit doit être repensé avant tout
développement de plateforme : soit vers ALT-E (Android-only), soit vers une contrepartie
non liée à l'appel (publicité écoutée à la demande dans l'app), soit vers ALT-A comme
prérequis commercial.

---

## 6. Plan de lecture du dossier

| Doc | Contenu | Livrable du brief |
|---|---|---|
| [01](01-faisabilite-modele-coeur.md) | **Feasibility of the core business model** | §2, §23, §24, K |
| [02](02-analyse-fonctionnelle.md) | Acteurs, workflows, règles métier | B |
| [03](03-user-journeys.md) | 9 parcours détaillés | C |
| [04](04-architecture-technique.md) | Architecture cible + paliers MVP | D, §16, §17 |
| [05](05-architecture-mobile.md) | Capacitor vs RN vs Flutter vs natif | E, §8 |
| [06](06-architecture-backend.md) | Supabase, Edge Functions, queues, jobs | F |
| [07](07-database-schema.md) | Schéma Postgres complet + index | G, §12 |
| [08](08-moteur-selection-pub.md) | Moteur d'attribution, ciblage géo | §4, §5 |
| [09](09-architecture-audio.md) | Format, upload, transcodage, CDN, cache, purge | I, §3, §10, §11 |
| [10](10-architecture-offline.md) | Sync, conflits, sécurité cryptographique | J, §7 |
| [11](11-architecture-recompenses.md) | Modèles de points, ledger, conversion data | L, §6, §15 |
| [12](12-securite-privacy-conformite.md) | Auth, RLS, RBAC, loi 2004-63, INPDP | H, P, §13, §14 |
| [13](13-anti-fraude.md) | 8 scénarios de fraude et contre-mesures | Q, §22 |
| [14](14-back-office-rbac.md) | Arborescence, permissions, KPI | M, §9 |
| [15](15-scalabilite.md) | Dimensionnement 100 → 100 k | N, §18 |
| [16](16-estimation-couts.md) | Coûts fixes / variables + économie unitaire | O, §19, §25 |
| [17](17-kpi.md) | KPI produit / télécom / pub / finance / fraude | §26 |
| [18](18-ux-ecrans.md) | Écrans mobile, web client, back-office | §27 |
| [19](19-roadmap.md) | Phases 0 → 4, dépendances, critères | R, §28 |
| [20](20-risk-register.md) | Registre des risques | S |
| [21](21-deploiement-monitoring.md) | CI/CD, environnements, observabilité | §20, §21 |
| [22](22-conclusion.md) | Conclusion opérationnelle en 12 points | §32 |
| [sql/](sql/) | Migrations Postgres prêtes à l'emploi | §12 |
