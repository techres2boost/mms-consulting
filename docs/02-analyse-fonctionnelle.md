# 02 — Analyse fonctionnelle

## 2.1 Acteurs

| Acteur | Type | Canal | Rôle |
|---|---|---|---|
| **Utilisateur final (client)** | Externe | App mobile Android/iOS + portail web | Écoute les publicités, accumule des points, les convertit en data |
| **Annonceur (entreprise)** | Externe | Aucun accès direct au MVP (géré par l'opérateur back-office) | Achète des campagnes, fournit les créatifs |
| **Opérateur back-office** | Interne | Web admin | Saisie entreprises/campagnes, upload et validation des créatifs |
| **Manager** | Interne | Web admin | Validation des campagnes, traitement des conversions, KPI |
| **Administrateur** | Interne | Web admin | RBAC, paramètres système, barèmes de points |
| **Analyste (lecture seule)** | Interne | Web admin | Consultation KPI et reporting, aucune écriture |
| **Opérateur télécom** | Externe | Manuel (MVP) → API agrégateur (Phase 3) | Fournit les recharges data |
| **Système (jobs)** | Interne | Cron / queue | Attribution mensuelle, expiration, agrégation, archivage, purge |

**Note de conception :** l'annonceur **n'a pas de portail en MVP**. Ajouter un
self-service annonceur multiplie la surface (auth externe, facturation, modération,
RLS tierce) pour un bénéfice nul tant que vous avez moins de ~30 annonceurs. Prévu en
Phase 4.

---

## 2.2 Domaines fonctionnels

```
┌──────────────────────────────────────────────────────────────────┐
│ D1 IDENTITÉ      inscription, OTP, device binding, consentements  │
│ D2 GÉOGRAPHIE    gouvernorats, délégations, zones, ciblage         │
│ D3 INVENTAIRE    entreprises, campagnes, créatifs, budgets         │
│ D4 DIFFUSION     éligibilité, sélection, plafonds, impressions     │
│ D5 MESURE        événements d'appel, événements pub, agrégats      │
│ D6 VALEUR        wallet, ledger, barèmes, expiration               │
│ D7 RÉCOMPENSES   catalogue, demandes, fulfillment, preuves         │
│ D8 CONFIANCE     attestation, anti-fraude, audit, RBAC             │
│ D9 SYNC          file locale, idempotence, résolution de conflits  │
│ D10 PILOTAGE     KPI, facturation annonceur, exports               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2.3 Workflows

### W1 — Inscription et activation

1. Installation → écran d'onboarding (3 écrans de valeur).
2. **Écran de consentement explicite et granulaire** (obligatoire, cf. §12) :
   - réception de publicités audio (obligatoire — c'est la contrepartie du service) ;
   - zone géographique déclarée (obligatoire pour le ciblage) ;
   - géolocalisation précise (facultatif, **refusable**, non requis au MVP) ;
   - comptage des événements d'appel sur Android (facultatif).
3. Saisie du numéro de téléphone (+216) → OTP SMS 6 chiffres, TTL 5 min, 3 tentatives.
4. Création du profil : gouvernorat obligatoire, délégation facultative, opérateur
   déclaré, langue (AR / FR).
5. **Device binding** : génération d'une paire de clés dans le Keystore Android /
   Secure Enclave iOS, enregistrement de la clé publique côté serveur, attestation
   Play Integrity / App Attest.
6. Création du wallet (solde 0) et du premier `sync_cursor`.
7. Premier téléchargement du *ad bundle* (créatifs de la zone).

**Règles :** 1 seul compte actif par numéro ; un numéro déjà lié à un compte suspendu ne
peut pas être réenregistré sans intervention manuelle ; un `device_installation` ne peut
être lié qu'à 1 compte actif à la fois, et tout changement est journalisé.

### W2 — Appel avec diffusion publicitaire (ALT-D)

```
[Utilisateur]                [App]                        [Serveur]
     │                         │                              │
     │─── ouvre "Appeler" ────►│                              │
     │─── saisit / choisit ───►│                              │
     │                         │ 1. vérifie éligibilité LOCALE │
     │                         │    (plafond fréquence, quota  │
     │                         │     journalier, bundle frais) │
     │                         │ 2. sélectionne créatif local  │
     │                         │    (moteur local, cf. §08)    │
     │◄── écran "connexion" ───│                              │
     │◄── audio 4 s ───────────│ 3. joue le créatif            │
     │                         │ 4. journalise impression      │
     │                         │    (local, signée)            │
     │                         │ 5. lance tel: → appel natif   │
     │═══════ appel GSM natif ═════════════════════════════════│
     │                         │ 6. [Android] écoute l'état    │
     │─── raccroche ──────────►│    d'appel → durée            │
     │                         │ 7. journalise call_event      │
     │                         │ 8. crédit PROVISOIRE affiché  │
     │                         │                              │
     │            ... plus tard, réseau disponible ...          │
     │                         │─── POST /sync (batch signé) ─►│
     │                         │◄── soldes CONFIRMÉS ──────────│
```

**Règles métier :**
- Une impression n'est *complète* que si ≥ 90 % de la durée du créatif a été lue sans
  interruption (perte de focus, appel entrant, coupure audio → `partial`).
- Une impression `partial` n'est **jamais** créditée.
- Plafond de fréquence : par défaut 1 impression par tranche de 10 minutes par
  utilisateur, max 12 impressions créditables par jour (paramétrable).
- Si le bundle local est périmé (> 7 jours) et qu'aucun réseau n'est disponible : les
  créatifs restent jouables mais **non créditables** au-delà de 48 h supplémentaires.
  Cela borne l'exposition en cas d'utilisateur offline permanent.
- Le créatif est joué **sur l'écouteur** (`earpiece`), pas sur le haut-parleur, pour ne
  pas être diffusé à l'entourage.

### W3 — Synchronisation

Voir §10 pour le détail cryptographique. Résumé :
`upload(batch signé, idempotency_key, seq monotone)` → validation serveur (signature,
séquence, horloge monotone, attestation, plafonds, déduplication) → écriture des
`advertisement_impressions` + `calls` → génération des mouvements de ledger → retour du
solde confirmé + nouveau `ad_bundle` + nouvelles règles de plafond.

### W4 — Cycle de vie d'une campagne

```
draft ──► pending_review ──► approved ──► active ──► paused ──► active
                 │                          │
                 └──► rejected              ├──► completed (date fin / budget épuisé)
                                            └──► expired
   completed/expired ──(90 j)──► archived ──(180 j)──► audio_purged
```

- `draft` : saisie par l'opérateur back-office, créatif uploadé mais non transcodé.
- `pending_review` : transcodage terminé, contrôles automatiques passés (durée, format,
  loudness, absence de silence total), en attente de validation humaine.
- `approved` : validée par un manager, attend sa date de début.
- `active` : dans la fenêtre de dates, budget disponible, au moins une zone ciblée.
- `paused` : retirable/réactivable sans perte d'historique.
- `completed` / `expired` : plus diffusable, statistiques conservées **indéfiniment**.
- `archived` : fichier audio déplacé en stockage froid.
- `audio_purged` : fichier supprimé, métadonnées et statistiques conservées (obligation
  de facturation et d'audit — cf. §09 et §12).

### W5 — Conversion points → data

1. L'utilisateur consulte le catalogue (`data_packages` actifs pour son opérateur).
2. Il demande une conversion → contrôle du solde **confirmé** (jamais provisoire).
3. **Débit immédiat et atomique** du ledger, dans la même transaction que la création de
   la `reward_redemption` en statut `pending`.
4. MVP : la demande apparaît dans une file back-office ; un opérateur exécute la recharge
   chez l'opérateur télécom et saisit la référence.
5. `fulfilled` → notification push + preuve consultable.
6. En cas d'échec (`failed`) : **reversal** automatique au ledger (mouvement de
   compensation, jamais une suppression), notification, et incident tracé.

**Règles :** pas de conversion si le compte est `suspended` ou si un `fraud_event` de
sévérité ≥ `high` est ouvert ; délai d'attente de 72 h après l'inscription (anti
création-conversion-jetable) ; 1 conversion en cours maximum par utilisateur.

### W6 — Attribution périodique et expiration

Jobs planifiés (cf. §06) :
- **Quotidien 02:00** : agrégation des impressions de J-1 en `daily_*_stats`, calcul de la
  consommation de budget, passage automatique en `completed` des campagnes épuisées.
- **Quotidien 03:00** : détection d'anomalies (§13), ouverture de `fraud_events`.
- **Mensuel J1 00:30** : bonus de fidélité (part « Modèle A » du barème hybride) pour les
  comptes actifs et non suspendus.
- **Quotidien 04:00** : expiration des points de plus de 12 mois (FIFO), par mouvement de
  ledger `expiration`.
- **Hebdomadaire** : archivage des campagnes terminées depuis 90 j ; purge audio à 180 j.

---

## 2.4 Règles métier transverses

| # | Règle | Motif |
|---|---|---|
| R1 | Le client ne peut **jamais** écrire dans `points_wallets` ni `points_ledger`. Tout mouvement passe par une fonction serveur | Intégrité de la valeur |
| R2 | Tout événement client porte une `idempotency_key` et est rejeté en doublon silencieux | Anti-rejeu |
| R3 | Les horodatages client sont **conservés à titre indicatif** ; seuls les horodatages serveur font foi pour l'expiration et la facturation | Anti-manipulation d'horloge |
| R4 | Le ledger est **append-only** : aucune ligne n'est modifiée ni supprimée. Une correction est un mouvement inverse | Auditabilité |
| R5 | Le solde affiché distingue toujours **confirmé** et **en attente** | Confiance utilisateur + anti-fraude |
| R6 | Un créatif n'est diffusable que si `campaign.status = active` **et** la zone de l'utilisateur est ciblée **et** le budget restant > 0 | Facturation correcte |
| R7 | Le numéro du correspondant n'est **jamais** transmis ni stocké côté serveur | Minimisation des données (§12) |
| R8 | Toute action back-office modifiant de la valeur ou un statut client est écrite dans `audit_logs` avec l'acteur, l'avant/après et la raison | Conformité |
| R9 | Les barèmes (points/impression, plafonds, grille de conversion) sont des **données**, pas du code | Pilotage sans redéploiement |
| R10 | Tout débit de points requiert un solde confirmé suffisant ; le solde ne peut jamais devenir négatif (contrainte de base) | Intégrité |
