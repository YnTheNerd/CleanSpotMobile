# CleanSpot Mobile

Une application mobile React Native pour signaler les dépôts sauvages d'ordures et contribuer à un environnement plus propre.

## Fonctionnalités

- 🔐 **Authentification** : Inscription et connexion avec Firebase Auth
- 📸 **Capture de photos** : Prendre des photos ou sélectionner depuis la galerie
- 📍 **Géolocalisation** : Localisation automatique GPS ou sélection manuelle
- 📝 **Signalements** : Créer et gérer ses signalements de dépôts sauvages
- 📊 **Suivi** : Voir l'évolution de ses signalements (en attente, en cours, résolu)
- 🇫🇷 **Interface française** : Entièrement en français

## Technologies utilisées

- **React Native** avec Expo
- **Firebase** (Firestore, Auth, Storage)
- **Expo Router** pour la navigation
- **Expo Image Picker** pour les photos
- **Expo Location** pour la géolocalisation

## Installation

1. **Cloner le projet** (déjà fait)

2. **Installer les dépendances** (déjà fait)
   ```bash
   npm install
   ```

3. **Configurer Firebase**
   - Créer un projet Firebase sur https://console.firebase.google.com
   - Activer Authentication (Email/Password)
   - Créer une base de données Firestore
   - Activer Storage
   - Remplacer les valeurs dans `config/firebaseConfig.js` par vos vraies clés

4. **Lancer l'application**
   ```bash
   npm start
   ```

## Configuration Firebase

### 1. Authentication
- Aller dans Authentication > Sign-in method
- Activer "Email/Password"

### 2. Firestore Database
- Créer une base de données en mode test
- Les règles de sécurité seront à configurer selon vos besoins

### 3. Storage
 - Les images seront stockes en base 64 dans firestore database
### - Activer Firebase Storage pour stocker les images


### 4. Configuration des clés
Remplacer les valeurs dans `config/firebaseConfig.js` :

```javascript
export const firebaseConfig = {
  apiKey: "votre-api-key",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "votre-app-id"
};
```

## Structure du projet

```
app/
├── (auth)/              # Écrans d'authentification
│   ├── login.jsx        # Connexion
│   └── register.jsx     # Inscription
├── (tabs)/              # Navigation principale
│   ├── home.jsx         # Accueil
│   ├── reports.jsx      # Liste des signalements
│   └── profile.jsx      # Profil utilisateur
├── report/
│   └── create.jsx       # Création de signalement
└── index.jsx            # Page d'accueil/landing

components/              # Composants réutilisables
├── CustomButton.jsx
├── CustomInput.jsx
└── LoadingSpinner.jsx

config/
└── firebaseConfig.js    # Configuration Firebase

services/
└── firebaseService.js   # Services Firebase

utils/
├── imageUtils.js        # Utilitaires pour les images
└── locationUtils.js     # Utilitaires pour la géolocalisation
```

## Utilisation

1. **Première utilisation** : Créer un compte ou se connecter
2. **Créer un signalement** :
   - Appuyer sur "Nouveau signalement"
   - Prendre une photo du dépôt sauvage
   - Ajouter une description
   - Confirmer la localisation
   - Envoyer le signalement
3. **Suivre ses signalements** : Voir l'évolution dans "Mes signalements"

## Développement futur

- Application web d'administration pour les collecteurs
- Notifications push pour les mises à jour de statut
- Sélection manuelle sur carte
- Système de gamification
- Statistiques communautaires

## Test

Utiliser Expo Go sur votre téléphone pour tester l'application :
1. Installer Expo Go depuis l'App Store/Play Store
2. Scanner le QR code affiché après `npm start`

## Support

Pour toute question ou problème, veuillez créer une issue dans le repository.
