#!/usr/bin/env python3
"""
Script para testar substituição quando status = 'pendente'
"""

import os
import sys
from sqlalchemy import create_engine, text

# DATABASE_URL do Render
DATABASE_URL = "postgresql://garagesales:mDqU34uTrINXPUtauQQGeV0ySdNHsuta@dpg-d7be3r4vjg8s73brako0-a.oregon-postgres.render.com/garage_sales"

def test_substituicao():
    """Testa substituição com status = 'pendente'"""
    print("Testando substituição com status = 'pendente'...")
    
    try:
        # Conectar ao banco
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            # Voltar solicitação #2 para 'pendente'
            result = connection.execute(text("""
                UPDATE solicitacoes_envio 
                SET status = 'pendente', codigo_rastreio = NULL
                WHERE id = 2 AND cliente_id = 1
            """))
            
            connection.commit()
            
            print(f"Solicitação #2 voltada para 'pendente'! {result.rowcount} linha(s) afetada(s)")
            
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
        
        print("\n" + "="*50)
        print("Cenário de teste:")
        print("- Solicitação #2 está com status 'pendente' contendo itens [1, 6, 8]")
        print("- Itens na garagem: [1, 6, 8, 9, 10]")
        print("- Itens novos: [9, 10]")
        print("- Botão deve habilitar com 'Há 2 novos itens na garagem'")
        print("- Ao solicitar: deve substituir solicitação #2 com todos os itens [1, 6, 8, 9, 10]")
        
    except Exception as e:
        print(f"Erro ao atualizar solicitações: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_substituicao()
