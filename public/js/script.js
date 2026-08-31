import { auth, signOut, db } from "./firebase.js";
import { collection, 
  addDoc, 
  serverTimestamp,  
  getDocs, 
   query, 
   orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const logoutBtn = document.getElementById("logoutBtn");
const quizForm = document.getElementById("quizForm");

const teacherPreview =
  document.getElementById(
    "teacherPreview"
  );

  const recentActivityContainer =
  document.getElementById("recentActivityContainer");

  const recentActivitySection =
  document.querySelector(".recent-activity-section");

const showQuizCreatorBtn = document.getElementById("showQuizCreatorBtn");
const quizCreatorSection = document.getElementById("quizCreatorSection");
const dashboardActions = document.querySelector(".dashboard-actions");

const backToDashboardBtn = document.getElementById("backToDashboardBtn");

const levelSelect = document.getElementById("level");
const focusSelect = document.getElementById("focus");
const languageSelect = document.getElementById("language");


if (showQuizCreatorBtn && quizCreatorSection && dashboardActions) {
  showQuizCreatorBtn.addEventListener("click", () => {
    quizCreatorSection.classList.remove("hidden");
    dashboardActions.classList.add("hidden");

    if (recentActivitySection) {
      recentActivitySection.classList.add("hidden");
    }

  });
}

if (backToDashboardBtn && quizCreatorSection && dashboardActions) {
  backToDashboardBtn.addEventListener("click", () => {
    quizCreatorSection.classList.add("hidden");
    dashboardActions.classList.remove("hidden");

    if (recentActivitySection) {
      recentActivitySection.classList.remove("hidden");
    }

  });
}

/* Begränsar språkfokus baserat på årskurs */
function updateFocusOptionsByGrade() {
  if (!levelSelect || !focusSelect || !languageSelect) return;

  const level = Number(levelSelect.value);

  const grammarOption = focusSelect.querySelector('option[value="grammatik"]');
  const spellingOption = focusSelect.querySelector('option[value="stavning"]');
  const spanishOption = languageSelect.querySelector('option[value="spanska"]');

  const difficulty = document.getElementById("difficulty");

const easyOption =
  difficulty.querySelector('option[value="lätt"]');

const mediumOption =
  difficulty.querySelector('option[value="medel"]');

const hardOption =
  difficulty.querySelector('option[value="utmanande"]'); // eller "utmanande" beroende på ditt HTML

if (!level) return;

// Återställ alla alternativ först
easyOption.disabled = false;
mediumOption.disabled = false;
hardOption.disabled = false;

if (level === 2) {

  mediumOption.disabled = true;
  hardOption.disabled = true;
  spellingOption.disabled = true;
  grammarOption.disabled = true;

  difficulty.value = "lätt";

} else if (level === 3) {

  hardOption.disabled = true;
  spellingOption.disabled = false;
  grammarOption.disabled = true;

  // Om användaren hade valt svår tidigare
  if (difficulty.value === "utmanande") {
    difficulty.value = "medel";
  }

} else {

  mediumOption.disabled = false;
  hardOption.disabled = false;
  spellingOption.disabled = false;
}

  if (level === 2 || level === 3) {

    grammarOption.disabled = true;
    
  
    if (focusSelect.value === "grammatik") {
      focusSelect.value = "ordförråd";
    }
  
  } else {
  
    grammarOption.disabled = false;
  }



  // Grammatik endast årskurs 5–6
  if (grammarOption) {
    grammarOption.disabled = level < 4;
  }

  // Stavning endast årskurs 4–6
  if (spellingOption) {
    spellingOption.disabled = level < 3;
  }

  if (spanishOption) {
    spanishOption.disabled = level !== 6;
  }

   // Om användaren redan valt spanska
   if (languageSelect.value === "spanska" && level !== 6) {
    languageSelect.value = "engelska";
  }

  // Om ett otillåtet alternativ redan är valt, byt tillbaka till ordförråd
  if (focusSelect.value === "grammatik" && level < 5) {
    focusSelect.value = "ordförråd";
  }

  if (focusSelect.value === "stavning" && level < 4) {
    focusSelect.value = "ordförråd";
  }
}

if (levelSelect && focusSelect) {
  levelSelect.addEventListener("change", updateFocusOptionsByGrade);
  updateFocusOptionsByGrade();
}

const quizLoadingState =
  document.getElementById("quizLoadingState");

if (quizForm) {
  quizForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    quizCreatorSection
    .querySelector(".quiz-settings-card")
    .classList.add("hidden");

  quizLoadingState.classList.remove("hidden");

  quizLoadingState.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

    const category = document.getElementById("category").value;
    const level = document.getElementById("level").value;
    const language = document.getElementById("language").value;
    const amount = document.getElementById("amount").value;
    const difficulty = document.getElementById("difficulty").value;
    const focus = document.getElementById("focus").value;
    const teacherPrompt = document.getElementById("teacherPrompt").value;


const studentName = document.getElementById("studentSelect").value;

if (!studentName) {
  alert("Välj elev innan du skapar quiz.");
  return;
}

    if (!category || !level) {
      alert("Välj både kategori och årskursnivå.");
      return;
    }

    quizForm.classList.add("hidden");
    quizLoadingState.classList.remove("hidden");

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentName,
          category,
          level,
          language,
          amount,
          difficulty,
          focus,
          teacherPrompt
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kunde inte skapa quiz.");
      }

      data.questions.forEach(question => {
        question.question =
          question.question.replace(/\s*\([^)]*\)/g, "");
      });


      sessionStorage.setItem("quizQuestions", JSON.stringify(data.questions));

      const quizDocRef = await addDoc(collection(db, "quizResults"), {
        createdAt: serverTimestamp(),
        status: "created",
        studentName,
      
        settings: {
          studentName,
          category,
          level,
          language,
          amount,
          difficulty,
          focus
        },
      
        teacherPrompt,
        aiQuestions: data.questions,
      
        childAnswers: [],
        score: null,
        total: data.questions.length
      });
      
      sessionStorage.setItem("quizDocId", quizDocRef.id);
      sessionStorage.setItem("studentName", studentName);

      sessionStorage.setItem("quizSettings", JSON.stringify({
        studentName,
        category,
        level,
        language,
        amount,
        difficulty,
        focus
      }));

      quizLoadingState
        .classList
        .add("hidden");

      teacherPreview
        .classList
        .remove("hidden");

      teacherPreview.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      showTeacherPreview(
        data.questions
      );

    } catch (error) {

      quizLoadingState
      .classList
      .add("hidden");

    quizCreatorSection
      .querySelector(".quiz-settings-card")
      .classList
      .remove("hidden");


      console.error(error);
      alert("Något gick fel när quizet skulle skapas.");
    }
  });
}

