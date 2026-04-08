from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import FotoGaragem, SolicitacaoEnvio, Cliente, VendaLote, Lote
from app.schemas.schemas import FotoGaragemCreate, SolicitacaoEnvioCreate
import base64
import json


def adicionar_foto(db: Session, foto_data: FotoGaragemCreate) -> dict:
    cliente = db.query(Cliente).filter(Cliente.id == foto_data.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")

    nova_foto = FotoGaragem(
        cliente_id=foto_data.cliente_id,
        foto=base64.b64decode(foto_data.foto),
        descricao=foto_data.descricao
    )
    db.add(nova_foto)
    db.commit()
    db.refresh(nova_foto)
    return _foto_to_response(nova_foto)


def listar_fotos_cliente(db: Session, cliente_id: int) -> list:
    fotos = db.query(FotoGaragem).filter(FotoGaragem.cliente_id == cliente_id).order_by(FotoGaragem.data_upload.desc()).all()
    return [_foto_to_response(f) for f in fotos]


def deletar_foto(db: Session, foto_id: int) -> dict:
    foto = db.query(FotoGaragem).filter(FotoGaragem.id == foto_id).first()
    if not foto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foto não encontrada")
    db.delete(foto)
    db.commit()
    return {"message": "Foto deletada com sucesso"}


def criar_solicitacao(db: Session, data: SolicitacaoEnvioCreate) -> dict:
    cliente = db.query(Cliente).filter(Cliente.id == data.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")

    vendas_garagem = db.query(VendaLote).filter(
        VendaLote.cliente_id == data.cliente_id,
        VendaLote.status_entrega == "centro_distribuicao"
    ).all()
    ids = [v.id for v in vendas_garagem]

    nova = SolicitacaoEnvio(
        cliente_id=data.cliente_id,
        status="pendente",
        vendas_ids=json.dumps(ids) if ids else None
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return _solicitacao_to_response(nova, db)


def listar_solicitacoes_cliente(db: Session, cliente_id: int) -> list:
    sols = db.query(SolicitacaoEnvio).filter(
        SolicitacaoEnvio.cliente_id == cliente_id
    ).order_by(SolicitacaoEnvio.data_solicitacao.desc()).all()
    return [_solicitacao_to_response(s, db) for s in sols]


def listar_todas_solicitacoes(db: Session) -> list:
    sols = db.query(SolicitacaoEnvio).order_by(SolicitacaoEnvio.data_solicitacao.desc()).all()
    return [_solicitacao_to_response(s, db) for s in sols]


def atualizar_solicitacao(db: Session, sol_id: int, dados: dict) -> dict:
    sol = db.query(SolicitacaoEnvio).filter(SolicitacaoEnvio.id == sol_id).first()
    if not sol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitação não encontrada")
    if "status" in dados and dados["status"] is not None:
        sol.status = dados["status"]
        if dados["status"] == "entregue":
            db.query(VendaLote).filter(
                VendaLote.cliente_id == sol.cliente_id,
                VendaLote.status_entrega == "centro_distribuicao"
            ).update({"status_entrega": "entregue"})
    if "codigo_rastreio" in dados and dados["codigo_rastreio"] is not None:
        sol.codigo_rastreio = dados["codigo_rastreio"]
    db.commit()
    db.refresh(sol)
    return _solicitacao_to_response(sol, db)


def _foto_to_response(foto: FotoGaragem) -> dict:
    return {
        "id": foto.id,
        "cliente_id": foto.cliente_id,
        "foto": base64.b64encode(foto.foto).decode() if foto.foto else None,
        "descricao": foto.descricao,
        "data_upload": foto.data_upload
    }


def _solicitacao_to_response(sol: SolicitacaoEnvio, db: Session = None) -> dict:
    itens = []
    if sol.vendas_ids and db:
        try:
            ids = json.loads(sol.vendas_ids)
            vendas = db.query(VendaLote).filter(VendaLote.id.in_(ids)).all()
            for v in vendas:
                itens.append({
                    "id": v.id,
                    "carrinhos_comprados": v.carrinhos_comprados,
                    "preco": float(v.preco),
                    "pago": v.pago,
                    "lote_nome": v.lote.nome if v.lote else None,
                    "lote_foto": base64.b64encode(v.lote.foto).decode() if v.lote and v.lote.foto else None
                })
        except (json.JSONDecodeError, Exception):
            pass
    return {
        "id": sol.id,
        "cliente_id": sol.cliente_id,
        "data_solicitacao": sol.data_solicitacao,
        "status": sol.status,
        "codigo_rastreio": sol.codigo_rastreio,
        "cliente_nome": sol.cliente.nome if sol.cliente else None,
        "itens": itens
    }
