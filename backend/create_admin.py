import sys
sys.path.insert(0, '.')
from app.db.database import SessionLocal
from app.models.models import UsuarioAdmin
from app.core.security import hash_password

db = SessionLocal()

admin = UsuarioAdmin(
    email="runbrunorun2@gmail.com",
    senha_hash=hash_password("admin123")
)

db.add(admin)
db.commit()
db.refresh(admin)
print(f"Admin criado com sucesso! ID: {admin.id}, Email: {admin.email}")
db.close()
