# Présentation client — Call Com

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
