# 10 — Architecture offline

## 10.1 La réponse directe à votre question

> *« Cette architecture est-elle sécurisée ? Le client ne doit pas pouvoir modifier
> facilement `points = 999999` »*

**Une architecture offline-first peut être rendue robuste, mais elle ne peut jamais être
rendue sûre au sens cryptographique du terme.** Il faut être précis sur ce qui est
atteignable et ce qui ne l'est pas, parce que la différence détermine votre modèle
économique.

### Ce qu'on peut garantir (et qui est solide)

| Garantie | Mécanisme | Solidité |
|---|---|---|
| Le client ne peut pas **écrire** son solde serveur | RLS sans policy d'écriture + écritures via `SECURITY DEFINER` | **Absolue** |
| Un événement **forgé hors de l'app** est rejeté | Signature par clé matérielle (Keystore/Secure Enclave) | **Forte** |
| Un événement **rejoué** est ignoré | `idempotency_key UNIQUE` | **Absolue** |
| Un événement **inséré** dans l'historique est détecté | `seq` strictement monotone par installation | **Forte** |
| Le **recul de l'horloge** est sans effet | Horloge monotone (`elapsedRealtimeNanos`) + `boot_id` + horodatage serveur qui fait foi | **Forte** |
| Le volume de valeur créée est **borné** | Plafonds journaliers/mensuels appliqués côté serveur | **Absolue** |
| Une **falsification du ledger** est détectée | Chaînage de hash + vérification quotidienne | **Forte** (détection, pas prévention) |
| Un **appareil non intègre** est identifié | Play Integrity / App Attest | **Moyenne** (contournable sur device rooté) |

### Ce qu'on ne peut pas garantir

**Un attaquant qui contrôle physiquement un appareil rooté et qui a extrait la clé de
signature peut produire des événements bien formés, correctement signés et parfaitement
plausibles décrivant des faits qui n'ont jamais eu lieu.** Il aura écouté zéro publicité
et le serveur n'aura aucun moyen cryptographique de le savoir.

C'est une limite **structurelle**, pas un défaut d'implémentation. Un événement
« j'ai écouté 4 secondes d'audio » n'est observable que par le téléphone. Aucune
signature ne peut attester de la véracité d'un fait, seulement de son origine.

### La conséquence, qui est la vraie décision d'architecture

> **Ne laissez jamais un fait purement local créer une valeur non bornée.**

Trois règles qui en découlent, et qui structurent tout le reste :

1. **Plafonds durs côté serveur.** Un attaquant parfait ne peut gagner que le maximum
   autorisé pour un utilisateur honnête : ~700 points/mois, soit ~3 Go. Votre perte
   maximale par compte frauduleux est **connue et budgétée**, pas illimitée.
2. **Le coût de la fraude doit dépasser son gain.** Rooter un téléphone, extraire une clé
   matérielle et forger des batchs signés pour gagner 3 Go/mois n'est pas rentable.
   La sécurité économique remplace ici la sécurité cryptographique — et c'est
   suffisant, à condition que les plafonds soient bas.
3. **Barrière à la sortie.** La conversion en data est le point où la valeur devient
   réelle. C'est là qu'il faut concentrer les contrôles : ancienneté du compte,
   vérification du numéro, score anti-fraude, revue manuelle au-delà d'un seuil.
   Un fraudeur peut accumuler des points ; il doit avoir du mal à les **sortir**.

---

## 10.2 Architecture de la synchronisation

### Base locale

```sql
-- SQLite chiffrée (SQLCipher), clé dans le Keystore/Secure Enclave
CREATE TABLE local_events (
  seq         INTEGER PRIMARY KEY,      -- monotone, jamais réutilisé
  type        TEXT NOT NULL,            -- ad_impression | call
  payload     TEXT NOT NULL,            -- JSON canonique
  idem_key    TEXT NOT NULL UNIQUE,     -- UUIDv4 généré à la création
  t_mono_ns   INTEGER NOT NULL,         -- elapsedRealtimeNanos / systemUptime
  boot_id     TEXT NOT NULL,            -- change à chaque redémarrage
  t_wall      TEXT NOT NULL,            -- horloge murale, INDICATIVE
  sig         BLOB NOT NULL,            -- ECDSA P-256 sur le payload canonique
  state       TEXT NOT NULL DEFAULT 'pending',
  attempts    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);

CREATE TABLE local_meta (          -- stocké HORS de la base effaçable simple
  key TEXT PRIMARY KEY, value TEXT -- 'last_seq', 'install_id', 'boot_id'
);
```

### Le compteur `seq` — point de conception critique

