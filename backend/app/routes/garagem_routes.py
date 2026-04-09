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
    
    # Contar fotos não solicitadas
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
        
        if novos_itens:
            pode_solicitar = True
            motivo = f"Há {len(novos_itens)} novos itens na garagem"
        else:
            pode_solicitar = False
            motivo = "Todos os itens já estão na solicitação pendente"
    else:
        # Se não existe solicitação pendente, pode solicitar se há itens
        pode_solicitar = len(itens_garagem) > 0
        motivo = "Pode solicitar envio" if pode_solicitar else "Não há itens na garagem"
    
    print(f"  - Pode solicitar: {pode_solicitar}")
    print(f"  - Motivo: {motivo}")
    
    return {
        "cliente_id": cliente_id,
        "fotos_nao_solicitadas": fotos_nao_solicitadas,
        "pode_solicitar": pode_solicitar,
        "motivo": motivo,
        "tem_solicitacao_pendente": solicitacao_pendente is not None,
        "itens_garagem": len(itens_garagem)
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
