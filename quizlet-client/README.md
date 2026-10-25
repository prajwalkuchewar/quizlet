# Quizlet client

React + Vite + TypeScript + Tailwind frontend for the Quizlet backend. It covers login and signup, quizzes with saved attempts, material-based flashcards, History, Achievements, Settings, and a light/dark theme.

## Run locally

Start the backend first (see [quizlet-backend/README.md](../quizlet-backend/README.md)). Then, from this directory:

```powershell
cd quizlet-client
npm install
npm run dev
```

Open `http://localhost:5173`. Other scripts:

- `npm run build` builds to `dist/`
- `npm run preview` serves the production build
- `npm run lint` runs ESLint

## Configuration

`.env` holds the backend URLs. The defaults point at the backend on port 8000:

```
VITE_QUIZ_URL=http://localhost:8000/quiz
VITE_QUESTION_URL=http://localhost:8000/questions
VITE_AUTHENTICATION_URL=http://localhost:8000/auth
VITE_MATERIALS_URL=http://localhost:8000/questions/materials
VITE_FLASHCARDS_URL=http://localhost:8000/quiz/flashcards
VITE_LLM_URL=http://localhost:8000/llm
```

Change these if the backend runs elsewhere. Vite reads them at startup, so restart `npm run dev` after editing.

## Pages

- `/quiz`: take any available quiz. Scores are saved on the server.
- `/materials`: add notes or upload documents. Flashcards are generated from these.
- `/generate`: create a flashcard set from your materials.
- `/flashcards`: study sets. Defaults come from Settings.
- `/history` and `/achievements`: your quiz attempts and flashcard sets, loaded from the backend.
- `/settings`: account info and default flashcard count and difficulty (saved in this browser).
- `/darkmode`: switch between light and dark theme (saved in this browser).
- Creating quizzes is limited to admin accounts.
