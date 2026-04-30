from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class EmpresaCreate(BaseModel):
    nome: str
    slug: str
    cor_primaria: Optional[str] = '#3B82F6'


class EmpresaResponse(BaseModel):
    id: int
    nome: str
    slug: str
    ativa: bool
    cor_primaria: Optional[str] = None

    class Config:
        from_attributes = True


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
    role: Optional[str] = 'cliente'  # cliente, admin, admin_master


class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None


class ClienteResponse(BaseModel):
    id: int
    nome: str
    email: str
    telefone: Optional[str]
    data_cadastro: datetime
    role: Optional[str] = 'cliente'
    ativo: Optional[bool] = True

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
    numero_lote: Optional[str] = None
    nome: Optional[str] = None
    descricao: Optional[str] = None
    foto: Optional[str] = None
    status_lote: Optional[str] = None
    rastreio_importacao: Optional[str] = None
    custo: Optional[Decimal] = None


class LoteUpdate(BaseModel):
    numero_lote: Optional[str] = None
    nome: Optional[str] = None
    descricao: Optional[str] = None
    foto: Optional[str] = None
    status_lote: Optional[str] = None
    arquivado: Optional[bool] = None
    rastreio_importacao: Optional[str] = None
    custo: Optional[Decimal] = None


class LoteResponse(BaseModel):
    id: int
    numero_lote: str
    nome: Optional[str] = None
    descricao: Optional[str]
    foto: Optional[str] = None
    data_criacao: datetime
    status_lote: Optional[str]
    arquivado: bool
    rastreio_importacao: Optional[str] = None
    total_vendas: int
    vendas_pagas: int
    vendas_nao_pagas: int
    valor_total: float
    valor_pago: float
    percentual_pago: float
    vendas_entregues: int
    percentual_entregue: float
    custo: Optional[float] = 0
    lucro: Optional[float] = 0

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
    cotas: Optional[Decimal] = None


class VendaLoteUpdate(BaseModel):
    carrinhos_comprados: Optional[str] = None
    preco: Optional[Decimal] = None
    pago: Optional[bool] = None
    comprovante_pagamento: Optional[str] = None
    data_pagamento: Optional[datetime] = None
    observacoes: Optional[str] = None
    status_entrega: Optional[str] = None
    cotas: Optional[Decimal] = None
    tributo_pago: Optional[bool] = None
    comprovante_tributo: Optional[str] = None
    data_pagamento_tributo: Optional[datetime] = None


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
    cotas: Optional[float] = None
    tributo_pago: Optional[bool] = False
    comprovante_tributo: Optional[str] = None
    data_pagamento_tributo: Optional[datetime] = None
    valor_tributo: Optional[float] = None

    class Config:
        from_attributes = True


class TributoImportacaoCreate(BaseModel):
    rastreio_importacao: str
    valor_total_imposto: Decimal
    observacoes: Optional[str] = None


class TributoImportacaoUpdate(BaseModel):
    valor_total_imposto: Optional[Decimal] = None
    observacoes: Optional[str] = None


class TributoImportacaoResponse(BaseModel):
    id: int
    rastreio_importacao: str
    valor_total_imposto: float
    data_registro: datetime
    observacoes: Optional[str] = None
    total_cotas: Optional[float] = 0
    valor_por_cota: Optional[float] = 0
    lotes_vinculados: Optional[List[dict]] = []
    vendas_count: Optional[int] = 0
    tributos_pagos: Optional[int] = 0
    tributos_pendentes: Optional[int] = 0

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
    endereco_id: Optional[int] = None


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


class EnderecoCreate(BaseModel):
    cliente_id: int
    apelido: Optional[str] = None
    cep: str
    logradouro: str
    numero: str
    complemento: Optional[str] = None
    bairro: str
    cidade: str
    estado: str
    padrao: Optional[bool] = False


class EnderecoUpdate(BaseModel):
    apelido: Optional[str] = None
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    padrao: Optional[bool] = None


class EnderecoResponse(BaseModel):
    id: int
    cliente_id: int
    apelido: Optional[str] = None
    cep: str
    logradouro: str
    numero: str
    complemento: Optional[str] = None
    bairro: str
    cidade: str
    estado: str
    padrao: bool
    data_cadastro: datetime

    class Config:
        from_attributes = True
