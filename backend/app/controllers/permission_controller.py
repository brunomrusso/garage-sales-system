from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import AdminPermission, Cliente, AuditLog
from app.core.permissions import initialize_admin_permissions, log_action
from typing import Optional
from datetime import datetime, timedelta


def get_admin_permissions(db: Session, admin_id: int) -> AdminPermission:
    """Obter permissões de um admin"""
    perms = db.query(AdminPermission).filter(AdminPermission.admin_id == admin_id).first()
    if not perms:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permissões não encontradas para este admin"
        )
    return perms


def update_admin_permissions(db: Session, admin_id: int, permissions_data: dict) -> AdminPermission:
    """Atualizar permissões de um admin"""
    # Verificar se admin existe
    admin = db.query(Cliente).filter(Cliente.id == admin_id).first()
    if not admin or admin.role not in ['admin', 'admin_master']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin não encontrado"
        )
    
    perms = db.query(AdminPermission).filter(AdminPermission.admin_id == admin_id).first()
    if not perms:
        perms = initialize_admin_permissions(db, admin_id, is_master=False)
    
    # Atualizar apenas os campos fornecidos
    for key, value in permissions_data.items():
        if hasattr(perms, key):
            setattr(perms, key, value)
    
    perms.data_atualizacao = datetime.utcnow()
    db.commit()
    db.refresh(perms)
    return perms


def get_audit_logs(
    db: Session,
    admin_id: Optional[int] = None,
    entidade: Optional[str] = None,
    acao: Optional[str] = None,
    dias: int = 30,
    limit: int = 100,
    offset: int = 0
):
    """Obter logs de auditoria com filtros"""
    query = db.query(AuditLog)
    
    if admin_id:
        query = query.filter(AuditLog.admin_id == admin_id)
    
    if entidade:
        query = query.filter(AuditLog.entidade == entidade)
    
    if acao:
        query = query.filter(AuditLog.acao == acao)
    
    # Últimos N dias
    data_limite = datetime.utcnow() - timedelta(days=dias)
    query = query.filter(AuditLog.data_acao >= data_limite)
    
    total = query.count()
    logs = query.order_by(AuditLog.data_acao.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "logs": logs,
        "offset": offset,
        "limit": limit
    }


def get_admin_activity_summary(db: Session, admin_id: int, dias: int = 30) -> dict:
    """Obter resumo de atividades de um admin"""
    data_limite = datetime.utcnow() - timedelta(days=dias)
    
    query = db.query(AuditLog).filter(
        AuditLog.admin_id == admin_id,
        AuditLog.data_acao >= data_limite
    )
    
    total_actions = query.count()
    successful_actions = query.filter(AuditLog.resultado == 'sucesso').count()
    failed_actions = query.filter(AuditLog.resultado == 'erro').count()
    
    # Contar por tipo de ação
    actions_by_type = {}
    for log in query.all():
        if log.acao not in actions_by_type:
            actions_by_type[log.acao] = 0
        actions_by_type[log.acao] += 1
    
    # Contar deletions
    deletions = query.filter(AuditLog.acao.like('%.delete')).count()
    
    return {
        "admin_id": admin_id,
        "periodo_dias": dias,
        "total_actions": total_actions,
        "successful_actions": successful_actions,
        "failed_actions": failed_actions,
        "deletions": deletions,
        "actions_by_type": actions_by_type
    }


def check_suspicious_activity(db: Session, admin_id: int) -> dict:
    """Verificar atividades suspeitas de um admin"""
    # Últimas 24 horas
    data_limite = datetime.utcnow() - timedelta(hours=24)
    
    logs = db.query(AuditLog).filter(
        AuditLog.admin_id == admin_id,
        AuditLog.data_acao >= data_limite
    ).all()
    
    suspicious = {
        "multiple_deletions": 0,
        "multiple_failures": 0,
        "unusual_ips": set(),
        "alerts": []
    }
    
    # Contar deletions
    deletions = [l for l in logs if l.acao.endswith('.delete')]
    if len(deletions) > 5:
        suspicious["multiple_deletions"] = len(deletions)
        suspicious["alerts"].append(f"Múltiplas deletions detectadas: {len(deletions)} em 24h")
    
    # Contar falhas
    failures = [l for l in logs if l.resultado == 'erro']
    if len(failures) > 10:
        suspicious["multiple_failures"] = len(failures)
        suspicious["alerts"].append(f"Múltiplas falhas detectadas: {len(failures)} em 24h")
    
    # IPs diferentes
    ips = set(l.ip_address for l in logs if l.ip_address)
    if len(ips) > 3:
        suspicious["unusual_ips"] = list(ips)
        suspicious["alerts"].append(f"Múltiplos IPs detectados: {len(ips)} IPs diferentes")
    
    return suspicious
