# 27 — Alternatives sans opérateur

**Étude de faisabilité** · 24 septembre 2026
Objet : ce que Call Com peut construire **sans dépendre d'Orange**, en gardant la main sur
la technique et le calendrier.

---

## Résumé

| | Faisable ? | Android | iOS | Opérateur requis | Délai POC |
|---|---|---|---|---|---|
| **Alt. 1 — Pub puis appel** (votre proposition) | **✅ Oui** | ✅ 100 % automatique | ⚠️ 1 tap de confirmation en plus | **Non** | **2-3 semaines** |
| **Alt. 2 — Appel VoIP dans l'application** | ✅ Oui | ✅ | ✅ | Non | 4-6 semaines |
| **Alt. 3 — Hybride (VoIP si possible, sinon Alt. 1)** | ✅ Oui | ✅ | ✅ | Non | Alt. 1 puis +4 semaines |
| **Alt. 4 — Écoute rémunérée, sans appel** | ✅ Oui | ✅ | ✅ | Non | 1-2 semaines |

**Votre alternative 1 est faisable**, et votre compréhension est exacte : la publicité joue
*dans l'application*, *avant* l'appel ; dès que l'appel démarre, on n'a plus la main.

Une seule vraie limite technique : **sur iPhone, l'appel ne peut pas démarrer tout seul.**
iOS affiche obligatoirement une fenêtre « Appeler ce numéro ? » — l'utilisateur doit taper
une fois. C'est une règle d'Apple, sans contournement possible.

**Recommandation : démarrer par l'alternative 1, construire vers l'alternative 3.** Détail
en fin de document.

---

# PARTIE 1 — Alternative 1 : étude de faisabilité

## 1.1 Le parcours, étape par étape

Votre description, découpée et vérifiée étape par étape :

| # | Étape | Faisable ? | Commentaire |
|---|---|---|---|
| 1 | L'utilisateur ouvre l'application | ✅ | — |
| 2 | Il voit **la même liste de contacts** que dans son téléphone | ✅ **sous condition** | Nouvelle règle Google Play 2026 — voir §1.4-A |
| 3 | Il clique sur un contact | ✅ | — |
| 4 | **Une publicité de 3 s se lance automatiquement** | ✅ | Lecture audio locale, dans l'application. Aucune restriction |
| 5 | La pub se termine | ✅ | — |
| 6 | **L'appel démarre automatiquement** | ✅ Android · ⚠️ iOS | Android : automatique. iOS : 1 tap obligatoire — §1.3 |
| 7 | Bip, sonnerie, conversation normale | ✅ | C'est l'appel téléphonique classique du téléphone |
| 8 | Plus de publicité possible | ✅ **exact** | L'appel est passé au réseau : l'application n'a plus accès au son |

> **Verdict : faisable.** Aucune étape ne dépend d'un opérateur, d'une autorisation
> réseau ou d'une technologie non disponible.

Et votre point 8 est **exactement juste** : une fois l'appel lancé, le son appartient au
téléphone et au réseau, plus à l'application. C'est la frontière qu'on a établie dans
toute l'étude — et vous l'avez bien placée.

## 1.2 Ce que l'utilisateur voit

```
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│  Call Com       ⚙   │   │                     │   │                     │
│  128 points         │   │   Appel vers        │   │   Appel en cours    │
│  ─────────────────  │   │   Sami B.           │   │   Sami B.           │
│  🔍 Rechercher      │   │                     │   │                     │
│                     │   │  ┌───────────────┐  │   │   00:04             │
│  Amira K.        📞 │   │  │ Restaurant XYZ│  │   │                     │
│  Bilel M.        📞 │──►│  │   [logo]      │  │──►│   (écran d'appel    │
│  Sami B.         📞 │   │  └───────────────┘  │   │    natif du         │
│  Yasmine T.      📞 │   │                     │   │    téléphone)       │
│  ...                │   │   ▓▓▓▓▓▓░░░  2 s    │   │                     │
│                     │   │   +1 point          │   │                     │
│                     │   │                     │   │                     │
│                     │   │  [ Annuler ]        │   │                     │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
   Liste des contacts        Publicité 3 s           Appel normal
```

