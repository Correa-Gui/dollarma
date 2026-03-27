-- Migration: CFOP por produto (padrão 5102 = venda de mercadoria adquirida de terceiro, operação interna)
ALTER TABLE products ADD COLUMN IF NOT EXISTS cfop text DEFAULT '5102';
