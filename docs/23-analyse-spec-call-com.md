# 23 — Analyse de la spécification fonctionnelle Call Com V1.0

> Document analysé : *Call Com — Spécifications Fonctionnelles V1.0*, septembre 2026.
> Cette section confronte la spécification du client au dossier technique existant et
> identifie ce qui change.

---

## 23.1 Ce que la spécification change — le point essentiel

**La spécification inverse le sens de l'appel par rapport à mon analyse initiale.**

| | Brief initial (analysé aux §01–§22) | **Spécification Call Com V1.0** |
|---|---|---|
| Qui déclenche l'appel | L'utilisateur de l'app (**appel sortant**) | Un tiers appelle l'utilisateur (**appel entrant**) |
| Qui entend la publicité | L'utilisateur de l'app | **L'appelant**, qui n'a pas l'application |
| Qui reçoit les unités | L'utilisateur (= l'auditeur) | **Le propriétaire de la ligne appelée** (≠ l'auditeur) |
| Moment de la diffusion | Avant la composition du numéro | Après la première tonalité, pendant que la ligne sonne |
| Arrêt | À la fin du créatif | **Au décrochage du propriétaire** |

Cette inversion a **quatre conséquences techniques majeures**, dont deux sont de mauvaises
nouvelles et deux de bonnes.

### ❌ Conséquence 1 — ALT-D, mon MVP recommandé, ne s'applique plus

ALT-D (« ad-then-dial ») reposait entièrement sur le fait que l'auditeur de la publicité
**était** l'utilisateur de l'application : on jouait donc le son localement, sur son
propre haut-parleur, avant de lancer l'appel.

Dans la spécification Call Com, **l'auditeur est l'appelant, qui n'a pas l'application.**
Le son doit franchir le réseau pour atteindre un tiers.

> **Il n'existe donc aucun mode dégradé purement applicatif pour la spécification telle
> qu'elle est écrite.** C'est plus contraint que le brief initial, pas moins : dans le cas
> sortant, on pouvait au moins livrer quelque chose depuis le téléphone. Ici, on ne peut
> rien livrer sans passer par le réseau ou par une plateforme d'appel.

### ❌ Conséquence 2 — l'auditeur n'a pas consenti et n'est pas récompensé

Le §14 de la spécification insiste, à juste titre, sur le consentement explicite. Mais le
consentement recueilli est celui du **propriétaire de la ligne**, alors que la personne
qui subit la publicité est **l'appelant**, qui n'a rien signé, ne reçoit aucune unité, et
n'a aucun moyen de se désabonner.

C'est une asymétrie structurelle du modèle, à deux niveaux :
- **Acceptabilité** : un appelant qui entend une publicité au lieu d'une sonnerie peut
  croire à une erreur de numéro ou à un spam, et raccrocher.
- **Réglementaire** : dans les déploiements RBT publicitaires existants, c'est
  **l'opérateur** qui porte cette responsabilité, via ses conditions générales et un visa
  du régulateur. Pour un tiers non-opérateur, la qualification est incertaine et doit être
  posée à un juriste tunisien, ainsi qu'à l'INT.

**Ce point n'est pas traité dans la spécification et doit être remonté à Call Com.** Il
n'est pas bloquant techniquement, mais il conditionne la forme du produit.

### ✅ Conséquence 3 — le problème de mesure iOS disparaît

C'était l'une de mes objections les plus fortes (§01, impossibilité n°3) : sur iOS, on ne
peut pas détecter un appel GSM, donc pas le mesurer.

**Dans les deux architectures viables pour cette spécification, la mesure se fait côté
serveur** — soit sur les CDR de l'opérateur, soit sur ceux de votre plateforme d'appel. Le
téléphone ne mesure plus rien, donc son incapacité n'a plus d'importance.

**Corollaire : l'asymétrie Android/iOS s'effondre.** Le barème « 1 diffusion = 10 unités »
du §8 de la spécification devient parfaitement mesurable sur les deux plateformes. C'est
une simplification importante, et elle rend le §8 de la spécification directement
applicable.

### ✅ Conséquence 4 — la valeur publicitaire est supérieure

Une même ligne expose des **appelants différents**. Là où mon modèle sortant exposait
toujours la même personne, la spécification Call Com atteint un public renouvelé : le
*reach* par utilisateur est structurellement plus élevé, ce qui est un meilleur argument
de vente. Et le volume n'est plus plafonné par l'usage de l'application, mais par le
nombre d'appels reçus.

---

## 23.2 Ce qui ne change pas

**La cause racine de l'impossibilité est identique, et même renforcée.**

Le §18 de la spécification (« Point technique critique ») demande précisément d'étudier la
compatibilité avec Android, les appels GSM, les mécanismes de téléphonie du système, les
réseaux opérateurs, le renvoi/répondeur et les solutions VoIP/SIP. Voici la réponse :

| Mécanisme demandé | Réalisable depuis une app ? | Pourquoi |
|---|---|---|
| Intervenir après la première tonalité sur un appel GSM entrant | **Non** | La tonalité entendue par l'appelant est générée **par le réseau**, pas par le téléphone appelé. Le combiné appelé n'a aucun accès au flux média amont |
| Injecter de l'audio vers l'appelant avant décrochage | **Non** | Idem : le chemin média pré-décrochage appartient au réseau |
| Interrompre la diffusion au décrochage | **Non** depuis l'app | Dépend de qui contrôle le média — donc du réseau ou d'une plateforme |
| Android : `CallScreeningService` / `InCallService` | **Non pertinent** | Permettent de filtrer, rejeter, ou afficher un appel entrant. **Aucun n'ouvre le canal audio vers l'appelant avant décrochage** |
| Android : répondre automatiquement puis jouer un son | **Non** | Répondre met fin à la sonnerie : le propriétaire ne peut plus « décrocher ». Et l'audio d'un appel GSM répondu reste hors de portée de l'app (modem/RIL) |
| iOS | **Non** | Aucune API n'existe, à aucun niveau |

> **Conclusion sur le §18 : le scénario cible de la spécification n'est réalisable par
> aucune application mobile, sur aucun système. Il requiert soit l'opérateur, soit une
> plateforme d'appel interposée.**

Le §24 de la spécification exige un prototype validant le scénario critique **avant**
l'investissement dans le développement complet. **C'est exactement la bonne démarche**, et
ce document indique quoi prototyper (§23.5).

---

## 23.3 L'architecture qui correspond nativement à cette spécification

La spécification Call Com décrit, terme pour terme, un service télécom existant : la
**tonalité de retour d'appel personnalisée** (RBT / CRBT — *Caller Ring Back Tone*),
appliquée à de la publicité.

Le principe du CRBT est de remplacer la tonalité réseau entendue par l'appelant par un
contenu audio choisi par l'abonné appelé, joué en boucle jusqu'au décrochage, au rejet ou
au renvoi. **C'est mot pour mot le §6 de la spécification.**

C'est donc **ALT-A** (§01) qui est l'architecture native de ce produit, et non un pis-aller.
Voir §23.6 pour la réponse à votre question sur l'accord opérateur.

---

## 23.4 Nouvelle architecture à considérer : ALT-F — renvoi d'appel + plateforme + bridge VoIP

L'inversion vers l'appel entrant ouvre une architecture qui n'existait pas dans le cas
sortant, et qui n'est **pas** dans mon analyse initiale. Elle mérite un examen sérieux car
c'est la seule qui approche le scénario cible **sans accord opérateur**.

### Fonctionnement

```
1. L'utilisateur active Call Com dans l'app.
   → l'app déclenche un RENVOI D'APPEL INCONDITIONNEL (CFU) de sa ligne
     vers le numéro de la plateforme Call Com, via un code MMI (**21*<numéro>#).

2. Un tiers appelle l'utilisateur.
   → le réseau renvoie immédiatement l'appel vers la plateforme.

3. La plateforme décroche et DIFFUSE LA PUBLICITÉ à l'appelant.

4. SIMULTANÉMENT, la plateforme envoie un push VoIP à l'application de
   l'utilisateur, qui fait sonner son téléphone en affichant le numéro
   de l'appelant d'origine (en-tête SIP Diversion / History-Info).

5. L'utilisateur décroche DANS L'APPLICATION.
   → la publicité s'arrête immédiatement
   → la plateforme ponte les deux jambes : appelant (RTC) ↔ utilisateur (VoIP)
   → conversation normale.

6. La plateforme détient le CDR exact : durée, créatif diffusé, décrochage ou non.
```

### Évaluation

| Critère | Verdict |
|---|---|
| Conformité au scénario du §6 de la spécification | **●●●●○** — très proche : pub pendant l'attente, arrêt au décrochage, conversation normale |
| L'appelant a-t-il besoin de l'app ? | **Non** ✅ |
| Fonctionne sur Android | ✅ `ConnectionService` auto-géré |
| **Fonctionne sur iOS** | ✅ **PushKit + CallKit est le chemin canonique et pleinement supporté** pour un appel VoIP entrant. Contrainte stricte : le push VoIP doit **immédiatement** déclencher `reportNewIncomingCall`, sinon Apple coupe le service |
| Mesure des diffusions | **●●●●●** — CDR de votre plateforme, non falsifiable |
| Accord opérateur obligatoire | **Non** pour le mécanisme… mais voir les blocages ci-dessous |
| Coût marginal | **Élevé** — voir blocage B3 |

### Les cinq blocages à lever, par ordre de gravité

**B1 — La conversation de l'utilisateur devient de la VoIP.** ⚠️ *Risque produit majeur*
Toutes ses conversations passent par sa data. Sur une couverture tunisienne inégale, la
qualité peut se dégrader, et **l'utilisateur attribuera cette dégradation à Call Com**. Le
principe « Non-perturbation » du §22 de la spécification est directement menacé — non pas
par une publicité pendant la conversation, mais par la qualité de la conversation
elle-même.

**B2 — Sans data, l'utilisateur ne reçoit plus ses appels.** ⚠️ *Potentiellement fatal*
Le renvoi inconditionnel est configuré dans le réseau. Si l'application n'a pas de data au
moment de l'appel, la plateforme ne peut pas la joindre : l'appel est perdu ou tombe sur un
répondeur. **« J'ai installé Call Com et je rate mes appels » tue un produit télécom
immédiatement.**
Atténuations, toutes imparfaites :
- désactiver le renvoi dès la perte de connectivité → exige une exécution en arrière-plan
  fiable, ce qui n'existe ni sur Android (restrictions d'arrière-plan) ni sur iOS ;
