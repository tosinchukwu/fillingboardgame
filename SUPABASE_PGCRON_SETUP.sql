-- ========================================================================
-- SUPABASE PG_CRON SETUP FOR AUTOMATIC BOT EXECUTION
-- ========================================================================
-- This script enables pg_cron extension in Supabase and schedules
-- your bot functions to run automatically without Vercel Cron limitations

-- Step 1: Enable pg_cron and http extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- Step 2: Verify Results Bot - Runs every 1 minute
SELECT cron.schedule(
  'verify-results-bot',
  '*/1 * * * *',
  $$
    SELECT 
      http_post(
        'https://fillergamedart.vercel.app/api/cron/verify-results',
        jsonb_build_object('timestamp', now()::text)::text,
        'application/json'
      )
  $$
);

-- Step 3: Distribute Rewards Bot - Runs every 5 minutes
SELECT cron.schedule(
  'distribute-rewards-bot',
  '*/5 * * * *',
  $$
    SELECT 
      http_post(
        'https://fillergamedart.vercel.app/api/cron/distribute-rewards',
        jsonb_build_object('timestamp', now()::text)::text,
        'application/json'
      )
  $$
);

-- Step 4: List all scheduled cron jobs
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  database,
  username,
  active
FROM cron.job
WHERE jobname IN ('verify-results-bot', 'distribute-rewards-bot');

-- Step 5: Monitor job execution (view last 20 runs)
-- Run this query to check if jobs are running successfully
SELECT 
  jobid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;

-- Step 6: Delete jobs if needed (uncomment to use)
-- SELECT cron.unschedule('verify-results-bot');
-- SELECT cron.unschedule('distribute-rewards-bot');
