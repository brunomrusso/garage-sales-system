import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine, SessionLocal
from app.core.config import settings
from app.core.security import hash_password
from app.models.models import UsuarioAdmin, Cliente
from app.core.permissions import initialize_admin_permissions
from app.routes import auth_routes, cliente_routes, compra_routes, pagamento_routes, solicitacao_routes, lote_routes, garagem_routes, permission_routes, admin_routes
from app.core.tenant import tenant_middleware

Base.metadata.create_all(bind=engine)

def run_migrations():
    """Execute pending database migrations"""
    try:
        from app.db.run_migrations import run_migrations as execute_migrations
        execute_migrations()
    except Exception as e:
        print(f"[MIGRATIONS] Error: {str(e)}")

def run_schema_migration():
    """Adiciona colunas empresa_id às tabelas existentes via SQL direto"""
    print("[SCHEMA-MIGRATE] Verificando/criando colunas empresa_id...")
    
    db = SessionLocal()
    try:
        from sqlalchemy import text, inspect
        
        inspector = inspect(db.bind)
        
        # Tabelas que precisam da coluna empresa_id
        tabelas_colunas = [
            ("clientes", "empresa_id"),
            ("compras", "empresa_id"),
            ("pagamentos", "empresa_id"),
            ("solicitacoes_envio", "empresa_id"),
            ("lotes", "empresa_id"),
            ("vendas_lote", "empresa_id"),
            ("fotos_garagem", "empresa_id"),
        ]
        
        colunas_criadas = 0
        
        for tabela, coluna in tabelas_colunas:
            try:
                # Verificar se coluna já existe
                colunas = [c['name'] for c in inspector.get_columns(tabela)]
                
                if coluna not in colunas:
                    print(f"[SCHEMA-MIGRATE] Adicionando {coluna} à tabela {tabela}...")
                    
                    # Adicionar coluna via SQL
                    sql = text(f"ALTER TABLE {tabela} ADD COLUMN {coluna} INTEGER REFERENCES empresas(id) ON DELETE CASCADE")
                    db.execute(sql)
                    colunas_criadas += 1
                    print(f"[SCHEMA-MIGRATE] ✅ Coluna {coluna} adicionada em {tabela}")
                else:
                    print(f"[SCHEMA-MIGRATE] Coluna {coluna} já existe em {tabela}")
                    
            except Exception as e:
                print(f"[SCHEMA-MIGRATE] ⚠️ Erro ao processar {tabela}.{coluna}: {e}")
                # Continuar mesmo com erro
        
        if colunas_criadas > 0:
            db.commit()
            print(f"[SCHEMA-MIGRATE] ✅ {colunas_criadas} colunas criadas com sucesso!")
        else:
            print("[SCHEMA-MIGRATE] ✅ Todas as colunas já existem")
            
    except Exception as e:
        print(f"[SCHEMA-MIGRATE] ❌ Erro: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def auto_migrate_tenant():
    """Auto-migração para multi-tenant - cria empresa padrão e migra dados"""
    print("[AUTO-MIGRATE] Iniciando auto-migração multi-tenant...")
    
    db = SessionLocal()
    try:
        from app.models.models import Empresa, EmpresaConfig, Modulo, EmpresaModulo, Cliente, Lote, VendaLote, Compra, Pagamento, SolicitacaoEnvio, FotoGaragem
        from app.db.seed_modulos import criar_modulos_padrao
        from sqlalchemy import text
        
        # 1. Verificar se já existe empresa padrão
        empresa = db.query(Empresa).filter(Empresa.slug == "principal").first()
        
        if empresa:
            print(f"[AUTO-MIGRATE] Empresa padrão já existe: {empresa.nome} (ID: {empresa.id})")
        else:
            print("[AUTO-MIGRATE] Criando empresa padrão...")
            
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
            
            # Criar configuração
            config = EmpresaConfig(
                empresa_id=empresa.id,
                campos_custom_cliente=[],
                campos_custom_venda=[],
                fluxo_aprovacao={},
                webhook_url=None,
                api_key=None
            )
            db.add(config)
            
            print(f"[AUTO-MIGRATE] Empresa padrão criada: ID {empresa.id}")
        
        empresa_id = empresa.id
        
        # 2. Criar módulos padrão
        criar_modulos_padrao(db)
        
        # 3. Habilitar módulos para empresa padrão
        modulos = db.query(Modulo).all()
        for modulo in modulos:
            em = db.query(EmpresaModulo).filter(
                EmpresaModulo.empresa_id == empresa_id,
                EmpresaModulo.modulo_id == modulo.id
            ).first()
            
            if not em:
                em = EmpresaModulo(
                    empresa_id=empresa_id,
                    modulo_id=modulo.id,
                    habilitado=True,
                    config={}
                )
                db.add(em)
        
        db.commit()
        print(f"[AUTO-MIGRATE] {len(modulos)} módulos habilitados para empresa padrão")
        
        # 4. Migrar dados existentes (adicionar empresa_id = 1)
        tabelas = [
            ("clientes", Cliente),
            ("compras", Compra),
            ("pagamentos", Pagamento),
            ("solicitacoes_envio", SolicitacaoEnvio),
            ("lotes", Lote),
            ("vendas_lote", VendaLote),
            ("fotos_garagem", FotoGaragem),
        ]
        
        total_migrado = 0
        for tabela_nome, modelo in tabelas:
            try:
                # Verificar se há registros sem empresa_id
                registros_sem_empresa = db.query(modelo).filter(modelo.empresa_id.is_(None)).all()
                
                if registros_sem_empresa:
                    for registro in registros_sem_empresa:
                        registro.empresa_id = empresa_id
                    total_migrado += len(registros_sem_empresa)
                    print(f"[AUTO-MIGRATE] {tabela_nome}: {len(registros_sem_empresa)} registros migrados")
            except Exception as e:
                print(f"[AUTO-MIGRATE] Erro ao migrar {tabela_nome}: {e}")
        
        if total_migrado > 0:
            db.commit()
        
        print(f"[AUTO-MIGRATE] Total de registros migrados: {total_migrado}")
        print("[AUTO-MIGRATE] ✅ Auto-migração concluída com sucesso!")
        
    except Exception as e:
        print(f"[AUTO-MIGRATE] ❌ Erro na auto-migração: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def seed_admin():
    db = SessionLocal()
    try:
        existing = db.query(UsuarioAdmin).first()
        if not existing:
            admin_email = os.environ.get("ADMIN_EMAIL", "admin@garagesales.com")
            admin_senha = os.environ.get("ADMIN_SENHA", "admin123")
            admin = UsuarioAdmin(email=admin_email, senha_hash=hash_password(admin_senha))
            db.add(admin)
            db.commit()
            print(f"[SEED] Admin criado: {admin_email}")
        else:
            print("[SEED] Admin já existe, pulando seed.")
    finally:
        db.close()

def fix_admin_master_role():
    """Corrigir role do admin_master se estiver como cliente"""
    db = SessionLocal()
    try:
        # Encontrar o primeiro UsuarioAdmin (que deve ser admin_master)
        usuario_admin = db.query(UsuarioAdmin).first()
        if usuario_admin:
            # Encontrar o Cliente com o mesmo email
            cliente = db.query(Cliente).filter(Cliente.email == usuario_admin.email).first()
            if cliente and cliente.role != 'admin_master':
                print(f"[FIX] Corrigindo role de {cliente.email} de '{cliente.role}' para 'admin_master'")
                cliente.role = 'admin_master'
                cliente.ativo = True
                db.commit()
                db.refresh(cliente)
                print(f"[FIX] Role corrigido com sucesso!")
    except Exception as e:
        print(f"[FIX] Error: {str(e)}")
    finally:
        db.close()

def initialize_admin_perms():
    """Inicializar permissões para admins aprovados sem permissões"""
    db = SessionLocal()
    try:
        from app.models.models import AdminPermission
        
        # Encontrar todos os admins sem permissões
        admins = db.query(Cliente).filter(
            Cliente.role.in_(['admin', 'admin_master']),
            Cliente.ativo == True
        ).all()
        
        for admin in admins:
            existing_perms = db.query(AdminPermission).filter(
                AdminPermission.admin_id == admin.id
            ).first()
            
            if not existing_perms:
                is_master = admin.role == 'admin_master'
                initialize_admin_permissions(db, admin.id, is_master=is_master)
                role_name = "Admin Master" if is_master else "Admin"
                print(f"[PERMISSIONS] Permissões inicializadas para {role_name}: {admin.email}")
    
    except Exception as e:
        print(f"[PERMISSIONS] Error: {str(e)}")
    finally:
        db.close()

run_migrations()
seed_admin()
fix_admin_master_role()
initialize_admin_perms()
run_schema_migration()  # Adiciona colunas empresa_id se não existirem
auto_migrate_tenant()   # Auto-migração multi-tenant

app = FastAPI(
    title="GarageSales API",
    description="Sistema de cadastro de garagem para vendas de miniaturas",
    version="1.0.0"
)

allowed_origins = [
    settings.FRONTEND_URL,
    "https://garage-sales-system.vercel.app",
    "http://localhost:3000",
    "http://localhost:3003",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de Multi-Tenant
app.middleware("http")(tenant_middleware)

app.include_router(auth_routes.router)
app.include_router(cliente_routes.router)
app.include_router(compra_routes.router)
app.include_router(pagamento_routes.router)
app.include_router(solicitacao_routes.router)
app.include_router(lote_routes.router)
app.include_router(garagem_routes.router)
app.include_router(permission_routes.router)
app.include_router(admin_routes.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
