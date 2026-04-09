import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine, SessionLocal
from app.core.config import settings
from app.core.security import hash_password
from app.models.models import UsuarioAdmin
from app.routes import auth_routes, cliente_routes, compra_routes, pagamento_routes, solicitacao_routes, lote_routes, garagem_routes

Base.metadata.create_all(bind=engine)

def seed_admin():
    db = SessionLocal()
    try:
        existing = db.query(UsuarioAdmin).first()
        if not existing:
            admin_email = os.environ.get("ADMIN_EMAIL", "admin@garagesales.com")
            admin_senha = os.environ.get("ADMIN_SENHA", "admin123")
            admin = UsuarioAdmin(email=admin_email, senha_hash=hash_password(admin_senha))
            db.add(admin)
            db.commit()
            print(f"[SEED] Admin criado: {admin_email}")
        else:
            print("[SEED] Admin já existe, pulando seed.")
    finally:
        db.close()

seed_admin()

app = FastAPI(
    title="GarageSales API",
    description="Sistema de cadastro de garagem para vendas de miniaturas",
    version="1.0.0"
)

allowed_origins = [
    settings.FRONTEND_URL,
    "https://garage-sales-system.vercel.app",
    "http://localhost:3000",
    "http://localhost:3003",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(cliente_routes.router)
app.include_router(compra_routes.router)
app.include_router(pagamento_routes.router)
app.include_router(solicitacao_routes.router)
app.include_router(lote_routes.router)
app.include_router(garagem_routes.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
