# 03 — User Journeys

Neuf parcours, avec les états système et les points de rupture.

---

## UJ1 — Inscription (Amira, 24 ans, Ariana, Ooredoo, Android entrée de gamme)

| # | Action | Système | Point de rupture |
|---|---|---|---|
| 1 | Installe depuis le Play Store | — | Taille de l'APK : cible < 25 Mo |
| 2 | 3 écrans d'onboarding (AR par défaut) | — | Doit dire **combien** de Go on peut gagner, sinon abandon |
| 3 | Écran de consentement | 4 cases, 2 obligatoires | Si tout est obligatoire → rejet INPDP et rejet store |
| 4 | Saisit `+216 2X XXX XXX` | `POST /auth/otp` → SMS | **Coût SMS réel** (~0,03–0,08 USD). Rate-limit : 3/h/numéro, 10/j/IP |
| 5 | Saisit l'OTP | JWT + refresh token | Renvoi possible après 60 s |
| 6 | Choisit gouvernorat = Ariana, opérateur = Ooredoo | `profiles` créé | Le gouvernorat conditionne tout le ciblage |
| 7 | — | Génération clé Keystore, `device_installations`, attestation Play Integrity | Si verdict d'intégrité négatif → compte en mode `limited` (0 point) plutôt que refus, pour ne pas perdre les vrais utilisateurs sur devices exotiques |
| 8 | — | `points_wallets` créé, solde 0 | |
| 9 | — | Téléchargement du bundle : ~20 créatifs Opus ≈ **320 Ko** | Doit réussir en 3G |
| 10 | Arrive sur le dashboard | Solde 0, message d'amorçage | **Bonus de bienvenue de 20 points** pour créer la première sensation de valeur |

**Durée cible : < 90 secondes.**

---

## UJ2 — Premier appel (en ligne)

1. Amira appuie sur « Appeler » → choisit un contact (accès contacts **facultatif** ;
   sinon clavier numérique).
2. L'app vérifie *localement* : quota journalier, plafond de fréquence, fraîcheur du
   bundle. → éligible.
3. Le moteur local sélectionne un créatif (§08) : campagne « Restaurant XYZ », zone
   Ariana.
4. Écran plein : nom de l'annonceur, compte à rebours de 4 s, bouton « Passer »
   **désactivé** (mais visible, avec explication) et bouton « Annuler l'appel » actif.
5. Lecture sur l'écouteur. Suivi de progression toutes les 250 ms.
6. À 100 % : `advertisement_impressions` local, statut `complete`, `idempotency_key`
   = UUIDv4, signature par la clé du device.
7. `tel:+216XXXXXXXX` → l'OS lance l'appel. L'app passe en arrière-plan.
8. Plugin natif Android : `CALL_STATE_OFFHOOK` à t0, `CALL_STATE_IDLE` à t1 →
   durée = t1 − t0, mesurée sur l'horloge **monotone** (`elapsedRealtimeNanos`).
9. Retour dans l'app : « +2 points (en attente de validation) ».
10. Sync immédiate (réseau présent) → solde confirmé en < 2 s.

**Sur iOS, les étapes 8 et 9 diffèrent :** aucune durée n'est mesurable, aucun retour de
l'OS. Le crédit est basé **uniquement** sur l'impression (étape 6), ce qui est le
comportement voulu par le barème (§11) — mais il faut assumer qu'un utilisateur iOS peut
écouter la pub et ne pas appeler. Contre-mesure : plafonds de fréquence stricts + détection
d'anomalie sur le ratio impressions/heures d'usage (§13).

---

## UJ3 — Appel hors ligne (Bilel, Sfax, pas de data active)

1. Ouvre l'app. Bandeau « Mode hors ligne — dernière synchro il y a 2 j ».
2. Appuie sur « Appeler ». Le bundle local est frais (< 7 j) → éligible.
3. Créatif joué depuis le cache local. Impression journalisée en base locale (SQLite),
   `synced = false`, `seq = 47`, signée.
4. Appel natif. Durée mesurée (Android).
5. Solde affiché : **« 128 points confirmés · +6 en attente »**. La distinction est
   permanente et explicite dans l'UI.
