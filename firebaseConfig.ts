

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDj_N02l-P9pmUBou71Vte0p9jyctTnWwA",
  authDomain: "kiko-juice.firebaseapp.com",
  databaseURL: "https://kiko-juice-default-rtdb.firebaseio.com",
  projectId: "kiko-juice",
  storageBucket: "kiko-juice.appspot.com",
  messagingSenderId: "724938843615",
  appId: "1:724938843615:web:8687ae3ab7b38e39bc106a"
};

// Initialize Firebase and export the services
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app); // This is Realtime Database
export const firestore = getFirestore(app); // This is Firestore