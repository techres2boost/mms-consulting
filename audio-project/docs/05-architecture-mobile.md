# 05 — Architecture mobile

## 5.1 L'insight principal

> **Le choix du framework mobile n'est pas la contrainte. L'OS est la contrainte.**

Aucun framework ne permet d'injecter de l'audio dans un appel GSM. Aucun framework ne
permet à une app iOS de détecter un appel cellulaire natif. Passer de Capacitor à Flutter
ou React Native **ne débloque aucune capacité manquante** pour ce produit. Cela ne change
que l'ergonomie d'écriture du code natif et la qualité de l'UI.

Il faut donc évaluer les frameworks sur ce qu'ils changent réellement :

| Besoin réel du produit | Capacitor | React Native | Flutter | Natif Android + iOS |
|---|---|---|---|---|
| UI de type dashboard / listes / formulaires | ✅ (web) | ✅ | ✅ | ✅ |
| Lecture audio locale fiable, latence faible | ✅ | ✅ | ✅ | ✅ |
| Lancer un appel via `tel:` | ✅ | ✅ | ✅ | ✅ |
| SQLite locale chiffrée | ✅ (plugin) | ✅ | ✅ | ✅ |
| Keystore / Secure Enclave, signature | ⚠️ plugin maison | ⚠️ module maison | ⚠️ channel maison | ✅ |
| Play Integrity / App Attest | ⚠️ plugin maison | ⚠️ module maison | ⚠️ channel maison | ✅ |
| `READ_PHONE_STATE` + état d'appel (Android) | ⚠️ **plugin maison** | ⚠️ module maison | ⚠️ channel maison | ✅ |
| Tâche de fond périodique (WorkManager / BGTask) | ⚠️ plugin maison | ⚠️ module | ⚠️ channel | ✅ |
| `CallRedirectionService` / dialer par défaut (ALT-E) | ❌ en pratique | ❌ en pratique | ❌ en pratique | ✅ **obligatoire** |
| Pile VoIP + CallKit / ConnectionService (ALT-C) | ❌ | ⚠️ SDK tiers | ⚠️ SDK tiers | ✅ |
| Réutilisation du code du portail web | ✅ **fort** | ⚠️ partiel | ❌ | ❌ |
| Taille du binaire | ~15–25 Mo | ~25–40 Mo | ~20–30 Mo | ~8–15 Mo |
| Performance sur Android entrée de gamme (marché TN) | ⚠️ **à surveiller** | ✅ | ✅ | ✅ |

**Constat :** pour l'architecture recommandée (ALT-D), les quatre options exigent **le même
travail natif** : 3 à 4 petits modules (Keystore, attestation, état d'appel Android,
tâche de fond). Ce travail est de l'ordre de 5 à 10 jours quel que soit le framework.

---

## 5.2 Verdict

**Gardez Capacitor pour le MVP.** Raisons :

1. Le travail natif incompressible est identique partout.
2. Vous réutilisez le code du portail client Next.js (composants, types, client Supabase,
   logique de barème) — c'est le seul avantage *différenciant* et il est significatif
   pour une petite équipe.
3. L'UI du produit est un dashboard, pas un jeu. Le web y est parfaitement adapté.
4. Coût de sortie faible : si la Phase 0 impose ALT-E, vous écrivez un module Android
   natif conséquent, et là seulement la question du framework se repose.

**Ne passez pas à Flutter ou React Native « par sécurité ».** C'est 4 à 8 semaines de
réécriture pour aucune capacité supplémentaire sur le mécanisme cœur.

### Les deux conditions de ce verdict

- **Condition A — performance sur entrée de gamme.** À tester en Phase 0 sur de vrais
  téléphones du marché tunisien (Samsung A0x/A1x, Xiaomi Redmi 9/10, Tecno, Infinix,
  2–3 Go de RAM, Android 11–13). Si le temps de démarrage à froid dépasse 3 s ou si l'écran
  de pub saccade, c'est un signal de sortie vers RN/Flutter.
- **Condition B — la Phase 0 confirme ALT-D.** Si elle oriente vers ALT-E (dialer
  Android), le module natif devient l'essentiel de l'app Android : **écrivez alors l'app
  Android en natif Kotlin** et gardez Capacitor pour iOS. C'est une architecture hybride
  assumée, qui reflète l'asymétrie réelle des plateformes.

---

## 5.3 Architecture de l'application

```
apps/mobile/
├─ src/                       # TypeScript / React — partagé avec le portail web
│  ├─ features/
│  │  ├─ onboarding/          # consentement, OTP, profil
│  │  ├─ call/                # écran d'appel + écran de diffusion pub
│  │  ├─ wallet/              # solde, historique, distinction confirmé/pending
│  │  ├─ rewards/             # catalogue, demande de conversion, preuves
│  │  └─ settings/
│  ├─ core/
│  │  ├─ db/                  # SQLite : schéma local, migrations
│  │  ├─ sync/                # file, backoff, batch, curseur
│  │  ├─ adengine/            # sélection locale de créatif (§08)
│  │  ├─ delivery/            # implémentation d'AdDeliveryChannel
│  │  ├─ crypto/              # signature via le plugin natif
│  │  └─ policy/              # plafonds et barèmes reçus du serveur
│  └─ ui/                     # design system partagé avec le web
├─ android/
│  └─ app/src/main/java/.../plugins/
│     ├─ CallStatePlugin.kt         # READ_PHONE_STATE, TelephonyCallback
│     ├─ DeviceKeyPlugin.kt         # Keystore StrongBox, ECDSA P-256
│     ├─ IntegrityPlugin.kt         # Play Integrity
│     └─ SyncWorker.kt              # WorkManager périodique
└─ ios/
   └─ App/Plugins/
      ├─ DeviceKeyPlugin.swift      # Secure Enclave, ECDSA P-256
      ├─ AttestPlugin.swift         # App Attest / DeviceCheck
      └─ SyncTask.swift             # BGTaskScheduler
      # ⚠️ pas de CallStatePlugin : impossible sur iOS
```

