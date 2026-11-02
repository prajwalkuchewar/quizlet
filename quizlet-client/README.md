# Quizlet client

React single-page app built with Vite and Tailwind CSS. The codebase uses both JavaScript (`.jsx`) and TypeScript (`.tsx`); it is not fully migrated to TypeScript. The full application overview and setup are in the [repository README](../README.md).

## Run locally

The client runs as part of the Docker Compose stack from the repository root; see the [repository README](../README.md#local-setup). The app is served at `http://localhost` (nginx), and it calls the API at `http://localhost:8000`.

## Useful scripts

- `npm ci` — install dependencies (used by the Docker build)
- `npm run dev` — Vite development server, for UI work only; it is not the supported run path
- `npm run build` — production bundle in `dist/`
- `npm run preview` — serve the built bundle locally
- `npm run lint` — ESLint

## Main routes

- `/register`, `/login` — public account forms
- `/` — protected home page
- `/quiz`, `/attempt` — quiz catalog and attempts
- `/materials` — add notes/documents and ask questions about them
- `/flashcards`, `/flashcards/:setId` — generate and study flashcard sets
- `/history`, `/achievements` — quiz history and study summaries
- `/settings`, `/darkmode` — user preferences
- `/generate`, `/addQue`, `/question` — admin-only quiz and question-bank tools

The frontend reads API URLs from Vite environment variables. See `src/config/config.js`; set `VITE_*` values before starting/building if the backend is not at the local default. Vite embeds these values at build time.
