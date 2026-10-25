// src/models/Question.ts
export interface Question {
  id?: number;
  questionTitle: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  rightAnswer: string;
  difficultyLevel: string;
  category: string;
}

export interface QuestionCreated {
  id: number;
  questionTitle: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  difficultyLevel: string;
  category: string;
}
