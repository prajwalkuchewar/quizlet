import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Question
from app.schemas import QuestionInput, QuestionOut, QuestionPublic, QuestionResponse
from app.security import require_admin

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("", response_model=list[QuestionOut])
def list_questions(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return db.query(Question).order_by(Question.id).all()


@router.post("", response_model=QuestionOut, status_code=201)
def add_question(body: QuestionInput, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    question = Question(**body.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.put("/{question_id:int}", response_model=QuestionOut)
def update_question(question_id: int, body: QuestionInput, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    question = db.get(Question, question_id)
    if not question:
        raise HTTPException(404, "Question not found")
    for key, value in body.model_dump().items():
        setattr(question, key, value)
    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id:int}")
def delete_question(question_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    question = db.get(Question, question_id)
    if not question:
        raise HTTPException(404, "Question not found")
    if question.quizzes:
        raise HTTPException(409, "Question is used by a quiz")
    db.delete(question)
    db.commit()
    return "Question Deleted"


@router.get("/category/{category}", response_model=list[QuestionOut])
def by_category(category: str, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return db.query(Question).filter(Question.category == category).order_by(Question.id).all()


@router.get("/generate", response_model=list[int], status_code=201)
def generate(category: str, numQ: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    if numQ <= 0:
        raise HTTPException(422, "numQ must be positive")
    candidates = db.query(Question.id).filter(Question.category == category).all()
    ids = [row[0] for row in candidates]
    if not ids:
        raise HTTPException(404, "No questions found for category")
    return random.sample(ids, min(numQ, len(ids)))


@router.post("/retrieve", response_model=list[QuestionPublic], status_code=201)
def retrieve(ids: list[int], db: Session = Depends(get_db), _admin=Depends(require_admin)):
    by_id = {q.id: q for q in db.query(Question).filter(Question.id.in_(ids)).all()}
    missing = [question_id for question_id in ids if question_id not in by_id]
    if missing:
        raise HTTPException(404, f"Unknown question ids: {missing}")
    return [by_id[question_id] for question_id in ids]


@router.post("/score", response_model=int)
def score(responses: list[QuestionResponse], db: Session = Depends(get_db), _admin=Depends(require_admin)):
    questions = {q.id: q for q in db.query(Question).filter(Question.id.in_([r.id for r in responses])).all()}
    if any(response.id not in questions for response in responses):
        raise HTTPException(404, "Question not found")
    return sum(questions[r.id].rightAnswer == r.response for r in responses)
