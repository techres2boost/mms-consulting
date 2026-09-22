# 25 — Chiffrage de la mission de conseil technique

**Objet :** valider la faisabilité de principe avec Orange, puis n'engager le détail
qu'une fois ses réponses connues.
**Date :** 22 septembre 2026 · **Version 2.0** · **Marché :** Tunisie · 1 EUR = 3,373 TND

> ### ⚠️ Révision de fond par rapport à la version 1.0
>
> La v1.0 chiffrait **27,5 jours d'étude avant le premier contact avec Orange**, soit
> 21 350 TND. C'était une erreur de méthode : elle produisait du détail sur des
> **hypothèses** concernant un réseau dont nous ne connaissons pas l'architecture, et une
> partie de ce travail aurait dû être refaite après la première réunion.
>
> **La v2.0 ramène l'avant-Orange à 12,5 jours (8 750 TND), soit 59 % de moins**, et
> conditionne le détail à la réponse d'Orange. Démarche complète en
> [§26](26-demarche-phasee.md).

---

## 1. Le principe de chiffrage

> **Avant Orange, on ne facture que ce qui est nécessaire pour obtenir et réussir le
> rendez-vous. Le détail vient après, quand on sait de quoi on parle.**

| | v1.0 | **v2.0** |
|---|---|---|
| Avant le 1er contact Orange | 27,5 j — 19 250 TND | **9,5 j — 6 650 TND** |
| Ticket d'entrée (avec la réunion) | 30,5 j — 21 350 TND | **12,5 j — 8 750 TND** |
| Étude détaillée | Chiffrée d'avance | **Conditionnée à la réponse d'Orange** |
| Risque de retravail | Élevé | Faible |

**Ce que cela change pour la vente :** un ticket d'entrée à 8 750 TND est finançable par
une startup tunisienne pré-revenus. 21 350 TND ne l'était pas — et un devis qu'on ne peut
pas payer ne se négocie pas, il se refuse.

---

## 2. Références de marché — d'où viennent les tarifs

| Repère | Valeur | Source |
|---|---|---|
| TJM freelance développeur, Tunisie 2026 | **180 à 500 TND/jour** | Baromètre freelances.tn |
| TJM expert spécialisé, contrats européens | jusqu'à **750 TND/jour** | idem |
| Salaire architecte cloud / solution senior | **> 7 000 TND/mois** en ESN nearshore | web6.tn, Tanitjobs |
| Développeur confirmé (3-5 ans) | 2 500 à 4 500 TND/mois | web6.tn |
| TJM moyen expert IT / logiciel, Europe | **629 €** ≈ **2 122 TND/jour** | Kicklox |
| Décote nearshore Tunisie vs France | **−30 à −50 %** | RH Solutions |

### Trois méthodes convergentes

1. **Par le coût employeur.** Un architecte senior à 7 500 TND/mois brut coûte ~10 500
   TND/mois chargé, soit **~500 TND/jour ouvré**. Un indépendant — sans congés payés, sans
   sécurité de l'emploi, avec du temps commercial non facturable — applique un
   multiplicateur de 1,4 à 1,8 → **700 à 900 TND/jour**.
2. **Par la décote nearshore.** 629 €/jour en France ≈ 2 122 TND, moins 50 à 60 % →
   **850 à 1 060 TND/jour**.
3. **Par le baromètre local.** Le haut de la fourchette locale (750 TND) correspond à un
   « expert spécialisé sur contrat européen ». Une mission d'architecture télécom avec
   présentation devant un opérateur est au moins de ce niveau.

> **700 TND/jour est le tarif juste et défendable. 900 est justifiable si le consultant
> présente devant Orange** — voir §7.

### Grille

| Niveau | TJM | Quand l'appliquer |
|---|---|---|
| Confirmé | **450 TND/j** | Si Call Com est très contraint — dernier recours |
| **Senior — recommandé** | **700 TND/j** | Le tarif de référence |
| Expert télécom | **900 TND/j** | Si Call Com valorise la présentation devant Orange et la responsabilité de recommandation |

