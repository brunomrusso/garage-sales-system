"""
Script para criar módulos padrão do sistema e empresa inicial
Execute: python -m app.db.seed_modulos
"""
from sqlalchemy.orm import Session
from app.db.database import engine, Base, SessionLocal
from app.models.models import Modulo, Empresa, EmpresaModulo, EmpresaConfig


def criar_modulos_padrao(db: Session):
    """Cria os módulos padrão do sistema se não existirem"""
    
    modulos = [
        {
            "codigo": "core",
            "nome": "Core",
            "descricao": "Funcionalidades básicas (clientes, lotes, vendas)",
            "icone": "LayoutDashboard",
            "categoria": "core",
            "obrigatorio": True,
            "dependencias": []
        },
        {
            "codigo": "garagem",
            "nome": "Gestão de Garagem",
            "descricao": "Fotos da garagem e solicitações de envio",
            "icone": "Warehouse",
            "categoria": "core",
            "obrigatorio": False,
            "dependencias": ["core"]
        },
        {
            "codigo": "pagamentos",
            "nome": "Gateway de Pagamento",
            "descricao": "Integração com Stripe/PayPal para pagamentos online",
            "icone": "CreditCard",
            "categoria": "advanced",
            "obrigatorio": False,
            "dependencias": ["core"]
        },
        {
            "codigo": "relatorios",
            "nome": "Relatórios Avançados",
            "descricao": "Dashboards e relatórios customizáveis",
            "icone": "BarChart3",
            "categoria": "advanced",
            "obrigatorio": False,
            "dependencias": ["core"]
        },
        {
            "codigo": "api",
            "nome": "API Externa",
            "descricao": "Acesso via API e webhooks",
            "icone": "Webhook",
            "categoria": "integration",
            "obrigatorio": False,
            "dependencias": ["core"]
        },
        {
            "codigo": "multiuser",
            "nome": "Multi-usuário",
            "descricao": "Permite múltiplos admins com permissões diferentes",
            "icone": "Users",
            "categoria": "advanced",
            "obrigatorio": False,
            "dependencias": ["core"]
        },
        {
            "codigo": "notificacoes",
            "nome": "Notificações",
            "descricao": "Email e SMS para clientes",
            "icone": "Bell",
            "categoria": "advanced",
            "obrigatorio": False,
            "dependencias": ["core"]
        }
    ]
    
    criados = 0
    for modulo_data in modulos:
        # Verificar se já existe
        existente = db.query(Modulo).filter(Modulo.codigo == modulo_data["codigo"]).first()
        if not existente:
            modulo = Modulo(**modulo_data)
            db.add(modulo)
            criados += 1
            print(f"✓ Módulo criado: {modulo_data['codigo']} - {modulo_data['nome']}")
    
    db.commit()
    print(f"\n{criados} módulos criados")
    return criados


def criar_empresa_padrao(db: Session):
    """Cria empresa padrão se não existir"""
    
    empresa = db.query(Empresa).filter(Empresa.slug == "principal").first()
    
    if empresa:
        print(f"\n✓ Empresa padrão já existe: {empresa.nome} (ID: {empresa.id})")
        return empresa
    
    # Criar empresa padrão
    empresa = Empresa(
        nome="Minha Empresa",
        slug="principal",
        cnpj=None,
        ativa=True,
        logo_url=None,
        cor_primaria="#3B82F6"
    )
    db.add(empresa)
    db.flush()  # Para obter o ID
    
    print(f"\n✓ Empresa padrão criada: {empresa.nome} (ID: {empresa.id})")
    
    # Criar configuração da empresa
    config = EmpresaConfig(
        empresa_id=empresa.id,
        campos_custom_cliente=[],
        campos_custom_venda=[],
        fluxo_aprovacao={},
        webhook_url=None,
        api_key=None
    )
    db.add(config)
    print(f"✓ Configuração da empresa criada")
    
    # Habilitar todos os módulos para empresa padrão
    modulos = db.query(Modulo).all()
    for modulo in modulos:
        em = EmpresaModulo(
            empresa_id=empresa.id,
            modulo_id=modulo.id,
            habilitado=True,
            config={}
        )
        db.add(em)
        print(f"✓ Módulo '{modulo.codigo}' habilitado para empresa padrão")
    
    db.commit()
    print(f"\n✅ Empresa padrão configurada com sucesso!")
    return empresa


def main():
    """Função principal"""
    print("=" * 50)
    print("SEED DE MÓDULOS E EMPRESA PADRÃO")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        # Criar módulos
        criar_modulos_padrao(db)
        
        # Criar empresa padrão
        criar_empresa_padrao(db)
        
        print("\n" + "=" * 50)
        print("✅ SEED CONCLUÍDO COM SUCESSO")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