## 1.3 Android et iOS ne se comportent pas pareil

### Android — ✅ entièrement automatique

L'application peut lancer l'appel **directement, sans aucun écran de confirmation**, grâce à
la permission `CALL_PHONE`.

**Contrepartie :** Google classe cette permission comme « dangereuse ». Il faut la demander
à l'utilisateur au premier lancement, et **fournir à Google une justification écrite** lors
de la publication sur le Play Store. Pour une application dont la fonction principale est
de passer des appels, la justification est légitime.

**Repli si refusée :** l'application ouvre le clavier du téléphone avec le numéro déjà
saisi — l'utilisateur appuie sur « appeler ». C'est un tap de plus, mais toujours sans
permission sensible.

### iOS — ⚠️ un tap de confirmation, obligatoire

Depuis iOS 10.3, **toute application qui lance un appel déclenche une fenêtre système**
« Appeler +216 XX XXX XXX ? — Annuler / Appeler ». L'utilisateur doit taper « Appeler ».

**C'est impossible à contourner.** Apple l'a imposé après que des applications ont lancé
des appels automatiquement, jusqu'à saturer des centres d'appels d'urgence. Aucune
permission, aucun réglage ne la supprime.

**Conséquence sur iPhone :**
```
Clic sur le contact → pub 3 s → fenêtre « Appeler ? » → tap → appel
```
Un tap de plus. C'est acceptable — l'utilisateur est déjà en train d'appeler, il tape
naturellement — mais **ce n'est pas « automatique »**, et il faut le dire à Call Com.

### Synthèse

| | Android | iOS |
|---|---|---|
| Pub avant l'appel | ✅ | ✅ |
| Appel lancé automatiquement après la pub | ✅ | ❌ 1 tap obligatoire |
| L'application sait que l'appel a eu lieu | ✅ | ❌ |
| L'application connaît la durée de l'appel | ✅ | ❌ |
| Liste de contacts dans l'application | ✅ sous déclaration Google | ✅ |

**Point important sur iOS :** l'application ne peut pas savoir si l'utilisateur a
finalement appelé, ni combien de temps. **Les points doivent donc être attribués sur la
publicité écoutée, pas sur l'appel.** C'est d'ailleurs plus juste : c'est l'écoute qui a
de la valeur pour l'annonceur.

## 1.4 Les cinq points à traiter — sinon le projet bloque

### A. 🔴 Nouvelle règle Google Play sur les contacts — **échéance le 28 octobre 2026**

C'est l'information la plus récente et la plus importante de cette étude.

Google a annoncé le **15 avril 2026** une nouvelle règle : les applications ciblant
**Android 17 et plus** ne peuvent demander l'accès complet aux contacts (`READ_CONTACTS`)
**que si le sélecteur de contacts d'Android ne suffit pas** à leur fonction principale.
Elles doivent remplir **une déclaration dans la Play Console** pour le justifier.

- **Contrôles préalables** dans la Play Console : à partir du **27 octobre 2026**
- **Application de la règle** : à partir du **28 octobre 2026**

**Ce que cela change pour votre alternative 1 :**

| Option | Ce que voit l'utilisateur | Autorisation |
|---|---|---|
| **Liste complète** dans l'app (votre souhait) | Tous ses contacts, comme dans son téléphone | Accès complet + **déclaration à Google** justifiant que l'app est une application de communication |
| **Sélecteur système** | À chaque appel, il ouvre le carnet d'adresses du téléphone et choisit un contact | Aucune déclaration |

**Recommandation :** viser la **liste complète**, en remplissant la déclaration. Google cite
explicitement les applications de communication parmi les usages légitimes. Mais **prévoir
le sélecteur système en repli**, au cas où la déclaration serait refusée.

> Toute nouvelle application publiée en 2027 devra cibler une version récente d'Android :
> **Call Com sera donc concerné par cette règle.** À intégrer dès la conception.

### B. 🔴 Numéros d'urgence — **jamais de publicité**

