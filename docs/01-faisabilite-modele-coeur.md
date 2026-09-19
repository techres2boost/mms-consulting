# 01 — Feasibility of the core business model

> **Statut : BLOQUANT.** Cette section conditionne tout le reste du dossier.
> Elle doit être lue avant les sections d'architecture.

---

## 1.1 La question posée

> Peut-on réellement faire : un client appelle un numéro GSM classique → premier bip →
> publicité audio 3-4 s → publicité répétée jusqu'au décroché → puis conversation normale,
> avec une simple application Capacitor sur Android/iOS ?

## 1.2 Réponse

**Non. Ni avec Capacitor, ni avec React Native, ni avec Flutter, ni avec du natif pur.
Le choix du framework mobile n'est pas le facteur limitant — c'est le système
d'exploitation et l'architecture du réseau GSM.**

Il faut décomposer la réponse, car il y a **trois impossibilités distinctes** et elles
n'ont pas la même cause.

### Impossibilité n°1 — Injecter de l'audio dans le canal voix d'un appel GSM

Sur un appel CS (*circuit-switched*, l'appel « téléphonique classique »), le chemin audio
n'appartient pas à Android ni à iOS : il appartient au **modem baseband** et au firmware
propriétaire du vendeur (RIL). L'audio ne transite pas par la pile média de l'OS.

- **Android** : la documentation Android est explicite depuis les toutes premières
  versions et la limitation tient toujours en 2026 : *« You can playback the audio data
  only to the standard output device. Currently, that is the mobile device speaker or a
  Bluetooth headset. You cannot play sound files in the conversation audio during a
  call. »* Même si Google ouvrait toutes ses API demain, le RIL du vendeur continuerait à
  garder l'accès au modem. Les contournements connus (propriétés système du type
  `voice.playback.conc.disabled`, modules Xposed) exigent un accès système / root et sont
  hors de portée d'une app du Play Store.
- **iOS** : `AVAudioSession` ne peut pas être activée pendant un appel cellulaire.
  Les tentatives renvoient `AVAudioSessionErrorInsufficientPriority` : la session audio
  utilisée par la téléphonie est d'une catégorie système à priorité d'interruption
  supérieure à `PlayAndRecord`, et une app ne peut pas se l'attribuer. C'est une décision
  de design, pas un bug.

### Impossibilité n°2 — Occuper la fenêtre « avant décroché »

C'est la plus structurante et elle est **indépendante de l'OS**.

Ce que l'appelant entend entre la numérotation et le décroché est la **tonalité de retour
d'appel (ringback tone)**. Elle est générée **par le réseau** — réseau d'origine ou réseau
terminant, selon la signalisation — et transmise à l'appelant en aval. Le combiné ne fait
que restituer un flux qu'il reçoit. Il n'existe aucun point d'accroche applicatif dans
cette fenêtre.

Conséquence directe : **le comportement souhaité (bip → pub → pub répétée jusqu'au
décroché) est, par construction, un service réseau, pas un service applicatif.** C'est
exactement ce que l'industrie appelle le **RBT advertising** (*Ringback Tone
Advertising*) : la plateforme RBT de l'opérateur intercepte la tonalité générée par le
réseau et la remplace par du contenu audio joué en boucle jusqu'au décroché, au rejet ou
au renvoi vers la messagerie. C'est une inventaire publicitaire de 10 à 15 secondes que
**l'opérateur** possède et monétise.

Autrement dit : votre spécification métier §2 décrit un produit qui existe, qui est
déployé commercialement depuis ~2008 (Turkcell, RingPlus…), **et qui vit dans le cœur de
réseau de l'opérateur.**

### Impossibilité n°3 (souvent oubliée) — Mesurer l'appel sur iOS

Même en renonçant à la diffusion pendant l'appel, votre modèle de points suppose de
compter les appels et les minutes. Or :