**Un seul tarif sur toute la mission.** Pas de dégressif par lot : cela invite à la
négociation ligne par ligne et dévalorise les livrables courts, souvent les plus denses.

---

## 3. PHASE 1 — Avant Orange · **9,5 j · 6 650 TND HT**

*Objectif : un dossier assez solide pour obtenir et réussir le premier rendez-vous. Rien
de plus.*

| Réf. | Tâche | Jours | Montant HT | Livrable |
|---|---|---|---|---|
| **P1.1** | Cadrage : concept, contraintes, objectif du rendez-vous | 0,5 | 350 TND | Note de cadrage, 2 p. |
| **P1.2** | **Note de faisabilité technique** — ce qui est certain, ce qui est hypothèse, ce qui est à confirmer | 2,0 | 1 400 TND | Note, 8-10 p. |
| **P1.3** | Architecture conceptuelle Call Com + frontière Call Com / opérateur | 1,5 | 1 050 TND | Schéma + description des modules, 5 p. |
| **P1.4** | Scénarios d'intégration possibles + flux d'appel et insertion de l'annonce | 1,5 | 1 050 TND | 3 scénarios comparés + 2 schémas |
| **P1.5** | Sécurité, données personnelles, anti-fraude — **grandes lignes seulement** | 1,0 | 700 TND | Note de principes, 4 p. |
| **P1.6** | POC réalisable — périmètre minimal et critères de succès | 0,5 | 350 TND | Fiche POC, 1-2 p. |
| **P1.7** | **Questions techniques à poser aux ingénieurs Orange** | 1,0 | 700 TND | Checklist imprimable, 2 p. |
| **P1.8** | Consolidation du dossier + pitch 5 min + deck technique | 1,5 | 1 050 TND | Dossier PDF + 2 présentations |
| | **TOTAL PHASE 1** | **9,5 j** | **6 650 TND** | ~30 p. + 2 decks |

### Variante allégée — **6,0 j · 4 200 TND HT**

Si le budget est le facteur limitant : P1.1 · P1.2 réduit à 1,5 j · P1.4 réduit à 1 j ·
P1.6 · P1.7 · P1.8.

**Ce qu'on perd, à dire clairement :** l'architecture conceptuelle détaillée (P1.3) et la
note sécurité/données (P1.5). **Ce n'est pas bloquant pour aller voir Orange** — c'est
bloquant pour développer. Elles reviendront en Phase 3, où elles seront de toute façon
mieux informées.

---

## 4. PHASE 2 — Premier échange avec Orange · **3,0 j · 2 100 TND HT**

| Réf. | Tâche | Jours | Montant HT | Livrable |
|---|---|---|---|---|
| **P2.1** | Préparation et répétition du rendez-vous | 1,0 | 700 TND | Script d'animation + anticipation des objections |
| **P2.2** | Animation du rendez-vous aux côtés de Call Com | 1,0 | 700 TND | Présence et conduite technique |
| **P2.3** | Compte rendu + note de décision d'architecture | 1,0 | 700 TND | CR structuré + recommandation d'orientation |
| | **TOTAL PHASE 2** (par cycle de réunion) | **3,0 j** | **2 100 TND** | |
| | Réunion supplémentaire (prépa + animation + CR allégé) | 1,5 j | 1 050 TND | À l'unité |

**Facturation au cycle, jamais au résultat.** Le calendrier d'Orange n'est pas maîtrisable
(§6).

---

## 5. Ticket d'entrée

| Formule | Jours | 450 TND/j | **700 TND/j** | 900 TND/j |
|---|---|---|---|---|
| Phase 1 seule | 9,5 | 4 275 TND | **6 650 TND** | 8 550 TND |
| Phase 1 allégée + Phase 2 | 9,0 | 4 050 TND | **6 300 TND** | 8 100 TND |
| **Phase 1 + Phase 2** ← à proposer | **12,5** | 5 625 TND | **8 750 TND** | 11 250 TND |

À 700 TND/j, le ticket d'entrée représente **8 750 TND HT ≈ 2 594 €**.

### Fiscalité sur le ticket d'entrée