### Base locale

**SQLite via `@capacitor-community/sqlite`**, avec chiffrement SQLCipher et clé stockée
dans le Keystore/Enclave. Tables locales :

```sql
-- app locale (SQLite)
local_events(id, seq, type, payload_json, idem_key, t_mono_ns, boot_id,
             t_wall, sig, state /* pending|sent|acked|rejected */, created_at)
local_wallet(confirmed_points, pending_points, server_cursor, updated_at)
ad_bundle(version, fetched_at, expires_at)
ad_creatives(id, campaign_id, file_path, sha256, duration_ms, weight,
             priority, zones_json, valid_from, valid_to, daily_cap, freq_cap_minutes)
impression_log(creative_id, played_at_mono, state)  -- pour les plafonds locaux
```

**`seq` est un compteur strictement monotone par installation**, jamais réinitialisé, et
stocké hors de la base effaçable simple (cf. §13 sur la réinstallation).

### Stratégie offline

| Élément | Comportement hors ligne |
|---|---|
| Solde | Affiché depuis `local_wallet`, avec mention explicite « + N en attente » |
| Créatifs | Lus depuis le cache fichier local |
| Sélection | Moteur local, identique en logique au moteur serveur, alimenté par les poids du bundle |
| Impressions | Journalisées et signées, jamais créditées définitivement |
| Conversions | **Bloquées hors ligne.** Aucun débit ne peut être initié sans le serveur |
| Fraîcheur | Bundle valable 7 j ; au-delà, diffusion dégradée (cf. §03 UJ3) |

### Permissions demandées

| Permission | OS | Obligatoire ? | Justification store |
|---|---|---|---|
| `INTERNET` | Android | oui | — |
| `READ_PHONE_STATE` | Android | **non** (facultatif) | « Compter vos appels pour vous attribuer des points » |
| `CALL_PHONE` | Android | non | Lancer l'appel sans écran de confirmation |
| `POST_NOTIFICATIONS` | Android 13+ | non | Notifier la validation des conversions |
| `READ_CONTACTS` | les deux | **non** | Sélection de contact. **Refusable, avec clavier en repli** |
| Localisation | les deux | **non, et non demandée au MVP** | Le gouvernorat déclaré suffit (§12) |
| **Groupe Call Log** | Android | **JAMAIS** | Déclencherait l'obligation de dialer par défaut |

> **Règle dure à écrire dans la CI :** un test échoue si le manifeste Android contient
> `READ_CALL_LOG`, `WRITE_CALL_LOG` ou `PROCESS_OUTGOING_CALLS`. C'est la cause la plus
> fréquente de rejet Play sur ce type d'app.

---

## 5.4 Ce qu'il faut accepter sur iOS

L'application iOS sera, pour le mécanisme cœur, **une version dégradée** :
- elle joue la publicité, lance l'appel, et **ne sait rien de la suite** ;
- aucun crédit lié à l'appel ou à la durée n'est possible ;
- le crédit repose entièrement sur l'impression écoutée dans l'app.

**Deux options produit, à trancher explicitement :**

- **Option 1 (recommandée) — lancer sur Android seulement.** Le marché tunisien est
  très majoritairement Android. Cela évite 99 USD/an, une revue App Store sur un modèle
  publicitaire sensible, et surtout une expérience iOS que vous ne maîtrisez pas.
  Économie réelle : ~30 % de l'effort mobile.
- **Option 2 — iOS en parité de *portefeuille*, pas de *mécanisme*.** L'app iOS sert de
  consultation de solde et de conversion, la diffusion publicitaire y est facultative et
  faiblement rémunérée. Honnête, mais crée une asymétrie de rémunération entre
  utilisateurs qu'il faut expliquer, sous peine de mauvaises notes sur le store.

Ne lancez pas iOS en prétendant une parité fonctionnelle : elle n'existe pas.

---

## 5.5 Risques de conformité store

| Risque | Store | Mitigation |
|---|---|---|
| Rejet pour permission Call Log | Play | Ne jamais la déclarer (test CI) |
| Rejet pour « incitation à interagir avec des publicités » | les deux | Le point n'est pas conditionné à un *clic* mais à une *écoute*. Formuler la contrepartie comme un programme de fidélité, pas comme « payé pour regarder des pubs » |
| Politique sur les récompenses monétisables | les deux | Les points ne sont **ni transférables ni convertibles en argent** — uniquement en avantages télécom. Le formuler explicitement dans les CGU et la fiche store |
| Divulgation de collecte de données | les deux | Remplir correctement Data Safety (Play) et App Privacy (Apple). L'absence de collecte de localisation précise est un atout |
| App iOS jugée « sans fonctionnalité » | Apple | Le portefeuille + les conversions constituent une fonctionnalité autonome |
| Utilisation de l'API de téléphonie en arrière-plan | Play | Déclarer un type de service au premier plan correct si un service est utilisé ; préférer `TelephonyCallback` sans service persistant |
