
CREATE TABLE public.store_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name text NOT NULL DEFAULT 'Minha Loja',
  cnpj text,
  address text,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  currency text NOT NULL DEFAULT 'BRL',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view settings"
  ON public.store_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage settings"
  ON public.store_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Insert default row
INSERT INTO public.store_settings (store_name) VALUES ('Minha Loja');

-- Add updated_at trigger
CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
