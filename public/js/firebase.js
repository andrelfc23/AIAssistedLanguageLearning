import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYqCXGOsvRNLym-_PmUlMn0e1qz3uXGY8",
  authDomain: "webappteacherchildren.firebaseapp.com",
  projectId: "webappteacherchildren",
  storageBucket: "webappteacherchildren.firebasestorage.app",
  messagingSenderId: "644648021738",
  appId: "1:644648021738:web:b137372fb8f6d3c4c6f193",
  measurementId: "G-76E2NP4XXC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  db
};