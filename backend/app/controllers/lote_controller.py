from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.models import Lote, VendaLote, Cliente, TributoImportacao
from app.schemas.schemas import LoteCreate, LoteUpdate, VendaLoteCreate, VendaLoteUpdate, TributoImportacaoCreate, TributoImportacaoUpdate
from app.core.tenant import TenantContext
import base64
from datetime import datetime


def gerar_numero_lote(db: Session, empresa_id: int = None) -> str:
    """Gera próximo número sequencial de lote (#001, #002, etc.)"""
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    ultimo_lote = db.query(Lote).filter(
        Lote.empresa_id == empresa_id,
        Lote.numero_lote.like("#%")
    ).order_by(Lote.numero_lote.desc()).first()
    if not ultimo_lote:
        return "#001"
    
    # Extrair número do último lote
    ultimo_numero = int(ultimo_lote.numero_lote.replace("#", ""))
    novo_numero = ultimo_numero + 1
    return f"#{novo_numero:03d}"


def migrar_lotes_existentes(db: Session) -> dict:
    """Migra lotes existentes para numeração automática"""
    lotes = db.query(Lote).all()
    migrados = 0
    
    for i, lote in enumerate(lotes, 1):
        # Se já tem número, pular
        if lote.numero_lote and lote.numero_lote.startswith("#"):
            continue
        
        # Gerar número sequencial
        lote.numero_lote = f"#{i:03d}"
        migrados += 1
    
    db.commit()
    return {"migrados": migrados, "total": len(lotes)}


def buscar_clientes(db: Session, termo: str, empresa_id: int = None) -> list:
    """Busca clientes por nome, email ou telefone (apenas na empresa)"""
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    if not empresa_id:
        return []
    
    termo = f"%{termo.lower()}%"
    clientes = db.query(Cliente).filter(
        Cliente.empresa_id == empresa_id,
        (Cliente.nome.ilike(termo)) |
        (Cliente.email.ilike(termo)) |
        (Cliente.telefone.ilike(termo))
    ).all()
    
    return [{
        "id": c.id,
        "nome": c.nome,
        "email": c.email,
        "telefone": c.telefone
    } for c in clientes]


def criar_lote(db: Session, lote_data: LoteCreate, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa não especificado"
        )
    
    foto_bytes = None
    if lote_data.foto:
        foto_bytes = base64.b64decode(lote_data.foto)

    novo_lote = Lote(
        empresa_id=empresa_id,
        numero_lote=lote_data.numero_lote,
        nome=lote_data.nome,
        descricao=lote_data.descricao,
        foto=foto_bytes,
        status_lote=lote_data.status_lote,
        rastreio_importacao=lote_data.rastreio_importacao
    )
    db.add(novo_lote)
    db.commit()
    db.refresh(novo_lote)
    return _lote_to_response(novo_lote)


def listar_lotes(db: Session, empresa_id: int = None) -> list:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa não especificado"
        )
    
    lotes = db.query(Lote).filter(Lote.empresa_id == empresa_id).all()
    return [_lote_to_response(lote) for lote in lotes]


def obter_lote(db: Session, lote_id: int, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa não especificado"
        )
    
    lote = db.query(Lote).filter(
        Lote.id == lote_id,
        Lote.empresa_id == empresa_id
    ).first()
    if not lote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote não encontrado")
    return _lote_to_response(lote)


def atualizar_lote(db: Session, lote_id: int, lote_data: LoteUpdate, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa não especificado"
        )
    
    lote = db.query(Lote).filter(
        Lote.id == lote_id,
        Lote.empresa_id == empresa_id
    ).first()
    if not lote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote não encontrado")

    if lote_data.descricao is not None:
        lote.descricao = lote_data.descricao
    if lote_data.foto is not None:
        lote.foto = base64.b64decode(lote_data.foto)
    if lote_data.status_lote is not None:
        lote.status_lote = lote_data.status_lote
    if lote_data.arquivado is not None:
        lote.arquivado = lote_data.arquivado
    if lote_data.rastreio_importacao is not None:
        lote.rastreio_importacao = lote_data.rastreio_importacao

    db.commit()
    db.refresh(lote)
    return _lote_to_response(lote)


