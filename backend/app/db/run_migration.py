#!/usr/bin/env python3
"""
Script para executar migração das colunas solicitado e data_solicitacao
na tabela fotos_garagem
"""

import os
import sys
from sqlalchemy import create_engine, text

# DATABASE_URL do Render
DATABASE_URL = "postgresql://garagesales:mDqU34uTrINXPUtauQQGeV0ySdNHsuta@dpg-d7be3r4vjg8s73brako0-a.oregon-postgres.render.com/garage_sales"

def run_migration():
    """Executa a migração no banco de dados"""
    print("Executando migração das colunas solicitado e data_solicitacao...")
    
    try:
        # Conectar ao banco
        engine = create_engine(DATABASE_URL)
        
        # Ler e executar o SQL de migração
        with open('app/db/migrate_garagem_solicitado.sql', 'r') as f:
            migration_sql = f.read()
        
        # Executar cada comando SQL separadamente
        commands = migration_sql.strip().split(';')
        
        with engine.connect() as connection:
            for command in commands:
                command = command.strip()
                if command:
                    print(f"Executando: {command[:50]}...")
                    connection.execute(text(command))
            
            connection.commit()
        
        print("Migração executada com sucesso!")
        
        # Verificar se as colunas foram criadas
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT column_name, data_type, column_default 
                FROM information_schema.columns 
                WHERE table_name = 'fotos_garagem' 
                AND column_name IN ('solicitado', 'data_solicitacao')
                ORDER BY column_name
            """))
            
            columns = result.fetchall()
            
            print("\nColunas verificadas:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]} (default: {col[2]})")
        
    except Exception as e:
        print(f"Erro ao executar migração: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
