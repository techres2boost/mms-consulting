# 25 — Chiffrage de la mission de conseil technique

**Objet :** déterminer comment Call Com peut intégrer techniquement son service avec Orange,
et préparer le dossier technique nécessaire aux discussions avec les équipes Orange.
**Date :** 22 septembre 2026 · **Marché :** Tunisie · **Devise :** TND (1 EUR = 3,373 TND)

---

## 1. Références de marché — d'où viennent les tarifs

Je n'invente pas ces chiffres. Voici les repères publics utilisés, et le raisonnement.

| Repère | Valeur | Source |
|---|---|---|
| TJM freelance développeur, Tunisie 2026 | **180 à 500 TND/jour** | Baromètre freelances.tn |
| TJM expert spécialisé (IA, infra), Tunisie | jusqu'à **750 TND/jour**, surtout sur contrats européens | idem |
| Salaire architecte cloud / solution senior, Tunisie | **> 7 000 TND/mois** en ESN nearshore ; 8 000 à 20 000+ selon les sources | Tanitjobs, web6.tn, TalentUp |
| Développeur confirmé (3-5 ans) | 2 500 à 4 500 TND/mois | web6.tn |
| TJM moyen expert IT/logiciel, Europe | **629 €** ≈ **2 122 TND/jour** | Kicklox |
| Décote nearshore Tunisie / Maroc / Algérie | **−30 à −50 %** vs profil équivalent en France | RH Solutions |
| SMIG Tunisie 2026 | ~480 TND/mois | Tanitjobs |

### Le raisonnement qui fixe le tarif

**Trois méthodes, qui convergent :**

1. **Par le coût employeur.** Un architecte solution senior à 7 500 TND/mois brut coûte à
   son employeur ~10 500 TND/mois chargé, soit **~500 TND/jour ouvré**. Un indépendant
   doit facturer au-dessus : pas de congés payés, pas de sécurité de l'emploi, temps
   commercial non facturable, formation à sa charge. Le multiplicateur usuel est **1,4 à
   1,8** → **700 à 900 TND/jour**.
2. **Par la décote nearshore.** Profil équivalent en France : 629 €/jour ≈ 2 122 TND.
   Décote de 50 à 60 % pour la Tunisie → **850 à 1 060 TND/jour**.
3. **Par le baromètre local.** Le haut de la fourchette locale (750 TND) correspond à un
   « expert spécialisé sur contrat européen ». Une mission d'**architecture télécom avec
   présentation devant un opérateur** est au moins de ce niveau.

> **Conclusion : 700 TND/jour est le tarif juste et défendable pour cette mission.
> 900 TND/jour est justifiable, et je l'argumente au §6.**

**Ce qui distingue cette mission d'une prestation de développement**, et justifie le haut
de fourchette :
- c'est du **conseil et de l'architecture**, pas de la production de code ;
- elle exige une **expertise télécom** (CAMEL, IMS, CRBT, média précoce) rare en Tunisie ;
- elle comporte une **exposition client de haut niveau** : présenter devant les ingénieurs
  et la direction VAS d'un opérateur national ;
- elle porte une **responsabilité de recommandation** : le dossier engage un
  investissement de développement chez Call Com.

---

## 2. Grille de tarifs proposée

| Niveau | TJM | Quand l'appliquer |
|---|---|---|
| Confirmé | **450 TND/jour** | Si Call Com est très contraint budgétairement — à ne proposer qu'en dernier recours |
| **Senior — recommandé** | **700 TND/jour** | Le tarif de référence de cette mission |
| Expert télécom | **900 TND/jour** | Si Call Com valorise explicitement la présentation devant Orange et la responsabilité de recommandation |

