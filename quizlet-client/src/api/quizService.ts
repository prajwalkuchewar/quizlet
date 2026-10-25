import axios from "axios";
import { toast } from "react-toastify";
import config from "../config/config";
import { handleError } from "../helper/ErrorHandler";
import {
  QuizAttempt,
  QuizCreated,
  QuizQuestions,
  QuizResponse,
} from "../models/Quiz";

const VITE_QUIZ_CREATE_URL = `${config.quizUrl}/create`;
const VITE_QUIZ_FETCH_URL = `${config.quizUrl}`;

export const listQuiz = async () => {
  try {
    // console.log(axios.defaults.headers.common['Authorization']);
    const data = await axios.get<QuizCreated[]>(VITE_QUIZ_FETCH_URL);
    // toast.success("Quiz list fetched!");
    return data;
  } catch (error) {
    handleError(error);
  }
};
export const createQuiz = async (
  category: string,
  numQ: number,
  title: string,
) => {
  try {
    // console.log(axios.defaults.headers.common['Authorization']);
    const data = await axios.post<QuizCreated>(VITE_QUIZ_CREATE_URL, {
      category: category,
      numQ: numQ,
      title: title,
    });
    toast.success("Quiz Created!");
    return data;
  } catch (error) {
    handleError(error);
  }
};

export const submitQuizAttempt = async (
  quizId: number,
  userResponses: QuizResponse[],
) => {
  const { data } = await axios.post<QuizAttempt>(
    `${VITE_QUIZ_FETCH_URL}/${quizId}/attempts`,
    userResponses,
  );
  return data;
};

export const listQuizAttempts = async () => {
  const { data } = await axios.get<QuizAttempt[]>(
    `${VITE_QUIZ_FETCH_URL}/attempts`,
  );
  return data;
};

export const fetchQuizQuestions = async (quizId: number) => {
  try {
    const data = await axios.get<QuizQuestions[]>(
      `${VITE_QUIZ_FETCH_URL}/${quizId}`,
    );
    toast.success("Quiz Fetched!");
    return data;
  } catch (error) {
    handleError(error);
  }
};
