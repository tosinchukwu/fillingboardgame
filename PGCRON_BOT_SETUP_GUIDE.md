# Supabase pg_cron Bot Setup Guide

## Overview

Instead of relying on Vercel Cron (limited to once per day on Hobby plan), we'll use **Supabase's built-in `pg_cron` extension** to run your bots directly from your PostgreSQL database.

**Benefits:**
- ✅ Runs as often as needed (every 1-5 minutes)
- ✅ Completely FREE - included with Supabase
- ✅ No Vercel Cron limitations
- ✅ Direct database access - more reliable
- ✅ Built-in monitoring and logging
- ✅ Easy to pause/resume jobs

---

## Step-by-Step Setup

### Step 1: Enable pg_cron in Supabase

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** (in the left sidebar)
3. Click **New Query**
4. Paste this SQL:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;
```

5. Click **Run** (or press `Ctrl+Enter`)
6. You should see: `Query executed successfully`

**What this does:**
- `pg_cron` - Allows PostgreSQL to run scheduled tasks
- `http` - Allows PostgreSQL to make HTTP requests to your bot endpoints

---

### Step 2: Set Your Cron Secret

You need to securely pass your `CRON_SECRET` to the jobs. Run this in SQL Editor:

```sql
ALTER DATABASE postgres SET "app.cron_secret" = 'ucErOKPVJIi9SwmNYVdRT3lMqYRzVkYrZDcvuLJzcNw=';
```

Replace with your actual `CRON_SECRET` value from your `.env.development.local`.

---

### Step 3: Schedule the Bot Jobs

Copy the entire contents of `SUPABASE_PGCRON_SETUP.sql` and run it in Supabase SQL Editor.

This will create two scheduled jobs:

**Job 1: Verify Results**
- Runs every 1 minute
- Calls: `https://fillergamedart.vercel.app/api/cron/verify-results`
- Purpose: Checks completed matches and records verified results

**Job 2: Distribute Rewards**
- Runs every 5 minutes
- Calls: `https://fillergamedart.vercel.app/api/cron/distribute-rewards`
- Purpose: Sends USDC rewards to winners

---

### Step 4: Verify Jobs Are Running

Run this query to see your scheduled jobs:

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname IN ('verify-results-bot', 'distribute-rewards-bot');
```

You should see two rows with `active = true`.

---

## Monitoring Job Execution

### View Recent Job Runs

```sql
SELECT 
  jobid,
  database,
  command,
  status,
  return_message,
  start_time,
  end_time,
  ROUND(EXTRACT(EPOCH FROM (end_time - start_time))::numeric, 2) as duration_seconds
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

**Status values:**
- `succeeded` - Job ran successfully
- `failed` - Job encountered an error
- `running` - Job is currently running
- `timeout` - Job took too long to complete

### View Job Errors

If a job fails, see the error message:

```sql
SELECT 
  jobid,
  jobname,
  status,
  return_message,
  start_time
FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC
LIMIT 10;
```

### Delete a Job (if needed)

```sql
SELECT cron.unschedule('verify-results-bot');
SELECT cron.unschedule('distribute-rewards-bot');
```

---

## Testing the Setup

### Test 1: Manual Bot Call

Before relying on pg_cron, test your bot endpoint manually:

```bash
curl -X POST https://fillergamedart.vercel.app/api/cron/verify-results \
  -H "Content-Type: application/json" \
  -d '{"secret":"ucErOKPVJIi9SwmNYVdRT3lMqYRzVkYrZDcvuLJzcNw="}'
```

Expected response:
```json
{
  "timestamp": "2026-06-14T...",
  "processed": 5,
  "status": "success"
}
```

### Test 2: Check Supabase Logs

After the jobs run, check what data was processed:

```sql
-- See recent payments recorded
SELECT id, player_address, amount, created_at 
FROM payments 
ORDER BY created_at DESC 
LIMIT 10;

-- See recent rewards distributed
SELECT id, winner_address, amount, created_at 
FROM escrow_rewards 
ORDER BY created_at DESC 
LIMIT 10;

-- See recent verified results
SELECT id, match_id, status, created_at 
FROM verified_results 
ORDER BY created_at DESC 
LIMIT 10;
```

### Test 3: Real Game Flow

