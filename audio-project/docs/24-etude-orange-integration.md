# 24 — Étude d'intégration opérateur : Call Com × Orange Tunisie

**Étude technique · Senior Telecom / Solution Architecture**
Date : 21 septembre 2026 · Version 1.0
Commanditaire : consultant technique indépendant, pour le compte de Call Com

---

## Convention de lecture

Cette étude porte sur l'architecture interne d'un opérateur, que je ne connais pas. Chaque
affirmation est donc marquée :

| Marque | Signification |
|---|---|
| ✅ **FAIT** | Établi par source publique, citée |
| 🔶 **HYPOTHÈSE** | Pratique standard de l'industrie, très probable, **non vérifiée pour Orange Tunisie** |
| ❓ **À CONFIRMER** | Dépend de l'architecture réelle d'Orange — question à poser |

> **Je ne prétends pas connaître l'architecture d'Orange Tunisie. Je ne suppose pas
> qu'Orange dispose d'une API publique permettant cette fonctionnalité — la recherche
> montre au contraire que ce n'est pas le cas (§2.5).** L'objectif de ce document est de
> déterminer *exactement quoi demander* pour savoir si c'est possible.

---

# Executive Summary

## Le concept est techniquement fondé, et il a déjà été déployé par des opérateurs

Le concept de Call Com — une publicité audio de 3-4 s entendue pendant la sonnerie, puis
interrompue au décrochage — n'est pas une idée spéculative. C'est un service télécom
identifié, nommé **RBT Advertising**, et il existe un précédent commercial majeur qui
correspond presque exactement au modèle de Call Com, **récompense utilisateur incluse** :

✅ **FAIT — Turkcell « Tone&Win » (Turquie, lancé mai 2008)** : les abonnés s'inscrivent,
choisissent la publicité d'une marque comme tonalité d'attente, et **gagnent du crédit
ou des minutes proportionnellement au temps que leurs appelants ont réellement écouté**.
Résultats publiés : **50 marques, 72 campagnes** (Coca-Cola, Unilever, P&G, Nestlé,
Burger King, HSBC…), **plus de 200 000 membres**, puis ouverture à tous les abonnés.
Gain moyen : **65 unités ≈ 20 minutes par mois**, jusqu'à 150 unités ≈ 40 minutes pour
les abonnés à fort trafic entrant.

✅ **FAIT — le groupe Orange a lui-même un antécédent** : l'usage commercial de la
publicité en tonalité d'attente a démarré vers 2008 avec, entre autres, **Turkcell,
RingPlus et « Yesss! » d'Orange**.

Autrement dit : **Call Com ne demande pas à Orange d'inventer quelque chose. Call Com
demande à Orange de faire ce qu'un opérateur pair a fait il y a quinze ans, et ce que le
groupe Orange a déjà fait ailleurs.** C'est une position de négociation très différente,
et bien plus solide, que « nous avons une idée nouvelle ».

## Orange Tunisie possède déjà la brique technique

✅ **FAIT** : Orange Tunisie commercialise **déjà** un service de tonalité d'attente
personnalisée, géré par le menu `*144#`, avec abonnement mensuel (~500 millimes) et un
catalogue musical.

