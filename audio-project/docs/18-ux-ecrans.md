# 18 — UX et écrans

## 18.1 Principes de conception pour ce marché

| Principe | Raison |
|---|---|
| **Arabe par défaut**, français en option, **RTL natif** | Marché tunisien. Le RTL doit être pensé dès le design system, pas rétrofitté |
| **Fonctionne sur 3G et sur écran de 5 pouces** | Le parc réel : Samsung A0x/A1x, Redmi 9/10, Tecno, Infinix |
| **Le solde est toujours visible** | C'est la raison d'être de l'app |
| **Distinction confirmé / en attente, permanente** | Évite 80 % des demandes au support |
| **Aucun écran ne nécessite Internet** sauf conversion | Cohérent avec §10 |
| **Le deal est annoncé explicitement** | « Écoutez 4 s, gagnez 1 point » : la transparence est ce qui rend le modèle acceptable |
| **Jamais de récompense présentée comme de l'argent** | Conformité store (§05) et loi |

---

## 18.2 Application mobile

### 1. Onboarding (3 écrans)

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│                     │  │                     │  │                     │
│   [illustration]    │  │   [illustration]    │  │   [illustration]    │
│                     │  │                     │  │                     │
│  Appelez, gagnez    │  │  4 secondes, c'est  │  │  ~150 Mo par mois   │
│  de la data         │  │  tout               │  │                     │
│                     │  │                     │  │  Convertissez vos   │
│  Écoutez une courte │  │  Une annonce locale │  │  points en data      │
│  annonce avant vos  │  │  avant que l'appel  │  │  chez votre          │
│  appels et cumulez  │  │  ne démarre. Puis   │  │  opérateur.          │
│  des points.        │  │  votre appel normal.│  │                     │
│                     │  │                     │  │                     │
│      ● ○ ○          │  │      ○ ● ○          │  │      ○ ○ ●          │
│     [Suivant]       │  │     [Suivant]       │  │   [Commencer]       │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

**Le troisième écran doit annoncer un chiffre réaliste** (§16 : ~150 Mo/mois en ALT-D).
Promettre « 3 Go gratuits » puis délivrer 150 Mo est le plus sûr moyen de récolter des
notes de 1 étoile. La promesse doit être calée sur l'économie unitaire.

### 2. Consentement

```
┌──────────────────────────────────────────┐
│  Avant de commencer                      │
├──────────────────────────────────────────┤
│  ☑ Recevoir des annonces audio           │
│    Nécessaire au fonctionnement du       │
│    service — c'est la contrepartie des   │
│    points.                    [Détails]  │
│                                          │
│  ☑ Ma région (gouvernorat)               │
│    Pour vous proposer des annonces de    │
│    commerces proches.         [Détails]  │
│                                          │
│  ☐ Compter mes appels          (Android) │
│    Facultatif. Nous ne voyons JAMAIS     │
│    les numéros que vous appelez.         │
│                               [Détails]  │
│                                          │
│  ☐ Notifications                         │
│    Vous prévenir quand vos points sont   │
│    validés.                              │
│                                          │
│  [Politique de confidentialité]          │
│                                          │
│           [ Continuer ]                  │
└──────────────────────────────────────────┘
```

