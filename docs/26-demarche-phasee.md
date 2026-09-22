# 26 — Démarche phasée : avant / pendant / après Orange

**Étude orientée réalisation** · 22 septembre 2026 · v2.0
Remplace l'approche du [§24](24-etude-orange-integration.md), qui reste la **base
technique de référence** mais dont le séquencement était mauvais.

---

## Pourquoi cette révision

La version précédente chiffrait **27,5 jours d'étude avant le premier contact avec
Orange**. C'est une erreur de méthode : elle produisait du détail sur des **hypothèses**
concernant un réseau dont nous ne connaissons pas l'architecture. Une bonne partie de ce
travail aurait dû être refaite après la première réunion.

**Le principe retenu désormais :**

> **Avant Orange, on ne produit que ce qui est nécessaire pour obtenir et réussir le
> premier rendez-vous. Le détail vient après, quand on sait de quoi on parle.**

| | Avant | **Après révision** |
|---|---|---|
| Effort avant le 1er contact Orange | 27,5 j | **9,5 j** |
| Ticket d'entrée (avec la réunion) | 30,5 j — 21 350 TND | **12,5 j — 8 750 TND** |
| Détail d'architecture, API, modèle de données | Avant Orange | **Après Orange, conditionné à sa réponse** |
| Risque de retravail | Élevé | Faible |

---

## Vue d'ensemble

```
PHASE 1 — AVANT ORANGE                                   9,5 j    6 650 TND
  Objectif : un dossier assez solide pour obtenir et réussir le rendez-vous
  Livrable : note de faisabilité + architecture conceptuelle + scénarios
             + POC + questions + 2 présentations
                              │
                              ▼
PHASE 2 — PREMIER ÉCHANGE                                3,0 j    2 100 TND
  Objectif : valider la faisabilité DE PRINCIPE et obtenir les réponses
  Livrable : compte rendu + note de décision d'architecture
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Orange OK         Orange OK       Orange non
        simple            complexe        ou sans suite
              │               │               │
              ▼               ▼               ▼
PHASE 3 — ÉTUDE DÉTAILLÉE (conditionnelle)
        12-15 j           20-25 j          4-6 j
     8 400-10 500      14 000-17 500    2 800-4 200 TND
```

**Rien de la Phase 3 n'est chiffré fermement aujourd'hui**, et c'est volontaire : son
contenu dépend de ce qu'Orange répondra. Un cadrage d'une journée, après la réunion, fixe
le périmètre et le prix.

---

# PHASE 1 — Avant Orange

*Ce que contient le dossier à produire. C'est le livrable vendu en Phase 1.*

## 1.1 Ce qui est CERTAIN — indépendant d'Orange

Ces sept points ne dépendent d'aucune information sur le réseau d'Orange. Ils sont
établis et sourcés, et peuvent être affirmés devant des ingénieurs.

| # | Fait | Source |
|---|---|---|
| **C1** | **Une application mobile ne peut pas injecter d'audio dans un appel téléphonique classique**, ni sur Android ni sur iOS. Le chemin audio d'un appel est géré par le composant radio du téléphone, hors de portée des applications | Documentation Android ; forums développeurs Apple (`AVAudioSessionErrorInsufficientPriority`) |
| **C2** | **Ce que l'appelant entend avant le décrochage est produit par le réseau**, pas par le téléphone appelé. Par défaut, c'est le commutateur de l'appelant qui fabrique la tonalité | Standard GSM / ISUP |
| **C3** | **Sur iOS, une application ne peut même pas détecter un appel téléphonique classique** — ni sa durée. Un modèle de récompense basé sur les minutes y est inapplicable | Documentation CallKit ; forums Apple |
| **C4** | **Conséquence directe de C1 et C2 : l'insertion d'une annonce avant décrochage se fait nécessairement dans le réseau, ou dans une plateforme qui porte l'appel.** Il n'existe pas de troisième voie | Déduction de C1 + C2 |
| **C5** | **Le service existe comme catégorie de produit télécom** : la tonalité d'attente personnalisée (RBT / CRBT) est déployée mondialement. Remplacer cette tonalité par de la publicité s'appelle *RBT advertising* | Littérature VAS ; éditeurs de plateformes |
| **C6** | **Un précédent commercial existe, récompense abonné incluse** : Turkcell « Tone&Win » (2008) — 50 marques, 72 campagnes, 200 000+ membres, ~20 min de crédit offertes par abonné et par mois, proportionnellement au temps réellement écouté par ses appelants | Mobile Marketer / Marketing Dive ; MMA Global |
| **C7** | **Aucune API publique de contrôle d'appel ou de tonalité d'attente n'existe** dans le catalogue de réseau exposé par Orange (GSMA Open Gateway / CAMARA, qui couvre l'identité, la localisation, la qualité de service, la fraude). L'intégration sera donc **contractuelle, pas en libre-service** | Orange Developer ; CAMARA |

