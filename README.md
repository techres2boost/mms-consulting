# SSM Consulting

Ce dépôt contient deux choses distinctes :

| Dossier | Contenu | Publié sur le web ? |
|---|---|---|
| [`site/`](site/) | Site vitrine SSM Consulting — une page statique (`index.html`), image de partage, en-têtes HTTP | **Oui** — c'est le seul dossier déployé |
| [`audio-project/`](audio-project/) | Étude technique « Call Com » (publicité audio pendant l'appel) : docs, migrations SQL, présentations, devis, PDF | **Non** — document client, jamais servi par le site |

## Site vitrine

- Un seul fichier HTML, CSS inline, **aucun JavaScript**, aucun framework, aucun build, aucun traceur.
- Police Plus Jakarta Sans auto-hébergée (`site/fonts/`, licence SIL OFL) : aucune requête vers un tiers.
- Déploiement : le dossier de publication est `site/` (déjà configuré dans `netlify.toml` et `vercel.json`).
- Adresse du site : https://ssm-consulting.vercel.app/ (canonical et Open Graph dans `site/index.html`).

## Déploiement

- **Netlify** : glisser-déposer le dossier `site/` sur app.netlify.com/drop, ou connecter le dépôt (le `netlify.toml` fixe `publish = "site"`).
- **Vercel** : importer le dépôt → Framework « Other » → le `vercel.json` fixe `outputDirectory = "site"`.
- **Cloudflare Pages** : connecter le dépôt → Build command vide → Build output directory `site`.
