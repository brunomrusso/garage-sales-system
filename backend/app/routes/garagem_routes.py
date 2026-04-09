from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import FotoGaragemCreate, SolicitacaoEnvioCreate
from app.controllers import garagem_controller, permission_controller
from app.core.security import verify_token, verify_admin_token
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/garagem", tags=["garagem"])


@router.post("/fotos/")
def adicionar_foto(foto_data: FotoGaragemCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    # Verificar permissão garagem_foto_upload
    admin_id = current_user.get("user_id")
    import logging
    logger = logging.getLogger(__name__)
    
    # Debug: verificar dados do usuário
    from app.models.models import Cliente, AdminExtraPermission
    admin = db.query(Cliente).filter(Cliente.id == admin_id).first()
    extra_perms = db.query(AdminExtraPermission).filter(AdminExtraPermission.admin_id == admin_id).first()
    
    logger.info(f"[GARAGEM] Admin {admin_id} ({admin.email if admin else 'NOT FOUND'}) tentando upload")
    logger.info(f"[GARAGEM] Admin role: {admin.role if admin else 'N/A'}")
    logger.info(f"[GARAGEM] Extra perms exist: {extra_perms is not None}")
    if extra_perms:
        logger.info(f"[GARAGEM] garagem_foto_upload: {extra_perms.garagem_foto_upload}")
    
    has_perm = permission_controller.check_permission(db, admin_id, "garagem_foto_upload")
    logger.info(f"[GARAGEM] check_permission result: {has_perm}")
    
    if not has_perm:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para fazer upload de fotos"
        )
    return garagem_controller.adicionar_foto(db, foto_data)


@router.get("/fotos/{cliente_id}/")
def listar_fotos_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return garagem_controller.listar_fotos_cliente(db, cliente_id)


@router.delete("/fotos/{foto_id}/")
def deletar_foto(foto_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    # Verificar permissão garagem_edit
    admin_id = current_user.get("user_id")
    if not permission_controller.check_permission(db, admin_id, "garagem_edit"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para deletar fotos"
        )
    return garagem_controller.deletar_foto(db, foto_id)


@router.post("/solicitacoes/")
def criar_solicitacao(data: SolicitacaoEnvioCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return garagem_controller.criar_solicitacao(db, data)


@router.get("/solicitacoes/cliente/{cliente_id}/")
def listar_solicitacoes_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return garagem_controller.listar_solicitacoes_cliente(db, cliente_id)


@router.get("/solicitacoes/")
def listar_todas_solicitacoes(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    # Verificar permissão garagem_view
    admin_id = current_user.get("user_id")
    if not permission_controller.check_permission(db, admin_id, "garagem_view"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para visualizar solicitações"
        )
    return garagem_controller.listar_todas_solicitacoes(db)


class SolicitacaoUpdate(BaseModel):
    status: Optional[str] = None
    codigo_rastreio: Optional[str] = None


@router.put("/solicitacoes/{sol_id}/")
def atualizar_solicitacao(sol_id: int, data: SolicitacaoUpdate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    # Verificar permissão garagem_edit
    admin_id = current_user.get("user_id")
    if not permission_controller.check_permission(db, admin_id, "garagem_edit"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para atualizar solicitações"
        )
    return garagem_controller.atualizar_solicitacao(db, sol_id, data.model_dump(exclude_none=False))