- rappeler l'utilisateur en RTC depuis la plateforme → sa ligne est renvoyée vers la
  plateforme, donc **boucle** ; et cette jambe serait payante ;
- utiliser le renvoi sur non-réponse (CFNRy) au lieu du renvoi inconditionnel → le
  téléphone sonne d'abord **sans publicité**, ce qui ne respecte plus le §6.

**C'est le blocage qui doit être testé en premier dans le prototype.**

**B3 — Qui paie la jambe de renvoi ?**
Dans la plupart des marchés, la jambe renvoyée est facturée à **l'abonné qui a posé le
renvoi** — donc à l'utilisateur, pour recevoir ses propres appels. Inacceptable sans un
arrangement avec l'opérateur (numéro spécial, gratuité du renvoi). **À vérifier auprès des
trois opérateurs tunisiens** : c'est un point tarifaire, pas technique.

**B4 — L'activation du renvoi est fragile.**
Il n'existe **pas d'API Android de renvoi d'appel**. Le seul chemin est l'envoi d'un code
MMI via une intention `ACTION_CALL` sur une URI `tel:`, ce qui revient à faire composer le
code par le système — et **l'opérateur doit l'autoriser**. Sur iOS, c'est encore plus
restreint. De plus l'utilisateur peut annuler le renvoi à tout moment sans que
l'application le sache.