🔶 **HYPOTHÈSE FORTE (source de presse, à confirmer auprès d'Orange)** : la description
publique du service mentionne une **playlist pouvant aller jusqu'à 10 tonalités** et —
point déterminant — **la possibilité d'affecter une tonalité à des personnes ou des
groupes spécifiques**.

Si cette dernière capacité est confirmée, c'est l'information technique la plus
importante de cette étude : **elle signifierait que la plateforme d'Orange Tunisie sait
déjà sélectionner un contenu audio en fonction de l'appelant** — précisément le mécanisme
dont Call Com a besoin. Le saut à franchir ne serait alors pas « construire la sélection
par appelant » mais « alimenter cette sélection par des règles publicitaires plutôt que
par un choix personnel ». **C'est la question B3 du §12, et c'est la première à poser.**

## Le verrou réel n'est pas la diffusion, c'est la décision en temps réel

🔶 **HYPOTHÈSE structurante** : le composant qui joue l'audio existe et fonctionne. Ce qui
n'existe pas, c'est un chemin par lequel un tiers déciderait, **pendant l'établissement de
l'appel**, quel fichier jouer.

C'est un problème de **latence et de disponibilité**, pas de faisabilité :

- Le budget de latence dans le chemin d'établissement d'appel est de l'ordre de
  **50 à 150 ms au p99**. Une fonction serverless sur Vercel ou Supabase, appelée depuis
  le cœur de réseau via l'internet public, ne tient pas ce budget de façon fiable.
- Et surtout : **aucun opérateur n'accepte volontiers une dépendance externe dans le
  chemin d'établissement d'appel.** Si le service de Call Com ne répond pas, ce sont des
  appels dégradés sur le réseau d'Orange.

**Conséquence directe sur l'architecture à proposer** : ne proposez pas d'API temps réel
en première intention. Proposez le **pré-provisionnement** — Call Com pousse campagnes,
règles de ciblage et fichiers audio à l'avance, la plateforme d'Orange décide localement,
et les impressions reviennent en différé. C'est l'architecture A du §4, et c'est la seule
qui a une chance d'être acceptée en POC. L'API temps réel est une évolution de phase 2.

## Le point technique que je recommande de mettre sur la table

Il existe **deux variantes** du service, et Call Com n'en a envisagé qu'une :

| | **Variante T — terminaison** (celle du cahier des charges) | **Variante O — origine** |
|---|---|---|
| Qui entend la pub | L'**appelant** | L'**abonné Orange qui appelle** |
| Qui est récompensé | L'abonné appelé | **La même personne qui écoute** |
| Consentement | L'auditeur n'a pas consenti | **L'auditeur a consenti** ✅ |
| Ciblage géographique | Nécessite la localisation de l'appelant — **impossible s'il est hors réseau Orange** | **Orange connaît son propre abonné** ✅ |
| Dépendance à l'interconnexion | Oui : le réseau de l'appelant doit accepter le média précoce | **Non** ✅ |
| Précédent commercial | ✅ Turkcell Tone&Win | ❓ moins documenté |

**La variante O résout d'un coup les trois problèmes les plus durs** : le consentement de
l'auditeur, le ciblage géographique, et la dépendance à l'interconnexion. La variante T a
en revanche le précédent commercial le plus solide.

> **Recommandation : présenter les deux à Orange et demander laquelle est la plus simple
> dans *leur* réseau.** C'est une question qu'eux seuls peuvent trancher, et la poser
> ainsi vous positionne comme un partenaire technique, pas comme un demandeur.

## Ce qu'il ne faut pas attendre d'Orange

✅ **FAIT** : Orange expose bien des APIs réseau aux développeurs, dans le cadre de la
**GSMA Open Gateway / CAMARA** — plus de 10 APIs : *Quality on Demand*, *SIM Swap*,
*Location retrieval*, *Geofencing*, densité de population, etc. À l'échelle du programme,
plus de 300 instances de 20 APIs CAMARA sont lancées commercialement dans 65 marchés,
avec 33 APIs publiées et ~40 en développement.

**Aucune de ces APIs ne concerne le contrôle d'appel, la tonalité d'attente ou
l'injection de média.** Il n'existe donc **pas** de chemin en libre-service. Ce sera un
projet d'intégration VAS classique, avec un contrat.

En revanche, *Location retrieval* et *Geofencing* sont directement pertinents pour le
ciblage géographique — ❓ **à confirmer** : sont-ils disponibles sur le marché tunisien ?

## Recommandation en une ligne

> **Ne demandez pas à Orange l'autorisation d'entrer dans son réseau. Proposez-lui un
> produit de monétisation sur une plateforme qu'il exploite déjà, avec un précédent
> opérateur chiffré à l'appui, et demandez-lui un POC en pré-provisionnement sur
> 20 lignes de test.**

Le POC proposé au §7 dure **6 à 10 semaines** et ne demande à Orange aucun développement
nouveau si la plateforme CRBT existante est utilisée telle quelle.

---

# 1. Business Concept

## 1.1 Le service

| Élément | Description |
|---|---|
| **Proposition abonné** | J'accepte qu'une publicité de 3-4 s soit diffusée pendant la sonnerie de mes appels ; en échange je reçois des unités convertibles en data, crédit, minutes ou SMS |
| **Proposition annonceur** | J'achète un inventaire audio court, ciblé géographiquement, dans un moment d'attention captive |
| **Proposition Orange** | Je monétise un inventaire que je possède déjà et qui ne rapporte rien aujourd'hui, sans investissement d'infrastructure, avec un partenaire qui apporte la force commerciale annonceurs |
| **Proposition Call Com** | J'opère la régie, l'application, le portefeuille d'unités et le back-office |

## 1.2 Ce qui rend la proposition crédible pour Orange

Trois arguments, dans cet ordre :

1. **L'inventaire existe et dort.** Chaque appel non décroché immédiatement représente
   5 à 10 secondes d'espace audio qui ne génèrent aucun revenu.
2. **Le précédent est chiffré.** Turkcell : 50 marques, 72 campagnes, 200 000+ membres
   (✅ FAIT). Ce n'est pas un pari.
3. **Call Com apporte ce qu'Orange n'a pas.** Orange a le réseau, la base d'abonnés et la
   facturation. Orange n'a pas — et ne veut pas construire — une force de vente
   publicitaire auprès de milliers de commerçants locaux tunisiens (restaurants,
   pharmacies, garages, cliniques). C'est exactement le métier de Call Com.

✅ **FAIT** : le groupe Orange dispose par ailleurs d'une régie publicitaire et data,
**Orange Advertising**, qui commercialise les espaces publicitaires de l'écosystème
opérateur (web, mobile, TV, IPTV) en s'appuyant sur les données opérateur. Cela prouve que
la publicité adossée aux actifs opérateur est un axe assumé du groupe — un argument utile,
et une piste d'interlocuteur.

## 1.3 Ce qui doit rester chez Orange et ce qui doit rester chez Call Com

C'est le point le plus important de la négociation, et il faut arriver avec une position
claire :

```
ORANGE GARDE                          CALL COM GARDE
─────────────                          ──────────────
Le réseau et la plateforme média        La relation annonceur
La base d'abonnés                       Les créatifs et les campagnes
Le consentement et la facturation       Le back-office et le reporting
La conformité réglementaire             L'application mobile
Les données d'abonné (jamais exportées) Le portefeuille d'unités
                                        Le ciblage (règles, pas données brutes)
```

**Ne demandez jamais d'accès aux données d'abonnés d'Orange.** Demandez qu'Orange
*applique* des règles de ciblage que Call Com fournit. C'est la même fonction, sans le
transfert de données — et c'est la différence entre un projet acceptable et un projet
refusé par la conformité.

---

# 2. Technical Feasibility

## 2.1 Où se situe la publicité dans le parcours d'un appel

### Appel CS (2G / 3G) — le cas majoritaire en Tunisie aujourd'hui

```
A (appelant)        MSC-A / VMSC-A         GMSC-B         HLR-B        MSC-B/VLR-B      B
    │                     │                   │             │               │           │
    │── SETUP ───────────►│                   │             │               │           │
    │                     │── ISUP IAM ──────►│             │               │           │
    │                     │                   │── SRI ─────►│               │           │
    │                     │                   │◄── SRI-ack ─┤  (+ T-CSI ?)  │           │
    │                     │                   │── ISUP IAM ────────────────►│           │
    │                     │                   │             │               │── PAGE ──►│
    │                     │                   │             │               │◄─ ALERT ──┤
    │                     │◄── ISUP ACM/CPG (Alerting) ──────────────────────┤           │
    │                     │                                                             │
    │  ┌──────────────────┴────────────────────────────────────────────────┐             │
    │  │ ICI se décide ce que A entend :                                   │             │
    │  │  (a) MSC-A génère la tonalité LOCALEMENT  ← comportement par défaut│            │
    │  │  (b) ou l'indicateur « in-band information available » est présent │            │
    │  │      et MSC-A OUVRE le canal audio vers l'amont (cut-through)     │             │
    │  └───────────────────────────────────────────────────────────────────┘             │
    │◄═══ audio (tonalité locale, OU média précoce venant de l'aval) ═══════════════════│
    │                                                                                    │
    │◄── ISUP ANM (décrochage) ─────────────────────────────────────────────────────────┤
    │◄═══════════════ conversation A ↔ B ══════════════════════════════════════════════►│
```

✅ **FAIT (standard GSM/ISUP)** : par défaut, **la tonalité de retour d'appel est générée
localement par le commutateur de l'appelant**, sur réception du message d'alerte. Le
combiné de B ne produit rien pour A, et le combiné de A ne fait que restituer une tonalité
que son propre commutateur fabrique.

**Pour qu'un contenu audio atteigne A, il faut que quelque chose en aval envoie du
« média précoce » (*early media*) en bande, et que MSC-A accepte d'ouvrir le canal plutôt
que de générer sa tonalité locale.**

### Le mécanisme CRBT en réseau CS — composant par composant

✅ **FAIT (architecture CRBT documentée)** :

| Composant | Rôle dans l'insertion |
|---|---|
| **HLR-B** | Porte le **T-CSI** (*Terminating CAMEL Subscription Information*) de l'abonné appelé. Le GMSC le récupère lors de l'interrogation HLR. C'est le **déclencheur d'abonnement** : sans T-CSI sur la ligne, aucun service CRBT ne s'active |
| **GMSC / MSC (rôle SSF)** | Sur présence du T-CSI, émet un **CAMEL InitialDP** vers le SCP. C'est le point de contrôle |
| **SCP** (*Service Control Point*) | Porte la **logique de service** : quel contenu, pour quel appelant, à quelle heure. Répond au SSF par des instructions (`ConnectToResource`, `PlayAnnouncement`, ou redirection de la jambe) |
| **MRF / serveur média** (*SRF*) | **Stocke et joue les fichiers audio.** C'est le composant qui produit physiquement le son entendu par A |
| **CRBT-AS + portail** | Gestion des abonnements, du catalogue, des préférences par appelant, de la facturation du service |

Le flux, tel que documenté : l'appelant appelle ; le GMSC obtient le T-CSI de l'appelé
depuis son HLR ; quand le combiné de l'appelé commence à sonner, le MSC déclenche une
requête CAMEL vers le SCP de la plateforme RBT, qui instruit le MSC de jouer à l'appelant
la tonalité sélectionnée par l'abonné.

### Appel IMS / VoLTE — beaucoup plus propre

```
A ─► P-CSCF(A) ─► S-CSCF(A) ══ interco ══► S-CSCF(B) ─┬─► [iFC] ─► CRBT AS (B2BUA)
                                                       │                │
                                                       │                ├─► INVITE vers B
                                                       │                │
                                                       │                └─► MRF ─┐
                                                       │                         │
   A ◄── 183 Session Progress + SDP + P-Early-Media ◄──┴─────────────────────────┘
   A ◄═══════════ RTP : la publicité ═══════════════════════════════════════════
                                                       B décroche → 200 OK
   A ◄── 200 OK ── le AS coupe le MRF et bascule le média sur B
   A ◄═══════════ conversation A ↔ B ══════════════════════════════════════════►
```

✅ **FAIT (mécanismes SIP standard)** : le service repose sur le **183 Session Progress**
portant le SDP du média précoce, l'en-tête **`P-Early-Media`** (RFC 5009) qui autorise et
cadence ce média précoce dans le réseau d'origine, et **PRACK** (RFC 3262) pour la
fiabilisation des réponses provisoires. Le serveur d'application CRBT se comporte en
**B2BUA** : il forke l'appel vers B et établit en parallèle le flux du MRF vers A, puis
bascule au `200 OK`.

🔶 **HYPOTHÈSE** : c'est dans cette architecture que la sélection dynamique par appel est
naturelle — un AS SIP est un serveur applicatif, il peut consulter une base ou appeler un
service au moment de l'INVITE. **En CS/CAMEL, la même chose est possible mais passe par
le SCP, dont les temps de réponse sont plus contraints.**

❓ **À CONFIRMER — question de première importance** : Orange Tunisie a-t-il déployé
**VoLTE/IMS**, et si oui, quelle part du trafic voix y transite ? ✅ **FAIT** : Ooredoo
Tunisie a officiellement lancé VoLTE et l'IPv6 le 28 novembre 2023. Le statut d'Orange
Tunisie n'est pas établi publiquement. **Cette réponse détermine si l'intégration est un
projet IMS (moderne, souple) ou CAMEL (legacy, plus rigide), et change l'estimation
d'effort du tout au tout.**

## 2.2 Quel composant devrait jouer la publicité — réponse synthétique

| Composant | Peut-il jouer la pub ? | Rôle réel |
|---|---|---|
| **MSC** | Indirectement | Il est le **point de contrôle** (SSF) et décide d'ouvrir ou non le canal audio. Il ne stocke pas de contenu publicitaire |
| **IMS / S-CSCF** | Non directement | Il **route** vers l'AS via les iFC. C'est le point d'accroche de l'abonnement |
| **VoLTE** | Non — c'est un service, pas un composant | Détermine *dans quelle architecture* on travaille |
| **IN / SCP** | Non — il décide | Porte la **logique** : quel contenu pour quel appel. **C'est ici que la logique publicitaire devrait vivre** |
| **CAMEL** | Non — c'est un protocole | Le **mécanisme de déclenchement** (T-CSI → InitialDP) |
| **CRBT / RBT platform** | **Oui — c'est le bon composant** | Le service existant à réutiliser. Il contient déjà AS + MRF + logique par appelant |
| **MRF / serveur média** | **Oui — physiquement** | Stocke et diffuse le fichier audio. C'est l'exécutant |
| **Application Server (IMS)** | **Oui — en B2BUA** | Le bon point d'intégration en réseau IMS |

> **Réponse en une phrase : le composant à réutiliser est la plateforme CRBT d'Orange
> (AS + MRF), et le composant à influencer est sa logique de sélection (SCP / AS).**

## 2.3 Est-ce « un RBT personnalisé mais avec de la publicité dynamique » ?

**Oui, exactement — et c'est la bonne façon de le formuler devant Orange.**

Différences entre le CRBT classique et ce que demande Call Com :

| Dimension | CRBT classique | Besoin Call Com | Écart |
|---|---|---|---|
| Qui choisit le contenu | L'abonné, dans un catalogue | **Un moteur de règles publicitaires** | **C'est le seul vrai écart** |
| Variation par appelant | 🔶 **Probablement déjà supporté** — affectation par personne ou groupe (source de presse, ❓ à confirmer) | Par zone, campagne, segment | Faible **si confirmé** |
| Variation par numéro appelé | ✅ Natif (c'est l'abonné) | Oui | Nul |
| Variation par localisation | ❓ à confirmer | Oui — critère principal | **Moyen à élevé** |
| Variation par heure | 🔶 probable (plages horaires courantes en CRBT) | Oui | Faible |
| Variation par campagne / dates | 🔶 probable (catalogue daté) | Oui | Faible |
| Consentement | ✅ Natif (abonnement opt-in) | Oui | Nul |
| Rotation, plafonds de fréquence | ❓ à confirmer | Oui | **Moyen** |
| Comptage des secondes écoutées | 🔶 probable (facturation à la durée) — et ✅ **FAIT** chez Turkcell, qui reversait à la seconde écoutée | **Indispensable** | Faible |

**Lecture : sur les neuf dimensions, une seule constitue un écart majeur — l'origine de la
décision.** Tout le reste existe déjà ou est une extension mineure. C'est un argument
puissant, et il faut le dire ainsi.

## 2.4 La contrainte dont personne ne parle : la latence

C'est le point qui décide de l'architecture, et il faut arriver en réunion en l'ayant déjà
intégré.

```
t=0     A appuie sur « appeler »
t≈0,3s  IAM / INVITE atteint le réseau terminant
t≈0,5s  déclenchement CAMEL InitialDP  /  iFC → AS
        ┌──────────────────────────────────────────────────────────┐
        │ FENÊTRE DE DÉCISION : ~50 à 150 ms au p99                │
        │ Au-delà : post-dial delay perceptible, l'appelant croit   │
        │ que l'appel a échoué, ou le SSF part en timeout           │
        └──────────────────────────────────────────────────────────┘
t≈0,7s  le MRF commence à jouer
t≈5-8s  B décroche (moyenne) → arrêt de la pub, bascule
```

🔶 **HYPOTHÈSE (pratique standard)** : un SCP CAMEL a un budget de réponse de l'ordre de
100 ms, avec un timeout dur et un comportement de repli. Un AS IMS est plus tolérant mais
reste dans le même ordre de grandeur.

**Conséquences, à énoncer clairement :**

1. **Un appel HTTPS depuis le cœur de réseau vers une fonction serverless sur l'internet
   public ne tient pas ce budget de manière fiable.** Latence Tunisie→Europe, poignée TLS,
   démarrage à froid : le p99 sera de plusieurs centaines de millisecondes.
2. **Aucun opérateur n'accepte volontiers une dépendance externe dans le chemin
   d'établissement d'appel.** Si Call Com tombe, ce sont les appels d'Orange qui se
   dégradent. C'est un argument que l'équipe cœur de réseau soulèvera en première minute,
   et il est légitime.
3. **Donc : ne proposez pas d'API temps réel en première intention.** Proposez le
   pré-provisionnement (§4, Architecture A). Vous aurez l'air d'un architecte télécom,
   pas d'un développeur web.
4. **Tout appel externe doit avoir un timeout dur et un repli sur la tonalité normale**,
   sans exception. À dire avant qu'on vous le demande.

## 2.5 Y a-t-il une API Orange pour cela ? Non.

✅ **FAIT** : Orange participe à la **GSMA Open Gateway** et au projet **CAMARA**
(Linux Foundation + GSMA), aux côtés de 24 autres opérateurs, et expose **plus de
10 APIs réseau** : *Quality on Demand*, *SIM Swap*, *Location retrieval*, *Geofencing*,
densité de population, etc. Au niveau du programme : plus de **300 instances de 20 APIs
CAMARA** lancées commercialement dans **65 marchés**, **33 APIs publiées** et une
quarantaine en développement.

**Aucune API de contrôle d'appel, de tonalité d'attente ou d'injection de média n'existe
dans ce catalogue.** Le besoin de Call Com n'est pas couvert et ne le sera probablement
pas à court terme : les APIs CAMARA portent sur l'identité, la localisation, la qualité de
service et la fraude — pas sur le média en session.

**Deux conséquences utiles :**
- Il n'y a **aucun chemin en libre-service**. Ce sera un contrat et une intégration VAS.
- Mais **Location retrieval** et **Geofencing** sont exactement ce qu'il faudrait pour le
  ciblage géographique. ❓ **À confirmer** : sont-ils commercialisés en Tunisie, et à quel
  tarif ? Si oui, c'est une brique de ciblage déjà industrialisée et contractualisable,
  indépendamment du CRBT.

## 2.6 Les deux contraintes de ciblage qu'il faut anticiper

### (a) On ne peut pas cibler géographiquement un appelant hors réseau Orange

Dans la variante **terminaison** (celle du cahier des charges), l'auditeur est l'appelant.
Pour le cibler par zone, il faut connaître sa localisation.

- Appelant **abonné Orange** : 🔶 Orange connaît sa position (VLR / cellule) ou au moins sa
  zone de rattachement.
- Appelant **Ooredoo, Tunisie Telecom, ou international** : Orange ne connaît que le
  MSISDN. ✅ **FAIT** : les préfixes mobiles tunisiens **ne sont pas géographiques**. Donc
  **aucun ciblage par zone n'est possible** sur ces appelants.

❓ **À CONFIRMER** : quelle part des appels entrants vers un abonné Orange provient
d'Orange lui-même ? C'est ce chiffre qui détermine la part réellement ciblable de
l'inventaire. **Question à poser, la réponse peut diviser l'inventaire utile par deux ou
trois.**

### (b) Le média précoce doit traverser l'interconnexion

Dans la variante terminaison, Orange émet du média précoce vers le réseau de l'appelant.
Si celui-ci ne l'accepte pas — politique `P-Early-Media`, passerelle qui ne fait pas le
cut-through, interconnexion legacy — **l'appelant n'entend pas la publicité** et perçoit
une tonalité normale, voire un silence.

❓ **À CONFIRMER** : le média précoce est-il honoré sur les interconnexions
Orange ↔ Ooredoo, Orange ↔ Tunisie Telecom, et à l'international entrant ?

**Ces deux contraintes disparaissent dans la variante origine.** C'est le cœur de
l'argument du §2.7.

## 2.7 La variante « origine » — ce que je recommande de mettre sur la table

Le cahier des charges décrit la variante terminaison. Il existe une variante symétrique,
que Call Com n'a pas envisagée, et qui est techniquement plus propre.

**Principe** : la publicité est jouée à **l'abonné Orange qui émet l'appel**, pendant qu'il
attend que son correspondant décroche. L'accroche n'est plus le T-CSI / iFC terminant de
l'appelé, mais le **O-CSI / iFC d'origine** de l'appelant.

```
Abonné Orange (consentant) ─► MSC-A / S-CSCF(A) ─┬─► [O-CSI / iFC origine] ─► AS Call Com
                                                  │                              │
                                                  ├─► acheminement normal vers B  │
                                                  │                              │
        l'abonné entend  ◄────────────────────────┴──── MRF (la publicité) ◄──────┘
        B décroche → arrêt immédiat, conversation normale
```

**Pourquoi c'est plus propre, point par point :**

| Problème | Variante T (terminaison) | Variante O (origine) |
|---|---|---|
| Consentement de l'auditeur | ❌ L'appelant n'a rien accepté | ✅ **L'auditeur est l'abonné qui a souscrit** |
| Récompense | ❌ Va à quelqu'un d'autre que l'auditeur | ✅ **Va à l'auditeur** — le deal est cohérent |
| Ciblage géographique | ❌ Impossible hors réseau | ✅ **Orange connaît son propre abonné** |
| Interconnexion / média précoce | ❌ Dépend du réseau d'en face | ✅ **Aucune dépendance** — MSC-A génère déjà la tonalité |
| Fonctionne si B est à l'étranger | ❌ Non pertinent | ✅ **Oui** |
| Fonctionne si B est sur un autre opérateur | 🔶 selon interconnexion | ✅ **Oui** |
| Données personnelles | ❌ Traite des données sur des non-clients | ✅ **Uniquement l'abonné consentant** |
| Précédent commercial | ✅ **Turkcell Tone&Win** | ❓ moins documenté |
| Inventaire | Appels **reçus** par l'abonné | Appels **émis** par l'abonné |

❓ **À CONFIRMER, question technique précise à poser** : dans le cas origine, si le réseau
de B envoie lui-même du média précoce (parce que B a son propre CRBT), lequel gagne ?
L'AS d'origine peut-il ignorer le média précoce entrant et imposer le sien pendant les
premières secondes ? **C'est la seule vraie inconnue technique de la variante O.**

> **Recommandation : présentez les deux variantes, avec ce tableau, et demandez à Orange
> laquelle est la moins coûteuse à mettre en œuvre chez eux.** Vous ne pouvez pas trancher
> de l'extérieur — mais poser la question avec ce niveau de précision change la nature de
> la réunion.

## 2.8 Verdict de faisabilité

| Question | Réponse |
|---|---|
| Le concept est-il techniquement réalisable ? | **Oui**, dans le réseau de l'opérateur |
| A-t-il déjà été réalisé ? | **Oui** — ✅ Turkcell Tone&Win, et « Yesss! » dans le groupe Orange |
| Orange Tunisie a-t-il la brique ? | **Très probablement** — ✅ service en production ; 🔶 affectation par appelant selon une source de presse, ❓ à confirmer |
| Faut-il qu'Orange développe du neuf ? | **Pour un POC : probablement non.** Pour du dynamique à l'échelle : oui, modérément |
| Quel est le verrou technique réel ? | **La décision en temps réel** et la dépendance externe dans le chemin d'appel |
| Quel est le verrou non technique ? | **Le partenariat commercial** et la conformité |
| Peut-on le savoir sans Orange ? | **Non.** D'où le §12 |

---

# 3. Telecom Architecture

## 3.1 Vue d'ensemble des composants en jeu

```
┌─────────────────────────── DOMAINE ORANGE ────────────────────────────────┐
│                                                                            │
│  ACCÈS / CŒUR VOIX                    SERVICES                             │
│  ┌──────────────┐                     ┌────────────────────────────────┐   │
│  │ MSC / VMSC   │  (CS 2G/3G)         │ HLR / HSS                      │   │
│  │ rôle SSF     │◄────────────────────┤ porte O-CSI / T-CSI / iFC      │   │
│  └──────┬───────┘                     └────────────────────────────────┘   │
│         │ CAMEL InitialDP                                                  │
│         ▼                                                                  │
│  ┌──────────────┐                     ┌────────────────────────────────┐   │
│  │ SCP          │────────────────────►│ CRBT Application Server        │   │
│  │ logique      │                     │ + catalogue + préférences      │   │
│  └──────┬───────┘                     │ + logique par appelant ✅ existe│  │
│         │                             └───────────────┬────────────────┘   │
│         │ ConnectToResource                           │                    │
│         ▼                                             ▼                    │
│  ┌──────────────┐                     ┌────────────────────────────────┐   │
│  │ MRF / SRF    │                     │ Stockage des fichiers audio    │   │
│  │ joue l'audio │◄────────────────────┤ (format imposé par Orange)     │   │
│  └──────────────┘                     └────────────────────────────────┘   │
│                                                                            │
│  ┌──────────────┐   (IMS/VoLTE)       ┌────────────────────────────────┐   │
│  │ P/I/S-CSCF   │────[iFC]───────────►│ AS CRBT en B2BUA               │   │
│  └──────────────┘                     └────────────────────────────────┘   │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ MÉDIATION / CDR / FACTURATION  → source des impressions facturables  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬───────────────────────────────────────────────┘
                             │  Zone d'intégration à négocier
                             │  (pré-provisionnement, ou API, ou nœud on-prem)
┌────────────────────────────▼───────────────────────────────────────────────┐
│                        DOMAINE CALL COM                                    │
│  Ad Campaign Mgmt · Targeting Engine · Decision Service · Asset Pipeline   │
│  Impression Ingestion · Validation · Reward Ledger · App mobile · BO       │
└────────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Les trois points d'intégration possibles, par ordre de profondeur

| Niveau | Où | Ce que Call Com fournit | Acceptabilité opérateur |
|---|---|---|---|
| **N1 — Contenu** | Catalogue de la plateforme CRBT | Fichiers audio + métadonnées + règles, poussés à l'avance | **Élevée** — Call Com est un fournisseur de contenu de plus |
| **N2 — Décision** | SCP / AS | Un service consulté à l'établissement de l'appel | **Faible à moyenne** — dépendance dans le chemin d'appel |
| **N3 — Média** | MRF | Un serveur média Call Com dans le chemin RTP | **Très faible** — personne ne met un tiers sur le RTP |

**À viser en POC : N1 exclusivement.** N2 en phase 2, et seulement avec un nœud de
décision hébergé **dans** le datacenter d'Orange. N3 : à ne pas demander.

## 3.3 Budget de latence et modes de repli

| Étape | Budget cible | Repli si dépassement |
|---|---|---|
| Déclenchement CAMEL / iFC | ~10 ms | Néant (interne Orange) |
| Décision publicitaire **locale** (N1) | < 5 ms | Créatif par défaut de la campagne |
| Décision publicitaire **externe** (N2) | **< 100 ms p99** | **Tonalité normale** — jamais de silence, jamais d'échec d'appel |
| Chargement du média par le MRF | < 50 ms | Créatif préchargé en cache |
| Total avant premier son | **< 200 ms** | — |

**Règle non négociable, à énoncer spontanément devant l'équipe cœur de réseau :**
> *« Aucune indisponibilité de Call Com ne doit dégrader un appel Orange. Le comportement
> de repli est la tonalité de retour d'appel standard, et nous acceptons que ce repli soit
> déclenché par un timeout dur côté Orange, sans consultation de notre part. »*

Cette phrase, dite avant qu'on vous la demande, vaut plusieurs réunions.

---

# 4. Orange Integration Options

Trois architectures, présentées **par ordre d'acceptabilité opérateur décroissante** — ce
qui n'est pas l'ordre d'élégance technique.

---

## Architecture A — Orange décide, Call Com pré-provisionne

> **🎯 C'est l'architecture à proposer pour le POC.**

### Diagramme

```
   CALL COM (hors réseau)                          ORANGE
   ──────────────────────                          ──────
   ┌────────────────────┐
   │ Back-office        │
   │ campagnes, zones,  │
   │ dates, plafonds    │
   └─────────┬──────────┘
             │  ① export quotidien (SFTP / API batch)
             │     • fichiers audio (format Orange)
             │     • manifeste : ad_id, campagne, zones,
             │       dates, plages horaires, poids, plafonds
             ▼
   ┌─────────────────────────────────────────────────────────┐
   │ ZONE D'ÉCHANGE (SFTP sécurisé ou dépôt objet)           │
   └─────────────────────────────────────────────────────────┘
             │  ② ingestion + validation par Orange
             ▼
   ┌─────────────────────────────────────────────────────────┐
   │ Plateforme CRBT Orange                                   │
   │  • catalogue enrichi des créatifs Call Com               │
   │  • règles de sélection appliquées LOCALEMENT             │
   │  • aucune dépendance externe pendant l'appel             │
   └─────────────────────────────────────────────────────────┘
             │  ③ appel réel → AS/SCP sélectionne → MRF joue
             │
             │  ④ export des événements de diffusion (CDR / logs)
             ▼                    quotidien ou horaire
   ┌─────────────────────────────────────────────────────────┐
   │ Call Com — Impression Ingestion & Validation             │
   │  → Reward Ledger → unités créditées → app mobile         │
   └─────────────────────────────────────────────────────────┘
```

### Flux d'un appel
1. Appel vers (ou depuis) un abonné inscrit.
2. Déclenchement T-CSI/O-CSI → SCP, ou iFC → AS.
3. **Sélection locale** dans le catalogue, selon les règles pré-poussées.
4. MRF joue le créatif. Décrochage → arrêt immédiat → conversation.
5. Événement de diffusion écrit dans les logs/CDR d'Orange.
6. Export périodique vers Call Com → validation → crédit des unités.

### Flux de sélection publicitaire
**Entièrement chez Orange, hors ligne du point de vue de Call Com.** Call Com exprime
son ciblage sous forme de **règles déclaratives** poussées à l'avance, jamais sous forme
d'appel en temps réel.

### APIs nécessaires
Aucune API temps réel. Deux interfaces batch :
- `POST /assets` ou dépôt SFTP — création/mise à jour des créatifs et du manifeste ;
- récupération périodique des fichiers d'impressions (CDR).

### Données échangées

| Sens | Données | Données personnelles ? |
|---|---|---|
| Call Com → Orange | fichiers audio, `ad_id`, `campaign_id`, zones ciblées, dates, plages horaires, poids, plafonds de fréquence | **Non** |
| Orange → Call Com | `impression_id`, `ad_id`, horodatage, durée écoutée, appel décroché oui/non, zone agrégée, **identifiant d'abonné pseudonymisé** | **Pseudonymisées** — voir §8 |

### Sécurité
Échange sur SFTP avec clés, ou mTLS. Signature des manifestes. Contrôle d'intégrité des
fichiers audio par empreinte SHA-256. Aucun accès réseau entrant vers Orange.

### Latence
**Nulle dans le chemin d'appel.** C'est le principal argument de cette architecture.

### Scalabilité
Limitée par la capacité du MRF d'Orange, pas par Call Com. ❓ à confirmer : nombre de
sessions média simultanées.

### Dépendances
Capacité de la plateforme CRBT à porter des règles de sélection par zone/date/plage.
❓ **À confirmer** — c'est la question technique n°1.

### Avantages
Aucune dépendance externe dans le chemin d'appel · réutilise l'existant · acceptable par
l'équipe cœur de réseau · mesure exacte par CDR · démontrable en POC rapidement.

### Limites
Pas de temps réel : une campagne activée à 10 h peut n'être diffusée qu'à J+1 · rotation
et plafonds limités à ce que sait faire la plateforme d'Orange · Call Com ne maîtrise pas
la sélection, donc ne peut pas garantir une part de voix à un annonceur au jour près.

### Complexité
**Faible côté Orange** (ingestion de contenu, ce qu'ils font déjà) · **faible côté
Call Com**.

### À valider par Orange
Capacité de règles de la plateforme · format audio imposé · fréquence des exports
d'impressions · contenu exact des CDR · volumétrie du catalogue admissible.

---

## Architecture B — Orange consulte Call Com en temps réel

> ⚠️ **Techniquement la plus élégante, commercialement la plus difficile.** À ne pas
> proposer en première réunion.

### Diagramme

```
                ORANGE                                    CALL COM
   ┌──────────────────────────────┐
   │ MSC/SCP  ou  S-CSCF/AS       │
   │        (appel en cours)      │
   └──────────────┬───────────────┘
                  │ ① POST /ad-decision
                  │    { correlation_id, direction, zone_hint,
                  │      subscriber_ref (pseudonyme), timestamp }
                  │    timeout DUR : 100 ms
                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │              Ad Decision Service (Call Com)                  │
   │   éligibilité → pondération → plafonds → réponse             │
   └──────────────┬───────────────────────────────────────────────┘
                  │ ② 200 { ad_id, asset_ref, max_duration_ms,
                  │         impression_id }
                  │    ou 204 → tonalité normale
                  ▼
   ┌──────────────────────────────┐
   │ MRF joue asset_ref           │  (asset DÉJÀ préchargé chez Orange)
   └──────────────┬───────────────┘
                  │ ③ POST /ad-playback-event
                  │    { impression_id, played_ms, stop_reason,
                  │      answered }
                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ Validation → Reward Ledger                                   │
   └──────────────────────────────────────────────────────────────┘
```

### Point crucial
**Même en architecture B, les fichiers audio restent pré-poussés chez Orange.** L'API ne
transporte jamais le média — seulement une **référence**. Personne ne télécharge un
fichier audio pendant l'établissement d'un appel.

### Latence
Le point de blocage. Budget < 100 ms p99. Exige un service dédié, chaud, à proximité
réseau d'Orange — **pas une fonction serverless**. Un nœud dans le datacenter d'Orange ou
dans un datacenter tunisien peut y arriver ; Vercel ou Supabase depuis l'Europe, non de
manière fiable.

### Sécurité
mTLS avec certificats clients · liste blanche d'IP · jetons courts · signature des
requêtes · pas d'accès à des données d'abonné en clair.

### Scalabilité
❓ Dimensionner sur le pic d'appels simultanés d'Orange Tunisie — inconnu, mais de l'ordre
de plusieurs milliers d'appels par seconde en heure de pointe pour un opérateur national.
**Chiffre à demander : c'est lui qui dimensionne tout.**

### Avantages
Vrai temps réel · rotation, plafonds et budgets maîtrisés par Call Com · mesure immédiate ·
part de voix garantissable aux annonceurs.

### Limites
**Dépendance externe dans le chemin d'appel** — objection principale et légitime ·
exigences de disponibilité de niveau opérateur (99,99 % et plus) · exige une connectivité
dédiée · sera refusée si présentée trop tôt.

### Complexité
**Élevée des deux côtés.**

### À valider par Orange
Existe-t-il un précédent d'appel sortant du SCP/AS vers un tiers ? Quel budget de
timeout ? Quelle connectivité (VPN, interconnexion privée, colocation) ? Quels engagements
de disponibilité exigés ?

---

## Architecture C — Call Com possède le moteur, Orange possède le média, via un nœud sur site

> **La cible réaliste à 12-18 mois.** C'est le compromis qui lève l'objection de
> l'architecture B.

### Diagramme

```
   CALL COM (cloud)                     ORANGE (datacenter)
   ────────────────                     ───────────────────
   ┌──────────────────┐                 ┌──────────────────────────────┐
   │ Back-office      │  ① sync         │  NŒUD DE DÉCISION CALL COM    │
   │ Targeting Engine │ ───règles───►   │  (appliance / conteneur)      │
   │ Campagnes        │   + assets      │   • copie locale des règles   │
   └──────────────────┘   (périodique)  │   • cache des créatifs        │
                                        │   • décide en < 10 ms          │
   ┌──────────────────┐                 │   • aucun appel sortant        │
   │ Ledger, app, BO  │  ③ remontée     │     pendant l'appel            │
   └──────────────────┘ ◄──impressions──┤                               │
                          (batch/stream) └──────────┬───────────────────┘
                                                    │ ② protocole interne
                                                    ▼
                                        ┌──────────────────────────────┐
                                        │ SCP / AS  →  MRF             │
                                        └──────────────────────────────┘
```

### Pourquoi cette architecture lève l'objection
La décision reste **à l'intérieur du périmètre d'Orange**. Si la liaison vers le cloud de
Call Com tombe, le nœud continue de décider avec les règles qu'il a en cache. **Il n'y a
plus de dépendance externe dans le chemin d'appel** — seulement une synchronisation
asynchrone qui peut prendre du retard sans conséquence sur les appels.

### Latence
< 10 ms. Comparable à une décision native.

### Sécurité
Le nœud est dans le domaine de sécurité d'Orange : durcissement, revue de code, pas
d'accès sortant hors fenêtre de synchronisation, journalisation côté Orange. **C'est
Orange qui doit pouvoir auditer ce nœud** — à accepter d'emblée.

### Avantages
Temps réel effectif · Call Com garde la maîtrise du ciblage, de la rotation et des
plafonds · pas de dépendance externe · évolutif vers l'architecture B si Orange
l'autorise plus tard.

### Limites
Exige qu'Orange accepte d'héberger un composant tiers — processus de validation sécurité
long · exploitation à deux (qui patche ? qui est astreint ?) · surcoût matériel/hébergement.

### Complexité
**Moyenne à élevée**, mais la complexité est *organisationnelle* plus que technique.

### À valider par Orange
Orange héberge-t-il des composants partenaires dans son datacenter ? Quel processus de
validation sécurité ? Quel modèle d'exploitation et d'astreinte ?

---

## 4.4 Comparaison

| Critère | A — Pré-provisionné | B — API temps réel | C — Nœud sur site |
|---|---|---|---|
| Acceptabilité opérateur | **●●●●●** | ●●○○○ | ●●●○○ |
| Dépendance dans le chemin d'appel | **Aucune** | **Forte** | Aucune |
| Latence ajoutée | 0 | 50–150 ms | < 10 ms |
| Maîtrise du ciblage par Call Com | Faible | **Totale** | **Élevée** |
| Fraîcheur des campagnes | J+1 | Immédiate | Minutes |
| Part de voix garantissable | Non | **Oui** | **Oui** |
| Effort Orange | **Faible** | Élevé | Moyen |
| Effort Call Com | **Faible** | Élevé | Élevé |
| Adapté au POC | **✅ Oui** | Non | Non |
| Cible 12-18 mois | — | Peu probable | **✅ Oui** |

> **Trajectoire recommandée : A pour le POC → C en industrialisation → B seulement si
> Orange le propose.**

---

# 5. Proposed Call Com Architecture

## 5.1 Ce que le contexte opérateur change dans votre stack initiale

| Brique envisagée | Verdict | Motif |
|---|---|---|
| **Next.js / Vercel** | ✅ **Conservé** pour le back-office et le portail | Aucun lien avec le chemin d'appel |
| **Supabase / PostgreSQL** | ✅ **Conservé** comme système de référence | Le ledger et l'inventaire y sont parfaits |
| **Storage** | ✅ **Conservé**, avec un rôle nouveau : **pipeline de transcodage vers le format imposé par Orange** | Orange imposera son format |
| **Capacitor (mobile)** | ✅ **Conservé et simplifié** | L'app ne diffuse plus rien et ne mesure plus rien : elle devient un portefeuille + consentement. **C'est un allègement majeur** |
| **Ad Engine** | ⚠️ **Scindé en deux** : `Targeting Engine` (règles, back-office) et `Decision Service` (exécution) | En architecture A le Decision Service n'existe pas encore ; en C il est déployé chez Orange |
| **Reward Ledger** | ✅ **Conservé tel quel** | Les migrations du §07 restent valides |
| **Toute l'architecture offline (§10)** | ❌ **Supprimée** | La mesure devient serveur. Plus de file locale signée, plus de conflits, plus de fraude sur événements offline. **Suppression d'environ 25 % de la complexité du projet** |
| **Détection d'appel Android / iOS** | ❌ **Supprimée** | Orange fournit les CDR. Le problème iOS disparaît |

> **Le passage à la voie opérateur simplifie l'architecture logicielle de Call Com. C'est
> contre-intuitif mais c'est la réalité : on remplace un problème de confiance client
> (difficile) par un problème d'intégration serveur (classique).**

## 5.2 Architecture cible

```
┌──────────────────────────────── CALL COM ─────────────────────────────────────┐
│                                                                               │
│  COUCHE 1 — GESTION (Next.js / Vercel)                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Advertiser Mgmt │ Ad Campaign Mgmt │ Creative Studio │ Admin & RBAC     │   │
│  │ Zones & Geo     │ Reward Catalog   │ Reporting       │ Invoicing        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                          │
│  COUCHE 2 — MÉTIER (Edge Functions / services)                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ① Ad Targeting Engine      règles déclaratives, éligibilité, poids      │   │
│  │ ② Ad Decision Service      exécution (arch. B/C) — sinon inactif        │   │
│  │ ③ Asset Pipeline           transcodage → format Orange, hash, versions  │   │
│  │ ④ Operator Sync Service    export règles+assets, réception CDR          │   │
│  │ ⑤ Impression Ingestion     parsing CDR, idempotence, réconciliation     │   │
│  │ ⑥ Validation Engine        impression facturable ? créditable ?         │   │
│  │ ⑦ Reward Ledger            append-only, chaîné (déjà implémenté, §07)   │   │
│  │ ⑧ Consent Service          registre des consentements, preuve datée     │   │
│  │ ⑨ Billing Engine           facturation annonceur, arrêté mensuel        │   │
│  │ ⑩ Reconciliation Service   Orange ↔ Call Com : écarts, litiges          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                          │
│  COUCHE 3 — DONNÉES (PostgreSQL / Supabase)                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ inventaire · impressions (partitionné) · ledger · consentements ·        │  │
│  │ récompenses · audit · agrégats · file de synchro opérateur               │  │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  COUCHE 4 — CLIENTS                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ App mobile (portefeuille + consentement)  │  Portail client  │  BO      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    │  Operator Integration Adapter
                                    │  (une implémentation par opérateur)
                    ┌───────────────▼────────────────┐
                    │  ORANGE : CRBT / SCP / AS / MRF │
                    └────────────────────────────────┘
```

## 5.3 Les deux modules nouveaux, et pourquoi ils sont critiques

### ④ Operator Sync Service
Le composant qui n'existait pas dans l'architecture initiale et qui devient le cœur de
l'intégration.

```ts
interface OperatorAdapter {
  readonly operator: 'orange_tn' | 'ooredoo_tn' | 'tt_tn';

  /** Pousse créatifs + règles. Idempotent sur (ad_id, version). */
  publishCampaigns(batch: CampaignManifest): Promise<PublishReceipt>;

  /** Retire un créatif en urgence (kill-switch). */
  withdrawCreative(adId: string, reason: string): Promise<void>;

  /** Récupère les impressions d'une fenêtre. Doit être rejouable sans doublon. */
  fetchImpressions(from: Date, to: Date): Promise<RawImpression[]>;

  /** Décision temps réel — implémentée seulement en architecture B/C. */
  decide?(ctx: CallContext): Promise<AdDecision | null>;
}
```

**Pourquoi une interface :** le jour où Ooredoo ou Tunisie Telecom rejoignent, c'est une
implémentation de plus, pas une réécriture. Et cela permet de développer la plateforme
**avant** de connaître le format exact d'Orange, avec un adaptateur bouchon.

### ⑩ Reconciliation Service
Le module que les équipes oublient et qui devient indispensable dès qu'un partenaire
opérateur est dans la boucle.

Il répond à trois questions qui arriveront **toutes** :
1. Orange déclare 184 220 diffusions, Call Com en a crédité 183 940 — **où sont les 280 ?**
2. Un annonceur contexte sa facture : **quelles diffusions exactement ?**
3. Un utilisateur dit ne pas avoir reçu ses unités : **quelle diffusion, quel CDR ?**

Sans ce module, chaque écart devient une enquête manuelle. Avec lui, c'est un écran.

## 5.4 Chaîne de traitement demandée, module par module

```
Ad Campaign Management        ① back-office : annonceur, campagne, dates, budget, zones
        ↓
Ad Targeting Engine           ① règles déclaratives : zones, plages, plafonds, poids
        ↓
Asset Pipeline                ③ transcodage au format Orange + hash + version
        ↓
Operator Sync (push)          ④ export vers Orange — SFTP/API, signé
        ↓
[ ORANGE : sélection + diffusion ]
        ↓
Operator Sync (pull)          ④ récupération des CDR
        ↓
Impression Ingestion          ⑤ parsing, idempotence sur impression_id
        ↓
Validation Engine             ⑥ diffusion réellement écoutée ? plafonds ? campagne active ?
        ↓
        ├──────────────────►  ⑨ Billing Engine    → facturable annonceur
        └──────────────────►  ⑦ Reward Ledger     → unités créditées
                                      ↓
                              Reward Redemption → data / crédit / minutes / SMS
                                      ↓
                              ⑩ Reconciliation → écarts Orange ↔ Call Com
```

## 5.5 Règle de validation à définir avec Orange — la plus importante du projet

**Quand une diffusion est-elle facturable, et quand est-elle créditable ?**

Proposition, calquée sur le précédent Turkcell (✅ **FAIT** : Turkcell reversait à
l'abonné proportionnellement au **temps réellement écouté** par ses appelants) :

```
facturable (annonceur)  ⇔  played_ms ≥ 2 000 ms   ET   stop_reason ∈ {answered, completed}
créditable (abonné)     ⇔  facturable             ET   plafonds respectés
non facturable          ⇔  stop_reason ∈ {abandoned_early, error, no_early_media}
```

**`stop_reason` est le champ le plus important de tout le flux d'intégration.** Il répond
à la question « comment éviter de facturer une publicité qui n'a pas été réellement
jouée ». ❓ **À confirmer qu'Orange peut le fournir** — et si la réponse est non, il faut
négocier une approximation contractuelle (par exemple : facturation à la seconde écoutée
plutôt qu'à l'impression).

---

# 6. API / Integration Model

> ⚠️ **Ces APIs sont une proposition de Call Com, pas une description de l'existant
> d'Orange.** Elles servent à cadrer la discussion technique : arriver avec un contrat
> d'interface proposé est plus efficace que demander « quelle est votre API ». Orange
> imposera très probablement son propre format — et c'est normal.

## 6.1 Principes transverses

| Aspect | Décision |
|---|---|
| **Authentification** | **mTLS** avec certificats clients, plus jeton court (OAuth2 client credentials, TTL 15 min). Liste blanche d'IP des deux côtés |
| **Idempotence** | `Idempotency-Key` sur toute écriture. Rejeu = même réponse, aucun effet de bord |
| **Corrélation** | `correlation_id` propagé de bout en bout, journalisé des deux côtés. **C'est ce qui rend un litige instruisable** |
| **Timeouts** | `/ad-decision` : **100 ms dur**. Événements : 2 s, avec file de reprise |
| **Repli** | Toute erreur, tout timeout, tout `204` → **tonalité de retour d'appel normale**. Jamais de silence, jamais d'échec d'appel |
| **Versionnement** | Version dans le chemin (`/v1/`). Rétrocompatibilité garantie 12 mois |
| **Journalisation** | Les deux parties conservent 90 jours, avec `correlation_id`, pour réconciliation |
| **Limitation de débit** | Négociée, avec `429` et `Retry-After` |
| **Horloge** | **L'horodatage d'Orange fait foi**, toujours. Call Com ne discute pas les timestamps réseau |

## 6.2 `POST /v1/ad-decision` — architectures B et C uniquement

**Requête** (Orange → Call Com)
```json
{
  "correlation_id": "orng-tn-7f3a91c4-2026-09-21T09:14:03.221Z",
  "request_ts": "2026-09-21T09:14:03.221Z",
  "direction": "terminating",
  "subscriber_ref": "a3f9c2e1b8d47espseudonyme_stable_non_reversible",
  "zone_hint": "TN-12",
  "caller_network": "on_net",
  "language_hint": "ar",
  "max_duration_ms": 4000,
  "available_assets": ["v1", "v2"]
}
```

**Points de conception à défendre :**
- `subscriber_ref` est un **pseudonyme stable et non réversible** fourni par Orange —
  **jamais un MSISDN**. Call Com n'a pas besoin du numéro, et ne doit pas le demander
  (§8).
- `zone_hint` est une **zone administrative**, pas des coordonnées. Suffisant pour le
  ciblage, et bien moins sensible.
- `caller_network` permet à Call Com de savoir si le ciblage géographique est fiable
  (§2.6a).

**Réponse — publicité sélectionnée**
```json
{
  "decision": "serve",
  "impression_id": "imp_01JQ8X4M2K3N5P7R9T",
  "ad_id": "ad_rest_xyz_v2",
  "asset_ref": "callcom/ad_rest_xyz_v2_ar",
  "campaign_id": "cmp_2026_09_tunis_food",
  "max_duration_ms": 4000,
  "advertiser_display_name": "Restaurant XYZ"
}
```

**Réponse — ne rien diffuser**
```json
{ "decision": "no_ad", "reason": "frequency_cap" }
```
ou HTTP `204 No Content`.

**`asset_ref` est une référence, jamais un contenu.** Le fichier a été pré-poussé. Aucun
octet d'audio ne circule pendant l'établissement d'un appel.

## 6.3 `POST /v1/ad-playback-event` — le flux qui porte la valeur

```json
{
  "correlation_id": "orng-tn-7f3a91c4-...",
  "impression_id": "imp_01JQ8X4M2K3N5P7R9T",
  "ad_id": "ad_rest_xyz_v2",
  "campaign_id": "cmp_2026_09_tunis_food",
  "subscriber_ref": "a3f9c2e1b8d47e...",
  "zone": "TN-12",
  "started_at": "2026-09-21T09:14:03.740Z",
  "played_ms": 4000,
  "stop_reason": "answered",
  "call_answered": true,
  "call_duration_s": 137,
  "network_type": "volte",
  "caller_network": "on_net"
}
```

**`stop_reason` — énumération à négocier :**

| Valeur | Sens | Facturable ? |
|---|---|---|
| `completed` | Le créatif est allé au bout | ✅ |
| `answered` | Décrochage pendant la diffusion | ✅ si `played_ms` ≥ seuil |
| `abandoned` | L'appelant a raccroché | ⚠️ selon `played_ms` |
| `no_answer` | Personne n'a décroché, fin de sonnerie | ✅ si `played_ms` ≥ seuil |
| `error` | Échec du MRF | ❌ |
| `no_early_media` | Le réseau de l'appelant n'a pas ouvert le canal | ❌ **critique à obtenir** |
| `fallback` | Repli sur la tonalité normale | ❌ |

> **`no_early_media` est la valeur la plus importante de cette énumération.** Sans elle,
> Call Com facturerait des publicités que personne n'a entendues (§2.6b) — ce qui
> détruirait la confiance des annonceurs au premier audit.

## 6.4 `POST /v1/call-event` — facultatif

Utile seulement si Call Com veut mesurer du contexte (durée d'appel, taux de décrochage
par zone). **À ne pas demander en POC** : c'est de la donnée d'appel, donc un sujet de
conformité disproportionné par rapport au bénéfice.

## 6.5 `POST /v1/campaigns/publish` — Call Com → Orange (architecture A)

```json
{
  "batch_id": "pub_2026_09_21_001",
  "idempotency_key": "pub_2026_09_21_001",
  "effective_from": "2026-09-22T00:00:00Z",
  "creatives": [{
    "ad_id": "ad_rest_xyz_v2",
    "campaign_id": "cmp_2026_09_tunis_food",
    "asset_uri": "sftp://exchange/callcom/ad_rest_xyz_v2_ar.wav",
    "sha256": "9f86d081884c7d659a2feaa0c55ad015a...",
    "duration_ms": 4000,
    "language": "ar",
    "advertiser_display_name": "Restaurant XYZ",
    "targeting": {
      "zones": ["TN-11", "TN-12", "TN-13"],
      "time_windows": [{ "days": [1,2,3,4,5], "from": "11:00", "to": "14:00" }],
      "valid_from": "2026-09-22", "valid_to": "2026-10-22"
    },
    "weight": 100,
    "caps": { "per_subscriber_per_day": 3, "min_interval_minutes": 60,
              "campaign_total": 500000 }
  }]
}
```

**Réponse** : accusé par créatif, avec statut de validation (`accepted`,
`pending_review`, `rejected` + motif). Orange voudra valider chaque créatif — c'est
légitime et il faut le prévoir dans le workflow du back-office (§14 du dossier).

## 6.6 Ce qu'il faut demander à Orange sur les APIs, et dans cet ordre

1. Avez-vous **déjà** une interface partenaire sur la plateforme de tonalité d'attente
   (dépôt de contenu, remontée d'usage) ? **Si oui, on l'utilise, on n'invente rien.**
2. Sinon, préférez-vous du batch ou du temps réel ?
3. Un composant du cœur peut-il appeler un service externe pendant un appel ? Quel
   précédent ? Quel budget de timeout ?
4. Quel format audio exact ? (codec, échantillonnage, canaux, niveau, conteneur)
5. Quels champs sont réellement disponibles dans vos CDR pour une diffusion ?
6. À quelle fréquence pouvez-vous exporter ?
7. Fournissez-vous un pseudonyme d'abonné stable, ou faut-il passer par un identifiant
   interne Orange que Call Com ne verrait jamais ?

---

# 7. POC Proposal

## 7.1 Ce que le POC doit démontrer

Exactement les sept points demandés, sur un appel GSM réel :

```
① Un appel réel est passé sur le réseau Orange
② Orange détecte le scénario (abonné inscrit, ligne de test)
③ Une publicité audio de 3-4 s est jouée à l'auditeur AVANT le décrochage
④ Le correspondant reçoit l'appel normalement (sonnerie non perturbée)
⑤ Le correspondant décroche
⑥ La publicité s'arrête immédiatement et la conversation est normale
⑦ Un événement de diffusion est enregistré, exporté, et reçu par Call Com
```

## 7.2 Périmètre volontairement minimal

| Dans le POC | Hors POC |
|---|---|
| 1 créatif fixe, 1 campagne | Rotation, plafonds de fréquence |
| 1 à 2 zones | Ciblage fin, segmentation |
| **Architecture A** (pré-provisionné) | API temps réel |
| 10 à 20 lignes de test | Abonnés réels |
| Export d'impressions quotidien | Temps réel |
| Ledger d'unités en lecture seule | Conversion en data réelle |
| Une seule variante (T **ou** O — Orange choisit) | Les deux |

> **Le POC ne doit démontrer qu'une chose : que le son atteint l'auditeur au bon moment,
> s'arrête au bon moment, et qu'on peut le compter.** Tout le reste est déjà prouvé
> ailleurs. Un POC qui essaie de tout montrer ne sera jamais autorisé.

## 7.3 Matériel et lignes de test

| Élément | Quantité | Détail |
|---|---|---|
| Lignes Orange de test | **10 à 20 SIM** | Dont ≥ 5 avec le service activé (abonnés simulés) et ≥ 5 sans (groupe témoin) |
| Téléphones Android | 6 modèles | Entrée de gamme du marché tunisien, 2G/3G/4G mêlés |
| Téléphones iOS | 2 | Pour vérifier qu'aucune app n'est nécessaire |
| Téléphone basique (feature phone) | 1 | **Test important** : prouve que le service fonctionne sans smartphone |
| Lignes tierces | 3 | 1 Ooredoo, 1 Tunisie Telecom, 1 international — **pour tester le média précoce en interconnexion (§2.6b)** |
| Enregistreur audio en ligne | 1 | Capture objective de ce que l'appelant entend, horodatée |

**La ligne internationale et les deux lignes concurrentes sont la partie la plus
instructive du POC** : elles révèlent si l'inventaire réel est limité au trafic on-net.

## 7.4 Composants requis

### Côté Orange
| Composant | Effort attendu |
|---|---|
| Plateforme CRBT existante, en environnement de test | **Aucun développement** si l'ingestion de contenu suffit |
| Activation du service sur les lignes de test (T-CSI ou O-CSI / iFC) | Provisioning |
| Zone d'échange SFTP ou équivalent | Mise à disposition |
| Export des CDR de diffusion (format brut accepté) | **Le seul livrable technique réel d'Orange** |
| 1 référent technique côté VAS + 1 côté cœur de réseau | ~0,3 ETP sur 6 semaines |

### Côté Call Com
| Composant | Effort |
|---|---|
| 3 créatifs audio au format Orange, normalisés | 2 jours |
| Manifeste de campagne + export SFTP | 3 jours |
| Ingestion et parsing des CDR | 5 jours |
| Validation + ledger (déjà écrit, cf. `docs/sql/`) | 2 jours de câblage |
| Écran de suivi des diffusions | 3 jours |
| Protocole de test et journal de campagne | 3 jours |
| **Total** | **~18 jours-homme** |

## 7.5 Environnement

```
Phase 1 — labo         plateforme CRBT de test Orange, appels internes
Phase 2 — terrain      lignes de test réelles sur le réseau de production,
                       service activé sur un nombre restreint d'abonnés
Phase 3 — mesure       10 jours calendaires, ≥ 500 appels de test,
                       enregistrement audio systématique
```

## 7.6 Durée

| Phase | Durée | Dépendance |
|---|---|---|
| Cadrage technique avec Orange | 2 semaines | Réunion cœur de réseau obtenue |
| Développement Call Com | 3 semaines | **en parallèle** |
| Provisioning et intégration | 1 à 3 semaines | ❓ dépend d'Orange — variable principale |
| Exécution et mesure | 2 semaines | |
| Rapport et décision | 1 semaine | |
| **Total** | **6 à 10 semaines** | |

## 7.7 Critères de succès — chiffrés

```
FONCTIONNEL
[ ] La publicité est entendue par l'auditeur dans ≥ 95 % des appels de test on-net
[ ] Délai entre la fin de numérotation et le premier son : < 2 s au p95
[ ] Arrêt de la publicité au décrochage : < 300 ms
[ ] Aucune dégradation audible de la conversation après bascule
[ ] 0 appel échoué imputable au mécanisme sur ≥ 500 appels
[ ] Le service fonctionne sur téléphone basique (sans application)

MESURE
[ ] 100 % des diffusions présentes dans l'export d'Orange
[ ] Écart Call Com ↔ Orange < 1 % sur le nombre de diffusions
[ ] `played_ms` et `stop_reason` exploitables et cohérents avec les enregistrements audio
[ ] Les unités sont créditées correctement, 0 doublon, 0 perte

INTERCONNEXION  ← le résultat le plus informatif
[ ] Comportement documenté pour un appelant Ooredoo
[ ] Comportement documenté pour un appelant Tunisie Telecom
[ ] Comportement documenté pour un appelant international
[ ] Part de l'inventaire réellement adressable, chiffrée
```

## 7.8 Métriques à relever

| Métrique | Pourquoi |
|---|---|
Délai avant premier son (p50/p95/p99) | Qualité perçue
Taux de diffusion effective, **par réseau d'origine** | Dimensionne l'inventaire réel
Distribution de `played_ms` | Base de facturation
Distribution de `stop_reason` | Valide la règle de facturation du §5.5
Taux de décrochage avec et sans publicité | **Détecte si la publicité fait raccrocher** — métrique la plus importante du POC côté produit
Durée moyenne d'appel avec / sans | Contrôle de non-régression
Réclamations sur les lignes de test | Acceptabilité
Taux de repli (`fallback`) | Fiabilité

> **Le taux de décrochage avec et sans publicité est la métrique décisive.** Si les
> appelants raccrochent davantage parce qu'ils entendent une publicité au lieu d'une
> sonnerie, le produit détruit de la valeur pour Orange — et Orange l'arrêtera, à juste
> titre. **Il faut mesurer cela soi-même et l'annoncer spontanément comme critère
> d'arrêt.** C'est ce qui vous distinguera d'un demandeur naïf.

## 7.9 Risques du POC

| Risque | Prob. | Impact | Mitigation |
|---|---|---|---|
| La plateforme CRBT ne sait pas cibler par zone | Moyenne | Majeur | POC sans ciblage : un seul créatif national. Le ciblage devient un sujet de phase 2 |
| Les CDR ne contiennent pas `played_ms` | **Élevée** | Majeur | Négocier une approximation : durée de sonnerie ou compteur de la plateforme. **Le savoir avant de promettre un CPM aux annonceurs** |
| `no_early_media` non distinguable | Élevée | Moyen | Croiser avec l'enregistrement audio du POC pour estimer le taux, puis l'appliquer en abattement contractuel |
| Le média précoce ne passe pas en interconnexion | Moyenne | **Majeur** | C'est précisément ce que le POC mesure. Si confirmé → basculer sur la variante origine (§2.7) |
| Provisioning Orange plus long que prévu | **Élevée** | Modéré | Développer en parallèle contre un adaptateur bouchon |
| Le taux de décrochage baisse | Moyenne | **Majeur** | Réduire à 3 s, plafonner la fréquence, tester un jingle de marque plutôt qu'un message verbeux |
| Orange refuse le POC | Moyenne | Bloquant | §13 — la voie plateforme (§23) reste le plan B |

---

# 8. Security & Privacy

## 8.1 Principe directeur à énoncer d'emblée

> **Call Com ne demande aucune donnée personnelle d'abonné Orange, et ne veut pas en
> recevoir.**

C'est à la fois la position la plus confortable en conformité et le meilleur argument
commercial : Orange n'a pas à exporter son actif le plus sensible. Concrètement :

| Donnée | Call Com la reçoit ? |
|---|---|
| MSISDN de l'abonné inscrit | **Uniquement celui fourni par l'utilisateur lui-même dans l'app**, pour l'authentification et la conversion |
| MSISDN de l'appelant | **Jamais** |
| Numéro appelé | **Jamais** |
| Localisation précise | **Jamais** — seulement une zone administrative |
| Journal d'appels | **Jamais** — seulement des événements de diffusion |
| Identifiant d'abonné Orange | **Pseudonyme stable non réversible**, jamais l'identifiant interne |

**Le pivot d'identité est le problème à résoudre proprement.** Pour créditer des unités,
Call Com doit relier une diffusion à un compte utilisateur. Deux options :

| Option | Mécanisme | Recommandation |
|---|---|---|
| **A — pivot par HMAC** | Call Com et Orange calculent `HMAC(clé_partagée, MSISDN)`. Orange envoie le HMAC dans les CDR ; Call Com le compare à celui de ses inscrits | ✅ **Recommandée.** Aucun numéro ne circule, le rapprochement est déterministe |
| **B — pivot par identifiant Orange** | Orange attribue un `subscriber_ref` à l'inscription via un lien d'enrôlement | ✅ Acceptable, mais impose un parcours d'inscription piloté par Orange |

❓ **À confirmer** : Orange accepte-t-il de calculer un HMAC sur MSISDN avec une clé
partagée ? C'est une demande simple, peu intrusive, et elle résout tout le sujet.

## 8.2 Sécurité de l'intégration

| Surface | Mesure |
|---|---|
| Transport | mTLS partout ; SFTP à clés pour les fichiers ; aucun HTTP en clair |
| Authentification | Certificats clients + OAuth2 client credentials, TTL court |
| Réseau | Liste blanche d'IP bidirectionnelle ; idéalement VPN IPsec ou interconnexion privée |
| Intégrité du contenu | SHA-256 par créatif, vérifié par Orange à l'ingestion, manifeste signé |
| Anti-rejeu | `Idempotency-Key` + horodatage + fenêtre de validité |
| Cloisonnement | La clé de service Call Com n'a accès qu'à l'adaptateur opérateur, pas au reste du système |
| Journalisation | 90 jours, `correlation_id`, des deux côtés, pour instruire tout litige |
| Nœud sur site (arch. C) | Durcissement, revue de code par Orange, pas d'accès sortant hors fenêtre de synchro, journaux exportés à Orange |
| Créatifs | Transcodage systématique = assainissement ; Orange doit pouvoir rejeter tout créatif |
| Kill-switch | Orange doit pouvoir couper le service **unilatéralement et immédiatement**, sans passer par Call Com. **À proposer, pas à concéder** |

## 8.3 Le sujet de conformité le plus délicat

Dans la **variante terminaison**, la personne qui entend la publicité est l'appelant,
qui :
- n'a pas consenti ;
- n'est pas client de Call Com ;
- n'est pas nécessairement client d'Orange ;
- ne reçoit aucune contrepartie ;
- et n'a aucun moyen de se désabonner.

✅ **FAIT** : le précédent Turkcell traitait cela par deux mécanismes — **opt-in de
l'abonné** et **listes noires d'appelants qui n'entendront pas les publicités**.

**Le mécanisme de liste noire côté appelant est donc à demander explicitement.** Il faut
qu'un appelant puisse dire « je ne veux plus entendre ça », et ce registre ne peut vivre
que chez Orange.

**Dans la variante origine, ce problème n'existe pas** — l'auditeur est l'abonné
consentant. C'est le troisième argument en faveur de cette variante.

## 8.4 Rétention

| Donnée | Chez Orange | Chez Call Com |
|---|---|---|
| CDR de diffusion | Selon politique Orange | 90 jours en brut, agrégats indéfiniment |
| Pseudonyme d'abonné | Durée de l'abonnement | Durée du compte |
| Consentements | Orange (abonnement) | Call Com (app) — **les deux doivent être cohérents** |
| Journaux d'intégration | 90 jours | 90 jours |
| Facturation | Obligation comptable | Obligation comptable |

**Point d'attention : le consentement existera à deux endroits** — l'abonnement au service
chez Orange, et le consentement applicatif chez Call Com. **Il faut définir lequel fait
foi et comment une désinscription se propage.** Si un utilisateur se désinscrit dans l'app
mais reste provisionné chez Orange, il continue à diffuser des publicités sans être
récompensé : c'est un incident de conformité et de confiance. ❓ **À confirmer** : délai de
propagation d'une désinscription.

---

# 9. Regulatory Questions

> **Aucune conclusion juridique ici.** Ce sont les points à faire qualifier par Orange et
> par un conseil juridique tunisien. Je signale ce qui doit être posé, pas ce qui est
> permis.

| # | Sujet | Question à faire qualifier | Par qui |
|---|---|---|---|
| R1 | **Consentement de l'abonné** | L'abonnement au service via `*144#` ou l'app suffit-il ? Faut-il un consentement spécifique « publicité » distinct du consentement « service » ? | Orange juridique + conseil TN |
| R2 | **Consentement de l'appelant** (variante T) | Un appelant peut-il être exposé à une publicité sans consentement ? Un mécanisme d'opt-out est-il obligatoire ? | **Orange + INT** |
| R3 | **Publicité dans les communications** | Le Code des télécommunications ou la réglementation de l'INT encadrent-ils la publicité insérée dans une communication ? Un visa préalable est-il requis ? | **INT** — porté par Orange |
| R4 | **Données personnelles** | Le traitement relève-t-il de la loi organique n° 2004-63 ? Orange est-il responsable de traitement et Call Com sous-traitant, ou y a-t-il responsabilité conjointe ? | Conseil TN + INPDP |
| R5 | **Transfert à l'étranger** | Le back-office de Call Com étant hébergé hors de Tunisie, une **autorisation préalable de l'INPDP** est requise (art. 47, 50 à 52). Le pseudonymat suffit-il à sortir du champ ? | **Conseil TN + INPDP** |
| R6 | **Localisation** | L'usage d'une zone administrative pour du ciblage publicitaire est-il assimilé à un traitement de données de localisation ? | Conseil TN |
| R7 | **Données d'appel** | Les événements de diffusion sont-ils des données de trafic, avec les obligations associées ? | Orange juridique |
| R8 | **Conservation** | Durées imposées, et interaction avec le **décret-loi n° 54 de 2022** | Conseil TN |
| R9 | **Numéros de téléphone** | Le HMAC d'un MSISDN reste-t-il une donnée personnelle au sens de la loi tunisienne ? (question classique, réponse généralement oui) | Conseil TN |
| R10 | **Sécurité** | Exigences d'Orange pour un partenaire connecté (certification, audit, PASSI ou équivalent) | Orange sécurité |
| R11 | **Responsabilité du contenu** | Qui répond d'une publicité mensongère ou illicite ? Call Com, Orange, l'annonceur ? Qui valide ? | Les deux juridiques |
| R12 | **Statut de Call Com** | Call Com devient-il un acteur réglementé du fait de son rôle, ou reste-t-il un simple fournisseur de contenu ? | **INT** |

**R2, R3, R5 et R12 sont les quatre questions qui peuvent bloquer le projet.** Les poser
tôt, et laisser Orange porter R2, R3 et R12 auprès de l'INT — c'est son service, c'est son
rôle, et il a l'habitude.

---

# 10. Commercial Models

## 10.1 Les trois positionnements possibles pour Call Com

| | Ce que fait Call Com | Ce que fait Orange | Partage typique | Difficulté |
|---|---|---|---|---|
| **P1 — Fournisseur de contenu / régie** | Apporte annonceurs et créatifs | Diffuse, mesure, facture, gère le consentement et les unités | Orange majoritaire | **Faible** ✅ |
| **P2 — Partenaire VAS** | Régie + plateforme + app + unités + récompenses | Diffuse et mesure | Négocié, souvent 50/50 à 70/30 | Moyenne |
| **P3 — Opérateur de service** | Tout, Orange est un pur fournisseur de diffusion | Diffusion facturée à l'usage | Call Com majoritaire, paie Orange | Élevée |

> **Entrez par P1 et visez P2.** P1 ne demande à Orange aucun développement et aucun
> risque : c'est du contenu de plus dans un catalogue existant. Une fois la mécanique
> prouvée et l'inventaire vendu, la discussion sur la valeur ajoutée de Call Com
> (l'application, les unités, les récompenses, la force de vente) devient naturelle.

Demander P2 en première réunion revient à demander à Orange de vous confier un pan de son
réseau et de sa relation client avant d'avoir rien prouvé.

## 10.2 Modèles de facturation annonceur

| Modèle | Unité facturable | Recommandation |
|---|---|---|
| **Coût par diffusion (CPL)** | 1 écoute validée | ✅ **Le plus lisible** pour un commerçant local tunisien |
| **CPM** | 1 000 écoutes validées | ✅ Standard, pour les annonceurs structurés |
| **Coût par seconde écoutée** | 1 seconde | ✅ **Le plus juste** — et le précédent Turkcell fonctionnait ainsi |
| **Forfait mensuel par zone** | présence à l'inventaire | ✅ **Le plus facile à vendre au démarrage** |
| **Budget prépayé** | consommation | ✅ À combiner avec les précédents |
| **CPC** | — | ❌ **Sans objet** : il n'y a pas de clic sur une publicité audio |

Le §11 du cahier des charges prévoit déjà un modèle configurable, ce qui est le bon choix.
Les cinq modèles retenus sont implémentés dans le schéma de base (`campaigns.pricing_model`).

## 10.3 Modèle de répartition — ordre de grandeur

Les revenus publicitaires se répartissent en quatre parts :

```
100 % revenu annonceur
 ├── part Orange            (diffusion, base d'abonnés, facturation)
 ├── part récompense abonné (les unités → data / crédit / minutes)
 ├── part Call Com          (régie, plateforme, force de vente)
 └── coûts opératoires      (infra, équipe, SMS, support)
```

**La contrainte structurante reste celle établie au §16 du dossier :** la part de
récompense ne doit pas dépasser environ **50 %** du revenu publicitaire, sinon chaque
utilisateur supplémentaire creuse la perte. Avec une part Orange à négocier, l'équation se
resserre encore.

✅ **Repère utile du précédent Turkcell** : la récompense moyenne était de **~65 unités,
soit ~20 minutes par mois** par abonné, jusqu'à 40 minutes pour les plus gros trafics
entrants. C'est un ordre de grandeur **modeste**, et c'est cohérent : cela confirme, par
un opérateur réel et à grande échelle, que la récompense soutenable se compte en dizaines
de minutes ou en centaines de mégaoctets par mois — **pas en gigaoctets**.

> ⚠️ **Risque business identifié — à valider par Call Com.** Le barème du §8.4 du cahier
> des charges implique un CPM de 12 à 15 TND sur les paliers en gigaoctets, contre 4 TND
> sur le palier en crédit téléphonique (calcul détaillé en §23.7). **Le précédent Turkcell
> récompensait en minutes et en crédit, pas en data** — ce qui va dans le même sens.
> L'arbitrage appartient à Call Com.

## 10.4 Ce qu'Orange voudra savoir sur le plan commercial

Préparez des réponses chiffrées, même approximatives :
1. Combien d'annonceurs avez-vous déjà, ou pouvez-vous signer en 6 mois ?
2. Quel revenu annuel pour Orange en année 1, 2, 3 ?
3. Qui finance les récompenses des abonnés ?
4. Qui porte le risque d'invendu de l'inventaire ?
5. Quelle exclusivité demandez-vous, et pour combien de temps ?
6. Que se passe-t-il si Orange décide d'internaliser le produit ?

**La question 6 sera posée, explicitement ou non.** La bonne réponse est honnête :
l'actif défendable de Call Com n'est pas la technique — c'est la relation avec des
centaines de commerçants locaux, que l'opérateur n'a pas et ne veut pas construire.

---

# 11. Risks & Dependencies

| # | Risque | Prob. | Impact | Mitigation |
|---|---|---|---|---|
| O1 | **Orange refuse ou ne répond pas** | Moyenne | Bloquant sur cette voie | Approcher les trois opérateurs ; garder la voie plateforme (§23) en plan B ; ne jamais mettre Orange dans le chemin critique de développement |
| O2 | **La plateforme CRBT ne sait pas cibler par zone** | Moyenne | Majeur | POC sans ciblage ; ciblage en phase 2 ; ou recourir aux APIs *Geofencing* / *Location retrieval* d'Orange si disponibles en Tunisie |
| O3 | **Les CDR ne portent pas la durée écoutée** | **Élevée** | Majeur | Négocier une approximation contractuelle ; **ne pas vendre un CPM avant de connaître la réponse** |
| O4 | **Le média précoce ne traverse pas l'interconnexion** | Moyenne | **Majeur** | Mesuré au POC (§7.7) ; bascule sur la variante origine (§2.7) |
| O5 | **Inventaire limité au trafic on-net** | Moyenne | Majeur | Chiffrer au POC ; ajuster la promesse annonceur |
| O6 | **Le taux de décrochage baisse** | Moyenne | **Majeur** | Mesuré au POC comme critère d'arrêt ; réduire à 3 s ; jingle plutôt que message |
| O7 | **Délais de provisioning Orange** | **Élevée** | Modéré | Développer contre un adaptateur bouchon ; jalons contractuels |
| O8 | **Orange internalise le produit** | Moyenne | Fatal sur cette voie | Exclusivité contractuelle ; l'actif défendable est la base annonceurs |
| O9 | **Blocage réglementaire sur la publicité en communication** | Moyenne | Bloquant | Poser R2/R3/R12 dès la première réunion technique ; laisser Orange porter le dossier INT |
| O10 | **Validation sécurité d'un nœud sur site trop longue** (arch. C) | Élevée | Modéré | Rester en architecture A jusqu'à preuve du modèle économique |
| O11 | **Cohorte Orange Fab inadaptée** | **Élevée** | Modéré | ✅ **FAIT** : la 8ᵉ cohorte est **100 % IA**. Call Com n'est pas un projet IA → viser la voie B2B/VAS directe plutôt que l'accélérateur, ou attendre la cohorte suivante (§13) |
| O12 | **Économie unitaire négative** | Élevée | Fatal | Voir §16 et §23.7. **À valider par Call Com** avant tout développement |
| O13 | **Dépendance à un fournisseur CRBT tiers d'Orange** | Moyenne | Modéré | L'éditeur de la plateforme (Comviva, 6D, Huawei, ZTE…) sera l'interlocuteur technique réel, avec son propre calendrier et sa propre facturation. **À identifier tôt** |

## Dépendances externes, par ordre de criticité

```
1. Accord de principe d'Orange                       ← bloquant
2. Architecture voix : IMS/VoLTE ou CS/CAMEL ?        ← dimensionne tout
3. Capacités réelles de la plateforme CRBT            ← dimensionne le ciblage
4. Contenu exact des CDR                              ← dimensionne la facturation
5. Comportement du média précoce en interconnexion    ← dimensionne l'inventaire
6. Qualification réglementaire (INT, INPDP)           ← bloquant en production
7. Éditeur de la plateforme CRBT et son calendrier    ← dimensionne les délais
8. CPM réellement accepté par les annonceurs          ← dimensionne le modèle
```

**Les points 2 à 5 et 7 ne peuvent être obtenus qu'auprès d'Orange.** Le point 8 ne peut
être obtenu qu'auprès des annonceurs, par Call Com. **Aucun des deux ne dépend du
développement, et les deux doivent démarrer maintenant.**

---

# 12. Questions for Orange

Organisées par catégorie, comme demandé. Les questions marquées 🔴 sont celles dont la
réponse peut arrêter le projet — à poser en priorité.

## A. Questions business

| # | Question |
|---|---|
| A1 | 🔴 Orange Tunisie est-il intéressé par la monétisation publicitaire de sa tonalité d'attente ? Le sujet a-t-il déjà été étudié en interne ? |
| A2 | Le groupe Orange a un antécédent de publicité en tonalité d'attente (« Yesss! »). Existe-t-il un retour d'expérience groupe mobilisable ? |
| A3 | Quel est le modèle de partenariat habituel d'Orange Tunisie avec un fournisseur de services à valeur ajoutée ? |
| A4 | Quelle est la taille actuelle de la base d'abonnés au service de tonalité d'attente ? |
| A5 | Quel volume d'appels quotidien, et quelle durée moyenne de sonnerie avant décrochage ? (dimensionne l'inventaire) |
| A6 | Orange Advertising, ou une entité publicitaire équivalente, a-t-il un mandat sur le marché tunisien ? |
| A7 | Qui, chez Orange Tunisie, serait le sponsor métier d'un tel produit ? |

## B. Questions télécom

| # | Question |
|---|---|
| B1 | 🔴 Orange Tunisie exploite-t-il **VoLTE / IMS** en production, et quelle part du trafic voix y transite ? |
| B2 | 🔴 La plateforme de tonalité d'attente est-elle **interne ou fournie par un éditeur tiers** ? Lequel ? |
| B3 | 🔴 Le service peut-il diffuser un contenu **différent selon l'appelant** ? (une description de presse mentionne l'affectation à des personnes ou des groupes — est-ce bien une capacité native de la plateforme ?) |
| B4 | 🔴 Peut-il diffuser un contenu **différent selon la zone géographique** de l'auditeur ? |
| B5 | Peut-il diffuser selon **la plage horaire**, le **jour**, et des **dates de validité** ? |
| B6 | Sait-il gérer une **rotation** entre plusieurs contenus, avec des **poids** ? |
| B7 | Sait-il appliquer un **plafond de fréquence** par abonné et par jour ? |
| B8 | Quel est le mécanisme de déclenchement : **CAMEL T-CSI / O-CSI**, ou **iFC IMS** ? |
| B9 | 🔴 La variante **origine** est-elle possible : diffuser à *votre propre abonné* pendant qu'il attend que son correspondant décroche ? (cf. §2.7) |
| B10 | Dans la variante origine, si le réseau distant envoie son propre média précoce, l'AS d'origine peut-il l'ignorer et imposer le sien ? |
| B11 | 🔴 Le **média précoce** est-il honoré sur les interconnexions vers Ooredoo, Tunisie Telecom et à l'international entrant ? |
| B12 | Quelle part des appels entrants vers un abonné Orange provient d'Orange lui-même ? |
| B13 | Quelle est la **durée maximale** de contenu diffusable avant décrochage ? |
| B14 | Combien de **sessions média simultanées** le MRF peut-il servir ? |
| B15 | Quel **format audio** est imposé ? (codec, échantillonnage, canaux, niveau, conteneur) |
| B16 | Quelle est la **capacité du catalogue** en nombre de contenus actifs ? |