def listar_lotes_arquivados(db: Session, empresa_id: int = None) -> list:
    """Lista apenas lotes arquivados"""
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa não especificado"
        )
    
    lotes = db.query(Lote).filter(
        Lote.empresa_id == empresa_id,
        Lote.arquivado == True
    ).all()
    return [_lote_to_response(lote) for lote in lotes]


def desarquivar_lote(db: Session, lote_id: int, empresa_id: int = None) -> dict:
    """Desarquiva um lote"""
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa não especificado"
        )
    
    lote = db.query(Lote).filter(
        Lote.id == lote_id,
        Lote.empresa_id == empresa_id
    ).first()
    if not lote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote não encontrado")
    
    lote.arquivado = False
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
        observacoes=venda_data.observacoes,
        cotas=venda_data.cotas if venda_data.cotas is not None else 1.0
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
    if venda_data.cotas is not None:
        venda.cotas = venda_data.cotas
    if venda_data.tributo_pago is not None:
        venda.tributo_pago = venda_data.tributo_pago
    if venda_data.comprovante_tributo is not None:
        venda.comprovante_tributo = base64.b64decode(venda_data.comprovante_tributo)
    if venda_data.data_pagamento_tributo is not None:
        venda.data_pagamento_tributo = venda_data.data_pagamento_tributo
    if venda_data.status_entrega is not None:
        venda.status_entrega = venda_data.status_entrega
        status_pagos = ['pago', 'chegou_eua', 'importado_brasil', 'alfandega', 'centro_distribuicao']
        if venda_data.status_entrega in status_pagos:
            venda.pago = True

    db.commit()
    db.refresh(venda)
    
    # Verificar arquivamento automático do lote
    lote = db.query(Lote).filter(Lote.id == venda.lote_id).first()
    if lote and not lote.arquivado:
        if lote.percentual_pago == 100 and lote.percentual_entregue == 100:
            lote.arquivado = True
            db.commit()
            db.refresh(lote)
    
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
        "numero_lote": lote.numero_lote,
        "nome": lote.nome,
        "descricao": lote.descricao,
        "foto": base64.b64encode(lote.foto).decode() if lote.foto else None,
        "data_criacao": lote.data_criacao,
        "status_lote": lote.status_lote,
        "arquivado": lote.arquivado,
        "rastreio_importacao": lote.rastreio_importacao,
        "total_vendas": lote.total_vendas,
        "vendas_pagas": lote.vendas_pagas,
        "vendas_nao_pagas": lote.vendas_nao_pagas,
        "valor_total": lote.valor_total,
        "valor_pago": lote.valor_pago,
        "percentual_pago": lote.percentual_pago,
        "vendas_entregues": lote.vendas_entregues,
        "percentual_entregue": lote.percentual_entregue
    }


def _venda_to_response(venda: VendaLote) -> dict:
    # Formatar data de pagamento para DD/MM/YYYY
    data_pagamento_formatada = None
    if venda.data_pagamento:
        data_pagamento_formatada = venda.data_pagamento.strftime("%d/%m/%Y")
    
    return {
        "id": venda.id,
        "lote_id": venda.lote_id,
        "cliente_id": venda.cliente_id,
        "carrinhos_comprados": venda.carrinhos_comprados,
        "preco": float(venda.preco),
        "pago": venda.pago,
        "comprovante_pagamento": base64.b64encode(venda.comprovante_pagamento).decode() if venda.comprovante_pagamento else None,
        "data_pagamento": data_pagamento_formatada,
        "data_venda": venda.data_venda,
        "observacoes": venda.observacoes,
        "status_entrega": venda.status_entrega,
        "cliente_nome": venda.cliente.nome if venda.cliente else None,
        "lote_numero": venda.lote.numero_lote if venda.lote else None,
        "lote_foto": base64.b64encode(venda.lote.foto).decode() if venda.lote and venda.lote.foto else None,
        "cotas": float(venda.cotas) if venda.cotas else None,
        "tributo_pago": venda.tributo_pago or False,
        "comprovante_tributo": base64.b64encode(venda.comprovante_tributo).decode() if venda.comprovante_tributo else None,
        "data_pagamento_tributo": venda.data_pagamento_tributo.strftime("%d/%m/%Y") if venda.data_pagamento_tributo else None,
        "valor_tributo": None  # Calculado via endpoint de tributo
    }