**B5 — Numéros et réglementation.**
Il faut un numéro tunisien capable de recevoir de nombreux appels simultanés, et vous
opérez de fait une plateforme de traitement d'appels en Tunisie : **licence et visa INT à
qualifier**. La disponibilité de tels numéros reste un point non vérifié (§99, point 1).

### Verdict sur ALT-F

**Techniquement constructible, y compris sur iOS. Mais B2 est un risque produit de
premier ordre et B3 un risque économique.** ALT-F est un **candidat légitime pour le
prototype du §24**, à condition de tester B1, B2 et B3 avant tout développement de
plateforme. Ce n'est pas une architecture que je recommanderais de construire sans ce test.

---

## 23.5 Que prototyper — réponse au §24 de la spécification

Le §24 demande un prototype validant : *appel entrant → première tonalité → diffusion →
décrochage → arrêt immédiat → conversation normale*, testé sur plusieurs smartphones
Android et si possible plusieurs opérateurs.

**Ce prototype ne peut pas être réalisé en pur applicatif.** Voici ce qu'il faut
prototyper à la place, dans cet ordre :

### POC-1 — Établir l'impossibilité applicative (3 à 5 jours) — *à faire pour clore le sujet*
Démontrer et documenter, sur 4 à 6 modèles Android et 2 iPhones, que :
- `CallScreeningService` et `InCallService` n'ouvrent aucun canal audio vers l'appelant ;
- une réponse automatique met fin à la sonnerie et interdit le décrochage ultérieur ;
- aucune API ne permet d'injecter de l'audio dans un appel GSM.