**Un seul tarif sur toute la mission.** Ne pas faire de tarif dégressif par lot : cela
invite à la négociation ligne par ligne et dévalorise les livrables courts, qui sont
souvent les plus denses (le lot L7, les 22 questions, en est l'exemple).

---

## 3. Chiffrage détaillé par livrable

Charge = effort professionnel réel pour **produire, vérifier, adapter et défendre** le
livrable. Montants au tarif Senior de 700 TND/jour.

### Phase 1 — Dossier technique *(vous maîtrisez le calendrier → forfait)*

| Lot | Livrable | Jours | Montant HT |
|---|---|---|---|
| **L0** | Cadrage et lancement de mission | 1,0 | 700 TND |
| **L1** | **Étude de faisabilité télécom** — parcours d'appel CS et IMS, composants (MSC, SCP, MRF, AS), déclenchement CAMEL / iFC, budget de latence, variante origine, contraintes d'interconnexion | 5,0 | 3 500 TND |
| **L2** | **Architecture cible** — architecture logicielle Call Com, modules, abstraction opérateur, schémas | 4,0 | 2 800 TND |
| **L3** | **Scénarios d'intégration Orange** — 3 architectures comparées (pré-provisionné / API temps réel / nœud sur site), trajectoire recommandée | 3,0 | 2 100 TND |
| **L4** | **Flux techniques et contrats d'API** — séquences, contrats proposés, idempotence, délais de garde, replis, format des remontées de diffusion | 4,0 | 2 800 TND |
| **L5** | **Sécurité, données, contraintes** — pseudonymat, mTLS, rétention, matrice de conformité à qualifier | 3,0 | 2 100 TND |
| **L6** | **Proposition de POC** — périmètre, matériel, lignes de test, critères chiffrés, métriques, risques, planning | 3,0 | 2 100 TND |
| **L7** | **Questions techniques à Orange** — 7 catégories + checklist opérationnelle de 22 questions | 1,5 | 1 050 TND |
| **L8** | **Présentations PowerPoint** — pitch de 5 minutes + deck technique, avec notes de présentateur | 3,0 | 2 100 TND |
| | **Sous-total Phase 1** | **27,5 j** | **19 250 TND** |

### Phase 2 — Accompagnement Orange *(Orange maîtrise le calendrier → à la journée)*

| Lot | Livrable | Jours | Montant HT |
|---|---|---|---|
| **L9** | **Présentation technique chez Orange** — préparation, répétition, animation (**par session**) | 2,0 | 1 400 TND |
| **L10** | **Compte rendu de réunion** — réponses obtenues, décisions, actions, mise à jour du dossier (**par réunion**) | 1,0 | 700 TND |
| | **Par réunion Orange** | **3,0 j** | **2 100 TND** |

### Options recommandées

| Lot | Livrable | Jours | Montant HT | Pourquoi je le recommande |
|---|---|---|---|---|
| **L11** | Note de clôture de la piste applicative — tests sur 6 téléphones, captures, 2 pages | 2,0 | 1 400 TND | **Le meilleur rapport valeur/coût du lot.** Ferme définitivement le débat « et si on faisait une app ? », qui reviendra sinon dans six mois |
| **L12** | Dimensionnement des barèmes et plafonds — économie unitaire, CPM plancher, plafonds journaliers | 3,0 | 2 100 TND | Détermine les paramètres techniques du moteur de points. Sans cela, l'équipe dev codera des valeurs arbitraires |
| **L13** | Schéma de base de données + migrations exécutables + tests | 4,0 | 2 800 TND | Livrable **directement utilisable** par l'équipe de développement. Fait gagner 2 à 3 semaines au démarrage |
| **L14** | Registre des risques et plan de mitigation | 1,0 | 700 TND | Exigé par tout investisseur ou partenaire sérieux |
| **L15** | Dossier de conformité — matière pour le conseil juridique (INPDP, INT) | 2,0 | 1 400 TND | **Pas du droit** : de la préparation technique du dossier, pour que l'avocat facture 2 h au lieu de 10 |
| | **Sous-total options** | **12,0 j** | **8 400 TND** |

---

## 4. Formules commerciales

| Formule | Contenu | Jours | 450 TND/j | **700 TND/j** | 900 TND/j |
|---|---|---|---|---|---|
| **A — Socle « aller chez Orange »** | L0, L1 allégé, L3, L6, L7, L8, L9, L10 | 16,5 | 7 425 TND | **11 550 TND** | 14 850 TND |
| **B — Dossier technique complet** | L0 à L8 | 27,5 | 12 375 TND | **19 250 TND** | 24 750 TND |
| **C — Dossier + 1ʳᵉ réunion Orange** | L0 à L10 | 30,5 | 13 725 TND | **21 350 TND** | 27 450 TND |
| **D — Mission complète** | L0 à L15 | 42,5 | 19 125 TND | **29 750 TND** | 38 250 TND |

En euros au taux BCT du 15/09/2026 : formule C ≈ **6 330 €**, formule D ≈ **8 820 €**.

### Ce que je recommande de proposer

> **Formule C à 21 350 TND HT, avec les options L11 à L15 présentées séparément.**

Raisons :
1. **Elle est complète pour l'objectif annoncé** : aller chez Orange avec un dossier
   défendable et en ressortir avec un compte rendu exploitable.
2. **Elle inclut une réunion**, donc un résultat, pas seulement un document.
3. **Les options restent visibles**, ce qui permet à Call Com de monter en périmètre
   sans renégocier le socle.
4. **Elle se situe dans un ordre de grandeur acceptable** pour une startup tunisienne
   pré-revenus, ce qui n'est pas le cas de 30 000 TND en une fois.

**Si le budget bloque :** proposez la **formule A à 11 550 TND**, en précisant clairement
que L2, L4 et L5 seront nécessaires **avant le développement**, pas avant la réunion
Orange. C'est honnête et c'est vrai : on peut aller voir Orange sans avoir figé les
contrats d'API.

---

## 5. Structure contractuelle — le point le plus important

### Forfait pour la Phase 1, régie pour la Phase 2

C'est la décision structurante du contrat, et il ne faut pas s'en écarter :

| Phase | Mode | Pourquoi |
|---|---|---|
| **Phase 1 — dossier** | **Forfait** par livrable | Vous maîtrisez le périmètre et le calendrier. Le forfait vous protège si vous allez plus vite, et rassure le client sur le prix |
| **Phase 2 — Orange** | **À la journée**, ou abonnement mensuel | **Vous ne maîtrisez pas le calendrier d'Orange.** Forfaitiser une phase dont la durée dépend d'un tiers est la première cause de mission qui dérape |

> **Ne forfaitisez jamais « l'accompagnement jusqu'à l'accord d'Orange ».** Le processus
> peut durer 6 à 18 mois, Orange peut ne jamais répondre, et vous seriez engagé sans
> borne. C'est l'erreur classique sur ce type de mission.

### Abonnement d'accompagnement — l'alternative élégante

Pour la phase Orange, proposez un abonnement mensuel plutôt que des journées à l'unité :
cela lisse votre revenu et évite de renégocier à chaque réunion.

| Volume | Montant | Contenu |
|---|---|---|
| 2 j/mois | **1 400 TND/mois** | Suivi, préparation de réunion, mises à jour du dossier |
| 3 j/mois | **2 100 TND/mois** | + 1 réunion Orange et son compte rendu |
| 4 j/mois | **2 800 TND/mois** | + itérations techniques et cadrage du POC |

Engagement 3 mois minimum, reconductible, **résiliable avec 1 mois de préavis**.

### Échéancier de paiement recommandé

| Jalon | Part | Montant (formule C) |
|---|---|---|
| À la commande | 40 % | 8 540 TND |
| À la remise du dossier technique | 40 % | 8 540 TND |
| Après la première réunion Orange et son compte rendu | 20 % | 4 270 TND |

**L'acompte de 40 % à la commande n'est pas négociable.** Il filtre les clients non
engagés, et sur ce projet le risque que Call Com ne donne pas suite est réel.

---

## 6. Comment défendre le tarif — les trois arguments

Vous aurez la conversation, autant l'anticiper.

### « C'est cher pour la Tunisie »

> *« Un architecte solution senior coûte à un employeur environ 10 500 TND par mois
> chargé, soit 500 dinars par jour ouvré. Un indépendant qui n'a ni congés payés, ni
> sécurité de l'emploi, ni temps commercial facturable, se situe à 700 à 900. Et sur
> cette mission précise, l'expertise demandée — réseaux CAMEL, IMS, tonalité de retour
> d'appel — ne se trouve pas dans le vivier du développement web. Le même profil facture
> 629 € par jour en France. »*

### « Pourquoi 27 jours pour des documents ? »

> *« Le document n'est pas le livrable. Le livrable est la décision qu'il permet de
> prendre. Sans cette étude, Call Com développe une plateforme sur un mécanisme dont
> personne n'a vérifié la faisabilité — soit 6 à 9 mois de développement à risque. Le
> dossier coûte moins de 5 % de ce que représenterait cette erreur. »*

### « On peut commencer plus petit ? »

> *« Oui : la formule A, 16,5 jours. Elle vous permet d'aller chez Orange avec un dossier
> défendable. Mais soyons clairs sur ce qui n'y est pas : les contrats d'API et
> l'architecture de sécurité. Vous en aurez besoin avant de développer, pas avant la
> réunion. »*

### Et l'argument que vous pouvez utiliser à 900 TND/jour

Si Call Com veut que vous **présentiez devant Orange à ses côtés** — ce qu'il a demandé —
vous n'êtes plus un rédacteur de dossier, vous êtes **la caution technique de Call Com
devant un opérateur national**. C'est une responsabilité différente, et elle se facture.
Le passage de 700 à 900 TND/jour se justifie exactement par là.

---

## 7. Fiscalité et facturation — à vérifier avec un expert-comptable

⚠️ **Je ne suis pas votre conseil fiscal.** Ces éléments sont des repères issus de sources
publiques, à faire confirmer par un expert-comptable tunisien avant d'établir votre
première facture.

| Élément | Repère 2026 | Source |
|---|---|---|
| **TVA** | Taux normal **19 %**. Les professions libérales sont passées de 13 % à 19 % | compta-online, IntegraSys |
| **Retenue à la source** | **10 %** (régime réel) ou **15 %** (forfait), calculée sur le montant HT — la TVA est traitée séparément | web6.tn, compta-online |
| **CNSS non-salarié** | ~**15,5 %** sur la base déclarée | pro-businesscenter |
| **Timbre fiscal** | À appliquer sur facture | compta-online |

### Illustration sur la formule D (29 750 TND HT), à titre indicatif

```
Montant HT                        29 750 TND
TVA 19 %                        +  5 652 TND
Total TTC facturé                 35 402 TND
Retenue à la source 10 %        −  2 975 TND
────────────────────────────────────────────
Encaissé à la facturation         32 428 TND
```

**La retenue à la source n'est pas une perte** : c'est un acompte d'impôt, imputable sur
votre déclaration annuelle. Mais c'est un **décalage de trésorerie** à anticiper.

**Deux points pratiques :**
1. **Faites figurer la retenue sur le devis** (« montant HT, TVA 19 %, retenue à la source
   selon régime »). Sinon le client la déduit et vous croyez à une erreur de paiement.
2. **Exigez le certificat de retenue à la source** : sans lui, vous ne pouvez pas imputer
   l'acompte.

---

## 8. Ce qui n'est pas dans le périmètre

À écrire noir sur blanc dans le devis — c'est ce qui évite les malentendus coûteux.

| Exclu | Commentaire |
|---|---|
| **Développement de la plateforme Call Com** | Mission séparée, à chiffrer après la décision Orange |
| **Réalisation du POC technique** | Le dossier le *spécifie* ; l'exécuter est une autre mission |
| **Conseil juridique et réglementaire** | Le lot L15 prépare la matière ; la qualification appartient à un avocat tunisien |
| **Négociation commerciale avec Orange** | Partage de revenus, contrat, exclusivité : c'est le rôle de Call Com |
| **Prospection des annonceurs** | Rôle de Call Com. C'est aussi le risque n°1 du projet |
| **Développement chez Orange** | Hors de votre main |
| **Garantie d'obtenir l'accord d'Orange** | **Aucune obligation de résultat** sur la décision d'un tiers. À écrire explicitement |
| **Frais de déplacement** | Refacturés au réel, ou forfait par déplacement hors Grand Tunis |
| **Réunions au-delà de celles prévues** | Au tarif journalier, ou dans l'abonnement |

### La clause la plus importante

> *« La présente mission est une mission de moyens. Le prestataire s'engage sur la qualité
> et la complétude des livrables, non sur la décision d'Orange Tunisie, qui relève d'un
> tiers sur lequel il n'a aucun pouvoir. »*

Sans cette clause, un refus d'Orange peut se transformer en contestation d'honoraires.

---

## 9. Récapitulatif — la proposition à envoyer

```
┌──────────────────────────────────────────────────────────────────────────┐
│  MISSION DE CONSEIL TECHNIQUE — INTÉGRATION CALL COM × ORANGE TUNISIE    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PHASE 1 — Dossier technique              27,5 j      19 250 TND HT      │
│            (forfait, 6 à 8 semaines)                                     │
│                                                                          │
│  PHASE 2 — Première réunion Orange         3,0 j       2 100 TND HT      │
│            (présentation + compte rendu)                                 │
│                                                                          │
│            ─────────────────────────────────────────────────────         │
│            TOTAL FORMULE C                30,5 j      21 350 TND HT      │
│                                           TVA 19 %     4 057 TND         │
│                                           TTC         25 407 TND         │
│                                                                          │
│  OPTIONS                                                                 │
│    L11  Clôture de la piste applicative    2,0 j       1 400 TND HT      │
│    L12  Dimensionnement barèmes/plafonds   3,0 j       2 100 TND HT      │
│    L13  Base de données + migrations       4,0 j       2 800 TND HT      │
│    L14  Registre des risques               1,0 j         700 TND HT      │
│    L15  Dossier de conformité              2,0 j       1 400 TND HT      │
│                                                                          │
│  ACCOMPAGNEMENT AU-DELÀ (phase Orange)                                   │
│    Abonnement 3 j/mois                              2 100 TND HT/mois    │
│    ou à la journée                                    700 TND HT/jour    │
│                                                                          │
│  Échéancier : 40 % commande · 40 % livraison · 20 % après réunion        │
│  Validité de l'offre : 30 jours                                          │
│  Mission de moyens — aucune obligation de résultat sur la décision       │
│  d'Orange Tunisie.                                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Trois conseils de négociation

1. **Ne donnez pas un prix à l'oral avant d'avoir envoyé le devis.** Sur ce type de
   mission, le premier chiffre prononcé devient le plafond. Dites « je vous envoie une
   proposition chiffrée par livrable sous 48 h ».

2. **Vendez la phase 2 séparément, dès le début.** Si Call Com veut vous emmener chez
   Orange — et il l'a dit — cette phase a de la valeur et une durée inconnue. En parler
   dès la première proposition évite de devoir la facturer plus tard « en plus », ce qui
   est toujours mal reçu.

3. **Le livrable qui justifie le mieux votre prix est le lot L7** — les 22 questions. Il
   ne coûte que 1 050 TND et c'est celui qui fera la différence dans la salle chez Orange.
   Montrez-le en premier, c'est le plus démonstratif de ce que vous apportez.

---

## Sources

- [Comment déterminer le TJM freelance en Tunisie en 2026 — freelances.tn](https://www.freelances.tn/blog/conseils-freelance/barometre-des-tarifs-quel-tjm-appliquer-en-tunisie-en-2026/) — 180 à 500 TND/jour, jusqu'à 750 pour un expert
- [Quel est le TJM des ingénieurs en consulting ? — Kicklox](https://www.kicklox.com/blog-client/tjm-consultants-ingenierie-freelance/) — 629 €/jour moyen pour experts IT/logiciel en Europe
- [TJM des freelances IT & Tech : Étude 2026 — RH Solutions](https://www.rh-solutions.com/le-grand-guide-du-portage/tjm-freelance-tech/) — décote nearshore de 30 à 50 %
- [Salaire Ingénieur Informatique Tunisie 2026 — web6.tn](https://web6.tn/blog/salaire-ingenieur-informatique-tunisie-2026/) — architecte cloud senior > 7 000 TND/mois
- [Salaires en Tunisie : grilles par secteur — Tanitjobs](https://www.tanitjobs.com/emploi/salaire-tunisie/)
- [Solution Architect Salaries in Tunisia 2026 — TalentUp](https://talentup.io/salary/solution-architect/tunisia)
- [TVA et retenue à la source en Tunisie — Compta Online](https://www.compta-online.com/tunisie-tva-et-retenue-la-source-t56776)
- [Retenue à la Source Tunisie 2026 : Taux, TEJ, Calcul — web6.tn](https://web6.tn/blog/retenue-a-la-source-tunisie-2026/)
- [Fiscalité applicable aux freelances en Tunisie — Pro Business Center](https://www.pro-businesscenter.com/quelle-est-la-fiscalite-applicable-aux-freelances-en-tunisie-en-2025/)
- [Quel statut pour les Freelances en Tunisie ? — Ilboursa](https://www.ilboursa.com/marches/quel-statut-pour-les-freelances-en-tunisie-_18067)
- Taux de change : Banque Centrale de Tunisie, 15/09/2026 — 1 EUR = 3,3731 TND
