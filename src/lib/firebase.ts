import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCpcdn1TZc4ALtMxAiWQHe4mrI4n820js0",
  authDomain: "preptalkai-feffe.firebaseapp.com",
  projectId: "preptalkai-feffe",
  storageBucket: "preptalkai-feffe.firebasestorage.app",
  messagingSenderId: "617253571815",
  appId: "1:617253571815:web:5702c5273a8e0c00ed6642"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();