**Livrable : une note de 2 pages avec captures et journaux.** Son objectif n'est pas
technique mais décisionnel : elle ferme définitivement la piste applicative et évite que
la question revienne dans six mois.

### POC-2 — ALT-F, test des blocages (2 à 3 semaines) — *le vrai prototype*
Avec un ITSP tunisien licencié ou un CPaaS disposant d'un numéro +216 :
1. Poser un renvoi inconditionnel sur une ligne de test vers un numéro de plateforme.
2. Appeler cette ligne depuis les trois opérateurs ; vérifier que la plateforme reçoit
   l'appel et que le numéro de l'appelant est transmis.
3. Jouer un créatif de 3 secondes à l'appelant.
4. Faire sonner l'application par push VoIP, décrocher dans l'app, ponter, mesurer le
   délai d'établissement et la qualité perçue.
5. **Mesurer B3 : relever qui est facturé pour la jambe de renvoi**, sur les trois
   opérateurs, factures à l'appui.
6. **Mesurer B2 : couper la data du téléphone et observer ce qui arrive à l'appel.**

**Critères de sortie :** délai avant que l'appelant entende la publicité < 2 s ; qualité
de conversation acceptable sur 3G ; **coût de la jambe de renvoi nul ou porté par
Call Com, jamais par l'utilisateur** ; comportement sans data documenté et acceptable.

### POC-3 — Faisabilité opérateur (non technique, à lancer à J0)
Voir §23.6.

---

## 23.6 Votre question : comment obtient-on l'accord opérateur, et fournissent-ils une API ?

Réponse directe : **non, il n'existe aucune API publique, et ce n'est pas une intégration
technique que l'on peut initier seul.** Voici la réalité de ce type de partenariat.

### Ce que possède réellement l'opérateur

Les trois opérateurs tunisiens exploitent très probablement déjà une **plateforme CRBT**,
fournie par un éditeur spécialisé — Comviva, 6D Technologies, OnMobile, Huawei ou ZTE sont
les acteurs habituels de ce marché. Comviva, par exemple, revendique plus de 35
déploiements dans le monde. Ce sont ces plateformes qui interceptent la tonalité réseau et
la remplacent par du contenu.

**Vous n'intégrez donc pas « l'opérateur ». Vous intégrez la plateforme CRBT de
l'opérateur**, et souvent avec l'éditeur de cette plateforme comme interlocuteur
technique réel.

### Le modèle contractuel habituel

Le schéma économique standard de ce marché est un **partage de revenus** : le fournisseur
VAS exploite la plateforme et la gestion des contenus, l'opérateur apporte sa base
d'abonnés et son intégration de facturation, et les revenus sont partagés selon une clé
convenue.

Transposé à Call Com, cela donne trois positionnements possibles, très différents :

| Positionnement | Ce que fait Call Com | Difficulté |
|---|---|---|
| **1. Fournisseur de contenu / régie publicitaire** sur la plateforme CRBT existante | Apporte les annonceurs et les créatifs ; l'opérateur diffuse et mesure | **La plus accessible.** Call Com devient une régie, pas un opérateur technique |
| **2. Partenaire VAS** exploitant un service CRBT publicitaire | Apporte la plateforme applicative, les unités, les récompenses ; s'intègre à la plateforme CRBT et à la facturation | Moyenne à élevée. C'est le modèle de la spécification |
| **3. MVNO ou opérateur de services** | Porte sa propre licence | Très élevée. Hors de portée d'un MVP |

