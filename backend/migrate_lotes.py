#!/usr/bin/env python3
"""
Script de migração para atualizar a tabela de lotes com os novos campos
Execute este script para adicionar as colunas: numero_lote, status_lote, arquivado
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.models.models import Lote
from app.db.database import SessionLocal

def migrate_database():
    """Executa a migração do banco de dados"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as connection:
        # Iniciar transação
        trans = connection.begin()
        
        try:
            print("Iniciando migração do banco de dados...")
            
            # Adicionar coluna numero_lote se não existir
            try:
                connection.execute(text("""
                    ALTER TABLE lotes 
                    ADD COLUMN numero_lote VARCHAR(10) NOT NULL DEFAULT ''
                """))
                print("Coluna 'numero_lote' adicionada com sucesso")
            except Exception as e:
                if "duplicate column name" in str(e).lower():
                    print("Coluna 'numero_lote' já existe")
                else:
                    raise e
            
            # Adicionar coluna status_lote se não existir
            try:
                connection.execute(text("""
                    ALTER TABLE lotes 
                    ADD COLUMN status_lote VARCHAR(50)
                """))
                print("Coluna 'status_lote' adicionada com sucesso")
            except Exception as e:
                if "duplicate column name" in str(e).lower():
                    print("Coluna 'status_lote' já existe")
                else:
                    raise e
            
            # Adicionar coluna arquivado se não existir
            try:
                connection.execute(text("""
                    ALTER TABLE lotes 
                    ADD COLUMN arquivado BOOLEAN DEFAULT FALSE
                """))
                print("Coluna 'arquivado' adicionada com sucesso")
            except Exception as e:
                if "duplicate column name" in str(e).lower():
                    print("Coluna 'arquivado' já existe")
                else:
                    raise e
            
            # Commit das alterações
            trans.commit()
            print("Migração das colunas concluída com sucesso!")
            
        except Exception as e:
            trans.rollback()
            print(f"Erro durante a migração: {e}")
            raise

def migrate_existing_lotes():
    """Migra lotes existentes para numeração automática"""
    db = SessionLocal()
    
    try:
        print("Migrando lotes existentes para numeração automática...")
        
        lotes = db.query(Lote).all()
        migrados = 0
        
        for i, lote in enumerate(lotes, 1):
            # Se já tem número, pular
            if lote.numero_lote and lote.numero_lote.startswith('#'):
                continue
            
            # Gerar número sequencial
            lote.numero_lote = f"#{i:03d}"
            migrados += 1
        
        db.commit()
        print(f"Total de lotes migrados: {migrados}/{len(lotes)}")
        
    except Exception as e:
        db.rollback()
        print(f"Erro ao migrar lotes: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    try:
        migrate_database()
        migrate_existing_lotes()
        print("\nMigração concluída com sucesso!")
        print("Execute 'python -m uvicorn app.main:app --reload' para reiniciar o servidor")
    except Exception as e:
        print(f"\nErro durante a migração: {e}")
        sys.exit(1)
