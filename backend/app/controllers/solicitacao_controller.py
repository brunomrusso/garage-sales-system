from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import SolicitacaoEnvio
from app.schemas.schemas import SolicitacaoCreate, SolicitacaoUpdate, SolicitacaoResponse


def criar_solicitacao(db: Session, solicitacao_data: SolicitacaoCreate) -> SolicitacaoResponse:
    nova_solicitacao = SolicitacaoEnvio(
        cliente_id=solicitacao_data.cliente_id,
        status="pendente"
    )
    db.add(nova_solicitacao)
    db.commit()
    db.refresh(nova_solicitacao)
    return nova_solicitacao


def listar_solicitacoes(db: Session) -> list[SolicitacaoResponse]:
    return db.query(SolicitacaoEnvio).all()


def listar_solicitacoes_cliente(db: Session, cliente_id: int) -> list[SolicitacaoResponse]:
    return db.query(SolicitacaoEnvio).filter(SolicitacaoEnvio.cliente_id == cliente_id).all()


def atualizar_solicitacao(db: Session, solicitacao_id: int, solicitacao_data: SolicitacaoUpdate) -> SolicitacaoResponse:
    solicitacao = db.query(SolicitacaoEnvio).filter(SolicitacaoEnvio.id == solicitacao_id).first()
    if not solicitacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitação não encontrada"
        )
    
    if solicitacao_data.status:
        solicitacao.status = solicitacao_data.status
    
    db.commit()
    db.refresh(solicitacao)
    return solicitacao