**Le positionnement 1 est celui qu'il faut proposer en premier**, car il ne demande à
l'opérateur aucun développement : juste d'accepter un nouveau type de contenu et un
partage de revenus. C'est aussi celui où Call Com apporte ce que l'opérateur n'a pas —
**une base d'annonceurs locaux et une force commerciale**.

### À quoi ressemble l'interface technique, concrètement

Il ne faut pas s'attendre à une API REST auto-documentée. Selon la plateforme, on trouve
en pratique :

| Élément | Forme habituelle |
|---|---|
| Dépôt des créatifs | **SFTP ou portail web** de l'éditeur, avec un format audio imposé et une validation par l'opérateur |
| Règles de ciblage et d'affectation | Fichiers de configuration, ou interface d'administration de la plateforme CRBT |
| Association abonné ↔ contenu | Provisioning par l'opérateur, souvent par **fichiers batch** |
| Remontée des diffusions | **Fichiers CDR déposés périodiquement** (quotidien ou horaire), rarement une API temps réel |
| Réconciliation et facturation | Arrêté mensuel sur fichiers |
| API temps réel | **À ne pas présumer.** Certaines plateformes modernes en proposent une ; beaucoup de déploiements fonctionnent en batch |

**Implication d'architecture, importante pour vous :** votre système doit être conçu pour
**ingérer des fichiers CDR en différé**, pas pour recevoir des webhooks temps réel. C'est
précisément ce que permet l'abstraction `AdDeliveryChannel` (§04) : l'implémentation
opérateur devient un ingesteur de fichiers côté serveur, et le reste de la plateforme —
unités, ledger, récompenses, dashboard — n'est pas touché.

### Le processus réel, étape par étape

```
1. Identifier le bon interlocuteur : direction VAS / Marketing B2B / Innovation
   de chaque opérateur. Pas la direction technique — ce n'est pas un sujet technique
   à ce stade.
2. Présenter un dossier commercial : quel revenu nouveau pour l'opérateur,
   quelle base d'annonceurs, quel partage.
3. Accord de principe → NDA → l'opérateur désigne l'éditeur de sa plateforme CRBT
   comme interlocuteur technique.
4. Spécification d'interface avec l'éditeur : format des créatifs, provisioning,
   format et fréquence des CDR.
5. Validation réglementaire : l'opérateur porte généralement le dossier auprès
   de l'INT, car c'est son service.
6. Pilote sur un périmètre restreint, puis généralisation.

Délai réaliste : 6 à 18 mois, avec un risque de refus qui n'est pas négligeable.
```

### La conséquence à tirer pour votre mission

**La négociation opérateur est un travail commercial de Call Com, pas un travail technique
d'intégration que vous pourriez engager.** Votre rôle est de :
1. dire précisément ce qu'il faut demander à l'opérateur (une diffusion CRBT publicitaire
   et un flux de CDR) ;
2. concevoir la plateforme pour que cette intégration soit **additive** le jour où elle
   arrive ;
3. et surtout, **ne pas placer cette dépendance dans le chemin critique du
   développement.**

C'est exactement ce que fait l'abstraction du §04.

---

## 23.7 ⚠️ Risque business identifié — à valider par Call Com

*Cette section relève du ressort de Call Com. Elle est signalée ici parce qu'elle a une
incidence directe sur le dimensionnement technique (plafonds, barèmes, volumétrie), mais
l'arbitrage appartient au porteur du projet.*

### Précédents internationaux

Deux services ayant construit un modèle télécom financé par la publicité ont cessé leur
activité, **pour des raisons commerciales et non techniques** :

- **Blyk** (MVNO britannique, appels et SMS gratuits contre publicité) : le diagnostic
  public pointe un manque de **couverture** pour intéresser les annonceurs, une base restée
  dans les basses centaines de milliers, et des annonceurs davantage attirés par l'étude de
  marché que par la campagne de marque.
- **RingPlus** (États-Unis) : diffusait des publicités **après la numérotation et avant la
  connexion** pour financer des forfaits gratuits. Le service a réduit puis supprimé ses
  offres gratuites, et a fermé en 2017, faute d'avoir aligné suffisamment d'annonceurs sur
  ses zones de couverture.