**Ce que C1 à C7 permettent de dire devant Orange, sans rien supposer sur leur réseau :**

> *« Nous savons que ce service ne peut pas se faire depuis une application. Nous savons
> qu'il se fait dans le réseau. Nous savons qu'un opérateur pair l'a exploité
> commercialement avec succès. Ce que nous ne savons pas, c'est comment votre réseau est
> organisé — et c'est pour cela que nous sommes là. »*

## 1.2 Ce qui est HYPOTHÈSE — pratique standard, non vérifiée pour Orange Tunisie

À présenter comme des hypothèses, jamais comme des acquis.

| # | Hypothèse | Pourquoi c'est probable | Impact si fausse |
|---|---|---|---|
| **H1** | Orange Tunisie exploite une plateforme de tonalité d'attente | Le service est commercialisé publiquement (menu `*144#`, abonnement mensuel, catalogue) | Le projet devient beaucoup plus lourd : il faudrait construire la brique |
| **H2** | Cette plateforme sait déjà varier le contenu selon l'appelant | C'est une fonction standard des plateformes RBT, et une description publique du service mentionne l'affectation à des personnes ou des groupes | Le ciblage devient un développement, pas un paramétrage |
| **H3** | Elle sait gérer des dates de validité et des plages horaires | Fonction standard d'un catalogue de contenus daté | Les campagnes devraient être gérées manuellement |
| **H4** | La plateforme enregistre la durée pendant laquelle le contenu a été joué | Nécessaire à la facturation du service existant | **La facturation publicitaire devient indéfendable** — point critique |
| **H5** | Le budget de temps pour décider quel contenu jouer, pendant l'établissement de l'appel, se compte en dizaines de millisecondes | Ordre de grandeur habituel des plateformes de service en temps réel | Une intégration temps réel serait impossible ; seul le pré-provisionnement resterait |
| **H6** | Orange n'acceptera pas de dépendance à un service externe dans le chemin d'établissement d'appel | Position habituelle de toute équipe cœur de réseau, et elle est légitime | L'intégration temps réel deviendrait envisageable |

> **H4 est l'hypothèse la plus risquée du projet.** Si Orange ne peut pas fournir la durée
> réellement écoutée, Call Com ne peut pas vendre un tarif défendable à un annonceur. **À
> vérifier dès le premier échange.**

## 1.3 Où l'intégration pourrait se faire — vocabulaire générique

⚠️ **Cette section décrit une architecture télécom générique, pas celle d'Orange.** Elle
sert uniquement à situer le point d'intégration et à poser des questions précises.

Dans un réseau mobile, quelle que soit sa génération, un service de ce type mobilise
**trois fonctions** :

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ① UN DÉCLENCHEUR                                                       │
│     « cet abonné est inscrit au service »                               │
│     → posé dans les données d'abonné, consulté à chaque appel            │
├─────────────────────────────────────────────────────────────────────────┤
│  ② UNE LOGIQUE DE DÉCISION                                              │
│     « pour cet appel, jouer tel contenu »                               │
│     → c'est ICI que la logique publicitaire devrait s'insérer            │
├─────────────────────────────────────────────────────────────────────────┤
│  ③ UN COMPOSANT MÉDIA                                                   │
│     stocke et diffuse le fichier audio vers l'appelant                  │
│     → c'est l'exécutant, il existe déjà pour le service actuel            │
└─────────────────────────────────────────────────────────────────────────┘
```

**Ces trois fonctions existent nécessairement**, puisque le service de tonalité d'attente
d'Orange fonctionne. **Comment elles sont réalisées — sur quels équipements, avec quel
éditeur, dans quelle génération de réseau — nous ne le savons pas.** C'est l'objet de la
question Q1 du §1.7.

**Pourquoi cette formulation en trois fonctions plutôt qu'en acronymes :** elle est vraie
dans les deux grandes familles d'architecture (commutation de circuit et réseau tout-IP),
elle évite de plaquer un schéma qui pourrait ne pas correspondre, et elle permet à
l'ingénieur d'en face de répondre « chez nous, ② c'est tel équipement » — ce qui est
exactement l'information recherchée.

### Deux moments possibles pour insérer l'annonce

**Variante T — l'appelant entend** *(celle du cahier des charges)*

```
Un tiers appelle l'abonné Call Com
   → le réseau consulte le déclencheur de l'abonné APPELÉ
   → la logique choisit l'annonce
   → le composant média la joue À L'APPELANT
   → l'abonné décroche → l'annonce s'arrête → conversation
