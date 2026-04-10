"""
Sistema de Multi-Tenant - Contexto e Middleware
"""
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import Request, HTTPException, Depends
from app.db.database import get_db
from app.models.models import Empresa, EmpresaModulo, Modulo


class TenantContext:
    """Contexto thread-local para armazenar informações do tenant atual"""
    _empresa_id: Optional[int] = None
    _empresa_slug: Optional[str] = None
    _modulos_habilitados: List[str] = []
    
    @classmethod
    def set_tenant(cls, empresa_id: int, slug: str, modulos: List[str] = None):
        cls._empresa_id = empresa_id
        cls._empresa_slug = slug
        cls._modulos_habilitados = modulos or []
    
    @classmethod
    def get_tenant_id(cls) -> Optional[int]:
        # Fallback para empresa padrão (ID=1) se não houver tenant definido
        # Isso garante compatibilidade durante migração e para requisições sem header
        if cls._empresa_id is None:
            return 1  # Empresa padrão
        return cls._empresa_id
    
    @classmethod
    def get_tenant_slug(cls) -> Optional[str]:
        return cls._empresa_slug
    
    @classmethod
    def get_modulos_habilitados(cls) -> List[str]:
        return cls._modulos_habilitados
    
    @classmethod
    def is_modulo_habilitado(cls, modulo_codigo: str) -> bool:
        return modulo_codigo in cls._modulos_habilitados
    
    @classmethod
    def clear(cls):
        cls._empresa_id = None
        cls._empresa_slug = None
        cls._modulos_habilitados = []


class TenantService:
    """Serviço para operações relacionadas a tenants"""
    
    @staticmethod
    def get_empresa_by_slug(db: Session, slug: str) -> Optional[Empresa]:
        """Busca empresa pelo slug"""
        return db.query(Empresa).filter(
            Empresa.slug == slug,
            Empresa.ativa == True
        ).first()
    
    @staticmethod
    def get_empresa_by_id(db: Session, empresa_id: int) -> Optional[Empresa]:
        """Busca empresa pelo ID"""
        return db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.ativa == True
        ).first()
    
    @staticmethod
    def get_modulos_empresa(db: Session, empresa_id: int) -> List[str]:
        """Retorna lista de códigos de módulos habilitados para a empresa"""
        modulos = db.query(EmpresaModulo).join(Modulo).filter(
            EmpresaModulo.empresa_id == empresa_id,
            EmpresaModulo.habilitado == True
        ).all()
        return [m.modulo.codigo for m in modulos]
    
    @staticmethod
    def is_modulo_habilitado(db: Session, empresa_id: int, modulo_codigo: str) -> bool:
        """Verifica se um módulo está habilitado para a empresa"""
        modulo = db.query(EmpresaModulo).join(Modulo).filter(
            EmpresaModulo.empresa_id == empresa_id,
            Modulo.codigo == modulo_codigo,
            EmpresaModulo.habilitado == True
        ).first()
        return modulo is not None


async def tenant_middleware(request: Request, call_next):
    """
    Middleware para extrair tenant da requisição
    Prioridade:
    1. Header X-Empresa-ID ou X-Empresa-Slug
    2. Subdomain (empresa1.garagesales.com)
    3. Query param ?empresa=slug
    """
    from app.db.database import SessionLocal
    
    # Reset contexto
    TenantContext.clear()
    
    db = SessionLocal()
    try:
        empresa = None
        
        # 1. Tentar pelo header
        empresa_id = request.headers.get("X-Empresa-ID")
        empresa_slug = request.headers.get("X-Empresa-Slug")
        
        if empresa_id:
            try:
                empresa = TenantService.get_empresa_by_id(db, int(empresa_id))
            except ValueError:
                pass
        
        if not empresa and empresa_slug:
            empresa = TenantService.get_empresa_by_slug(db, empresa_slug)
        
        # 2. Tentar pelo subdomain
        if not empresa:
            host = request.headers.get("host", "")
            if host and "." in host:
                # Remover porta se existir
                host = host.split(":")[0]
                parts = host.split(".")
                if len(parts) >= 3:  # sub.dominio.com
                    subdomain = parts[0]
                    empresa = TenantService.get_empresa_by_slug(db, subdomain)
        
        # 3. Tentar pelo query param
        if not empresa:
            empresa_slug = request.query_params.get("empresa")
            if empresa_slug:
                empresa = TenantService.get_empresa_by_slug(db, empresa_slug)
        
        # Se encontrou empresa, carregar módulos
        if empresa:
            modulos = TenantService.get_modulos_empresa(db, empresa.id)
            TenantContext.set_tenant(empresa.id, empresa.slug, modulos)
        
    finally:
        db.close()
    
    response = await call_next(request)
    return response


def get_current_tenant(db: Session = Depends(get_db)) -> Empresa:
    """Dependency para injetar tenant nas rotas"""
    tenant_id = TenantContext.get_tenant_id()
    
    if not tenant_id:
        raise HTTPException(
            status_code=400,
            detail="Empresa (tenant) não especificado. Use header X-Empresa-ID ou X-Empresa-Slug"
        )
    
    empresa = TenantService.get_empresa_by_id(db, tenant_id)
    if not empresa:
        raise HTTPException(
            status_code=404,
            detail="Empresa não encontrada ou inativa"
        )
    
    return empresa


def requer_modulo(modulo_codigo: str):
    """Dependency factory para verificar se módulo está habilitado"""
    def check_modulo(db: Session = Depends(get_db)):
        tenant_id = TenantContext.get_tenant_id()
        
        if not tenant_id:
            raise HTTPException(
                status_code=400,
                detail="Empresa (tenant) não especificado"
            )
        
        if not TenantService.is_modulo_habilitado(db, tenant_id, modulo_codigo):
            raise HTTPException(
                status_code=403,
                detail=f"Módulo '{modulo_codigo}' não habilitado para esta empresa"
            )
        
        return True
    
    return check_modulo
