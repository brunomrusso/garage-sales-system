from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Cliente, Empresa
from app.schemas.schemas import ClienteCreate, ClienteUpdate, ClienteResponse
from app.core.security import hash_password
from app.core.tenant import TenantContext


def criar_cliente(db: Session, cliente_data: ClienteCreate, empresa_id: int = None, empresa_slug: str = None) -> ClienteResponse:
    print(f"[CRIAR-CLIENTE] Email: {cliente_data.email}, empresa_slug recebido: {empresa_slug}, empresa_id recebido: {empresa_id}")
    
    # Se recebeu empresa_slug, buscar o ID
    if empresa_slug:
        empresa = db.query(Empresa).filter(Empresa.slug == empresa_slug, Empresa.ativa == True).first()
        if empresa:
            empresa_id = empresa.id
            print(f"[CRIAR-CLIENTE] Empresa encontrada por slug: {empresa.nome} (ID: {empresa_id})")
        else:
            print(f"[CRIAR-CLIENTE] ERRO: Empresa com slug '{empresa_slug}' não encontrada")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Empresa '{empresa_slug}' não encontrada"
            )
    
    # Obter empresa_id do contexto se ainda não tem
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
        print(f"[CRIAR-CLIENTE] Usando empresa_id do contexto: {empresa_id}")
    
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa não especificado"
        )
    
    print(f"[CRIAR-CLIENTE] Verificando duplicidade na empresa_id: {empresa_id}")
    
    # Verificar email duplicado (apenas na mesma empresa)
    cliente_existente = db.query(Cliente).filter(
        Cliente.email == cliente_data.email,
        Cliente.empresa_id == empresa_id
    ).first()
    
    if cliente_existente:
        print(f"[CRIAR-CLIENTE] ERRO: Email {cliente_data.email} já existe na empresa {empresa_id} (Cliente ID: {cliente_existente.id})")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado nesta empresa"
        )
    
    # Verificar telefone duplicado (se fornecido) - apenas na mesma empresa
    if cliente_data.telefone:
        telefone_existente = db.query(Cliente).filter(
            Cliente.telefone == cliente_data.telefone,
            Cliente.empresa_id == empresa_id
        ).first()
        if telefone_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Telefone já cadastrado"
            )
    
    # Se for admin, começa inativo (precisa aprovação)
    is_admin = cliente_data.role in ['admin', 'admin_master']
    
    novo_cliente = Cliente(
        empresa_id=empresa_id,
        nome=cliente_data.nome,
        email=cliente_data.email,
        senha_hash=hash_password(cliente_data.senha),
        telefone=cliente_data.telefone,
        role=cliente_data.role or 'cliente',
        ativo=not is_admin  # admins começam inativos
    )
    db.add(novo_cliente)
    db.commit()
    db.refresh(novo_cliente)
    return novo_cliente


def listar_clientes(db: Session, empresa_id: int = None) -> list[ClienteResponse]:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa não especificado"
        )
    
    return db.query(Cliente).filter(Cliente.empresa_id == empresa_id).all()


def obter_cliente(db: Session, cliente_id: int, empresa_id: int = None) -> ClienteResponse:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa não especificado"
        )
    
    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id,
        Cliente.empresa_id == empresa_id
    ).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    return cliente


def atualizar_cliente(db: Session, cliente_id: int, cliente_data: ClienteUpdate, empresa_id: int = None) -> ClienteResponse:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa não especificado"
        )
    
    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id,
        Cliente.empresa_id == empresa_id
    ).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    
    if cliente_data.nome:
        cliente.nome = cliente_data.nome
    if cliente_data.telefone:
        # Verificar se o telefone já está em uso por outro cliente (mesma empresa)
        telefone_existente = db.query(Cliente).filter(
            Cliente.telefone == cliente_data.telefone,
            Cliente.id != cliente_id,
            Cliente.empresa_id == empresa_id
        ).first()
        if telefone_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Telefone já cadastrado"
            )
        cliente.telefone = cliente_data.telefone
    
    db.commit()
    db.refresh(cliente)
    return cliente


def resetar_senha_cliente(db: Session, cliente_id: int, nova_senha: str, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id,
        Cliente.empresa_id == empresa_id
    ).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    
    cliente.senha_hash = hash_password(nova_senha)
    db.commit()
    db.refresh(cliente)
    return {"message": "Senha resetada com sucesso"}


def alterar_senha_cliente(db: Session, cliente_id: int, senha_atual: str, nova_senha: str, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id,
        Cliente.empresa_id == empresa_id
    ).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    
    # Verificar se a senha atual está correta
    from app.core.security import verify_password
    if not verify_password(senha_atual, cliente.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta"
        )
    
    cliente.senha_hash = hash_password(nova_senha)
    db.commit()
    db.refresh(cliente)
    return {"message": "Senha alterada com sucesso"}


def aprovar_admin(db: Session, cliente_id: int, empresa_id: int = None) -> dict:
    from app.core.permissions import initialize_admin_permissions
    
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()

    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id,
        Cliente.empresa_id == empresa_id
    ).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    
    if cliente.role not in ['admin', 'admin_master']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cliente não é um admin"
        )
    
    if cliente.ativo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin já está ativo"
        )
    
    cliente.ativo = True
    db.commit()
    db.refresh(cliente)
    
    # Inicializar permissões para o novo admin
    is_master = cliente.role == 'admin_master'
    initialize_admin_permissions(db, cliente_id, is_master=is_master)
    
    return {"message": "Admin aprovado com sucesso"}


def rejeitar_admin(db: Session, cliente_id: int, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()

    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id,
        Cliente.empresa_id == empresa_id
    ).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    
    if cliente.role not in ['admin', 'admin_master']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cliente não é um admin"
        )
    
    if cliente.ativo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin já está ativo"
        )
    
    db.delete(cliente)
    db.commit()
    return {"message": "Admin rejeitado e deletado com sucesso"}


def listar_admins_pendentes(db: Session, empresa_id: int = None) -> list[ClienteResponse]:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa não especificado"
        )
    
    return db.query(Cliente).filter(
        Cliente.empresa_id == empresa_id,
        Cliente.role.in_(['admin', 'admin_master']),
        Cliente.ativo == False
    ).all()


def deletar_cliente(db: Session, cliente_id: int, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa não especificado"
        )
    
    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id,
        Cliente.empresa_id == empresa_id
    ).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    
    db.delete(cliente)
    db.commit()
    return {"message": "Cliente deletado com sucesso"}
