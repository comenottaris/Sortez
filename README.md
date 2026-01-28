# 📅 Sortez - Calendrier d'événements culturels

Application web statique pour gérer et visualiser vos événements culturels via une heatmap interactive. Fonctionne avec GitHub Pages et GitHub Actions (pas de serveur externe nécessaire).

## ✨ Fonctionnalités

- 📊 **Visualisation en heatmap** - Calendrier visuel de vos événements avec Cal-Heatmap
- ➕ **Ajout d'événements** - Interface simple pour ajouter des événements
- 🔒 **100% GitHub** - Pas de serveur externe, tout fonctionne via GitHub Pages et Actions
- 📱 **Mobile-first** - Interface responsive optimisée pour mobile
- 🔐 **Sécurisé** - Token stocké localement uniquement sur votre appareil
- 🌐 **Iframe compatible** - Peut être intégré dans d'autres sites (hotglue.me, etc.)

## 🚀 Installation rapide

### 1. Cloner ou forker le repo

```bash
git clone https://github.com/comenottaris/Sortez.git
cd Sortez
```

### 2. Activer GitHub Pages

1. Allez dans **Settings** → **Pages**
2. Source: `Deploy from a branch`
3. Branch: `main` / `(root)`
4. Cliquez sur **Save**

Votre site sera accessible à: `https://comenottaris.github.io/Sortez/`

### 3. Créer un Personal Access Token (PAT)

