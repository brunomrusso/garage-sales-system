from fastapi import APIRouter, Depends, Header, Query, status
from typing import Optional
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import LoginRequest, TokenResponse
from app.controllers import auth_controller
from app.core.security import verify_token

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


@router.post("/admin/trocar-empresa", response_model=TokenResponse)
def trocar_empresa_admin_master(
    empresa_slug: str = Query(..., description="Slug da nova empresa"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Para admin master: troca de empresa e gera novo token JWT"""
    # verify_token retorna {"user_id": ..., "role": ..., "ativo": ...}
    return auth_controller.trocar_empresa_admin_master(db, current_user["user_id"], empresa_slug)
