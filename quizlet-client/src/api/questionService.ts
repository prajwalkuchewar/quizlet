import axios from "axios";
import { toast } from "react-toastify";
import config from "../config/config";
import { handleError } from "../helper/ErrorHandler";
import { QuestionCreated } from "../models/Question";

const VITE_QUESTION_CREATE_URL = config.questionUrl;

export type QuestionItem = {
  id: number;
  questionTitle: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  rightAnswer: string;
  difficultyLevel: string;
  category: string;
};

export const getAllQuestions = async () => {
  const { data } = await axios.get<QuestionItem[]>(VITE_QUESTION_CREATE_URL);
  return data;
};

export const updateQuestion = async (
  id: number,
  question: Omit<QuestionItem, "id" | "difficultyLevel"> & {
    difficultyLevel?: string;
  },
) => {
  const { data } = await axios.put<QuestionItem>(
    `${VITE_QUESTION_CREATE_URL}/${id}`,
    { difficultyLevel: "EASY", ...question },
  );
  return data;
};

export const deleteQuestion = async (id: number) => {
  await axios.delete(`${VITE_QUESTION_CREATE_URL}/${id}`);
};

export const addQuestion = async (
  questionTitle: string,
  option1: string,
  option2: string,
  option3: string,
  option4: string,
  rightAnswer: string,
  category: string,
) => {
  try {
    const data = await axios.post<QuestionCreated>(VITE_QUESTION_CREATE_URL, {
      questionTitle: questionTitle,
      option1: option1,
      option2: option2,
      option3: option3,
      option4: option4,
      rightAnswer: rightAnswer,
      difficultyLevel: "EASY",
      category: category,
    });
    toast.success("Question Created!");
    return data;
  } catch (error) {
    handleError(error);
  }
};