1. Allez sur [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Cliquez sur **Generate new token** → **Fine-grained tokens** (recommandé)
3. Configurez:
   - **Token name**: `Sortez Calendar`
   - **Repository access**: Only select repositories → `Sortez`
   - **Permissions**:
     - Repository permissions → Actions: **Read and write**
     - Repository permissions → Contents: **Read and write** (pour que le workflow puisse commit)
4. Générez et **copiez le token** (il commence par `github_pat_...`)

> ⚠️ **Important**: Ne partagez JAMAIS ce token et ne le committez pas dans le repo!

### 4. Configurer le token dans l'application

1. Ouvrez votre site: `https://comenottaris.github.io/Sortez/`
2. Cliquez sur "🔧 Configuration du token"
3. Collez votre token
4. Cliquez sur "💾 Enregistrer le token"

Le token est stocké dans le `localStorage` de votre navigateur uniquement.

### 5. Ajouter votre premier événement

1. Remplissez le formulaire:
   - **Date**: Choisissez une date
   - **Titre**: Nom de l'événement
   - **Lien** (optionnel): URL vers l'événement
   - **Image** (optionnel): URL d'une image
   - **Intensité**: 1-10 (affecte la couleur dans la heatmap)
2. Cliquez sur "✨ Ajouter l'événement"
3. Attendez quelques secondes - le workflow GitHub Actions va ajouter l'événement à `data/events.json`
4. Le calendrier se rafraîchira automatiquement

## 📁 Structure du projet

```
Sortez/
├── .github/
│   └── workflows/
│       └── add-event.yml      # Workflow GitHub Actions
├── css/
│   └── styles.css             # Styles CSS
├── js/
│   └── app.js                 # JavaScript principal
├── data/
│   └── events.json            # Base de données JSON des événements
├── index.html                 # Page principale
├── iframe.html                # Version iframe (intégration)
└── README.md                  # Ce fichier
```

## 🔧 Comment ça fonctionne

### Architecture

1. **Frontend** (`index.html` / `iframe.html`)
   - Interface utilisateur
   - Formulaire d'ajout d'événements
   - Affichage de la heatmap avec Cal-Heatmap
   - Stockage du token en `localStorage`

2. **Backend serverless** (GitHub Actions)
   - Workflow `.github/workflows/add-event.yml`
   - Déclenché par l'API GitHub depuis le frontend
   - Ajoute l'événement à `data/events.json`
   - Commit et push automatique

3. **Stockage** (`data/events.json`)
   - Fichier JSON statique
   - Chaque événement contient:
     ```json
     {
       "date": "2026-01-28",
       "title": "Concert de jazz",
       "count": 3,
       "link": "https://example.com/event",
       "image": "https://example.com/image.jpg",
       "created_at": "2026-01-28T12:00:00Z"
     }
     ```

### Flux d'ajout d'un événement

```
1. Utilisateur remplit le formulaire
        ↓
2. JavaScript envoie une requête POST à l'API GitHub
   POST https://api.github.com/repos/{owner}/{repo}/actions/workflows/add-event.yml/dispatches
   Header: Authorization: Bearer {token}
        ↓
3. GitHub Actions exécute le workflow
   - Parse le JSON
   - Valide les données
   - Ajoute à events.json
   - Commit et push
        ↓
4. GitHub Pages redéploie (quelques secondes)
        ↓
5. Frontend recharge events.json et met à jour la heatmap
```

## 🌐 Intégration en iframe

Pour intégrer le calendrier dans un autre site (comme hotglue.me):

```html
<iframe 
  src="https://comenottaris.github.io/Sortez/iframe.html"
  style="width:100%; height:800px; border:0;"
  loading="lazy">
</iframe>
```

La version `iframe.html` est identique à `index.html` mais peut être customisée si nécessaire.

## 🔒 Sécurité

### Pourquoi ce modèle est sécurisé

1. **Token stocké localement uniquement**
   - Le token n'est jamais committé dans le repo
   - Il est stocké dans le `localStorage` de votre navigateur
   - Seul vous (sur votre appareil) pouvez ajouter des événements

2. **Token avec permissions limitées**
   - Le token a uniquement accès au repo `Sortez`
   - Il peut seulement déclencher des workflows et lire/écrire le contenu
   - Permissions "fine-grained" recommandées

3. **Workflow contrôlé**
   - Le workflow valide toutes les données entrantes
   - Impossible d'injecter du code malveillant
   - Tous les commits sont tracés (audit trail)

### Bonnes pratiques

- ✅ Utilisez un token fine-grained avec permissions minimales
- ✅ Régénérez le token périodiquement
- ✅ N'utilisez ce token QUE pour Sortez
- ❌ Ne partagez JAMAIS votre token
- ❌ Ne committez JAMAIS le token dans le code

## 🛠️ Développement local

Pour développer localement:

```bash
# Installer un serveur HTTP simple
npm install -g http-server

# Lancer le serveur
http-server -p 8080

# Ouvrir http://localhost:8080
```

> Note: `fetch('/data/events.json')` ne fonctionnera qu'avec un serveur HTTP, pas en ouvrant le fichier directement.

## 🐛 Dépannage

### Le token ne fonctionne pas

- Vérifiez que le token a les bonnes permissions (Actions: Read and write)
- Vérifiez que le token n'est pas expiré
- Vérifiez que vous avez accès au repo
- Essayez de régénérer un nouveau token

### L'événement n'apparaît pas

1. Vérifiez que le workflow s'est bien exécuté: **Actions** tab sur GitHub
2. Attendez 5-10 secondes que GitHub Pages redéploie
3. Rafraîchissez la page (Ctrl+F5)
4. Vérifiez `data/events.json` dans le repo

### Le calendrier ne s'affiche pas

- Vérifiez la console JavaScript (F12)
- Vérifiez que Cal-Heatmap est bien chargé (CDN)
- Vérifiez que `events.json` est bien formaté (valid JSON)

### Erreur 404 sur le workflow

- Vérifiez que le fichier `.github/workflows/add-event.yml` existe
- Vérifiez que vous avez bien nommé le workflow `add-event.yml`
- Vérifiez les permissions du token

## 📝 Format de `events.json`

```json
[
  {
    "date": "2026-01-28",        // Format: YYYY-MM-DD (obligatoire)
    "title": "Mon événement",    // Titre (obligatoire)
    "count": 1,                  // Intensité 1-10 (défaut: 1)
    "link": "",                  // URL optionnelle
    "image": "",                 // URL d'image optionnelle
    "created_at": "2026-01-28T12:00:00Z"  // Timestamp ISO
  }
]
```

## 🎨 Personnalisation

### Modifier les couleurs de la heatmap

Dans `js/app.js`, modifiez:

```javascript
legendColors: {
    min: '#efefef',    // Couleur pour les valeurs basses
    max: '#1e6823',    // Couleur pour les valeurs hautes
    empty: '#ededed'   // Couleur pour les jours sans événement
}
```

### Modifier le nombre de mois affichés

```javascript
range: 6,  // Nombre de mois à afficher
```

### Modifier les seuils de la légende

```javascript
legend: [1, 3, 7, 15]  // Seuils pour les couleurs
```

## 📄 Licence

MIT License - Libre d'utilisation et de modification

## 🤝 Contribution

Les contributions sont les bienvenues! N'hésitez pas à:

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit vos changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

## 📞 Support

Si vous rencontrez des problèmes:

1. Consultez la section [Dépannage](#-dépannage)
2. Ouvrez une issue sur GitHub
3. Consultez les workflows dans l'onglet Actions pour voir les erreurs

## 🙏 Remerciements

- [Cal-Heatmap](https://cal-heatmap.com/) pour la bibliothèque de heatmap
- [GitHub Actions](https://github.com/features/actions) pour l'infrastructure serverless
- [GitHub Pages](https://pages.github.com/) pour l'hébergement gratuit

---

Fait avec ❤️ pour organiser vos sorties culturelles
