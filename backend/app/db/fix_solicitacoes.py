#!/usr/bin/env python3
"""
Script para corrigir o status das solicitações para teste
"""

import os
import sys
from sqlalchemy import create_engine, text

# DATABASE_URL do Render
DATABASE_URL = "postgresql://garagesales:mDqU34uTrINXPUtauQQGeV0ySdNHsuta@dpg-d7be3r4vjg8s73brako0-a.oregon-postgres.render.com/garage_sales"

def fix_solicitacoes():
    """Corrige o status das solicitações para teste"""
    print("Corrigindo status das solicitações...")
    
    try:
        # Conectar ao banco
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            # Mudar solicitação #2 para 'enviado' para testar cenário correto
            result = connection.execute(text("""
                UPDATE solicitacoes_envio 
                SET status = 'enviado', codigo_rastreio = 'TESTE_FIX'
                WHERE id = 2 AND cliente_id = 1
            """))
            
            connection.commit()
            
            print(f"Solicitação #2 atualizada! {result.rowcount} linha(s) afetada(s)")
            
            # Verificar status atual
            result = connection.execute(text("""
                SELECT id, status, data_solicitacao, codigo_rastreio, vendas_ids
                FROM solicitacoes_envio 
                WHERE cliente_id = 1
                ORDER BY id
            """))
            
            solicitacoes = result.fetchall()
            
            print(f"\nStatus atual das solicitações:")
            for sol in solicitacoes:
                print(f"   - ID: {sol[0]} | Status: {sol[1]} | Rastreio: {sol[3] or 'N/A'} | Itens: {sol[4]}")
        
    except Exception as e:
        print(f"Erro ao atualizar solicitações: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fix_solicitacoes()
