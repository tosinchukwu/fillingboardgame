# Supabase Setup Guide for Circle Wallet Payment System

## Step 1: Access Your Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project (fillgame)
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"

## Step 2: Run Migration Scripts in Order

Copy each script from `SUPABASE_MIGRATION.sql` into the SQL editor and run them one at a time:

### Script 1: Update matches table with payment fields
- Copy the ALTER TABLE commands
- Click "Run"
- Wait for success

### Script 2: Create payments tracking table
- Paste the CREATE TABLE payments script
- Run it

### Script 3-7: Create remaining tables
- Continue with each CREATE TABLE script
- Run them sequentially

### Script 8: Enable Row Level Security
- Run the RLS policies
- This secures your data so only authorized users/bots can access it

### Script 9: Create views
- These are helpful for querying data
- Safe to run

### Script 10: Create functions
- This helps update player stats automatically
- Safe to run

## Step 3: Verify Tables Were Created

In Supabase, go to "Table Editor" and verify you see:
- payments
- escrow_holds
- bot_verifications
- reward_distributions
- tournament_config
- player_profiles
- cron_jobs

## Step 4: Get Your Supabase Credentials

1. Click "Settings" in the left sidebar
2. Click "API" under Configuration
3. Copy and save:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public** key (in the API tokens section)
   - **service_role** secret key (KEEP THIS SECURE!)

## Step 5: Add to Your Environment Files

### For fillergamedart.vercel.app (.env.local):
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Supabase service role (for bot functions only - KEEP SECRET)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### For fillingame.vercel.app (Registration site - same credentials):
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 6: Test the Connection

Run this in your project:
```bash
npm run dev
```

The app should now connect to Supabase without errors.

## Step 7: Configure Tournament Settings

In Supabase, go to Table Editor:
1. Click on "tournament_config" table
2. Edit the default row:
   - `entry_fee_usdc`: Set your entry fee (e.g., 1.00 for $1 USDC)
   - `winner_reward_percentage`: Set winner's share (e.g., 80 for 80%)
   - `enabled_chains`: Add your supported chains (see list below)

## Supported Chain IDs:

- **80001**: Polygon Mumbai (Testnet)
- **11155111**: Ethereum Sepolia (Testnet)
- **84532**: Base Sepolia (Testnet)
- **421614**: Arbitrum Sepolia (Testnet)
- **1**: Ethereum Mainnet
- **137**: Polygon Mainnet
- **42161**: Arbitrum Mainnet
- **8453**: Base Mainnet

## Step 8: Set Up Vercel Environment Variables

Go to https://vercel.com/dashboard and add these to fillergamedart.vercel.app:

```
VITE_CIRCLE_APP_ID=your_circle_app_id
VITE_CIRCLE_API_URL=https://api.circle.com/v1
CIRCLE_API_KEY=your_circle_api_key_here
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
VITE_ENABLE_UMPIRE_BOT=true
VITE_BOT_VERIFICATION_DELAY=180000
```

## Troubleshooting

### "Column already exists" error
- This means you ran the script twice
- Safe to ignore or delete the table and run again

### "Permission denied" error
- Make sure you're logged in as the project owner
- Try logging out and back in

### Can't see the new tables
- Refresh the page (Ctrl+Shift+R)
- Or click "SQL Editor" → "Refresh"

## Next Steps

Once Supabase is set up, the next phases will handle:
1. Creating the Escrow smart contract
2. Setting up the Vercel Cron bot for result verification
3. Implementing USDC payment collection
4. Distributing rewards automatically

All data will flow through these Supabase tables!
