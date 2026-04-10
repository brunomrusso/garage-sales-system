from sqlalchemy import Column, Integer, String, DateTime, Numeric, LargeBinary, ForeignKey, Text, Boolean, JSON
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
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False)
    nome = Column(String(255))
    email = Column(String(255), unique=True, index=True)
    senha_hash = Column(String(255))
    telefone = Column(String(20), nullable=True)
    data_cadastro = Column(DateTime, default=datetime.utcnow)
    role = Column(String(20), default='cliente')  # cliente, admin, admin_master
    ativo = Column(Boolean, default=True)  # False para admins pendentes

    empresa = relationship("Empresa", back_populates="clientes")
    compras = relationship("Compra", back_populates="cliente", cascade="all, delete-orphan")
    pagamentos = relationship("Pagamento", back_populates="cliente", cascade="all, delete-orphan")
    solicitacoes = relationship("SolicitacaoEnvio", back_populates="cliente", cascade="all, delete-orphan")
    vendas_lote = relationship("VendaLote", back_populates="cliente", cascade="all, delete-orphan")
    fotos_garagem = relationship("FotoGaragem", back_populates="cliente", cascade="all, delete-orphan")


class Compra(Base):
    __tablename__ = "compras"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"))
    descricao = Column(String(255))
    preco = Column(Numeric(10, 2))
    data_compra = Column(DateTime, default=datetime.utcnow)
    foto = Column(LargeBinary, nullable=True)

    cliente = relationship("Cliente", back_populates="compras")


class Pagamento(Base):
    __tablename__ = "pagamentos"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"))
    valor = Column(Numeric(10, 2))
    data_pagamento = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="pendente")

    cliente = relationship("Cliente", back_populates="pagamentos")


class SolicitacaoEnvio(Base):
    __tablename__ = "solicitacoes_envio"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"))
    data_solicitacao = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="pendente")
    codigo_rastreio = Column(String(100), nullable=True)
    vendas_ids = Column(Text, nullable=True)

    cliente = relationship("Cliente", back_populates="solicitacoes")


class Lote(Base):
    __tablename__ = "lotes"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False)
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
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False)
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
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False)
    foto = Column(LargeBinary, nullable=False)
    descricao = Column(String(255), nullable=True)
    data_upload = Column(DateTime, default=datetime.utcnow)
    solicitado = Column(Boolean, default=False)
    data_solicitacao = Column(DateTime, nullable=True)

    cliente = relationship("Cliente", back_populates="fotos_garagem")


class AdminPermission(Base):
    __tablename__ = "admin_permissions"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False)
    
    # Permissões de Cliente
    cliente_view = Column(Boolean, default=True)
    cliente_create = Column(Boolean, default=False)
    cliente_edit = Column(Boolean, default=False)
    cliente_delete = Column(Boolean, default=False)
    cliente_reset_pwd = Column(Boolean, default=False)
    
    # Permissões de Lote
    lote_view = Column(Boolean, default=True)
    lote_create = Column(Boolean, default=False)
    lote_edit = Column(Boolean, default=False)
    lote_delete = Column(Boolean, default=False)
    lote_archive = Column(Boolean, default=False)
    
    # Permissões de Venda
    venda_view = Column(Boolean, default=True)
    venda_create = Column(Boolean, default=False)
    venda_edit = Column(Boolean, default=False)
    venda_delete = Column(Boolean, default=False)
    venda_change_status = Column(Boolean, default=False)
    venda_mark_paid = Column(Boolean, default=False)
    
    # Permissões de Admin
    admin_manage_perms = Column(Boolean, default=False)
    admin_view_audit = Column(Boolean, default=False)
    
    # Limite de ações por dia
    max_deletes_per_day = Column(Integer, default=0)  # 0 = sem limite
    
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    admin = relationship("Cliente", foreign_keys=[admin_id])


class AdminExtraPermission(Base):
    __tablename__ = "admin_extra_permissions"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Permissões de Garagem
    garagem_view = Column(Boolean, default=False)
    garagem_edit = Column(Boolean, default=False)
    garagem_foto_upload = Column(Boolean, default=False)
    
    # Permissões de Admin
    admin_approve_admins = Column(Boolean, default=False)
    
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    admin = relationship("Cliente", foreign_keys=[admin_id])


