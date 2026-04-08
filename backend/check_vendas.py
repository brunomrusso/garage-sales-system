from app.db.database import engine
from sqlalchemy import text

conn = engine.connect()
result = conn.execute(text("SELECT id, cliente_id, carrinhos_comprados, preco, pago, status_entrega FROM vendas_lote ORDER BY id"))
for row in result:
    print(row)
conn.close()
