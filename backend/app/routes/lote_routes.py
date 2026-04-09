from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import LoteCreate, LoteUpdate, VendaLoteCreate, VendaLoteUpdate
from app.controllers import lote_controller
from app.core.security import verify_token, verify_admin_token

router = APIRouter(prefix="/api/lotes", tags=["lotes"])


@router.post("/")
def criar_lote(lote_data: LoteCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.criar_lote(db, lote_data)


@router.get("/")
def listar_lotes(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.listar_lotes(db)


@router.get("/{lote_id}/")
def obter_lote(lote_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return lote_controller.obter_lote(db, lote_id)


@router.put("/{lote_id}/")
def atualizar_lote(lote_id: int, lote_data: LoteUpdate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.atualizar_lote(db, lote_id, lote_data)


@router.delete("/{lote_id}/")
def deletar_lote(lote_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.deletar_lote(db, lote_id)


@router.post("/vendas/")
def criar_venda(venda_data: VendaLoteCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.criar_venda(db, venda_data)


@router.get("/{lote_id}/vendas/")
def listar_vendas_lote(lote_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.listar_vendas_lote(db, lote_id)


@router.get("/vendas/cliente/{cliente_id}/")
def listar_vendas_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return lote_controller.listar_vendas_cliente(db, cliente_id)


@router.put("/vendas/{venda_id}/")
def atualizar_venda(venda_id: int, venda_data: VendaLoteUpdate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.atualizar_venda(db, venda_id, venda_data)


@router.delete("/vendas/{venda_id}/")
def deletar_venda(venda_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.deletar_venda(db, venda_id)


@router.post("/migrar/")
def migrar_lotes_existentes(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.migrar_lotes_existentes(db)


@router.get("/buscar-clientes/{termo}/")
def buscar_clientes(termo: str, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return lote_controller.buscar_clientes(db, termo)


@router.get("/arquivados/")
def listar_lotes_arquivados(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.listar_lotes_arquivados(db)


@router.post("/migrar-producao/")
def migrar_producao(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    """
    Endpoint para executar migração do banco de dados em produção.
    Adiciona colunas numero_lote, status_lote, arquivado e migra lotes existentes.
    """
    try:
        # Verificar se as colunas já existem
        from sqlalchemy import text
        
        # Adicionar coluna numero_lote se não existir
        try:
            db.execute(text("ALTER TABLE lotes ADD COLUMN numero_lote VARCHAR(10) NOT NULL DEFAULT ''"))
            db.commit()
        except Exception:
            pass  # Coluna já existe
        
        # Adicionar coluna status_lote se não existir
        try:
            db.execute(text("ALTER TABLE lotes ADD COLUMN status_lote VARCHAR(50)"))
            db.commit()
        except Exception:
            pass  # Coluna já existe
        
        # Adicionar coluna arquivado se não existir
        try:
            db.execute(text("ALTER TABLE lotes ADD COLUMN arquivado BOOLEAN DEFAULT FALSE"))
            db.commit()
        except Exception:
            pass  # Coluna já existe
        
        # Migrar lotes existentes
        resultado = lote_controller.migrar_lotes_existentes(db)
        
        return {
            "message": "Migração executada com sucesso!",
            "colunas_adicionadas": ["numero_lote", "status_lote", "arquivado"],
            "resultado_migracao": resultado
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro durante a migração: {str(e)}"
        )