`seq` doit être **monotone sur la durée de vie de l'installation**, y compris après
effacement des données de l'app. S'il repart à 1, le serveur ne peut plus distinguer une
réinstallation légitime d'une tentative de rejeu.

Stockage du compteur, par ordre de robustesse :
- **Android** : `EncryptedSharedPreferences` + sauvegarde dans le trousseau
  (`AccountManager`) ; surtout, **le serveur conserve `device_installations.last_seq`**
  et le renvoie à la reconnexion. Le client reprend au maximum des deux.
- **iOS** : Keychain avec `kSecAttrAccessibleAfterFirstUnlock` et
  **`kSecAttrSynchronizable = false`** — le Keychain survit à la désinstallation de
  l'app, ce qui est exactement le comportement recherché.

**C'est le serveur qui détient la vérité sur `last_seq`.** Le client propose, le serveur
impose : tout événement avec `seq <= last_seq` connu du serveur est rejeté comme rejeu.

### Signature d'un événement

```
payload_canonique = JSON trié par clé, sans espaces, UTF-8
message           = install_id || ':' || seq || ':' || sha256(payload_canonique)
                                || ':' || t_mono_ns || ':' || boot_id
signature         = ECDSA_P256_SHA256(clé_privée_matérielle, message)
```

La clé privée est **générée dans le Keystore/Secure Enclave et n'en sort jamais**. Sur
Android, demander StrongBox si disponible (`setIsStrongBoxBacked(true)`) avec repli
logiciel. Sur iOS, `kSecAttrTokenIDSecureEnclave`.

L'inclusion de `t_mono_ns` et `boot_id` dans le message signé est ce qui neutralise la
manipulation d'horloge : le temps monotone ne peut pas reculer sans redémarrage, et un
redémarrage change `boot_id`.

### Séquence complète

```
CLIENT                                          SERVEUR
──────                                          ───────
1. Événement produit (impression, appel)
   seq = last_seq + 1
   sig = sign(...)
   INSERT local_events (state='pending')
   Solde local : pending_points += 2

2. Déclencheur de synchro
   (app active + réseau | retour de connectivité
    | WorkManager 4 h | avant conversion)

3. POST /sync  {cursor, batch[≤100], attestation}
                                          ──────► 4. Vérif JWT
                                                  5. Charge l'installation + clé publique
                                                  6. Vérif attestation (cache 24 h)
                                                  7. Pour chaque événement, dans l'ordre :
                                                     a. sig valide ?           sinon → reject
                                                     b. seq > last_seq ?       sinon → reject (rejeu)
                                                     c. idem_key inconnue ?    sinon → skip (succès)
                                                     d. boot_id/t_mono cohérents ?
                                                     e. |t_wall − now| < 24 h ? sinon → clock_skew
                                                     f. campagne active à occurred_at serveur ?
                                                     g. plafonds respectés ?
                                                     h. verdict d'intégrité acceptable ?
                                                  8. ingest_sync_batch() — UNE transaction :
                                                     INSERT impressions/calls
                                                     post_ledger_entry() pour chaque crédit
                                                     UPDATE device_installations.last_seq
                                                     INSERT sync_events
9. Applique la réponse            ◄──────────── 10. {accepted, rejected[+motifs],
   state='acked' pour accepted                       wallet{confirmed}, new_cursor,
   state='rejected' + motif affichable               ad_bundle, policy}
   pending_points = 0
   confirmed_points = réponse serveur
   (le serveur écrase toujours le local)
```

---

## 10.3 Résolution de conflits

**Il n'y a pas de conflit au sens d'une édition concurrente**, et c'est une bonne nouvelle
qui simplifie énormément l'architecture. Le client ne modifie jamais une donnée partagée :
il **déclare des faits**. Le serveur **décide**.

| Situation | Résolution |
|---|---|
| Le solde local diffère du solde serveur | **Le serveur écrase, toujours.** Aucune fusion, aucune négociation |
| Un événement est envoyé deux fois | `idem_key` → ignoré, compté comme succès |
| `seq` avec un trou (5, 6, 9) | Accepté (un événement peut avoir été perdu), mais le trou est journalisé. Trous répétés → `fraud_event` faible |
| `seq` en recul | **Rejeté.** Rejeu ou réinstallation : voir 10.4 |
| Deux appareils actifs pour un compte | Un seul est `active` (index unique). L'autre reçoit `409` et doit se réenregistrer |
| Événement daté de 30 jours | Accepté, horodaté par le serveur, mais **non crédité** (hors fenêtre de grâce) |
| Campagne devenue inactive entre-temps | Impression enregistrée, `credited=false`, non facturée |
| Le serveur a crédité, le client n'a pas reçu la réponse | Le client renvoie ; `idem_key` évite le double crédit. Le solde se corrige à la synchro suivante |
| Une conversion est initiée hors ligne | **Impossible par construction** : les débits exigent le serveur |

