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
    if not permission_controller.check_permission(db, admin_id, "garagem_foto_upload"):
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


@router.get("/fotos/{cliente_id}/nao-solicitadas/")
def verificar_fotos_nao_solicitadas(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    """Verifica se há fotos não solicitadas na garagem do cliente"""
    from app.models.models import FotoGaragem
    
    count = db.query(FotoGaragem).filter(
        FotoGaragem.cliente_id == cliente_id,
        FotoGaragem.solicitado == False
    ).count()
    
    return {
        "cliente_id": cliente_id,
        "fotos_nao_solicitadas": count,
        "pode_solicitar": count > 0
    }


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
