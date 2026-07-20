import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDNhAGIUWnKCu2D2cyG8LW6g4Ohzk9pEOE",
  authDomain: "budget-tracker-ee97a.firebaseapp.com",
  projectId: "budget-tracker-ee97a",
  storageBucket: "budget-tracker-ee97a.firebasestorage.app",
  messagingSenderId: "943459612657",
  appId: "1:943459612657:web:237cff8ff6d42b31c47650"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const docRef = doc(db, 'users', 'test-uid');
    await getDoc(docRef);
    console.log("Read success!");
    
    await setDoc(docRef, { test: true });
    console.log("Write success!");
    process.exit(0);
  } catch (err) {
    console.error("FIREBASE ERROR:", err.message);
    process.exit(1);
  }
}

test();
