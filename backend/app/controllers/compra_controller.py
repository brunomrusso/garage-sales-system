from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Compra
from app.schemas.schemas import CompraCreate, CompraUpdate, CompraResponse
import base64


def criar_compra(db: Session, compra_data: CompraCreate) -> CompraResponse:
    foto_bytes = None
    if compra_data.foto:
        foto_bytes = base64.b64decode(compra_data.foto)
    
    nova_compra = Compra(
        cliente_id=compra_data.cliente_id,
        descricao=compra_data.descricao,
        preco=compra_data.preco,
        foto=foto_bytes
    )
    db.add(nova_compra)
    db.commit()
    db.refresh(nova_compra)
    return nova_compra


def listar_compras_cliente(db: Session, cliente_id: int) -> list[CompraResponse]:
    return db.query(Compra).filter(Compra.cliente_id == cliente_id).all()


def obter_compra(db: Session, compra_id: int) -> dict:
    compra = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compra não encontrada"
        )
    
    response = {
        "id": compra.id,
        "cliente_id": compra.cliente_id,
        "descricao": compra.descricao,
        "preco": float(compra.preco),
        "data_compra": compra.data_compra,
        "foto": base64.b64encode(compra.foto).decode() if compra.foto else None
    }
    return response


def atualizar_compra(db: Session, compra_id: int, compra_data: CompraUpdate) -> CompraResponse:
    compra = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compra não encontrada"
        )
    
    if compra_data.descricao:
        compra.descricao = compra_data.descricao
    if compra_data.preco:
        compra.preco = compra_data.preco
    if compra_data.foto:
        compra.foto = base64.b64decode(compra_data.foto)
    
    db.commit()
    db.refresh(compra)
    return compra


def deletar_compra(db: Session, compra_id: int) -> dict:
    compra = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Compra não encontrada"
        )
    
    db.delete(compra)
    db.commit()
    return {"message": "Compra deletada com sucesso"}
