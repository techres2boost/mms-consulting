# 22 — Conclusion : architecture recommandée pour le MVP

Réponse point par point aux 12 questions du §32 du brief.

---

## 1. Quel est le vrai MVP ?

**Pas ce que vous avez décrit.** Le brief décrit une plateforme de publicité en tonalité
de retour d'appel. Ce produit-là n'est pas constructible sans accord opérateur (§01).

**Le vrai MVP est : une plateforme de publicité audio géolocalisée avec portefeuille de
points convertibles en data, dont le premier canal de diffusion est une annonce de 4
secondes jouée dans l'application juste avant le lancement de l'appel natif.**

La différence est une question de séquencement, pas d'ambition. Le mécanisme de diffusion
représente 15 à 20 % du travail ; les 80 % restants — ad server, ciblage, ledger,
back-office, conversions, anti-fraude, synchronisation offline — sont **identiques dans
les cinq architectures analysées**. Il serait absurde de les bloquer en attendant un
accord commercial dont l'issue n'est pas sous votre contrôle.

**Ce qui est dans le MVP :** auth OTP, profils, consentements, back-office complet
(entreprises, campagnes, créatifs, zones), moteur de sélection, ledger, synchronisation
offline, conversion data en traitement manuel, dashboard KPI, RBAC.

**Ce qui n'y est pas, volontairement :** portail web client, self-service annonceur,
facturation automatisée, Play Integrity, détection statistique de fraude, délégations,
ciblage par rayon, Realtime.

---

## 2. Quelle architecture ?

**Monolithe modulaire, un seul schéma Postgres, aucune découpe réseau.**

```
Mobile (Capacitor) ──┐
Portail client ──────┼──► Vercel (Next.js) ──┐
Back-office ─────────┘                       ├──► Supabase
                                             │    ├─ Auth (JWT + OTP SMS)
Mobile ──────────────────────────────────────┤    ├─ PostgREST (lecture, RLS)
                                             │    ├─ Edge Functions (écritures)
                                             │    ├─ PostgreSQL (métier + ledger)
                                             │    └─ Storage (créatifs, privé + CDN)
                                             │
                                   pg_cron + pgmq (jobs et files, dans la base)
                                             │
                          SMS · Push · Agrégateur data (Ph.3) · Opérateur (Ph.3+)
```

**Pas de Kubernetes, pas de microservices, pas d'AWS assemblé à la main.** La décision
d'architecture la plus rentable du dossier est l'interface `AdDeliveryChannel` (§04) :
elle isole totalement le mécanisme d'appel, ce qui rend la bascule ALT-D → ALT-E → ALT-A
**additive** plutôt que destructrice.

---

## 3. Quelle technologie mobile ?

**Capacitor, plus 3 à 4 petits plugins natifs maison.**

