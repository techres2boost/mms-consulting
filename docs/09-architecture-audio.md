# 09 — Architecture audio

## 9.1 Format : votre hypothèse MP4 est à corriger

**MP4 n'est pas un format audio, c'est un conteneur.** « MP4 » peut contenir de l'AAC,
de l'ALAC, de l'Opus… Ce qui compte est le **codec**, le **débit** et le **nombre de
canaux**. Comparaison sur le cas réel : **4 secondes de voix, mono**.

| Codec | Conteneur | Débit voix acceptable | Taille pour 4 s | Android | iOS | Verdict |
|---|---|---|---|---|---|---|
| **Opus** | `.opus` (Ogg) ou `.caf` | **24–32 kbps** | **~12–16 Ko** | ✅ natif (API 21+) | ✅ natif (iOS 17+ fiable) | **Recommandé** |
| AAC-LC | `.m4a` / `.mp4` | 48–64 kbps | ~24–32 Ko | ✅ natif | ✅ natif (toutes versions) | **Fallback iOS** |
| MP3 | `.mp3` | 64–96 kbps | ~32–48 Ko | ✅ | ✅ | Acceptable, 2–3× plus lourd |
| WAV / PCM | `.wav` | 256 kbps (16 bit / 16 kHz) | ~128 Ko | ✅ | ✅ | **Master uniquement**, jamais distribué |
| AMR-NB | `.amr` | 12,2 kbps | ~6 Ko | ✅ | ⚠️ | Trop dégradé pour un message de marque |

Opus est conçu pour la parole comme pour la musique, se comporte très bien à bas débit et
à faible latence. Pour de la voix, il atteint une qualité utilisable dès 16–24 kbps ;
32 kbps mono donne une qualité confortable pour un message publicitaire.

### Décision

```
Master (upload)      : WAV 48 kHz 16 bit, ou MP3/M4A de bonne qualité
Distribution         : Opus 32 kbps mono 48 kHz, en conteneur Ogg  → ~16 Ko
Fallback iOS < 17    : AAC-LC 64 kbps mono en .m4a                  → ~32 Ko
Normalisation        : −16 LUFS, pic ≤ −1 dBTP
```

**Conséquence remarquable :** le catalogue complet est minuscule.
**200 créatifs actifs = ~3,2 Mo.** Votre inquiétude sur le poids du stockage est infondée
*pour l'audio* — 4 secondes de voix mono ne pèsent rien. Le vrai poste de stockage du
système sera la table `advertisement_impressions`, pas les fichiers. C'est un
renversement utile à intégrer dans les priorités.

### Pourquoi la normalisation de loudness n'est pas un détail

Sans normalisation, un créatif enregistré fort et un créatif enregistré faible créent une
expérience désagréable et des réclamations d'annonceurs (« on n'entend pas ma pub »).
`ffmpeg -af loudnorm=I=-16:TP=-1:LRA=11` en deux passes résout le problème
définitivement. À faire dès le MVP — c'est 3 lignes de code pour un gain de qualité
perçue élevé.

---

## 9.2 Contrôles de validation à l'upload

**À faire deux fois : dans le navigateur pour le confort, et sur le serveur pour la
sécurité.** La sortie du navigateur est une donnée non fiable comme une autre.