```

**Variante O — l'abonné Call Com entend** *(à mettre sur la table)*

```
L'abonné Call Com appelle quelqu'un
   → le réseau consulte le déclencheur de l'abonné APPELANT
   → la logique choisit l'annonce
   → le composant média la joue À L'ABONNÉ, pendant qu'il attend
   → le correspondant décroche → l'annonce s'arrête → conversation
```

| | Variante T | **Variante O** |
|---|---|---|
| Qui entend | L'appelant | L'abonné inscrit |
| L'auditeur a-t-il consenti ? | **Non** | **Oui** |
| L'auditeur est-il récompensé ? | **Non** | **Oui** |
| Ciblage géographique possible ? | Seulement si l'appelant est abonné Orange | **Oui, Orange connaît son abonné** |
| Dépend du réseau de l'autre partie ? | **Oui** | **Non** |
| Précédent commercial | **Oui** (Turkcell) | Moins documenté |

**La variante O résout trois problèmes d'un coup.** Mais nous ne savons pas laquelle est
la moins coûteuse à mettre en œuvre chez Orange. **On présente les deux et on leur
demande.** C'est la question Q5.

## 1.4 Architecture conceptuelle de Call Com

### La frontière, d'abord

C'est le point le plus important à poser devant Orange, avant tout schéma :

```
ORANGE GARDE                              CALL COM PORTE
────────────                              ──────────────
Le réseau et le composant média            La relation annonceur
La base d'abonnés                          Les créatifs et les campagnes
Le consentement et la facturation abonné   Les règles de ciblage
La conformité réglementaire                Le portefeuille d'unités
Les données d'abonnés — jamais exportées   L'application mobile
La décision de quoi jouer                  Le back-office et le reporting
  (dans le scénario recommandé)            La facturation annonceur
```

> **Call Com ne demande aucune donnée personnelle d'abonné, et ne veut pas en recevoir.**
> Un pseudonyme non réversible suffit à créditer les récompenses. C'est à la fois la
> position la plus confortable en conformité et le meilleur argument commercial.

### Les modules de la plateforme Call Com

Sept modules, indépendants du scénario d'intégration retenu :

| Module | Rôle | Dépend d'Orange ? |
|---|---|---|
| **Gestion des annonceurs et campagnes** | CRUD, dates, budgets, zones, validation des créatifs | Non |
| **Moteur de ciblage** | Exprime les règles : zones, plages horaires, plafonds, rotation | Non |
| **Chaîne de production des créatifs** | Transcodage vers le format imposé par l'opérateur, empreinte, versions | **Format imposé par Orange** |
| **Adaptateur opérateur** | Pousse contenus et règles ; récupère les diffusions | **Entièrement** |
| **Validation et comptage** | Une diffusion est-elle facturable ? créditable ? | **Dépend des données fournies** |
| **Portefeuille d'unités** | Attribution, plafonds, historique, expiration | Non |
| **Récompenses** | Catalogue data / crédit / minutes, demandes, traitement | Non (opérateur ou agrégateur) |

**Point de conception clé — l'adaptateur opérateur.** Un seul module concentre toute la
dépendance à Orange. Cela permet trois choses :
1. développer les six autres modules **sans attendre Orange**, contre un adaptateur
   bouchon ;
2. changer de scénario d'intégration sans toucher au reste ;
3. ajouter un second opérateur plus tard comme une implémentation de plus.

**C'est ce qui rend le projet finançable** : ~80 % de la plateforme ne dépend pas de la
réponse d'Orange.

## 1.5 Scénarios d'intégration possibles

Trois scénarios, présentés **par ordre d'acceptabilité probable pour un opérateur** — ce
qui n'est pas l'ordre d'élégance technique. Aucun ne présume de ce qu'Orange peut faire.

### Scénario 1 — Pré-provisionnement *(à proposer en premier)*

```
Call Com                                    Orange
────────                                    ──────
Campagnes, règles,     ──① dépôt──►   Plateforme de tonalité d'attente
fichiers audio            périodique    • contenus Call Com ajoutés au catalogue
                                        • règles appliquées LOCALEMENT
                                        • aucun appel externe pendant l'appel
                                                    │
                                                    ② appel réel → annonce jouée
                                                    │
