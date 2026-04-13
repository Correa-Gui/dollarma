ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receipt_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS receipt_tax_id text,
  ADD COLUMN IF NOT EXISTS printed_at timestamptz;
