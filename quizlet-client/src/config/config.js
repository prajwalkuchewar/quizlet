const config = {
  questionUrl: String(import.meta.env.VITE_QUESTION_URL),
  quizUrl: String(import.meta.env.VITE_QUIZ_URL),
  authUrl: String(import.meta.env.VITE_AUTHENTICATION_URL),
  materialsUrl: String(import.meta.env.VITE_MATERIALS_URL),
  flashcardsUrl: String(import.meta.env.VITE_FLASHCARDS_URL),
  llmUrl: String(import.meta.env.VITE_LLM_URL),
};

export default config;
