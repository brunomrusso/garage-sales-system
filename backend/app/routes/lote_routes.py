from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import LoteCreate, LoteUpdate, VendaLoteCreate, VendaLoteUpdate, TributoImportacaoCreate, TributoImportacaoUpdate
from app.controllers import lote_controller, permission_controller
from app.core.security import verify_token, verify_admin_token

router = APIRouter(prefix="/api/lotes", tags=["lotes"])


@router.post("/")
def criar_lote(lote_data: LoteCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    # Verificar permissão
    admin_id = current_user.get("user_id")
    permission_controller.require_permission(db, admin_id, "lote_create", "criar lotes")
    return lote_controller.criar_lote(db, lote_data)


@router.get("/")
def listar_lotes(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    from app.core.tenant import TenantContext
    empresa_id = TenantContext.get_tenant_id()
    return lote_controller.listar_lotes(db, empresa_id)


@router.get("/arquivados/")
def listar_lotes_arquivados(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    from app.core.tenant import TenantContext
    empresa_id = TenantContext.get_tenant_id()
    return lote_controller.listar_lotes_arquivados(db, empresa_id)


# ========== TRIBUTOS (antes das rotas dinâmicas /{lote_id}/) ==========

@router.post("/tributos/")
def criar_tributo(data: TributoImportacaoCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    admin_id = current_user.get("user_id")
    permission_controller.require_permission(db, admin_id, "venda_edit", "gerenciar tributos")
    return lote_controller.criar_tributo(db, data)


@router.get("/tributos/")
def listar_tributos(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_token),
    incluir_arquivados: bool = Query(False)
):
    return lote_controller.listar_tributos(db, incluir_arquivados=incluir_arquivados)


@router.get("/tributos/{tributo_id}/")
def obter_tributo(tributo_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.obter_tributo(db, tributo_id)


@router.put("/tributos/{tributo_id}/arquivar/")
def arquivar_tributo(tributo_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    admin_id = current_user.get("user_id")
    permission_controller.require_permission(db, admin_id, "venda_edit", "gerenciar tributos")
    return lote_controller.arquivar_tributo(db, tributo_id)


@router.put("/tributos/{tributo_id}/desarquivar/")
def desarquivar_tributo(tributo_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    admin_id = current_user.get("user_id")
    permission_controller.require_permission(db, admin_id, "venda_edit", "gerenciar tributos")
    return lote_controller.desarquivar_tributo_imp(db, tributo_id)


@router.get("/tributos/rastreio/{rastreio}/")
def obter_tributo_por_rastreio(rastreio: str, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.obter_tributo_por_rastreio(db, rastreio)


@router.get("/tributos/rastreio/{rastreio}/vendas/")
def obter_vendas_tributo(rastreio: str, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.obter_vendas_tributo(db, rastreio)


@router.put("/tributos/{tributo_id}/")
def atualizar_tributo(tributo_id: int, data: TributoImportacaoUpdate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    admin_id = current_user.get("user_id")
    permission_controller.require_permission(db, admin_id, "venda_edit", "gerenciar tributos")
    return lote_controller.atualizar_tributo(db, tributo_id, data)


@router.delete("/tributos/{tributo_id}/")
def deletar_tributo(tributo_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    admin_id = current_user.get("user_id")
    permission_controller.require_permission(db, admin_id, "venda_delete", "deletar tributos")
    return lote_controller.deletar_tributo(db, tributo_id)


# ========== FATURAMENTO ==========

@router.get("/faturamento/")
def obter_faturamento(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.obter_faturamento(db)


# ========== VENDAS ==========

@router.post("/vendas/")
def criar_venda(venda_data: VendaLoteCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    # Verificar permissão
    admin_id = current_user.get("user_id")
    permission_controller.require_permission(db, admin_id, "venda_create", "criar vendas")
    return lote_controller.criar_venda(db, venda_data)


@router.get("/vendas/cliente/{cliente_id}/")
def listar_vendas_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return lote_controller.listar_vendas_cliente(db, cliente_id)


@router.get("/vendas/cliente/{cliente_id}/tributos/")
def obter_tributos_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return lote_controller.obter_tributos_cliente(db, cliente_id)


@router.put("/vendas/{venda_id}/")
def atualizar_venda(venda_id: int, venda_data: VendaLoteUpdate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    # Verificar permissão
    admin_id = current_user.get("user_id")
    permission_controller.require_permission(db, admin_id, "venda_edit", "editar vendas")
    return lote_controller.atualizar_venda(db, venda_id, venda_data)


@router.delete("/vendas/{venda_id}/")
def deletar_venda(venda_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    # Verificar permissão
    admin_id = current_user.get("user_id")
    permission_controller.require_permission(db, admin_id, "venda_delete", "deletar vendas")
    return lote_controller.deletar_venda(db, venda_id)


# ========== UTILIDADES ==========

@router.post("/migrar/")
def migrar_lotes_existentes(db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.migrar_lotes_existentes(db)


@router.get("/buscar-clientes/{termo}/")
def buscar_clientes(termo: str, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return lote_controller.buscar_clientes(db, termo)


# ========== ROTAS DINÂMICAS (devem ficar por último) ==========

@router.get("/{lote_id}/")
def obter_lote(lote_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    return lote_controller.obter_lote(db, lote_id)


@router.put("/{lote_id}/")
def atualizar_lote(lote_id: int, lote_data: LoteUpdate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    # Verificar permissão
    admin_id = current_user.get("user_id")
    permission_controller.require_permission(db, admin_id, "lote_edit", "editar lotes")
    return lote_controller.atualizar_lote(db, lote_id, lote_data)


@router.delete("/{lote_id}/")
def deletar_lote(lote_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    # Verificar permissão
    admin_id = current_user.get("user_id")
    permission_controller.require_permission(db, admin_id, "lote_delete", "deletar lotes")
    return lote_controller.deletar_lote(db, lote_id)


@router.get("/{lote_id}/vendas/")
def listar_vendas_lote(lote_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_token)):
    return lote_controller.listar_vendas_lote(db, lote_id)


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

        # Adicionar colunas de tributos em vendas_lote
        for col_sql in [
            "ALTER TABLE vendas_lote ADD COLUMN cotas NUMERIC(10,2) DEFAULT 1.0",
            "ALTER TABLE vendas_lote ADD COLUMN tributo_pago BOOLEAN DEFAULT FALSE",
            "ALTER TABLE vendas_lote ADD COLUMN comprovante_tributo BYTEA",
            "ALTER TABLE vendas_lote ADD COLUMN data_pagamento_tributo TIMESTAMP",
            "ALTER TABLE lotes ADD COLUMN rastreio_importacao VARCHAR(100)",
        ]:
            try:
                db.execute(text(col_sql))
                db.commit()
            except Exception:
                pass

        # Adicionar coluna arquivado em tributos_importacao
        try:
            db.execute(text("ALTER TABLE tributos_importacao ADD COLUMN arquivado BOOLEAN DEFAULT FALSE"))
            db.commit()
        except Exception:
            pass  # Coluna já existe
        
        # Migrar lotes existentes
        resultado = lote_controller.migrar_lotes_existentes(db)
        
        return {
            "message": "Migração executada com sucesso!",
            "colunas_adicionadas": ["numero_lote", "status_lote", "arquivado", "tributos_importacao.arquivado", "vendas_lote.tributo_pago"],
            "resultado_migracao": resultado
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro durante a migração: {str(e)}"
        )