## C. Questions API / intégration

| # | Question |
|---|---|
| C1 | 🔴 Existe-t-il **déjà** une interface partenaire sur cette plateforme : dépôt de contenu, remontée d'usage ? |
| C2 | Préférez-vous un modèle **pré-provisionné** (batch) ou **temps réel** ? |
| C3 | 🔴 Un composant du cœur (SCP ou AS) peut-il **appeler un service externe** pendant l'établissement d'un appel ? Existe-t-il un précédent ? |
| C4 | Si oui, quel **budget de timeout** et quel comportement de repli ? |
| C5 | Quelle **connectivité** serait exigée : VPN IPsec, interconnexion privée, colocation ? |
| C6 | 🔴 Quels **champs** sont réellement disponibles dans vos enregistrements pour une diffusion ? Notamment : **durée effectivement écoutée** et **motif d'arrêt** ? |
| C7 | 🔴 Pouvez-vous distinguer le cas où le réseau de l'appelant **n'a pas ouvert le canal audio** (publicité non entendue) ? |
| C8 | Savez-vous si **l'appel a été décroché**, et sa durée ? |
| C9 | À quelle **fréquence** les événements peuvent-ils être exportés ? |
| C10 | Sous quel **format** et par quel **transport** (SFTP, API, flux) ? |
| C11 | Pouvez-vous fournir un **pseudonyme d'abonné stable et non réversible** — par exemple un HMAC de MSISDN sur clé partagée — pour permettre le crédit des unités sans exporter de numéro ? |
| C12 | Orange héberge-t-il des **composants partenaires** dans son datacenter ? Quel processus de validation ? |
| C13 | Existe-t-il un **environnement de test** avec des lignes dédiées ? |
| C14 | Combien de **lignes de test** peuvent être mises à disposition, et sous quel délai ? |

