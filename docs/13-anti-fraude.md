# 13 — Anti-fraude

## 13.1 Le niveau de protection réellement atteignable

Avant les mécanismes, il faut fixer ce qui est possible, sinon on construit de la
sécurité décorative.

| Type d'attaquant | Proportion attendue | Arrêté par | Verdict |
|---|---|---|---|
| Utilisateur curieux (change l'heure, teste l'app) | ~5 % des utilisateurs | Horloge monotone + horodatage serveur | **Neutralisé** |
| Opportuniste (2-3 comptes pour la famille) | ~2 % | Plafonds + numéro cible = numéro du compte | **Économiquement inintéressant** |
| Semi-technique (APK modifié, émulateur, scripts) | ~0,5 % | Attestation + signature + plafonds | **Fortement gêné** |
| Technique organisé (device rooté, clé extraite, ferme de SIM) | ~0,05 % | **Rien, techniquement** | **Borné économiquement, détecté statistiquement** |

> **La protection atteignable est donc : neutraliser 99,5 % des tentatives, et rendre les
> 0,05 % restantes non rentables.**
>
> Il est impossible de garantir qu'un fait purement local a réellement eu lieu. La
> stratégie n'est pas de rendre la fraude impossible, mais de la rendre **plafonnée,
> coûteuse et visible**. Toute architecture qui promet mieux se trompe ou vous trompe.

**Perte maximale par compte frauduleux parfait :** ~700 points/mois = ~3 Go = **~0,65 à
1,00 USD/mois**. Une ferme de 100 comptes coûte ~100 cartes SIM (achat, activation) et
rapporte ~100 USD/mois de data. C'est un mauvais rendement pour l'attaquant, et c'est
exactement l'effet recherché.

---

## 13.2 Traitement des huit scénarios

### Fraude 1 — Modification de l'heure du téléphone

**Attaque :** avancer l'horloge pour réinitialiser un plafond journalier, ou rendre
crédibles des événements sur plusieurs jours.

**Contre-mesures :**
- L'événement signé inclut `t_mono_ns` (`elapsedRealtimeNanos` / `systemUptime`), horloge
  **monotone depuis le démarrage**, que l'utilisateur ne peut pas modifier.
- `boot_id` change à chaque redémarrage : un recul de `t_mono_ns` sans changement de
  `boot_id` est une incohérence détectée.
- **Tous les plafonds sont évalués sur l'horodatage serveur**, jamais sur `t_wall`.
- `t_wall` n'est conservé qu'à titre indicatif (`client_reported_at`). Un écart > 24 h
  marque `clock_skew` et ouvre un `fraud_event` de faible sévérité.

**Efficacité : totale.** L'horloge murale n'a aucun pouvoir dans ce système.

---

### Fraude 2 — Désinstallation / réinstallation

**Attaque :** réinitialiser les compteurs locaux, ou re-toucher le bonus de bienvenue.

**Contre-mesures :**
- **Le solde et tous les compteurs vivent côté serveur.** La base locale est un cache.
- `device_installations.last_seq` est détenu par le serveur : le `seq` ne repart pas à
  zéro du point de vue serveur.
- Le bonus de bienvenue est indexé sur **`phone_hash`**, pas sur l'installation. Une
  `idempotency_key` dérivée de `md5('welcome:' || phone_hash)` le rend inrejouable.
- `deleted_accounts.phone_hash` survit à la suppression du compte : supprimer puis se
  réinscrire ne redonne pas le bonus.
- Sur iOS, la persistance du compteur dans le Keychain survit à la désinstallation.
- Compteur de réenregistrements : > 3 en 30 jours → `fraud_event(medium)` + conversions
  bloquées en attente de revue.

**Efficacité : élevée.** Le seul gain est la perte de ses propres événements non
synchronisés.

---

### Fraude 3 — Création de 50 comptes

**Attaque :** multiplier les comptes pour multiplier les plafonds et les bonus.

**Contre-mesures, par ordre d'efficacité :**
1. **Le numéro cible d'une conversion doit être le numéro du compte** (vérifié par OTP).
   → 50 comptes exigent 50 cartes SIM actives. **C'est la contre-mesure la plus
   efficace du dispositif**, parce qu'elle attaque l'économie de l'attaque, pas sa
   technique.
2. Un compte actif par numéro (`UNIQUE(phone_e164)`).
3. Une installation active par utilisateur (index unique partiel).
4. `max_installs_per_phone_hash = 3` (réglage), au-delà : blocage.
5. Corrélation par empreinte d'appareil : plusieurs comptes sur le même
   `device_model` + `os_version` + hash d'IP dans une courte fenêtre →
   `fraud_event(medium)`.
