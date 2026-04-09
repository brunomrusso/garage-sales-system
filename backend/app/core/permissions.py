from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Request
from app.models.models import AdminPermission, AuditLog, Cliente
from datetime import datetime, timedelta
from typing import Optional


def get_admin_permissions(db: Session, admin_id: int) -> Optional[AdminPermission]:
    """Obter permissões de um admin"""
    return db.query(AdminPermission).filter(AdminPermission.admin_id == admin_id).first()


def initialize_admin_permissions(db: Session, admin_id: int, is_master: bool = False):
    """Inicializar permissões padrão para um novo admin"""
    existing = db.query(AdminPermission).filter(AdminPermission.admin_id == admin_id).first()
    if existing:
        return existing
    
    if is_master:
        # Admin Master tem todas as permissões
        perms = AdminPermission(
            admin_id=admin_id,
            cliente_view=True,
            cliente_create=True,
            cliente_edit=True,
            cliente_delete=True,
            cliente_reset_pwd=True,
            lote_view=True,
            lote_create=True,
            lote_edit=True,
            lote_delete=True,
            lote_archive=True,
            venda_view=True,
            venda_create=True,
            venda_edit=True,
            venda_delete=True,
            venda_change_status=True,
            venda_mark_paid=True,
            admin_manage_perms=True,
            admin_view_audit=True,
            max_deletes_per_day=0
        )
    else:
        # Admin novo tem permissões básicas apenas
        perms = AdminPermission(
            admin_id=admin_id,
            cliente_view=True,
            cliente_create=False,
            cliente_edit=False,
            cliente_delete=False,
            cliente_reset_pwd=False,
            lote_view=True,
            lote_create=False,
            lote_edit=False,
            lote_delete=False,
            lote_archive=False,
            venda_view=True,
            venda_create=False,
            venda_edit=False,
            venda_delete=False,
            venda_change_status=False,
            venda_mark_paid=False,
            admin_manage_perms=False,
            admin_view_audit=False,
            max_deletes_per_day=0
        )
    
    db.add(perms)
    db.commit()
    db.refresh(perms)
    return perms


def check_permission(db: Session, admin_id: int, permission: str) -> bool:
    """Verificar se um admin tem uma permissão específica"""
    admin = db.query(Cliente).filter(Cliente.id == admin_id).first()
    
    # Admin Master tem todas as permissões
    if admin and admin.role == 'admin_master':
        return True
    
    perms = get_admin_permissions(db, admin_id)
    if not perms:
        return False
    
    # Mapear string de permissão para atributo
    perm_map = {
        'cliente.view': 'cliente_view',
        'cliente.create': 'cliente_create',
        'cliente.edit': 'cliente_edit',
        'cliente.delete': 'cliente_delete',
        'cliente.reset_pwd': 'cliente_reset_pwd',
        'lote.view': 'lote_view',
        'lote.create': 'lote_create',
        'lote.edit': 'lote_edit',
        'lote.delete': 'lote_delete',
        'lote.archive': 'lote_archive',
        'venda.view': 'venda_view',
        'venda.create': 'venda_create',
        'venda.edit': 'venda_edit',
        'venda.delete': 'venda_delete',
        'venda.change_status': 'venda_change_status',
        'venda.mark_paid': 'venda_mark_paid',
        'admin.manage_perms': 'admin_manage_perms',
        'admin.view_audit': 'admin_view_audit',
    }
    
    attr = perm_map.get(permission)
    if not attr:
        return False
    
    return getattr(perms, attr, False)


def require_permission(permission: str):
    """Decorator para verificar permissão em rotas"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Será usado em conjunto com verify_admin_token
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def log_action(
    db: Session,
    admin_id: int,
    acao: str,
    entidade: str,
    entidade_id: Optional[int] = None,
    descricao: Optional[str] = None,
    dados_antes: Optional[dict] = None,
    dados_depois: Optional[dict] = None,
    request: Optional[Request] = None,
    resultado: str = "sucesso",
    mensagem_erro: Optional[str] = None
):
    """Registrar uma ação no log de auditoria"""
    ip_address = None
    user_agent = None
    
    if request:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
    
    audit = AuditLog(
        admin_id=admin_id,
        acao=acao,
        entidade=entidade,
        entidade_id=entidade_id,
        descricao=descricao,
        dados_antes=dados_antes,
        dados_depois=dados_depois,
        ip_address=ip_address,
        user_agent=user_agent,
        resultado=resultado,
        mensagem_erro=mensagem_erro
    )
    
    db.add(audit)
    db.commit()


def check_daily_delete_limit(db: Session, admin_id: int) -> bool:
    """Verificar se admin atingiu limite de deletions por dia"""
    perms = get_admin_permissions(db, admin_id)
    if not perms or perms.max_deletes_per_day == 0:
        return True  # Sem limite
    
    # Contar deletions de hoje
    today = datetime.utcnow().date()
    deletes_today = db.query(AuditLog).filter(
        AuditLog.admin_id == admin_id,
        AuditLog.acao.like('%.delete'),
        AuditLog.resultado == 'sucesso',
        AuditLog.data_acao >= datetime.combine(today, datetime.min.time())
    ).count()
    
    return deletes_today < perms.max_deletes_per_day


def get_audit_logs(
    db: Session,
    admin_id: Optional[int] = None,
    entidade: Optional[str] = None,
    dias: int = 30,
    limit: int = 100
):
    """Obter logs de auditoria com filtros"""
    query = db.query(AuditLog)
    
    if admin_id:
        query = query.filter(AuditLog.admin_id == admin_id)
    
    if entidade:
        query = query.filter(AuditLog.entidade == entidade)
    
    # Últimos N dias
    data_limite = datetime.utcnow() - timedelta(days=dias)
    query = query.filter(AuditLog.data_acao >= data_limite)
    
    return query.order_by(AuditLog.data_acao.desc()).limit(limit).all()
