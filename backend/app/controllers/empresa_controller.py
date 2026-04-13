from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Empresa, EmpresaConfig, Modulo, EmpresaModulo
from app.schemas.schemas import EmpresaCreate, EmpresaResponse
from typing import List, Optional


def criar_empresa(db: Session, empresa_data: EmpresaCreate) -> Empresa:
    """Cria uma nova empresa e configuração padrão"""
    
    # Verificar se slug já existe
    existente = db.query(Empresa).filter(Empresa.slug == empresa_data.slug).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Empresa com slug '{empresa_data.slug}' já existe"
        )
    
    # Criar empresa
    nova_empresa = Empresa(
        nome=empresa_data.nome,
        slug=empresa_data.slug,
        cnpj=empresa_data.cnpj,
        ativa=empresa_data.ativa if empresa_data.ativa is not None else True,
        logo_url=empresa_data.logo_url,
        cor_primaria=empresa_data.cor_primaria or "#3B82F6"
    )
    db.add(nova_empresa)
    db.flush()  # Para obter o ID
    
    # Criar configuração padrão
    config = EmpresaConfig(
        empresa_id=nova_empresa.id,
        campos_custom_cliente=[],
        campos_custom_venda=[],
        fluxo_aprovacao={},
        webhook_url=None,
        api_key=None
    )
    db.add(config)
    
    # Habilitar todos os módulos por padrão
    modulos = db.query(Modulo).all()
    for modulo in modulos:
        em = EmpresaModulo(
            empresa_id=nova_empresa.id,
            modulo_id=modulo.id,
            habilitado=True,
            config={}
        )
        db.add(em)
    
    db.commit()
    db.refresh(nova_empresa)
    
    return nova_empresa


def listar_empresas(db: Session, ativas: Optional[bool] = None) -> List[Empresa]:
    """Lista todas as empresas"""
    query = db.query(Empresa)
    
    if ativas is not None:
        query = query.filter(Empresa.ativa == ativas)
    
    return query.all()


def obter_empresa(db: Session, empresa_id: int) -> Empresa:
    """Obtém uma empresa pelo ID"""
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    return empresa


def obter_empresa_por_slug(db: Session, slug: str) -> Empresa:
    """Obtém uma empresa pelo slug"""
    empresa = db.query(Empresa).filter(Empresa.slug == slug).first()
    
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    return empresa


def atualizar_empresa(db: Session, empresa_id: int, empresa_data) -> Empresa:
    """Atualiza uma empresa existente"""
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    # Verificar se novo slug já existe (e é diferente do atual)
    if empresa_data.slug and empresa_data.slug != empresa.slug:
        existente = db.query(Empresa).filter(Empresa.slug == empresa_data.slug).first()
        if existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Empresa com slug '{empresa_data.slug}' já existe"
            )
        empresa.slug = empresa_data.slug
    
    if empresa_data.nome:
        empresa.nome = empresa_data.nome
    if empresa_data.cnpj is not None:
        empresa.cnpj = empresa_data.cnpj
    if empresa_data.ativa is not None:
        empresa.ativa = empresa_data.ativa
    if empresa_data.logo_url is not None:
        empresa.logo_url = empresa_data.logo_url
    if empresa_data.cor_primaria:
        empresa.cor_primaria = empresa_data.cor_primaria
    
    db.commit()
    db.refresh(empresa)
    
    return empresa


def deletar_empresa(db: Session, empresa_id: int) -> dict:
    """Desativa uma empresa (soft delete)"""
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    # Soft delete - apenas desativa
    empresa.ativa = False
    db.commit()
    
    return {"message": "Empresa desativada com sucesso"}


def obter_modulos_empresa(db: Session, empresa_id: int) -> List[dict]:
    """Obtém módulos habilitados para uma empresa"""
    from app.models.models import EmpresaModulo, Modulo
    
    print(f"[MODULOS] Buscando módulos para empresa_id: {empresa_id}")
    
    # Buscar todos os módulos desta empresa
    empresa_modulos = db.query(EmpresaModulo).filter(
        EmpresaModulo.empresa_id == empresa_id
    ).all()
    
    print(f"[MODULOS] Total de registros EmpresaModulo: {len(empresa_modulos)}")
    for em in empresa_modulos:
        print(f"[MODULOS] modulo_id: {em.modulo_id}, habilitado: {em.habilitado} (type: {type(em.habilitado)})")
    
    # Filtrar apenas habilitados
    modulos = db.query(Modulo).join(
        EmpresaModulo,
        EmpresaModulo.modulo_id == Modulo.id
    ).filter(
        EmpresaModulo.empresa_id == empresa_id,
        EmpresaModulo.habilitado == True
    ).all()
    
    print(f"[MODULOS] Módulos habilitados encontrados: {len(modulos)}")
    for m in modulos:
        print(f"[MODULOS] Módulo: {m.codigo} (id: {m.id})")
    
    return [
        {
            "id": m.id,
            "codigo": m.codigo,
            "nome": m.nome,
            "descricao": m.descricao,
            "icone": m.icone,
            "habilitado": True
        }
        for m in modulos
    ]
