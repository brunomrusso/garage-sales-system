from datetime import timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import UsuarioAdmin, Cliente, Empresa, EmpresaAdmin
from app.schemas.schemas import LoginRequest, TokenResponse
from app.core.security import verify_password, create_access_token, hash_password
from app.core.config import settings


def login_admin(db: Session, request: LoginRequest, empresa_slug: str = None) -> TokenResponse:
    print(f"[LOGIN-ADMIN] Tentativa login: {request.email}, empresa_slug: {empresa_slug}")
    
    # Buscar empresa se slug fornecido
    empresa_id = None
    if empresa_slug:
        empresa = db.query(Empresa).filter(Empresa.slug == empresa_slug, Empresa.ativa == True).first()
        if empresa:
            empresa_id = empresa.id
            print(f"[LOGIN-ADMIN] Empresa encontrada: {empresa.slug} (ID: {empresa_id})")
        else:
            print(f"[LOGIN-ADMIN] Empresa não encontrada para slug: {empresa_slug}")
    
    # Primeiro tenta encontrar na tabela UsuarioAdmin (admins antigos)
    admin = db.query(UsuarioAdmin).filter(UsuarioAdmin.email == request.email).first()
    print(f"[LOGIN-ADMIN] UsuarioAdmin encontrado: {admin is not None}")
    
    if admin and verify_password(request.senha, admin.senha_hash):
        # UsuarioAdmin sao os admins originais - tratar como admin_master
        # Se não especificou empresa, usa a primeira empresa padrão
        if not empresa_id:
            empresa_padrao = db.query(Empresa).filter(Empresa.slug == "principal").first()
            empresa_id = empresa_padrao.id if empresa_padrao else None
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(admin.id), "role": "admin_master", "ativo": True, "empresa_id": empresa_id},
            expires_delta=access_token_expires
        )
        
        # Garantir que permissoes existem
        from app.models.models import AdminPermission
        from app.core.permissions import initialize_admin_permissions
        existing = db.query(AdminPermission).filter(AdminPermission.admin_id == admin.id).first()
        if not existing:
            initialize_admin_permissions(db, admin.id, is_master=True)
        
        return TokenResponse(
            token=access_token,
            user={"id": admin.id, "email": admin.email, "role": "admin_master", "empresa_id": empresa_id}
        )
    
    # Se não encontrou em UsuarioAdmin, tenta na tabela Cliente com role='admin'
    cliente_admin = db.query(Cliente).filter(
        Cliente.email == request.email,
        Cliente.role.in_(['admin', 'admin_master'])
    ).first()
    
    print(f"[LOGIN-ADMIN] Cliente admin encontrado: {cliente_admin is not None}")
    if cliente_admin:
        print(f"[LOGIN-ADMIN] Cliente ID: {cliente_admin.id}, Role: {cliente_admin.role}, Ativo: {cliente_admin.ativo}, EmpresaID: {cliente_admin.empresa_id}")
    
    if not cliente_admin or not verify_password(request.senha, cliente_admin.senha_hash):
        print(f"[LOGIN-ADMIN] Falha na autenticação: cliente não encontrado ou senha incorreta")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )
    
    # Verificar se o admin está ativo
    if not cliente_admin.ativo:
        print(f"[LOGIN-ADMIN] ERRO: Admin {cliente_admin.email} está inativo (aguardando aprovação)")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin inativo - aguardando aprovação"
        )
    
    # Verificar se admin tem acesso à empresa especificada
    if empresa_id:
        # Verificar se admin está associado à empresa
        admin_empresa = db.query(EmpresaAdmin).filter(
            EmpresaAdmin.admin_id == cliente_admin.id,
            EmpresaAdmin.empresa_id == empresa_id,
            EmpresaAdmin.ativo == True
        ).first()
        
        print(f"[LOGIN-ADMIN] Admin associado à empresa {empresa_id}: {admin_empresa is not None}")
        
        if not admin_empresa and cliente_admin.role != 'admin_master':
            print(f"[LOGIN-ADMIN] ERRO: Admin não tem acesso à empresa {empresa_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem acesso a esta empresa"
            )
    else:
        # Se não especificou empresa, buscar a primeira empresa do admin
        primeira_empresa = db.query(EmpresaAdmin).filter(
            EmpresaAdmin.admin_id == cliente_admin.id,
            EmpresaAdmin.ativo == True
        ).first()
        
        print(f"[LOGIN-ADMIN] Primeira empresa do admin: {primeira_empresa.empresa_id if primeira_empresa else 'Nenhuma'}")
        
        if primeira_empresa:
            empresa_id = primeira_empresa.empresa_id
        else:
            # Usar empresa padrão
            empresa_padrao = db.query(Empresa).filter(Empresa.slug == "principal").first()
            empresa_id = empresa_padrao.id if empresa_padrao else cliente_admin.empresa_id
            print(f"[LOGIN-ADMIN] Usando empresa padrão: {empresa_id}")
    
    # Garantir que permissões existem
    from app.models.models import AdminPermission
    from app.core.permissions import initialize_admin_permissions
    existing = db.query(AdminPermission).filter(AdminPermission.admin_id == cliente_admin.id).first()
    if not existing:
        is_master = cliente_admin.role == 'admin_master'
        initialize_admin_permissions(db, cliente_admin.id, is_master=is_master)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(cliente_admin.id), "role": cliente_admin.role, "ativo": cliente_admin.ativo, "empresa_id": empresa_id},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        token=access_token,
        user={"id": cliente_admin.id, "email": cliente_admin.email, "role": cliente_admin.role, "empresa_id": empresa_id}
    )