**La viabilité de ce type de modèle dépend fortement de la capacité à vendre un volume
suffisant d'inventaire publicitaire local. Ce point doit être validé par Call Com auprès
d'annonceurs réels, avant l'investissement en développement.**

### Le barème du §8 de la spécification, chiffré

Le §8.4 de la spécification propose : 500 unités → 100 Mo ; 2 000 unités → 500 Mo ;
5 000 unités → 1 DT de crédit, avec 1 diffusion = 10 unités (§8).

En retenant une hypothèse de coût de gros de **3 millimes par Mo** (à confirmer par
Call Com auprès des opérateurs), et la contrainte usuelle « le coût des récompenses ne
dépasse pas 50 % du revenu publicitaire » :

| Palier du §8.4 | Coût par diffusion | **CPM minimum requis** |
|---|---|---|
| 500 unités → 100 Mo | 6,0 millimes | **12 TND** |
| 2 000 unités → 500 Mo | 7,5 millimes | **15 TND** |
| **5 000 unités → 1 DT de crédit** | **2,0 millimes** | **4 TND** |

Sur la base de 8 appels reçus par jour, soit 240 diffusions par mois :

| Palier | CPM 5 TND | CPM 12 TND | CPM 15 TND |
|---|---|---|---|
| 500 u → 100 Mo | −20 % | +50 % | +60 % |
| 2 000 u → 500 Mo | −50 % | +37 % | +50 % |
| 5 000 u → 1 DT crédit | **+60 %** | +83 % | +87 % |

**Trois observations à transmettre à Call Com :**

1. **Le barème de la spécification est nettement plus prudent que celui du brief
   initial.** Sur le brief initial (500 points → 3 Go), j'obtenais une marge de −767 % à
   un CPM de 5 TND. La spécification V1.0 est environ dix fois plus conservatrice, et
   devient viable dès un CPM de 12 TND sur les paliers data. C'est une correction à mon
   avantage précédent : **le barème du §8.4 est un point de départ défendable**, pas un
   problème.
2. **Le palier « crédit téléphonique » est 3 à 7 fois plus soutenable que les paliers
   data.** À 5 000 unités pour 1 DT, il reste rentable même à un CPM de 5 TND. Si le CPM
   réel s'avère bas, **privilégier le crédit et les minutes plutôt que la data** est le
   levier le plus simple. Le §8.3 prévoit déjà ces options : bonne anticipation.
3. **Le palier 2 000 u → 500 Mo est moins favorable que le palier 500 u → 100 Mo**
   (0,25 Mo par unité contre 0,20). C'est cohérent pour inciter à l'accumulation, mais cela
   augmente le coût : à surveiller si la majorité des utilisateurs converge vers ce palier.

**Le paramètre déterminant est le CPM réellement accepté par les annonceurs tunisiens.**
Il n'est pas vérifiable par la recherche documentaire et doit être établi par Call Com.
Le §12 de la spécification prévoit heureusement que tous ces paramètres soient
administrables depuis le Dashboard — c'est exactement la bonne décision, et mon schéma de
base de données l'implémente (`point_rules` versionné, `data_packages`).

---

## 23.8 Ce que la spécification apporte et qu'il faut conserver

La spécification est solide sur plusieurs points, et il serait dommage de les perdre :

| § | Élément | Appréciation |
|---|---|---|
| §18 | « La méthode technique n'est pas imposée » + étude de compatibilité exigée | **Excellent.** Le document ne présume pas de la solution, et demande l'analyse que fournit ce dossier |
| §24 | Prototype préalable obligatoire | **Excellent.** Aligne exactement avec ma recommandation de Phase 0 |
| §5.5, §22 | Désactivation possible par l'utilisateur, à tout moment | **À conserver absolument.** C'est aussi la mitigation du blocage B2 d'ALT-F |
| §12 | Tous les paramètres administrables (unités, plafonds, coûts) | **Excellent** — correspond au principe P5 du §04 (les barèmes sont des données) |
| §8.3 | Catalogue incluant crédit, minutes et SMS, pas seulement la data | **Très utile** — c'est le levier économique du §23.7 |
| §11 | Modèle de facturation configurable, arrêté ultérieurement | Prudent et juste |
| §13 | Anti-fraude et journal d'événements détaillé | Cohérent avec §13 de ce dossier |
| §15 | Architecture multilingue FR / AR / EN | À prévoir dès le départ, avec RTL |
| §6.3 | Comportement en cas de non-réponse explicitement posé comme dépendant de la solution retenue | Lucide |