## D. Questions sécurité

| # | Question |
|---|---|
| D1 | Quelles exigences de sécurité pour un partenaire connecté : certification, audit, homologation ? |
| D2 | Quel schéma d'authentification imposez-vous : mTLS, OAuth2, clés API ? |
| D3 | Quelles exigences de disponibilité pour un service dans le chemin d'appel ? |
| D4 | Qui peut déclencher le **kill-switch** du service, et en combien de temps ? *(Call Com propose que ce soit Orange, unilatéralement.)* |
| D5 | Quel processus de **validation des créatifs** avant mise en diffusion ? |
| D6 | Quelles exigences de journalisation et de conservation pour la réconciliation ? |
| D7 | Existe-t-il une exigence de revue de code ou d'audit sur un composant hébergé chez vous ? |

## E. Questions données personnelles et consentement

| # | Question |
|---|---|
| E1 | 🔴 L'abonnement au service constitue-t-il un consentement suffisant à la diffusion publicitaire, ou faut-il un consentement distinct ? |
| E2 | 🔴 Comment traitez-vous le **consentement de l'appelant**, qui entend la publicité sans avoir rien accepté ? |
| E3 | Existe-t-il, ou peut-on créer, une **liste noire d'appelants** qui ne doivent pas entendre de publicité ? *(mécanisme utilisé par Turkcell)* |
| E4 | Qui est **responsable de traitement** et qui est **sous-traitant** dans ce montage ? |
| E5 | 🔴 Le back-office de Call Com étant hébergé hors de Tunisie, comment traitez-vous l'**autorisation INPDP de transfert** ? Qui porte le dossier ? |
| E6 | Un pseudonyme d'abonné sort-il du champ des données personnelles selon votre analyse ? |
| E7 | Quelles durées de conservation imposez-vous ? |
| E8 | Comment une désinscription se propage-t-elle, et en combien de temps ? |
| E9 | Le ciblage par zone administrative est-il assimilé à un traitement de données de localisation ? |

