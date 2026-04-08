from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import LoginRequest, TokenResponse
from app.controllers import auth_controller

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/admin/login", response_model=TokenResponse)
def login_admin(request: LoginRequest, db: Session = Depends(get_db)):
    return auth_controller.login_admin(db, request)


@router.post("/cliente/login", response_model=TokenResponse)
def login_cliente(request: LoginRequest, db: Session = Depends(get_db)):
    return auth_controller.login_cliente(db, request)
