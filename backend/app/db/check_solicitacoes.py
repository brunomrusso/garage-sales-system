#!/usr/bin/env python3
"""
Script para verificar o status das solicitações do cliente 1 (Bruno)
"""

import os
import sys
from sqlalchemy import create_engine, text

# DATABASE_URL do Render
DATABASE_URL = "postgresql://garagesales:mDqU34uTrINXPUtauQQGeV0ySdNHsuta@dpg-d7be3r4vjg8s73brako0-a.oregon-postgres.render.com/garage_sales"

def check_solicitacoes():
    """Verifica o status das solicitações do cliente 1"""
    print("Verificando solicitações do cliente 1 (Bruno)...")
    
    try:
        # Conectar ao banco
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            # Verificar todas as solicitações do cliente 1
            result = connection.execute(text("""
                SELECT id, status, data_solicitacao, vendas_ids, codigo_rastreio
                FROM solicitacoes_envio 
                WHERE cliente_id = 1 
                ORDER BY data_solicitacao DESC
            """))
            
            solicitacoes = result.fetchall()
            
            print(f"\nEncontradas {len(solicitacoes)} solicitações:")
            for i, sol in enumerate(solicitacoes, 1):
                print(f"\n{i}. Solicitação #{sol[0]}:")
                print(f"   - Status: {sol[1]}")
                print(f"   - Data: {sol[2]}")
                print(f"   - Código Rastreio: {sol[4] or 'N/A'}")
                print(f"   - Vendas IDs: {sol[3] or 'N/A'}")
                
                # Verificar itens nesta solicitação
                if sol[3]:
                    try:
                        import json
                        vendas_ids = json.loads(sol[3])
                        print(f"   - Quantidade de itens: {len(vendas_ids)}")
                        
                        # Verificar detalhes dos itens
                        result2 = connection.execute(text(f"""
                            SELECT id, preco, carrinhos_comprados
                            FROM vendas_lote 
                            WHERE id IN ({','.join(map(str, vendas_ids))})
                        """))
                        
                        itens = result2.fetchall()
                        total = sum(item[1] for item in itens)
                        print(f"   - Valor total: R$ {total:.2f}")
                        
                        for item in itens:
                            print(f"     * Item #{item[0]}: R$ {item[1]:.2f} - {item[2]}")
                            
                    except Exception as e:
                        print(f"   - Erro ao processar vendas_ids: {e}")
        
        # Verificar itens atualmente na garagem
        print("\n" + "="*50)
        print("Itens atualmente na garagem:")
        
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT id, preco, carrinhos_comprados, status_entrega
                FROM vendas_lote 
                WHERE cliente_id = 1 AND status_entrega = 'centro_distribuicao'
                ORDER BY data_venda DESC
            """))
            
            itens_garagem = result.fetchall()
            
            print(f"\nEncontrados {len(itens_garagem)} itens na garagem:")
            for item in itens_garagem:
                print(f"   * Item #{item[0]}: R$ {item[1]:.2f} - {item[2]} ({item[3]})")
        
    except Exception as e:
        print(f"Erro ao verificar solicitações: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_solicitacoes()
