from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Cliente
from app.schemas.schemas import ClienteCreate, ClienteUpdate, ClienteResponse
from app.core.security import hash_password


def criar_cliente(db: Session, cliente_data: ClienteCreate) -> ClienteResponse:
    # Verificar email duplicado
    cliente_existente = db.query(Cliente).filter(Cliente.email == cliente_data.email).first()
    if cliente_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    # Verificar telefone duplicado (se fornecido)
    if cliente_data.telefone:
        telefone_existente = db.query(Cliente).filter(Cliente.telefone == cliente_data.telefone).first()
        if telefone_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Telefone já cadastrado"
            )
    
    novo_cliente = Cliente(
        nome=cliente_data.nome,
        email=cliente_data.email,
        senha_hash=hash_password(cliente_data.senha),
        telefone=cliente_data.telefone
    )
    db.add(novo_cliente)
    db.commit()
    db.refresh(novo_cliente)
    return novo_cliente


def listar_clientes(db: Session) -> list[ClienteResponse]:
    return db.query(Cliente).all()


def obter_cliente(db: Session, cliente_id: int) -> ClienteResponse:
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    return cliente


def atualizar_cliente(db: Session, cliente_id: int, cliente_data: ClienteUpdate) -> ClienteResponse:
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    
    if cliente_data.nome:
        cliente.nome = cliente_data.nome
    if cliente_data.telefone:
        # Verificar se o telefone já está em uso por outro cliente
        telefone_existente = db.query(Cliente).filter(
            Cliente.telefone == cliente_data.telefone,
            Cliente.id != cliente_id
        ).first()
        if telefone_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Telefone já cadastrado"
            )
        cliente.telefone = cliente_data.telefone
    
    db.commit()
    db.refresh(cliente)
    return cliente


def deletar_cliente(db: Session, cliente_id: int) -> dict:
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    
    db.delete(cliente)
    db.commit()
    return {"message": "Cliente deletado com sucesso"}