function showTeacherPreview(questions) {
 
  const teacherPreview = document.getElementById("teacherPreview");
  const previewQuestions = document.getElementById("previewQuestions");

  teacherPreview.classList.remove("hidden");

  previewQuestions.innerHTML = questions.map((q, index) => `



${q.imageUrl ? `
  <div class="preview-image-wrapper">
    <img
      src="${question.imageUrl}"
      alt="Bild till frågan"
      class="preview-question-image"
    >
  </div>
` : ""}

    <div class="preview-question-card">
      <h4>Fråga ${index + 1}</h4>
      <p><strong>${q.question}</strong></p>



      <ul>
        ${q.answers.map(answer => `
          <li>${answer}</li>
        `).join("")}
      </ul>

      <p>Rätt svar: <strong>${q.correctAnswer}</strong></p>
      <p>Feedback: ${q.feedback}</p>
    </div>
  `).join("");
}

if (backToQuizSettingsBtn) {

  backToQuizSettingsBtn.addEventListener(
    "click",
    () => {

      teacherPreview
        .classList
        .add("hidden");

      quizLoadingState
        .classList
        .add("hidden");

      quizCreatorSection
        .querySelector(".quiz-settings-card")
        .classList
        .remove("hidden");

        if (recentActivitySection) {
          recentActivitySection.classList.add("hidden");
        }

      quizCreatorSection
        .scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

    }
  );

}

const startChildViewBtn = document.getElementById("startChildViewBtn");

if (startChildViewBtn) {
  startChildViewBtn.addEventListener("click", () => {
    window.location.href = "/quiz.html";
  });
}

const regenerateBtn = document.getElementById("regenerateBtn");

if (regenerateBtn && quizForm) {
  regenerateBtn.addEventListener("click", () => {
    quizForm.requestSubmit();
  });
}

const showResultsBtn =
  document.getElementById("showResultsBtn");

const resultsSection =
  document.getElementById("resultsSection");

if (showResultsBtn) {

  showResultsBtn.addEventListener("click", () => {

    dashboardActions.classList.add("hidden");

    quizCreatorSection.classList.add("hidden");

    resultsSection.classList.remove("hidden");

    if (recentActivitySection) {
      recentActivitySection.classList.add("hidden");
    }

    loadResults();

  });

}

const backFromResultsBtn =
  document.getElementById("backFromResultsBtn");

if (backFromResultsBtn) {

  backFromResultsBtn.addEventListener("click", () => {

    resultsSection.classList.add("hidden");

    dashboardActions.classList.remove("hidden");

    if (recentActivitySection) {
      recentActivitySection.classList.remove("hidden");
    }

  });

}

