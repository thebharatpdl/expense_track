// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyB209La39PX9pXhG9HFENbU5IaYWyvVKDk",
  authDomain: "expense-tracker-app-54937.firebaseapp.com",
  projectId: "expense-tracker-app-54937",
  storageBucket: "expense-tracker-app-54937.firebasestorage.app",
  messagingSenderId: "1036422723986",
  appId: "1:1036422723986:web:ba963a62a4fe226b16294b",
  measurementId: "G-97NBGGQW6S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;