1. **Connect wallet** on https://fillergamedart.vercel.app
2. **Create a private match** with entry fee
3. **Play the game** and complete it
4. **Wait 1-3 minutes** - verify-results-bot should process it
5. **Wait 5 minutes total** - distribute-rewards-bot should send rewards
6. **Check database** - records should appear in `verified_results` and `escrow_rewards`

---

## Troubleshooting

### Problem: Jobs not running
**Solution:** Check if jobs are `active`:
```sql
SELECT jobname, active FROM cron.job WHERE jobname LIKE '%bot%';
```
If `active = false`, reschedule the job.

### Problem: "HTTP request failed" error
**Solution:** 
- Verify your bot endpoints are accessible: curl the URL manually
- Check `CRON_SECRET` is correctly set in database
- Ensure firewall allows Supabase → Vercel connections

### Problem: "connection refused" error
**Solution:**
- Your Vercel deployment might not be live
- Redeploy: Go to Vercel Dashboard → fillergamedart → Redeploy
- Wait for deployment to complete

### Problem: Jobs running but not processing anything
**Solution:**
- Check your bot logic in `/api/cron/verify-results.ts`
- Add logging to understand what's happening
- Query database to see if there are completed matches:
```sql
SELECT id, status, created_at FROM matches WHERE status = 'completed' ORDER BY created_at DESC LIMIT 5;
```

### Problem: "Extension pg_cron not found"
**Solution:**
- Your Supabase plan might not support pg_cron
- Contact Supabase support or upgrade to Pro plan
- Alternative: Use GitHub Actions instead

---

## Adjusting Job Frequency

### Run verify-results every 30 seconds (instead of 1 minute):
```sql
SELECT cron.unschedule('verify-results-bot');
SELECT cron.schedule(
  'verify-results-bot',
  '*/30 * * * * *',  -- Every 30 seconds
  'SELECT http_post(...)'
);
```

### Run distribute-rewards every 10 minutes (instead of 5):
```sql
SELECT cron.unschedule('distribute-rewards-bot');
SELECT cron.schedule(
  'distribute-rewards-bot',
  '*/10 * * * *',  -- Every 10 minutes
  'SELECT http_post(...)'
);
```

**Cron syntax:**
```
 ┌───────────── minute (0 - 59)
 │ ┌───────────── hour (0 - 23)
 │ │ ┌───────────── day of month (1 - 31)
 │ │ │ ┌───────────── month (1 - 12)
 │ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
 │ │ │ │ │
 │ │ │ │ │
 * * * * *
```

---

## Production Deployment Checklist

- [ ] pg_cron and http extensions enabled
- [ ] CRON_SECRET set in database
- [ ] Both bot jobs scheduled and active
- [ ] Jobs running without errors (check job_run_details)
- [ ] Bot endpoints responding with 200 status
- [ ] Database tables receiving data from bots
- [ ] Tested end-to-end game flow
- [ ] Monitoring query bookmarked for daily checks

---

## Monitoring Queries (Bookmark These)

### Daily Check
```sql
-- Check if jobs ran in last hour
SELECT 
  jobname,
  COUNT(*) as runs,
  COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  MAX(end_time) as last_run
FROM cron.job_run_details
WHERE jobname IN ('verify-results-bot', 'distribute-rewards-bot')
  AND end_time > NOW() - INTERVAL '1 hour'
GROUP BY jobname;
```

### Alert on Failures
```sql
-- Find failed jobs
SELECT 
  jobname,
  status,
  return_message,
  end_time
FROM cron.job_run_details
WHERE status = 'failed'
  AND end_time > NOW() - INTERVAL '24 hours'
ORDER BY end_time DESC;
```

---

## Support

If you encounter issues:

1. **Check Supabase logs:**
   - Supabase Dashboard → Logs → Function Logs
   - Filter for your function names

2. **Check Vercel logs:**
   - Vercel Dashboard → Functions → Logs
   - Look for `/api/cron/*` errors

3. **Test endpoints manually:**
   ```bash
   curl -X POST https://fillergamedart.vercel.app/api/cron/verify-results \
     -H "Content-Type: application/json" \
     -d '{"secret":"your_cron_secret"}'
   ```

4. **Contact support:**
   - Supabase: https://app.supabase.com/support
   - Vercel: https://vercel.com/help
