-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily WhatsApp sales report at 22:00 Brasília (01:00 UTC)
SELECT cron.schedule(
  'whatsapp-daily-report',
  '20 21 * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT 'https://' || current_setting('app.supabase_project_ref', true)
             || '.supabase.co/functions/v1/whatsapp-daily-report'
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.report_internal_secret', true)
    ),
    body := '{}'::jsonb
  )
  $$
);
