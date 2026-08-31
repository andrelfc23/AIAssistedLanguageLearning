
import { db } from "./firebase.js";
import { doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const quizOutput = document.getElementById("quizOutput");


const studentName = sessionStorage.getItem("studentName") || "Okänd elev";
const savedQuestions = sessionStorage.getItem("quizQuestions");
const savedSettings = sessionStorage.getItem("quizSettings");
const settings = savedSettings ? JSON.parse(savedSettings) : {};
let childAnswers = [];


const animalSoundMap = {
  dog: "/sounds/dog.mp3",
  cat: "/sounds/cat.mp3",
  rabbit: "/sounds/rabbit.mp3",
  penguin: "/sounds/penguin.mp3",
  bear: "/sounds/bear.mp3",
  shark: "/sounds/shark.mp3"
};

// LÄGG TILL HJÄLPFUNKTION I quiz.js

function getAnimalSound(answer) {
  const key = answer.toLowerCase().trim();

  return animalSoundMap[key] || null;
}

// LÄGG TILL HJÄLPFUNKTION I quiz.js

function playAnimalSound(soundSrc) {
  if (!soundSrc) return;

  const audio = new Audio(soundSrc);
  audio.play();
}

const imageMap = {
  dog: "/images/dog.jpg",
  cat: "/images/cat.jpg",
  rabbit: "/images/rabbit.webp",
  penguin: "/images/penguin.avif",
  bear: "/images/bear.webp",
  shark: "/images/shark.avif",

  apple: "/images/apple.avif",
  banana: "/images/banana.webp",
  carrot: "/images/carrot.jpg",
  cheese: "/images/cheese.avif",
  hamburger: "/images/hamburger.webp",
  pasta: "/images/pasta.webp",
  pizza: "/images/pizza.jpg",

  ear: "/images/ear.jpg",
  eye: "/images/eye.webp",
  foot: "/images/foot.avif",
  hand: "/images/hand.jpg",
  mouth: "/images/mouth.webp",
  nose: "/images/nose.avif"
};

const answerImageMap = {
  // DJUR
  dog: "/images/dog.jpg",
  hund: "/images/dog.jpg",
  perro: "/images/dog.jpg",

  cat: "/images/cat.jpg",
  katt: "/images/cat.jpg",
  gato: "/images/cat.jpg",

  rabbit: "/images/rabbit.webp",
  kanin: "/images/rabbit.webp",
  conejo: "/images/rabbit.webp",

  penguin: "/images/penguin.avif",
  pingvin: "/images/penguin.avif",
  pinguino: "/images/penguin.avif",

  bear: "/images/bear.webp",
  björn: "/images/bear.webp",
  oso: "/images/bear.webp",

  shark: "/images/shark.avif",
  haj: "/images/shark.avif",
  tiburón: "/images/shark.avif",

  // MAT
  apple: "/images/apple.avif",
  äpple: "/images/apple.avif",
  manzana: "/images/apple.avif",

  banana: "/images/banana.webp",
  banan: "/images/banana.webp",
  plátano: "/images/banana.webp",

  carrot: "/images/carrot.jpg",
  morot: "/images/carrot.jpg",
  zanahoria: "/images/carrot.jpg",

  cheese: "/images/cheese.avif",
  ost: "/images/cheese.avif",
  queso: "/images/cheese.avif",

  hamburger: "/images/hamburger.webp",
  hamburgare: "/images/hamburger.webp",
  hamburguesa: "/images/hamburger.webp",

  pasta: "/images/pasta.webp",
  pasta: "/images/pasta.webp",

  pizza: "/images/pizza.jpg",
  pizza: "/images/pizza.jpg",

  // KROPPEN
  ear: "/images/ear.jpg",
  öra: "/images/ear.jpg",
  oreja: "/images/ear.jpg",

  eye: "/images/eye.webp",
  öga: "/images/eye.webp",
  ojo: "/images/eye.webp",

  foot: "/images/foot.avif",
  fot: "/images/foot.avif",
  pie: "/images/foot.avif",

  hand: "/images/hand.jpg",
  hand: "/images/hand.jpg",
  mano: "/images/hand.jpg",

  mouth: "/images/mouth.webp",
  mun: "/images/mouth.webp",
  boca: "/images/mouth.webp",

  nose: "/images/nose.avif",
  näsa: "/images/nose.avif",
  nariz: "/images/nose.avif"
};

const mascotMap = {
  chicken: "/mascot/chicken.json",
  lexi: "/mascot/lexi.json",
  spaceHero: "/mascot/spaceHero.json"
};

let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

if (!savedQuestions) {
  quizOutput.className = "quiz-empty";
  quizOutput.innerHTML = `
    <span class="material-symbols-rounded">error</span>
    <h3>Inget quiz hittades</h3>
    <p>Gå tillbaka till lärarvyn och skapa ett quiz först.</p>
  `;
} else {
  const questions = JSON.parse(savedQuestions);
  const settings = savedSettings ? JSON.parse(savedSettings) : null;

  if (settings) {
    document.getElementById("resultCategory").textContent = settings.category;
    document.getElementById("resultLevel").textContent = `Årskurs ${settings.level}`;
    document.getElementById("resultAmount").textContent = `${settings.amount} frågor`;
  }

  showMascotSelection(questions);
}


function setQuizBackground(targetElement) {
  const settings =
    JSON.parse(sessionStorage.getItem("quizSettings")) || {};

  const categoryThemeMap = {
    djur: "/background/animals_background.jpg",
    mat: "/background/foodBackground.jpg",
    kroppen: "/background/bodyParts2.jpg"
  };

  const backgroundImage =
    categoryThemeMap[settings.category];

  if (backgroundImage) {
    targetElement.style.backgroundImage =
      `url("${backgroundImage}")`;

    targetElement.style.backgroundSize = "cover";
    targetElement.style.backgroundPosition = "center";
    targetElement.style.backgroundRepeat = "no-repeat";
  }
}

// I showMascotSelection()

function showMascotSelection(questions) {
  const mascotSelection =
    document.getElementById("mascotSelection");

  setQuizBackground(mascotSelection);

  quizOutput.classList.add("hidden");
  mascotSelection.classList.remove("hidden");

 // OM DU VILL ATT BARNET SKA KUNNA BYTA MASKOT OCKSÅ

document.querySelectorAll(".mascot-card")
.forEach(card => {

  card.addEventListener("click", () => {

    const mascot =
      card.dataset.mascot;

    sessionStorage.setItem(
      "selectedMascot",
      mascot
    );

    document
      .getElementById("mascotSelection")
      .classList.add("hidden");

    quizOutput.classList.remove("hidden");

    renderQuiz(questions);
  });

});
}


function renderQuiz(questions) {
  currentQuestions = questions;
  currentQuestionIndex = 0;
  score = 0;

  showQuestion();
  updateResultPanel();
}

function showQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
  const isLastQuestion = currentQuestionIndex === currentQuestions.length - 1;

  const selectedMascot =
  sessionStorage.getItem("selectedMascot") || "chicken";

const mascotImage =
  mascotMap[selectedMascot] || mascotMap.chicken;

  quizOutput.className = "quiz-play-view";

  setQuizBackground(quizOutput);

  const categoryThemeMap = {
    djur: "/background/animals_background.jpg",
    mat: "/background/foodBackground.jpg",
    kroppen: "/background/bodyParts2.jpg"
  };
  
  const backgroundImage =
    categoryThemeMap[settings.category];

    if (backgroundImage) {
      quizOutput.style.backgroundImage =
        `url("${backgroundImage}")`;
  
      quizOutput.style.backgroundSize = "cover";
      quizOutput.style.backgroundPosition = "center";
      quizOutput.style.backgroundRepeat = "no-repeat";
    }
  

  quizOutput.innerHTML = `

    <div class="quiz-game-header">
      <div class="progress-wrapper">

        <div class="progress-top">
          <div class="progress-stars">
            ${Array.from({ length: currentQuestionIndex + 1 }, () => `
              <img src="/images/star.png" alt="Stjärna">
            `).join("")}
          </div>

          <div class="question-counter">
            ${currentQuestionIndex + 1} / ${currentQuestions.length}
          </div>

          <div class="score-pill">
            <img src="/images/correct_answer.png" alt="Poäng">
            <span>${score}</span>
          </div>
        </div>

        <div class="progress-bar">
          <div style="width: ${progress}%"></div>
        </div>

      </div>
    </div>

    <article class="play-question-card">
      <div class="question-badge">
        <img src="/images/points.png" alt="Poäng">
        10 poäng
      </div>

      <div class="question-image">
        <img src="${imageMap[q.imageKey] || "/images/ask_question.png"}" alt="${q.imageKey || "Fråga"}">
      </div>

      <h3>${q.question}</h3>

     

      <div class="play-answer-list">
        ${q.answers.map(answer => {
          
          const soundSrc = getAnimalSound(answer);
          const isAnimalCategory = settings.category === "djur";
          const isSpellingQuiz = settings.focus === "stavning";
          const imageSrc = isSpellingQuiz  ? null : getAnswerImage(answer);
      
          return `
            <button class="play-answer-btn" data-answer="${answer}">
              ${
                imageSrc
                  ? `<img src="${imageSrc}" alt="${answer}" class="answer-option-image">`
                  : ""
              }
      
              <span>${answer}</span>
      
              ${
                isAnimalCategory && soundSrc
                  ? `
                    <span
                      class="animal-sound-btn"
                      data-sound="${soundSrc}"
                      role="button"
                      aria-label="Spela ljud"
                    >
                      <span class="material-symbols-rounded">volume_up</span>
                    </span>
                  `
                  : ""
              }
            </button>
          `;
        }).join("")}
      </div>

      <div id="feedbackBox" class="feedback-message hidden"></div>


<div class="quiz-navigation">

  <div class="quiz-navigation-left">
  <button
  id="previousQuestionBtn"
  class="previous-question-btn"
  type="button"
>
      <span class="material-symbols-rounded">arrow_back</span>
    </button>
  </div>

  <div class="quiz-navigation-right">
    <button id="nextQuestionBtn" class="next-btn hidden">
      <span class="material-symbols-rounded">
        ${isLastQuestion ? "emoji_events" : "arrow_forward"}
      </span>
    </button>
  </div>

</div>

    </article>
  `;

  document.querySelectorAll(".play-answer-btn").forEach(button => {
    button.addEventListener("click", handleSingleAnswer);
  });

  // LÄGG EFTER EVENTLISTENER FÖR .play-answer-btn I showQuestion()

document.querySelectorAll(".animal-sound-btn").forEach(soundButton => {
  soundButton.addEventListener("click", event => {
    event.stopPropagation();

    const soundSrc = soundButton.dataset.sound;

    playAnimalSound(soundSrc);
  });
});

 
    // ERSÄTT DIN EVENTLISTENER FÖR previousQuestionBtn

const previousQuestionBtn =
document.getElementById("previousQuestionBtn");

if (previousQuestionBtn) {
previousQuestionBtn.addEventListener("click", () => {

  // OM VI ÄR PÅ FÖRSTA FRÅGAN
  if (currentQuestionIndex === 0) {

    quizOutput.classList.add("hidden");

    document
      .getElementById("mascotSelection")
      .classList.remove("hidden");

    return;
  }

  currentQuestionIndex--;

  showQuestion();

  updateResultPanel();
});
}
}

