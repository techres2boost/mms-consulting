# 99 — Sources et éléments à vérifier

Recherches effectuées le **19 septembre 2026**. Les tarifs cloud et la disponibilité des
services télécom évoluent : re-vérifier avant tout engagement contractuel.

---

## Limitations des systèmes d'exploitation

- [Using an Android Phone as a GSM Gateway for VoIP: What's Actually Possible in 2026 — ICT Innovations](https://ictinnovations.com/using-android-phone-as-gsm-gateway/) — confirme que l'injection audio dans un appel CS n'est pas atteignable sur Android stock en 2026, et que le verrou est le firmware modem / RIL, pas seulement l'API Android
- [Apple Developer Forums — CallKit audio session, `AVAudioSessionErrorInsufficientPriority`](https://developer.apple.com/forums/thread/69874)
- [Apple Developer Forums — CallKit: Call Detection](https://developer.apple.com/forums/thread/73836) — CallKit ne détecte pas les appels GSM natifs, pour des raisons de confidentialité
- [`CXCallObserver` — Apple Developer Documentation](https://developer.apple.com/documentation/callkit/cxcallobserver)
- [Apple Developer Forums — CXCallObserver en arrière-plan](https://developer.apple.com/forums/thread/680436) — aucune mise à jour quand l'app est en arrière-plan
- [Telecom framework overview — Android Developers](https://developer.android.com/develop/connectivity/telecom)
- [`CallRedirectionService` — Android Developers](https://developer.android.com/reference/android/telecom/CallRedirectionService)
- [`ConnectionService` — Android Developers](https://developer.android.com/reference/android/telecom/ConnectionService)
- [Permissions used only in default handlers — Android Developers](https://developer.android.com/guide/topics/permissions/default-handlers)

## Politiques des stores

- [Use of SMS or Call Log permission groups — Google Play Console Help](https://support.google.com/googleplay/android-developer/answer/10208820?hl=en) — l'accès au journal d'appels exige le rôle de gestionnaire par défaut
- [Permissions and APIs that Access Sensitive Information — Play Console Help](https://support.google.com/googleplay/android-developer/answer/16558241)
- [Foreground service types — Android Developers](https://developer.android.com/develop/background-work/services/fgs/service-types)

## Attestation et intégrité

- [Overview of the Play Integrity API — Android Developers](https://developer.android.com/google/play/integrity/overview)
- [Integrity verdicts — Android Developers](https://developer.android.com/google/play/integrity/verdicts)
- [Make a standard API request — Android Developers](https://developer.android.com/google/play/integrity/standard)
- [A Practical Guide to Play Integrity API — ProAndroidDev](https://proandroiddev.com/a-practical-guide-to-play-integrity-api-everything-you-need-to-implement-attestation-on-android-c010f0fc8f09) — quota par défaut ~10 000 vérifications/jour, à augmenter en Play Console

## Publicité en tonalité de retour d'appel (RBT)

- [Ringback tone advertising — HandWiki](https://handwiki.org/wiki/Engineering:Ringback_tone_advertising)
- [Ring Back Tones (RBT): The MVNO Guide to Caller Tunes — MVNO Index](https://mvno-index.com/ring-back-tones-rbt/) — la plateforme RBT intercepte la tonalité générée par le réseau ; inventaire de 10 à 15 s possédé par l'opérateur
- [About: Ringback tone advertising — DBpedia](https://dbpedia.org/page/Ringback_tone_advertising)
- [Ringback Tones Platform — Amplitiv](https://amplitiv.com/vas/ringback-tones-platform/)

## Précédents de marché (modèle publicitaire)

- [Blyk ad-funded MVNO model fails — Telecoms.com](https://www.telecoms.com/mvnos/blyk-ad-funded-mvno-model-fails)
- [Blyk Will Close Its UK Ad-funded Mobile Service Next Month — PCWorld](https://www.pcworld.com/article/524502/article-5992.html)
- [Blyk — Wikipedia](https://en.wikipedia.org/wiki/Blyk)
- [RingPlus severely curtails free mobile plan offerings — Clark.com](https://clark.com/technology/ringplus-curtails-free-mobile-plan/)
- [RingPlus Bring Free Plans Subsidized By Ringback Tones — Android Headlines](https://www.androidheadlines.com/2015/06/ringplus-bring-free-plans-subsidized-ringback-tones.html)

## Télécom Tunisie

- [Telecommunications in Tunisia — Wikipedia](https://en.wikipedia.org/wiki/Telecommunications_in_Tunisia) — INT créée par le Code des télécommunications de 2001
- [Telephone numbers in Tunisia — Wikipedia](https://en.wikipedia.org/wiki/Telephone_numbers_in_Tunisia)
- [Tunisian Telcos' plan to take the internet hostage — Access Now](https://www.accessnow.org/tunisian-telcos-plan-to-take-the-internet-hostage/) — historique de restriction de la VoIP grand public par les trois opérateurs
- [Tunisie Telecom, Orange, Ooredoo secure 5G licences in Tunisia — Telecompaper](https://www.telecompaper.com/news/tunisie-telecom-orange-ooredoo-secure-5g-licences-in-tunisia--1520925)
- [Tunisia — Telecoms, Mobile and Broadband — BuddeComm](https://www.budde.com.au/Research/Tunisia-Telecoms-Mobile-and-Broadband-Statistics-and-Analyses) — marché à 3 MNO, quelques MVNO (Lycamobile, Asel Mobile)

## Recharge / conversion en data

- [Airtime API for Ooredoo, Tunisie Telecom and Orange in Tunisia — Reloadly](https://operators.reloadly.com/ooredoo-tunisie-telecom-orange-tunisia-airtime-api/) — API couvrant les trois opérateurs tunisiens, montants en dinar tunisien
- [Recharge Tunisia Mobiles Online — Ding](https://www.ding.com/countries/africa/tunisia)

## Données personnelles — Tunisie

- [Loi organique n° 2004-63 du 27 juillet 2004 — Legal Databases Tunisie](https://legislation-securite.tn/latest-laws/loi-organique-n-2004-63-du-27-juillet-2004-portant-sur-la-protection-des-donnees-a-caractere-personnel/)
- [Loi organique n° 2004-63 — texte intégral (INS)](https://www.ins.tn/sites/default/files/2020-04/Loi%2063-2004%20Fr.pdf)
- [Autorisation préalable de transfert de données vers l'étranger — INPDP / Idaraty](https://idaraty.tn/fr/procedures/autorisation-prealable-de-transfert-de-donnees-vers-l-etranger-inpdp) — **autorisation obligatoire** (art. 47, 50 à 52)
- [INPDP — Procédures](https://www.inpdp.tn/Procedures.pdf)
- [Loi tunisienne sur la protection des données (Loi 2004-63) : guide pratique 2026 — DPO Consulting](https://www.dpo-consulting.com/fr-fr/blog/loi-tunisienne-sur-la-protection-des-donnees)
- [Practical Guide: Application of Tunisian Legislation on Personal Data Protection — Boussayen Knani & Associés](https://bkassocies.tn/en/practical-guide-application-of-tunisian-legislation-on-personal-data-protection/)
- [Le décret-loi 54 face à la loi n° 2004-63 — Village de la Justice](https://www.village-justice.com/articles/decret-loi-face-loi-2004-sur-les-donnees-personnelles-une-perspective-critique,54276.html)

## Tarifs infrastructure (septembre 2026)

- [Pricing & Fees — Supabase](https://supabase.com/pricing)
- [Manage Egress usage — Supabase Docs](https://supabase.com/docs/guides/platform/manage-your-usage/egress)
- [Supabase Pricing 2026: Plans, Overage Rates, and Real Monthly Costs — Flexprice](https://flexprice.io/blog/supabase-pricing-breakdown)
- [Supabase Pricing in 2026 — UI Bakery](https://uibakery.io/blog/supabase-pricing)
- [Pricing on Vercel](https://vercel.com/docs/pricing)
- [Vercel Cost in 2026 — MakerKit](https://makerkit.dev/blog/saas/vercel-cost)
- [Vercel Pricing in 2026: Plans, Credits — Flexprice](https://flexprice.io/blog/vercel-pricing-breakdown)
- [Apple Developer Fee 2026: What $99 a Year Actually Covers — Magora](https://magora-systems.com/apple-developer-fee/)
- [Google Play Developer Fee 2026: $25 — IconikAI](https://www.iconikai.com/blog/google-play-developer-account-fee-2026)
- [Cost to Publish an App on the App Stores (2026) — Axon](https://axonbuild.com/blog/cost-to-publish-an-app-to-the-app-stores)

## Codecs audio

- [Comparison — Opus Codec](https://opus-codec.org/comparison/)
- [Opus Bitrate Guide: Best Settings for Voice & Music — CleverUtils](https://cleverutils.com/opus-to-mp3/opus-bitrate-guide) — qualité voix utilisable dès 16–24 kbps
- [Audio Codecs 2026: MP3 vs AAC vs Opus — ShoutcastNet](https://www.shoutcastnet.com/school/audio-codecs-mp3-aac-opus-comparison.php)
- [AAC vs Opus — Cloudinary](https://cloudinary.com/guides/video-formats/aac-vs-opus)

---

## ⚠ Éléments NON vérifiés — à confirmer en Phase 0

Ces points n'ont **pas** pu être établis par source publique fiable. Ils sont traités dans
le dossier comme des inconnues explicites, jamais comme des acquis.

| # | À vérifier | Auprès de qui | Impact si négatif |
|---|---|---|---|
| 1 | **Numéros +216 disponibles chez un CPaaS**, avec voix entrante et terminaison vers les mobiles tunisiens | Twilio, Telnyx, Vonage, Infobip + un ITSP tunisien licencié | Clôt définitivement ALT-B (déjà écarté pour d'autres raisons) |
| 2 | **Tarifs de terminaison voix vers la Tunisie** | idem | idem |
| 3 | **Passthrough de CLI autorisé** en Tunisie | opérateurs, INT | idem |
| 4 | **Régime réglementaire INT** de la terminaison VoIP et du bridge d'appel | conseil juridique + INT | idem |
| 5 | **Coût de gros des bundles data tunisiens** (hypothèse retenue : ~3 millimes/Mo) | TT, Orange TN, Ooredoo TN, agrégateurs | **Change directement l'économie unitaire (§16)** |
| 6 | **Les agrégateurs couvrent-ils les *bundles data*** ou seulement l'*airtime* pour la Tunisie ? | Reloadly, Ding | Repli sur le crédit d'appel |
| 7 | **Tarifs des agrégateurs SMS locaux** (hypothèse : 3 à 10× moins cher qu'un CPaaS) | agrégateurs tunisiens | Jusqu'à 28 % de la facture infra à 100 k |
| 8 | **CPM réel accepté par les annonceurs locaux** | 15 à 20 annonceurs | **LE risque n°1. Détermine la viabilité du projet** |
| 9 | Existence et conditions d'une **offre RBT advertising** chez les trois opérateurs | TT, Orange TN, Ooredoo TN | Détermine la faisabilité d'ALT-A |
| 10 | **Qualification exacte du dossier INPDP** (déclaration + autorisation de transfert) | conseil juridique tunisien | Bloquant pour la mise en production |
| 11 | Interaction du **décret-loi 54 de 2022** avec vos obligations | conseil juridique tunisien | Obligations de conservation supplémentaires |
| 12 | **Tarifs exacts du compute additionnel Supabase** (ordres de grandeur utilisés) | supabase.com/pricing | Marginal sur le budget |

**Le point 8 est celui qui décide du projet.** Les onze autres sont des paramètres ; celui-là
est la condition d'existence.
