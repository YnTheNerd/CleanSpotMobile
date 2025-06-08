import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
//import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Correct import
// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDVvf7S0TgyzBWKmwNdRz3ffGFRTCeXPro",
  authDomain: "cleanspotyn.firebaseapp.com",
  projectId: "cleanspotyn",
  storageBucket: "cleanspotyn.appspot.com",
  messagingSenderId: "1066328077987",
  appId: "1:1066328077987:web:493c39c6bec6cf7aba7116",
  measurementId: "G-6PQPTTGVMZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);


export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage), // Use AsyncStorage
});

export const storage = getStorage(app);

export default app;