-- ========================================================================
-- SUPABASE PG_CRON SETUP - FILLINGDARTGAME
-- ========================================================================

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: (Optional but Recommended) Set your CRON_SECRET in Supabase
-- Run this once:
-- SELECT set_config('app.cron_secret', 'YOUR_GENERATED_CRON_SECRET_HERE', false);

-- =============================================
-- VERIFY RESULTS BOT (Every 1 minute)
-- =============================================
SELECT cron.schedule(
  'verify-results-bot',
  '*/1 * * * *',   -- every minute
  $$
    SELECT net.http_post(
      url := 'https://fillingdartgame.vercel.app/api/cron/verify-results',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', current_setting('app.cron_secret', true)
      ),
      body := jsonb_build_object('timestamp', now()::text)
    ) as request_id;
  $$
);

-- =============================================
-- DISTRIBUTE REWARDS BOT (Every 5 minutes)
-- =============================================
SELECT cron.schedule(
  'distribute-rewards-bot',
  '*/5 * * * *',   -- every 5 minutes
  $$
    SELECT net.http_post(
      url := 'https://fillingdartgame.vercel.app/api/cron/distribute-rewards',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', current_setting('app.cron_secret', true)
      ),
      body := jsonb_build_object('timestamp', now()::text)
    ) as request_id;
  $$
);

-- =============================================
-- MONITORING QUERIES
-- =============================================

-- View all active cron jobs
SELECT 
  jobid, jobname, schedule, command, active 
FROM cron.job 
WHERE jobname LIKE '%bot%';

-- View last 20 job executions
SELECT 
  jobid, 
  status, 
  return_message, 
  start_time, 
  end_time 
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