def login_cliente(db: Session, request: LoginRequest, empresa_slug: str = None) -> TokenResponse:
    # Buscar empresa se slug fornecido
    empresa_id = None
    if empresa_slug:
        empresa = db.query(Empresa).filter(Empresa.slug == empresa_slug, Empresa.ativa == True).first()
        if empresa:
            empresa_id = empresa.id
    
    # Buscar cliente
    query = db.query(Cliente).filter(Cliente.email == request.email)
    
    # Se especificou empresa, filtrar por ela
    if empresa_id:
        query = query.filter(Cliente.empresa_id == empresa_id)
    
    cliente = query.first()
    
    if not cliente or not verify_password(request.senha, cliente.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )
    
    # Se não tinha empresa específica, usar a do cliente encontrado
    if not empresa_id:
        empresa_id = cliente.empresa_id
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(cliente.id), "role": "cliente", "empresa_id": empresa_id},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        token=access_token,
        user={"id": cliente.id, "email": cliente.email, "role": "cliente", "empresa_id": empresa_id}
    )


def trocar_empresa_admin_master(db: Session, admin_id: int, empresa_slug: str) -> TokenResponse:
    """Para admin master: troca de empresa e gera novo token JWT"""
    from app.models.models import Cliente, Empresa, UsuarioAdmin
    
    print(f"[TROCAR-EMPRESA] Buscando admin ID: {admin_id}")
    
    # Buscar admin (tabela Cliente primeiro)
    admin = db.query(Cliente).filter(Cliente.id == admin_id, Cliente.role == 'admin_master').first()
    if not admin:
        # Se não encontrou, verificar UsuarioAdmin (admins antigos)
        admin_old = db.query(UsuarioAdmin).filter(UsuarioAdmin.id == admin_id).first()
        if admin_old and admin_old.is_master:
            print(f"[TROCAR-EMPRESA] Admin master encontrado em UsuarioAdmin: {admin_old.email}")
            # Criar objeto compatível
            class AdminCompat:
                def __init__(self, user):
                    self.id = user.id
                    self.email = user.email
                    self.role = 'admin_master'
                    self.ativo = True
            admin = AdminCompat(admin_old)
        else:
            print(f"[TROCAR-EMPRESA] Admin master não encontrado para ID: {admin_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas admin master pode trocar de empresa"
            )
    
    # Buscar nova empresa
    empresa = db.query(Empresa).filter(Empresa.slug == empresa_slug, Empresa.ativa == True).first()
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada ou inativa"
        )
    
    print(f"[TROCAR-EMPRESA] Admin {admin.email} trocando para empresa {empresa.nome} (ID: {empresa.id})")
    
    # Gerar novo token com novo empresa_id
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(admin.id), "role": admin.role, "ativo": admin.ativo, "empresa_id": empresa.id},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        token=access_token,
        user={"id": admin.id, "email": admin.email, "role": admin.role, "empresa_id": empresa.id}
    )
