"""
Script de migração: Adiciona empresa_id aos dados existentes
Execute após criar as tabelas de empresa: python -m app.db.migrate_empresa
"""
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import Empresa, EmpresaModulo, Modulo


def migrar_dados_existentes():
    """
    Migra dados existentes para a estrutura multi-tenant:
    1. Cria empresa padrão se não existir
    2. Atualiza todas as tabelas com empresa_id = 1 (empresa padrão)
    3. Habilita todos os módulos para empresa padrão
    """
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("MIGRAÇÃO PARA MULTI-TENANT")
        print("=" * 60)
        
        # 1. Verificar/criar empresa padrão
        empresa = db.query(Empresa).filter(Empresa.slug == "principal").first()
        
        if not empresa:
            print("\n⚠️  Empresa padrão não encontrada. Criando...")
            
            # Criar módulos primeiro
            from app.db.seed_modulos import criar_modulos_padrao, criar_empresa_padrao
            criar_modulos_padrao(db)
            empresa = criar_empresa_padrao(db)
        else:
            print(f"\n✓ Empresa padrão encontrada: {empresa.nome} (ID: {empresa.id})")
        
        empresa_id = empresa.id
        
        # 2. Atualizar tabelas existentes com empresa_id
        print("\n📊 Atualizando dados existentes...")
        
        tabelas = [
            ("clientes", "id"),
            ("compras", "id"),
            ("pagamentos", "id"),
            ("solicitacoes_envio", "id"),
            ("lotes", "id"),
            ("vendas_lote", "id"),
            ("fotos_garagem", "id"),
        ]
        
        atualizados = 0
        for tabela, pk in tabelas:
            # Verificar se a coluna existe
            result = db.execute(text(f"""
                SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_name = '{tabela}' AND column_name = 'empresa_id'
            """)).scalar()
            
            if result == 0:
                print(f"  ⚠️  Coluna empresa_id não existe em {tabela}, pulando...")
                continue
            
            # Atualizar registros sem empresa_id
            result = db.execute(text(f"""
                UPDATE {tabela} 
                SET empresa_id = {empresa_id} 
                WHERE empresa_id IS NULL
            """))
            
            count = result.rowcount
            if count > 0:
                print(f"  ✓ {tabela}: {count} registros atualizados")
                atualizados += count
        
        db.commit()
        
        print(f"\n✅ Total de registros atualizados: {atualizados}")
        print("\n" + "=" * 60)
        print("MIGRAÇÃO CONCLUÍDA COM SUCESSO")
        print("=" * 60)
        print(f"\nEmpresa padrão ID: {empresa_id}")
        print("Todas as empresas devem usar o header X-Empresa-ID ou X-Empresa-Slug")
        print("Empresa padrão: slug='principal', usar header X-Empresa-Slug: principal")
        
    except Exception as e:
        print(f"\n❌ ERRO na migração: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def verificar_migracao():
    """Verifica o status da migração"""
    db = SessionLocal()
    
    try:
        print("\n📋 VERIFICAÇÃO DA MIGRAÇÃO")
        print("-" * 40)
        
        # Verificar empresa padrão
        empresa = db.query(Empresa).filter(Empresa.slug == "principal").first()
        if empresa:
            print(f"✓ Empresa padrão: {empresa.nome} (ID: {empresa.id})")
        else:
            print("❌ Empresa padrão não encontrada")
        
        # Verificar módulos
        modulos = db.query(Modulo).count()
        print(f"✓ Total de módulos: {modulos}")
        
        # Verificar dados migrados
        tabelas = ["clientes", "compras", "pagamentos", "solicitacoes_envio", "lotes", "vendas_lote", "fotos_garagem"]
        
        for tabela in tabelas:
            result = db.execute(text(f"""
                SELECT 
                    COUNT(*) as total,
                    COUNT(empresa_id) as com_empresa,
                    COUNT(*) - COUNT(empresa_id) as sem_empresa
                FROM {tabela}
            """)).fetchone()
            
            if result:
                total, com_empresa, sem_empresa = result
                status = "✓" if sem_empresa == 0 else "⚠️"
                print(f"{status} {tabela}: {total} total, {com_empresa} com empresa, {sem_empresa} sem empresa")
        
    except Exception as e:
        print(f"❌ Erro na verificação: {e}")
    finally:
        db.close()


def remover_unique_constraint_email():
    """Remove a constraint UNIQUE global do campo email - permite email em múltiplas empresas"""
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("REMOVENDO CONSTRAINT UNIQUE DO EMAIL")
        print("=" * 60)
        
        # Verificar se a constraint existe
        check_sql = """
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'clientes' AND indexname = 'ix_clientes_email'
        """
        result = db.execute(text(check_sql)).fetchone()
        
        if result:
            print(f"\n⚠️  Constraint ix_clientes_email encontrada. Removendo...")
            
            # Remover o índice UNIQUE
            drop_sql = "DROP INDEX IF EXISTS ix_clientes_email"
            db.execute(text(drop_sql))
            
            # Criar novo índice sem UNIQUE
            create_sql = "CREATE INDEX ix_clientes_email ON clientes (email)"
            db.execute(text(create_sql))
            
            db.commit()
            print("✅ Constraint UNIQUE removida. Índice normal criado.")
            print("   Agora emails podem ser duplicados entre empresas diferentes!")
        else:
            print("\n✓ Constraint ix_clientes_email não existe. Nada a fazer.")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--verify":
        verificar_migracao()
    elif len(sys.argv) > 1 and sys.argv[1] == "--fix-email":
        remover_unique_constraint_email()
    else:
        migrar_dados_existentes()
