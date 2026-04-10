from fastapi import APIRouter, Depends, Header, Query
from typing import Optional
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import LoginRequest, TokenResponse
from app.controllers import auth_controller

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/admin/login", response_model=TokenResponse)
def login_admin(
    request: LoginRequest, 
    db: Session = Depends(get_db),
    empresa_slug: Optional[str] = Query(None, description="Slug da empresa (opcional)"),
    x_empresa_slug: Optional[str] = Header(None, alias="X-Empresa-Slug")
):
    # Prioridade: Header > Query param
    slug = x_empresa_slug or empresa_slug
    return auth_controller.login_admin(db, request, empresa_slug=slug)


@router.post("/cliente/login", response_model=TokenResponse)
def login_cliente(
    request: LoginRequest, 
    db: Session = Depends(get_db),
    empresa_slug: Optional[str] = Query(None, description="Slug da empresa (opcional)"),
    x_empresa_slug: Optional[str] = Header(None, alias="X-Empresa-Slug")
):
    # Prioridade: Header > Query param
    slug = x_empresa_slug or empresa_slug
    return auth_controller.login_cliente(db, request, empresa_slug=slug)
