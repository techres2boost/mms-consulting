# 12 — Sécurité, données personnelles, conformité

## 12.1 Authentification

| Élément | Choix | Détail |
|---|---|---|
| Méthode | **OTP SMS sur numéro tunisien** | Pas d'e-mail : une partie de la cible n'en a pas d'usage courant |
| Fournisseur | Supabase Auth + agrégateur SMS | Préférer un agrégateur **local** (coût et conformité Sender ID) |
| Access token | JWT, TTL **1 heure** | Court : limite la fenêtre d'exploitation d'un token volé |
| Refresh token | Rotation à chaque usage, TTL 30 j | La rotation détecte le vol : un refresh réutilisé invalide la famille |
| Session mobile | Stockée dans le Keystore / Keychain, **jamais** dans `localStorage` | Un WebView Capacitor sans précaution stocke en clair |
| Back-office | E-mail + mot de passe + **MFA obligatoire** | Non négociable : ces comptes peuvent ajuster des points |
| Brute force | Rate-limit sur OTP : 3/h/numéro, 10/j/IP ; CAPTCHA au 3ᵉ essai | Voir aussi « SMS pumping » ci-dessous |
| Verrouillage | 5 OTP échoués → blocage 30 min | Journalisé |

### Le risque à traiter dès le premier jour : le *SMS pumping*

Un attaquant automatise des demandes d'OTP vers des numéros surtaxés qu'il contrôle et
touche une part du revenu de terminaison. La facture peut atteindre plusieurs milliers
d'euros en une nuit. Ce n'est pas un risque théorique, c'est l'attaque la plus fréquente
sur ce type d'authentification.

**Contre-mesures, toutes obligatoires :**
1. Rate-limit multi-dimension : par numéro, par préfixe, par IP, par empreinte d'appareil.
2. **Plafond de dépense quotidien configuré chez le fournisseur SMS** — le filet de
   sécurité ultime.
3. N'autoriser que les préfixes mobiles tunisiens valides (`+2162x`, `+2164x`, `+2165x`,
   `+2169x` selon le plan de numérotation en vigueur — à vérifier).
4. Alerte si le volume d'OTP dépasse 3× la moyenne glissante sur une heure.
5. Délai croissant entre les renvois : 60 s, 180 s, 600 s.

---

## 12.2 Protection des points — répondre à votre exigence

> *« Le client ne doit jamais pouvoir faire `UPDATE wallets SET points = 999999` »*

**Quatre couches, indépendantes :**

```
Couche 1 — RLS : aucune policy d'écriture sur points_wallets ni points_ledger.
            Le client ne peut que SELECT ses propres lignes.
            Une requête UPDATE ne renvoie même pas d'erreur : 0 ligne affectée.

Couche 2 — Privilèges : REVOKE INSERT, UPDATE, DELETE ON points_ledger
            FROM anon, authenticated. Même sans RLS, le rôle n'a pas le droit.

Couche 3 — Triggers : ledger_guard() bloque tout UPDATE (hors marquage d'expiration)
            et tout DELETE, y compris pour le propriétaire de la base.

Couche 4 — Chaînage de hash : une modification passée en force (par un administrateur
            de base désactivant les triggers) est DÉTECTÉE par verify_ledger_chain().
```

**Ces quatre couches sont vérifiées par les tests T7, T8, T9, T10 et T13 de
[`sql/tests/test_ledger.sql`](sql/tests/test_ledger.sql), exécutés avec succès.**

Le test T10 est le plus instructif : il simule un attaquant ayant les droits de base de
données, qui désactive le trigger et modifie un montant. **La modification réussit, mais
elle est détectée**, avec la ligne exacte pointée. C'est la propriété honnête à
revendiquer : **détection de falsification, pas prévention absolue**. Personne ne peut
prévenir une altération par un administrateur de base ; on peut la rendre impossible à
dissimuler.

**Le seul chemin d'écriture de valeur** est `post_ledger_entry()`, `SECURITY DEFINER`
avec `search_path` figé, appelable uniquement par le rôle de service depuis les Edge
Functions.

---

## 12.3 Stockage et URLs signées

