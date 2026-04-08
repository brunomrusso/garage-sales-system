from app.db.database import engine
from sqlalchemy import text

conn = engine.connect()
conn.execute(text("ALTER TABLE solicitacoes_envio ADD COLUMN IF NOT EXISTS codigo_rastreio VARCHAR(100)"))
conn.commit()
conn.close()
print("Column codigo_rastreio added")
