# 🚀 Guide de Démarrage Rapide - Hanout Price

## ⚡ Installation en 5 Minutes

### 1️⃣ Cloner et Installer les Dépendances

```bash
# Déjà fait si vous lisez ce fichier !
cd C:\CHREL
npm install
```

### 2️⃣ Configurer les Clés API (CRITIQUE)

```bash
# Copier le template de configuration
Copy-Item .env.local.example .env.local

# Éditer le fichier .env.local avec vos clés
notepad .env.local
```

**Obtenir les clés** :

| Service | URL | Gratuit ? |
|---------|-----|-----------|
| 🤖 **Gemini AI** | https://aistudio.google.com/app/apikey | ✅ Oui (60 req/min) |
| 🗺️ **Google Maps** | https://console.cloud.google.com/google/maps-apis/credentials | ✅ Oui (28K chargements/mois) |

### 3️⃣ Démarrer le Serveur de Développement

```bash
# Option 1 : Serveur Next.js standard
npm run dev

# Option 2 : Avec Genkit AI Playground (recommandé pour debug IA)
npm run genkit:watch
```

**Accès** :
- 🌐 **Application** : http://localhost:9002
- 🤖 **Genkit Playground** : http://localhost:4000 (si `genkit:watch`)

### 4️⃣ Tester les Fonctions Clés

#### Test 1 : Authentification
1. Aller sur http://localhost:9002/register
2. Créer un compte (email + mot de passe)
3. Vérifier redirection vers `/dashboard`

#### Test 2 : Reconnaissance IA
1. Aller sur http://localhost:9002/add-product
2. Cliquer "Prendre une photo"
3. Photographier un produit (emballage visible)
4. Vérifier que le nom s'affiche automatiquement

#### Test 3 : Carte Interactive
1. Aller sur http://localhost:9002/dashboard
2. Vérifier que la carte Google Maps s'affiche
3. Autoriser la géolocalisation si demandé

---

## 🛠️ Commandes Utiles

### Développement
```bash
npm run dev              # Serveur Next.js sur port 9002
npm run genkit:watch     # Serveur + Genkit AI Playground
npm run build            # Build production (export statique)
npm run serve            # Servir le build (après npm run build)
```

### Cloud Functions (Backend)
```bash
cd functions
npm install              # Installer dépendances functions
npm run build            # Compiler TypeScript
firebase deploy --only functions   # Déployer en production
```

### Mobile (Capacitor)
```bash
cd hanout-price
npm install
npm run dev              # Serveur Vite
npx cap sync             # Synchroniser assets
npx cap open android     # Ouvrir Android Studio
```

---

## 📂 Structure du Projet

```
C:\CHREL\
├── src/                        # Code source Next.js
│   ├── app/                    # Pages Next.js App Router
│   │   ├── add-product/        # 📸 Ajout prix avec IA
│   │   ├── dashboard/          # 🏠 Accueil & carte
│   │   ├── login/register/     # 🔐 Authentification
│   │   └── profile/            # 👤 Profil utilisateur
│   ├── components/             # Composants réutilisables
│   ├── firebase/               # 🔥 Config & hooks Firebase
│   ├── ai/flows/               # 🤖 Flows Genkit AI
│   └── lib/                    # Types & utilitaires
├── functions/                  # ☁️ Cloud Functions
├── hanout-price/               # 📱 App mobile Ionic/Capacitor
├── docs/                       # 📚 Documentation
│   └── AUDIT_FONCTIONS_BASE.md # ✅ Audit complet
└── .env.local                  # 🔑 Clés API (À CRÉER)
```

---

## 🐛 Résolution des Problèmes Courants

### Erreur : "GEMINI_API_KEY is not defined"
**Cause** : Fichier `.env.local` manquant ou clé invalide  
**Solution** :
```bash
# Vérifier que le fichier existe
Test-Path .env.local  # Doit retourner True

# Vérifier le contenu
Get-Content .env.local

# Redémarrer le serveur après modification
npm run dev
```

### Erreur : "Google Maps API Key manquante"
**Cause** : Variable `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` non définie  
**Solution** :
```bash
# Ajouter dans .env.local
Add-Content .env.local "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=votre_cle"

# Relancer
npm run dev
```

### Erreur d'Hydratation React
**Symptôme** : "Hydration failed because the server rendered HTML didn't match the client"  
**Cause** : Composant utilisant `localStorage` ou APIs navigateur rendu côté serveur  
**Solution** : Le code utilise déjà `dynamic` imports avec `ssr: false` - vérifier la console

### Port 9002 déjà utilisé
**Solution** :
```bash
# Modifier le port dans package.json ou utiliser :
npm run dev -- -p 3000  # Lance sur port 3000
```

---

## 🔐 Sécurité

### Clés API Publiques vs Privées

**✅ SÉCURISÉ (hardcodé dans le code)** :
- Firebase config (`apiKey`, `projectId`, etc.) → Publiques par design
- Protégées par Firebase Rules côté serveur

**❌ SENSIBLE (dans .env.local)** :
- `GEMINI_API_KEY` → Privée, côté serveur uniquement
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` → Publique mais restreinte par domaine

**⚠️ NE JAMAIS COMMITER** :
- `.env.local` est dans `.gitignore`
- Vérifier avant chaque commit : `git status`

### Firebase Rules
Les règles de sécurité sont dans :
- `firestore.rules` → Base de données
- `firebase.storage.rules` → Stockage fichiers

Déployer avec :
```bash
firebase deploy --only firestore:rules,storage:rules
```

---

## 📊 Monitoring

### Logs Cloud Functions
```bash
firebase functions:log
firebase functions:log --only onPriceRecordCreated
```

### Firebase Console
- **Firestore** : https://console.firebase.google.com/project/studio-9692019390-ae379/firestore
- **Auth** : https://console.firebase.google.com/project/studio-9692019390-ae379/authentication
- **Storage** : https://console.firebase.google.com/project/studio-9692019390-ae379/storage

### Algolia Dashboard
- **Index** : https://www.algolia.com/apps/DP923KV3P6/explorer

---

## 🚀 Déploiement Production

### Option 1 : Firebase Hosting (Recommandé)
```bash
npm run build                    # Build statique
firebase deploy --only hosting   # Déployer
```

**URL** : https://studio-9692019390-ae379.web.app

### Option 2 : Vercel
```bash
npm install -g vercel
vercel                           # Suivre les instructions
```

### Option 3 : App Mobile Android
```bash
cd hanout-price
npm run build
npx cap sync
npx cap open android
# Dans Android Studio : Build > Generate Signed Bundle
```

---

## 📚 Documentation Complète

- **Audit Fonctions** : `docs/AUDIT_FONCTIONS_BASE.md`
- **Rapport Technique** : `docs/FINAL_TECHNICAL_REPORT.md`
- **Roadmap** : `docs/ROADMAP.md`
- **Copilot Instructions** : `.github/copilot-instructions.md`

---

## 🆘 Support

### Vérifier Status
```bash
# Tester si Firebase est accessible
npm run dev
# Ouvrir http://localhost:9002

# Tester Cloud Functions localement
cd functions
npm run serve
```

### Réinitialisation Complète
```bash
# Supprimer node_modules et réinstaller
Remove-Item -Recurse -Force node_modules, functions/node_modules, hanout-price/node_modules
npm install
cd functions && npm install
cd ../hanout-price && npm install
cd ..
```

---

**✅ Prêt à démarrer !** Exécutez `npm run dev` et ouvrez http://localhost:9002
