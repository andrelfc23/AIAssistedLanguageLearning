import { auth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

const form = document.getElementById("registerForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  message.style.color = "#dc2626";

  if (!email || !password || !confirmPassword) {
    message.textContent = "Fyll i alla fält.";
    return;
  }

  if (password !== confirmPassword) {
    message.textContent = "Lösenorden matchar inte.";
    return;
  }

  if (password.length < 6) {
    message.textContent = "Lösenordet måste vara minst 6 tecken.";
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    message.style.color = "#16a34a";
    message.textContent = "Konto skapat! Skickar dig till login...";
    
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1000);
  } catch (error) {
    message.textContent = error.message;
  }
});