Il est **impératif** qu'aucune publicité ne précède un appel d'urgence. Quelques secondes
de retard peuvent avoir des conséquences graves, et la responsabilité de Call Com serait
directement engagée.

**Liste à bloquer en dur dans l'application**, sans possibilité de désactivation :

| Numéro | Service |
|---|---|
| **190** | SAMU |
| **193** | Garde nationale |
| **194** | Garde maritime (secours en mer) |
| **197** | Police secours |
| **198** | Protection civile |
| **112** | Numéro d'urgence international |

Pour ces numéros, l'application doit **appeler immédiatement**, sans publicité et sans
délai. C'est une règle de sécurité, pas une option.

### C. 🟠 L'utilisateur peut contourner l'application

Rien n'empêche l'utilisateur d'appeler depuis le téléphone habituel, sans publicité. C'est
**le principal risque business** de l'alternative 1 : si l'application est moins pratique
que le téléphone, il ne l'utilisera plus.

**Ce qu'il faut pour que l'utilisateur reste :**
1. **La récompense doit être visible et motivante** : « +1 point » à chaque appel, solde
   toujours affiché, progression vers la prochaine récompense.
2. **L'application doit être aussi rapide que le téléphone** : ouverture < 2 s, recherche
   de contact instantanée.
3. **Pas de pub à chaque appel.** 3 secondes avant *tous* les appels, c'est lourd.
   Plafonner : par exemple **1 pub toutes les 15 minutes**, ou **6 par jour maximum**.
   Les autres appels passent directement — et restent pratiques.
4. **Toujours pouvoir annuler** pendant la pub. Ne jamais bloquer l'utilisateur.

> Le plafond n'est pas qu'un confort : il est aussi imposé par l'économie du projet. On a
> calculé que la récompense soutenable correspond à environ 6 publicités par jour
> ([§16](16-estimation-couts.md)).

### D. 🟠 La fraude revient

Dans la voie opérateur, c'est le réseau qui mesurait la diffusion : la fraude était
quasiment impossible. **Ici, c'est le téléphone qui dit « j'ai écouté la pub »** — donc un
utilisateur malin peut tenter de tricher (application modifiée, émulateur, faux
événements).

**Ce qu'il faut :** plafonds de points par jour, signature des événements par le
téléphone, vérification d'intégrité de l'appareil (Play Integrity / App Attest), et points
confirmés par le serveur. **Tout cela est déjà conçu** dans le dossier
([§10](10-architecture-offline.md), [§13](13-anti-fraude.md)) et le registre de points
anti-triche est **déjà écrit et testé** ([§07](07-database-schema.md) — 14 tests réussis).

### E. 🟡 Ce n'est plus exactement le produit du cahier des charges

Le cahier des charges de Call Com (§6) prévoit que **l'appelant** entende la pub quand il
appelle l'utilisateur (appel **entrant**).

L'alternative 1 fait l'inverse : c'est **l'utilisateur lui-même** qui entend la pub
quand **il** appelle (appel **sortant**).

C'est un changement de produit. **C'est plutôt une bonne chose** — l'auditeur est celui qui
a accepté et qui est récompensé, ce qui règle la question du consentement — mais **Call Com
doit le valider explicitement.**

## 1.5 Architecture — simple

```
┌──────────────────────── TÉLÉPHONE ────────────────────────┐
│  Application Call Com                                      │
│   • liste des contacts                                     │
│   • pubs téléchargées à l'avance (fonctionne hors ligne)   │
│   • lecture 3 s → lancement de l'appel                     │
│   • solde de points                                        │
│   • [Android] détection de l'appel et de sa durée          │
└──────────────┬─────────────────────────────────────────────┘
               │ synchronisation (quand Internet est disponible)
┌──────────────▼─────────────────────────────────────────────┐
│  Serveur Call Com                                          │
│   • campagnes et pubs    • validation des écoutes          │
│   • registre de points   • récompenses (data, crédit)      │
│   • back-office annonceurs et administrateurs              │
└────────────────────────────────────────────────────────────┘

           Aucun lien avec l'opérateur.
```

La quasi-totalité de ces briques est **déjà conçue** dans le dossier : modèle de données,
registre de points, moteur de sélection des pubs, back-office, architecture hors ligne.

