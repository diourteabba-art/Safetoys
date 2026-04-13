# SafeToys — MVP

Application mobile (PWA) pour vérifier la sécurité des jouets pour enfants.

## 🚀 Déploiement en 5 étapes

### Étape 1 — Mettre le code sur GitHub

1. Va sur **github.com** → clique "New repository"
2. Nom du repo : `safetoys`
3. Laisse tout par défaut → clique "Create repository"
4. Clique **"uploading an existing file"**
5. Glisse-dépose TOUS les fichiers du dossier `safetoys` dans GitHub
6. Clique "Commit changes"

### Étape 2 — Connecter à Vercel

1. Va sur **vercel.com** → clique "Add New Project"
2. Sélectionne ton repo `safetoys`
3. Vercel détecte automatiquement Next.js
4. **NE CLIQUE PAS encore sur Deploy**

### Étape 3 — Ajouter les variables d'environnement

Dans Vercel, clique sur **"Environment Variables"** et ajoute :

| Nom | Valeur |
|-----|--------|
| `AIRTABLE_TOKEN` | Ton token Airtable (patXXXXXX…) |
| `AIRTABLE_BASE_ID` | L'ID de ta base (appXXXXXX…) |
| `AIRTABLE_TABLE_NAME` | Le nom exact de ta table dans Airtable |

### Étape 4 — Déployer

Clique **"Deploy"** → dans 2 minutes : `https://safetoys.vercel.app`

### Étape 5 — Installer sur ton téléphone (PWA)

**Android (Chrome)** → 3 points → "Ajouter à l'écran d'accueil"
**iPhone (Safari)** → icône partage → "Sur l'écran d'accueil"

## 📱 Fonctionnalités MVP

- ✅ Scanner de code-barres (via caméra)
- ✅ Recherche par nom ou marque
- ✅ Fiche produit avec score A–D
- ✅ Liste des substances détectées
- ✅ Alternatives recommandées
- ✅ Soumission collaborative de jouets manquants
- ✅ Connecté à ta base Airtable en temps réel

## 🛠 Structure

```
safetoys/
├── pages/
│   ├── index.js          # Accueil
│   ├── scanner.js        # Scanner code-barres
│   ├── recherche.js      # Recherche par nom
│   ├── soumettre.js      # Soumission collaborative
│   ├── jouet/[id].js     # Fiche produit
│   └── api/
│       ├── scan.js       # API scan
│       ├── search.js     # API recherche
│       └── submit.js     # API soumission
├── components/
│   ├── BottomNav.js
│   └── ToyCard.js
├── lib/
│   └── airtable.js
└── styles/
    └── globals.css
```
