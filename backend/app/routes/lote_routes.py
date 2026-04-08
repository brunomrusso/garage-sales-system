from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import LoteCreate, LoteUpdate, VendaLoteCreate, VendaLoteUpdate
from app.controllers import lote_controller
from app.core.security import verify_token, verify_admin_token

router = APIRouter(prefix="/api/lotes", tags=["lotes"])


@router.post("/")
def criar_lote(lote_data: LoteCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.criar_lote(db, lote_data)


@router.get("/")
def listar_lotes(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.listar_lotes(db)


@router.get("/{lote_id}/")
def obter_lote(lote_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return lote_controller.obter_lote(db, lote_id)


@router.put("/{lote_id}/")
def atualizar_lote(lote_id: int, lote_data: LoteUpdate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.atualizar_lote(db, lote_id, lote_data)


@router.delete("/{lote_id}/")
def deletar_lote(lote_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.deletar_lote(db, lote_id)


@router.post("/vendas/")
def criar_venda(venda_data: VendaLoteCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.criar_venda(db, venda_data)


@router.get("/{lote_id}/vendas/")
def listar_vendas_lote(lote_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.listar_vendas_lote(db, lote_id)


@router.get("/vendas/cliente/{cliente_id}/")
def listar_vendas_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return lote_controller.listar_vendas_cliente(db, cliente_id)


@router.put("/vendas/{venda_id}/")
def atualizar_venda(venda_id: int, venda_data: VendaLoteUpdate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.atualizar_venda(db, venda_id, venda_data)


@router.delete("/vendas/{venda_id}/")
def deletar_venda(venda_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.deletar_venda(db, venda_id)
