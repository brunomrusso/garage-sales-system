from fastapi import APIRouter, Depends
from app.controllers import endereco_controller
from app.core.security import verify_token

router = APIRouter(prefix="/cep", tags=["CEP"])


@router.get("/validar/{cep}")
def validar_cep(cep: str, current_user: dict = Depends(verify_token)):
    return endereco_controller.validar_cep(cep)
