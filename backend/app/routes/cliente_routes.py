from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import ClienteCreate, ClienteUpdate, ClienteResponse
from app.controllers import cliente_controller
from app.core.security import verify_token, verify_admin_token
from pydantic import BaseModel

router = APIRouter(prefix="/api/clientes", tags=["clientes"])


class SenhaReset(BaseModel):
    nova_senha: str


class SenhaAlteracao(BaseModel):
    senha_atual: str
    nova_senha: str


@router.post("/", response_model=ClienteResponse)
def criar_cliente(cliente_data: ClienteCreate, db: Session = Depends(get_db)):
    return cliente_controller.criar_cliente(db, cliente_data)


@router.get("/", response_model=list[ClienteResponse])
def listar_clientes(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return cliente_controller.listar_clientes(db)


@router.get("/admins-pendentes", response_model=list[ClienteResponse])
def listar_admins_pendentes(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return cliente_controller.listar_admins_pendentes(db)


@router.get("/{cliente_id}", response_model=ClienteResponse)
def obter_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return cliente_controller.obter_cliente(db, cliente_id)


@router.put("/{cliente_id}", response_model=ClienteResponse)
def atualizar_cliente(cliente_id: int, cliente_data: ClienteUpdate, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return cliente_controller.atualizar_cliente(db, cliente_id, cliente_data)


@router.post("/{cliente_id}/resetar-senha")
def resetar_senha_cliente(cliente_id: int, senha_data: SenhaReset, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return cliente_controller.resetar_senha_cliente(db, cliente_id, senha_data.nova_senha)


@router.post("/{cliente_id}/alterar-senha")
def alterar_senha_cliente(cliente_id: int, senha_data: SenhaAlteracao, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return cliente_controller.alterar_senha_cliente(db, cliente_id, senha_data.senha_atual, senha_data.nova_senha)


@router.post("/{cliente_id}/aprovar-admin")
def aprovar_admin(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return cliente_controller.aprovar_admin(db, cliente_id)


@router.post("/{cliente_id}/rejeitar-admin")
def rejeitar_admin(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return cliente_controller.rejeitar_admin(db, cliente_id)


@router.delete("/{cliente_id}")
def deletar_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return cliente_controller.deletar_cliente(db, cliente_id)
