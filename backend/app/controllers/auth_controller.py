from datetime import timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import UsuarioAdmin, Cliente
from app.schemas.schemas import LoginRequest, TokenResponse
from app.core.security import verify_password, create_access_token, hash_password
from app.core.config import settings


def login_admin(db: Session, request: LoginRequest) -> TokenResponse:
    admin = db.query(UsuarioAdmin).filter(UsuarioAdmin.email == request.email).first()
    
    if not admin or not verify_password(request.senha, admin.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(admin.id), "role": "admin"},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        token=access_token,
        user={"id": admin.id, "email": admin.email, "role": "admin"}
    )


def login_cliente(db: Session, request: LoginRequest) -> TokenResponse:
    cliente = db.query(Cliente).filter(Cliente.email == request.email).first()
    
    if not cliente or not verify_password(request.senha, cliente.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(cliente.id), "role": "cliente"},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        token=access_token,
        user={"id": cliente.id, "email": cliente.email, "role": "cliente"}
    )
