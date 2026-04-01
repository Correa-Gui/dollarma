-- Fix: expandir políticas RLS para todos os usuários autenticados gerenciarem produtos,
-- categorias e fornecedores. A política anterior restringia apenas a 'admin',
-- bloqueando qualquer usuário com role diferente (ex: cashier, manager, stock).

-- Products
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Authenticated users can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Authenticated users can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Suppliers
DROP POLICY IF EXISTS "Admins can manage suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can manage suppliers"
  ON public.suppliers FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated');
