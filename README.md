# Afaqus

Ce dépôt contient deux choses distinctes :

| Dossier | Contenu | Publié sur le web ? |
|---|---|---|
| [`site/`](site/) | Site vitrine Afaqus — accueil (`index.html`), études de cas [`kaissi/`](site/kaissi/) et [`stampi/`](site/stampi/), [`articles/`](site/articles/) (liste + un dossier par article), `sitemap.xml`, image de partage, en-têtes HTTP | **Oui** — c'est le seul dossier déployé |
| [`audio-project/`](audio-project/) | Étude technique « Call Com » (publicité audio pendant l'appel) : docs, migrations SQL, présentations, devis, PDF | **Non** — document client, jamais servi par le site |

## Site vitrine

- Un seul fichier HTML, CSS inline, **aucun JavaScript**, aucun framework, aucun build, aucun traceur.
- Police Plus Jakarta Sans auto-hébergée (`site/fonts/`, licence SIL OFL) : aucune requête vers un tiers.
- Déploiement : le dossier de publication est `site/` (déjà configuré dans `netlify.toml` et `vercel.json`).
- Adresse du site : https://afaqus.com/ (canonical et Open Graph dans `site/index.html`).
- Une étude de cas = un dossier à la racine (`site/kaissi/`, `site/stampi/`), avec ses images à côté de la page.
- Un article = `site/articles/<slug>/index.html`, à ajouter aussi à la liste `site/articles/index.html`.
- Toute nouvelle page indexable doit être ajoutée à `site/sitemap.xml` (déclaré dans `robots.txt`).
- Images : uniquement des fichiers locaux — la politique de sécurité (`img-src 'self'`) bloque toute image hébergée ailleurs.

## Déploiement

- **Netlify** : glisser-déposer le dossier `site/` sur app.netlify.com/drop, ou connecter le dépôt (le `netlify.toml` fixe `publish = "site"`).
- **Vercel** : importer le dépôt → Framework « Other » → le `vercel.json` fixe `outputDirectory = "site"`.
- **Cloudflare Pages** : connecter le dépôt → Build command vide → Build output directory `site`.
