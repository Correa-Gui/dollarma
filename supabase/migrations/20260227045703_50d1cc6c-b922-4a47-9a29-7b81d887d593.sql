
-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES public.categories(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view categories" ON public.categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Suppliers
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text,
  contact text,
  phone text,
  email text,
  avg_delivery_days int DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  barcode text UNIQUE,
  name text NOT NULL,
  category_id uuid REFERENCES public.categories(id),
  supplier_id uuid REFERENCES public.suppliers(id),
  cost_price numeric(12,2) NOT NULL DEFAULT 0,
  sale_price numeric(12,2) NOT NULL DEFAULT 0,
  stock_quantity int NOT NULL DEFAULT 0,
  min_stock int NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'un',
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  promo_price numeric(12,2),
  promo_start date,
  promo_end date,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_sku ON public.products(sku);

-- PDV Terminals
CREATE TABLE public.pdv_terminals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT ('tk_live_' || substr(md5(random()::text), 1, 12)),
  status text NOT NULL DEFAULT 'offline',
  last_sync timestamptz,
  sync_interval_min int NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pdv_terminals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view terminals" ON public.pdv_terminals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage terminals" ON public.pdv_terminals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Sales
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number serial,
  terminal_id uuid REFERENCES public.pdv_terminals(id),
  origin text NOT NULL DEFAULT 'pdv',
  payment_method text NOT NULL DEFAULT 'dinheiro',
  total numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  cancel_reason text,
  created_by uuid,
  sold_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view sales" ON public.sales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage sales" ON public.sales FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Sale Items
CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  subtotal numeric(12,2) NOT NULL DEFAULT 0
);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view sale_items" ON public.sale_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage sale_items" ON public.sale_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Stock Movements
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  type text NOT NULL,
  quantity int NOT NULL,
  previous_qty int NOT NULL DEFAULT 0,
  new_qty int NOT NULL DEFAULT 0,
  reason text,
  origin text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view movements" ON public.stock_movements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage movements" ON public.stock_movements FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Allow PDV token-based inserts on sales (service role will be used in edge functions)
