-- ============================================================
-- RESET DE DADOS - Apaga todos os dados operacionais
-- MANTÉM: profiles, store_settings
-- ============================================================
-- Execute este script no Supabase Dashboard → SQL Editor

-- 1. Movimentos de caixa (depende de sales e cash_register_sessions)
TRUNCATE TABLE public.cash_register_movements;

-- 2. Itens das vendas (depende de sales e products)
TRUNCATE TABLE public.sale_items;

-- 3. Vendas (depende de cash_register_sessions e pdv_terminals)
TRUNCATE TABLE public.sales;

-- 4. Sessões de caixa (depende de pdv_terminals)
TRUNCATE TABLE public.cash_register_sessions;

-- 5. Movimentações de estoque (depende de products)
TRUNCATE TABLE public.stock_movements;

-- 6. Produtos (depende de categories e suppliers)
TRUNCATE TABLE public.products;

-- 7. Terminais PDV
TRUNCATE TABLE public.pdv_terminals;

-- 8. Categorias
TRUNCATE TABLE public.categories;

-- 9. Fornecedores
TRUNCATE TABLE public.suppliers;

-- ============================================================
-- NÃO apaga: public.profiles, public.store_settings
-- ============================================================