**Deux points non négociables :** les cases facultatives doivent être **réellement
refusables** sans dégrader l'accès au service, et la mention « nous ne voyons jamais les
numéros que vous appelez » doit être **vraie** (elle l'est, §12) et mise en avant — c'est
un argument de confiance différenciant.

### 3–4. Compte et vérification

Saisie du numéro (+216 préfixé, clavier numérique) → OTP 6 chiffres avec saisie
automatique depuis le SMS, renvoi après 60 s (puis 180 s, 600 s).

### 5. Dashboard (écran d'accueil)

```
┌──────────────────────────────────────────┐
│  Bonjour Amira            [⚙]            │
├──────────────────────────────────────────┤
│  ┌────────────────────────────────────┐  │
│  │        152 points                  │  │
│  │        + 3 en attente de validation│  │
│  │                                    │  │
│  │  ≈ 115 Mo disponibles              │  │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░  152/380        │  │
│  │  228 points avant 300 Mo           │  │
│  └────────────────────────────────────┘  │
│                                          │
│         ╭────────────────────╮           │
│         │   📞  APPELER      │           │
│         ╰────────────────────╯           │
│                                          │
│  Aujourd'hui   4/6 annonces écoutées     │
│  ▓▓▓▓░░                                  │
│                                          │
│  ┌──────────┬──────────┬──────────────┐  │
│  │ Points   │ Data     │ Historique   │  │
│  └──────────┴──────────┴──────────────┘  │
│                                          │
│  ⚠ Hors ligne — dernière synchro il y a  │
│    2 h. Vos points seront validés au     │
│    retour du réseau.                     │
└──────────────────────────────────────────┘
```

**Éléments de conception importants :**
- Le **compteur « 4/6 annonces »** rend le plafond transparent. Un plafond caché est vécu
  comme un bug ; un plafond affiché est vécu comme une règle du jeu.
- La **barre de progression vers le prochain palier** est le mécanisme de rétention le
  plus efficace, et il coûte trois lignes de code.
- Le **bandeau hors ligne** est explicatif, pas alarmant.

### 6. Écran de diffusion

```
┌──────────────────────────────────────────┐
│                                          │
│           Connexion en cours…            │
│                                          │
│         ┌────────────────────┐           │
│         │   Restaurant XYZ   │           │
│         │    [logo / icône]  │           │
│         └────────────────────┘           │
│                                          │
│              ◉ 4 s                       │
│         ▓▓▓▓▓▓▓▓░░░░░░░░                 │
│                                          │
│         🔊 Annonce en cours              │
│         +1 point                         │
│                                          │
│                                          │
│         [ Annuler l'appel ]              │
│                                          │
│  Vous ne pouvez pas passer l'annonce,    │
│  mais vous pouvez annuler l'appel.       │
└──────────────────────────────────────────┘
```

**C'est l'écran le plus délicat du produit.** Décisions :
- Pas de bouton « Passer » : ce serait contradictoire avec le modèle. Mais **le dire
  explicitement** plutôt que de l'omettre — un utilisateur qui cherche un bouton absent
  est frustré ; un utilisateur à qui on explique comprend.
- Le bouton « Annuler l'appel » **doit exister et fonctionner**. Retenir l'utilisateur de
  force pendant 4 s génère de la colère et des désinstallations. L'annulation produit une
  impression `partial`, non créditée — le système est déjà conçu pour cela.
- Le nom de l'annonceur est affiché : cela donne de la valeur à l'annonceur et de la
  transparence à l'utilisateur.
- Ne jamais afficher de compte à rebours trompeur : 4 s annoncées = 4 s réelles.

### 7. Points et historique

Liste chronologique issue de `points_ledger`, avec l'origine lisible :

```
19/09  14:32   +1    Annonce — Restaurant XYZ        152
19/09  14:18   +1    Annonce — Pharmacie Nour        151
19/09  11:02   −130  Conversion → 100 Mo Ooredoo     150
                     Réf. OOR-88213  [Voir la preuve]
01/09  00:30   +10   Bonus de fidélité — septembre   280
...
[Filtrer ▾]  [Exporter]
```

**Le ledger rend cet écran gratuit à construire** et il supprime l'essentiel des questions
au support. C'est le retour sur investissement direct du choix d'architecture du §11.

### 8–9. Récompenses et conversion

```
┌──────────────────────────────────────────┐
│  Convertir mes points          152 pts   │
├──────────────────────────────────────────┤
│  Opérateur : Ooredoo             [▾]     │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 100 Mo              130 points  ✓  │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │ 300 Mo              380 points     │  │
│  │ il vous manque 228 points          │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │ 1 Go               1250 points     │  │
│  │ Meilleure valeur ★                 │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Crédité sur  +216 2X XXX XX8            │
│  (votre numéro vérifié)                  │
│                                          │
│  Délai : sous 24 h ouvrées               │
│                                          │
│         [ Convertir 130 points ]         │
└──────────────────────────────────────────┘
```

- Les paliers inaccessibles sont **affichés avec le manque** : c'est un moteur de
  rétention, pas une frustration.
- Le numéro cible n'est **pas modifiable** vers un numéro non vérifié (§13, contre-mesure
  anti multi-comptes la plus efficace).
- Le délai est **annoncé honnêtement** (traitement manuel en MVP).

### 10–12. Profil, paramètres, aide

- **Profil** : nom, gouvernorat, opérateur, langue, numéro (masqué).
- **Paramètres** : consentements révocables par finalité, notifications, forcer une
  synchronisation, **exporter mes données**, **supprimer mon compte**.
- **Aide** : FAQ hors ligne, « pourquoi mes points sont-ils en attente ? »,
  « pourquoi ai-je moins de points sur iPhone ? » (**à écrire honnêtement**), contact,
  **formulaire de recours anti-fraude**.

---

## 18.3 Portail web client

Même logique, sans la diffusion publicitaire (impossible et inutile sur le web) :
`/login` (OTP), `/dashboard`, `/points`, `/rewards`, `/history`, `/profile`,
`/privacy` (export et suppression), `/help`.

**Intérêt réel** : consulter son solde sans l'app, et disposer d'un canal de recours si
l'app est en mode `limited`. **À ne pas construire au MVP** : coût non nul, valeur faible
tant qu'il n'y a pas de volume de support. Phase 2.

---

## 18.4 Back-office

Arborescence complète en [§14](14-back-office-rbac.md#141-arborescence).

Rappel de priorisation : les deux écrans à concevoir **en premier** et à optimiser pour la
vitesse d'exécution sont `/rewards/redemptions` (le coût humain récurrent) et
`/campaigns/review` (la qualité de l'inventaire). Le dashboard KPI est agréable mais il
ne fait pas tourner l'exploitation.

---

## 18.5 Accessibilité et qualité

| Exigence | Détail |
|---|---|
| RTL | Complet, testé en arabe, y compris les nombres et les graphiques |
| Contraste | WCAG AA minimum — les écrans sont consultés en extérieur, au soleil |
| Taille de police | Respecter le réglage système ; ne jamais fixer en pixels |
| Lecteur d'écran | Libellés sur tous les contrôles ; l'écran de diffusion doit annoncer sa durée |
| Cible tactile | ≥ 44 px — le bouton « Appeler » est le plus utilisé de l'app |
| Mode sombre | Souhaitable, non bloquant au MVP |
| Démarrage à froid | **< 3 s** sur Samsung A14 — critère de sortie du POC (§05) |
| Taille de l'APK | **< 25 Mo** |
| Consommation batterie | Tâche de fond ≤ 4×/jour, jamais de service persistant |
