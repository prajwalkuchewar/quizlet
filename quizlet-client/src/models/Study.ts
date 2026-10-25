// src/models/Study.ts
export interface Material {
  id: number;
  title: string;
  filename: string | null;
  chunkCount: number;
}

export interface MaterialSearchResult {
  materialId: number;
  title: string;
  chunkId: number;
  content: string;
  similarity: number;
}

export interface LlmStatus {
  available: boolean;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
}

export interface Flashcard {
  id: number;
  front: string;
  back: string;
  sourceChunkId: number | null;
}

export interface FlashcardSet {
  id: number;
  title: string;
  prompt: string;
  materialIds: number[];
  flashcards: Flashcard[];
}

export interface FlashcardSetSummary {
  id: number;
  title: string;
  prompt: string;
  cardCount: number;
  createdAt: string | null;
  reviews: number;
  remembered: number;
}

export interface FlashcardProgress {
  setId: number;
  reviews: number;
  remembered: number;
  needsPractice: number;
}

export type Difficulty = "beginner" | "intermediate" | "advanced";
