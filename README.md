# Sortez — README

Ce document décrit **tout le projet** : architecture, fichiers, installation, sécurité et usage. Il explique en particulier :

* comment **connecter `data/events.json` à la Cal-Heatmap** (lecture « live » dans la page),
* comment **afficher le calendrier dans hotglue.me** via une `iframe`,
* comment fonctionne le **backend serverless 100 % GitHub Actions** pour ajouter les événements sans exposer de secret côté client.

---

## Table des matières

1. Vue d'ensemble
2. Structure du dépôt
3. Format `data/events.json`
4. Flux (architecture)
5. Installation et déploiement (pas à pas)
6. Code : lecture live de `events.json` et conversion pour Cal-Heatmap
7. Intégration iframe (hotglue.me)
8. GitHub Action (backend) — fichier `add-event.yml`
9. Sécurité & tokens
10. Tests & troubleshooting
11. Extensions recommandées

---

## 1. Vue d'ensemble

Sortez est une petite application **statique** (GitHub Pages) qui affiche une heatmap calendrier (Cal-Heatmap) et permet d'ajouter des événements depuis une interface mobile-first. L'ajout d'événement se fait via un **workflow GitHub Actions** déclenché depuis le navigateur — le frontend n'écrit jamais directement dans le repo.

Avantages :

* zéro serveur externe (tout sur GitHub)
* pas de secret exposé dans le repo
* compatible iframe (hotglue.me)

---

## 2. Structure du dépôt

```
/ (root)
├─ index.html           # page principale (mobile-first)
├─ iframe.html          # version minimale pour iframe
├─ css/styles.css
├─ js/app.js
├─ data/events.json     # (créé/édité par GitHub Action)
├─ README.md
└─ .github/workflows/add-event.yml
```

> `data/events.json` doit exister (même `[]`) avant la première écriture par l'action.

---

## 3. Format `data/events.json`

Le fichier est un tableau d'objets JSON. Exemple :

```json
[
  {
    "date": "2026-01-27",
    "title": "Vernissage",
    "count": 1,
    "link": "https://example.com/event/123",
    "image": "https://example.com/img.jpg",
    "created_at": "2026-01-27T12:34:56Z"
  }
]
```

