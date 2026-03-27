-- Migration: tabela de log de auditoria
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text,
  entity_name text,
  action text NOT NULL,
  user_id uuid,
  user_name text,
  changes jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated can read audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can insert audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
