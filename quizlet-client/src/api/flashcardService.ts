import axios from "axios";
import config from "../config/config";
import {
  Difficulty,
  FlashcardProgress,
  FlashcardSet,
  FlashcardSetSummary,
} from "../models/Study";

export const listFlashcardSets = async () => {
  const { data } = await axios.get<FlashcardSetSummary[]>(
    `${config.flashcardsUrl}`,
  );
  return data;
};

export type GenerateFlashcardsRequest = {
  prompt: string;
  materialIds: number[];
  count: number;
  difficulty: Difficulty;
  title?: string;
};

export const generateFlashcards = async (req: GenerateFlashcardsRequest) => {
  const { data } = await axios.post<FlashcardSet>(
    `${config.flashcardsUrl}/generate`,
    req,
  );
  return data;
};

export const getFlashcardSet = async (setId: number) => {
  const { data } = await axios.get<FlashcardSet>(
    `${config.flashcardsUrl}/${setId}`,
  );
  return data;
};

export const reviewFlashcard = async (
  setId: number,
  flashcardId: number,
  remembered: boolean,
) => {
  await axios.post(`${config.flashcardsUrl}/${setId}/review`, {
    flashcardId,
    remembered,
  });
};

export const getFlashcardProgress = async (setId: number) => {
  const { data } = await axios.get<FlashcardProgress>(
    `${config.flashcardsUrl}/${setId}/progress`,
  );
  return data;
};
