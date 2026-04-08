from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Pagamento
from app.schemas.schemas import PagamentoCreate, PagamentoUpdate, PagamentoResponse


def criar_pagamento(db: Session, pagamento_data: PagamentoCreate) -> PagamentoResponse:
    novo_pagamento = Pagamento(
        cliente_id=pagamento_data.cliente_id,
        valor=pagamento_data.valor,
        status=pagamento_data.status
    )
    db.add(novo_pagamento)
    db.commit()
    db.refresh(novo_pagamento)
    return novo_pagamento


def listar_pagamentos_cliente(db: Session, cliente_id: int) -> list[PagamentoResponse]:
    return db.query(Pagamento).filter(Pagamento.cliente_id == cliente_id).all()


def obter_pagamento(db: Session, pagamento_id: int) -> PagamentoResponse:
    pagamento = db.query(Pagamento).filter(Pagamento.id == pagamento_id).first()
    if not pagamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pagamento não encontrado"
        )
    return pagamento


def atualizar_pagamento(db: Session, pagamento_id: int, pagamento_data: PagamentoUpdate) -> PagamentoResponse:
    pagamento = db.query(Pagamento).filter(Pagamento.id == pagamento_id).first()
    if not pagamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pagamento não encontrado"
        )
    
    if pagamento_data.valor:
        pagamento.valor = pagamento_data.valor
    if pagamento_data.status:
        pagamento.status = pagamento_data.status
    
    db.commit()
    db.refresh(pagamento)
    return pagamento


def deletar_pagamento(db: Session, pagamento_id: int) -> dict:
    pagamento = db.query(Pagamento).filter(Pagamento.id == pagamento_id).first()
    if not pagamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pagamento não encontrado"
        )
    
    db.delete(pagamento)
    db.commit()
    return {"message": "Pagamento deletado com sucesso"}
