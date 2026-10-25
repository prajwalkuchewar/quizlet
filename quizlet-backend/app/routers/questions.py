from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Question
from app.schemas import QuestionInput, QuestionOut
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