| Contrôle | Mise en œuvre |
|---|---|
| Bucket **privé** | Obligatoire. Un bucket public rendrait les créatifs énumérables, y compris avant leur date de début |
| URLs signées | TTL 7 jours, générées par l'Edge Function `/ad-bundle` |
| Chemins non devinables | `{ad_id}` en UUID, jamais de nom de fichier séquentiel |
| Preuves de conversion | Bucket séparé, TTL 15 min, accessible aux seuls employés ayant `redemptions:read` |
| Upload | **Jamais** depuis le client mobile. Uniquement depuis le back-office authentifié |
| Validation | Magic bytes + transcodage systématique (§09) |

---

## 12.4 API : rate limiting et abus

| Endpoint | Limite | Motif |
|---|---|---|
| `POST /auth/otp` | 3/h/numéro, 10/j/IP | SMS pumping |
| `POST /sync` | 12/h/installation, batch ≤ 100 | Empêche le *flooding* d'événements |
| `GET /ad-bundle` | 24/j/installation | Évite le gaspillage d'egress |
| `POST /redemptions` | 3/j/utilisateur | Combiné avec l'index « une seule ouverte » |
| `POST /attest` | 6/j/installation | |
| PostgREST (lecture) | Limite globale Supabase + pagination forcée | Ne jamais exposer un `select *` non borné |

Mise en œuvre : table `rate_limits(key, window_start, count)` avec `UPSERT`, ou
compteur dans le KV de l'Edge runtime. **Réponse `429` avec `Retry-After`**, jamais un
échec silencieux.

---

## 12.5 Secrets, chiffrement, sauvegardes

| Sujet | Décision |
|---|---|
| Secrets | Vercel Environment Variables + Supabase Vault. **Jamais** dans le dépôt |
| `service_role` | Présente uniquement dans les Edge Functions et le runtime serveur Next.js. **Test CI qui grep le bundle client** |
| Rotation | Clés de service tous les 6 mois ; immédiatement au départ d'un employé technique. Procédure écrite et **testée** |
| HMAC `phone_hash` | Secret dans Supabase Vault, **non rotatif** (sinon les hachages deviennent incomparables). Si rotation nécessaire : recalcul complet et migration |
| Chiffrement au repos | Assuré par le fournisseur (Postgres + Storage) |
| Chiffrement applicatif | `reward_redemptions.target_msisdn_enc` chiffré avec `pgcrypto`, clé dans Vault, purgé à 90 j |
| Sauvegardes | Supabase Pro : sauvegardes quotidiennes + PITR 7 j (option payante). **Activer le PITR dès le MVP** — le ledger ne se reconstruit pas |
| **Test de restauration** | **Trimestriel, obligatoire.** Une sauvegarde jamais restaurée n'est pas une sauvegarde |
| Disaster recovery | RTO 4 h, RPO 1 h (avec PITR). Procédure écrite : restauration, redéploiement, vérification d'intégrité du ledger |
| Export hors fournisseur | `pg_dump` hebdomadaire chiffré vers un stockage objet tiers. Protège contre la perte du compte fournisseur lui-même |

---

## 12.6 Données personnelles — Tunisie : loi 2004-63 et INPDP

**Le RGPD ne s'applique pas directement** à un service tunisien visant des résidents
tunisiens. Le cadre applicable est la **loi organique n° 2004-63 du 27 juillet 2004**
relative à la protection des données à caractère personnel, dont l'autorité de contrôle
est l'**INPDP** (Instance Nationale de Protection des Données à Caractère Personnel).

### Les deux obligations qui structurent votre architecture

1. **Déclaration préalable du traitement auprès de l'INPDP.** Elle est obligatoire, à
   accomplir **avant la mise en production**, pas après.
2. **Autorisation préalable pour le transfert de données à l'étranger.** C'est le point
   déterminant pour votre stack. Les articles 47 et 50 à 52 de la loi 2004-63 encadrent
   strictement les transferts hors de Tunisie, et **le responsable de traitement doit
   déposer une demande d'autorisation auprès de l'Instance en plus de la déclaration**.
   L'Instance statue généralement dans un délai d'environ un mois.

> **Conséquence directe : héberger sur Supabase (AWS) et Vercel — donc hors de Tunisie —
> constitue un transfert de données personnelles à l'étranger et requiert une
> autorisation préalable de l'INPDP.**
>
> Ce n'est ni un blocage ni une raison de changer de stack, mais c'est **une démarche
> administrative à engager dès la Phase 0**, en parallèle du POC. Ne la découvrez pas au
> moment du lancement. Faites-vous accompagner par un conseil juridique tunisien : la
> qualification exacte et le contenu du dossier dépendent de la finalité déclarée.