- **iOS : impossible.** CallKit / `CXCallObserver` ne remonte **que** les appels VoIP gérés
  par votre propre application. Il ne voit pas les appels GSM natifs, pour des raisons de
  confidentialité. `CTCallCenter` (l'ancienne API qui le permettait) est dépréciée et
  non fonctionnelle depuis longtemps. De plus `CXCallObserver` ne reçoit aucune mise à
  jour quand l'application est en arrière-plan. Il n'existe **aucun** chemin App
  Store-conforme pour connaître le nombre ou la durée des appels GSM d'un utilisateur iOS.
- **Android : partiellement possible, sous contrainte de politique Play.** L'état d'appel
  est lisible (`READ_PHONE_STATE` + `TelephonyCallback` / `PhoneStateListener`) : on sait
  qu'un appel sortant a démarré et quand il s'est terminé, donc on peut dériver une durée.
  Mais dès qu'on veut le **numéro appelé** ou le **journal d'appels**, on entre dans le
  groupe de permissions restreint *Call Log*, et la politique Google Play exige que
  l'application soit **le gestionnaire téléphonique par défaut de l'utilisateur**
  (ou relève d'une exception), avec usage limité à une fonctionnalité cœur sans laquelle
  l'app est inutilisable. Un « app de points publicitaires » ne passe pas cette barre
  sans devenir un vrai dialer.

> **Conclusion n°1 : le produit décrit au §2 ne peut pas être construit comme une
> application mobile. Il peut être construit soit dans le réseau de l'opérateur, soit en
> réacheminant l'appel à travers votre propre plateforme média.**

> **Conclusion n°2 : la parité Android/iOS est structurellement impossible sur ce
> mécanisme.** Toute architecture « côté terminal » sera Android-only ou fortement
> dégradée sur iOS. C'est une contrainte produit, pas un détail d'implémentation.

---

## 1.3 Ce qui *est* possible depuis une application mobile (récapitulatif honnête)

| Capacité | Android | iOS | Notes |
|---|---|---|---|
| Jouer un audio **avant** de lancer l'appel, dans l'app | ✅ | ✅ | Le cœur de ALT-D |
| Lancer un appel natif via `tel:` | ✅ | ✅ | iOS affiche une confirmation système |
| Lancer un appel natif sans confirmation | ✅ (`CALL_PHONE`) | ❌ | |
| Détecter le démarrage/fin d'un appel GSM | ✅ (`READ_PHONE_STATE`) | ❌ | iOS : aucun chemin conforme |
| Connaître le numéro appelé | ⚠️ Call Log / default dialer | ❌ | Politique Play restrictive |
| Retarder ou rediriger un appel sortant | ✅ `CallRedirectionService` (API 29+) | ❌ | Nécessite le rôle par défaut |
| Jouer un audio **pendant** un appel GSM, entendu par l'appelant | ❌ | ❌ | Modem / RIL |
| Jouer un audio **pendant** un appel GSM, entendu par le correspondant | ❌ | ❌ | Impossible partout |
| Remplacer la tonalité de retour d'appel | ❌ | ❌ | Fonction réseau |
| Contrôler totalement l'audio d'un appel **VoIP de votre app** | ✅ | ✅ (CallKit) | Le cœur de ALT-C |

---

## 1.4 Architectures alternatives

Cinq architectures sont analysées. **Elles sont présentées par caractéristiques
techniques, sans ordre de préférence.** La grille de synthèse est en §1.5.

---

### ALT-A — Insertion publicitaire côté opérateur (plateforme RBT / VAS)

**Fonctionnement**
Vous ne touchez pas à l'appel. Vous devenez fournisseur de contenu / régie sur la
plateforme RBT (ou l'IN / le SDP) de Tunisie Telecom, Orange Tunisie ou Ooredoo Tunisie.
L'opérateur active, pour les abonnés opt-in, le remplacement de la tonalité de retour par
un créatif servi depuis votre plateforme. Votre système fournit : le catalogue de
créatifs, les règles de ciblage, et reçoit en retour les CDR/logs d'exposition
(fichiers batch ou API) qui alimentent votre ledger de points.

**Expérience utilisateur** — Exactement celle du §2, sans compromis : bip, pub, répétition
jusqu'au décroché, arrêt net au décroché, conversation normale. Aucune app requise pour
le mécanisme publicitaire. L'app mobile ne sert plus qu'au portefeuille de points, au
consentement et aux conversions.

**Android / iOS** — Indifférent. Fonctionne aussi sur téléphones basiques (feature
phones), ce qui est un avantage réel sur le marché tunisien.

**Opérateur nécessaire** — Oui, c'est l'essence de l'architecture. Contrat commercial +
intégration technique VAS + probable visa réglementaire (INT). L'opérateur possède
l'inventaire et voudra l'essentiel du partage de revenus.

**Coût** — Coût technique faible côté plateforme (vous construisez un ad server + un
wallet, pas de la téléphonie). Coût commercial et temporel élevé : 6 à 18 mois de cycle de
négociation est une hypothèse réaliste, avec un risque de refus total.

**Complexité** — Technique : moyenne. Organisationnelle : très élevée.

**Avantages** — Fidélité UX parfaite ; volume d'inventaire immédiat (toute la base de
l'opérateur) ; mesure d'exposition fiable et non falsifiable côté client (les CDR
viennent du réseau) ; **l'anti-fraude devient un quasi non-problème** ; pas de coût de
minutes.

**Inconvénients** — Vous ne contrôlez pas votre destin : dépendance à un partenaire qui
peut internaliser le produit à tout moment ; lead time incompatible avec un MVP ;
partage de revenus défavorable ; intégration par batchs de fichiers plutôt qu'API
temps réel dans beaucoup de déploiements.

**Faisabilité MVP** — **Nulle en tant que MVP technique, maximale en tant qu'objectif
cible.** À lancer comme piste commerciale *en parallèle* du MVP, jamais comme
prérequis de développement.

---

### ALT-B — Bridge d'appel via numéro de service (CPaaS ou ITSP local)

**Fonctionnement**
1. L'utilisateur compose (ou l'app compose pour lui) le numéro de la plateforme.
2. La plateforme identifie l'appelant par son CLI (numéro présenté).
3. Elle joue le créatif publicitaire (contrôle média total : vous êtes la source).
4. Elle demande le numéro du correspondant (DTMF, ou le récupère d'une session
   pré-établie par l'app en data), puis compose la seconde jambe.
5. Elle *bridge* les deux jambes et mesure la durée exacte.

Variante « click-to-call » : l'app envoie le numéro B en HTTPS, la plateforme rappelle
l'utilisateur (jambe A sortante), joue la pub, puis appelle B. Plus propre en UX, mais
nécessite de la data au moment de l'appel — ce qui contredit l'exigence offline du §7.

**Expérience utilisateur** — Dégradée mais cohérente. L'appelant entend la pub *avant* la
sonnerie du correspondant, pas pendant. La répétition « jusqu'au décroché » devient
possible (vous contrôlez le média pendant que la jambe B sonne) — c'est la seule
alternative qui restitue ce détail. Deux ruptures majeures : le correspondant voit
**le numéro de la plateforme**, pas celui de son contact (la substitution de CLI vers un
numéro tunisien qui ne vous appartient pas est généralement interdite et techniquement
bloquée) ; et la latence d'établissement double.

**Android / iOS** — Fonctionne identiquement sur les deux, y compris sur feature phones en
variante DTMF. **C'est la seule alternative offrant une vraie parité iOS.**

**Opérateur nécessaire** — Oui, sous une forme ou une autre. Il faut des numéros
tunisiens (+216) et une terminaison d'appel vers les mobiles tunisiens. Point de
vigilance réglementaire majeur : la terminaison d'appels VoIP vers le RTC tunisien est
une activité licenciée ; le régulateur est l'**INT** (Instance Nationale des
Télécommunications, créée par le Code des télécommunications de 2001). Les trois
opérateurs ont par ailleurs un historique de restriction de la VoIP grand public,
motivé par l'érosion de leurs revenus voix. **Faire du bridge d'appel sans accord local
revient à faire de la terminaison grise : à proscrire.**

**Coût** — **C'est le point qui tue ce modèle.** Vous payez deux jambes d'appel par
conversation, alors que votre modèle économique consiste à *donner* des avantages à
l'utilisateur. Un appel de 3 minutes bridgé = ~6 minutes facturées à un tarif de
terminaison mobile tunisien. Vous financez la communication **et** la récompense **et**
l'infrastructure, avec pour seule recette un CPM local. L'économie unitaire est
négative par construction, sauf si vous vendez aussi la minute (vous devenez alors un
opérateur / revendeur, autre métier, autre licence).

**Complexité** — Technique : élevée (SIP, media server, gestion d'échec de jambe B,
qualité, DTMF). Réglementaire : très élevée.

**Avantages** — Contrôle média total ; mesure de durée exacte et non falsifiable ;
parité Android/iOS ; fonctionne sans data au moment de l'appel (variante DTMF) ;
anti-fraude solide (les CDR sont les vôtres).

**Inconvénients** — Économie unitaire négative ; CLI du correspondant cassé ; exposition
réglementaire ; dépendance à la disponibilité de numéros +216 chez un CPaaS.

**Point de vérification ouvert** — *Je ne peux pas confirmer par source publique que
Twilio, Telnyx, Vonage ou Infobip commercialisent aujourd'hui des numéros
géographiques ou mobiles tunisiens avec capacité voix entrante et terminaison locale.*
Twilio publie des guides réglementaires et une page de tarification voix pour la Tunisie,
Telnyx affiche une page « Tunisia virtual phone numbers », mais ces pages sont
commerciales et l'inventaire réel varie. **À vérifier directement auprès des
fournisseurs avant tout engagement d'architecture**, avec ces questions précises :
numéros +216 disponibles ? capacité *voice inbound* ? terminaison vers mobiles TN ?
justificatifs de présence locale exigés ? passthrough de CLI autorisé ? Prévoir en
parallèle une consultation d'un ITSP tunisien licencié, qui est probablement la seule
voie légale propre.

---

### ALT-C — Appels VoIP intégrés à l'application

**Fonctionnement**
Vous ne touchez plus au GSM du tout. L'application embarque sa propre pile d'appel
(WebRTC / SIP). Appels app→app gratuits ; appels app→RTC via un *trunk* sortant payant.
Vous possédez la totalité du chemin média : la publicité de 4 s, sa répétition pendant la
sonnerie, son arrêt au décroché, la mesure à la milliseconde — tout devient trivial.

**Expérience utilisateur** — Excellente *sur le mécanisme*, mais suppose un changement
d'habitude : l'utilisateur doit appeler depuis votre app, et le correspondant doit avoir
l'app (sinon on retombe sur le coût de terminaison de ALT-B). Sur iOS, CallKit permet une
intégration système de qualité (écran d'appel natif, historique, Ne pas déranger).

**Android / iOS** — Bonne parité. iOS : CallKit + PushKit (VoIP push). Android :
`ConnectionService` auto-géré + service au premier plan. Attention : sur iOS, le VoIP push
doit réellement aboutir à un appel CallKit, sinon Apple sanctionne.

**Opérateur nécessaire** — Non pour l'app→app. Oui pour l'app→RTC.

**Coût** — Infrastructure média (SFU/TURN) + bande passante. Modéré et maîtrisable en
app→app. Les mêmes problèmes que ALT-B réapparaissent dès qu'on sort vers le RTC.

**Complexité** — Élevée : NAT traversal, TURN, qualité sur réseaux mobiles tunisiens,
batterie, push VoIP, conformité stores.

**Avantages** — Contrôle total, mesure parfaite, anti-fraude fort, pas de dépendance
opérateur en app→app, extensible (vidéo, messagerie).

**Inconvénients** — **Contredit frontalement l'exigence offline du §7** : sans Internet,
pas d'appel du tout. Effet de réseau à amorcer (l'app ne sert à rien tant que vos contacts
ne l'ont pas). Concurrence directe avec WhatsApp, qui est la référence d'usage. Historique
de restriction de la VoIP par les opérateurs tunisiens = risque de dégradation ou de
blocage.

**Faisabilité MVP** — Moyenne techniquement, faible stratégiquement (le produit devient
« encore une app d'appel gratuit »).

---

### ALT-D — Publicité interstitielle avant l'appel (« ad-then-dial »)

**Fonctionnement**
L'utilisateur lance l'appel **depuis votre application**. L'app affiche un écran
« connexion en cours », joue le créatif de 4 s localement (fichier déjà téléchargé,
donc fonctionne hors ligne), puis déclenche l'appel natif via `tel:`. L'utilisateur
raccroche et revient dans l'app, qui enregistre l'événement.

**Expérience utilisateur** — La plus éloignée du §2 : la pub est **avant** l'appel, pas
pendant la sonnerie ; elle n'est pas répétée jusqu'au décroché ; le correspondant ne
l'entend pas. En revanche elle est *honnête* : l'utilisateur comprend le deal
(« j'écoute 4 s, je gagne des points »). Ajoute ~4 s à chaque appel — frottement réel
qu'il faut mesurer en test utilisateur, et probablement plafonner (1 pub toutes les N
minutes, pas à chaque appel).

**Android / iOS** — Le mécanisme de diffusion fonctionne **identiquement** sur les deux.
C'est la seule alternative entièrement réalisable **dès aujourd'hui, avec Capacitor**.
Asymétrie sur la *mesure* : Android confirme que l'appel a eu lieu et sa durée
(`READ_PHONE_STATE`) ; iOS ne confirme rien — on ne sait que « l'utilisateur a appuyé sur
appeler ». D'où une règle produit centrale : **créditer sur l'impression publicitaire
écoutée, pas sur la minute d'appel** (voir §11).

**Opérateur nécessaire** — Non. Aucun. Aucune exposition réglementaire télécom.

**Coût** — Quasi nul en marginal. Pas de minutes, pas de média serveur. Créatif de 4 s en
Opus 32 kbps ≈ **16 Ko** : le catalogue entier tient dans le cache local.

**Complexité** — Faible. Un plugin natif Android maison pour l'état d'appel, sinon du
Capacitor standard.

**Avantages** — Livrable en quelques semaines ; coût marginal nul ; 100 % offline-capable
(le fichier est local) ; aucun risque réglementaire télécom ; valide toute la moitié
« plateforme » du produit (ad server, ciblage, ledger, back-office, conversions) qui
représente ~80 % du travail et est **commune à toutes les alternatives**.

**Inconvénients** — UX non conforme à la vision ; friction ajoutée ; valeur publicitaire
plus faible (une pub qu'on écoute en attendant de composer vaut moins qu'une pub captive
pendant la sonnerie) ; contournable (l'utilisateur peut appeler depuis le dialer
natif — il faut donc que passer par l'app soit *récompensé*, pas *obligatoire*) ; mesure
faible sur iOS.

**Faisabilité MVP** — **Maximale.** C'est le seul candidat crédible pour la Phase 1.

---

### ALT-E — Android « default dialer » + redirection d'appel

**Fonctionnement**
L'application demande le rôle de **gestionnaire téléphonique par défaut**
(`RoleManager.ROLE_DIALER`). Elle implémente `CallRedirectionService` (API 29+), qui
permet d'intercepter et de **retarder** un appel sortant, et `InCallService` pour
l'interface d'appel. Pendant la fenêtre de redirection, l'app joue la publicité
localement sur l'écouteur, puis laisse l'appel se poursuivre. Du point de vue de
l'utilisateur, l'expérience se rapproche du §2 : il compose depuis son dialer habituel
(qui est le vôtre), entend la pub, puis la sonnerie.

**Expérience utilisateur** — La plus proche de la vision parmi les options « côté
terminal ». Mais : la pub reste **avant** la sonnerie et non pendant, et la répétition
jusqu'au décroché reste impossible (dès que l'appel GSM part, vous perdez l'audio).

**Android / iOS** — **Android uniquement. Aucun équivalent iOS, à aucun niveau.** Cela
signifie deux produits différents, ou un produit Android avec un iOS dégradé en ALT-D.

**Opérateur nécessaire** — Non.

**Coût** — Nul en marginal, mais coût de développement natif Android significatif
(un dialer complet : composition, journal, contacts, appels entrants, accessibilité,
appels d'urgence — les appels d'urgence sont un sujet de conformité sérieux).

**Complexité** — **Élevée et sous-estimée.** Remplacer le dialer système, c'est reprendre
la responsabilité de fonctionnalités critiques. Plus : la revue Google Play pour le rôle
de dialer par défaut et les permissions Call Log est stricte — la politique exige que la
permission serve une fonctionnalité cœur « sans laquelle l'app est cassée ». Un dialer
avec pub a un argumentaire recevable, mais le risque de rejet est réel et **non
maîtrisable par vous**.

**Avantages** — UX la plus fidèle sans opérateur ; mesure d'appel exacte sur Android
(durée, numéro, succès/échec) ; anti-fraude renforcé (vous voyez le vrai appel) ;
capte *tous* les appels de l'utilisateur, pas seulement ceux passés par votre app — ce qui
multiplie l'inventaire publicitaire.

**Inconvénients** — Android-only ; dépendance à la politique Play ; taux d'adoption faible
(demander à quelqu'un de changer son application Téléphone est une demande forte) ;
surface de responsabilité critique (appels d'urgence) ; effort natif important, hors de
portée de Capacitor seul.

**Faisabilité MVP** — Faible pour un MVP. Candidat crédible en **Phase 2 sur Android**,
comme montée en gamme de ALT-D.

---

## 1.5 Grille de synthèse

| Critère | ALT-A Opérateur RBT | ALT-B Bridge CPaaS | ALT-C VoIP in-app | ALT-D Ad-then-dial | ALT-E Android dialer |
|---|---|---|---|---|---|
| Conformité à l'UX du §2 | ●●●●● | ●●●○○ | ●●●●○ | ●○○○○ | ●●○○○ |
| Pub pendant la sonnerie | ✅ | ✅ | ✅ | ❌ | ❌ |
| Pub répétée jusqu'au décroché | ✅ | ✅ | ✅ | ❌ | ❌ |
| Fonctionne sur Android | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fonctionne sur iOS | ✅ | ✅ | ✅ | ✅ | ❌ |
| Fonctionne sur feature phone | ✅ | ✅ (DTMF) | ❌ | ❌ | ❌ |
| Fonctionne sans Internet | ✅ | ✅ (DTMF) | ❌ | ✅ | ✅ |
| Réalisable avec Capacitor | n/a | ✅ | ❌ | ✅ | ❌ |
| Accord opérateur requis | **Obligatoire** | Requis (terminaison) | Non (app→app) | **Non** | **Non** |
| Exposition réglementaire INT | Encadrée par l'opérateur | **Élevée** | Moyenne | **Nulle** | Nulle |
| Coût marginal par appel | ~0 | **Élevé (2 jambes)** | Faible→élevé | **~0** | ~0 |
| Mesure de l'appel (fiabilité) | ●●●●● (CDR réseau) | ●●●●● (CDR propres) | ●●●●● | ●●○○○ (iOS ●○○○○) | ●●●●○ (Android) |
| Résistance à la fraude | ●●●●● | ●●●●● | ●●●●● | ●●○○○ | ●●●○○ |
| Complexité technique | ●●○○○ | ●●●●○ | ●●●●● | ●○○○○ | ●●●●○ |
| Complexité organisationnelle | ●●●●● | ●●●●○ | ●●○○○ | ●○○○○ | ●●●○○ |
| Délai avant première mise en prod | 6–18 mois | 3–6 mois | 3–5 mois | **4–8 semaines** | 3–5 mois |
| Faisabilité MVP | ○○○○○ | ●●○○○ | ●●○○○ | ●●●●● | ●●○○○ |

---

## 1.6 Recommandation de séquencement

La conclusion n'est pas « choisissez une alternative » mais **« découplez le mécanisme
d'appel du reste du produit »**.

Constat clé : le mécanisme de diffusion est ~15–20 % du travail. Les 80 % restants —
ad server, ciblage géographique, ledger de points, back-office, conversions data,
anti-fraude, sync offline — sont **strictement identiques dans les cinq
alternatives**. Il est donc économiquement absurde de bloquer la plateforme en attendant
de résoudre le mécanisme d'appel.

**Séquence recommandée**

1. **Phase 0 (2–4 semaines, bloquante pour le *choix*, pas pour le *développement*)**
   POC technique sur devices réels : ALT-D de bout en bout + spike de faisabilité ALT-E
   sur Android. Objectif : mesurer la friction réelle des 4 s et la fiabilité de la
   détection d'appel Android. Voir §19 pour les critères de sortie.
2. **En parallèle, dès J0 : ouvrir la piste ALT-A.** Contact commercial avec les trois
   opérateurs et l'INT. C'est un processus long dont le résultat n'est pas sous votre
   contrôle : il doit démarrer immédiatement et ne doit bloquer personne.
3. **Phase 1 — MVP sur ALT-D.** Construire la plateforme complète derrière une
   **abstraction de diffusion** (`AdDeliveryChannel`) qui isole totalement le mécanisme.
4. **Phase 2 — ALT-E sur Android** si le POC est concluant et la politique Play favorable.
5. **Phase 3 — bascule vers ALT-A** si et seulement si un accord opérateur aboutit.
   L'abstraction de la Phase 1 rend cette bascule additive, non destructive.
6. **ALT-B et ALT-C : à écarter** pour ce produit, pour des raisons d'économie unitaire
   (ALT-B) et de contradiction avec l'exigence offline (ALT-C). À reconsidérer seulement
   si le modèle économique change (revente de minutes).

---

## 1.7 Précédents de marché — à lire avant d'investir

Le modèle « télécom financé par la publicité » a un historique d'échecs documentés, et
ces échecs ne sont **pas** techniques :

- **Blyk** (MVNO britannique, appels et SMS gratuits contre publicité ciblée, cible
  16–24 ans) a arrêté son activité MVNO. Le diagnostic public : le modèle manquait de la
  **couverture** que recherchent les annonceurs ; la base est restée dans les basses
  centaines de milliers d'abonnés, et Blyk a lui-même reconnu que les annonceurs
  s'intéressaient davantage au service pour de l'**étude de marché** que pour de la
  campagne de marque.
- **RingPlus** (États-Unis) a construit exactement votre mécanisme — des publicités
  écoutées après la numérotation et avant la connexion, finançant des forfaits gratuits.
  Le service a réduit puis supprimé ses offres gratuites et a fermé en 2017, faute
  d'avoir pu aligner assez d'annonceurs sur ses zones de couverture.

**Lecture pour votre projet :** le risque n°1 n'est pas « est-ce que je peux jouer un son
pendant un appel ». C'est **« est-ce que je peux vendre 300 à 1 200 impressions audio par
utilisateur et par mois, à un CPM qui couvre le coût des Go que je distribue »**.
L'analyse d'économie unitaire du §16 montre que cette marge est mince. Elle doit être
testée avec de vrais annonceurs tunisiens **avant** la Phase 1, pas après.

---

## 1.8 Sources

- [Using an Android Phone as a GSM Gateway for VoIP: What's Actually Possible in 2026 — ICT Innovations](https://ictinnovations.com/using-android-phone-as-gsm-gateway/)
- [Apple Developer Forums — CallKit audio session / `AVAudioSessionErrorInsufficientPriority`](https://developer.apple.com/forums/thread/69874)
- [Apple Developer Forums — CallKit: Call Detection (appels GSM non détectables)](https://developer.apple.com/forums/thread/73836)
- [`CXCallObserver` — Apple Developer Documentation](https://developer.apple.com/documentation/callkit/cxcallobserver)
- [Apple Developer Forums — CXCallObserver en arrière-plan](https://developer.apple.com/forums/thread/680436)
- [Ringback tone advertising — HandWiki](https://handwiki.org/wiki/Engineering:Ringback_tone_advertising)
- [Ring Back Tones (RBT): The MVNO Guide to Caller Tunes — MVNO Index](https://mvno-index.com/ring-back-tones-rbt/)
- [Telecom framework overview — Android Developers](https://developer.android.com/develop/connectivity/telecom)
- [`CallRedirectionService` — Android Developers](https://developer.android.com/reference/android/telecom/CallRedirectionService)
- [Use of SMS or Call Log permission groups — Google Play Console Help](https://support.google.com/googleplay/android-developer/answer/10208820?hl=en)
- [Permissions used only in default handlers — Android Developers](https://developer.android.com/guide/topics/permissions/default-handlers)
- [Telecommunications in Tunisia — Wikipedia](https://en.wikipedia.org/wiki/Telecommunications_in_Tunisia)
- [Tunisian Telcos' plan to take the internet hostage — Access Now (restrictions VoIP)](https://www.accessnow.org/tunisian-telcos-plan-to-take-the-internet-hostage/)
- [Blyk ad-funded MVNO model fails — Telecoms.com](https://www.telecoms.com/mvnos/blyk-ad-funded-mvno-model-fails)
- [RingPlus severely curtails free mobile plan offerings — Clark.com](https://clark.com/technology/ringplus-curtails-free-mobile-plan/)
