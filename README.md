# Kiddolingo (EduTailor)

Kiddolingo is a web app that helps teachers create AI-generated language-learning quizzes for children. Teachers pick a category, grade level, difficulty, focus area, and target language, and the app uses OpenAI to generate age-appropriate quiz questions, activities, and image/sound-matched exercises for kids to complete.

## Features

- **AI-generated quizzes** – Teachers configure a quiz (category, grade level, difficulty, focus area, language, number of questions) and the backend generates structured quiz content via the OpenAI API.
- **AI-generated language activities** – A separate endpoint generates a simple language activity (title, description, target vocabulary, sample questions, and a teacher tip) tailored to a child's age, language level, and topic.
- **Kid-friendly quiz player** – An interactive quiz view (`quiz.html`) that shows images and plays matching sound effects (e.g. animal sounds) as feedback for answers.
- **Teacher dashboard** – A sidebar dashboard (`index.html`) for creating and managing quizzes and viewing results.
- **Authentication** – Teacher accounts (register/login/logout) powered by Firebase Authentication, with quiz results stored in Firestore.
- **Animated mascots** – Lottie-based mascot animations to make the experience more engaging for kids.
- **Themed content packs** – Built-in categories such as animals, food, and body parts, each with matching images, background art, and sound effects.

## Tech Stack

- **Backend:** Node.js, [Express](https://expressjs.com/)
- **AI:** [OpenAI API](https://platform.openai.com/) (`gpt-4.1-mini`) via the official `openai` SDK
- **Auth & Database:** [Firebase](https://firebase.google.com/) (Authentication + Firestore)
- **Frontend:** Static HTML/CSS/JavaScript (vanilla JS, ES modules), served from the `public` folder
- **Config:** `dotenv` for environment variables

## Project Structure

```
.
├── server.js               # Express server & OpenAI-powered API endpoints
└── public/
    ├── index.html           # Teacher dashboard
    ├── login.html            # Login page
    ├── register.html         # Registration page
    ├── quiz.html              # Interactive quiz player
    ├── css/                    # Stylesheets
    ├── js/
    │   ├── firebase.js          # Firebase config & auth helpers
    │   ├── login.js              # Login logic
    │   ├── register.js            # Registration logic
    │   ├── script.js               # Dashboard / quiz creation logic
    │   └── quiz.js                  # Quiz player logic
    ├── images/                 # Quiz images (animals, food, body parts, etc.)
    ├── background/              # Background art per category
    ├── sounds/                   # Sound effects (animal sounds, feedback sounds)
    └── mascot/                    # Lottie animation files for mascots
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- An [OpenAI API key](https://platform.openai.com/api-keys)
- A [Firebase](https://console.firebase.google.com/) project with Authentication (Email/Password) and Firestore enabled

### Installation

1. Clone or download this repository.
2. Install dependencies:
   ```bash
   npm install express dotenv openai
   ```
3. Create a `.env` file in the project root with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
4. (Optional) Update the Firebase configuration in `public/js/firebase.js` with your own Firebase project's credentials if you're not using the existing project.

### Running the app

```bash
node server.js
```

The server starts on **http://localhost:3000**. Visit that URL in your browser — you'll be redirected to the login page first.

## API Endpoints

| Method | Endpoint              | Description                                                                 |
|--------|------------------------|-------------------------------------------------------------------------------|
| GET    | `/`                    | Serves the login page                                                          |
| POST   | `/api/generate`        | Generates a simple language-learning activity based on age, level, theme, and language |
| POST   | `/api/generate-quiz`   | Generates a full quiz based on category, grade level, language, difficulty, focus, and question count |

Both AI endpoints call the OpenAI API server-side and return structured JSON that the frontend uses to render activities and quizzes, matching each question to a relevant image (via an `imageKey`) and, where applicable, a sound effect.

## Notes

- Quiz prompts and instructions sent to the AI model are currently written in Swedish, and generated content is returned in the language selected by the teacher.
- The Firebase configuration in `public/js/firebase.js` is a client-side config and is safe to expose publicly, but you should still configure Firebase Security Rules appropriately for your own project.
- Keep your `OPENAI_API_KEY` secret — never commit your `.env` file to version control.

## License

Not specified. Add a license of your choice (e.g. MIT) if you plan to share or open-source this project.