Comptage, unités,      ◄──③ diffusions──────────────┘
facturation                en différé
```

**Pourquoi le proposer en premier :** aucune latence ajoutée, aucune dépendance du réseau
d'Orange à Call Com, et probablement aucun développement côté Orange si l'ingestion de
contenu existe déjà.
**Limite assumée :** pas de temps réel. Une campagne activée le matin peut n'être diffusée
que le lendemain. C'est acceptable, et cela s'écrit dans le contrat annonceur.

### Scénario 2 — Consultation en temps réel

Orange interroge un service Call Com pendant l'établissement de l'appel pour savoir quel
contenu jouer. Les fichiers restent pré-poussés : seule une **référence** circule.

**Techniquement le plus souple. Commercialement le plus difficile** — il introduit une
dépendance externe dans le chemin d'appel (hypothèse H6). **À ne pas demander en première
réunion.**

### Scénario 3 — Composant Call Com hébergé chez Orange

La décision se fait dans un composant fourni par Call Com mais **déployé dans le
périmètre d'Orange**. Il fonctionne même si le lien vers Call Com est coupé.

Le compromis qui lève l'objection du scénario 2, mais qui suppose qu'Orange accepte
d'héberger un composant tiers — avec une validation sécurité qui prend du temps.

### Et si Orange ne donne pas suite

Une architecture sans opérateur existe : faire transiter les appels par une plateforme
Call Com. Elle a trois points durs sérieux (l'abonné peut rater des appels sans
connexion, ses conversations passent par Internet, et le coût d'acheminement est à
négocier). **Elle n'est pas le sujet du rendez-vous Orange, mais elle existe** — et le
savoir change la posture de négociation. Détail en [§23.4](23-analyse-spec-call-com.md).

### Comparaison

| Critère | S1 Pré-provisionné | S2 Temps réel | S3 Hébergé |
|---|---|---|---|
| Latence ajoutée dans l'appel | **Aucune** | Significative | Négligeable |
| Dépendance externe | **Aucune** | **Forte** | Aucune |
| Fraîcheur des campagnes | Jour +1 | Immédiate | Minutes |
| Effort probable côté Orange | **Faible** | Élevé | Moyen |
| Acceptabilité probable | **●●●●●** | ●●○○○ | ●●●○○ |
| À proposer en 1ʳᵉ réunion | **Oui** | Non | Non |

## 1.6 Sécurité, données et anti-fraude — grandes lignes

*Niveau Phase 1 : les principes. Le détail est un sujet de Phase 3.*

### Données personnelles — le principe directeur

| Donnée | Call Com la reçoit ? |
|---|---|
| Numéro de l'abonné inscrit | Uniquement celui qu'il saisit lui-même dans l'application |
| Numéro de l'appelant | **Jamais** |
| Numéro appelé | **Jamais** |
| Localisation précise | **Jamais** — une zone administrative suffit |
| Journal d'appels | **Jamais** — seulement des événements de diffusion |
| Identifiant d'abonné Orange | **Pseudonyme non réversible uniquement** |

**Le mécanisme à proposer pour le pivot d'identité :** Orange et Call Com calculent une
empreinte du numéro avec une clé partagée. Orange transmet l'empreinte dans les
diffusions, Call Com la compare à celle de ses inscrits. **Aucun numéro ne circule, et le
rapprochement reste exact.** C'est une demande simple et peu intrusive.

### Anti-fraude — l'effet de bord favorable

Dans un modèle où la mesure vient du réseau, **l'anti-fraude devient presque gratuit** :

| Risque | Traitement |
|---|---|
| Falsification des diffusions par l'utilisateur | **Impossible** — la mesure vient d'Orange, pas du téléphone |
| Appels artificiels pour gonfler les gains | Plafonds par abonné et par jour ; détection d'anomalie sur les volumes |
| Multi-comptes | La récompense doit être créditée **sur le numéro de l'abonné lui-même** — chaque compte exige donc une SIM distincte |
| Manipulation de l'application | L'application ne produit aucune donnée de valeur |

> C'est un argument à faire valoir : **la voie opérateur supprime la classe entière des
> fraudes côté terminal**, qui serait le problème principal d'une solution applicative.

### Les trois sujets à faire qualifier — pas par un technicien

| Sujet | À poser à qui |
|---|---|
| Consentement de l'auditeur — dans la variante T, l'appelant entend sans avoir consenti | **Orange juridique + régulateur**, porté par Orange |
| Publicité insérée dans une communication — encadrement éventuel | **Régulateur**, porté par Orange |
| Hébergement du back-office hors de Tunisie — autorisation de transfert de données | **Conseil juridique tunisien**, porté par Call Com |

**Ne pas prétendre trancher ces points.** Les identifier et demander qui les porte est
exactement le bon niveau en Phase 1.

## 1.7 Le POC réalisable — une page

### Ce qu'il démontre, et rien de plus

```
① Un appel réel sur le réseau Orange
② Une annonce de 3-4 s est entendue par l'auditeur AVANT le décrochage
③ Le correspondant reçoit l'appel normalement
④ Au décrochage, l'annonce s'arrête et la conversation est normale
⑤ La diffusion est enregistrée et transmise à Call Com
```

### Périmètre volontairement minimal

| Dans le POC | Hors POC |
|---|---|
| 1 créatif, 1 campagne | Rotation, plafonds |
| Scénario 1 (pré-provisionnement) | Temps réel |
| 10 à 20 lignes de test | Abonnés réels |
| Remontée des diffusions en différé | Temps réel |
| Une seule variante — Orange choisit | Les deux |

### Critères de succès

```
[ ] L'annonce est entendue dans ≥ 95 % des appels de test sur le réseau Orange
[ ] Délai avant le premier son < 2 s
[ ] Arrêt au décrochage < 300 ms
[ ] 0 appel échoué imputable au mécanisme sur ≥ 300 appels
[ ] 100 % des diffusions présentes dans la remontée, avec une durée exploitable
[ ] Le taux de décrochage n'est pas dégradé par rapport au groupe témoin
```

> **Le dernier critère est proposé par Call Com, pas imposé par Orange.** Si les appelants
> raccrochent davantage parce qu'ils entendent une annonce, le produit détruit de la valeur
> pour Orange. L'annoncer spontanément comme critère d'arrêt est ce qui distingue un
> partenaire d'un demandeur.

### Ce que le POC demande à Orange

- la plateforme existante, sur un périmètre restreint ;
- l'activation du service sur 10 à 20 lignes de test ;
- un moyen de déposer des contenus ;
- **une remontée des diffusions, même en format brut** — c'est le seul vrai livrable
  technique attendu d'Orange.

## 1.8 Les 12 questions du premier rendez-vous

Volontairement **12, pas 22**. Un premier rendez-vous n'est pas une revue d'architecture :
c'est une validation de principe et l'obtention d'une réunion technique. Les 🔴 sont à
obtenir même si la réunion est écourtée.

### Faisabilité de principe
```
[ ] Q1  🔴 Le sujet « monétisation publicitaire de la tonalité d'attente » vous
           intéresse-t-il, et a-t-il déjà été étudié en interne ?