6. Ancienneté minimale de 72 h avant toute conversion : les comptes jetables meurent
   avant de pouvoir sortir de la valeur.
7. Détection de grappes : > 5 comptes créés depuis le même hash d'IP en 24 h →
   `fraud_event(high)`.
8. Bonus de parrainage conditionné à **5 impressions validées du filleul** (pas à
   l'inscription) : le parrainage cesse d'être une machine à fabriquer de la valeur.

**Efficacité : élevée sur l'économie**, moyenne sur la détection pure. Un attaquant
disposant de 50 SIM réelles peut opérer 50 comptes — mais son gain est de ~50 USD/mois
pour un investissement en SIM largement supérieur.

---

### Fraude 4 — Émulateur

**Attaque :** automatiser des milliers d'impressions dans des émulateurs Android.

**Contre-mesures :**
- **Play Integrity API** : le verdict `deviceRecognitionVerdict` distingue
  `MEETS_DEVICE_INTEGRITY` (appareil Android authentique) de son absence. Un émulateur
  n'obtient pas ce verdict.
- `appRecognitionVerdict = PLAY_RECOGNIZED` : l'APK est bien celui distribué par le
  Play Store, non modifié.
- **Nonce serveur** dans la requête d'attestation, pour empêcher la réutilisation d'un
  verdict valide obtenu ailleurs. Le nonce protège contre le rejeu et la falsification ;
  vérifier côté serveur que le `requestHash`/`nonce` correspond bien à celui émis.
- Attestation **matérielle de la clé** : `key_attested = true` si la clé est adossée à
  StrongBox / Secure Enclave. Un émulateur ne peut pas la produire.
- iOS : **App Attest** — la génération d'une clé attestée est impossible sur simulateur.

**Politique graduée, importante à respecter :**
```
Verdict complet (device + app + hardware key)  → accrual normal
Verdict partiel (device OK, clé logicielle)     → accrual normal, surveillance
Verdict dégradé (device inconnu, ROM custom)    → profil 'limited' : 0 point,
                                                   app utilisable
Émulateur détecté                               → profil 'limited' + fraud_event(high)
```

**Ne jamais refuser l'accès sur un verdict négatif.** Les faux positifs sont réels
(appareils sans services Google, ROM alternatives légitimes, appareils bas de gamme
non certifiés — fréquents sur le marché tunisien). Le mode `limited` — l'app fonctionne,
elle ne crédite pas — est la bonne réponse : il protège la valeur sans perdre
l'utilisateur, et une voie de recours humaine doit exister.

**Attention à la quota Play Integrity :** la quota par défaut est de l'ordre de
**10 000 requêtes/jour** par projet, avec des limites par instance. À 10 000
utilisateurs synchronisant plusieurs fois par jour, **la quota est dépassée**. D'où :
mettre en cache le verdict **24 h** côté serveur, ne le rafraîchir qu'à la première
synchro du jour, et **demander une augmentation de quota dans la Play Console avant le
palier 10 k** — c'est un délai administratif à anticiper, pas un réglage.

---

### Fraude 5 — Falsification des événements offline

**Attaque :** injecter directement des lignes dans la base SQLite locale, ou forger des
batchs.

**Contre-mesures :**
- Chaque événement est **signé par une clé privée qui ne sort jamais du Keystore /
  Secure Enclave**. Modifier la base locale sans la clé produit une signature invalide →
  rejet.
- Base locale chiffrée (SQLCipher), clé elle-même dans le Keystore.
- `seq` strictement monotone, validé serveur.
- Plafonds serveur : même un batch parfaitement signé ne crédite jamais plus que le
  maximum autorisé.

**Limite à assumer :** sur un appareil rooté, un attaquant peut appeler l'API de
signature du Keystore depuis un processus injecté et forger des événements **valides**
décrivant des faits inexistants. **C'est irréductible.** La borne est le plafond, pas la
cryptographie.

**Détection statistique — la vraie défense à ce niveau :**
```sql
-- Profils dont le rythme d'impressions est aberrant (job quotidien)
with stats as (
  select avg(complete_impressions) m, stddev_pop(complete_impressions) s
  from daily_user_stats where day > current_date - 30
)
select s.user_id, s.day, s.complete_impressions,
       (s.complete_impressions - st.m) / nullif(st.s, 0) as zscore
from daily_user_stats s, stats st
where s.day = current_date - 1
  and (s.complete_impressions - st.m) / nullif(st.s, 0) > 3.5;
```
Signaux complémentaires : impressions parfaitement régulières (un humain est irrégulier) ;
`completion_pct` toujours exactement 100 (un humain produit des lectures partielles) ;
impressions sans appel correspondant sur Android ; ratio impressions/jours actifs trop
élevé ; distribution des créatifs incompatible avec les poids envoyés (vérifiable, car
la sélection est déterministe à partir d'une graine — §08).

---

### Fraude 6 — Rejeu de 100 fois le même événement

**Contre-mesures :**
- `idempotency_key UNIQUE` sur `advertisement_impressions`, `calls` et `points_ledger`.
  **Vérifié par le test T2** : la même clé rejouée 3× produit une seule ligne.
- `seq` monotone : un `seq` déjà consommé est rejeté.
- La signature couvre `seq` : on ne peut pas changer le `seq` d'un événement signé.
- Le rejeu est traité comme un **succès silencieux** (l'entrée existante est renvoyée),
  pour ne pas casser les clients qui réessaient légitimement après un timeout.

**Efficacité : totale.** C'est la classe d'attaque la mieux couverte.

---

### Fraude 7 — Manipulation des API

**Attaque :** appeler directement les endpoints en contournant l'app.

**Contre-mesures :**
- JWT obligatoire, TTL 1 h, rotation des refresh tokens.
- **Aucune policy d'écriture** sur les tables de valeur : même avec un JWT valide, un
  `UPDATE points_wallets` n'affecte 0 ligne.
- Signature d'événement exigée : un JWT seul ne suffit pas à faire ingérer un événement.
- Attestation exigée sur `/sync`.
- Rate limits par installation (§12).
- `X-Contract-Version` : un client dont la version de contrat est trop ancienne reçoit
  `426` et ne peut plus produire d'événements sous d'anciennes règles.
- **Aucune écriture par PostgREST** : tout passe par des Edge Functions.

**Efficacité : élevée.** La surface d'écriture est réduite à cinq fonctions contrôlées.

---

### Fraude 8 — Création artificielle d'appels

**Attaque :** générer des appels très courts, ou des appels vers un numéro complice, pour
déclencher le bonus.

**Contre-mesures :**
- Le bonus d'appel est **volontairement marginal** (1 point, plafonné à 10/jour).
  L'accrual principal reste l'impression.
- Durée minimale de 30 s pour le bonus.
- Plafond de 10 bonus d'appel/jour.
- Sur Android, l'événement provient de `TelephonyCallback`, plus difficile à simuler qu'un
  compteur applicatif (mais pas impossible sur appareil rooté).
- **Sur iOS, aucun bonus d'appel n'est attribué** — l'absence de mesure devient ici une
  protection.
- Détection : distribution des durées trop régulière ; appels toujours d'exactement 31 s ;
  appels sans interruption entre eux.

**Efficacité : élevée par conception du barème.** En rendant le bonus d'appel marginal, on
retire l'intérêt de l'attaquer. C'est une décision de barème, pas une contre-mesure
technique — souvent la plus efficace.

---

## 13.3 Récapitulatif des mécanismes

| Mécanisme | Couvre | Force | Complexité |
|---|---|---|---|
| Idempotency keys | F6 | ●●●●● | ● |
| Device binding + signature matérielle | F5, F7 | ●●●●○ | ●●● |
| Server timestamps (autorité unique) | F1 | ●●●●● | ● |
| Horloge monotone + `boot_id` | F1 | ●●●●● | ●● |
| Nonce serveur | F4, F6 | ●●●●○ | ●● |
| `seq` monotone détenu par le serveur | F2, F6 | ●●●●○ | ●● |
| Play Integrity | F4, F5 | ●●●○○ | ●●● |
| App Attest / DeviceCheck | F4, F5 | ●●●○○ | ●●● |
| Rate limits | F3, F7 | ●●●●○ | ●● |
| **Plafonds serveur** | **toutes** | ●●●●● | ● |
| **Numéro cible = numéro du compte** | **F3** | ●●●●● | ● |
| Ancienneté minimale avant conversion | F3 | ●●●●○ | ● |
| Détection d'anomalie statistique | F5, F8 | ●●●○○ | ●●●● |
| Ledger append-only + chaînage | intégrité interne | ●●●●○ | ●●● |
| Revue manuelle des grosses conversions | résiduel | ●●●●● | ●●●● (humain) |

**Les deux mécanismes les plus efficaces du tableau sont les plus simples : les plafonds
serveur et l'obligation de convertir vers son propre numéro.** À implémenter en premier.
L'attestation et la détection statistique viennent ensuite. Une équipe qui commence par
la détection d'anomalie avant d'avoir posé les plafonds construit à l'envers.

---

## 13.4 Moteur de règles et actions automatiques

```sql
-- Exemple de règle, exécutée par job_detect_fraud() à 03:00
-- R-CLUSTER-IP : plusieurs comptes créés depuis la même IP
insert into fraud_events (user_id, rule_code, severity, score, evidence, auto_action)
select p.id, 'R-CLUSTER-IP', 'high', 75,
       jsonb_build_object('ip_hash', encode(s.ip_hash,'hex'),
                          'accounts_24h', s.cnt),
       'block_redemptions'
from (select ip_hash, count(distinct user_id) cnt
      from sync_events
      where received_at > now() - interval '24 hours' and ip_hash is not null
      group by ip_hash having count(distinct user_id) > 5) s
join sync_events se on se.ip_hash = s.ip_hash
join profiles p on p.id = se.user_id
where not exists (select 1 from fraud_events f
                  where f.user_id = p.id and f.rule_code = 'R-CLUSTER-IP'
                    and f.created_at > now() - interval '7 days');
```

### Catalogue de règles du MVP

| Code | Détection | Sévérité | Action automatique |
|---|---|---|---|
| `R-CLOCK-SKEW` | Écart `t_wall`/serveur > 24 h, répété | low | none |
| `R-SEQ-GAP` | Trous de `seq` répétés | low | none |
| `R-REINSTALL` | > 3 réenregistrements / 30 j | medium | `block_redemptions` |
| `R-CLUSTER-IP` | > 5 comptes / même hash d'IP / 24 h | high | `block_redemptions` |
| `R-CLUSTER-DEVICE` | > 3 comptes / même empreinte d'appareil | high | `block_redemptions` |
| `R-RATE-ANOMALY` | z-score d'impressions > 3,5 | medium | none (revue) |
| `R-PERFECT-PLAY` | 100 % de `completion_pct` exactement 100 sur > 50 impressions | medium | none (revue) |
| `R-NO-CALL` | Android : impressions sans appel correspondant, > 80 % | medium | none (revue) |
| `R-INTEGRITY-FAIL` | Verdict Play Integrity / App Attest négatif | high | `limit` |
| `R-EMULATOR` | Émulateur détecté | critical | `limit` + `suspend` |
| `R-WEIGHT-MISMATCH` | Distribution des créatifs incompatible avec les poids | high | `block_redemptions` |
| `R-LEDGER-BREAK` | `verify_ledger_chain()` détecte une rupture | critical | Alerte **immédiate** à l'équipe |
| `R-WALLET-DRIFT` | Wallet ≠ somme du ledger | critical | Alerte **immédiate** |

### Échelle d'actions

```
score < 40   → journalisation seule
40 ≤ s < 70  → surveillance, revue en file back-office
70 ≤ s < 90  → conversions bloquées, utilisateur notifié, recours possible
s ≥ 90       → profil 'limited' (0 point) ou 'suspended', revue humaine obligatoire
```

**Deux principes à respecter :**
1. **Aucune suspension définitive automatique.** Un faux positif qui coupe un utilisateur
   honnête sans recours coûte plus cher que la fraude qu'il évite. Toute action ≥ `limit`
   doit être réversible et notifiée, avec un canal de recours.
2. **Les règles `critical` d'intégrité (`R-LEDGER-BREAK`, `R-WALLET-DRIFT`) ne concernent
   pas l'utilisateur** : elles signalent un problème *chez vous* — bug, intervention
   manuelle en base, incident. Elles doivent réveiller l'équipe, pas sanctionner un
   client.

---

## 13.5 Ce qu'il faut construire dans quel ordre

| Phase | Mécanismes | Justification |
|---|---|---|
| **MVP (obligatoire)** | Plafonds serveur, idempotency keys, horodatage serveur, horloge monotone, numéro cible = numéro du compte, ancienneté 72 h, rate limits, ledger append-only | Sans cela, le produit est indéfendable dès le premier jour |
| **MVP (fortement recommandé)** | Device binding + signature, `seq` monotone | Coût modéré, gain élevé |
| **Phase 2** | Play Integrity, App Attest, `verify_ledger_chain()` planifié, règles de grappe | Nécessite du volume pour être calibré |
| **Phase 3** | Détection d'anomalie statistique, `R-WEIGHT-MISMATCH`, scoring composite | Nécessite 3 à 6 mois de données pour ne pas produire que du bruit |
| **Phase 4** | Modèle de scoring appris, revue assistée | Seulement si la fraude devient un poste de coût mesuré |

**Ne construisez pas la détection statistique avant d'avoir des données.** Calibrée sur
200 utilisateurs, elle ne produira que des faux positifs et fera perdre confiance à
l'équipe dans son propre outil.
