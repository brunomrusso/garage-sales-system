#!/usr/bin/env python3
"""
Script para voltar o status da solicitação para "pendente" para teste
"""

import os
import sys
from sqlalchemy import create_engine, text

# DATABASE_URL do Render
DATABASE_URL = "postgresql://garagesales:mDqU34uTrINXPUtauQQGeV0ySdNHsuta@dpg-d7be3r4vjg8s73brako0-a.oregon-postgres.render.com/garage_sales"

def reset_solicitacao():
    """Volta o status da solicitação para pendente"""
    print("Voltando status da solicitação #1 para 'pendente'...")
    
    try:
        # Conectar ao banco
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            # Voltar status para pendente e limpar código de rastreio
            result = connection.execute(text("""
                UPDATE solicitacoes_envio 
                SET status = 'pendente', codigo_rastreio = NULL
                WHERE id = 1 AND cliente_id = 1
            """))
            
            connection.commit()
            
            print(f"Status atualizado! {result.rowcount} linha(s) afetada(s)")
            
            # Verificar status atual
            result = connection.execute(text("""
                SELECT id, status, data_solicitacao, codigo_rastreio, vendas_ids
                FROM solicitacoes_envio 
                WHERE id = 1
            """))
            
            solicitacao = result.fetchone()
            
            print(f"\nStatus atual da solicitação:")
            print(f"   - ID: {solicitacao[0]}")
            print(f"   - Status: {solicitacao[1]}")
            print(f"   - Data: {solicitacao[2]}")
            print(f"   - Código Rastreio: {solicitacao[3] or 'N/A'}")
            print(f"   - Vendas IDs: {solicitacao[4]}")
        
    except Exception as e:
        print(f"Erro ao atualizar solicitação: {e}")
        sys.exit(1)

if __name__ == "__main__":
    reset_solicitacao()