function getAnswerImage(answer) {
  const translationMap = {
    ost: "cheese",
    banan: "banana",
    morot: "carrot",
    äpple: "apple",
    hamburgare: "hamburger",

    hund: "dog",
    katt: "cat",
    kanin: "rabbit",
    pingvin: "penguin",
    björn: "bear",
    haj: "shark",

    öra: "ear",
    öga: "eye",
    fot: "foot",
    mun: "mouth",
    näsa: "nose"
  };

  let key = answer.toLowerCase().trim();

  if (translationMap[key]) {
    key = translationMap[key];
  }

  return answerImageMap[key] || null;
}

function handleSingleAnswer(event) {
  const selectedButton = event.currentTarget;
  const selectedAnswer = selectedButton.dataset.answer;
  const q = currentQuestions[currentQuestionIndex];

  const selectedMascot =
    sessionStorage.getItem("selectedMascot") || "chicken";

  const mascotSrc =
    mascotMap[selectedMascot];

  let displayedFeedback = q.feedback;

  if (selectedAnswer !== q.correctAnswer) {
    displayedFeedback = `Nästan! Rätt svar är ${q.correctAnswer}. ${q.feedback}`;
  }

  childAnswers.push({
    questionIndex: currentQuestionIndex,
    question: q.question,
    answers: q.answers,
    selectedAnswer: selectedAnswer,
    correctAnswer: q.correctAnswer,
    isCorrect: selectedAnswer === q.correctAnswer,
    aiFeedback: q.feedback,
    displayedFeedback: displayedFeedback,
    imageKey: q.imageKey
  });

  const isLastQuestion =
    currentQuestionIndex === currentQuestions.length - 1;

  const buttons = document.querySelectorAll(".play-answer-btn");
  const feedbackBox = document.getElementById("feedbackBox");
  const nextBtn = document.getElementById("nextQuestionBtn");

  buttons.forEach(button => {
    button.disabled = true;

    if (button.dataset.answer === q.correctAnswer) {
      button.classList.add("correct-answer");
    }

    if (
      button.dataset.answer === selectedAnswer &&
      selectedAnswer !== q.correctAnswer
    ) {
      button.classList.add("wrong-answer");
    }
  });

  if (selectedAnswer === q.correctAnswer) {
    score++;
  
    feedbackBox.className =
      "feedback-message correct-feedback";
  
    feedbackBox.innerHTML = `
      <div class="feedback-content">
  
        <div class="feedback-mascot">
          <lottie-player
            src="${mascotSrc}"
            background="transparent"
            speed="1"
            loop
            autoplay>
          </lottie-player>
        </div>
  
        <div>
          <strong>Bra jobbat!</strong>
          <p>${q.feedback}</p>
        </div>
  
      </div>
    `;
  } else {
    feedbackBox.className =
      "feedback-message wrong-feedback";
  
    feedbackBox.innerHTML = `
      <div class="feedback-content">
  
        <div class="feedback-mascot">
          <lottie-player
            src="${mascotSrc}"
            background="transparent"
            speed="1"
            loop
            autoplay>
          </lottie-player>
        </div>
  
        <div>
          <strong>Nästan!</strong>
          <p>Rätt svar är <b>${q.correctAnswer}</b>.</p>
          <p>${q.feedback}</p>
        </div>
  
      </div>
    `;
  }

  if (isLastQuestion) {
    nextBtn.innerHTML = `
    <button class="results-btn">
    <span class="results-btn-text">
      Visa resultat
    </span>
  
    <span class="material-symbols-rounded">
      trophy
    </span>
  </button>
    `;
  }

  nextBtn.classList.remove("hidden");

  nextBtn.addEventListener("click", () => {
    currentQuestionIndex++;

    if (currentQuestionIndex < currentQuestions.length) {
      showQuestion();
    } else {
      showFinalResult();
    }

    updateResultPanel();
  });
}

