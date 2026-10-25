from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Table, Column, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship


def utcnow() -> datetime:
    return datetime.now(timezone.utc)

from app.database import Base


quiz_questions = Table(
    "quiz_questions",
    Base.metadata,
    Column("quiz_id", ForeignKey("quizzes.id", ondelete="CASCADE"), primary_key=True),
    Column("question_id", ForeignKey("questions.id", ondelete="RESTRICT"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    firstname: Mapped[str] = mapped_column(String(100))
    lastname: Mapped[str] = mapped_column(String(100))
    username: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="USER")
    materials: Mapped[list["Material"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    flashcard_sets: Mapped[list["FlashcardSet"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"
    id: Mapped[int] = mapped_column(primary_key=True)
    questionTitle: Mapped[str] = mapped_column(String(1000))
    option1: Mapped[str] = mapped_column(String(500))
    option2: Mapped[str] = mapped_column(String(500))
    option3: Mapped[str] = mapped_column(String(500))
    option4: Mapped[str] = mapped_column(String(500))
    rightAnswer: Mapped[str] = mapped_column(String(500))
    difficultyLevel: Mapped[str] = mapped_column(String(100), index=True)
    category: Mapped[str] = mapped_column(String(200), index=True)
    quizzes: Mapped[list["Quiz"]] = relationship(secondary=quiz_questions, back_populates="questions")


class Quiz(Base):
    __tablename__ = "quizzes"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    questions: Mapped[list[Question]] = relationship(secondary=quiz_questions, back_populates="quizzes", lazy="selectin")


flashcard_set_materials = Table(
    "flashcard_set_materials",
    Base.metadata,
    Column("set_id", ForeignKey("flashcard_sets.id", ondelete="CASCADE"), primary_key=True),
    Column("material_id", ForeignKey("materials.id", ondelete="CASCADE"), primary_key=True),
)


class Material(Base):
    __tablename__ = "materials"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(255))
    filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text)
    owner: Mapped[User] = relationship(back_populates="materials")
    chunks: Mapped[list["MaterialChunk"]] = relationship(back_populates="material", cascade="all, delete-orphan")
    flashcard_sets: Mapped[list["FlashcardSet"]] = relationship(secondary=flashcard_set_materials,
                                                                back_populates="materials")


class MaterialChunk(Base):
    __tablename__ = "material_chunks"
    id: Mapped[int] = mapped_column(primary_key=True)
    material_id: Mapped[int] = mapped_column(ForeignKey("materials.id", ondelete="CASCADE"), index=True)
    chunk_index: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(JSON)
    material: Mapped[Material] = relationship(back_populates="chunks")


class FlashcardSet(Base):
    __tablename__ = "flashcard_sets"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    prompt: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=utcnow)
    owner: Mapped[User] = relationship(back_populates="flashcard_sets")
    materials: Mapped[list[Material]] = relationship(secondary=flashcard_set_materials,
                                                     back_populates="flashcard_sets")
    flashcards: Mapped[list["Flashcard"]] = relationship(cascade="all, delete-orphan", order_by="Flashcard.id")


class Flashcard(Base):
    __tablename__ = "flashcards"
    id: Mapped[int] = mapped_column(primary_key=True)
    set_id: Mapped[int] = mapped_column(ForeignKey("flashcard_sets.id", ondelete="CASCADE"), index=True)
    front: Mapped[str] = mapped_column(Text)
    back: Mapped[str] = mapped_column(Text)
    source_chunk_id: Mapped[int | None] = mapped_column(ForeignKey("material_chunks.id", ondelete="SET NULL"), nullable=True)


class FlashcardReview(Base):
    __tablename__ = "flashcard_reviews"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    flashcard_id: Mapped[int] = mapped_column(ForeignKey("flashcards.id", ondelete="CASCADE"), index=True)
    remembered: Mapped[bool] = mapped_column(Boolean)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    quiz_id: Mapped[int | None] = mapped_column(ForeignKey("quizzes.id", ondelete="SET NULL"), nullable=True, index=True)
    quiz_title: Mapped[str] = mapped_column(String(255))
    score: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
