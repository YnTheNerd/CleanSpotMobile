// Fixed Hybrid Firebase Service - Always use real Firebase services

// Import real services only
import {
  authService as realAuthService,
  storageService as realStorageService,
  firestoreService as realFirestoreService
} from './firebaseService';

// Import Firebase config to test initialization
import { auth, db, storage } from '../config/firebaseConfig';

// Test Firebase initialization properly
try {
  // Test if Firebase services are properly initialized by checking their existence
  if (auth && db && storage) {
    console.log("🔥 Firebase services properly initialized - Using REAL Firebase");
  } else {
    throw new Error("Firebase services not properly initialized");
  }
} catch (error) {
  console.error("❌ Firebase initialization failed:", error);
  console.error("❌ This is a critical error - app cannot function without Firebase");
  throw new Error("Firebase must be properly configured for production use");
}

// Always export real services - no fallback to mock in production
export const authService = realAuthService;
export const storageService = realStorageService;
export const firestoreService = realFirestoreService;

// Export configuration for debugging
export const getFirebaseMode = () => 'REAL';

console.log("🔥 Firebase Service Hybrid loaded - Mode: REAL (Production)");