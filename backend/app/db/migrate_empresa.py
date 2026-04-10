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


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--verify":
        verificar_migracao()
    else:
        migrar_dados_existentes()
