from app.db.database import engine
from sqlalchemy import text

conn = engine.connect()
# Fix existing vendas: if status_entrega is beyond aguardando_pagamento, set pago=true
conn.execute(text("""
    UPDATE vendas_lote 
    SET pago = true 
    WHERE status_entrega IN ('pago', 'chegou_eua', 'importado_brasil', 'alfandega', 'centro_distribuicao')
    AND (pago = false OR pago IS NULL)
"""))
conn.commit()
conn.close()
print("Fixed existing vendas pago status")
