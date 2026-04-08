from app.db.database import engine
from sqlalchemy import text

conn = engine.connect()
conn.execute(text("ALTER TABLE vendas_lote ADD COLUMN IF NOT EXISTS status_entrega VARCHAR(50) DEFAULT 'aguardando_pagamento'"))
conn.execute(text("ALTER TABLE vendas_lote DROP COLUMN IF EXISTS recebido"))
conn.commit()
conn.close()
print("Migration done")
