from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import PagamentoCreate, PagamentoUpdate, PagamentoResponse
from app.controllers import pagamento_controller
from app.core.security import verify_token, verify_admin_token

router = APIRouter(prefix="/api/pagamentos", tags=["pagamentos"])


@router.post("/", response_model=PagamentoResponse)
def criar_pagamento(pagamento_data: PagamentoCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return pagamento_controller.criar_pagamento(db, pagamento_data)


@router.get("/cliente/{cliente_id}", response_model=list[PagamentoResponse])
def listar_pagamentos_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return pagamento_controller.listar_pagamentos_cliente(db, cliente_id)


@router.get("/{pagamento_id}", response_model=PagamentoResponse)
def obter_pagamento(pagamento_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return pagamento_controller.obter_pagamento(db, pagamento_id)


@router.put("/{pagamento_id}", response_model=PagamentoResponse)
def atualizar_pagamento(pagamento_id: int, pagamento_data: PagamentoUpdate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return pagamento_controller.atualizar_pagamento(db, pagamento_id, pagamento_data)


@router.delete("/{pagamento_id}")
def deletar_pagamento(pagamento_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return pagamento_controller.deletar_pagamento(db, pagamento_id)
