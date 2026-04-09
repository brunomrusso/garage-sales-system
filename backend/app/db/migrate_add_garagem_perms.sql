-- Adicionar colunas de permissões de garagem e aprovação de admins
ALTER TABLE admin_permissions
ADD COLUMN garagem_view BOOLEAN DEFAULT FALSE,
ADD COLUMN garagem_edit BOOLEAN DEFAULT FALSE,
ADD COLUMN garagem_foto_upload BOOLEAN DEFAULT FALSE,
ADD COLUMN admin_approve_admins BOOLEAN DEFAULT FALSE;
