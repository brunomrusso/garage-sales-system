-- Convert admin@garagesales.com to admin_master
UPDATE clientes 
SET role = 'admin_master', ativo = TRUE 
WHERE email = 'admin@garagesales.com';

-- Initialize admin_master permissions
DELETE FROM admin_permissions 
WHERE admin_id = (SELECT id FROM clientes WHERE email = 'admin@garagesales.com');

INSERT INTO admin_permissions (
    admin_id,
    cliente_view, cliente_create, cliente_edit, cliente_delete, cliente_reset_pwd,
    lote_view, lote_create, lote_edit, lote_delete, lote_archive,
    venda_view, venda_create, venda_edit, venda_delete, venda_change_status, venda_mark_paid,
    admin_manage_perms, admin_view_audit,
    max_deletes_per_day,
    data_criacao, data_atualizacao
)
SELECT 
    id,
    TRUE, TRUE, TRUE, TRUE, TRUE,
    TRUE, TRUE, TRUE, TRUE, TRUE,
    TRUE, TRUE, TRUE, TRUE, TRUE, TRUE,
    TRUE, TRUE,
    0,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM clientes 
WHERE email = 'admin@garagesales.com'
AND NOT EXISTS (
    SELECT 1 FROM admin_permissions 
    WHERE admin_id = clientes.id
);
