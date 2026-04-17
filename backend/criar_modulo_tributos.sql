-- SQL para criar o módulo tributos e habilitar para a empresa padrão

-- 1. Criar o módulo tributos se não existir
INSERT INTO modulos (codigo, nome, descricao, icone, categoria, obrigatorio, dependencias)
VALUES ('tributos', 'Gestão de Tributos', 'Controle de tributos de importação e rateio por cliente', 'Receipt', 'core', false, '["core"]'::json)
ON CONFLICT (codigo) DO NOTHING;

-- 2. Habilitar o módulo tributos para todas as empresas existentes
INSERT INTO empresa_modulo (empresa_id, modulo_id, habilitado, config)
SELECT e.id, m.id, true, '{}'::jsonb
FROM empresas e
CROSS JOIN modulos m
WHERE m.codigo = 'tributos'
AND NOT EXISTS (
    SELECT 1 FROM empresa_modulo em
    WHERE em.empresa_id = e.id AND em.modulo_id = m.id
);
