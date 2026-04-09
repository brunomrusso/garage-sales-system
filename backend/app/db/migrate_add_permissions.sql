-- Migration: Add permission and audit tables
-- This script adds tables for admin permissions and audit logging

-- Create admin_permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    
    -- Cliente permissions
    cliente_view BOOLEAN DEFAULT TRUE,
    cliente_create BOOLEAN DEFAULT FALSE,
    cliente_edit BOOLEAN DEFAULT FALSE,
    cliente_delete BOOLEAN DEFAULT FALSE,
    cliente_reset_pwd BOOLEAN DEFAULT FALSE,
    
    -- Lote permissions
    lote_view BOOLEAN DEFAULT TRUE,
    lote_create BOOLEAN DEFAULT FALSE,
    lote_edit BOOLEAN DEFAULT FALSE,
    lote_delete BOOLEAN DEFAULT FALSE,
    lote_archive BOOLEAN DEFAULT FALSE,
    
    -- Venda permissions
    venda_view BOOLEAN DEFAULT TRUE,
    venda_create BOOLEAN DEFAULT FALSE,
    venda_edit BOOLEAN DEFAULT FALSE,
    venda_delete BOOLEAN DEFAULT FALSE,
    venda_change_status BOOLEAN DEFAULT FALSE,
    venda_mark_paid BOOLEAN DEFAULT FALSE,
    
    -- Admin permissions
    admin_manage_perms BOOLEAN DEFAULT FALSE,
    admin_view_audit BOOLEAN DEFAULT FALSE,
    
    -- Daily limits
    max_deletes_per_day INTEGER DEFAULT 0,
    
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(admin_id)
);

-- Create lote_permissions table
CREATE TABLE IF NOT EXISTS lote_permissions (
    id SERIAL PRIMARY KEY,
    lote_id INTEGER NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
    admin_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    criador BOOLEAN DEFAULT FALSE,
    pode_editar BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(50) NOT NULL,
    entidade_id INTEGER,
    descricao TEXT,
    dados_antes JSONB,
    dados_depois JSONB,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    resultado VARCHAR(20) DEFAULT 'sucesso',
    mensagem_erro TEXT,
    data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_permissions_admin_id ON admin_permissions(admin_id);
CREATE INDEX IF NOT EXISTS idx_lote_permissions_lote_id ON lote_permissions(lote_id);
CREATE INDEX IF NOT EXISTS idx_lote_permissions_admin_id ON lote_permissions(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entidade ON audit_logs(entidade);
CREATE INDEX IF NOT EXISTS idx_audit_logs_data_acao ON audit_logs(data_acao);
CREATE INDEX IF NOT EXISTS idx_audit_logs_acao ON audit_logs(acao);
