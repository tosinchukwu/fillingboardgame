-- ============================================================================
-- CIRCLE WALLET PAYMENT SYSTEM - SUPABASE MIGRATION GUIDE
-- ============================================================================
-- Run these SQL scripts in your Supabase SQL Editor
-- https://app.supabase.com/project/[YOUR_PROJECT_ID]/sql/new
-- 
-- IMPORTANT: Run them in order, one script at a time
-- ============================================================================

-- ============================================================================
-- SCRIPT 1: Update matches table with payment fields
-- ============================================================================
-- If you have an existing matches table, add these columns:

ALTER TABLE matches ADD COLUMN IF NOT EXISTS entry_fee_usdc DECIMAL(18, 6);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS total_entry_fees DECIMAL(18, 6);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending'; -- pending, paid, refunded, escrow_held
ALTER TABLE matches ADD COLUMN IF NOT EXISTS paid_by_addresses TEXT[]; -- Array of player addresses who paid
ALTER TABLE matches ADD COLUMN IF NOT EXISTS payment_chain_id INTEGER; -- Which blockchain the payment was on
ALTER TABLE matches ADD COLUMN IF NOT EXISTS payment_tx_hash VARCHAR(255);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE matches ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_status VARCHAR(50) DEFAULT 'registration'; -- registration, in_progress, completed, disputed

-- ============================================================================
-- SCRIPT 2: Create payments tracking table
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_address VARCHAR(255) NOT NULL,
  amount_usdc DECIMAL(18, 6) NOT NULL,
  chain_id INTEGER NOT NULL,
  transaction_hash VARCHAR(255),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, failed, refunded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(match_id, player_address)
);

CREATE INDEX IF NOT EXISTS idx_payments_match_id ON payments(match_id);
CREATE INDEX IF NOT EXISTS idx_payments_player_address ON payments(player_address);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

-- ============================================================================
-- SCRIPT 3: Create escrow/held funds table
-- ============================================================================

CREATE TABLE IF NOT EXISTS escrow_holds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  amount_usdc DECIMAL(18, 6) NOT NULL,
  chain_id INTEGER NOT NULL,
  reason VARCHAR(255), -- 'player_abandoned', 'bot_verification_pending', 'dispute', 'contract_execution_failed'
  held_by_address VARCHAR(255), -- Address holding the funds (escrow contract address)
  release_to_address VARCHAR(255), -- Where funds should go when released
  status VARCHAR(50) NOT NULL DEFAULT 'held', -- held, released, refunded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  released_at TIMESTAMP WITH TIME ZONE,
  release_reason VARCHAR(255),
  release_tx_hash VARCHAR(255),
  UNIQUE(match_id, chain_id)
);

CREATE INDEX IF NOT EXISTS idx_escrow_match_id ON escrow_holds(match_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_holds(status);
CREATE INDEX IF NOT EXISTS idx_escrow_held_by ON escrow_holds(held_by_address);

-- ============================================================================
-- SCRIPT 4: Create bot verification table
-- ============================================================================

CREATE TABLE IF NOT EXISTS bot_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, verified, failed, disputed
  winner_address VARCHAR(255),
  winner_from_contract VARCHAR(255), -- Winner from on-chain data (fillergamedart)
  winner_from_supabase VARCHAR(255), -- Winner from Supabase data (fillingame)
  score_on_chain VARCHAR(255), -- Score from fillergamedart contract
  verification_delay_ms INTEGER DEFAULT 180000, -- 3 minutes default
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_attempt_count INTEGER DEFAULT 0,
  last_verification_attempt TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id)
);

CREATE INDEX IF NOT EXISTS idx_bot_verifications_match_id ON bot_verifications(match_id);
CREATE INDEX IF NOT EXISTS idx_bot_verifications_status ON bot_verifications(verification_status);

-- ============================================================================
-- SCRIPT 5: Create rewards distribution table
-- ============================================================================

CREATE TABLE IF NOT EXISTS reward_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_address VARCHAR(255) NOT NULL,
  reward_amount_usdc DECIMAL(18, 6) NOT NULL,
  reward_percentage DECIMAL(5, 2), -- e.g., 50 for 50% of entry fees
  chain_id INTEGER NOT NULL,
  distribution_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, distributed, failed, disputed
  transaction_hash VARCHAR(255),
  distributed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, player_address)
);

CREATE INDEX IF NOT EXISTS idx_rewards_match_id ON reward_distributions(match_id);
CREATE INDEX IF NOT EXISTS idx_rewards_player_address ON reward_distributions(player_address);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON reward_distributions(distribution_status);

-- ============================================================================
-- SCRIPT 6: Create developer configuration table
-- ============================================================================

CREATE TABLE IF NOT EXISTS tournament_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_name VARCHAR(255) NOT NULL UNIQUE,
  entry_fee_usdc DECIMAL(18, 6) NOT NULL DEFAULT 1.00,
  winner_reward_percentage DECIMAL(5, 2) NOT NULL DEFAULT 80, -- 80% goes to winner
  runner_up_reward_percentage DECIMAL(5, 2) DEFAULT 20, -- 20% to runner-up (optional)
  enabled_chains INTEGER[] NOT NULL DEFAULT '{80001}', -- Array of chain IDs where this config is active
  bot_verification_delay_ms INTEGER DEFAULT 180000, -- 3 minutes
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournament_config_enabled ON tournament_config(enabled);

