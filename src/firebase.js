// src/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrJeprL75G3aOSBJPQnoFl71HfuXwDRfc",
  authDomain: "fund-db-8383c-fe8a9.firebaseapp.com",
  projectId: "fund-db-8383c-fe8a9",
  storageBucket: "fund-db-8383c-fe8a9.firebasestorage.app",
  messagingSenderId: "944442338853",
  appId: "1:944442338853:web:c7a527b064476996d719cc",
  measurementId: "G-BG94JG0T23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and export them
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);