**À noter également :** le décret-loi n° 54 de 2022 relatif à la lutte contre les
infractions liées aux systèmes d'information a des interactions discutées avec la loi
2004-63 (obligations de conservation, accès des autorités). Point à faire qualifier par
un juriste local, pas par un développeur.

### Cartographie des données

| Donnée | Nécessaire ? | Base légale | Conservation | Risque |
|---|---|---|---|---|
| **Numéro de téléphone** | ✅ Indispensable (identité + conversion) | Exécution du service | Durée du compte | **Élevé** |
| `phone_hash` (HMAC) | ✅ Anti-fraude sans exposition | Intérêt légitime | Durée du compte + tombstone | Faible |
| Gouvernorat déclaré | ✅ Ciblage | Consentement | Durée du compte | **Faible** — zone grossière |
| Délégation | ⚠️ Facultative | Consentement | | Faible |
| **Localisation précise (GPS)** | ❌ **Non collectée** | — | — | **Éliminé par conception** |
| Nom d'affichage | ❌ Facultatif | Consentement | | Faible |
| Modèle et version d'appareil | ✅ Anti-fraude et support | Intérêt légitime | 12 mois | Faible |
| `install_id`, clé publique | ✅ Anti-fraude | Intérêt légitime | Durée de l'installation | Faible |
| **Numéro appelé** | ❌ **NON COLLECTÉ** | — | — | **Éliminé par conception** |
| Horodatage et durée d'appel | ⚠️ Bonus d'engagement uniquement | Consentement **séparé** | 180 j | **Moyen** |
| Impressions publicitaires | ✅ Facturation | Exécution du contrat | 90 j brut, agrégats indéfinis | Faible |
| Mouvements de points | ✅ Ledger | Exécution du contrat | **Indéfiniment** | Faible |
| Hash d'IP | ⚠️ Anti-fraude | Intérêt légitime | 30 j | Faible |
| Preuves de conversion | ✅ Litiges | Exécution du contrat | 90 j | Moyen |

### Votre question directe : faut-il stocker le numéro appelé ?

> *« Doit-on stocker le numéro appelé ? Ou simplement `call_id`, `user_id`, `timestamp`,
> `duration`, `campaign_id`, `advertisement_id`, `points_transaction_id` ? »*

**Votre intuition est exactement la bonne, et il faut aller un cran plus loin.**

Le numéro appelé ne doit **jamais quitter le téléphone**. Raisons cumulatives :

