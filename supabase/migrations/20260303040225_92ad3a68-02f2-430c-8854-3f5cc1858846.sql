
-- Cash register sessions (abertura/fechamento de caixa por terminal)
CREATE TABLE public.cash_register_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  terminal_id UUID NOT NULL REFERENCES public.pdv_terminals(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL,
  closed_by UUID,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC,
  expected_balance NUMERIC,
  difference NUMERIC,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cash register movements (sangria, suprimento, vendas)
CREATE TABLE public.cash_register_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.cash_register_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'sale', 'withdrawal', 'deposit', 'refund'
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  description TEXT,
  sale_id UUID REFERENCES public.sales(id),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cash_register_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_register_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies for sessions
CREATE POLICY "Admins can manage cash_register_sessions"
ON public.cash_register_sessions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view cash_register_sessions"
ON public.cash_register_sessions FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- RLS policies for movements
CREATE POLICY "Admins can manage cash_register_movements"
ON public.cash_register_movements FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view cash_register_movements"
ON public.cash_register_movements FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_cash_sessions_terminal ON public.cash_register_sessions(terminal_id);
CREATE INDEX idx_cash_sessions_opened_at ON public.cash_register_sessions(opened_at);
CREATE INDEX idx_cash_movements_session ON public.cash_register_movements(session_id);
CREATE INDEX idx_cash_movements_type ON public.cash_register_movements(type);
