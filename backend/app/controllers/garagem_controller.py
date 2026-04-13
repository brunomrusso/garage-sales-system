from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import FotoGaragem, SolicitacaoEnvio, Cliente, VendaLote, Lote
from app.schemas.schemas import FotoGaragemCreate, SolicitacaoEnvioCreate
from app.core.tenant import TenantContext
from datetime import datetime
import base64
import json


def adicionar_foto(db: Session, foto_data: FotoGaragemCreate, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    cliente = db.query(Cliente).filter(
        Cliente.id == foto_data.cliente_id,
        Cliente.empresa_id == empresa_id
    ).first()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")

    nova_foto = FotoGaragem(
        empresa_id=empresa_id,
        cliente_id=foto_data.cliente_id,
        foto=base64.b64decode(foto_data.foto),
        descricao=foto_data.descricao
    )
    db.add(nova_foto)
    db.commit()
    db.refresh(nova_foto)
    return _foto_to_response(nova_foto)


def listar_fotos_cliente(db: Session, cliente_id: int, empresa_id: int = None) -> list:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa não especificado"
        )
    
    fotos = db.query(FotoGaragem).filter(
        FotoGaragem.empresa_id == empresa_id,
        FotoGaragem.cliente_id == cliente_id
    ).order_by(FotoGaragem.data_upload.desc()).all()
    return [_foto_to_response(f) for f in fotos]


def deletar_foto(db: Session, foto_id: int, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa não especificado"
        )
    
    foto = db.query(FotoGaragem).filter(
        FotoGaragem.id == foto_id,
        FotoGaragem.empresa_id == empresa_id
    ).first()
    if not foto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foto não encontrada")
    db.delete(foto)
    db.commit()
    return {"message": "Foto deletada com sucesso"}


def marcar_fotos_como_solicitadas(db: Session, cliente_id: int, empresa_id: int = None) -> int:
    """Marca todas as fotos não solicitadas da garagem como solicitadas"""
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    if not empresa_id:
        return 0
    
    fotos_nao_solicitadas = db.query(FotoGaragem).filter(
        FotoGaragem.empresa_id == empresa_id,
        FotoGaragem.cliente_id == cliente_id,
        FotoGaragem.solicitado == False
    ).all()
    
    count = 0
    for foto in fotos_nao_solicitadas:
        foto.solicitado = True
        foto.data_solicitacao = datetime.utcnow()
        count += 1
    
    db.commit()
    return count


def criar_solicitacao(db: Session, data: SolicitacaoEnvioCreate) -> dict:
    cliente = db.query(Cliente).filter(Cliente.id == data.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")

    # Verificar se existe solicitação pendente
    solicitacao_pendente = db.query(SolicitacaoEnvio).filter(
        SolicitacaoEnvio.cliente_id == data.cliente_id,
        SolicitacaoEnvio.status == "pendente"
    ).first()

    # Obter todos os itens na garagem
    vendas_garagem = db.query(VendaLote).filter(
        VendaLote.cliente_id == data.cliente_id,
        VendaLote.status_entrega == "centro_distribuicao"
    ).all()
    
    if solicitacao_pendente:
        # Se existe solicitação pendente, incluir todos os itens
        ids = [v.id for v in vendas_garagem]
    else:
        # Se não existe solicitação pendente, incluir apenas itens não enviados anteriormente
        solicitacoes_anteriores = db.query(SolicitacaoEnvio).filter(
            SolicitacaoEnvio.cliente_id == data.cliente_id,
            SolicitacaoEnvio.status.in_(["enviado", "entregue"])
        ).all()
        
        if solicitacoes_anteriores:
            # Obter IDs de itens já enviados anteriormente
            itens_enviados_anteriormente = set()
            for sol in solicitacoes_anteriores:
                if sol.vendas_ids:
                    try:
                        itens_enviados_anteriormente.update(json.loads(sol.vendas_ids))
                    except:
                        continue
            
            # Incluir apenas itens que NÃO foram enviados anteriormente
            ids = [v.id for v in vendas_garagem if v.id not in itens_enviados_anteriormente]
        else:
            # Primeira vez solicitando, incluir todos os itens
            ids = [v.id for v in vendas_garagem]

    # Marcar todas as fotos da garagem como solicitadas
    fotos_solicitadas = marcar_fotos_como_solicitadas(db, data.cliente_id)

    if solicitacao_pendente:
        # Se existe solicitação pendente, substituir com todos os itens
        solicitacao_pendente.vendas_ids = json.dumps(ids) if ids else None
        solicitacao_pendente.data_solicitacao = datetime.utcnow()
        db.commit()
        db.refresh(solicitacao_pendente)
        
        response = _solicitacao_to_response(solicitacao_pendente, db)
        response["acao"] = "substituida"
        response["fotos_garagem_solicitadas"] = fotos_solicitadas
        return response
    else:
        # Se não existe solicitação pendente, criar nova
        nova = SolicitacaoEnvio(
            cliente_id=data.cliente_id,
            status="pendente",
            vendas_ids=json.dumps(ids) if ids else None
        )
        db.add(nova)
        db.commit()
        db.refresh(nova)
        
        response = _solicitacao_to_response(nova, db)
        response["acao"] = "criada"
        response["fotos_garagem_solicitadas"] = fotos_solicitadas
        return response


def listar_solicitacoes_cliente(db: Session, cliente_id: int, empresa_id: int = None) -> list:
    from app.core.tenant import TenantContext
    
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    print(f"[GARAGEM] Listando solicitações - cliente_id: {cliente_id}, empresa_id: {empresa_id}")
    
    sols = db.query(SolicitacaoEnvio).filter(
        SolicitacaoEnvio.cliente_id == cliente_id,
        SolicitacaoEnvio.empresa_id == empresa_id
    ).order_by(SolicitacaoEnvio.data_solicitacao.desc()).all()
    
    print(f"[GARAGEM] Solicitações encontradas: {len(sols)}")
    for sol in sols:
        print(f"[GARAGEM] Solicitação ID: {sol.id}, empresa_id: {sol.empresa_id}, cliente_id: {sol.cliente_id}")
    
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
        "data_upload": foto.data_upload,
        "solicitado": foto.solicitado,
        "data_solicitacao": foto.data_solicitacao
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