```
Montant HT                         8 750 TND
TVA 19 %                        +  1 662 TND
Total TTC facturé                 10 412 TND
Retenue à la source 10 %        −    875 TND
────────────────────────────────────────────
Encaissé à la facturation          9 538 TND
```

### Échéancier

| Jalon | Part | Montant |
|---|---|---|
| À la commande | 50 % | 4 375 TND |
| À la remise du dossier de Phase 1 | 30 % | 2 625 TND |
| Après la réunion Orange et son compte rendu | 20 % | 1 750 TND |

**50 % à la commande sur un ticket de cette taille.** L'acompte filtre les clients non
engagés ; sur ce projet le risque que Call Com ne donne pas suite est réel.

---

## 6. PHASE 3 — Après Orange · **conditionnelle, non chiffrée fermement**

**C'est le cœur de la révision.** Le contenu de la Phase 3 dépend entièrement de la
réponse d'Orange. La chiffrer aujourd'hui reviendrait à refaire l'erreur corrigée.

> **Un cadrage d'une journée — 700 TND — après la réunion, fixe le périmètre et le prix
> fermes.** C'est la seule ligne de Phase 3 engageable dès maintenant.

### Les trois scénarios

| Scénario | Déclencheur | Jours | Montant HT |
|---|---|---|---|
| **Cadrage de Phase 3** | Systématique, après la réunion | 1,0 | **700 TND** |
| **A — intégration simple** | Orange accepte le pré-provisionnement, sa plateforme sait cibler et mesurer | 12-15 | **8 400 – 10 500 TND** |
| **B — intégration complexe** | Orange exige du temps réel ou un composant hébergé chez lui | 20-25 | **14 000 – 17 500 TND** |
| **C — pas de suite** | Orange décline ou ne répond pas | 4-6 | **2 800 – 4 200 TND** |

