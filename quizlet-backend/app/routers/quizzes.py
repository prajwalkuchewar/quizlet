import asyncio

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import FlashcardReview, FlashcardSet, Question, Quiz, QuizAttempt, User
from app.schemas import (FlashcardReviewInput, FlashcardSetOut, FlashcardSetSummary, GenerateFlashcardsInput,
                         QuestionPublic, QuestionResponse, QuizAttemptOut, QuizCreate, QuizOut)
from app.security import get_current_user, require_admin
from app.services.llm_service import generate_flashcards_async
from app.services.quiz_service import prepare_flashcard_context, save_flashcard_set

router = APIRouter(prefix="/quiz", tags=["quiz"])


def to_quiz_out(quiz: Quiz) -> QuizOut:
    return QuizOut(id=quiz.id, title=quiz.title, questionIds=[q.id for q in quiz.questions])


def to_flashcard_set_out(card_set: FlashcardSet) -> FlashcardSetOut:
    return FlashcardSetOut(id=card_set.id, title=card_set.title, prompt=card_set.prompt,
                           materialIds=[material.id for material in card_set.materials],
                           flashcards=[{"id": card.id, "front": card.front, "back": card.back,
                                        "sourceChunkId": card.source_chunk_id}
                                       for card in card_set.flashcards])


@router.post("/flashcards/generate", response_model=FlashcardSetOut, status_code=201,
             tags=["quiz service - flashcards"], summary="Generate a saved flashcard set from your materials")
async def generate_flashcard_set(request: Request, body: GenerateFlashcardsInput, db: Session = Depends(get_db),
                                 user: User = Depends(get_current_user)):
    materials, matches, context = await run_in_threadpool(
        prepare_flashcard_context, db, user, body.prompt, body.materialIds, body.count)
    cards = await _until_client_disconnects(
        request, generate_flashcards_async(body.prompt, context, body.count, body.difficulty))
    return await run_in_threadpool(_save_and_export, db, user, body, materials, matches, cards)


async def _until_client_disconnects(request: Request, work):
    # FastAPI does not cancel a handler when the browser goes away, so watch for that and cancel the LLM call.
    task = asyncio.ensure_future(work)
    while True:
        done, _ = await asyncio.wait({task}, timeout=0.5)
        if done:
            return task.result()
        if await request.is_disconnected():
            task.cancel()
            await asyncio.gather(task, return_exceptions=True)
            raise HTTPException(status_code=499, detail="Client disconnected; flashcard generation stopped")


def _save_and_export(db: Session, user: User, body: GenerateFlashcardsInput, materials, matches, cards):
    card_set = save_flashcard_set(db, user, body.prompt, body.title, materials, matches, cards)
    return to_flashcard_set_out(card_set)


@router.get("/flashcards/{set_id}", response_model=FlashcardSetOut,
            tags=["quiz service - flashcards"], summary="Open one of your generated flashcard sets")