# ========== TRIBUTO / COTAS ==========

def _calcular_tributo_response(db: Session, tributo: TributoImportacao) -> dict:
    """Calcula total de cotas, valor por cota e monta response completo"""
    rastreio = tributo.rastreio_importacao
    empresa_id = tributo.empresa_id
    
    # Buscar lotes vinculados
    lotes = db.query(Lote).filter(
        Lote.empresa_id == empresa_id,
        Lote.rastreio_importacao == rastreio
    ).all()
    
    lotes_ids = [l.id for l in lotes]
    
    # Buscar todas vendas dos lotes vinculados
    vendas = []
    if lotes_ids:
        vendas = db.query(VendaLote).filter(VendaLote.lote_id.in_(lotes_ids)).all()
    
    # Calcular total de cotas
    total_cotas = sum(float(v.cotas or 1.0) for v in vendas)
    
    # Valor por cota
    valor_imposto = float(tributo.valor_total_imposto)
    valor_por_cota = valor_imposto / total_cotas if total_cotas > 0 else 0
    
    # Stats
    tributos_pagos = sum(1 for v in vendas if v.tributo_pago)
    tributos_pendentes = len(vendas) - tributos_pagos
    
    lotes_info = [{
        "id": l.id,
        "numero_lote": l.numero_lote,
        "nome": l.nome,
        "total_vendas": l.total_vendas
    } for l in lotes]
    
    return {
        "id": tributo.id,
        "rastreio_importacao": tributo.rastreio_importacao,
        "valor_total_imposto": valor_imposto,
        "data_registro": tributo.data_registro,
        "observacoes": tributo.observacoes,
        "total_cotas": round(total_cotas, 2),
        "valor_por_cota": round(valor_por_cota, 2),
        "lotes_vinculados": lotes_info,
        "vendas_count": len(vendas),
        "tributos_pagos": tributos_pagos,
        "tributos_pendentes": tributos_pendentes
    }


def criar_tributo(db: Session, data: TributoImportacaoCreate, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    # Verificar se já existe tributo para este rastreio nesta empresa
    existente = db.query(TributoImportacao).filter(
        TributoImportacao.empresa_id == empresa_id,
        TributoImportacao.rastreio_importacao == data.rastreio_importacao
    ).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe um tributo para o rastreio '{data.rastreio_importacao}'"
        )
    
    tributo = TributoImportacao(
        empresa_id=empresa_id,
        rastreio_importacao=data.rastreio_importacao,
        valor_total_imposto=data.valor_total_imposto,
        observacoes=data.observacoes
    )
    db.add(tributo)
    db.commit()
    db.refresh(tributo)
    return _calcular_tributo_response(db, tributo)


def listar_tributos(db: Session, empresa_id: int = None) -> list:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    tributos = db.query(TributoImportacao).filter(
        TributoImportacao.empresa_id == empresa_id
    ).order_by(TributoImportacao.data_registro.desc()).all()
    
    return [_calcular_tributo_response(db, t) for t in tributos]


