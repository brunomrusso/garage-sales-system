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
auto_migrate_tenant()  # Auto-migração multi-tenant

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