function showFinalResult() {
  console.log(childAnswers);

  const selectedMascot =
    sessionStorage.getItem("selectedMascot") || "chicken";

  const mascotAnimation =
    mascotMap[selectedMascot] || mascotMap.chicken;

  const total = currentQuestions.length;

  let medalImage = "";
  let resultText = "";

  if (score === total) {
    medalImage = "/images/medal_number_one/medal_number_one.jpg";
    resultText = "Fantastiskt!";
  } else if (score >= total * 0.7) {
    medalImage = "/images/cutegirl_medal_result/cutegirl.jpg";
    resultText = "Superbra!";
  } else {
    medalImage = "/images/badges_result/5248601.jpg";
    resultText = "Försök igen";
  }

  quizOutput.className = "quiz-result-view";

  setQuizBackground(quizOutput);

  launchConfetti();

  quizOutput.innerHTML = `
    <section class="fullscreen-result">

      <div class="result-center-section">

        <img class="result-badge" src="${medalImage}" alt="Medalj">

        <div class="result-score-area">

          <div class="result-score-circle">
            <span>${score} / ${total}</span>
          </div>

          <!-- ÄNDRA ORDNINGEN INNE I result-mascot-row -->

<div class="result-mascot-row">

  <div class="result-mascot">
    <lottie-player
      src="${mascotAnimation}"
      background="transparent"
      speed="1"
      loop
      autoplay>
    </lottie-player>
  </div>

  <div class="result-speech-bubble">
    ${resultText}
  </div>

</div>

        </div>

      </div>

      <div class="result-progress">
        <div style="width:${(score / total) * 100}%"></div>
      </div>

      <div class="result-buttons">
     

      <button onclick="location.reload()" class="play-again-btn">
        <span class="material-symbols-rounded">replay</span>
        Spela igen
      </button>
     
      
      <button id="finishQuizBtn" type="button" class="finishQuiz-btn">
        <span class="material-symbols-rounded">check_circle</span>
        Klar
      </button>
      </div>

    </section>
  `;

  document
    .getElementById("finishQuizBtn")
    .addEventListener("click", async () => {
      await saveFinalResult();

      showGoodbyeScreen()
     
    });
}


