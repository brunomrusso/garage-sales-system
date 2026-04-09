from sqlalchemy import Column, Integer, String, DateTime, Numeric, LargeBinary, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class UsuarioAdmin(Base):
    __tablename__ = "usuarios_admin"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    senha_hash = Column(String(255))
    criado_em = Column(DateTime, default=datetime.utcnow)


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255))
    email = Column(String(255), unique=True, index=True)
    senha_hash = Column(String(255))
    telefone = Column(String(20), nullable=True)
    data_cadastro = Column(DateTime, default=datetime.utcnow)
    role = Column(String(20), default='cliente')  # cliente, admin, admin_master
    ativo = Column(Boolean, default=True)  # False para admins pendentes

    compras = relationship("Compra", back_populates="cliente", cascade="all, delete-orphan")
    pagamentos = relationship("Pagamento", back_populates="cliente", cascade="all, delete-orphan")
    solicitacoes = relationship("SolicitacaoEnvio", back_populates="cliente", cascade="all, delete-orphan")
    vendas_lote = relationship("VendaLote", back_populates="cliente", cascade="all, delete-orphan")
    fotos_garagem = relationship("FotoGaragem", back_populates="cliente", cascade="all, delete-orphan")


class Compra(Base):
    __tablename__ = "compras"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"))
    descricao = Column(String(255))
    preco = Column(Numeric(10, 2))
    data_compra = Column(DateTime, default=datetime.utcnow)
    foto = Column(LargeBinary, nullable=True)

    cliente = relationship("Cliente", back_populates="compras")


class Pagamento(Base):
    __tablename__ = "pagamentos"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"))
    valor = Column(Numeric(10, 2))
    data_pagamento = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="pendente")

    cliente = relationship("Cliente", back_populates="pagamentos")


class SolicitacaoEnvio(Base):
    __tablename__ = "solicitacoes_envio"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"))
    data_solicitacao = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="pendente")
    codigo_rastreio = Column(String(100), nullable=True)
    vendas_ids = Column(Text, nullable=True)

    cliente = relationship("Cliente", back_populates="solicitacoes")


class Lote(Base):
    __tablename__ = "lotes"

    id = Column(Integer, primary_key=True, index=True)
    numero_lote = Column(String(10), nullable=False, unique=True)  # #001, #002, etc.
    nome = Column(String(255), nullable=True)  # Mantido para compatibilidade com dados existentes
    descricao = Column(Text, nullable=True)
    foto = Column(LargeBinary, nullable=True)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    status_lote = Column(String(50), nullable=True)  # Chegou EUA, Importado Brasil, Alfandega/Tributação, Centro Distribuição
    arquivado = Column(Boolean, default=False)
    
    # Campos calculados (não armazenados no banco, calculados em tempo real)
    @property
    def total_vendas(self):
        return len(self.vendas) if self.vendas else 0
    
    @property
    def vendas_pagas(self):
        return sum(1 for v in self.vendas if v.pago) if self.vendas else 0
    
    @property
    def vendas_nao_pagas(self):
        return self.total_vendas - self.vendas_pagas
    
    @property
    def valor_total(self):
        return sum(float(v.preco) for v in self.vendas) if self.vendas else 0
    
    @property
    def valor_pago(self):
        return sum(float(v.preco) for v in self.vendas if v.pago) if self.vendas else 0
    
    @property
    def percentual_pago(self):
        return (self.valor_pago / self.valor_total * 100) if self.valor_total > 0 else 0
    
    @property
    def vendas_entregues(self):
        return sum(1 for v in self.vendas if v.status_entrega == "entregue") if self.vendas else 0
    
    @property
    def percentual_entregue(self):
        return (self.vendas_entregues / self.total_vendas * 100) if self.total_vendas > 0 else 0

    vendas = relationship("VendaLote", back_populates="lote", cascade="all, delete-orphan")


class VendaLote(Base):
    __tablename__ = "vendas_lote"

    id = Column(Integer, primary_key=True, index=True)
    lote_id = Column(Integer, ForeignKey("lotes.id", ondelete="CASCADE"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False)
    carrinhos_comprados = Column(Text, nullable=False)
    preco = Column(Numeric(10, 2), nullable=False)
    pago = Column(Boolean, default=False)
    comprovante_pagamento = Column(LargeBinary, nullable=True)
    data_pagamento = Column(DateTime, nullable=True)
    data_venda = Column(DateTime, default=datetime.utcnow)
    observacoes = Column(Text, nullable=True)
    status_entrega = Column(String(50), default="aguardando_pagamento")

    lote = relationship("Lote", back_populates="vendas")
    cliente = relationship("Cliente", back_populates="vendas_lote")


class FotoGaragem(Base):
    __tablename__ = "fotos_garagem"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False)
    foto = Column(LargeBinary, nullable=False)
    descricao = Column(String(255), nullable=True)
    data_upload = Column(DateTime, default=datetime.utcnow)

    cliente = relationship("Cliente", back_populates="fotos_garagem")