* `date` : `YYYY-MM-DD` (obligatoire)
* `count` : entier ≥ 1 (détermine l'intensité sur la heatmap)
* `link`, `image` : URL optionnelles
* `created_at` : timestamp ISO (ajouté par le frontend/action)

---

## 4. Flux (architecture)

1. Utilisateur saisit un événement dans `index.html` (mobile).
2. Frontend appelle l'API GitHub (`workflows/:workflow_id/dispatches`) en envoyant le JSON de l'événement. L'appel utilise un token stocké **localement** (sur l'appareil) — le token sert uniquement à déclencher le workflow.
3. GitHub Actions `add-event.yml` récupère l'input, l'ajoute à `data/events.json`, commit & push sur la branche `main`.
4. GitHub Pages déploie le contenu public (ou la branche `gh-pages` selon ta configuration).
5. La page (et l'iframe) lisent `data/events.json` via `fetch()` pour afficher la heatmap.

---

## 5. Installation et déploiement (pas à pas)

1. **Cloner / push** les fichiers dans `https://github.com/comenottaris/Sortez`.
2. Crée `data/events.json` avec `[]` et push :

   ```bash
   mkdir -p data
   echo '[]' > data/events.json
   git add data/events.json
   git commit -m "chore: add empty events file"
   git push origin main
   ```
3. Crée le workflow `.github/workflows/add-event.yml` (voir section 8) et push.
4. Active GitHub Pages dans `Settings → Pages` :

   * Branch : `gh-pages` or `main` (root). Si tu utilises `peaceiris/actions-gh-pages` tu peux déployer vers `gh-pages`. Pour nos besoins, déployer depuis `main` root est acceptable.
5. Crée un Personal Access Token (PAT) **ou** un token **fine-grained** avec permission de déclencher workflows. Les détails en section 9.
6. Sur ton téléphone, ouvre la page `index.html`, va dans la zone admin, colle le token BRUT (stockage `localStorage`). Tu n’as à le saisir qu’une fois.
7. Test : ajoute un événement, vérifie que l'action a été déclenchée et que `data/events.json` a reçu la nouvelle entrée.

---

## 6. Code : lecture live de `events.json` et conversion pour Cal-Heatmap

Dans `js/app.js`, pour alimenter la heatmap à partir de `data/events.json`, utilisez ce pattern :

```javascript
// charge events.json et met à jour Cal-Heatmap
async function loadEventsFromRepo(){
  try{
    const res = await fetch('/data/events.json', {cache: 'no-store'});
    if(!res.ok) throw new Error('events.json non trouvé');
    const events = await res.json(); // tableau d'objets
    const dataObj = eventsToCalData(events);
    if(window.calInstance){
      window.calInstance.update(dataObj, null, window.calInstance.RESET_ALL_ON_UPDATE);
    } else {
      window.calInstance = new CalHeatMap();
      window.calInstance.init({
        data: dataObj,
        domain: 'month',
        subDomain: 'day',
        start: new Date(),
        range: 6,
        tooltip: true,
        legend: [1,3,7,15]
      });
    }
    renderEventsList(events);
  }catch(err){ console.error(err); }
}

function eventsToCalData(events){
  const out = {};
  events.forEach(ev => {
    const d = new Date(ev.date + 'T00:00:00');
    const ts = Math.floor(d.getTime()/1000);
    out[ts] = (out[ts] || 0) + (Number(ev.count) || 1);
  });
  return out;
}
```

* **Remarques** :

  * `fetch('/data/events.json')` fonctionne sur GitHub Pages (fichier statique).
  * `cache: 'no-store'` empêche les caches navigateur/CDN d'afficher d'anciennes versions.
  * Après le commit via l'action, GitHub Pages peut mettre quelques secondes à publier la nouvelle version.

---

## 7. Intégration iframe (hotglue.me)

Utilise la `iframe.html` minimale du repo. Exemple d'embed pour hotglue.me :

```html
<iframe
  src="https://comenottaris.github.io/Sortez/iframe.html"
  style="width:100%;height:700px;border:0;"
  loading="lazy"></iframe>
```

* `iframe.html` doit charger la même logique JS (ou une version allégée) et lire `/data/events.json`.
* Si Pages est configuré correctement, l'iframe affichera la heatmap publique. Si tu veux afficher l'iframe **dans une interface externe** (hotglue), il suffit de copier-coller le code ci-dessus.

---

## 8. GitHub Action (backend) — `add-event.yml`

Crée le fichier suivant :

```yaml
name: Add calendar event

on:
  workflow_dispatch:
    inputs:
      payload:
        description: 'Event payload JSON'
        required: true
        type: string

jobs:
  add-event:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Ensure data dir
        run: mkdir -p data

      - name: Append event to data/events.json
        env:
          PAYLOAD: "${{ github.event.inputs.payload }}"
        run: |
          FILE=data/events.json
          echo "$PAYLOAD" > new.json

          if [ -f "$FILE" ]; then
            jq '. += [input]' "$FILE" new.json > tmp.json
          else
            jq '[input]' new.json > tmp.json
          fi
          mv tmp.json "$FILE"

      - name: Commit & push
        run: |
          git config user.name "github-actions"
          git config user.email "actions@github.com"
          git add data/events.json
          git commit -m "Add event via workflow" || echo "no changes to commit"
          git push
```

**Notes** :

* Le contenu de `github.event.inputs.payload` est inséré dans `new.json` ; `jq` l'ajoute proprement au tableau.
* Le `workflow_dispatch` peut être déclenché via l'API (`/dispatches`) depuis le frontend en envoyant le PAT.

---

## 9. Sécurité & tokens

### Quel token utiliser ?

* **Fine-grained token** recommandé (GitHub) : accorde uniquement les permissions nécessaires (Actions: read & write) pour le repo `Sortez`.
* Alternativement, un PAT classique avec scope `repo` + `workflow` fonctionne.

### Où stocker le token ?

* **Jamais** dans le repo.
* Le frontend propose d'entrer le token sur l'appareil (stockage `localStorage`).
* **Meilleure pratique** : utiliser un service intermédiaire ou secrets serveur si tu veux une sécurité maximale.

### Pourquoi ce modèle est sécurisé

* Le token **ne donne pas d'accès direct** au contenu depuis d'autres appareils (sauf si quelqu'un vole ton appareil localStorage).
* Les commits sont faits par l'Action (compte `github-actions`), et le token côté client **ne touche que l'endpoint `dispatches`**.

---

## 10. Tests & troubleshooting

* **Vérifier l'action** : dans `Actions` → sélectionne `Add calendar event` → vérifie les runs.
* **Vérifier `data/events.json`** : après run réussi, vérifie le fichier dans le repo.
* **Cache Pages** : GitHub Pages peut mettre quelques secondes à minutes pour refléter le commit ; pour tester localement, héberge avec `http-server`.
* **CORS** : fetch sur le même domaine n'a pas de CORS. Si tu testes depuis un domaine différent, assure-toi que Pages autorise l'accès.
* **JSON invalide** : si `payload` mal formé, `jq` échouera. Le frontend doit envoyer du JSON valide.

---

## 11. Extensions recommandées

* **Validation côté Action** : valider la structure JSON et renvoyer des erreurs claires.
* **Modération** : workflow ou job séparé qui vérifie les événements avant d'ajouter.
* **Suppression / édition** : endpoints et actions supplémentaires pour modifier ou supprimer.
* **Diff / historique** : conserver un journal des changements (utile pour audit).

---

## Récapitulatif rapide (pour copy-paste)

* Fichier workflow : `.github/workflows/add-event.yml` (voir section 8)
* Fichier initial `data/events.json` : `[]`
* Frontend : `index.html` envoie `POST` à `https://api.github.com/repos/OWNER/REPO/actions/workflows/add-event.yml/dispatches`
* Lecture live : `fetch('/data/events.json', {cache:'no-store'})`
* Iframe hotglue : `https://OWNER.github.io/REPO/iframe.html`

---

Si tu veux, je peux maintenant :

* ajouter automatiquement ce `README.md` dans ton repo (je te fournis le contenu prêt à `git add`),
* créer et valider le workflow complet adapté à ton repo (`Sortez`),
* générer un script de test pour envoyer un dispatch depuis ta machine (curl).

Dis-moi quelle option tu veux que j'effectue ensuite et je te fournis les fichiers / commandes immédiatement.