function updateResultPanel() {
    const scoreBox = document.querySelector(".score-box h3");
    const scoreText = document.querySelector(".score-box p");
  
    if (!scoreBox || !scoreText) return;
  
    if (!currentQuestions.length) {
      scoreBox.textContent = "0 / 0";
      scoreText.textContent = "Poäng visas här när quizet är genomfört.";
      return;
    }
  
    scoreBox.textContent = `${score} / ${currentQuestions.length}`;
  
    if (currentQuestionIndex < currentQuestions.length) {
      scoreText.textContent = `Fråga ${currentQuestionIndex + 1} av ${currentQuestions.length}`;
    } else {
      scoreText.textContent = "Quizet är klart.";
    }
  }

  function launchConfetti() {
    const duration = 5000;
    const end = Date.now() + duration;
  
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 70,
        origin: { x: 0 }
      });
  
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 70,
        origin: { x: 1 }
      });
  
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }

  async function saveFinalResult() {
    const quizDocId = sessionStorage.getItem("quizDocId");
  
    const settings =
      JSON.parse(sessionStorage.getItem("quizSettings")) || {};
  
    const questions =
      JSON.parse(sessionStorage.getItem("quizQuestions")) || [];
  
    const studentName =
      sessionStorage.getItem("studentName") ||
      settings.studentName ||
      "Okänd elev";
  
    if (!quizDocId) {
      console.error("Saknar quizDocId.");
      return;
    }
  
    await updateDoc(doc(db, "quizResults", quizDocId), {
      status: "completed",
      completedAt: serverTimestamp(),
  
      studentName,
  
      score,
      total: questions.length,
  
      settings: {
        ...settings,
        studentName
      },
  
      aiQuestions: questions,
      childAnswers: childAnswers
    });
  }

  // NY FUNKTION

function showGoodbyeScreen() {
  const selectedMascot =
    sessionStorage.getItem("selectedMascot") || "chicken";

  const mascotAnimation =
    mascotMap[selectedMascot] || mascotMap.chicken;

  quizOutput.innerHTML = `
    <section class="goodbye-screen">

      <div class="goodbye-card">

        <div class="goodbye-mascot">
          <lottie-player
            src="${mascotAnimation}"
            background="transparent"
            speed="1"
            loop
            autoplay>
          </lottie-player>
        </div>

<div class="goodbye-message">

  <div class="goodbye-speech-bubble">
    Tack för att du spelade!
  </div>

</div>

      </div>

    </section>
  `;

  setTimeout(() => {
    window.location.href = "/index.html";
  }, 8000);
}

  