[ ] Q2     Votre service de tonalité d'attente est-il exploité en interne ou par un
           éditeur tiers ? (cela détermine qui nous devrons rencontrer ensuite)
[ ] Q3  🔴 Voyez-vous un obstacle de principe — technique, réglementaire ou commercial —
           avant même d'entrer dans le détail ?
```

### Capacités de la plateforme
```
[ ] Q4  🔴 Votre plateforme peut-elle diffuser un contenu différent selon l'appelant,
           et selon la zone géographique ?
[ ] Q5  🔴 Peut-elle diffuser l'annonce à VOTRE abonné pendant qu'il attend que son
           correspondant décroche — et pas seulement à ses appelants ?
[ ] Q6     Gère-t-elle des dates de validité, des plages horaires et une rotation
           entre plusieurs contenus ?
```

### Mesure — la question la plus importante
```
[ ] Q7  🔴 Vos enregistrements contiennent-ils la DURÉE PENDANT LAQUELLE LE CONTENU A
           ÉTÉ RÉELLEMENT ÉCOUTÉ ?
[ ] Q8  🔴 Distinguez-vous le cas où l'annonce n'a pas pu être entendue — par exemple
           si le réseau de l'appelant ne l'a pas transmise ?
[ ] Q9     Sous quelle forme et à quelle fréquence pourriez-vous nous transmettre ces
           diffusions ?
