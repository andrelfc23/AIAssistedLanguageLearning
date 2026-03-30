import {
  auth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "./firebase.js";

const form = document.getElementById("loginForm");
const message = document.getElementById("message");

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "/index.html";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  message.style.color = "#dc2626";

  if (!email || !password) {
    message.textContent = "Fyll i e-post och lösenord.";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "/index.html";
  } catch (error) {
    message.textContent = error.message;
  }
});