// src/models/Quiz.ts
export interface Quiz {
  id?: number; // Optional ID for the quiz (mainly used for updating)
  category: string; // Category of the quiz (e.g., Java)
  numQ: number; // Number of questions in the quiz
  title: string; // Title of the quiz
}

export interface QuizCreated {
  id: number;
  title: string;
  questionIds: number[];
}

export interface QuizQuestions {
  id: number;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  questionTitle: string;
}

export interface QuizResponse {
  id: number;
  response: string;
}
export interface QuizScore {
  score: number;
}

export interface QuizAttempt {
  id: number;
  quizId: number | null;
  quizTitle: string;
  score: number;
  total: number;
  createdAt: string;
}
