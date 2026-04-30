import httpx
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import EnderecoCliente, Cliente
from app.schemas.schemas import EnderecoCreate, EnderecoUpdate
from app.core.tenant import TenantContext


def validar_cep(cep: str) -> dict:
    """Valida CEP via ViaCEP e retorna dados do endereço"""
    cep_limpo = cep.replace("-", "").replace(".", "").strip()
    if len(cep_limpo) != 8 or not cep_limpo.isdigit():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CEP inválido. Deve conter 8 dígitos.")

    try:
        response = httpx.get(f"https://viacep.com.br/ws/{cep_limpo}/json/", timeout=10)
        data = response.json()
        if data.get("erro"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CEP não encontrado.")
        return {
            "cep": data.get("cep", "").replace("-", ""),
            "logradouro": data.get("logradouro", ""),
            "bairro": data.get("bairro", ""),
            "cidade": data.get("localidade", ""),
            "estado": data.get("uf", ""),
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Erro ao consultar ViaCEP. Tente novamente.")


def criar_endereco(db: Session, data: EnderecoCreate, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    if not empresa_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empresa não especificada")

    cliente = db.query(Cliente).filter(Cliente.id == data.cliente_id, Cliente.empresa_id == empresa_id).first()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")

    # Se é o primeiro endereço ou marcado como padrão, ajustar os outros
    if data.padrao:
        db.query(EnderecoCliente).filter(
            EnderecoCliente.cliente_id == data.cliente_id,
            EnderecoCliente.empresa_id == empresa_id
        ).update({"padrao": False})

    # Verificar se é o primeiro endereço — se sim, marcar como padrão automaticamente
    count = db.query(EnderecoCliente).filter(
        EnderecoCliente.cliente_id == data.cliente_id,
        EnderecoCliente.empresa_id == empresa_id
    ).count()
    is_padrao = data.padrao if data.padrao else (count == 0)

    endereco = EnderecoCliente(
        empresa_id=empresa_id,
        cliente_id=data.cliente_id,
        apelido=data.apelido,
        cep=data.cep.replace("-", "").strip(),
        logradouro=data.logradouro,
        numero=data.numero,
        complemento=data.complemento,
        bairro=data.bairro,
        cidade=data.cidade,
        estado=data.estado,
        padrao=is_padrao,
    )
    db.add(endereco)
    db.commit()
    db.refresh(endereco)
    return _endereco_to_response(endereco)


def listar_enderecos(db: Session, cliente_id: int, empresa_id: int = None) -> list:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    if not empresa_id:
        return []

    enderecos = db.query(EnderecoCliente).filter(
        EnderecoCliente.cliente_id == cliente_id,
        EnderecoCliente.empresa_id == empresa_id
    ).order_by(EnderecoCliente.padrao.desc(), EnderecoCliente.data_cadastro.desc()).all()

    return [_endereco_to_response(e) for e in enderecos]


def atualizar_endereco(db: Session, endereco_id: int, data: EnderecoUpdate, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    if not empresa_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empresa não especificada")

    endereco = db.query(EnderecoCliente).filter(
        EnderecoCliente.id == endereco_id,
        EnderecoCliente.empresa_id == empresa_id
    ).first()
    if not endereco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endereço não encontrado")

    if data.apelido is not None:
        endereco.apelido = data.apelido
    if data.cep is not None:
        endereco.cep = data.cep.replace("-", "").strip()
    if data.logradouro is not None:
        endereco.logradouro = data.logradouro
    if data.numero is not None:
        endereco.numero = data.numero
    if data.complemento is not None:
        endereco.complemento = data.complemento
    if data.bairro is not None:
        endereco.bairro = data.bairro
    if data.cidade is not None:
        endereco.cidade = data.cidade
    if data.estado is not None:
        endereco.estado = data.estado
    if data.padrao is not None and data.padrao:
        db.query(EnderecoCliente).filter(
            EnderecoCliente.cliente_id == endereco.cliente_id,
            EnderecoCliente.empresa_id == empresa_id,
            EnderecoCliente.id != endereco_id
        ).update({"padrao": False})
        endereco.padrao = True

    db.commit()
    db.refresh(endereco)
    return _endereco_to_response(endereco)


def deletar_endereco(db: Session, endereco_id: int, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    if not empresa_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empresa não especificada")

    endereco = db.query(EnderecoCliente).filter(
        EnderecoCliente.id == endereco_id,
        EnderecoCliente.empresa_id == empresa_id
    ).first()
    if not endereco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endereço não encontrado")

    was_padrao = endereco.padrao
    cliente_id = endereco.cliente_id
    db.delete(endereco)
    db.commit()

    # Se era padrão, promover o próximo endereço
    if was_padrao:
        proximo = db.query(EnderecoCliente).filter(
            EnderecoCliente.cliente_id == cliente_id,
            EnderecoCliente.empresa_id == empresa_id
        ).first()
        if proximo:
            proximo.padrao = True
            db.commit()

    return {"message": "Endereço deletado com sucesso"}


def definir_padrao(db: Session, endereco_id: int, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    if not empresa_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empresa não especificada")

    endereco = db.query(EnderecoCliente).filter(
        EnderecoCliente.id == endereco_id,
        EnderecoCliente.empresa_id == empresa_id
    ).first()
    if not endereco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endereço não encontrado")

    db.query(EnderecoCliente).filter(
        EnderecoCliente.cliente_id == endereco.cliente_id,
        EnderecoCliente.empresa_id == empresa_id,
        EnderecoCliente.id != endereco_id
    ).update({"padrao": False})
    endereco.padrao = True
    db.commit()
    db.refresh(endereco)
    return _endereco_to_response(endereco)


def _endereco_to_response(endereco: EnderecoCliente) -> dict:
    return {
        "id": endereco.id,
        "cliente_id": endereco.cliente_id,
        "apelido": endereco.apelido,
        "cep": endereco.cep,
        "logradouro": endereco.logradouro,
        "numero": endereco.numero,
        "complemento": endereco.complemento,
        "bairro": endereco.bairro,
        "cidade": endereco.cidade,
        "estado": endereco.estado,
        "padrao": endereco.padrao,
        "data_cadastro": endereco.data_cadastro,
    }
