-- Adicionar coluna de permissões extras em JSON
ALTER TABLE admin_permissions
ADD COLUMN extra_permissions JSONB DEFAULT '{}';
