from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import SolicitacaoCreate, SolicitacaoUpdate, SolicitacaoResponse
from app.controllers import solicitacao_controller
from app.core.security import verify_token, verify_admin_token

router = APIRouter(prefix="/api/solicitacoes", tags=["solicitacoes"])


@router.post("/", response_model=SolicitacaoResponse)
def criar_solicitacao(solicitacao_data: SolicitacaoCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return solicitacao_controller.criar_solicitacao(db, solicitacao_data)


@router.get("/", response_model=list[SolicitacaoResponse])
def listar_solicitacoes(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return solicitacao_controller.listar_solicitacoes(db)


@router.get("/cliente/{cliente_id}", response_model=list[SolicitacaoResponse])
def listar_solicitacoes_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return solicitacao_controller.listar_solicitacoes_cliente(db, cliente_id)


@router.put("/{solicitacao_id}", response_model=SolicitacaoResponse)
def atualizar_solicitacao(solicitacao_id: int, solicitacao_data: SolicitacaoUpdate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return solicitacao_controller.atualizar_solicitacao(db, solicitacao_id, solicitacao_data)
