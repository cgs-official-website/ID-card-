import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration for intern-payslip
const firebaseConfig = {
  apiKey: "AIzaSyDr0jPYtnW4RTFtwoTHx3Jwy5svq5ZWDOc",
  authDomain: "intern-payslip.firebaseapp.com",
  projectId: "intern-payslip",
  storageBucket: "intern-payslip.firebasestorage.app",
  messagingSenderId: "56771962490",
  appId: "1:56771962490:web:d4a2bbd2db3fd44c64bdc3"
};

// Initialize Firebase as a secondary app to avoid collisions with the default App
const app = initializeApp(firebaseConfig, "paymentApp");
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
