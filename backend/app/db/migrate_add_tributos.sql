-- Migration: Add tributo/cotas fields
-- Lote: rastreio_importacao
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS rastreio_importacao VARCHAR(100);

-- VendaLote: cotas, tributo_pago, comprovante_tributo, data_pagamento_tributo
ALTER TABLE vendas_lote ADD COLUMN IF NOT EXISTS cotas NUMERIC(10,2) DEFAULT 1.0;
ALTER TABLE vendas_lote ADD COLUMN IF NOT EXISTS tributo_pago BOOLEAN DEFAULT FALSE;
ALTER TABLE vendas_lote ADD COLUMN IF NOT EXISTS comprovante_tributo BYTEA;
ALTER TABLE vendas_lote ADD COLUMN IF NOT EXISTS data_pagamento_tributo TIMESTAMP;

-- TributoImportacao: arquivado
ALTER TABLE tributos_importacao ADD COLUMN IF NOT EXISTS arquivado BOOLEAN DEFAULT FALSE;
