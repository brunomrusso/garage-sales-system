from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import verify_admin_token
from app.controllers import permission_controller
from app.models.models import AdminPermission
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/permissions", tags=["permissions"])


class AdminPermissionUpdate(BaseModel):
    cliente_view: Optional[bool] = None
    cliente_create: Optional[bool] = None
    cliente_edit: Optional[bool] = None
    cliente_delete: Optional[bool] = None
    cliente_reset_pwd: Optional[bool] = None
    lote_view: Optional[bool] = None
    lote_create: Optional[bool] = None
    lote_edit: Optional[bool] = None
    lote_delete: Optional[bool] = None
    lote_archive: Optional[bool] = None
    venda_view: Optional[bool] = None
    venda_create: Optional[bool] = None
    venda_edit: Optional[bool] = None
    venda_delete: Optional[bool] = None
    venda_change_status: Optional[bool] = None
    venda_mark_paid: Optional[bool] = None
    admin_manage_perms: Optional[bool] = None
    admin_view_audit: Optional[bool] = None
    max_deletes_per_day: Optional[int] = None


@router.get("/admin/{admin_id}")
def get_admin_permissions(
    admin_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_token)
):
    """Obter permissões de um admin (apenas Admin Master)"""
    # Verificar se é Admin Master
    if current_user.get("role") != "admin_master":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas Admin Master pode gerenciar permissões"
        )
    
    return permission_controller.get_admin_permissions(db, admin_id)


@router.put("/admin/{admin_id}")
def update_admin_permissions(
    admin_id: int,
    permissions: AdminPermissionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_token)
):
    """Atualizar permissões de um admin (apenas Admin Master)"""
    # Verificar se é Admin Master
    if current_user.get("role") != "admin_master":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas Admin Master pode gerenciar permissões"
        )
    
    # Remover campos None
    perms_dict = {k: v for k, v in permissions.dict().items() if v is not None}
    
    return permission_controller.update_admin_permissions(db, admin_id, perms_dict)


@router.get("/audit")
def get_audit_logs(
    admin_id: Optional[int] = Query(None),
    entidade: Optional[str] = Query(None),
    acao: Optional[str] = Query(None),
    dias: int = Query(30, ge=1, le=365),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_token)
):
    """Obter logs de auditoria (Admin Master ou com permissão)"""
    # Verificar permissão
    if current_user.get("role") != "admin_master":
        # Admin normal só pode ver seus próprios logs
        admin_id = current_user.get("sub")
    
    return permission_controller.get_audit_logs(
        db,
        admin_id=admin_id,
        entidade=entidade,
        acao=acao,
        dias=dias,
        limit=limit,
        offset=offset
    )


@router.get("/activity-summary/{admin_id}")
def get_activity_summary(
    admin_id: int,
    dias: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_token)
):
    """Obter resumo de atividades de um admin (apenas Admin Master)"""
    if current_user.get("role") != "admin_master":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas Admin Master pode visualizar resumo de atividades"
        )
    
    return permission_controller.get_admin_activity_summary(db, admin_id, dias)


@router.get("/suspicious-activity/{admin_id}")
def check_suspicious_activity(
    admin_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_token)
):
    """Verificar atividades suspeitas de um admin (apenas Admin Master)"""
    if current_user.get("role") != "admin_master":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas Admin Master pode verificar atividades suspeitas"
        )
    
    return permission_controller.check_suspicious_activity(db, admin_id)