Le raisonnement compte plus que la conclusion : **aucun framework ne débloque la capacité
manquante.** Ni React Native, ni Flutter, ni le natif ne permettent d'injecter de l'audio
dans un appel GSM ou de détecter un appel cellulaire sur iOS. Le travail natif
incompressible (Keystore, attestation, état d'appel Android, tâche de fond) est identique
partout : 5 à 10 jours.

Capacitor gagne sur un seul critère, mais il est décisif pour une petite équipe : la
réutilisation du code du portail Next.js (composants, types, client Supabase, design
system RTL).

**Deux conditions de sortie explicites :**
- si la performance sur l'entrée de gamme tunisienne échoue en Phase 0 → React Native ou
  Flutter ;
- si la Phase 0 oriente vers ALT-E (dialer Android) → **app Android en Kotlin natif**,
  Capacitor conservé pour iOS. Architecture hybride assumée, qui reflète l'asymétrie
  réelle des plateformes.

**Recommandation complémentaire : envisagez sérieusement de ne pas lancer iOS au MVP.**
Le marché tunisien est très majoritairement Android, iOS ne peut rien mesurer, et cela
économise ~30 % de l'effort mobile plus une revue App Store sur un modèle sensible.

---

## 4. Quelle technologie backend ?

**Supabase, sans réserve jusqu'à ~10 000 utilisateurs actifs.** Postgres managé + Auth +
Storage + Functions + RLS pour 25 USD/mois, avec un chemin de sortie propre (du Postgres
standard, aucun runtime propriétaire dans le métier).

Trois points à traiter dès le premier jour, faute de quoi ils se découvrent en
production :
1. **Supavisor en mode transaction** — obligatoire, pas optionnel, dès que les Edge
   Functions parlent à la base.
2. **Un seul RPC Postgres par batch de synchronisation** — un batch = une transaction =
   un aller-retour. C'est le choix de design le plus important du backend.
3. **N'activez pas Realtime.** Rien dans ce produit n'est temps réel ; c'est la première
   source de coût et de complexité inutile.

**Next.js sur Vercel** pour le back-office et le portail : adapté, sans réserve.

---

## 5. Comment gérer les appels ?

**Vous ne les gérez pas. Vous les lancez.**

```
App → écran de diffusion → créatif 4 s sur l'écouteur → tel:+216… → l'OS prend le relais
Android : TelephonyCallback → début/fin d'appel → durée sur horloge monotone
iOS     : rien. Aucun chemin conforme. À assumer, pas à contourner.
```

Aucun appel ne transite par votre infrastructure : **coût télécom nul, aucune exposition
réglementaire INT**. C'est le principal avantage économique de ALT-D, et il est chiffré :
en ALT-B (bridge d'appel), le coût télécom serait de ~20 000 USD/mois à 10 000
utilisateurs pour ~1 800 USD de revenu publicitaire (§16).

**Le numéro appelé ne quitte jamais le téléphone** (§12).

---

## 6. Comment gérer les publicités ?

**Sélection à deux étages, parce que le produit doit fonctionner hors ligne.**

- **Serveur** : éligibilité (statut, dates, zone via `ltree`, budget, opérateur) et calcul
  du **poids effectif** = `poids × priorité × rythme_budget × équilibrage_annonceur`.
- **Client** : plafonds locaux, puis **sélection proportionnelle au poids** avec pénalité
  de 0,15 sur le dernier créatif servi. Pas `ORDER BY random()` : la part de voix doit
  être prévisible pour être vendable.
- **Serveur à l'ingestion** : revalidation. Une impression servie hors règles est
  enregistrée mais **ni créditée ni facturée**.
- Graine dérivée de `(install_id, jour, compteur)` → séquence **reproductible pour
  audit**.

**Format : Opus 32 kbps mono, ~16 Ko pour 4 secondes.** MP4 est un conteneur, pas un
codec. Le catalogue complet de 200 créatifs pèse 3,2 Mo — votre inquiétude sur le poids
du stockage était mal placée : le vrai volume est la table d'impressions.

**Ciblage : gouvernorat uniquement au MVP** (24 valeurs). Délégations modélisées mais non
exposées ; **pas de ciblage par rayon** — il exigerait la localisation précise, donc un
consentement supplémentaire et un risque INPDP accru pour un gain publicitaire marginal.

---

## 7. Comment gérer les points ?

**Wallet + ledger append-only chaîné par hash. Pas un compteur.**

```
points_ledger    ← source de vérité, append-only, chaînée
points_wallets   ← solde matérialisé, reconstructible à tout moment
point_rules      ← barème VERSIONNÉ : chaque mouvement porte sa rule_version
```

**Barème retenu — dérivé de l'économie unitaire, pas de l'intuition :**
1 point par impression complète · plafond **6/jour** · bonus d'appel **désactivé** ·
bonus de fidélité 10/mois · bienvenue 20 · parrainage 30 après 5 impressions du filleul.
Validité 12 mois, expiration FIFO.

**Protection : quatre couches indépendantes**, toutes vérifiées par les tests exécutés
([`sql/tests/test_ledger.sql`](sql/tests/test_ledger.sql), 14/14) —
RLS sans policy d'écriture, `REVOKE` de privilèges, triggers d'immuabilité, et chaînage de
hash qui **détecte** une falsification même commise en désactivant les triggers (test
T10). C'est la propriété honnête : détection, pas prévention absolue.

---

## 8. Comment gérer l'offline ?

**Offline-first en affichage, server-authoritative en valeur.**

Le client produit des **faits déclarés**, jamais des transactions. Chaque événement porte
une signature ECDSA P-256 par une clé qui ne sort jamais du Keystore / Secure Enclave, un
`seq` monotone détenu par le serveur, une `idempotency_key`, et une horloge monotone
(`elapsedRealtimeNanos` + `boot_id`) qui neutralise toute manipulation d'heure.

**Il n'y a pas de conflit à résoudre** : en cas de divergence, **le serveur écrase,
toujours, sans négociation**. Et les débits (conversions) sont **interdits hors ligne** —
ce qui élimine d'un trait toute la classe des problèmes de double dépense.

**Réponse franche à votre question sur la sécurité :** l'architecture est **robuste**, pas
**inviolable**. Un appareil rooté peut produire des événements bien formés et correctement
signés décrivant des faits qui n'ont jamais eu lieu. C'est structurel, pas un défaut
d'implémentation : aucune signature ne peut attester de la véracité d'un fait, seulement
de son origine.

**D'où la règle qui structure tout le reste : ne laissez jamais un fait purement local
créer une valeur non bornée.** Avec le plafond retenu, la perte maximale d'un compte
frauduleux parfait est de ~190 points/mois ≈ **0,14 USD**. La sécurité économique remplace
ici la sécurité cryptographique — et elle suffit.

---

## 9. Comment gérer la data ?

**Traitement manuel en back-office au MVP. Automatisation via agrégateur en Phase 3.**

À distinguer nettement :
- **Techniquement possible et vérifié** : les agrégateurs (Reloadly, Ding) couvrent les
  trois opérateurs tunisiens par API, en dinar tunisien.
- **Nécessite un accord commercial** : l'onboarding B2B d'un agrégateur (KYC, contrat,
  prépaiement, change) prend 4 à 10 semaines → **à lancer en Phase 2, pas en Phase 3**.
- **Non vérifiable** : aucune API publique de recharge data n'est documentée pour TT,
  Orange TN ou Ooredoo TN. **Ne comptez pas dessus.**
- **Nuance à vérifier produit par produit** : les agrégateurs couvrent très bien
  l'*airtime* ; les *bundles data* sont un catalogue distinct. Repli acceptable :
  convertir en crédit d'appel et laisser l'utilisateur souscrire son bundle.

L'interface `RewardProvider` est définie dès le MVP avec une seule implémentation
(`manual`), ce qui rend l'automatisation additive. **`fulfil()` doit être idempotente** :
un retry non idempotent sur un agrégateur coûte de l'argent réel, immédiatement.

**Contrôle le plus important : le numéro cible doit être le numéro du compte.** C'est la
contre-mesure anti multi-comptes la plus efficace de tout le dispositif, parce qu'elle
attaque l'économie de l'attaque et non sa technique.

---

## 10. Combien cela coûterait ?

| Palier | Infra/mois | Infra/utilisateur | **COGS récompenses/mois** |
|---|---|---|---|
| 100 | ~35 USD | 0,35 USD | ~0 |
| 1 000 | ~91 USD | 0,09 USD | ~130 USD |
| 10 000 | ~180 à 310 USD | 0,02 à 0,03 USD | **~1 300 USD** |
| 100 000 | ~1 470 à 2 860 USD | ~0,015 à 0,03 USD | **~13 000 USD** |

**L'infrastructure n'est jamais le problème** (2 à 5 % des coûts). Le poste variable
dominant est le **SMS OTP** (jusqu'à 28 % de la facture infra à 100 k), et le poste
dominant tout court est le **COGS des récompenses**, piloté par votre barème.

**Seuil de rentabilité** (CPM 5 TND, marge brute de 0,15 USD par utilisateur actif) :
~11 000 utilisateurs pour couvrir 1 000 USD/mois de coûts fixes, **~55 000 pour financer
une équipe de trois personnes**.

---

## 11. Les 5 principaux risques

| # | Risque | Prob. | Impact | L'essentiel de la mitigation |
|---|---|---|---|---|
| **1** | **Demande annonceur insuffisante** — Blyk et RingPlus ont échoué exactement là, avec une technique qui fonctionnait | élevée | **fatal** | **Bloquer la Phase 1** sur 5 lettres d'intention et un CPM écrit ≥ 4 TND |
| **2** | **Économie unitaire négative** — le barème du brief donne **−767 % de marge à CPM 5 TND** | élevée | **fatal** | Barème dérivé de la contrainte `coût/pt ≤ 0,5 × revenu/pt`, en données, avec alerte marge < 20 % |
| **3** | **Aucun accord opérateur** → récompense plafonnée à ~150 Mo/mois au lieu de 3 Go | élevée | majeur | Ne jamais mettre ALT-A dans le chemin critique ; abstraction `AdDeliveryChannel` |
| **4** | **Friction des 4 s** → l'utilisateur revient au dialer natif | moyenne | majeur | Mesuré en Phase 0 ; plafond 1 pub/10 min ; récompenser au lieu de contraindre |
| **5** | **Goulot du traitement manuel des conversions** — un mi-temps à 15 k utilisateurs, deux temps pleins à 50 k | élevée | majeur | `RewardProvider` dès le MVP ; onboarding agrégateur en Phase 2 semaine 1 |

**Les deux risques fatals sont commerciaux, pas techniques.** Le dossier technique de ce
projet est maîtrisable ; son modèle économique est le vrai sujet. Registre complet de 13
risques en [§20](20-risk-register.md).

---

## 12. Quel POC construire en premier ?

**Un seul livrable, 4 à 6 semaines, avec trois chantiers en parallèle. Bloquant avant tout
développement de plateforme.**

**Chantier A — POC technique** (2–3 sem., 1 développeur)
Application Capacitor jetable : écran d'appel → créatif Opus de 4 s embarqué → `tel:` →
plugin natif Android pour l'état d'appel → journal local. Plus un spike de 3 à 5 jours sur
la faisabilité d'ALT-E.

**Chantier B — Validation commerciale** (parallèle) — **le plus important**
15 à 20 annonceurs locaux rencontrés sur 2 gouvernorats, avec un prix accepté **par
écrit**, objectif 5 lettres d'intention. Devis de gros data et devis SMS.

**Chantier C — Démarrages longs** (parallèle, dès J0)
Contact des trois opérateurs sur le RBT advertising ; dossier INPDP (déclaration +
**autorisation de transfert à l'étranger** — héberger sur Supabase et Vercel constitue un
transfert au sens de la loi 2004-63) ; clôture de la question ALT-B auprès des CPaaS et
d'un ITSP tunisien.

**Critères de sortie**

```
TECHNIQUE     lecture 4 s fiable > 98 % sur ≥ 6 modèles Android + 2 iPhones
              démarrage à froid < 3 s sur Samsung A14
              détection d'appel Android > 95 %, durée à ± 2 s
              aucune permission du groupe Call Log au manifeste

UTILISATEUR   ≥ 70 % d'un panel de 20 juge le délai acceptable
              abandon sur l'écran de pub < 15 %

COMMERCIAL    ≥ 5 lettres d'intention   ← BLOQUANT
              CPM ou forfait ≥ 4 TND équivalent
              coût de gros data ≤ 4 millimes/Mo
              coût SMS ≤ 0,03 USD

JURIDIQUE     chemin INPDP identifié, dossier engagé
```

**Si le critère commercial échoue, ne passez pas en Phase 1.** Si le critère utilisateur
échoue mais pas le commercial, repensez le mécanisme (ALT-E sur Android, ou publicité
écoutée à la demande dans l'app, sans lien avec l'appel) **avant** de construire la
plateforme.

---

## Ce que je change dans votre proposition initiale

| Votre hypothèse | Verdict | Remplacement |
|---|---|---|
| Pub pendant la tonalité de retour d'appel GSM | **Irréalisable** | ALT-D au MVP, ALT-A en cible |
| Capacitor | **Conservé** | + 3–4 plugins natifs maison |
| Next.js / Vercel | **Conservé** | Sans réserve |
| Supabase | **Conservé** | + Supavisor obligatoire, Realtime désactivé |
| GitHub | **Conservé** | + job CI de validation des migrations et du ledger |
| « 1 minute = 1 point » | **Inapplicable** | Accrual par impression (iOS ne mesure rien) |
| 100 pts → 500 Mo, 500 pts → 3 Go | **Intenable (−767 %)** | ~0,8 Mo/point, dérivé du CPM |
| Format MP4 | **Catégorie erronée** | Opus 32 kbps mono, 16 Ko |
| `users.points` | **Insuffisant** | Ledger append-only chaîné |
| Stocker le numéro appelé | **À ne pas faire** | Jamais transmis au serveur |
| 27 tables | **Révisé** | 24 tables, plus de fonctions couvertes |
| Ciblage par rayon | **Reporté** | Gouvernorat seul au MVP |
| Bridge d'appel (Twilio, §24) | **À écarter** | Économie unitaire négative + risque INT |

**Ce que j'ajoute et qui n'était pas dans le brief :** l'interface `AdDeliveryChannel`
(rend la bascule d'architecture additive), le partitionnement dès le jour 1, le
versionnement du barème (`rule_version`), l'autorisation INPDP de transfert à l'étranger,
et la validation commerciale comme critère **bloquant** de la Phase 0.

---

## Le mot de la fin

Votre stack technique est bonne. Votre mécanisme d'appel ne l'est pas, et il ne peut pas
l'être depuis une application mobile — c'est une contrainte des systèmes d'exploitation et
du réseau GSM, pas un manque d'ingénierie.

Mais ce n'est pas le point important de ce dossier.

Le point important est que **votre barème de points, tel qu'envisagé, perd de l'argent sur
chaque utilisateur, quel que soit le CPM**, et que **les deux produits historiques qui ont
tenté ce modèle sont morts de l'absence d'annonceurs, pas d'un problème technique**.

Construisez le POC. Mais consacrez autant d'énergie aux vingt rendez-vous annonceurs qu'au
code. C'est là que se joue le projet.
