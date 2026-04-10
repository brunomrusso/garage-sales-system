from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import FotoGaragemCreate, SolicitacaoEnvioCreate
from app.controllers import garagem_controller, permission_controller
from app.core.security import verify_token, verify_admin_token
from pydantic import BaseModel
from typing import Optional
import json

router = APIRouter(prefix="/api/garagem", tags=["garagem"])


@router.post("/fotos/")
def adicionar_foto(foto_data: FotoGaragemCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    # Verificar permissão garagem_foto_upload
    admin_id = current_user.get("user_id")
    if not permission_controller.check_permission(db, admin_id, "garagem_foto_upload"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para fazer upload de fotos"
        )
    return garagem_controller.adicionar_foto(db, foto_data)


@router.get("/fotos/{cliente_id}/")
def listar_fotos_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return garagem_controller.listar_fotos_cliente(db, cliente_id)


@router.delete("/fotos/{foto_id}/")
def deletar_foto(foto_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    # Verificar permissão garagem_edit
    admin_id = current_user.get("user_id")
    if not permission_controller.check_permission(db, admin_id, "garagem_edit"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para deletar fotos"
        )
    return garagem_controller.deletar_foto(db, foto_id)


@router.post("/solicitacoes/")
def criar_solicitacao(data: SolicitacaoEnvioCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return garagem_controller.criar_solicitacao(db, data)


@router.get("/solicitacoes/cliente/{cliente_id}/")
def listar_solicitacoes_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return garagem_controller.listar_solicitacoes_cliente(db, cliente_id)


@router.get("/solicitacoes/")
def listar_todas_solicitacoes(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    # Verificar permissão garagem_view
    admin_id = current_user.get("user_id")
    if not permission_controller.check_permission(db, admin_id, "garagem_view"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para visualizar solicitações"
        )
    return garagem_controller.listar_todas_solicitacoes(db)


class SolicitacaoUpdate(BaseModel):
    status: Optional[str] = None
    codigo_rastreio: Optional[str] = None


@router.get("/fotos/{cliente_id}/nao-solicitadas/")
def verificar_fotos_nao_solicitadas(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    """Verifica se há fotos não solicitadas na garagem do cliente e se pode solicitar envio"""
    from app.models.models import FotoGaragem, SolicitacaoEnvio, VendaLote
    
    # Contar fotos não solicitadas (mantido para compatibilidade)
    fotos_nao_solicitadas = db.query(FotoGaragem).filter(
        FotoGaragem.cliente_id == cliente_id,
        FotoGaragem.solicitado == False
    ).count()
    
    # Verificar se existe solicitação pendente
    solicitacao_pendente = db.query(SolicitacaoEnvio).filter(
        SolicitacaoEnvio.cliente_id == cliente_id,
        SolicitacaoEnvio.status == "pendente"
    ).first()
    
    # Obter itens atualmente na garagem
    itens_garagem = db.query(VendaLote).filter(
        VendaLote.cliente_id == cliente_id,
        VendaLote.status_entrega == "centro_distribuicao"
    ).all()
    itens_garagem_ids = {v.id for v in itens_garagem}
    
    # DEBUG LOGS
    print(f"[DEBUG] Cliente {cliente_id}:")
    print(f"  - Fotos não solicitadas: {fotos_nao_solicitadas}")
    print(f"  - Tem solicitação pendente: {solicitacao_pendente is not None}")
    print(f"  - Itens na garagem: {len(itens_garagem)}")
    print(f"  - IDs itens garagem: {itens_garagem_ids}")
    
    pode_solicitar = False
    motivo = ""
    
    # Definir solicitacoes_anteriores em ambos os casos para uso posterior
    solicitacoes_anteriores = []
    
    if solicitacao_pendente:
        # Se existe solicitação pendente, verificar se há novos itens
        if solicitacao_pendente.vendas_ids:
            try:
                ids_solicitacao = set(json.loads(solicitacao_pendente.vendas_ids))
                print(f"  - IDs na solicitação: {ids_solicitacao}")
            except:
                ids_solicitacao = set()
                print(f"  - Erro ao parsear vendas_ids")
        else:
            ids_solicitacao = set()
            print(f"  - Sem vendas_ids na solicitação")
        
        novos_itens = itens_garagem_ids - ids_solicitacao
        print(f"  - Novos itens: {novos_itens}")
        
        # Buscar TODAS as solicitações anteriores para marcar itens como ja_enviado
        solicitacoes_anteriores = db.query(SolicitacaoEnvio).filter(
            SolicitacaoEnvio.cliente_id == cliente_id,
            SolicitacaoEnvio.status.in_(["enviado", "entregue", "aguardando", "pendente"])
        ).all()
        
        print(f"  - Query executada para itens_status: cliente_id={cliente_id}, status in ['enviado', 'entregue', 'aguardando', 'pendente']")
        print(f"  - Solicitações encontradas: {len(solicitacoes_anteriores)}")
        for sol in solicitacoes_anteriores:
            print(f"    - Solicitação #{sol.id}: status='{sol.status}', itens={sol.vendas_ids}")
        
        # Lógica correta: só pode solicitar se há NOVOS itens
        if novos_itens:
            pode_solicitar = True
            motivo = f"Há {len(novos_itens)} novos itens na garagem"
        else:
            pode_solicitar = False
            motivo = "Todos os itens já estão na solicitação pendente"
    else:
        # Se não existe solicitação pendente, verificar se há solicitações anteriores
        solicitacoes_anteriores = db.query(SolicitacaoEnvio).filter(
            SolicitacaoEnvio.cliente_id == cliente_id,
            SolicitacaoEnvio.status.in_(["enviado", "entregue", "aguardando", "pendente"])
        ).all()
        
        print(f"  - Query executada: cliente_id={cliente_id}, status in ['enviado', 'entregue', 'aguardando', 'pendente']")
        print(f"  - Solicitações encontradas: {len(solicitacoes_anteriores)}")
        for sol in solicitacoes_anteriores:
            print(f"    - Solicitação #{sol.id}: status='{sol.status}', itens={sol.vendas_ids}")
        
        if solicitacoes_anteriores:
            # Verificar itens já enviados anteriormente
            itens_enviados_anteriormente = set()
            for sol in solicitacoes_anteriores:
                if sol.vendas_ids:
                    try:
                        itens_enviados_anteriormente.update(json.loads(sol.vendas_ids))
                    except:
                        continue
            
            print(f"  - Solicitações anteriores: {len(solicitacoes_anteriores)}")
            print(f"  - Itens enviados anteriormente: {itens_enviados_anteriormente}")
            
            # Verificar se há itens na garagem que NÃO foram enviados antes
            itens_novos_na_garagem = itens_garagem_ids - itens_enviados_anteriormente
            print(f"  - Itens novos na garagem: {itens_novos_na_garagem}")
            
            if itens_novos_na_garagem:
                pode_solicitar = True
                motivo = f"Há {len(itens_novos_na_garagem)} itens não enviados anteriormente"
            else:
                pode_solicitar = False
                motivo = "Todos os itens já foram enviados anteriormente"
        else:
            # Primeira vez solicitando, pode solicitar se há itens
            pode_solicitar = len(itens_garagem) > 0
            motivo = "Pode solicitar envio" if pode_solicitar else "Não há itens na garagem"
    
    print(f"  - Pode solicitar: {pode_solicitar}")
    print(f"  - Motivo: {motivo}")
    
    # Criar mapa de status dos itens na garagem
    itens_status = {}
    for item in itens_garagem:
        itens_status[item.id] = {
            "id": item.id,
            "preco": float(item.preco),
            "carrinhos_comprados": item.carrinhos_comprados,
            "status_entrega": item.status_entrega,
            "ja_enviado": False
        }
    
    print(f"  - Itens status inicial: {[(k, v['ja_enviado']) for k, v in itens_status.items()]}")
    
    # Marcar itens que já foram enviados anteriormente
    if solicitacoes_anteriores:
        for sol in solicitacoes_anteriores:
            if sol.vendas_ids:
                try:
                    ids_enviados = json.loads(sol.vendas_ids)
                    print(f"  - Marcando itens enviados da solicitação {sol.id}: {ids_enviados}")
                    for item_id in ids_enviados:
                        if item_id in itens_status:
                            itens_status[item_id]["ja_enviado"] = True
                            print(f"    - Item {item_id} marcado como ja_enviado=True")
                except:
                    continue
    
    # Se há solicitação pendente, marcar seus itens como ja_enviado também
    if solicitacao_pendente and solicitacao_pendente.vendas_ids:
        try:
            ids_pendentes = json.loads(solicitacao_pendente.vendas_ids)
            print(f"  - Marcando itens da solicitação pendente {solicitacao_pendente.id}: {ids_pendentes}")
            for item_id in ids_pendentes:
                if item_id in itens_status:
                    itens_status[item_id]["ja_enviado"] = True
                    print(f"    - Item {item_id} marcado como ja_enviado=True (pendente)")
        except:
            print(f"  - Erro ao parsear vendas_ids da solicitação pendente")
    
    print(f"  - Itens status final: {[(k, v['ja_enviado']) for k, v in itens_status.items()]}")
    
    return {
        "cliente_id": cliente_id,
        "fotos_nao_solicitadas": fotos_nao_solicitadas,
        "pode_solicitar": pode_solicitar,
        "motivo": motivo,
        "tem_solicitacao_pendente": solicitacao_pendente is not None,
        "itens_garagem": len(itens_garagem),
        "itens_status": itens_status
    }


@router.put("/solicitacoes/{sol_id}/")
def atualizar_solicitacao(sol_id: int, data: SolicitacaoUpdate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    # Verificar permissão garagem_edit
    admin_id = current_user.get("user_id")
    if not permission_controller.check_permission(db, admin_id, "garagem_edit"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para atualizar solicitações"
        )
    return garagem_controller.atualizar_solicitacao(db, sol_id, data.model_dump(exclude_none=False))