1. **Aucun usage métier.** Il n'entre dans aucun calcul : ni le ciblage (qui repose sur la
   zone de l'appelant), ni l'attribution de points (qui repose sur l'impression), ni la
   facturation.
2. **Un graphe social est la donnée la plus sensible qu'on puisse constituer.**
   L'ensemble des numéros appelés par une population révèle les relations, et en Tunisie
   c'est une donnée à risque particulier.
3. **C'est une cible d'attaque et de réquisition.** Une donnée que vous ne détenez pas ne
   peut être ni volée, ni réquisitionnée, ni fuitée.
4. **Cela simplifie radicalement votre dossier INPDP.** Ne pas collecter est le meilleur
   argument de minimisation.

**Schéma retenu pour `calls` (déjà implémenté en §07) :**

```
id, user_id, occurred_at (serveur), client_reported_at, duration_seconds,
outcome, measured, idempotency_key, install_id
```

Pas de numéro, pas de nom de contact, pas de localisation. Et je vais plus loin que votre
proposition : **`campaign_id` et `advertisement_id` ne sont pas dans `calls`** — ils sont
dans `advertisement_impressions`, liés par `call_id`. Un appel sans publicité (l'app
ouverte sans diffusion) ne porte alors aucune information publicitaire.

**À l'inverse de votre liste, je conserve délibérément `campaign_id` dans
`points_ledger`.** C'est nécessaire pour prouver à un annonceur le lien entre son budget
et les points distribués. Mais cela ne lie jamais un annonceur à un **numéro appelé** :
la chaîne s'arrête à l'utilisateur.

### Droits des personnes

| Droit | Mise en œuvre | Délai |
|---|---|---|
| Information | Écran de consentement granulaire + politique en AR et FR | À l'inscription |
| Accès / export | `POST /account/export` → JSON complet (profil, ledger, impressions, conversions) | Immédiat en self-service |
| Rectification | Écran profil (zone, langue, nom) | Immédiat |
| Retrait du consentement | Écran paramètres, par finalité | Immédiat, nouvelle ligne dans `consents` |
| **Suppression** | `DELETE /account` + OTP de confirmation | 30 j |
| Opposition au ciblage | Possible : désactive le ciblage par zone (campagnes nationales uniquement) | Immédiat |

### Ce que « suppression » signifie précisément

```
SUPPRIMÉ                                    CONSERVÉ (anonymisé)
────────                                    ────────────────────
profiles.phone_e164                         daily_campaign_stats (déjà agrégé)
profiles.display_name                       campaign_invoices.snapshot (obligation
device_installations (toutes lignes)          comptable, aucune donnée personnelle)
reward_redemptions.target_msisdn_enc        deleted_accounts.phone_hash
calls (lignes)                                (tombstone anti-réinscription frauduleuse)
advertisement_impressions (lignes)          audit_logs (actions des employés, pas
sync_events (lignes)                          les données du client)
points_ledger → user_id remplacé par
  un UUID anonyme constant, mouvements
  conservés (intégrité de la chaîne)
```

**Le point délicat :** `points_ledger` est append-only et chaîné — on ne peut pas
supprimer des lignes sans casser la chaîne. **Solution : pseudonymisation.** `user_id`
est remplacé par un UUID anonyme, dans la seule table `profiles` ; le ledger conserve ses
lignes mais ne pointe plus vers une personne identifiable. C'est une exception à
l'immuabilité, à implémenter par une fonction dédiée, journalisée, et **à documenter dans
le dossier INPDP**.

**Justification du tombstone `deleted_accounts.phone_hash` :** sans lui, la suppression de
compte devient un outil de fraude (supprimer, se réinscrire, toucher à nouveau le bonus de
bienvenue, indéfiniment). On conserve un HMAC irréversible du numéro — pas le numéro.
Cette finalité doit être déclarée.

---

## 12.7 Logs, audit, observabilité

| Type | Contenu | Rétention | Accès |
|---|---|---|---|
| `audit_logs` | Actions employés modifiant valeur ou statut client | **Indéfiniment**, append-only | `audit:read` |
| `sync_events` | Métadonnées de synchro | 30 j | `analytics:read` |
| `fraud_events` | Détections | 24 mois | `fraud:read` |
| Logs applicatifs (Sentry) | Erreurs, traces | 30–90 j | Équipe technique |
| Logs Postgres | Requêtes lentes, erreurs | Selon le fournisseur | Administrateurs |

**Règles de journalisation non négociables :**
- **Jamais** de numéro de téléphone complet dans un log applicatif. Masquer :
  `+216 2X XXX XX8`.
- **Jamais** de JWT, de refresh token, de clé de service dans un log.
- IP hachée, jamais en clair.
- Un administrateur **ne peut pas supprimer** `audit_logs` (trigger + `REVOKE`).
- Toute lecture d'un profil client par un employé est elle-même journalisée
  (traçabilité des accès — attendu par un audit).

---

## 12.8 Checklist de sécurité avant mise en production

```
[ ] Aucune permission du groupe Call Log dans le manifeste Android (test CI)
[ ] service_role absente du bundle client (test CI : grep)
[ ] Toutes les tables du schéma public ont RLS  → assert_rls_everywhere() renvoie 0 ligne
[ ] Aucune policy INSERT/UPDATE/DELETE pour `authenticated` sur points_*
[ ] Toutes les fonctions SECURITY DEFINER ont SET search_path
[ ] Toutes les vues exposées ont security_invoker = true
[ ] MFA activée pour les 100 % des comptes employés
[ ] PITR activé sur Supabase
[ ] Restauration de sauvegarde testée et documentée
[ ] Plafond de dépense quotidien configuré chez le fournisseur SMS
[ ] Rate limits actifs et testés sur les 5 endpoints sensibles
[ ] Politique de confidentialité publiée en AR et FR
[ ] Déclaration INPDP déposée
[ ] Autorisation INPDP de transfert à l'étranger demandée
[ ] Écran de consentement granulaire avec refus possible du facultatif
[ ] Export et suppression de compte fonctionnels en self-service
[ ] Fiches Data Safety (Play) et App Privacy (Apple) remplies et cohérentes
[ ] verify_ledger_chain() planifié quotidiennement avec alerte
[ ] Contrôle de cohérence wallet ↔ ledger planifié avec alerte
[ ] Secrets absents de l'historique git (scan gitleaks en CI)
```