### Écarts de périmètre à signaler à Call Com

| Point | Observation |
|---|---|
| §23 : « Application **Android** » | La spécification ne demande qu'Android en V1. **C'est un bon choix** et cela rejoint ma recommandation (§05). À confirmer explicitement, car l'inversion vers l'appel entrant rend iOS techniquement viable en ALT-F — le choix devient donc commercial, plus technique |
| §4 : consentement de l'appelant | Non traité — voir §23.1, conséquence 2 |
| §17 : « Système téléphonique » | Désigné comme un composant sans en préciser la nature. C'est le cœur du sujet : ce composant est soit l'opérateur, soit une plateforme d'appel, jamais l'application |
| §7 : formats audio | La spécification dit « notamment audio » sans imposer de format. En ALT-A, **le format sera imposé par la plateforme CRBT de l'opérateur** et non par vous. En ALT-F, Opus ou G.711 selon le codec de la jambe SIP |
| §6.1 : durée de 3 s paramétrable | En ALT-A, la durée sera contrainte par la fenêtre RBT de l'opérateur (typiquement 10 à 15 s disponibles) : 3 s est compatible |
| Absence de portail annonceur en V1 | Cohérent avec ma recommandation (§02) |

---

## 23.9 Synthèse : ce qui change dans le dossier

| Section du dossier | Impact de la spécification |
|---|---|
| **§01 Faisabilité** | Conclusion **inchangée et renforcée**. ALT-D ne s'applique plus. **ALT-F ajoutée** |
| **§02 Analyse fonctionnelle** | Le workflow W2 doit être réécrit en appel entrant. Les acteurs gagnent un quatrième rôle non consentant : **l'appelant** |
| §03 User journeys | UJ2 et UJ3 à réécrire ; l'activation devient « poser un renvoi d'appel » ou « souscrire au service opérateur » |
| §04 Architecture technique | **Inchangée.** `AdDeliveryChannel` absorbe ALT-A et ALT-F. L'ingestion de CDR par fichiers s'ajoute |
| §05 Architecture mobile | **Simplifiée.** L'app ne mesure plus rien. Un client VoIP (CallKit / ConnectionService) devient nécessaire en ALT-F |
| §06 Backend | **Inchangée**, plus un ingesteur de fichiers CDR |
| §07 Base de données | **Quasi inchangée.** `calls` gagne `direction` et `caller_hash`; `advertisement_impressions` reste identique |
| §08 Moteur de sélection | **Inchangé** en logique. Bascule serveur en ALT-A/ALT-F : plus de sélection embarquée |
| §09 Audio | Format imposé par l'opérateur en ALT-A. Le cache local n'a plus lieu d'être |
| **§10 Offline** | **Largement caduque, et c'est une bonne nouvelle.** La mesure devient serveur : plus de file locale signée, plus de conflits, plus de fraude sur événements offline |
| §11 Récompenses | **Inchangée.** Barème du §8.4 de la spécification à retenir, avec l'arbitrage du §23.7 |
| §12 Sécurité / INPDP | **Inchangée**, plus une question nouvelle : le traitement du numéro de **l'appelant** |
| **§13 Anti-fraude** | **Fortement simplifiée.** Les CDR serveur ne sont pas falsifiables. Restent le multi-compte et les appels artificiels |
| §14 Back-office | **Inchangée.** Correspond bien au §10 de la spécification |
| §15 Scalabilité | À revoir : la volumétrie dépend des appels reçus, non de l'usage de l'app |
| §16 Coûts | **Barème recalculé** sur les valeurs de la spécification (§23.7) |
| §19 Roadmap | Phase 0 remplacée par POC-1 / POC-2 / POC-3 (§23.5) |
| §20 Risques | R6 (fraude offline) **fortement atténué**. Nouveaux risques : **B2 appels manqués**, **B1 qualité VoIP**, consentement de l'appelant |

**En une phrase : la spécification ne remet pas en cause le diagnostic de faisabilité, elle
le durcit sur le mécanisme et le simplifie considérablement sur tout le reste.**
