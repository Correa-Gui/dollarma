-- Migration: campos fiscais em produtos e itens de venda
ALTER TABLE products ADD COLUMN IF NOT EXISTS ncm text;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS ncm_code text;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS product_sku text;
