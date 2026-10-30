from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class SignupRequest(BaseModel):
    firstname: str = Field(min_length=1, max_length=100)
    lastname: str = Field(min_length=1, max_length=100)
    username: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    role: Literal["USER", "ADMIN"] = "USER"


class LoginRequest(BaseModel):
    username: str
    password: str


class QuestionInput(BaseModel):
    questionTitle: str
    option1: str
    option2: str
    option3: str
    option4: str
    rightAnswer: str
    difficultyLevel: str
    category: str


class QuestionOut(QuestionInput):
    id: int
    model_config = ConfigDict(from_attributes=True)


class QuestionPublic(BaseModel):
    id: int
    questionTitle: str
    option1: str
    option2: str
    option3: str
    option4: str
    model_config = ConfigDict(from_attributes=True)


class QuestionResponse(BaseModel):
    id: int
    response: str


class QuizCreate(BaseModel):
    category: str
    numQ: int = Field(gt=0, le=100)
    title: str = Field(min_length=1, max_length=255)


class QuizOut(BaseModel):
    id: int
    title: str
    questionIds: list[int]


class MaterialTextInput(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1, max_length=1_000_000)


class MaterialOut(BaseModel):
    id: int
    title: str
    filename: str | None
    chunkCount: int


class MaterialSearchInput(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    materialIds: list[int] | None = None
    limit: int = Field(default=5, ge=1, le=20)


class MaterialSearchHit(BaseModel):
    materialId: int
    title: str
    chunkId: int
    content: str
    similarity: float


class QuizQuestion(BaseModel):
    type: Literal["multiple_choice", "true_false", "short_answer"]
    question: str
    options: list[str] = []
    answer: str
    explanation: str = ""


class MaterialAskOutput(BaseModel):
    answer: str
    sources: list[MaterialSearchHit]
    quiz: list[QuizQuestion] | None = None


class GenerateFlashcardsInput(BaseModel):
    prompt: str = Field(min_length=1, max_length=2000)
    materialIds: list[int] = Field(min_length=1)
    count: int = Field(default=10, ge=1, le=40)
    difficulty: Literal["beginner", "intermediate", "advanced"] = "intermediate"
    title: str | None = Field(default=None, max_length=255)


class FlashcardOut(BaseModel):
    id: int
    front: str
    back: str
    sourceChunkId: int | None = None


class FlashcardSetOut(BaseModel):
    id: int
    title: str
    prompt: str
    materialIds: list[int]
    flashcards: list[FlashcardOut]


class FlashcardReviewInput(BaseModel):
    flashcardId: int
    remembered: bool


class FlashcardSetSummary(BaseModel):
    id: int
    title: str
    prompt: str
    cardCount: int
    createdAt: datetime | None
    reviews: int
    remembered: int


class QuizAttemptOut(BaseModel):
    id: int
    quizId: int | None
    quizTitle: str
    score: int
    total: int
    createdAt: datetime

