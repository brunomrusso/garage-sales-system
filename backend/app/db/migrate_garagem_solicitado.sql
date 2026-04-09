-- Add solicitado and data_solicitacao fields to fotos_garagem table
ALTER TABLE fotos_garagem 
ADD COLUMN solicitado BOOLEAN DEFAULT FALSE,
ADD COLUMN data_solicitacao TIMESTAMP NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_fotos_garagem_solicitado ON fotos_garagem(solicitado);
CREATE INDEX IF NOT EXISTS idx_fotos_garagem_cliente_solicitado ON fotos_garagem(cliente_id, solicitado);
