from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Lote, VendaLote, Cliente
from app.schemas.schemas import LoteCreate, LoteUpdate, VendaLoteCreate, VendaLoteUpdate
import base64


def criar_lote(db: Session, lote_data: LoteCreate) -> dict:
    foto_bytes = None
    if lote_data.foto:
        foto_bytes = base64.b64decode(lote_data.foto)

    novo_lote = Lote(
        nome=lote_data.nome,
        descricao=lote_data.descricao,
        foto=foto_bytes
    )
    db.add(novo_lote)
    db.commit()
    db.refresh(novo_lote)
    return _lote_to_response(novo_lote)


def listar_lotes(db: Session) -> list:
    lotes = db.query(Lote).all()
    return [_lote_to_response(lote) for lote in lotes]


def obter_lote(db: Session, lote_id: int) -> dict:
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote não encontrado")
    return _lote_to_response(lote)


def atualizar_lote(db: Session, lote_id: int, lote_data: LoteUpdate) -> dict:
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote não encontrado")

    if lote_data.nome is not None:
        lote.nome = lote_data.nome
    if lote_data.descricao is not None:
        lote.descricao = lote_data.descricao
    if lote_data.foto is not None:
        lote.foto = base64.b64decode(lote_data.foto)

    db.commit()
    db.refresh(lote)
    return _lote_to_response(lote)


def deletar_lote(db: Session, lote_id: int) -> dict:
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote não encontrado")
    db.delete(lote)
    db.commit()
    return {"message": "Lote deletado com sucesso"}


def criar_venda(db: Session, venda_data: VendaLoteCreate) -> dict:
    lote = db.query(Lote).filter(Lote.id == venda_data.lote_id).first()
    if not lote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote não encontrado")

    cliente = db.query(Cliente).filter(Cliente.id == venda_data.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")

    comprovante_bytes = None
    if venda_data.comprovante_pagamento:
        comprovante_bytes = base64.b64decode(venda_data.comprovante_pagamento)

    nova_venda = VendaLote(
        lote_id=venda_data.lote_id,
        cliente_id=venda_data.cliente_id,
        carrinhos_comprados=venda_data.carrinhos_comprados,
        preco=venda_data.preco,
        pago=venda_data.pago,
        comprovante_pagamento=comprovante_bytes,
        data_pagamento=venda_data.data_pagamento,
        observacoes=venda_data.observacoes
    )
    db.add(nova_venda)
    db.commit()
    db.refresh(nova_venda)
    return _venda_to_response(nova_venda)


def listar_vendas_lote(db: Session, lote_id: int) -> list:
    vendas = db.query(VendaLote).filter(VendaLote.lote_id == lote_id).all()
    return [_venda_to_response(v) for v in vendas]


def listar_vendas_cliente(db: Session, cliente_id: int) -> list:
    vendas = db.query(VendaLote).filter(VendaLote.cliente_id == cliente_id).all()
    return [_venda_to_response(v) for v in vendas]


def atualizar_venda(db: Session, venda_id: int, venda_data: VendaLoteUpdate) -> dict:
    venda = db.query(VendaLote).filter(VendaLote.id == venda_id).first()
    if not venda:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venda não encontrada")

    if venda_data.carrinhos_comprados is not None:
        venda.carrinhos_comprados = venda_data.carrinhos_comprados
    if venda_data.preco is not None:
        venda.preco = venda_data.preco
    if venda_data.pago is not None:
        venda.pago = venda_data.pago
    if venda_data.comprovante_pagamento is not None:
        venda.comprovante_pagamento = base64.b64decode(venda_data.comprovante_pagamento)
    if venda_data.data_pagamento is not None:
        venda.data_pagamento = venda_data.data_pagamento
    if venda_data.observacoes is not None:
        venda.observacoes = venda_data.observacoes
    if venda_data.status_entrega is not None:
        venda.status_entrega = venda_data.status_entrega
        status_pagos = ['pago', 'chegou_eua', 'importado_brasil', 'alfandega', 'centro_distribuicao']
        if venda_data.status_entrega in status_pagos:
            venda.pago = True

    db.commit()
    db.refresh(venda)
    return _venda_to_response(venda)


def deletar_venda(db: Session, venda_id: int) -> dict:
    venda = db.query(VendaLote).filter(VendaLote.id == venda_id).first()
    if not venda:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venda não encontrada")
    db.delete(venda)
    db.commit()
    return {"message": "Venda deletada com sucesso"}


def _lote_to_response(lote: Lote) -> dict:
    return {
        "id": lote.id,
        "nome": lote.nome,
        "descricao": lote.descricao,
        "foto": base64.b64encode(lote.foto).decode() if lote.foto else None,
        "data_criacao": lote.data_criacao,
        "total_vendas": len(lote.vendas) if lote.vendas else 0
    }


def _venda_to_response(venda: VendaLote) -> dict:
    return {
        "id": venda.id,
        "lote_id": venda.lote_id,
        "cliente_id": venda.cliente_id,
        "carrinhos_comprados": venda.carrinhos_comprados,
        "preco": float(venda.preco),
        "pago": venda.pago,
        "comprovante_pagamento": base64.b64encode(venda.comprovante_pagamento).decode() if venda.comprovante_pagamento else None,
        "data_pagamento": venda.data_pagamento,
        "data_venda": venda.data_venda,
        "observacoes": venda.observacoes,
        "status_entrega": venda.status_entrega,
        "cliente_nome": venda.cliente.nome if venda.cliente else None,
        "lote_nome": venda.lote.nome if venda.lote else None,
        "lote_foto": base64.b64encode(venda.lote.foto).decode() if venda.lote and venda.lote.foto else None
    }
