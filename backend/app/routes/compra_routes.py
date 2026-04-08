from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import CompraCreate, CompraUpdate, CompraResponse
from app.controllers import compra_controller
from app.core.security import verify_token, verify_admin_token

router = APIRouter(prefix="/api/compras", tags=["compras"])


@router.post("/", response_model=CompraResponse)
def criar_compra(compra_data: CompraCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return compra_controller.criar_compra(db, compra_data)


@router.get("/cliente/{cliente_id}", response_model=list[CompraResponse])
def listar_compras_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return compra_controller.listar_compras_cliente(db, cliente_id)


@router.get("/{compra_id}")
def obter_compra(compra_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return compra_controller.obter_compra(db, compra_id)


@router.put("/{compra_id}", response_model=CompraResponse)
def atualizar_compra(compra_id: int, compra_data: CompraUpdate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return compra_controller.atualizar_compra(db, compra_id, compra_data)


@router.delete("/{compra_id}")
def deletar_compra(compra_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return compra_controller.deletar_compra(db, compra_id)
