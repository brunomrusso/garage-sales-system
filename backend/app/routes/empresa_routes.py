from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Empresa
from app.core.security import verify_token

router = APIRouter(prefix="/api/empresas", tags=["empresas"])


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