## 1.6 Effort, en ordre de grandeur

| Étape | Contenu | Effort |
|---|---|---|
| **POC** | Application minimale : contacts, pub 3 s, lancement de l'appel, journal. Testée sur 6 téléphones Android + 2 iPhone | **8 à 10 j/h** |
| **MVP** | Application complète, serveur, back-office, points, récompenses traitées à la main | **60 à 80 j/h** |

Le MVP bénéficie de ce qui est déjà fait : le modèle de données et le registre de points
sont écrits et testés.

## 1.7 Verdict sur l'alternative 1

> ✅ **Faisable, sans opérateur, en quelques semaines.**
>
> ⚠️ Sur iPhone : **un tap de confirmation** avant chaque appel, impossible à supprimer.
>
> 🔴 **Deux obligations** : déclaration Google pour les contacts (échéance 28 octobre 2026),
> et **aucune pub avant un numéro d'urgence**.
>
> 🟠 **Le vrai risque n'est pas technique** : c'est que l'utilisateur revienne au téléphone
> habituel. D'où le plafond de pubs et une récompense bien visible.

---

# PARTIE 2 — Les autres alternatives

## Alternative 2 — Appel VoIP dans l'application

### Le principe

L'appel ne passe plus par le réseau téléphonique mais **par Internet**, comme WhatsApp.
Les deux personnes doivent avoir l'application.

### Pourquoi c'est intéressant

**Call Com contrôle tout le son de l'appel.** La vision d'origine devient alors
**entièrement réalisable** :

```
Amira appelle Sami depuis Call Com
   → la pub se lance pendant que ça sonne chez Sami
   → la pub se répète jusqu'à ce que Sami décroche      ← impossible en GSM, possible ici
   → Sami décroche : la pub s'arrête net
   → conversation normale
```

C'est exactement le scénario du cahier des charges — **mais dans l'application**, au lieu
du réseau.

### Les contraintes

| Contrainte | Gravité |
|---|---|
| **Les deux personnes doivent avoir l'application** | 🔴 Élevée — tant que peu de gens l'ont, peu d'appels passent par là |
| **Il faut une connexion Internet** des deux côtés | 🟠 Moyenne — la data mobile n'est pas toujours disponible |
| **Concurrence directe avec WhatsApp**, que tout le monde utilise déjà gratuitement | 🔴 Élevée |
| Qualité dépendante de la connexion | 🟠 Moyenne |
| Les opérateurs tunisiens ont déjà restreint la VoIP par le passé | 🟠 À faire vérifier juridiquement |

### Faisabilité technique

| | Android | iOS |
|---|---|---|
| Passer et recevoir un appel VoIP | ✅ | ✅ (via CallKit, la méthode officielle d'Apple) |
| Pub pendant la sonnerie, répétée jusqu'au décroché | ✅ | ✅ |
| Mesure exacte de l'écoute et de l'appel | ✅ côté serveur | ✅ côté serveur |
| Fraude | ✅ très limitée — c'est le serveur qui mesure | ✅ |

**Coût d'exploitation :** faible pour les appels entre applications (seulement de la bande
passante). Il faut un serveur d'appels (relais média) — plusieurs solutions existent, y
compris en open source.

**Verdict :** ✅ **Techniquement la meilleure**, mais 🔴 **commercialement difficile seule** :
personne ne quittera WhatsApp pour une application où il faut que ses contacts soient
aussi inscrits.

---

## Alternative 3 — Hybride (VoIP si possible, sinon alternative 1)

### Le principe

L'application choisit automatiquement la meilleure façon d'appeler :

```
L'utilisateur clique sur un contact
   │
   ├── Le contact a Call Com et est connecté ?
   │      OUI → appel VoIP (alt. 2)
   │            pub pendant la sonnerie, répétée jusqu'au décroché
   │
   └── Sinon
          → pub 3 s puis appel téléphonique classique (alt. 1)
```

### Pourquoi c'est la bonne cible

