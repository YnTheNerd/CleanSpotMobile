import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

export const authService = {
  // Enhanced login with better error handling
  login: async (email, password) => {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email et mot de passe requis');
      }

      console.log('🔐 Tentative de connexion pour:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      console.log('✅ Connexion réussie:', user.uid);
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        emailVerified: user.emailVerified
      };
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      
      // Handle specific auth errors
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          throw new Error('Email ou mot de passe incorrect');
        case 'auth/invalid-email':
          throw new Error('Format d\'email invalide');
        case 'auth/user-disabled':
          throw new Error('Ce compte a été désactivé');
        case 'auth/too-many-requests':
          throw new Error('Trop de tentatives. Réessayez plus tard');
        default:
          throw new Error('Erreur de connexion. Veuillez réessayer');
      }
    }
  },

  // Enhanced registration
  register: async (email, password, displayName) => {
    try {
      if (!email || !password || !displayName) {
        throw new Error('Tous les champs sont requis');
      }

      if (password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      console.log('🔐 Création de compte pour:', email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, {
        displayName: displayName.trim()
      });

      console.log('✅ Compte créé avec succès:', user.uid);

      return {
        uid: user.uid,
        email: user.email,
        displayName: displayName.trim(),
        emailVerified: user.emailVerified
      };
    } catch (error) {
      console.error('❌ Erreur de création de compte:', error);
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          throw new Error('Cet email est déjà utilisé');
        case 'auth/invalid-email':
          throw new Error('Format d\'email invalide');
        case 'auth/weak-password':
          throw new Error('Mot de passe trop faible');
        default:
          throw new Error('Erreur de création de compte');
      }
    }
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Auth state listener
  onAuthStateChange: (callback) => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0],
          emailVerified: user.emailVerified
        });
      } else {
        callback(null);
      }
    });
  },

  // Logout
  logout: async () => {
    try {
      await signOut(auth);
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur de déconnexion:', error);
      throw new Error('Erreur de déconnexion');
    }
  }
};