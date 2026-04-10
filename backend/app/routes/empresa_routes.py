from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Empresa, Cliente
from app.core.security import verify_token

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