```

### Suite
```
[ ] Q10 🔴 Accepteriez-vous un POC sur 10 à 20 lignes de test, sans développement de
           votre côté et sans aucune dépendance de votre réseau à nos systèmes ?
[ ] Q11    Qui, chez vous, serait le sponsor métier d'un tel produit ?
[ ] Q12 🔴 Pouvons-nous obtenir une réunion avec votre équipe voix ?
```

### Les quatre engagements à énoncer spontanément
```
[ ] Le repli est votre tonalité normale, déclenché par un délai de garde de VOTRE côté.
[ ] Le kill-switch est chez vous, activable sans nous consulter.
[ ] Nous ne demandons aucune donnée personnelle d'abonné.
[ ] Nous mesurerons le taux de décrochage avec et sans annonce, et nous acceptons que
    sa dégradation soit un critère d'arrêt.
```

## 1.9 Livrables de la Phase 1

| Livrable | Format | Volume |
|---|---|---|
| Note de cadrage | PDF | 2 p. |
| **Note de faisabilité technique** — certain / hypothèse / à confirmer | PDF | 8-10 p. |
| Architecture conceptuelle + frontière Call Com / opérateur | PDF + schéma | 5 p. |
| Scénarios d'intégration + flux d'appel | PDF + 2 schémas | 6 p. |
| Note de principes sécurité / données / anti-fraude | PDF | 4 p. |
| Fiche POC | PDF | 1-2 p. |
| Checklist de questions | PDF imprimable | 2 p. |
| **Pitch 5 minutes** | PPTX | 9 slides |
| **Deck technique** | PPTX | 15-18 slides |

**Total : un dossier d'une trentaine de pages et deux présentations.** Sérieux, défendable
devant des ingénieurs, et sans une ligne d'architecture inventée.

---

# PHASE 2 — Premier échange avec Orange

## 2.1 Objectifs du rendez-vous — trois, pas plus

| # | Objectif | Comment on sait qu'il est atteint |
|---|---|---|
| **1** | **Valider la faisabilité de principe** | Orange ne dit pas « c'est impossible » et identifie la plateforme concernée |
| **2** | **Obtenir la réunion technique** | Une date, ou au moins un nom |
| **3** | **Obtenir les réponses à Q4, Q5 et Q7** | Ces trois réponses conditionnent toute la Phase 3 |

**Ce n'est pas un objectif de ce rendez-vous :** obtenir un accord commercial, un partage
de revenus, une exclusivité, ou un engagement de délai. Les demander serait prématuré et
crisperait la discussion.

## 2.2 Ce qu'il faut obtenir, par ordre d'impact

```
1. Y a-t-il un obstacle de principe ?                → arrête ou continue le projet
2. La plateforme sait-elle varier selon l'appelant
   et selon la zone ?                                → détermine si le ciblage est faisable
