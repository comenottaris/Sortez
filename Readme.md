

Contenu du dépôt :

```
.github/workflows/add-event.yml
css/styles.css
data/events.json
js/app.js
iframe.html
index.html
.nojekyll
README.md
```

## Objectif

Application statique pour afficher une heatmap de calendrier (Cal-Heatmap) et ajouter des événements via une interface mobile-first. L’écriture des données se fait via GitHub Actions déclenchées par l’API; aucune écriture directe dans le repo depuis le frontend.

## Données

`data/events.json` contient un tableau d’événements. Chaque événement est un objet avec :

* `date` (YYYY-MM-DD)
* `title` (string)
* `count` (integer)
* `link` (URL ou null)
* `image` (URL ou null)
* `created_at` (ISO timestamp)

Exemple :

```json
[
  {
    "date": "2026-01-27",
    "title": "Exemple",
    "count": 1,
    "link": "https://…",
    "image": "https://…",
    "created_at": "2026-01-27T12:34:56Z"
  }
]
```

## Frontend

**index.html** et **iframe.html** chargent Cal-Heatmap via CDN :

* `d3.v3` requis par la version utilisée de Cal-Heatmap.
* `js/app.js` gère :

  * récupération de `data/events.json` (fetch avec `cache:"no-store"`)
  * transformation en format attendu par Cal-Heatmap
  * UI formulaire pour créer des événements
  * envoi des événements au workflow via l’API GitHub (`workflow_dispatch`)

Fonctions essentielles dans `js/app.js` :

* `loadEventsFromRepo()` : fetch et conversion des événements
* `eventsToCalData(events)` : transformation en `{epoch: count}`

L’interface propose un formulaire qui, après validation, appelle une fonction backend (voir Actions).

## Backend serverless (GitHub Actions)

Fichier : `.github/workflows/add-event.yml`

Déclenchement : `workflow_dispatch` avec un paramètre `payload` (string JSON).

Actions :

1. Checkout du repo
2. Création de `data` si nécessaire
3. Traitement des flux JSON :

   * écriture de l’événement dans un fichier temporaire
   * ajout au tableau existant via `jq`
4. Commit et push de `data/events.json`

Points spécifiques :

* Utilisation de `jq` pour la concaténation JSON
* Configuration Git pour commit avec l’utilisateur `github-actions`
* Aucune dépendance externe au-delà de `jq`

## Authentification GitHub

Le frontend nécessite un token PAT stocké localement (`localStorage`) sur l’appareil pour appeler l’API GitHub :

* scope requis : `repo` et `workflow` (ou permissions fines pour Actions)
* le token n’est pas dans le dépôt ni dans le code source

Le frontend envoie au workflow :

```
POST https://api.github.com/repos/{OWNER}/{REPO}/actions/workflows/add-event.yml/dispatches
```

Body :

```json
{
  "ref": "main",
  "inputs": {
    "payload": "{…JSON stringify…}"
  }
}
```

## Déploiement GitHub Pages

Le site est servi via GitHub Pages (branche configurée selon réglage GitHub). L’iframe (hotglue.me external) doit pointer vers `iframe.html` du site Pages.

## Tests et maintenance

Vérifier dans l’onglet **Actions** :

* exécution du workflow après dispatch
* mise à jour correcte de `data/events.json`
  Suivi des logs et status de l’API GitHub. GitHub Pages requiert une propagation après chaque push.

## Conventions

* Le frontend ne devient jamais source de commits directs
* Le backend est exclusivement le workflow GitHub Actions
* Le format JSON doit être strictement respecté pour éviter les erreurs `jq`
* Eviter la persistance de tokens à long terme dans des environnements non sécurisés
