"""
Script para criar o admin inicial em produção.
Uso: python seed_admin.py
"""
import os
import sys

from app.db.database import SessionLocal, Base, engine
from app.models.models import UsuarioAdmin
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

email = os.environ.get("ADMIN_EMAIL", "admin@garagesales.com")
senha = os.environ.get("ADMIN_SENHA", "admin123")

existing = db.query(UsuarioAdmin).filter(UsuarioAdmin.email == email).first()
if existing:
    print(f"Admin '{email}' já existe. Nenhuma ação necessária.")
else:
    admin = UsuarioAdmin(
        email=email,
        senha_hash=hash_password(senha),
    )
    db.add(admin)
    db.commit()
    print(f"Admin criado com sucesso!")
    print(f"  Email: {email}")
    print(f"  Senha: {senha}")
    print(f"  IMPORTANTE: Troque a senha após o primeiro login!")

db.close()
