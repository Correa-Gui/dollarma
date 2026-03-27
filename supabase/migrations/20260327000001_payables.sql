-- Migration: contas a pagar
CREATE TABLE payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  number text,
  issued_at date NOT NULL DEFAULT CURRENT_DATE,
  due_at date NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  description text,
  status text NOT NULL DEFAULT 'pending', -- pending | paid | cancelled
  paid_at date,
  paid_amount numeric(12,2),
  installment boolean NOT NULL DEFAULT false,
  installment_count int NOT NULL DEFAULT 1,
  installment_current int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated can manage payables" ON payables FOR ALL TO authenticated USING (true) WITH CHECK (true);
