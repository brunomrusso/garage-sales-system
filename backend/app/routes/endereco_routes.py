from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import verify_token
from app.schemas.schemas import EnderecoCreate, EnderecoUpdate
from app.controllers import endereco_controller

router = APIRouter(prefix="/enderecos", tags=["Enderecos"])


@router.get("/validar-cep/{cep}/")
def validar_cep(cep: str, current_user: dict = Depends(verify_token)):
    return endereco_controller.validar_cep(cep)


@router.post("/")
def criar_endereco(data: EnderecoCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return endereco_controller.criar_endereco(db, data)


@router.get("/cliente/{cliente_id}/")
def listar_enderecos(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return endereco_controller.listar_enderecos(db, cliente_id)


@router.put("/{endereco_id}/padrao/")
def definir_padrao(endereco_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return endereco_controller.definir_padrao(db, endereco_id)


@router.put("/{endereco_id}/")
def atualizar_endereco(endereco_id: int, data: EnderecoUpdate, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return endereco_controller.atualizar_endereco(db, endereco_id, data)


@router.delete("/{endereco_id}/")
def deletar_endereco(endereco_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return endereco_controller.deletar_endereco(db, endereco_id)