let allQuizResults = [];

async function loadResults() {
  const resultsContainer =
    document.getElementById("resultsContainer");

  resultsContainer.innerHTML =
    "<p>Laddar resultat...</p>";

  try {

    const q = query(
      collection(db, "quizResults"),
      orderBy("completedAt", "desc")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      resultsContainer.innerHTML =
        "<p>Inga resultat finns ännu.</p>";
      return;
    }

    allQuizResults = [];

    snapshot.docs.forEach((doc) => {

      const data = doc.data();
      const settings = data.settings || {};

      if (data.score === null || data.score === undefined) {
        return;
      }

      allQuizResults.push({
        studentName:
          data.studentName ||
          settings.studentName ||
          "Okänd elev",

        category:
          settings.category ||
          "Tema saknas",

        level:
          settings.level ||
          "Årskurs saknas",

        difficulty:
          settings.difficulty ||
          "Svårighetsgrad saknas",

        focus:
          settings.focus ||
          "Moment saknas",

        language:
          settings.language ||
          "Språk saknas",

        score:
          data.score ?? 0,

        total:
          data.total ?? 0,

        completedAt:
          data.completedAt
            ? data.completedAt.toDate().toLocaleString(
                "sv-SE",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                }
              )
            : "Okänt datum"
      });

    });

    renderResults(allQuizResults);

    createResultFilters();

  } catch (error) {

    console.error(error);

    resultsContainer.innerHTML =
      "<p>Kunde inte läsa resultaten.</p>";
  }
}

function createResultFilters() {
  const studentFilter =
    document.getElementById("studentFilter");

  const gradeFilter =
    document.getElementById("gradeFilter");

  const difficultyFilter =
    document.getElementById("difficultyFilter");

  const focusFilter =
    document.getElementById("focusFilter");

  const clearResultFiltersBtn =
    document.getElementById("clearResultFiltersBtn");

  function getUniqueValues(results, key) {
    return [...new Set(results.map(result => result[key]))];
  }

  function fillSelect(select, defaultText, values, formatter = value => value) {
    const currentValue = select.value;

    select.innerHTML = `
      <option value="alla">${defaultText}</option>
      ${values.map(value => `
        <option value="${value}">${formatter(value)}</option>
      `).join("")}
    `;

    if (values.includes(currentValue)) {
      select.value = currentValue;
    } else {
      select.value = "alla";
    }
  }

  function getFilteredResults(ignoreFilter = null) {
    return allQuizResults.filter(result => {
      if (
        ignoreFilter !== "student" &&
        studentFilter.value !== "alla" &&
        result.studentName !== studentFilter.value
      ) {
        return false;
      }

      if (
        ignoreFilter !== "grade" &&
        gradeFilter.value !== "alla" &&
        result.level !== gradeFilter.value
      ) {
        return false;
      }

      if (
        ignoreFilter !== "difficulty" &&
        difficultyFilter.value !== "alla" &&
        result.difficulty !== difficultyFilter.value
      ) {
        return false;
      }

      if (
        ignoreFilter !== "focus" &&
        focusFilter.value !== "alla" &&
        result.focus !== focusFilter.value
      ) {
        return false;
      }

      return true;
    });
  }

  function updateFilterOptions() {
    const studentBasedResults =
      studentFilter.value === "alla"
        ? allQuizResults
        : allQuizResults.filter(
            result => result.studentName === studentFilter.value
          );

    fillSelect(
      gradeFilter,
      "Alla årskurser",
      getUniqueValues(studentBasedResults, "level"),
      value => `Årskurs ${value}`
    );

    const gradeBasedResults =
      getFilteredResults("difficulty");

    fillSelect(
      difficultyFilter,
      "Alla nivåer",
      getUniqueValues(gradeBasedResults, "difficulty")
    );

    const difficultyBasedResults =
      getFilteredResults("focus");

    fillSelect(
      focusFilter,
      "Alla moment",
      getUniqueValues(difficultyBasedResults, "focus")
    );
  }

  function applyFilters() {
    updateFilterOptions();

    const filteredResults = getFilteredResults();

    renderResults(filteredResults);
  }

  fillSelect(
    studentFilter,
    "Alla elever",
    getUniqueValues(allQuizResults, "studentName")
  );

  fillSelect(
    gradeFilter,
    "Alla årskurser",
    getUniqueValues(allQuizResults, "level"),
    value => `Årskurs ${value}`
  );

  fillSelect(
    difficultyFilter,
    "Alla nivåer",
    getUniqueValues(allQuizResults, "difficulty")
  );

  fillSelect(
    focusFilter,
    "Alla moment",
    getUniqueValues(allQuizResults, "focus")
  );

  studentFilter.onchange = applyFilters;
  gradeFilter.onchange = applyFilters;
  difficultyFilter.onchange = applyFilters;
  focusFilter.onchange = applyFilters;

  clearResultFiltersBtn.onclick = () => {
    studentFilter.value = "alla";
    gradeFilter.value = "alla";
    difficultyFilter.value = "alla";
    focusFilter.value = "alla";

    createResultFilters();
    renderResults(allQuizResults);
  };
}



