import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Replace this with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvCiFaJHqF8YgplqujG0KEz4f_URuCECU",
  authDomain: "id-card-87460.firebaseapp.com",
  projectId: "id-card-87460",
  storageBucket: "id-card-87460.firebasestorage.app",
  messagingSenderId: "242255838690",
  appId: "1:242255838690:web:a1b875e3261dd24db3cdbb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