6. Bilel fait 9 appels sur 2 jours hors ligne → 9 impressions en file.
7. Au retour du réseau (UJ4), le serveur valide, applique le plafond journalier
   (max 12/j) et confirme 9 crédits.

**Bornes de sécurité :** la file locale est plafonnée à 500 événements ; au-delà, les plus
anciens non synchronisés sont conservés mais marqués `over_quota` et ne créditent pas.
Au-delà de 7 jours sans synchro, les impressions continuent d'être *jouées* (le service
fonctionne) mais sont marquées `stale` et créditées à **taux réduit ou nul** selon
paramètre — décision produit à trancher, techniquement les deux sont supportés.

---

## UJ4 — Synchronisation

```
1. Déclencheurs : app au premier plan + réseau, retour de connectivité,
   toutes les 4 h en tâche de fond (WorkManager / BGTaskScheduler),
   et avant toute demande de conversion.

2. POST /functions/v1/sync
   {
     device_id, install_id,
     attestation: { play_integrity_token | app_attest_assertion },
     cursor: { last_server_seq: 120 },
     batch: [
       { seq:46, type:"ad_impression", idem:"...", payload:{...},
         t_mono_ns: 918273645, boot_id:"...", t_wall:"2026-09-18T10:02Z",
         sig:"..." },
       ...
     ]
   }

3. Validations serveur, dans cet ordre (échec = rejet de l'événement,
   pas du batch entier) :
   a. signature valide pour la clé publique de cette installation
   b. seq strictement croissant, aucun trou non expliqué
   c. idempotency_key inconnue (sinon : ignoré, compté comme succès)
   d. boot_id + t_mono_ns cohérents (pas de recul du temps monotone)
   e. écart t_wall / horloge serveur < 24 h (sinon : accepté mais marqué
      clock_skew, et l'horodatage serveur prévaut)
   f. campagne référencée existante, active à la date serveur, zone compatible
   g. plafonds : fréquence, quota journalier, quota mensuel
   h. verdict d'attestation acceptable

4. Écriture : advertisement_impressions + calls + points_ledger,
   dans UNE transaction.

5. Réponse
   {
     accepted:[46,47,48], rejected:[{seq:49, reason:"daily_cap"}],
     wallet:{ confirmed:134, pending:0 },
     new_cursor:126,
     ad_bundle:{ version:"2026-09-19T08:00Z", ads:[...] },
     policy:{ freq_cap_minutes:10, daily_cap:12 }
   }

6. L'app marque les événements acceptés comme synchronisés et PURGE
   ses crédits provisoires au profit du solde serveur (le serveur fait foi).
```

**Résolution de conflits :** il n'y a pas de conflit au sens d'une édition concurrente.
Le client produit des **faits déclarés**, le serveur produit des **faits validés**. En cas
de divergence de solde, **le serveur gagne toujours et sans négociation**. L'app affiche
un message neutre si l'écart est important, et un `fraud_event` de faible sévérité est
ouvert si l'écart dépasse un seuil.

---

## UJ5 — Réception d'une publicité (vue annonceur)

1. Le manager active la campagne « Restaurant XYZ » (Ariana + Tunis, 15/09 → 15/10,
   budget 800 TND, fréquence max 3/jour/utilisateur).
2. Job d'invalidation du bundle : les utilisateurs d'Ariana et Tunis reçoivent une
   nouvelle `ad_bundle.version` à leur prochaine synchro.
