# Présentations

## 1. Présentation client — Call Com

`Call_Com_Faisabilite_Technique.pptx` — 15 slides, destinées à être présentées au
porteur du projet. Volontairement **sans détail technique** : elle explique ce qui est
faisable, à quelles conditions, et quelles décisions sont attendues.

## Structure

| # | Slide | Message |
|---|---|---|
| 1 | Titre | Réponse aux §18 et §24 de la spécification |
| 2 | Le scénario demandé | L'auditeur est l'appelant, pas l'utilisateur — deux personnes différentes |
| 3 | Le verdict | Non au mécanisme tel que décrit ; oui au produit, par deux voies |
| 4 | Pourquoi | La tonalité d'attente est produite par le réseau, pas par le téléphone appelé |
| 5 | Les pistes applicatives | Quatre pistes examinées puis écartées |
| 6 | Deux voies ouvertes | Voie A opérateur / Voie B plateforme |
| 7 | Voie A | Ce qu'il faut demander à l'opérateur, et le chemin en 6 étapes |
| 8 | Voie B | Réalisable, mais trois points durs |
| 9 | Comparaison | 13 critères, sans préférence a priori |
| 10 | La bonne nouvelle | 80 % du produit est constructible dès maintenant |
| 11 | ⚠️ Risque business | Blyk et RingPlus — à valider par Call Com |
| 12 | Le barème du §8.4 chiffré | Marge selon le prix annonceur |
| 13 | Trois contraintes | Données personnelles, consentement de l'appelant, réglementation |
| 14 | Recommandation | Prototype en 3 étapes |
| 15 | Décisions attendues | Quatre décisions qui appartiennent à Call Com |

**Chaque slide porte des notes de présentateur** (15/15) avec l'angle à adopter à l'oral.

## Positionnement

Le risque business (slide 11) est présenté comme une **information signalée**, pas comme
un jugement : la décision appartient au porteur du projet. Les slides 3, 5, 6, 8 et 14
relèvent en revanche pleinement de l'analyse technique.

## Régénérer ou modifier

```bash
npm install pptxgenjs
node generate-deck.js
```

Le script est autonome (aucune ressource externe, aucune image). Palette, polices et
contenu sont en tête de fichier.

## Contrôles passés

- `validate.py` — schéma, relations, types de contenu, graphiques : **tout passe**
- Audit géométrique des 15 slides (débordement de texte, dépassement de cadre) :
  **aucun problème**
- Aucun texte de remplissage résiduel
- Graphique natif PowerPoint (pas une image), palette séquentielle validée pour le
  contraste et la lisibilité en vision des couleurs déficiente

> **Note :** LibreOffice étant non fonctionnel dans l'environnement de production de ce
> dossier, le contrôle visuel a été fait par un rendu maison (`python-pptx` + Pillow,
> police Liberation Sans, plus large que Calibri — donc contrôle conservateur sur les
> débordements). Le graphique de la slide 12 est rendu comme un cadre dans ce contrôle :
> il n'a pas pu être inspecté visuellement, seulement validé structurellement.
> **À ouvrir une fois dans PowerPoint avant de le présenter.**


---

## 2. Pitch Orange — première rencontre (5 minutes) · v2.0

`Call_Com_Orange_Premiere_Rencontre_5min.pptx` — 9 slides (7 + 2 de réserve), minutées,
avec notes de présentateur. Présentée **par Call Com et son consultant technique devant
Orange Tunisie**.

> **v2.0 — changement de posture.** La v1.0 demandait un POC en première réunion. La v2.0
> demande **une validation de faisabilité de principe et une réunion technique**. Le POC
> vient après. Une slide a été ajoutée : « ce que nous affirmons / ce que nous supposons /
> ce que nous ignorons » — c'est elle qui établit la crédibilité devant des ingénieurs.

| # | Slide | Minutage | Message |
|---|---|---|---|
| 1 | Titre | — | « 5 minutes, 3 questions, 1 demande » |
| 2 | L'inventaire qui dort | 0:00–0:45 | 5 à 10 s d'espace audio par appel, zéro revenu |
| 3 | **Le précédent chiffré** | 0:45–1:45 | Turkcell Tone&Win : 50 marques, 72 campagnes, 200 000+ membres, ~20 min/abonné/mois. Et « Yesss! » dans le groupe Orange |
| 4 | **Ce que nous affirmons / supposons / ignorons** | 1:45–2:45 | **La slide de crédibilité.** Trois colonnes : établi et sourcé · à confirmer par vous · et c'est pourquoi nous sommes là |
| 5 | La répartition proposée | 2:45–3:45 | La décision de quoi diffuser reste chez Orange ; Call Com apporte la force de vente annonceurs |
| 6 | Notre demande | 3:45–4:30 | Une réunion technique + 3 réponses. **Pas un POC.** Plus 4 engagements pris spontanément |
| 7 | Les trois questions | 4:30–5:00 | Varier par appelant/zone ? · Diffuser à votre propre abonné ? · Durée réellement écoutée ? |
| 8 | *Réserve* — variantes A / B | — | Qui entend l'annonce : l'appelant ou votre abonné |
| 9 | *Réserve* — trois scénarios d'intégration | — | Pré-provisionnement recommandé ; « latence ajoutée : aucune » |

### Comment l'utiliser

- **Slide 3 : prendre son temps.** Laisser un silence après la liste des marques, puis
  enchaîner sur « Yesss! ». C'est ce qui désamorce la moitié des objections.
- **Slide 4 : c'est la plus importante devant des ingénieurs.** La troisième colonne
  (ce que nous ignorons) est ce qui rend les deux premières crédibles. **Ne jamais
  affirmer connaître leur architecture.**
- **Slide 6 : énoncer les 4 engagements avant qu'on les demande.** Et bien dire que le POC
  n'est pas la demande du jour.
- **Slide 7 : s'arrêter là.** La liste longue de questions techniques est préparée pour la
  réunion suivante — la mentionner, ne pas la dérouler.

### Régénérer

```bash
npm install pptxgenjs
node generate-deck-orange-5min.js
```

### Contrôles passés

- `validate.py` : tout passe · audit géométrique des 9 slides : aucun débordement
- Aucun glyphe à risque de substitution de police
- ⚠️ **LibreOffice étant non fonctionnel dans cet environnement, aucun rendu de référence
  n'a pu être produit.** Contrôle visuel via un rendu maison (`python-pptx` + Pillow,
  police plus large que Calibri — contrôle conservateur).
  **À ouvrir une fois dans PowerPoint avant de présenter.**
