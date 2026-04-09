from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import verify_admin_token
from app.models.models import Cliente, AdminPermission
from app.core.permissions import initialize_admin_permissions

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/convert-to-master/{admin_id}")
def convert_to_admin_master(
    admin_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_token)
):
    """Converter um admin para admin_master (apenas para setup inicial)"""
    
    # Verificar se é o próprio usuário ou admin_master
    current_user_id = current_user.get("user_id")
    
    if current_user.get("role") != "admin_master" and current_user_id != admin_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para fazer essa ação"
        )
    
    # Encontrar o admin
    admin = db.query(Cliente).filter(Cliente.id == admin_id).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin não encontrado"
        )
    
    if admin.role not in ['admin', 'admin_master']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário não é um admin"
        )
    
    # Converter para admin_master
    admin.role = 'admin_master'
    admin.ativo = True
    db.commit()
    db.refresh(admin)
    
    # Remover permissões antigas
    existing_perms = db.query(AdminPermission).filter(
        AdminPermission.admin_id == admin_id
    ).first()
    
    if existing_perms:
        db.delete(existing_perms)
        db.commit()
    
    # Inicializar permissões com acesso total
    initialize_admin_permissions(db, admin_id, is_master=True)
    
    return {
        "message": f"✅ {admin.nome} agora é Admin Master",
        "admin": {
            "id": admin.id,
            "nome": admin.nome,
            "email": admin.email,
            "role": admin.role,
            "ativo": admin.ativo
        }
    }


@router.post("/init-permissions/{admin_id}")
def init_admin_permissions(
    admin_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_token)
):
    """Inicializar permissões para um admin (apenas admin_master)"""
    
    # Apenas admin_master pode fazer isso
    if current_user.get("role") != "admin_master":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas Admin Master pode gerenciar permissões"
        )
    
    # Encontrar o admin
    admin = db.query(Cliente).filter(Cliente.id == admin_id).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin não encontrado"
        )
    
    if admin.role not in ['admin', 'admin_master']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário não é um admin"
        )
    
    # Remover permissões antigas
    existing_perms = db.query(AdminPermission).filter(
        AdminPermission.admin_id == admin_id
    ).first()
    
    if existing_perms:
        db.delete(existing_perms)
        db.commit()
    
    # Inicializar permissões com acesso total se for master
    is_master = admin.role == 'admin_master'
    initialize_admin_permissions(db, admin_id, is_master=is_master)
    
    return {
        "message": f"✅ Permissões inicializadas para {admin.nome}",
        "admin_id": admin_id,
        "is_master": is_master
    }