class LotePermission(Base):
    __tablename__ = "lote_permissions"

    id = Column(Integer, primary_key=True, index=True)
    lote_id = Column(Integer, ForeignKey("lotes.id", ondelete="CASCADE"), nullable=False)
    admin_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False)
    criador = Column(Boolean, default=False)  # True se é o criador do lote
    pode_editar = Column(Boolean, default=False)  # Permissão delegada para editar
    
    data_criacao = Column(DateTime, default=datetime.utcnow)

    lote = relationship("Lote")
    admin = relationship("Cliente")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("clientes.id", ondelete="SET NULL"), nullable=True)
    acao = Column(String(100), nullable=False)  # cliente.delete, lote.create, venda.mark_paid, etc
    entidade = Column(String(50), nullable=False)  # cliente, lote, venda
    entidade_id = Column(Integer, nullable=True)
    descricao = Column(Text, nullable=True)
    dados_antes = Column(JSON, nullable=True)  # Dados antes da alteração
    dados_depois = Column(JSON, nullable=True)  # Dados depois da alteração
    ip_address = Column(String(45), nullable=True)  # IPv4 ou IPv6
    user_agent = Column(String(255), nullable=True)
    resultado = Column(String(20), default="sucesso")  # sucesso, erro
    mensagem_erro = Column(Text, nullable=True)
    data_acao = Column(DateTime, default=datetime.utcnow, index=True)

    admin = relationship("Cliente", foreign_keys=[admin_id])


# ========== MODELOS MULTI-TENANT ==========

class Empresa(Base):
    """Empresa/Tenant do sistema"""
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    slug = Column(String(50), unique=True, index=True)  # URL amigável
    cnpj = Column(String(20), nullable=True)
    ativa = Column(Boolean, default=True)
    data_criacao = Column(DateTime, default=datetime.utcnow)

    # Branding
    logo_url = Column(String(500), nullable=True)
    cor_primaria = Column(String(7), default="#3B82F6")  # Hex color

    # Relacionamentos
    clientes = relationship("Cliente", back_populates="empresa")
    admins = relationship("EmpresaAdmin", back_populates="empresa")
    modulos = relationship("EmpresaModulo", back_populates="empresa")
    config = relationship("EmpresaConfig", uselist=False, back_populates="empresa")


class EmpresaAdmin(Base):
    """Relacionamento many-to-many entre Cliente(Admin) e Empresa"""
    __tablename__ = "empresa_admins"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"))
    admin_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"))
    role_na_empresa = Column(String(20), default="admin")  # admin, manager, viewer
    ativo = Column(Boolean, default=True)
    data_criacao = Column(DateTime, default=datetime.utcnow)

    empresa = relationship("Empresa", back_populates="admins")
    admin = relationship("Cliente")


class Modulo(Base):
    """Catálogo de módulos disponíveis no sistema"""
    __tablename__ = "modulos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False)  # "garagem", "relatorios", "api"
    nome = Column(String(100), nullable=False)
    descricao = Column(Text)
    icone = Column(String(50))  # Lucide icon name
    categoria = Column(String(50))  # "core", "advanced", "integration"
    obrigatorio = Column(Boolean, default=False)

    # Módulos dependentes (ex: "relatorios" depende de "vendas")
    dependencias = Column(JSON, default=list)

    empresas = relationship("EmpresaModulo", back_populates="modulo")


class EmpresaModulo(Base):
    """Módulos habilitados para cada empresa"""
    __tablename__ = "empresa_modulos"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"))
    modulo_id = Column(Integer, ForeignKey("modulos.id", ondelete="CASCADE"))
    habilitado = Column(Boolean, default=True)
    data_habilitacao = Column(DateTime, default=datetime.utcnow)

    # Configurações específicas do módulo para esta empresa (JSON)
    config = Column(JSON, default=dict)

    empresa = relationship("Empresa", back_populates="modulos")
    modulo = relationship("Modulo", back_populates="empresas")


class EmpresaConfig(Base):
    """Configurações gerais da empresa"""
    __tablename__ = "empresa_configs"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), unique=True)

    # Campos customizáveis por empresa
    campos_custom_cliente = Column(JSON, default=list)
    campos_custom_venda = Column(JSON, default=list)

    # Fluxos customizáveis
    fluxo_aprovacao = Column(JSON, default=dict)

    # Integrações
    webhook_url = Column(String(500), nullable=True)
    api_key = Column(String(100), nullable=True)

    empresa = relationship("Empresa", back_populates="config")