def get_flashcard_set(set_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    card_set = db.query(FlashcardSet).filter(FlashcardSet.id == set_id, FlashcardSet.owner_id == user.id).first()
    if not card_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    return to_flashcard_set_out(card_set)


@router.post("/flashcards/{set_id}/review", tags=["quiz service - flashcards"],
             summary="Record whether you recalled a flashcard")
def review_flashcard(set_id: int, body: FlashcardReviewInput, db: Session = Depends(get_db),
                     user: User = Depends(get_current_user)):
    card_set = db.query(FlashcardSet).filter(FlashcardSet.id == set_id, FlashcardSet.owner_id == user.id).first()
    if not card_set or not any(card.id == body.flashcardId for card in card_set.flashcards):
        raise HTTPException(status_code=404, detail="Flashcard not found in this set")
    db.add(FlashcardReview(user_id=user.id, flashcard_id=body.flashcardId, remembered=body.remembered))
    db.commit()
    return {"message": "Review recorded", "remembered": body.remembered}


@router.get("/flashcards/{set_id}/progress", tags=["quiz service - flashcards"],
            summary="Get your recall totals for a flashcard set")
def flashcard_progress(set_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    card_set = db.query(FlashcardSet).filter(FlashcardSet.id == set_id, FlashcardSet.owner_id == user.id).first()
    if not card_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    reviews = db.query(FlashcardReview).filter(FlashcardReview.user_id == user.id,
                                               FlashcardReview.flashcard_id.in_([c.id for c in card_set.flashcards])).all()
    return {"setId": set_id, "reviews": len(reviews),
            "remembered": sum(review.remembered for review in reviews),
            "needsPractice": sum(not review.remembered for review in reviews)}


@router.post("/create", response_model=QuizOut, status_code=201)
def create_quiz(body: QuizCreate, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    candidates = db.query(Question).filter(Question.category == body.category).all()
    if not candidates:
        raise HTTPException(404, "No questions found for category")
    import random
    quiz = Quiz(title=body.title, questions=random.sample(candidates, min(body.numQ, len(candidates))))
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return to_quiz_out(quiz)


@router.get("", response_model=list[QuizOut])
def list_quizzes(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    return [to_quiz_out(q) for q in db.query(Quiz).order_by(Quiz.id).all()]


@router.get("/flashcards", response_model=list[FlashcardSetSummary], tags=["quiz service - flashcards"],
            summary="List your generated flashcard sets with recall totals")
def list_flashcard_sets(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    card_sets = db.query(FlashcardSet).filter(FlashcardSet.owner_id == user.id).order_by(FlashcardSet.id.desc()).all()
    reviews = db.query(FlashcardReview).filter(FlashcardReview.user_id == user.id).all()
    remembered_by_card: dict[int, list[bool]] = {}
    for review in reviews:
        remembered_by_card.setdefault(review.flashcard_id, []).append(review.remembered)
    summaries = []
    for card_set in card_sets:
        set_reviews = [r for card in card_set.flashcards for r in remembered_by_card.get(card.id, [])]
        summaries.append(FlashcardSetSummary(
            id=card_set.id, title=card_set.title, prompt=card_set.prompt,
            cardCount=len(card_set.flashcards), createdAt=card_set.created_at,
            reviews=len(set_reviews), remembered=sum(set_reviews)))
    return summaries


@router.get("/attempts", response_model=list[QuizAttemptOut], summary="List your quiz attempts, newest first")
def list_attempts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == user.id).order_by(QuizAttempt.id.desc()).all()
    return [QuizAttemptOut(id=a.id, quizId=a.quiz_id, quizTitle=a.quiz_title, score=a.score,
                           total=a.total, createdAt=a.created_at) for a in attempts]


@router.get("/{quiz_id}", response_model=list[QuestionPublic])
def quiz_questions(quiz_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    return quiz.questions


def score_responses(db: Session, responses: list[QuestionResponse]) -> int:
    questions = {q.id: q for q in db.query(Question).filter(Question.id.in_([r.id for r in responses])).all()}
    if any(response.id not in questions for response in responses):
        raise HTTPException(404, "Question not found")
    return sum(questions[r.id].rightAnswer == r.response for r in responses)


@router.post("/submit", response_model=int)
def submit(responses: list[QuestionResponse], db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    return score_responses(db, responses)


@router.post("/{quiz_id}/attempts", response_model=QuizAttemptOut, status_code=201,
             summary="Score a quiz and save the attempt to your history")
def submit_attempt(quiz_id: int, responses: list[QuestionResponse], db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    quiz_question_ids = {q.id for q in quiz.questions}
    if any(response.id not in quiz_question_ids for response in responses):
        raise HTTPException(400, "Answer references a question that is not part of this quiz")
    score = score_responses(db, responses)
    attempt = QuizAttempt(user_id=user.id, quiz_id=quiz.id, quiz_title=quiz.title,
                          score=score, total=len(quiz_question_ids))
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return QuizAttemptOut(id=attempt.id, quizId=attempt.quiz_id, quizTitle=attempt.quiz_title,
                          score=attempt.score, total=attempt.total, createdAt=attempt.created_at)
