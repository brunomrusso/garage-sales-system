-- Fix admin master role
-- Update the user with ID 1 to have admin_master role
UPDATE clientes 
SET role = 'admin_master', ativo = TRUE 
WHERE id = 1;
