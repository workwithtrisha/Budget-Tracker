import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNhAGIUWnKCu2D2cyG8LW6g4Ohzk9pEOE",
  authDomain: "budget-tracker-ee97a.firebaseapp.com",
  projectId: "budget-tracker-ee97a",
  storageBucket: "budget-tracker-ee97a.firebasestorage.app",
  messagingSenderId: "943459612657",
  appId: "1:943459612657:web:237cff8ff6d42b31c47650",
  measurementId: "G-MHTYY79VX6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