def obter_tributo(db: Session, tributo_id: int, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    tributo = db.query(TributoImportacao).filter(
        TributoImportacao.id == tributo_id,
        TributoImportacao.empresa_id == empresa_id
    ).first()
    if not tributo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tributo não encontrado")
    return _calcular_tributo_response(db, tributo)


def obter_tributo_por_rastreio(db: Session, rastreio: str, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    tributo = db.query(TributoImportacao).filter(
        TributoImportacao.empresa_id == empresa_id,
        TributoImportacao.rastreio_importacao == rastreio
    ).first()
    if not tributo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tributo não encontrado para este rastreio")
    return _calcular_tributo_response(db, tributo)


def atualizar_tributo(db: Session, tributo_id: int, data: TributoImportacaoUpdate, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    tributo = db.query(TributoImportacao).filter(
        TributoImportacao.id == tributo_id,
        TributoImportacao.empresa_id == empresa_id
    ).first()
    if not tributo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tributo não encontrado")
    
    if data.valor_total_imposto is not None:
        tributo.valor_total_imposto = data.valor_total_imposto
    if data.observacoes is not None:
        tributo.observacoes = data.observacoes
    
    db.commit()
    db.refresh(tributo)
    return _calcular_tributo_response(db, tributo)


def deletar_tributo(db: Session, tributo_id: int, empresa_id: int = None) -> dict:
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    tributo = db.query(TributoImportacao).filter(
        TributoImportacao.id == tributo_id,
        TributoImportacao.empresa_id == empresa_id
    ).first()
    if not tributo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tributo não encontrado")
    db.delete(tributo)
    db.commit()
    return {"message": "Tributo deletado com sucesso"}


def obter_vendas_tributo(db: Session, rastreio: str, empresa_id: int = None) -> list:
    """Retorna todas vendas vinculadas a um rastreio com o valor de tributo calculado"""
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    tributo = db.query(TributoImportacao).filter(
        TributoImportacao.empresa_id == empresa_id,
        TributoImportacao.rastreio_importacao == rastreio
    ).first()
    
    if not tributo:
        return []
    
    lotes = db.query(Lote).filter(
        Lote.empresa_id == empresa_id,
        Lote.rastreio_importacao == rastreio
    ).all()
    
    lotes_ids = [l.id for l in lotes]
    if not lotes_ids:
        return []
    
    vendas = db.query(VendaLote).filter(VendaLote.lote_id.in_(lotes_ids)).all()
    
    total_cotas = sum(float(v.cotas or 1.0) for v in vendas)
    valor_imposto = float(tributo.valor_total_imposto)
    valor_por_cota = valor_imposto / total_cotas if total_cotas > 0 else 0
    
    result = []
    for v in vendas:
        resp = _venda_to_response(v)
        cotas_venda = float(v.cotas or 1.0)
        resp["valor_tributo"] = round(cotas_venda * valor_por_cota, 2)
        result.append(resp)
    
    return result


def obter_tributos_cliente(db: Session, cliente_id: int, empresa_id: int = None) -> list:
    """Retorna tributos pendentes de um cliente"""
    if empresa_id is None:
        empresa_id = TenantContext.get_tenant_id()
    
    vendas = db.query(VendaLote).filter(
        VendaLote.cliente_id == cliente_id
    ).all()
    
    if not vendas:
        return []
    
    # Agrupar por rastreio
    rastreios = set()
    for v in vendas:
        if v.lote and v.lote.rastreio_importacao:
            rastreios.add(v.lote.rastreio_importacao)
    
    result = []
    for rastreio in rastreios:
        tributo = db.query(TributoImportacao).filter(
            TributoImportacao.empresa_id == empresa_id,
            TributoImportacao.rastreio_importacao == rastreio
        ).first()
        
        if not tributo:
            continue
        
        # Calcular valor por cota para este rastreio
        lotes = db.query(Lote).filter(
            Lote.empresa_id == empresa_id,
            Lote.rastreio_importacao == rastreio
        ).all()
        lotes_ids = [l.id for l in lotes]
        
        todas_vendas = db.query(VendaLote).filter(VendaLote.lote_id.in_(lotes_ids)).all() if lotes_ids else []
        total_cotas = sum(float(vv.cotas or 1.0) for vv in todas_vendas)
        valor_por_cota = float(tributo.valor_total_imposto) / total_cotas if total_cotas > 0 else 0
        
        # Filtrar vendas deste cliente neste rastreio
        vendas_cliente = [v for v in vendas if v.lote and v.lote.rastreio_importacao == rastreio]
        for v in vendas_cliente:
            cotas_venda = float(v.cotas or 1.0)
            result.append({
                "venda_id": v.id,
                "rastreio_importacao": rastreio,
                "carrinhos_comprados": v.carrinhos_comprados,
                "lote_numero": v.lote.numero_lote if v.lote else None,
                "cotas": cotas_venda,
                "valor_tributo": round(cotas_venda * valor_por_cota, 2),
                "tributo_pago": v.tributo_pago or False,
                "comprovante_tributo": base64.b64encode(v.comprovante_tributo).decode() if v.comprovante_tributo else None,
                "data_pagamento_tributo": v.data_pagamento_tributo.strftime("%d/%m/%Y") if v.data_pagamento_tributo else None
            })
    
    return result
