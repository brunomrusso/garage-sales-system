import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine
from app.core.config import settings
from app.routes import auth_routes, cliente_routes, compra_routes, pagamento_routes, solicitacao_routes, lote_routes, garagem_routes

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GarageSales API",
    description="Sistema de cadastro de garagem para vendas de miniaturas",
    version="1.0.0"
)

allowed_origins = [
    settings.FRONTEND_URL,
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