**Ce dernier point est important :** en interdisant les débits hors ligne, vous éliminez
d'un trait la classe entière des problèmes de double dépense. Le coût est faible pour
l'utilisateur (on ne convertit pas ses points tous les jours) et le gain en sûreté est
considérable. C'est un compromis à assumer explicitement.

---

## 10.4 Le cas de la réinstallation

Scénario : l'utilisateur désinstalle l'app et la réinstalle, avec ou sans intention
frauduleuse.

```
1. Nouvelle installation → nouvel install_id, NOUVELLE clé (l'ancienne est perdue)
2. L'utilisateur se reconnecte (OTP sur le même numéro)
3. Le serveur constate : profil existant + install_id inconnu
4. Il applique la politique de réenregistrement :
   ┌────────────────────────────────────────────────────────────┐
   │ - L'ancienne installation passe en status='revoked'         │
   │ - La nouvelle est créée avec last_seq = 0 (nouvelle clé)    │
   │ - Le solde est INTACT (il vit côté serveur, pas sur         │
   │   le téléphone)                                             │
   │ - Les événements locaux non synchronisés sont PERDUS        │
   │ - Le compteur de réenregistrements est incrémenté           │
   │ - Au-delà de 3 réenregistrements en 30 j :                  │
   │   fraud_event(severity=medium) + conversions bloquées       │
   │   en attente de revue                                       │
   └────────────────────────────────────────────────────────────┘
```

**Point de conception essentiel : le solde vit côté serveur.** La base locale n'est qu'un
cache. Une réinstallation ne fait donc perdre que les événements non encore synchronisés —
au maximum quelques dizaines de points. C'est acceptable, et ce doit être écrit dans les
CGU (« synchronisez régulièrement pour ne rien perdre »).

Le réenregistrement ne peut **jamais** créer de valeur, puisqu'aucun bonus n'est attribué
à l'installation : le bonus de bienvenue est lié au **numéro** (via `phone_hash`) et
la table `deleted_accounts` conserve ce hash même après suppression du compte.

---

## 10.5 Bornes de sécurité de l'architecture offline

| Borne | Valeur | Motif |
|---|---|---|
| Taille maximale d'un batch | 100 événements | Limite la latence et la taille de transaction |
| File locale maximale | 500 événements | Au-delà : conservés mais marqués `over_quota`, non créditables |
| TTL du bundle | 7 jours | Au-delà, les créatifs sont `stale` |
| Grâce après TTL | 48 heures | Tolère un week-end sans réseau |
| Écart d'horloge toléré | 24 heures | Au-delà : accepté mais marqué `clock_skew` |
| Antériorité maximale créditable | 14 jours | Un événement plus vieux est enregistré, non crédité |
| Plafond journalier d'impressions | 12 | **La borne la plus importante du système** |
| Plafond mensuel de points | ~700 | Borne l'exposition financière par compte |
| Fréquence de synchro en tâche de fond | 4 heures | Compromis batterie / fraîcheur |

**À retenir :** ces bornes ne sont pas des détails de réglage, ce sont **les garde-fous de
sécurité du système**. Elles sont dans `system_settings` et `point_rules`, donc
modifiables sans déploiement, et tout changement passe par `audit_logs`.

---

## 10.6 Réponse synthétique

**Peut-on avoir une architecture offline-first ?** Oui, et c'est même indispensable étant
donné le contexte tunisien (connectivité intermittente, forfaits data limités).

**Est-elle sécurisée ?** Elle est **robuste** : un attaquant ne peut pas écrire son solde,
ni rejouer, ni forger depuis l'extérieur de l'app, ni manipuler son horloge utilement.
Elle n'est pas **inviolable** : un appareil rooté peut mentir sur des faits locaux.

**Cela suffit-il ?** Oui, à trois conditions strictes :
1. les plafonds sont bas et appliqués côté serveur ;
2. la conversion — le moment où la valeur devient réelle — est le point de contrôle
   principal ;
3. vous acceptez explicitement un taux de fraude résiduel et vous le **budgétez** comme un
   coût d'exploitation (2 à 5 % des points distribués est une hypothèse raisonnable à
   surveiller).

**Ce qu'il ne faut surtout pas faire :** construire un système qui suppose l'honnêteté du
client, puis découvrir le problème quand 500 comptes frauduleux ont converti 1 500 Go.
Les plafonds et la barrière à la sortie doivent être dans la **version 1**, pas dans une
version 2 « quand on aura le temps ».