-- Insert default configuration for testnet
INSERT INTO tournament_config (config_name, entry_fee_usdc, winner_reward_percentage, enabled_chains)
VALUES ('testnet_default', 1.00, 80, '{80001, 11155111}')
ON CONFLICT (config_name) DO UPDATE SET updated_at = NOW();

-- ============================================================================
-- SCRIPT 7: Create player wallet profiles table
-- ============================================================================

CREATE TABLE IF NOT EXISTS player_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(255) NOT NULL UNIQUE,
  circle_user_id VARCHAR(255),
  total_matches_played INTEGER DEFAULT 0,
  total_matches_won INTEGER DEFAULT 0,
  total_usdc_earned DECIMAL(18, 6) DEFAULT 0,
  total_usdc_spent DECIMAL(18, 6) DEFAULT 0,
  preferred_chain_id INTEGER,
  account_status VARCHAR(50) DEFAULT 'active', -- active, suspended, banned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_match_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_profiles_wallet ON player_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_player_profiles_status ON player_profiles(account_status);

-- ============================================================================
-- SCRIPT 8: Enable Row Level Security (RLS) - IMPORTANT FOR SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

-- Allow service role (bot and server) to access all data
CREATE POLICY "Service role can read all payments" ON payments
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert payments" ON payments
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update payments" ON payments
  FOR UPDATE USING (auth.role() = 'service_role');

-- Repeat similar policies for other tables
CREATE POLICY "Service role can manage escrow" ON escrow_holds
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage bot_verifications" ON bot_verifications
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage reward_distributions" ON reward_distributions
  FOR ALL USING (auth.role() = 'service_role');

-- Players can read their own profile
CREATE POLICY "Players can read own profile" ON player_profiles
  FOR SELECT USING (wallet_address = current_user_id());

-- Tournament config is public (read-only for all)
CREATE POLICY "Tournament config is public" ON tournament_config
  FOR SELECT USING (TRUE);

-- ============================================================================
-- SCRIPT 9: Create useful views for querying
-- ============================================================================

-- View to get match status with payment info
CREATE OR REPLACE VIEW match_payment_status AS
SELECT 
  m.id as match_id,
  m.match_type,
  m.entry_fee_usdc,
  COUNT(p.id) as payments_received,
  COUNT(DISTINCT CASE WHEN p.payment_status = 'confirmed' THEN p.player_address END) as players_paid,
  SUM(CASE WHEN p.payment_status = 'confirmed' THEN p.amount_usdc ELSE 0 END) as total_paid,
  m.payment_status,
  m.match_status,
  m.created_at
FROM matches m
LEFT JOIN payments p ON m.id = p.match_id
GROUP BY m.id, m.match_type, m.entry_fee_usdc, m.payment_status, m.match_status, m.created_at;

-- View to get escrow analysis
CREATE OR REPLACE VIEW escrow_analysis AS
SELECT 
  chain_id,
  status,
  COUNT(*) as escrow_count,
  SUM(amount_usdc) as total_held_amount,
  AVG(amount_usdc) as avg_held_amount
FROM escrow_holds
GROUP BY chain_id, status;

-- View to get player earnings
CREATE OR REPLACE VIEW player_earnings AS
SELECT 
  player_address,
  COUNT(DISTINCT match_id) as matches_won,
  SUM(reward_amount_usdc) as total_earned,
  AVG(reward_amount_usdc) as avg_reward,
  MAX(distributed_at) as last_reward_date
FROM reward_distributions
WHERE distribution_status = 'distributed'
GROUP BY player_address;

-- ============================================================================
-- SCRIPT 10: Create function for updating player stats
-- ============================================================================

CREATE OR REPLACE FUNCTION update_player_stats(p_wallet_address VARCHAR(255))
RETURNS void AS $$
BEGIN
  UPDATE player_profiles
  SET 
    total_matches_won = (
      SELECT COUNT(DISTINCT rd.match_id)
      FROM reward_distributions rd
      WHERE rd.player_address = p_wallet_address AND rd.distribution_status = 'distributed'
    ),
    total_usdc_earned = (
      SELECT COALESCE(SUM(rd.reward_amount_usdc), 0)
      FROM reward_distributions rd
      WHERE rd.player_address = p_wallet_address AND rd.distribution_status = 'distributed'
    ),
    total_usdc_spent = (
      SELECT COALESCE(SUM(p.amount_usdc), 0)
      FROM payments p
      WHERE p.player_address = p_wallet_address AND p.payment_status = 'confirmed'
    ),
    updated_at = NOW()
  WHERE wallet_address = p_wallet_address;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FINAL: Create Vercel Cron function trigger table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cron_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name VARCHAR(255) NOT NULL UNIQUE,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO cron_jobs (job_name, next_run)
VALUES 
  ('verify_match_results', NOW() + INTERVAL '1 minute'),
  ('distribute_rewards', NOW() + INTERVAL '1 minute'),
  ('release_escrow_funds', NOW() + INTERVAL '1 minute')
ON CONFLICT (job_name) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- All tables are now ready for the Circle Wallet payment system!
-- Next steps:
-- 1. Save your SUPABASE_URL and SUPABASE_KEY in environment variables
-- 2. Update your .env files with Circle credentials
-- 3. Deploy the Vercel Cron functions for bot verification and reward distribution
