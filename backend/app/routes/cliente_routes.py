from fastapi import APIRouter, Depends, Header, Query
from typing import Optional
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import ClienteCreate, ClienteUpdate, ClienteResponse
from app.controllers import cliente_controller, permission_controller
from app.core.security import verify_token, verify_admin_token
from pydantic import BaseModel

router = APIRouter(prefix="/api/clientes", tags=["clientes"])


class SenhaReset(BaseModel):
    nova_senha: str


class SenhaAlteracao(BaseModel):
    senha_atual: str
    nova_senha: str


@router.post("/", response_model=ClienteResponse)
def criar_cliente(
    cliente_data: ClienteCreate, 
    db: Session = Depends(get_db),
    empresa_slug: Optional[str] = Query(None, description="Slug da empresa (opcional)"),
    x_empresa_slug: Optional[str] = Header(None, alias="X-Empresa-Slug")
):
    # Prioridade: Header > Query param
    slug = x_empresa_slug or empresa_slug
    return cliente_controller.criar_cliente(db, cliente_data, empresa_slug=slug)


@router.get("/", response_model=list[ClienteResponse])
def listar_clientes(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    from app.core.tenant import TenantContext
    empresa_id = TenantContext.get_tenant_id()
    return cliente_controller.listar_clientes(db, empresa_id)


@router.get("/admins-pendentes", response_model=list[ClienteResponse])
def listar_admins_pendentes(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    from app.core.tenant import TenantContext
    empresa_id = TenantContext.get_tenant_id()
    return cliente_controller.listar_admins_pendentes(db, empresa_id)


@router.get("/{cliente_id}", response_model=ClienteResponse)
def obter_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return cliente_controller.obter_cliente(db, cliente_id)


@router.put("/{cliente_id}", response_model=ClienteResponse)
def atualizar_cliente(cliente_id: int, cliente_data: ClienteUpdate, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return cliente_controller.atualizar_cliente(db, cliente_id, cliente_data)


@router.post("/{cliente_id}/resetar-senha")
def resetar_senha_cliente(cliente_id: int, senha_data: SenhaReset, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    # Verificar permissão
    admin_id = current_user.get("user_id")
    permission_controller.require_permission(db, admin_id, "cliente_reset_pwd", "resetar senha de clientes")
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
    # Verificar permissão
    admin_id = current_user.get("user_id")
    permission_controller.require_permission(db, admin_id, "cliente_delete", "deletar clientes")
    return cliente_controller.deletar_cliente(db, cliente_id)