3. La durée réellement écoutée est-elle mesurée ?     → détermine si on peut facturer
4. Qui exploite la plateforme ?                       → détermine l'interlocuteur suivant
5. La variante O est-elle possible ?                  → peut simplifier radicalement le projet
6. Un POC restreint est-il envisageable ?             → détermine le calendrier
```

## 2.3 Ce qu'Orange pourrait proposer — et comment réagir

Anticiper les réponses est la moitié de la préparation.

| Si Orange dit… | Ce que ça signifie | Réaction à préparer |
|---|---|---|
| *« Notre plateforme est gérée par un éditeur externe »* | L'interlocuteur technique réel est l'éditeur, avec son calendrier et sa facturation | Demander à être mis en relation, et qui porte le coût de l'adaptation |
| *« On ne peut pas varier le contenu par zone »* | Le ciblage géographique tombe | **Replier sur une campagne nationale** pour le POC ; le ciblage devient un sujet de phase ultérieure. Ne pas abandonner |
| *« On n'a pas la durée écoutée, seulement le nombre de diffusions »* | La facturation à la seconde tombe | Négocier une base contractuelle alternative (à la diffusion, avec abattement). **Le savoir avant de vendre un tarif** |
| *« Il faudrait développer »* | Coût et délai côté Orange | Demander un ordre de grandeur et qui le finance. Proposer un POC qui évite ce développement |
| *« On préfère le faire nous-mêmes »* | Risque d'internalisation | Recentrer sur ce que Call Com apporte : la force de vente annonceurs, que l'opérateur ne construira pas |
| *« Passez par Orange Fab »* | Renvoi vers l'accélérateur | Accepter comme porte d'entrée, mais maintenir la demande de réunion technique |
| *« Il y a un sujet réglementaire »* | Vrai point dur | **Demander lequel, précisément**, et qui le porte auprès du régulateur |
| *« Envoyez-nous un dossier »* | Bon signe | Le dossier de Phase 1 est prêt — c'est exactement pour cela qu'il existe |

## 2.4 Les contraintes à clarifier

| Nature | À clarifier |
|---|---|
| **Technique** | Qui exploite la plateforme · capacités de ciblage · contenu de la remontée de diffusions · format audio imposé · capacité en appels simultanés |
| **Réglementaire** | Consentement de l'auditeur · encadrement de la publicité en communication · qui porte le dossier auprès du régulateur |
| **Commerciale** | Modèle de partage · qui facture l'annonceur · qui finance les récompenses · exclusivité éventuelle · frais d'intégration |
| **Organisationnelle** | Sponsor métier · processus d'autorisation d'un POC · délai type · rôle de l'éditeur de la plateforme |

## 2.5 Comment décider après la réunion

```
                    Obstacle de principe rédhibitoire ?
                                  │
                   ┌──────oui─────┴──────non──────┐
                   ▼                              ▼
            Basculer sur le plan B        La plateforme sait-elle
            (architecture sans            cibler, et mesure-t-elle
            opérateur, §23.4)             la durée écoutée ?
            Phase 3 scénario C                    │
                              ┌───────oui─────────┴────────non ou partiel───┐
                              ▼                                            ▼
                     Un POC est-il accepté                        Négocier un périmètre
                     en pré-provisionnement ?                      dégradé : campagne
                              │                                    nationale, facturation
                   ┌────oui───┴───non────┐                         à la diffusion
                   ▼                     ▼                                 │
          Phase 3 scénario A     Temps réel ou composant      ────────────►┘
          (12-15 j)              hébergé exigé ?
                                 Phase 3 scénario B (20-25 j)