Contenu détaillé de chaque scénario en [§26, Phase 3](26-demarche-phasee.md#phase-3--après-orange-conditionnelle).

### Ce qui peut démarrer sans attendre Orange

Argument à donner à Call Com s'il craint que tout soit suspendu :

| Chantier | Bloqué par Orange ? |
|---|---|
| Application mobile, portefeuille d'unités, historique | **Non** |
| Back-office : annonceurs, campagnes, créatifs, validation | **Non** |
| Catalogue de récompenses et traitement des demandes | **Non** |
| Moteur de ciblage (expression des règles) | **Non** |
| Adaptateur opérateur | **Oui — et lui seul** |

**~80 % de la plateforme est développable en parallèle**, derrière un adaptateur bouchon.
Ce chantier de développement est une mission distincte, à chiffrer séparément.

---

## 7. Structure contractuelle

### Forfait où vous maîtrisez, régie où vous ne maîtrisez pas

| Phase | Mode | Pourquoi |
|---|---|---|
| **Phase 1** | **Forfait** | Périmètre et calendrier maîtrisés |
| **Phase 2** | **Forfait par cycle de réunion** | Un cycle est borné, la série ne l'est pas |
| **Phase 3** | **Forfait après cadrage** | Chiffrable seulement une fois Orange connu |
| Accompagnement au-delà | **Abonnement mensuel** | La durée dépend d'Orange |

> **Ne forfaitisez jamais « l'accompagnement jusqu'à l'accord d'Orange ».** Le processus
> peut durer 6 à 18 mois, Orange peut ne jamais répondre, et vous seriez engagé sans
> borne. C'est l'erreur classique sur ce type de mission.

### Abonnement d'accompagnement

| Volume | Montant | Contenu |
|---|---|---|
| 2 j/mois | **1 400 TND/mois** | Suivi, préparation de réunion, mises à jour |
| 3 j/mois | **2 100 TND/mois** | + 1 réunion et son compte rendu |
| 4 j/mois | **2 800 TND/mois** | + itérations techniques et cadrage de POC |

Engagement 3 mois, reconductible, résiliable avec 1 mois de préavis.

---

## 8. Comment défendre le chiffrage

### « 9,5 jours, c'est peu — vous êtes sûr que c'est sérieux ? »

> *« C'est volontaire. Produire trente jours d'architecture détaillée avant d'avoir parlé
> à Orange, ce serait détailler des hypothèses sur un réseau que je ne connais pas — et en
> refaire une partie après la réunion. Ces 9,5 jours produisent exactement ce qu'il faut
> pour obtenir le rendez-vous et en tirer les bonnes réponses. Le détail vient ensuite, et
> il sera juste. »*

C'est l'argument le plus fort du devis : **vous facturez moins que ce que le client
attendait, et pour une raison professionnelle.** Cela établit la confiance mieux que
n'importe quel volume de pages.

### « Pourquoi la Phase 3 n'est pas chiffrée ? »

> *« Parce que son contenu dépend de trois réponses d'Orange : peuvent-ils cibler par
> zone, peuvent-ils mesurer la durée réellement écoutée, et acceptent-ils un POC. Selon
> les réponses, c'est 4 jours ou 25. Je vous donne les trois fourchettes et je m'engage
> sur un cadrage d'une journée après la réunion pour fixer le prix. »*

### « C'est cher pour la Tunisie »

> *« Un architecte solution senior coûte à un employeur environ 10 500 TND par mois
> chargé, soit 500 dinars par jour ouvré. Un indépendant se situe à 700-900. Et
> l'expertise demandée ici — réseaux mobiles, tonalité de retour d'appel, insertion média —
> ne se trouve pas dans le vivier du développement web. Le même profil facture 629 € par
> jour en France. »*

### L'argument pour passer à 900 TND/jour

Si Call Com veut que vous **présentiez devant Orange à ses côtés** — ce qu'il a demandé —
vous n'êtes plus un rédacteur de dossier : vous êtes **la caution technique de Call Com
devant un opérateur national**. C'est une responsabilité différente, et le passage de 700
à 900 se justifie exactement par là. À 900 TND/j, le ticket d'entrée reste à
**11 250 TND**, toujours nettement en dessous des 21 350 TND de la v1.0.

---

## 9. Fiscalité — à vérifier avec un expert-comptable

⚠️ **Je ne suis pas votre conseil fiscal.** Repères issus de sources publiques, à faire
confirmer avant votre première facture.

| Élément | Repère 2026 | Source |
|---|---|---|
| **TVA** | Taux normal **19 %** ; les professions libérales sont passées de 13 % à 19 % | compta-online, IntegraSys |
| **Retenue à la source** | **10 %** (régime réel) ou **15 %** (forfait), sur le HT ; la TVA est traitée séparément | web6.tn, compta-online |
| **CNSS non-salarié** | ~**15,5 %** sur la base déclarée | pro-businesscenter |
| **Timbre fiscal** | À appliquer sur facture | compta-online |

**Deux points pratiques :**
1. **Faites figurer la retenue sur le devis.** Sinon le client la déduit et vous croyez à
   une erreur de paiement.
2. **Exigez le certificat de retenue à la source.** Sans lui, vous ne pouvez pas imputer
   l'acompte sur votre déclaration.

---

## 10. Ce qui n'est pas dans le périmètre

| Exclu | Commentaire |
|---|---|
| **Développement de la plateforme Call Com** | Mission distincte. ~80 % est développable sans attendre Orange, mais ce n'est pas cette mission |
| **Réalisation du POC** | La Phase 1 le *spécifie* ; l'exécuter est une autre mission |
| **Conseil juridique et réglementaire** | La mission identifie les sujets et dit qui doit les porter. La qualification appartient à un avocat tunisien |
| **Négociation commerciale avec Orange** | Partage de revenus, contrat, exclusivité : rôle de Call Com |
| **Prospection des annonceurs** | Rôle de Call Com — et risque n°1 du projet |
| **Développements côté Orange** | Hors de votre main |
| **Garantie d'obtenir l'accord d'Orange** | **Aucune obligation de résultat** sur la décision d'un tiers |
| **Frais de déplacement hors Grand Tunis** | Refacturés au réel |

### La clause indispensable

> *« La présente mission est une mission de moyens. Le prestataire s'engage sur la qualité
> et la complétude des livrables, non sur la décision d'Orange Tunisie, qui relève d'un
> tiers sur lequel il n'a aucun pouvoir. »*

Sans elle, un refus d'Orange peut se transformer en contestation d'honoraires.

---

## 11. La proposition à envoyer

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MISSION — FAISABILITÉ ET PRÉPARATION DU DOSSIER ORANGE                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PHASE 1 — Avant Orange                     9,5 j     6 650 TND HT      │
│            forfait · 3 à 4 semaines                                     │
│            dossier technique + 2 présentations                          │
│                                                                         │
│  PHASE 2 — Premier échange avec Orange      3,0 j     2 100 TND HT      │
│            forfait par cycle de réunion                                 │
│            préparation + animation + compte rendu + décision            │
│                                                                         │
│            ──────────────────────────────────────────────────────       │
│            TICKET D'ENTRÉE                 12,5 j     8 750 TND HT      │
│                                          TVA 19 %     1 662 TND         │
│                                          TTC        10 412 TND          │
│                                                                         │
│  PHASE 3 — Après Orange                                                 │
│    Cadrage (systématique)                   1,0 j       700 TND HT      │
│    Scénario A — intégration simple        12-15 j   8 400-10 500 TND    │
│    Scénario B — intégration complexe      20-25 j  14 000-17 500 TND    │
│    Scénario C — Orange ne donne pas suite   4-6 j   2 800- 4 200 TND    │
│    → périmètre et prix fermes fixés au cadrage                          │
│                                                                         │
│  Option — variante allégée de la Phase 1    6,0 j     4 200 TND HT      │
│  Réunion Orange supplémentaire              1,5 j     1 050 TND HT      │
│  Abonnement d'accompagnement 3 j/mois               2 100 TND HT/mois   │
│                                                                         │
│  Échéancier : 50 % commande · 30 % livraison · 20 % après réunion       │
│  Validité : 30 jours                                                    │
│  Mission de moyens — aucune obligation de résultat sur la décision      │
│  d'Orange Tunisie.                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Trois conseils de négociation

1. **Ne donnez pas de prix à l'oral avant d'envoyer le devis.** Le premier chiffre
   prononcé devient le plafond.

2. **Mettez en avant la réduction volontaire.** Dire « j'ai revu mon approche à la baisse
   parce que détailler avant de parler à Orange n'aurait pas de sens » est un argument de
   crédibilité rare, et il désarme la négociation sur le prix.

3. **Le livrable qui justifie le mieux votre tarif est P1.7** — les 12 questions du premier
   rendez-vous. Il ne coûte que 700 TND et c'est celui qui fera la différence dans la
   salle. Montrez-le en premier.

---

## Sources

- [TJM freelance en Tunisie 2026 — freelances.tn](https://www.freelances.tn/blog/conseils-freelance/barometre-des-tarifs-quel-tjm-appliquer-en-tunisie-en-2026/)
- [TJM des ingénieurs en consulting — Kicklox](https://www.kicklox.com/blog-client/tjm-consultants-ingenierie-freelance/)
- [TJM des freelances IT & Tech : Étude 2026 — RH Solutions](https://www.rh-solutions.com/le-grand-guide-du-portage/tjm-freelance-tech/)
- [Salaire Ingénieur Informatique Tunisie 2026 — web6.tn](https://web6.tn/blog/salaire-ingenieur-informatique-tunisie-2026/)
- [Salaires en Tunisie par secteur — Tanitjobs](https://www.tanitjobs.com/emploi/salaire-tunisie/)
- [Solution Architect Salaries in Tunisia 2026 — TalentUp](https://talentup.io/salary/solution-architect/tunisia)
- [TVA et retenue à la source en Tunisie — Compta Online](https://www.compta-online.com/tunisie-tva-et-retenue-la-source-t56776)
- [Retenue à la Source Tunisie 2026 — web6.tn](https://web6.tn/blog/retenue-a-la-source-tunisie-2026/)
- [Fiscalité applicable aux freelances en Tunisie — Pro Business Center](https://www.pro-businesscenter.com/quelle-est-la-fiscalite-applicable-aux-freelances-en-tunisie-en-2025/)
- Taux de change : Banque Centrale de Tunisie, 15/09/2026 — 1 EUR = 3,3731 TND
