const form = document.getElementById("lessonForm");
const output = document.getElementById("output");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const age = document.getElementById("age").value;
  const level = document.getElementById("level").value;
  const theme = document.getElementById("theme").value;
  const language = document.getElementById("language").value;

  output.textContent = "Genererar aktivitet...";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ age, level, theme, language }),
    });

    const data = await response.json();

    if (!response.ok) {
      output.textContent = `Fel: ${data.error}`;
      return;
    }

    output.textContent = data.result;
  } catch (error) {
    console.error("Frontend-fel:", error);
    output.textContent = "Kunde inte ansluta till servern.";
  }

  const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "/login.html";
  });
}

});