| Contrôle | Seuil | Action si échec |
|---|---|---|
| Type MIME **réel** (magic bytes, pas l'extension) | audio/* | Rejet |
| Durée | 2 000 ≤ d ≤ 8 000 ms | Rejet avec message clair |
| Taille après transcodage | ≤ 200 Ko | Rejet |
| Nombre de canaux | mono après transcodage | Downmix automatique |
| Silence | portion silencieuse < 50 % de la durée | Rejet (fichier vide ou corrompu) |
| Pic | ≤ −1 dBTP après normalisation | Correction automatique |
| Loudness intégré | −16 LUFS ± 1 | Correction automatique |
| Hash | SHA-256 calculé serveur | Stocké, vérifié par le client |
| Doublon | hash déjà présent pour cette entreprise | Avertissement, pas rejet |

**Antivirus :** un scan antiviral sur un fichier audio de 16 Ko destiné à un décodeur
système a un rapport coût/bénéfice très faible. **Ce qui protège réellement**, c'est :
(1) valider le type réel par magic bytes, (2) **transcoder systématiquement** — le
transcodage détruit tout contenu malveillant embarqué en réencodant le signal, (3) ne
jamais servir le fichier d'origine au client. Le transcodage *est* votre assainissement.
Un scan ClamAV peut être ajouté en Phase 2 si un audit l'exige, mais ce n'est pas une
priorité de sécurité ici.

---

## 9.3 Stockage : réponses précises sur Supabase Storage

| Question | Réponse | Remarque |
|---|---|---|
| **Taille maximale** | Largement suffisante : la limite par défaut est de l'ordre de 50 Mo par fichier sur le plan payant (configurable). Vos fichiers font 16 Ko | Non contraignant |
| **CDN** | Supabase Storage sert via un CDN. Le **cached egress** est facturé moins cher que l'uncached | Vérifier les tarifs à la date du projet |
| **Cache** | `Cache-Control: public, max-age=31536000, immutable` — possible car le chemin contient la version du créatif | Un créatif ne change **jamais** : toute modification crée une nouvelle version |
| **Téléchargement mobile** | Téléchargement HTTP direct depuis l'URL signée, écriture dans le répertoire privé de l'app | 20 créatifs ≈ 320 Ko : une seule requête par fichier suffit, pas besoin d'archive |
| **Chiffrement** | Au repos côté fournisseur, en transit via TLS | Un chiffrement applicatif du créatif n'apporte rien : le contenu est destiné à être entendu publiquement |
| **Accès privé** | ✅ Bucket privé obligatoire | Un bucket public rendrait tous les créatifs énumérables, y compris avant leur date de début |
| **URLs signées** | ✅ TTL 7 jours, alignées sur la durée de vie du bundle | Plus court = échecs hors ligne ; plus long = fuite durable |
| **Expiration** | Gérée par le TTL de l'URL signée, renouvelée à chaque synchro | |
| **Versioning** | **Applicatif**, pas par le stockage : `advertisements.version` + chemin versionné | Bien plus simple à raisonner que le versioning objet |
| **Suppression** | Job `job_archive_purge()` → `status='purged'` puis suppression par un worker | Le fichier part, les statistiques restent |
| **Archivage** | Déplacement vers `/archive/` + `Cache-Control` court | Sur Supabase il n'y a pas de classe de stockage froid : le gain est marginal. Envisager un bucket S3 Glacier externe seulement si le volume le justifie (il ne le justifiera pas) |
| **Purge automatique** | ✅ `pg_cron` hebdomadaire | Voir 9.6 |

### Arborescence

```
Bucket privé : ad-creatives

/advertisements/{company_id}/{campaign_id}/{ad_id}-v{version}-{lang}.opus
/advertisements/{company_id}/{campaign_id}/{ad_id}-v{version}-{lang}.m4a   # fallback
/masters/{company_id}/{campaign_id}/{ad_id}-v{version}.wav                  # supprimé à l'archivage
/archive/{year}/{company_id}/{campaign_id}/...                              # 90–180 j
/proofs/{redemption_id}.{ext}                                               # reçus de conversion
```

Votre proposition `/advertisements/{company_id}/{campaign_id}/{audio_file}` est correcte.
J'y ajoute **la version et la langue dans le nom de fichier**, ce qui rend le cache
immuable et supprime toute invalidation de CDN.

---

## 9.4 Synchronisation des créatifs vers le téléphone

```
1. L'app envoie sa version de bundle connue :
   GET /ad-bundle?zone=TN-12&v=20260918T0800

2. Si inchangé  → 304, rien à faire (requête ~200 octets)
   Si changé    → 200 avec :
   {
     "version": "20260919T0800",
     "ttl_days": 7,
     "policy": { "freq_cap_minutes": 10, "daily_cap": 12 },
     "ads": [{
       "id": "...", "campaign_id": "...", "version": 2, "lang": "ar",
       "url": "https://...signed...", "sha256": "...",
       "duration_ms": 4120, "size_bytes": 16284,
       "effective_weight": 177, "user_daily_cap": 3, "user_freq_cap_minutes": 60,
       "valid_from": "2026-09-15", "valid_to": "2026-10-15",
       "advertiser_display_name": "Restaurant XYZ"
     }]
   }

3. L'app :
   - télécharge les créatifs absents du cache
   - VÉRIFIE LE SHA-256 (un fichier dont le hash diffère est jeté)
   - supprime les créatifs qui ne sont plus dans le bundle
   - écrit la nouvelle version en base locale

4. Budget réseau : 20 créatifs × 16 Ko = 320 Ko au premier chargement,
   puis ~16–48 Ko par renouvellement hebdomadaire (1 à 3 nouveaux créatifs).
```

### Implications à assumer

| Implication | Détail | Mitigation |
|---|---|---|
| **Pas de diffusion temps réel** | Un créatif activé à 10 h peut n'être diffusé qu'à 14 h | L'écrire dans le contrat annonceur : délai de mise en ligne de 24 h |
| **Une campagne arrêtée continue de tourner** | L'utilisateur hors ligne a encore le fichier | `valid_to` embarqué dans le bundle : le client refuse de diffuser hors fenêtre. Les impressions hors fenêtre arrivent quand même rejetées → **facturation protégée** |
| **Un créatif retiré en urgence** (erreur, contenu litigieux) | Reste sur les téléphones jusqu'à la prochaine synchro | Prévoir un **kill-switch push** : notification silencieuse forçant un rafraîchissement immédiat du bundle. À implémenter en Phase 2 — c'est une exigence de gestion de crise, pas un confort |
| **Les créatifs sont extractibles du téléphone** | Un utilisateur root peut les récupérer | Sans importance : ce sont des publicités destinées à être entendues |
| **Fuite d'une campagne avant sa date** | Le bundle ne contient que les campagnes `active` | Ne jamais envoyer de campagne `approved` non encore démarrée |

---

## 9.5 Lecture sur le téléphone

- **Sortie : écouteur (`earpiece`)**, pas haut-parleur. L'utilisateur porte déjà le
  téléphone à l'oreille pour appeler, et cela évite de diffuser la publicité à
  l'entourage.
- **Préchargement en mémoire** avant l'affichage de l'écran : 16 Ko se décodent
  instantanément, il ne doit y avoir aucune latence perceptible.
- **Suivi de progression toutes les 250 ms** → alimente `played_ms` et `completion_pct`.
- **Interruptions** : appel entrant, perte de focus, coupure audio, retrait du casque →
  impression marquée `partial`, jamais créditée, et l'appel est tout de même lancé
  (ne jamais pénaliser l'utilisateur pour un incident technique).
- **Respect du volume système** : ne jamais forcer le volume. C'est un motif de rejet
  store et de mauvaises notes.
- **Mode silencieux** : si le téléphone est en silencieux, la lecture sur l'écouteur reste
  audible, mais il faut détecter le cas et, à défaut de son, marquer `partial`.

---

## 9.6 Stratégie de purge et d'archivage

```
                    ┌──────────┐
                    │  active  │
                    └────┬─────┘
       fin de campagne   │   budget épuisé
                    ┌────▼─────┐
                    │ expired  │  fichier toujours en ligne
                    └────┬─────┘
                  J+90   │
                    ┌────▼─────┐
                    │ archived │  master WAV supprimé,
                    └────┬─────┘  créatif déplacé vers /archive/
                  J+180  │
                    ┌────▼─────┐
                    │  purged  │  fichier audio SUPPRIMÉ
                    └──────────┘  métadonnées + stats CONSERVÉES
```

### Ce qui est supprimé et ce qui ne l'est jamais

| Donnée | À J+90 | À J+180 | Conservation |
|---|---|---|---|
| Master WAV | **supprimé** | — | Aucun besoin après validation |
| Créatif Opus/AAC | déplacé | **supprimé** | |
| `advertisements` (ligne) | conservée | conservée | **Indéfiniment** |
| `duration_ms`, `sha256`, `size_bytes` | conservés | conservés | **Indéfiniment** — preuve de ce qui a été diffusé |
| `campaigns` (ligne) | conservée | conservée | **Indéfiniment** |
| `daily_campaign_stats` | conservés | conservés | **Indéfiniment** |
| `campaign_invoices` + `snapshot` | conservés | conservés | **Indéfiniment** — obligation comptable |
| `advertisement_impressions` (lignes brutes) | purgées à J+90 (partition) | — | Les agrégats portent la vérité facturable |
| `points_ledger` (lignes liées) | conservées | conservées | **Indéfiniment** — append-only |

**Règle de sécurité :** `job_archive_purge()` ne touche **que** `advertisements.status` et
les fichiers. Il ne supprime jamais une ligne de `campaigns`, `daily_campaign_stats`,
`campaign_invoices` ou `points_ledger`. Le `snapshot` JSON figé dans
`campaign_invoices` garantit qu'une facture reste défendable même si toutes les tables
sources ont été purgées — c'est le point qui protège vos audits.

**Un garde-fou à écrire dans le job :** refuser la purge d'un créatif dont la campagne a
une facture en statut `draft` ou `issued` non payée. Un litige de facturation peut exiger
de réécouter le créatif.

### Conservation du SHA-256 après purge

C'est un détail à forte valeur : même après suppression du fichier, vous conservez la
preuve cryptographique de **quel** contenu exact a été diffusé. Si un annonceur prétend
que vous avez diffusé la mauvaise version, et qu'il détient encore son fichier d'origine,
le hash tranche la discussion. Coût : 32 octets par créatif.