## F. Questions commerciales

| # | Question |
|---|---|
| F1 | 🔴 Quel modèle de **partage de revenus** envisagez-vous ? |
| F2 | Qui **facture l'annonceur** : Orange, Call Com, ou les deux ? |
| F3 | Qui **finance les récompenses** des abonnés ? |
| F4 | Facturez-vous la diffusion à Call Com, ou partagez-vous le revenu publicitaire ? |
| F5 | Y a-t-il des frais d'intégration, de plateforme ou de mise en service ? |
| F6 | Une **exclusivité** est-elle envisageable, et sur quelle durée ? |
| F7 | Quelles catégories d'annonceurs seraient **exclues** par votre politique ? |
| F8 | Quel délai type entre accord de principe et mise en production ? |

## G. Questions POC

| # | Question |
|---|---|
| G1 | 🔴 Orange accepterait-il un POC sur **10 à 20 lignes de test**, en architecture pré-provisionnée ? |
| G2 | Quel est le processus interne pour autoriser un tel POC, et quel délai ? |
| G3 | Quelles ressources Orange y consacrerait : VAS, cœur de réseau, sécurité ? |
| G4 | Le POC peut-il utiliser la plateforme de production sur un périmètre restreint, ou faut-il un environnement dédié ? |
| G5 | Orange accepte-t-il que le POC mesure le **taux de décrochage avec et sans publicité** ? *(Call Com propose que ce soit un critère d'arrêt.)* |
| G6 | Quels critères Orange fixerait-il pour considérer le POC comme réussi ? |
| G7 | Qui porte le coût du POC ? |
| G8 | Le POC peut-il tester les deux variantes, terminaison et origine ? |

---

# 13. Stratégie de discussion avec Orange Fab

## 13.1 Le cadre réel d'Orange Fab — à connaître avant d'y aller

✅ **FAIT** :
- Orange Fab Tunisie est l'**accélérateur corporate** d'Orange Tunisie, lancé en **2019**,
  avec **45 startups accompagnées** et **~90 % encore actives**.
- Il cible des **startups mûres cherchant des partenariats commerciaux**, et sélectionne
  des projets qui **répondent à un besoin identifié d'Orange**, avec un service
  **déjà commercialisé ou commercialisable** en Tunisie.
- Bénéfices : **partenariats business avec Orange Tunisie et/ou ses partenaires**, réseau
  international via les Orange Fab de **21 pays**, mentorat, crédits cloud AWS, Demo Day.
- Sélection par un **comité présidé par le Directeur Général d'Orange Tunisie**, composé
  d'experts métiers, après des entretiens « 360° ».
- ⚠️ **La 8ᵉ cohorte est annoncée comme une édition 100 % IA.**

### Conséquence stratégique, à dire franchement au business owner

**Call Com n'est pas un projet d'IA.** Si la cohorte en cours est exclusivement IA,
candidater maintenant a peu de chances d'aboutir, et un refus consomme le capital
relationnel.

**Il y a deux portes, et ce n'est pas la même :**

| Porte | Quand l'utiliser | Interlocuteur |
|---|---|---|
| **Orange Fab** (accélérateur) | Si une cohorte thématiquement compatible s'ouvre, ou pour obtenir une **introduction** | Équipe Orange Fab |
| **Voie B2B / VAS directe** | **C'est la bonne porte pour ce projet** : une demande d'intégration réseau et un partage de revenus, pas un accompagnement de startup | Direction VAS / Marketing B2B / Innovation |

> **Recommandation : utiliser Orange Fab comme porte d'entrée relationnelle et comme
> canal d'introduction, mais présenter le dossier comme un partenariat VAS, pas comme une
> candidature d'accélération.** Ce que Call Com demande — toucher la plateforme de
> tonalité d'attente — est inhabituellement profond pour une startup d'accélérateur, et
> sera de toute façon arbitré par les équipes métier et réseau.

## 13.2 A. Ce que Call Com doit présenter en 5 minutes

Structure recommandée, dans cet ordre exact :

```
0:00-0:45  L'INVENTAIRE QUI DORT
           « Chaque appel de vos abonnés contient 5 à 10 secondes d'espace audio
             que vous possédez déjà et qui ne rapporte rien. »

0:45-1:45  LE PRÉCÉDENT CHIFFRÉ                            ← le moment qui compte
           « Turkcell l'a fait en 2008 : Tone&Win. 50 marques, 72 campagnes,
             Coca-Cola, Unilever, P&G, Nestlé, HSBC. 200 000 membres puis
             ouverture à toute la base. Les abonnés gagnaient environ 20 minutes
             par mois. Et le groupe Orange l'a fait avec Yesss!. »

1:45-2:45  CE QU'ORANGE A DÉJÀ
           « Vous exploitez déjà la tonalité d'attente personnalisée sur `*144#`,
             et elle sait déjà affecter un contenu selon l'appelant. La brique
             technique existe. »

2:45-3:45  CE QUE CALL COM APPORTE
           « La force de vente auprès des commerçants locaux tunisiens :
             restaurants, pharmacies, garages, cliniques. Des centaines
             d'annonceurs que vous ne démarcherez jamais vous-mêmes.
             Plus l'application, les récompenses et le back-office. »

3:45-4:30  LA DEMANDE, PRÉCISE ET PETITE
           « Un POC sur 10 à 20 lignes de test, en pré-provisionnement.
             Aucun développement de votre côté, aucune dépendance de votre
             réseau à nos systèmes, et un kill-switch entièrement dans vos mains. »

4:30-5:00  LES DEUX QUESTIONS
           « Deux questions pour avancer : êtes-vous en VoLTE/IMS ou en CAMEL ?
             Et vos enregistrements contiennent-ils la durée réellement écoutée ? »
```

**Pourquoi finir sur deux questions techniques précises :** cela signale que vous avez
déjà fait le travail, et déplace la conversation de « est-ce une bonne idée » vers
« comment on fait ». C'est le basculement qu'il faut obtenir en première réunion.

## 13.3 B. Ce que Call Com doit demander

| Priorité | Demande |
|---|---|
| 1 | Une **réunion technique** avec l'équipe voix / cœur de réseau. *C'est la vraie demande.* |
| 2 | Les réponses à **B1, B2, B3, C6** (architecture voix, éditeur de la plateforme, ciblage par appelant, contenu des CDR) |
| 3 | Un **accord de principe** pour étudier un POC |
| 4 | L'identification du **sponsor métier** |
| 5 | Le **processus et le délai** d'autorisation d'un POC |
| 6 | Les **contraintes réglementaires** vues par Orange (R2, R3, R12) |

## 13.4 C. Ce qu'il ne faut PAS demander trop tôt

| À éviter en première réunion | Pourquoi |
|---|---|
| ❌ Une **API temps réel** dans le chemin d'appel | Vous serez classé « ne comprend pas les contraintes opérateur ». À garder pour la phase 2 |
| ❌ L'**accès aux données d'abonnés** | Déclenche immédiatement la conformité et bloque tout |
| ❌ Un **partage de revenus précis** | Trop tôt : vous n'avez encore rien prouvé, et vous vous enfermez sur un chiffre |
| ❌ Une **exclusivité** | Prématuré et présomptueux |
| ❌ L'**hébergement d'un composant Call Com** chez Orange | Processus de validation sécurité très long. Phase 2 |
| ❌ Le **numéro de l'appelant** | Inutile pour le service, et toxique en conformité |
| ❌ Un **déploiement sur la base réelle** | Demandez 20 lignes, pas 2 millions d'abonnés |
| ❌ Des **engagements de délai** de leur part | Ils ne peuvent pas, et cela crispe |

## 13.5 D. Informations techniques à obtenir absolument

Par ordre d'impact sur l'architecture :

```
1. IMS/VoLTE ou CS/CAMEL ?                  → détermine toute l'intégration
2. Éditeur de la plateforme CRBT             → détermine l'interlocuteur et le calendrier
3. Ciblage par appelant / par zone : natif ? → détermine si le ciblage est faisable
4. Contenu des CDR : durée écoutée ? motif ? → détermine la facturation
5. Média précoce en interconnexion           → détermine l'inventaire réel
6. Format audio imposé                       → détermine le pipeline de transcodage
7. Variante origine possible ?               → peut simplifier radicalement le projet
8. Capacité MRF en sessions simultanées      → détermine le plafond de scalabilité
9. Existence d'une interface partenaire      → détermine l'effort d'intégration
10. Environnement et lignes de test          → détermine la faisabilité du POC
```

## 13.6 E. Les personnes et services à rencontrer

| Service | Rôle dans la décision | Quand | Ce qu'il faut de lui |
|---|---|---|---|
| **Orange Fab** | Porte d'entrée, introduction interne | **1er** | Une mise en relation avec le métier |
| **Direction VAS / Services à valeur ajoutée** | 🎯 **Le propriétaire du service de tonalité d'attente** | **1er / 2e** | **C'est l'interlocuteur clé.** Sponsor métier, capacités de la plateforme |
| **Marketing B2B / Innovation** | Sponsor commercial, arbitrage du partenariat | 2e | Intérêt business, modèle de partage |
| **Équipe voix / cœur de réseau** | 🎯 **Le veto technique** | **2e / 3e** | Architecture, latence, faisabilité réelle, CDR |
| **Équipe produit** | Intégration au catalogue, parcours abonné | 3e | Consentement, souscription, facturation |
| **Juridique / réglementaire** | Veto réglementaire | 3e | R2, R3, R5, R12 |
| **Sécurité (RSSI)** | Veto sécurité | 4e | Schéma d'authentification, exigences partenaire |
| **Éditeur de la plateforme CRBT** | 🎯 **L'exécutant technique réel** | 4e | Interface, format, effort, calendrier, **coût** |
| **Orange Advertising** (ou équivalent local) | Allié potentiel | opportuniste | Cohérence avec la stratégie publicitaire du groupe |

> **Les trois interlocuteurs qui décident réellement sont : la direction VAS (propriétaire
> du service), l'équipe cœur de réseau (veto technique), et l'éditeur de la plateforme
> (qui fera le travail et le facturera).** Orange Fab est une porte, pas un décideur sur
> ce sujet.

**Un conseil d'ordre pratique :** ne demandez pas à rencontrer le cœur de réseau en
première réunion. Obtenez d'abord l'adhésion du métier VAS ; c'est lui qui convoquera le
réseau. Un architecte réseau sollicité directement par une startup externe répond
rarement.

---

# 14. Recommended Next Steps

## Séquence sur 12 semaines

| Sem. | Action | Responsable | Livrable |
|---|---|---|---|
| **1** | Finaliser le dossier de présentation 5 min + la checklist de questions | Vous | Deck + checklist |
| **1** | Vérifier le calendrier des cohortes Orange Fab et la thématique en cours | Call Com | Décision : Fab ou B2B direct |
| **1-2** | Prise de contact Orange Fab **et** direction VAS, en parallèle | Call Com | Réunion obtenue |
| **2** | **En parallèle, sans attendre Orange** : 15 à 20 rendez-vous annonceurs pour établir le CPM réellement accepté | Call Com | CPM écrit, 5 lettres d'intention |
| **2** | **En parallèle** : engager le conseil juridique tunisien sur R2, R3, R5, R12 | Call Com | Note de qualification |
| **3-4** | Première réunion Orange — présentation + les 2 questions techniques | Vous + Call Com | Réponses à B1, B2 |
| **4-6** | Réunion technique cœur de réseau / VAS | Vous | Réponses à B3, B4, B9, B11, C6, C7 |
| **6** | **Point de décision n°1** : la plateforme permet-elle le ciblage et la mesure ? | Vous | Note d'architecture |
| **6-8** | Cadrage du POC, identification de l'éditeur de la plateforme | Vous + Orange | Cahier de POC |
| **8-11** | Développement Call Com côté POC (18 j/h) contre adaptateur bouchon | Équipe dev | Chaîne A opérationnelle |
| **9-12** | Provisioning Orange + exécution du POC | Orange + Call Com | Mesures |
| **12** | **Point de décision n°2** : go/no-go industrialisation | Tous | Rapport de POC |

## Les trois choses à ne pas faire

1. **Ne pas développer la plateforme complète avant le point de décision n°1.** Les
   réponses à B3, B4 et C6 changent la conception du moteur de ciblage et de la
   facturation.
2. **Ne pas mettre Orange dans le chemin critique du développement.** L'interface
   `OperatorAdapter` (§5.3) permet de construire les 80 % restants contre un bouchon.
   Si Orange met neuf mois, vous ne perdez pas neuf mois.
3. **Ne pas attendre Orange pour valider la demande annonceur.** C'est indépendant, c'est
   le risque n°1 du projet, et c'est ce que Call Com peut faire dès demain.

## Ce qui reste vrai quoi qu'il arrive

Quel que soit le résultat côté Orange, **environ 80 % du produit est identique** :
application, unités, ledger, récompenses, back-office, facturation, anti-fraude. Les
migrations et les tests du §07 sont déjà écrits et validés. **Le travail n'est pas bloqué
par Orange — seule l'expérience d'appel l'est.**

---

# ✅ Checklist pour le premier rendez-vous Orange

**22 questions, à emporter telle quelle.** Les 🔴 sont celles à obtenir absolument, même
si la réunion est écourtée.

### Architecture réseau
```
[ ] 1. 🔴 Êtes-vous en VoLTE / IMS en production ? Quelle part du trafic voix ?
[ ] 2. 🔴 La plateforme de tonalité d'attente (`*144#`) est-elle interne, ou d'un éditeur
          tiers ? Lequel ?
[ ] 3.    Le déclenchement se fait-il par CAMEL (T-CSI / O-CSI) ou par iFC IMS ?
```

### Capacités de la plateforme
```
[ ] 4. 🔴 Peut-elle diffuser un contenu différent SELON L'APPELANT ?
          (une description de presse mentionne l'affectation à des personnes
           ou des groupes — est-ce bien natif ?)
[ ] 5. 🔴 Peut-elle diffuser un contenu différent SELON LA ZONE géographique ?
[ ] 6.    Gère-t-elle les plages horaires, les dates de validité, la rotation pondérée
          et un plafond de fréquence par abonné ?
[ ] 7.    Quelle durée maximale de contenu avant décrochage ?
[ ] 8.    Quel format audio imposez-vous exactement ?
[ ] 9.    Combien de sessions média simultanées, et quelle taille de catalogue ?
```

### La variante origine
```
[ ] 10. 🔴 Pouvez-vous diffuser un contenu à VOTRE PROPRE ABONNÉ pendant qu'il attend
           que son correspondant décroche ? (et non seulement à ses appelants)
[ ] 11.    Dans ce cas, pouvez-vous ignorer le média précoce venant du réseau distant ?
```

### Interconnexion — dimensionne l'inventaire réel
```
[ ] 12. 🔴 Le média précoce est-il honoré vers Ooredoo, Tunisie Telecom, et en
           international entrant ? Un appelant hors réseau entend-il bien le contenu ?
[ ] 13.    Quelle part des appels entrants vers vos abonnés vient d'Orange ?
```

### Mesure et facturation
```
[ ] 14. 🔴 Vos enregistrements contiennent-ils la DURÉE RÉELLEMENT ÉCOUTÉE ?
[ ] 15. 🔴 Contiennent-ils le MOTIF D'ARRÊT, et distinguez-vous le cas où le réseau de
           l'appelant n'a pas ouvert le canal (contenu non entendu) ?
[ ] 16.    Savez-vous si l'appel a été décroché, et sa durée ?
[ ] 17.    À quelle fréquence, sous quel format et par quel transport pouvez-vous
           exporter ces événements ?
```

### Intégration
```
[ ] 18. 🔴 Existe-t-il DÉJÀ une interface partenaire sur cette plateforme (dépôt de
           contenu, remontée d'usage) ?
[ ] 19.    Un composant du cœur peut-il appeler un service externe pendant un appel ?
           Y a-t-il un précédent, et quel budget de timeout ?
[ ] 20.    Pouvez-vous fournir un pseudonyme d'abonné stable et non réversible
           (HMAC de MSISDN sur clé partagée) plutôt qu'un numéro ?
```

### Consentement et POC
```
[ ] 21. 🔴 Comment traitez-vous le consentement de l'appelant, qui entend le contenu
           sans avoir rien accepté ? Existe-t-il une liste noire côté appelant ?
[ ] 22. 🔴 Accepteriez-vous un POC sur 10 à 20 lignes de test, en pré-provisionnement,
           sans aucune dépendance de votre réseau à nos systèmes, avec un kill-switch
           entièrement de votre côté ?
```

### À proposer spontanément — avant qu'on vous le demande
```
[ ] Le repli est la tonalité normale, déclenché par un timeout dur de VOTRE côté.
[ ] Le kill-switch est chez vous, activable unilatéralement et immédiatement.
[ ] Nous ne demandons AUCUNE donnée personnelle d'abonné.
[ ] Nous mesurerons le taux de décrochage avec et sans contenu, et nous acceptons
    que sa dégradation soit un critère d'arrêt du POC.
```

---

# Sources

## Précédents de publicité en tonalité d'attente
- [Turkcell's ringback tone ad platform reaches 200,000 members — Marketing Dive / Mobile Marketer](https://www.marketingdive.com/ex/mobilemarketer/cms/news/advertising/2566.html) — 50 marques, 72 campagnes, 200 000+ membres, récompense moyenne ~65 unités ≈ 20 min/mois
- [Turkcell breaks new ground in the advertising world — MMA Global](https://www.mmaglobal.com/articles/turkcell-breaks-new-ground-advertising-world)
- [Turkcell Tone&Win — présentation](https://slideshare.net/edirik/turkcell-tonewin)
- [Turkcell Ring Back Advertising A Big Success — MobiAD News](https://www.mobiadnews.com/?p=3279)
- [Engineering:Ringback tone advertising — HandWiki](https://handwiki.org/wiki/Engineering:Ringback_tone_advertising) — démarrage commercial vers 2008 avec Turkcell, RingPlus et « Yesss! » d'Orange
- [Jinny Hails Ringback Tone Advertising — Mobile Marketing Magazine](https://mobilemarketingmagazine.com/jinny-hails-ringback-tone-advertising) — évaluations par des opérateurs MEA
- [Ever Heard An AdRBT? MMA case studies — MediaNama](https://www.medianama.com/2010/03/223-adrbt-advertising-start-plus-action-shoes/)

## Architecture CRBT / RBT
- [Application Note: Color Ring Back Tone — Dialogic](https://www.dialogic.com/~/media/products/docs/signaling-and-ss7-components/8933_CRBT_Building_Wireless_Apps_with_Signaling_Solutions_an.pdf) — CRBT-AS, serveur média, négociation
- [Provision of Caller Ring Back Tones for IP Multimedia Platforms — Strathmore University](https://su-plus.strathmore.edu/bitstream/handle/11071/5190/Provision%20of%20Caller%20Ring%20Back%20Tones%20for%20IP%20Multimedia.pdf?sequence=1&isAllowed=y)
- [Telecom Tutorial: CRBT (Caller Ring Back Tone)](http://telecomgiant.blogspot.com/2011/05/crbt-caller-ring-back-tone.html) — flux T-CSI / GMSC / SCP
- [Intelligent Networks (IN) and CAMEL](https://telecomprotocols.blogspot.com/2012/09/intelligent-networks-in-and-camel.html) — rôle du T-CSI
- [Ring Back Tones (RBT): The MVNO Guide to Caller Tunes — MVNO Index](https://mvno-index.com/ring-back-tones-rbt/) — modèle de partage de revenus VAS / opérateur
- [Caller Ring Back Tone Solution — Comviva](https://www.comviva.com/products-solutions/revtech/caller-ring-back-tone-crbt/) — 35+ déploiements
- [Web based CRBT Solution — 6D Technologies](https://www.6dtechnologies.com/network-vas/caller-ringback-tone/)
- [US8553869B2 — Method for implementing RBT interworking, MGCF and application server](https://patents.google.com/patent/US8553869B2/en) — interfonctionnement RBT, 183 Session Progress

## Orange Tunisie et Orange Fab
- [Orange Tunisie change les services music play et tonalité d'attente — Kapitalis](http://www.kapitalis.com/conso/3693-orange-tunisie-change-les-services-music-play-et-tonalite-dattente.html) — abonnement ~500 millimes/mois, menu `*144#`, catalogue, playlist jusqu'à 10 tonalités, **affectation à des personnes ou groupes**
- [Comment changer ou supprimer la sonnerie d'attente — Orange Assistance Tunisie](https://www.orangeassistance.tn/questions/1060687-changer-bien-supprimer-sonnerie-attente)
- [Orange Fab Tunisie](https://orangefab.tn/) · [Le Programme](https://orangefab.tn/notre-programme/)
- [Cinq startups rejoignent la nouvelle cohorte d'Orange Fab Tunisie — Managers](https://managers.tn/2026/03/12/cinq-startups-rejoignent-la-nouvelle-cohorte-dorange-fab-tunisie/)
- [Orange Fab Tunisie lance sa 8ème cohorte, une édition 100% IA — Orange Tunisie](https://www.orange.tn/actualites/actus/orange-fab-tunisie-lance-sa-8me-cohorte-une-dition-100-ia)
- [Orange Fab Tunisie: Empowering Innovation & Growth — Africapreneurs](https://africapreneurs.com/orange-fab-tunisie/) — 45 startups depuis 2019, ~90 % actives, critères de sélection
- [Orange Tunisia — Wikipedia](https://en.wikipedia.org/wiki/Orange_Tunisia)

## APIs réseau Orange
- [Network APIs — Orange Developer](https://developer.orange.com/products/network-apis/) — 10+ APIs : Quality on Demand, SIM Swap, Location retrieval, Geofencing…
- [What are GSMA Open Gateway and CAMARA initiatives — Orange Developer](https://developer.orange.com/blog/what-are-gsma-open-gateway-and-camara-initiatives/)
- [GSMA Open Gateway — Open Network APIs for Developers](https://www.gsma.com/solutions-and-impact/gsma-open-gateway/)
- [Open Gateway 1Q26 Update — CAMARA Project](https://camaraproject.org/wp-content/uploads/sites/12/2026/02/Open-Gateway-1Q26-Update.pdf) — 300+ instances, 20 APIs, 65 marchés
- [From Ambition to Execution: Open Gateway — GSMA Newsroom](https://www.gsma.com/newsroom/article/from-ambition-to-execution-how-open-gateway-is-scaling-the-global-api-economy/)

## Contexte VoLTE / IMS en Tunisie
- [Ooredoo Tunisie : lancement des services VoLTE et IPv6 — Tustex](https://www.tustex.com/economie-actualites-des-societes/ooredoo-tunisie-lancement-des-deux-services-volte-et-l-ipv6) — lancement le 28/11/2023
- [Tunisie : Ooredoo lance officiellement le service VoLTE et l'IPv6 — Agence Ecofin](https://www.agenceecofin.com/operateur/2911-114130-tunisie-ooredoo-lance-officiellement-le-service-volte-et-l-ipv6)

## Publicité et actifs opérateur
- [Orange Advertising](https://orangeadvertising.fr/) — régie publicitaire et data du groupe Orange
- [Comment Orange Advertising se positionne sur la data — mind Media](https://www.mind.eu.com/media/article/comment-orange-advertising-se-positionne-sur-la-data/)

---

## ⚠️ Rappel de méthode

Ce document contient **trois natures d'information** et il ne faut pas les confondre en
réunion :

- ✅ Les **FAITS** sont sourcés et opposables. Le précédent Turkcell, l'existence du
  service de tonalité d'attente chez Orange Tunisie, l'absence d'API CRBT dans CAMARA,
  la 8ᵉ cohorte 100 % IA : tout cela peut être affirmé.
- 🔶 Les **HYPOTHÈSES** décrivent la pratique standard de l'industrie. Elles sont très
  probablement vraies, mais **ne les présentez jamais comme connues d'Orange Tunisie**.
- ❓ Les points **À CONFIRMER** constituent l'ordre du jour de la réunion. C'est la valeur
  réelle de ce document : savoir exactement quoi demander.

**Je ne connais pas l'architecture interne d'Orange Tunisie, et aucune conclusion de ce
document ne doit être présentée comme si je la connaissais.**