function renderResults(results) {
  const resultsContainer =
    document.getElementById("resultsContainer");

  let html = `
    <div class="results-table">

      <div class="results-header-row">
        <span>Datum</span>
        <span>Elev</span>
        <span>Tema</span>
        <span>Språk</span>
        <span>Årskurs</span>
        <span>Svårighet</span>
        <span>Moment</span>
        <span>Resultat</span>
      </div>
  `;

  results.forEach((result) => {
    const scoreClass =
      result.score <= 2
        ? "low-score"
        : result.score === 3
          ? "medium-score"
          : "high-score";

    html += `
      <div class="results-row">

        <span class="date-value">
          ${result.completedAt}
        </span>

        <span class="student-value">
          ${result.studentName}
        </span>

        <span class="category-tag">
          ${result.category}
        </span>

        <span class="language-tag">
          ${result.language}
        </span>

        <span class="grade-tag">
          Årskurs ${result.level}
        </span>

        <span class="difficulty-tag">
          ${result.difficulty}
        </span>

        <span class="focus-tag">
          ${result.focus}
        </span>

        <strong class="result-score ${scoreClass}">
          ${result.score}/${result.total}
        </strong>

      </div>
    `;
  });

  html += "</div>";

  resultsContainer.innerHTML = html;
}

async function loadRecentActivities() {
  if (!recentActivityContainer) return;

  recentActivityContainer.innerHTML =
    `<p class="recent-activity-empty">Laddar senaste aktiviteter...</p>`;

  try {
    const q = query(
      collection(db, "quizResults"),
      orderBy("completedAt", "desc")
    );

    const snapshot = await getDocs(q);

    const recentResults = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const settings = data.settings || {};

      if (data.score === null || data.score === undefined) {
        return;
      }

      recentResults.push({
        studentName:
          data.studentName ||
          settings.studentName ||
          "Okänd elev",

        category:
          settings.category ||
          "Tema saknas",

        level:
          settings.level ||
          "Årskurs saknas",

        difficulty:
          settings.difficulty ||
          "Svårighetsgrad saknas",

        focus:
          settings.focus ||
          "Moment saknas",

        language:
          settings.language ||
          "Språk saknas",

        score:
          data.score ?? 0,

        total:
          data.total ?? 0,

        completedAt:
          data.completedAt
            ? data.completedAt.toDate().toLocaleString(
                "sv-SE",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                }
              )
            : "Okänt datum"
      });
    });

    renderRecentActivities(recentResults.slice(0, 5));

  } catch (error) {
    console.error(error);

    recentActivityContainer.innerHTML =
      `<p class="recent-activity-empty">Kunde inte läsa senaste aktiviteter.</p>`;
  }
}

function renderRecentActivities(activities) {
  if (!recentActivityContainer) return;

  if (activities.length === 0) {
    recentActivityContainer.innerHTML =
      `<p class="recent-activity-empty">Inga genomförda quiz finns ännu.</p>`;
    return;
  }

  recentActivityContainer.innerHTML = activities.map((activity) => {
    const scoreClass =
      activity.score <= 2
        ? "low-score"
        : activity.score === 3
          ? "medium-score"
          : "high-score";

    const activityIcon =
      activity.score <= 2
        ? "priority_high"
        : activity.score === 3
          ? "trending_up"
          : "check_circle";

    return `
      <article class="recent-activity-card ${scoreClass}">

        <div class="recent-activity-top">
          <div class="recent-activity-icon">
            <span class="material-symbols-rounded">
              ${activityIcon}
            </span>
          </div>

          <span class="recent-activity-label">
            Genomfört quiz
          </span>
        </div>

        <div class="recent-activity-content">
          <h3>${activity.studentName}</h3>

          <p>
            Tränade ${activity.focus} på ${activity.language}
          </p>
        </div>

        <div class="recent-activity-tags">
          <span>${activity.focus}</span>
          <span>${activity.language}</span>
          <span>Årskurs ${activity.level}</span>
        </div>

        <div class="recent-activity-footer">
          <span class="material-symbols-rounded">
            schedule
          </span>

          <span>${activity.completedAt}</span>
        </div>

      </article>
    `;
  }).join("");
}


if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "/login.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadRecentActivities();
});