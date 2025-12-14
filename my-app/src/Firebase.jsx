// Import Firebase SDK functions
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7hEl5Mvi5KYIdovrosvrapEGgZB8TaQ8",
  authDomain: "gasagencysystem-2aab7.firebaseapp.com",
  projectId: "gasagencysystem-2aab7",
  storageBucket: "gasagencysystem-2aab7.appspot.com", // fixed .app to .appspot.com
  messagingSenderId: "1039656048325",
  appId: "1:1039656048325:web:826241a5f93f97c4ef02ac"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Authentication and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);