```

**La règle de décision :** ne pas engager la Phase 3 avant d'avoir les réponses à Q4, Q5
et Q7. Sans elles, on retomberait dans l'erreur corrigée par cette révision — produire du
détail sur des hypothèses.

## 2.6 Livrables de la Phase 2

| Livrable | Contenu |
|---|---|
| **Compte rendu de réunion** | Réponses obtenues, question par question ; ce qui reste ouvert ; engagements pris de part et d'autre |
| **Note de décision d'architecture** | Le scénario retenu et pourquoi ; ce qui est désormais certain ; ce qui reste à confirmer |
| **Cadrage de la Phase 3** | Périmètre et chiffrage fermes, désormais possibles |

---

# PHASE 3 — Après Orange *(conditionnelle)*

**Rien ici n'est chiffré fermement aujourd'hui.** Le contenu dépend de la réponse
d'Orange. Un cadrage d'une journée, après la réunion, fixe le périmètre et le prix.

## 3.1 Les trois scénarios

### Scénario A — Orange confirme, intégration simple *(12 à 15 j)*

Orange accepte un pré-provisionnement, sa plateforme sait cibler et mesurer.

| Contenu | Jours |
|---|---|
| Architecture finale détaillée | 2 |
| Spécification des interfaces d'échange (dépôt de contenus, remontée de diffusions) | 2 |
| Modèle de données et migrations exécutables | 3 |
| Règles de validation, de comptage et de facturation | 1,5 |
| Architecture de sécurité et pseudonymat | 1,5 |
| POC détaillé : protocole, matériel, jeu de tests, critères | 2 |
| Infrastructure, coûts d'exploitation | 1 |
| Feuille de route de développement et estimation jours/homme | 1,5 |
| **Total** | **12 à 15 j** |

### Scénario B — Orange confirme, intégration complexe *(20 à 25 j)*

Orange exige une interface temps réel ou un composant hébergé chez lui.

S'ajoute au scénario A :

| Contenu supplémentaire | Jours |
|---|---|
| Contrats d'API détaillés : requêtes, réponses, idempotence, délais de garde, replis | 3 |
| Architecture de haute disponibilité au niveau opérateur | 2 |
| Dossier de sécurité pour validation par Orange | 2 |
| Spécification du composant hébergé, exploitation, astreinte | 2 |
| Tests de charge et de latence | 2 |
| **Total** | **20 à 25 j** |

### Scénario C — Orange ne donne pas suite *(4 à 6 j)*

| Contenu | Jours |
|---|---|
| Note de réorientation : ce qu'Orange a dit et ce que cela implique | 1 |
| Approche des deux autres opérateurs, avec le dossier existant | 1 |
| Architecture alternative sans opérateur : analyse des trois points durs | 2-3 |
| Décision : poursuivre, pivoter ou arrêter | 1 |
| **Total** | **4 à 6 j** |

## 3.2 Ce qui peut démarrer sans attendre Orange

Point important pour Call Com : **le développement n'est pas bloqué.**

| Chantier | Dépend d'Orange ? |
|---|---|
| Application mobile : inscription, consentement, solde, historique | **Non** |
| Portefeuille d'unités et son historique | **Non** |
| Back-office : annonceurs, campagnes, créatifs, validation | **Non** |
| Catalogue de récompenses et traitement des demandes | **Non** |
| Moteur de ciblage (expression des règles) | **Non** |
| Adaptateur opérateur | **Oui — et lui seul** |

**Environ 80 % de la plateforme peut être développée en parallèle**, derrière un
adaptateur bouchon. C'est l'argument à donner à Call Com s'il craint que tout soit
suspendu à Orange.

---

# Chiffrage

Détail, justification des tarifs et fiscalité dans [§25](25-chiffrage-mission.md).
Devis ajustable dans [`docs/devis/`](devis/).

| Phase | Jours | À 700 TND/j | Mode |
|---|---|---|---|
| **Phase 1 — avant Orange** | **9,5 j** | **6 650 TND** | Forfait |
| — variante allégée | 6,0 j | 4 200 TND | Forfait |
| **Phase 2 — premier échange** | **3,0 j** | **2 100 TND** | Forfait par cycle |
| — réunion supplémentaire | 1,5 j | 1 050 TND | À l'unité |
| **Ticket d'entrée (Ph. 1 + 2)** | **12,5 j** | **8 750 TND** | |
| Phase 3 — cadrage | 1,0 j | 700 TND | Forfait |
| Phase 3 — scénario A | 12-15 j | 8 400 – 10 500 TND | Forfait, après cadrage |
| Phase 3 — scénario B | 20-25 j | 14 000 – 17 500 TND | Forfait, après cadrage |
| Phase 3 — scénario C | 4-6 j | 2 800 – 4 200 TND | Forfait, après cadrage |

---

# Les cinq principes de cette démarche

1. **On ne détaille pas ce qu'on ne connaît pas.** Toute affirmation sur le réseau
   d'Orange est marquée comme hypothèse, et la Phase 3 n'est chiffrée qu'après réponse.
2. **On distingue systématiquement certain / hypothèse / à confirmer.** C'est ce qui rend
   le dossier crédible devant des ingénieurs, plus que le volume de pages.
3. **On concentre la dépendance dans un seul module.** L'adaptateur opérateur isole
   Orange ; les 80 % restants avancent sans lui.
4. **On demande peu et on s'engage beaucoup.** Un POC sur 20 lignes, quatre engagements
   énoncés spontanément, et un critère d'arrêt proposé par nous.
5. **On ne forfaitise jamais une phase dont on ne maîtrise pas le calendrier.** Les
   réunions Orange se facturent au cycle, pas au résultat.

---

## Annexe — rapport avec les autres documents du dossier

| Document | Statut |
|---|---|
| **§26 (celui-ci)** | **Le document opérationnel.** Ce qui est vendu et livré en Phase 1 |
| [§24](24-etude-orange-integration.md) | **Base technique de référence.** Matière approfondie sur les architectures télécom, à puiser au besoin — notamment pour préparer la réunion technique et la Phase 3. Ne se vend pas comme un livrable de Phase 1 |
| [§23](23-analyse-spec-call-com.md) | Analyse de la spécification Call Com et de l'architecture sans opérateur (plan B) |
| [§01](01-faisabilite-modele-coeur.md) | Démonstration détaillée de l'impossibilité applicative (fait C1 à C4) |
| [§25](25-chiffrage-mission.md) | Chiffrage, tarifs de marché, fiscalité, négociation |
| [§07](07-database-schema.md) + [`sql/`](sql/) | Modèle de données et migrations — **livrable de Phase 3**, déjà largement constitué |
