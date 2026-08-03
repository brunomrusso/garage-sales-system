from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import Empresa, Cliente, EmpresaConfig
from app.core.security import verify_token, verify_admin_token
from app.core.tenant import TenantContext

router = APIRouter(prefix="/api/empresas", tags=["empresas"])


@router.get("/publicas/listar")
def listar_empresas_publicas(
    db: Session = Depends(get_db)
):
    """Lista empresas ativas para seleção no cadastro (público)"""
    empresas = db.query(Empresa).filter(Empresa.ativa == True).all()
    
    return [
        {
            "id": e.id,
            "nome": e.nome,
            "slug": e.slug
        }
        for e in empresas
    ]


@router.get("/usuario/buscar-por-email")
def buscar_empresas_usuario(
    email: str = Query(..., description="Email do usuário"),
    db: Session = Depends(get_db)
):
    """Busca empresas onde o usuário tem cadastro (para seleção no login)"""
    # Buscar todos os clientes com este email em empresas diferentes
    clientes = db.query(Cliente).filter(
        Cliente.email == email,
        Cliente.ativo == True
    ).all()
    
    if not clientes:
        return {"empresas": [], "encontrado": False}
    
    # Coletar empresas únicas
    empresas_ids = list(set([c.empresa_id for c in clientes]))
    empresas = db.query(Empresa).filter(
        Empresa.id.in_(empresas_ids),
        Empresa.ativa == True
    ).all()
    
    return {
        "encontrado": True,
        "empresas": [
            {
                "id": e.id,
                "nome": e.nome,
                "slug": e.slug
            }
            for e in empresas
        ]
    }


@router.get("/{empresa_id}/modulos")
def obter_modulos_empresa(
    empresa_id: int,
    db: Session = Depends(get_db)
):
    """Obtém módulos habilitados para uma empresa (público)"""
    from app.controllers import empresa_controller
    return empresa_controller.obter_modulos_empresa(db, empresa_id)


@router.get("/{empresa_id}")
def obter_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Obtém dados de uma empresa pelo ID"""
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    return {
        "id": empresa.id,
        "nome": empresa.nome,
        "slug": empresa.slug,
        "ativa": empresa.ativa,
        "cor_primaria": empresa.cor_primaria
    }


DEFAULT_STATUS_LOTE = [
    "Comprado/Aguardando",
    "Chegou EUA",
    "Em Trânsito",
    "Alfandega/Tributação",
    "Importado Brasil",
    "Centro Distribuição",
    "Entregue aos Clientes",
]


@router.get("/config/status-lote")
def obter_status_lote(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_token)
):
    """Retorna as opções de status de lote para o tenant atual"""
    empresa_id = TenantContext.get_tenant_id()
    if not empresa_id:
        raise HTTPException(status_code=400, detail="Empresa não identificada")

    config = db.query(EmpresaConfig).filter(EmpresaConfig.empresa_id == empresa_id).first()
    if not config:
        return {"opcoes": DEFAULT_STATUS_LOTE}

    opcoes = config.status_lote_opcoes
    if not opcoes:
        return {"opcoes": DEFAULT_STATUS_LOTE}

    return {"opcoes": opcoes}


@router.put("/config/status-lote")
def atualizar_status_lote(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_token)
):
    """Atualiza as opções de status de lote para o tenant atual"""
    empresa_id = TenantContext.get_tenant_id()
    if not empresa_id:
        raise HTTPException(status_code=400, detail="Empresa não identificada")

    opcoes: List[str] = payload.get("opcoes", [])
    if not isinstance(opcoes, list):
        raise HTTPException(status_code=422, detail="opcoes deve ser uma lista de strings")
    opcoes = [str(o).strip() for o in opcoes if str(o).strip()]

    config = db.query(EmpresaConfig).filter(EmpresaConfig.empresa_id == empresa_id).first()
    if not config:
        config = EmpresaConfig(empresa_id=empresa_id, status_lote_opcoes=opcoes)
        db.add(config)
    else:
        config.status_lote_opcoes = opcoes

    db.commit()
    return {"opcoes": opcoes}