3. Les créatifs se propagent en 0 à 4 h (délai de la tâche de fond). **Il n'y a pas de
   diffusion temps réel** — c'est une conséquence assumée de l'offline-first, et elle doit
   être écrite dans le contrat annonceur (pas de campagne « flash » à l'heure).
4. Les impressions remontent par batchs. **La facturation se fait sur les impressions
   validées côté serveur, avec un décalage pouvant atteindre 7 jours.** Le contrat doit
   prévoir un arrêté mensuel, pas un temps réel.
5. Le back-office affiche impressions, reach (utilisateurs uniques), répartition par
   zone, fréquence moyenne, budget consommé.

---

## UJ6 — Attribution des points

Barème hybride (§11), tout paramétrable :

| Origine | Montant | Conditions |
|---|---|---|
| Impression complète validée | **2 points** | ≥ 90 % du créatif, plafonds respectés |
| Bonus appel confirmé ≥ 30 s (Android) | **1 point** | Détection d'appel active, max 10/jour |
| Bonus de fidélité mensuel | **20 points** | ≥ 10 jours actifs sur le mois, non suspendu |
| Bonus de bienvenue | **20 points** | 1 fois, à l'inscription vérifiée |
| Parrainage | **30 points** | Filleul vérifié + 5 impressions validées (anti-fraude) |

Plafond : **12 impressions créditables/jour**, soit un maximum théorique de
~24 + 10 = 34 points/jour, ~700/mois. **Ce plafond est le principal instrument de
contrôle du COGS** (§16) : il doit être dimensionné à partir du revenu publicitaire réel,
pas de la générosité souhaitée.

---

## UJ7 — Conversion points → data

1. Amira a 520 points confirmés. Catalogue Ooredoo : 100 pts → 500 Mo, 250 pts → 1,5 Go,
   500 pts → 3 Go.
2. Choisit 500 pts → 3 Go. Écran de confirmation : solde avant/après, délai annoncé
   (« sous 24 h ouvrées »), numéro à créditer (préremplitmais **modifiable uniquement vers
   un numéro vérifié**).
3. `POST /redemptions` : transaction atomique →
   `points_ledger` (débit 500, type `redemption`) + `reward_redemptions` (statut
   `pending`). Solde : 20 points.
4. Back-office : la demande apparaît dans la file « Conversions à traiter », avec un
   contrôle anti-fraude automatique (score du compte, ancienneté, ratio).
5. **MVP — manuel :** l'opérateur exécute la recharge chez Ooredoo, saisit la référence
   et une preuve (capture/reçu). Statut → `fulfilled`.
6. Push : « Vos 3 Go sont activés. Réf. OOR-88213 ».
7. **Phase 3 — automatique :** appel API agrégateur, statut `processing` → webhook →
   `fulfilled` ou `failed`. En cas d'échec : mouvement de ledger `reversal` de +500,
   notification, `fraud_events` non impacté.

**Rupture principale :** l'étape 5 est un **coût humain linéaire**. À 1 000 conversions/mois,
c'est un temps plein. L'automatisation n'est pas un luxe de Phase 3, c'est une condition de
scalabilité au-delà de ~2 000 utilisateurs actifs. À budgéter tôt.

---

## UJ8 — Gestion d'une campagne (opérateur back-office)

1. Recherche l'entreprise ou la crée (raison sociale, matricule fiscal, contact, zone).
2. Crée la campagne : nom, dates, budget, zones (multi-select gouvernorats +
   délégations), fréquence max, priorité, modèle de facturation (CPM ou forfait).
3. Upload du créatif : glisser-déposer. Contrôles **immédiats côté client** (durée,
   format) puis **revalidation côté serveur** (jamais confiance au client).
4. Job de transcodage : Opus 32 kbps mono + normalisation de loudness (−16 LUFS) +
   génération d'une waveform de prévisualisation + calcul du hash.
5. Contrôles automatiques : durée dans [2 s, 8 s], pas de silence > 50 % de la durée,
   pic < 0 dBFS, taille < 200 Ko après transcodage.
6. Statut `pending_review`. Écoute + validation par un **manager** (séparation des
   rôles : celui qui saisit ne valide pas).
7. `approved` → `active` à la date de début (job).
8. Suivi : impressions, reach, budget consommé, coût par zone. Export CSV.

---

## UJ9 — Gestion des employés (administrateur)

1. Crée un employé : e-mail professionnel, rôle, zones autorisées (facultatif — un
   opérateur peut être limité à un périmètre géographique).
2. Invitation par e-mail → définition du mot de passe + **MFA obligatoire** pour tous les
   rôles internes.
3. Permissions dérivées du rôle (§14), jamais individuelles au MVP.
4. Toute action est journalisée. Un administrateur ne peut pas supprimer ses propres
   logs (RLS + `REVOKE DELETE`).
5. Révocation : désactivation immédiate + invalidation des sessions (rotation du secret
   ou `auth.sessions` purgée pour cet utilisateur).
