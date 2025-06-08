import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  limit,
  startAfter,
  getDoc,
  increment,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';
import { db, auth } from '../config/firebaseConfig';

// Authentication Services
export const authService = {
  // Register new user
  register: async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // You can add additional user data to Firestore here if needed
      return {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  }
};

// Storage Services
export const storageService = {
  // Convert image to base64 for Firestore storage (as per requirements)
  uploadImage: async (imageUri) => {
    try {
      console.log("📁 Converting image to base64 for Firestore storage");

      // Fetch the image and convert to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Convert blob to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      console.log("✅ Image converted to base64 successfully");
      return base64; // Return base64 string instead of Firebase Storage URL
    } catch (error) {
      console.error('Image conversion error:', error);
      throw error;
    }
  }
};

// Firestore Services
export const firestoreService = {
  // Create a new signal/report with optimized structure
  createSignal: async (signalData) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Validate required fields
      if (!signalData.description || !signalData.imageUrl || !signalData.location) {
        throw new Error('Données de signalement incomplètes');
      }

      const now = serverTimestamp();
      const signalWithMetadata = {
        // Core data
        description: signalData.description,
        imageUrl: signalData.imageUrl,

        // Location data (structured for better querying)
        location: {
          latitude: signalData.location.latitude,
          longitude: signalData.location.longitude,
          address: signalData.location.address || '',
          accuracy: signalData.location.accuracy || null
        },

        // User data
        userId: user.uid,
        userEmail: user.email,
        userDisplayName: user.displayName || user.email.split('@')[0],

        // Status and timestamps
        status: 'pending', // pending, in_progress, resolved
        priority: 'normal', // low, normal, high (for future admin use)
        createdAt: now,
        updatedAt: now,

        // Admin fields (for future web app)
        adminNotes: '',
        assignedTo: null,
        resolvedAt: null,

        // Metadata for analytics
        reportSource: 'mobile_app',
        version: '1.0.0'
      };

      const docRef = await addDoc(collection(db, 'signals'), signalWithMetadata);

      // Update user stats
      try {
        const userStatsRef = doc(db, 'userStats', user.uid);
        const statsSnap = await getDoc(userStatsRef);
        
        if (statsSnap.exists()) {
          await updateDoc(userStatsRef, {
            totalReports: increment(1),
            pendingReports: increment(1),
            updatedAt: serverTimestamp()
          });
        } else {
          // Create new stats document if it doesn't exist
          await setDoc(userStatsRef, {
            totalReports: 1,
            pendingReports: 1,
            inProgressReports: 0,
            resolvedReports: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.warn('Error updating user stats (non-critical):', error);
        // Continue since the main signal was created successfully
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating signal:', error);
      throw error;
    }
  },

  // Get user's signals with pagination support
  getUserSignals: async (pageSize = 20, lastDoc = null) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      let q = query(
        collection(db, 'signals'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      // Add pagination if lastDoc is provided
      if (lastDoc) {
        q = query(
          collection(db, 'signals'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const querySnapshot = await getDocs(q);
      const signals = [];

      querySnapshot.forEach((doc) => {
        signals.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        signals,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error getting user signals:', error);
      throw error;
    }
  },

  // Get user's signals by status (for filtering)
  getUserSignalsByStatus: async (status, pageSize = 20) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      const q = query(
        collection(db, 'signals'),
        where('userId', '==', user.uid),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      const querySnapshot = await getDocs(q);
      const signals = [];

      querySnapshot.forEach((doc) => {
        signals.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return signals;
    } catch (error) {
      console.error('Error getting user signals by status:', error);
      throw error;
    }
  },

  // Get all signals for admin (future web app)
  getAllSignals: async (pageSize = 50, lastDoc = null, filters = {}) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      let q = query(
        collection(db, 'signals'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      // Apply filters
      if (filters.status) {
        q = query(
          collection(db, 'signals'),
          where('status', '==', filters.status),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const signals = [];

      querySnapshot.forEach((doc) => {
        signals.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        signals,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error getting all signals:', error);
      throw error;
    }
  },

  // Update signal status (enhanced for admin webapp)
  updateSignalStatus: async (signalId, status, adminNotes = '', assignedTo = null) => {
    try {
      const updateData = {
        status: status,
        updatedAt: serverTimestamp()
      };

      if (adminNotes) {
        updateData.adminNotes = adminNotes;
      }

      // Add resolved timestamp if status is resolved
      if (status === 'resolved') {
        updateData.resolvedAt = serverTimestamp();
      }

      // Add assigned admin if provided
      if (assignedTo) {
        updateData.assignedTo = assignedTo;
      }

      const signalRef = doc(db, 'signals', signalId);
      await updateDoc(signalRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating signal status:', error);
      throw error;
    }
  },

  // Get single signal by ID
  getSignalById: async (signalId) => {
    try {
      const signalRef = doc(db, 'signals', signalId);
      const signalSnap = await getDoc(signalRef);

      if (signalSnap.exists()) {
        return {
          id: signalSnap.id,
          ...signalSnap.data()
        };
      } else {
        throw new Error('Signalement non trouvé');
      }
    } catch (error) {
      console.error('Error getting signal by ID:', error);
      throw error;
    }
  },

  // Get user statistics
  getUserStats: async (userId = null) => {
    try {
      const user = auth.currentUser;
      const targetUserId = userId || user?.uid;

      if (!targetUserId) {
        throw new Error('Utilisateur non authentifié');
      }

      const userStatsRef = doc(db, 'userStats', targetUserId);
      const statsSnap = await getDoc(userStatsRef);

      if (statsSnap.exists()) {
        return statsSnap.data();
      } else {
        // Create default stats if document doesn't exist
        const defaultStats = {
          totalReports: 0,
          pendingReports: 0,
          inProgressReports: 0,
          resolvedReports: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(userStatsRef, defaultStats);
        return defaultStats;
      }
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  },

  // Batch update multiple signals (for admin operations)
  batchUpdateSignals: async (updates) => {
    try {
      const batch = writeBatch(db);

      updates.forEach(({ signalId, data }) => {
        const signalRef = doc(db, 'signals', signalId);
        batch.update(signalRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error batch updating signals:', error);
      throw error;
    }
  }
};