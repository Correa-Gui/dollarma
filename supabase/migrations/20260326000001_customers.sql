-- Migration: tabela de clientes e vínculo com vendas
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cpf text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sales ADD COLUMN customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated can manage customers" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
