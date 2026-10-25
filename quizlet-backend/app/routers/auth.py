from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, SignupRequest, ValidationRequest
from app.security import create_token, get_current_user, hash_password, verify_password
from app.services.rate_limit import limit_by_ip

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", dependencies=[Depends(limit_by_ip("signup", settings.rate_limit_signup_per_minute))])
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=409, detail="User exists already")
    user = User(firstname=body.firstname, lastname=body.lastname, username=body.username,
                password=hash_password(body.password), role=body.role)
    db.add(user)
    db.commit()
    return {"message": "User registration successful"}


@router.post("/login", dependencies=[Depends(limit_by_ip("login", settings.rate_limit_login_per_minute))])
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Login successful", "username": user.username, "firstname": user.firstname,
            "lastname": user.lastname, "role": user.role, "token": create_token(user.username)}


@router.post("/validate")
def validate(body: ValidationRequest, db: Session = Depends(get_db)):
    from jose import JWTError, jwt
    from app.config import settings

    try:
        claims = jwt.decode(body.jwt, settings.jwt_secret_key, algorithms=["HS256"])
        valid = bool(claims.get("sub") and db.query(User).filter(User.username == claims["sub"]).first())
    except JWTError:
        valid = False
    return {"message": "The User is valid user " if valid else "Invalid token", "valid": valid}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"username": user.username, "firstname": user.firstname, "lastname": user.lastname, "role": user.role}