- **Dès le premier jour, ça marche pour tous les appels** (grâce à l'alternative 1).
- **Plus il y a d'utilisateurs, plus l'expérience s'améliore** : les appels entre membres
  passent en VoIP, avec la vision complète.
- **Effet viral** : « Invitez Sami sur Call Com : vos appels deviennent gratuits et vous
  gagnez des points ».
- On **construit progressivement**, sans jamais tout miser sur l'adoption.

### Les contraintes

| Contrainte | Commentaire |
|---|---|
| Savoir quels contacts ont l'application | Il faut comparer les numéros avec le serveur — **à faire de façon anonymisée** (empreintes, jamais les numéros en clair). Sujet de protection des données à cadrer |
| Accès complet aux contacts | Nécessaire → **déclaration Google obligatoire** (§1.4-A) |
| Deux technologies d'appel à maintenir | Plus de travail, mais la seconde s'ajoute à la première |

**Verdict :** ✅ **La meilleure trajectoire** — on commence simple, on améliore avec
l'adoption.

---

## Alternative 4 — Écoute rémunérée, sans lien avec l'appel

### Le principe

L'utilisateur écoute des publicités **quand il le souhaite** dans l'application, et gagne
des points. Aucun lien avec les appels.

```
« Écoutez 3 publicités de 5 secondes → gagnez 10 points »
```

C'est le modèle des « publicités récompensées » des jeux mobiles, très répandu.

### Avantages et limites

| ✅ Avantages | ❌ Limites |
|---|---|
| **Le plus simple** à construire : 1 à 2 semaines | **Perd l'idée centrale** : la pub pendant l'appel |
| Identique sur Android et iPhone | L'utilisateur écoute **pour les points**, pas par intérêt : **moins de valeur pour l'annonceur** |
| Aucune règle téléphonie, aucune permission sensible | Risque de fraude élevé (écoute automatisée) |
| Aucun risque technique | Règles des stores sur les récompenses liées à la publicité, à respecter |

**Verdict :** ✅ faisable très vite, mais 🟠 **à utiliser en complément** plutôt que comme
produit principal — par exemple pour offrir des points supplémentaires aux utilisateurs
qui ont atteint leur plafond d'appels.

---

## Et la voie Orange ?

**Elle reste ouverte, et ces alternatives ne l'empêchent pas.** Au contraire :

- l'alternative 1 peut être **le plan B** si Orange ne donne pas suite ;
- ou **le MVP à lancer pendant la négociation**, pour ne pas attendre 6 à 18 mois ;
- et une application qui a déjà des utilisateurs et des annonceurs est **un bien meilleur
  argument devant Orange** qu'une idée sur papier.

Et surtout : **80 % de la plateforme est commune à toutes les options** (application,
points, récompenses, back-office, annonceurs). Rien de ce qui est construit pour
l'alternative 1 n'est perdu si Orange dit oui plus tard.

---

# Comparaison

| Critère | Alt. 1 Pub puis appel | Alt. 2 VoIP | Alt. 3 Hybride | Alt. 4 Écoute rémunérée | Voie Orange |
|---|---|---|---|---|---|
| Respecte l'idée « pub + appel » | ●●●○○ | ●●●●● | ●●●●○ | ●○○○○ | ●●●●● |
| Pub pendant la sonnerie | ❌ avant | ✅ | ✅ entre membres | ❌ | ✅ |
| Fonctionne dès le 1er utilisateur | ✅ | ❌ | ✅ | ✅ | ✅ |
| Fonctionne sans Internet | ✅ | ❌ | ✅ partiellement | ❌ | ✅ |
| iPhone totalement automatique | ❌ 1 tap | ✅ | ⚠️ selon le cas | ✅ | ✅ |
| Dépend d'un tiers | **Non** | Non | Non | Non | **Oui, d'Orange** |
| Mesure fiable / anti-fraude | ●●○○○ | ●●●●● | ●●●○○ | ●○○○○ | ●●●●● |
| Complexité | **Faible** | Élevée | Moyenne → élevée | **Très faible** | Faible pour nous, élevée à négocier |
| Délai POC | **2-3 sem.** | 4-6 sem. | Alt. 1 puis +4 sem. | 1-2 sem. | 6 à 18 mois |

---

# Recommandation

## Démarrer par l'alternative 1, construire vers l'alternative 3

```
MAINTENANT      POC Alternative 1 (2-3 semaines)
                → valider que les utilisateurs acceptent 3 s de pub avant l'appel
                → tester sur de vrais téléphones Android et iPhone

ENSUITE         MVP Alternative 1
                → application, points, récompenses, back-office
                → lancement sur 1 ou 2 gouvernorats

PUIS            Ajouter la VoIP entre membres → Alternative 3
                → la vision complète pour les appels entre utilisateurs

EN PARALLÈLE    La négociation Orange continue
                → si elle aboutit, elle s'ajoute sans rien casser

EN COMPLÉMENT   Alternative 4 pour les points supplémentaires
```

## Pourquoi

1. **Aucune dépendance** : Call Com maîtrise la technique et le calendrier.
2. **Rapide** : un POC en 2 à 3 semaines, pas en 6 à 18 mois.
3. **Rien n'est perdu** : tout ce qui est construit sert aussi à la voie Orange.
4. **On teste le vrai risque tôt** : est-ce que les gens acceptent 3 secondes de pub avant
   d'appeler ? Aucune étude ne répondra à cette question — seul un test avec de vrais
   utilisateurs le peut.

## Ce que le POC doit prouver

```
[ ] La pub de 3 s se lance correctement dans 98 % des cas, sur 6 Android et 2 iPhone
[ ] L'appel démarre bien juste après (Android automatique, iPhone après 1 tap)
[ ] Aucune pub avant les numéros d'urgence (190, 193, 194, 197, 198, 112)
[ ] Au moins 70 % d'un panel de 20 personnes trouvent le délai acceptable
[ ] Moins de 15 % d'abandon pendant la pub
```

**Si ce dernier point échoue** — si les gens abandonnent massivement pendant la pub —
il faut le savoir **avant** d'investir dans le MVP. C'est tout l'intérêt de commencer par
un POC court.

---

## Sources

- [Why does openURL "tel://" require user confirm in iOS 10.3? — Apple Developer Forums](https://developer.apple.com/forums/thread/73406)
- [Phone Links — Apple Developer](https://developer.apple.com/library/safari/featuredarticles/iPhoneURLScheme_Reference/PhoneLinks/PhoneLinks.html)
- [iOS — Always ask the users if they want to leave your app — Medium](https://medium.com/rocknnull/ios-always-ask-the-users-to-confirm-their-actions-before-leaving-the-app-using-url-schemes-ffd8f451ddce) — origine de la règle (abus d'appels vers les urgences)
- [Android Dial Phone Programmatically — ITNEXT](https://itnext.io/android-dial-phone-programmatically-5ea3714d801d) — `ACTION_CALL` et `CALL_PHONE`
- [Phone Calls — Google Developer Training](https://google-developer-training.github.io/android-developer-phone-sms-course/Lesson%201/1_c_phone_calls.html)
- [Policy announcement: April 15, 2026 — Play Console Help](https://support.google.com/googleplay/android-developer/answer/16926792?hl=en) — nouvelle règle sur les contacts
- [Google Play is changing how Android apps access your contacts — Help Net Security](https://www.helpnetsecurity.com/2026/04/16/google-play-store-policy-updates/)
- [Google Play Contacts Policy 2027 for Capacitor — Capawesome](https://capawesome.io/blog/capacitor-google-play-contacts-policy-2027/) — échéance du 28 octobre 2026, impact sur Capacitor
- [Understanding Restricted Permissions — Play Console Help](https://support.google.com/googleplay/android-developer/answer/16935362?hl=en)
- [Emergency Numbers in Tunisia 2026 — fuel-prices.eu](https://www.fuel-prices.eu/emergency-numbers/tunisia/)
- [Tunisia Emergency Numbers — eTunisie](https://etunisie.net/plan/emergency)
- [أرقام الطوارئ الضرورية في تونس — Tuniscope](https://www.tuniscope.com/article/422797/actu-arabe/arabe/numero-urgence-tunisie-055516)
