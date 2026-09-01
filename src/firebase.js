import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAvCiFaJHqF8YgplqujG0KEz4f_URuCECU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "id-card-87460.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://id-card-87460-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "id-card-87460",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "id-card-87460.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "242255838690",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:242255838690:web:a1b875e3261dd24db3cdbb",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-EHFE4S06PR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
