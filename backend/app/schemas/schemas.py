from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class TokenResponse(BaseModel):
    token: str
    user: dict


class ClienteCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    telefone: Optional[str] = None


class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None


class ClienteResponse(BaseModel):
    id: int
    nome: str
    email: str
    telefone: Optional[str]
    data_cadastro: datetime

    class Config:
        from_attributes = True


class CompraCreate(BaseModel):
    cliente_id: int
    descricao: str
    preco: Decimal
    foto: Optional[str] = None


class CompraUpdate(BaseModel):
    descricao: Optional[str] = None
    preco: Optional[Decimal] = None
    foto: Optional[str] = None


class CompraResponse(BaseModel):
    id: int
    cliente_id: int
    descricao: str
    preco: Decimal
    data_compra: datetime
    foto: Optional[str] = None

    class Config:
        from_attributes = True


class PagamentoCreate(BaseModel):
    cliente_id: int
    valor: Decimal
    status: Optional[str] = "pendente"


class PagamentoUpdate(BaseModel):
    valor: Optional[Decimal] = None
    status: Optional[str] = None


class PagamentoResponse(BaseModel):
    id: int
    cliente_id: int
    valor: Decimal
    data_pagamento: datetime
    status: str

    class Config:
        from_attributes = True


class SolicitacaoCreate(BaseModel):
    cliente_id: int


class SolicitacaoUpdate(BaseModel):
    status: Optional[str] = None


class SolicitacaoResponse(BaseModel):
    id: int
    cliente_id: int
    data_solicitacao: datetime
    status: str

    class Config:
        from_attributes = True


class LoteCreate(BaseModel):
    descricao: Optional[str] = None
    foto: Optional[str] = None
    status_lote: Optional[str] = None


class LoteUpdate(BaseModel):
    descricao: Optional[str] = None
    foto: Optional[str] = None
    status_lote: Optional[str] = None
    arquivado: Optional[bool] = None


class LoteResponse(BaseModel):
    id: int
    numero_lote: str
    nome: Optional[str] = None
    descricao: Optional[str]
    foto: Optional[str] = None
    data_criacao: datetime
    status_lote: Optional[str]
    arquivado: bool
    total_vendas: int
    vendas_pagas: int
    vendas_nao_pagas: int
    valor_total: float
    valor_pago: float
    percentual_pago: float
    vendas_entregues: int
    percentual_entregue: float

    class Config:
        from_attributes = True


class VendaLoteCreate(BaseModel):
    lote_id: int
    cliente_id: int
    carrinhos_comprados: str
    preco: Decimal
    pago: Optional[bool] = False
    comprovante_pagamento: Optional[str] = None
    data_pagamento: Optional[datetime] = None
    observacoes: Optional[str] = None


class VendaLoteUpdate(BaseModel):
    carrinhos_comprados: Optional[str] = None
    preco: Optional[Decimal] = None
    pago: Optional[bool] = None
    comprovante_pagamento: Optional[str] = None
    data_pagamento: Optional[datetime] = None
    observacoes: Optional[str] = None
    status_entrega: Optional[str] = None


class VendaLoteResponse(BaseModel):
    id: int
    lote_id: int
    cliente_id: int
    carrinhos_comprados: str
    preco: Decimal
    pago: bool
    comprovante_pagamento: Optional[str] = None
    data_pagamento: Optional[datetime]
    data_venda: datetime
    observacoes: Optional[str]
    status_entrega: Optional[str] = "aguardando_pagamento"
    cliente_nome: Optional[str] = None
    lote_nome: Optional[str] = None
    lote_foto: Optional[str] = None

    class Config:
        from_attributes = True


class FotoGaragemCreate(BaseModel):
    cliente_id: int
    foto: str
    descricao: Optional[str] = None


class FotoGaragemResponse(BaseModel):
    id: int
    cliente_id: int
    foto: Optional[str] = None
    descricao: Optional[str]
    data_upload: datetime

    class Config:
        from_attributes = True


class SolicitacaoEnvioCreate(BaseModel):
    cliente_id: int
    observacoes: Optional[str] = None


class SolicitacaoEnvioUpdate(BaseModel):
    status: Optional[str] = None
    codigo_rastreio: Optional[str] = None


class SolicitacaoEnvioResponse(BaseModel):
    id: int
    cliente_id: int
    data_solicitacao: datetime
    status: str
    codigo_rastreio: Optional[str] = None
    cliente_nome: Optional[str] = None

    class Config:
        from_attributes = True
