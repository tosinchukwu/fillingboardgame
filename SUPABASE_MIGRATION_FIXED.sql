-- ========================================================================
-- SUPABASE MIGRATION - Circle Wallet Payment System
-- Compatible with existing matches table (match_id TEXT PRIMARY KEY)
-- ========================================================================

-- ========================================================================
-- 1. PAYMENTS TABLE - Track USDC payments for match entry fees
-- ========================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id TEXT NOT NULL REFERENCES public.matches(match_id) ON DELETE CASCADE,
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

-- ========================================================================
-- 2. ESCROW TABLE - Hold pending rewards before bot verification
-- ========================================================================
CREATE TABLE IF NOT EXISTS escrow_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id TEXT NOT NULL REFERENCES public.matches(match_id) ON DELETE CASCADE,
  winner_address VARCHAR(255) NOT NULL,
  runner_up_address VARCHAR(255),
  winner_reward_usdc DECIMAL(18, 6) NOT NULL,
  runner_up_reward_usdc DECIMAL(18, 6),
  chain_id INTEGER NOT NULL,
  escrow_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, verified, released, failed
  verification_time TIMESTAMP WITH TIME ZONE,
  release_time TIMESTAMP WITH TIME ZONE,
  tx_hash_winner VARCHAR(255),
  tx_hash_runner_up VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_match_id ON escrow_rewards(match_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_rewards(escrow_status);
CREATE INDEX IF NOT EXISTS idx_escrow_winner ON escrow_rewards(winner_address);

-- ========================================================================
-- 3. BOT VERIFICATION TABLE - Track automated result verification
-- ========================================================================
CREATE TABLE IF NOT EXISTS bot_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id TEXT NOT NULL UNIQUE REFERENCES public.matches(match_id) ON DELETE CASCADE,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, verified, failed, abandoned
  verified_winner VARCHAR(255),
  verified_runner_up VARCHAR(255),
  on_chain_winner VARCHAR(255),
  supabase_winner VARCHAR(255),
  winner_match_flag BOOLEAN DEFAULT FALSE,
  verification_timestamp TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_verifications_status ON bot_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_bot_verifications_match_id ON bot_verifications(match_id);

-- ========================================================================
-- 4. DEVELOPER SETTINGS TABLE - Store fee configuration & bot settings
-- ========================================================================
CREATE TABLE IF NOT EXISTS developer_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_address VARCHAR(255) NOT NULL UNIQUE,
  entry_fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10.0, -- percentage of tournament collected
  winner_percentage DECIMAL(5, 2) NOT NULL DEFAULT 60.0, -- 60% to winner
  runner_up_percentage DECIMAL(5, 2) NOT NULL DEFAULT 30.0, -- 30% to runner-up
  bot_verification_delay_ms INTEGER NOT NULL DEFAULT 180000, -- 3 minutes
  enable_bot BOOLEAN NOT NULL DEFAULT TRUE,
  escrow_contract_address VARCHAR(255),
  chain_ids INTEGER[] DEFAULT ARRAY[5042002, 11155111, 80002, 1, 137], -- Supported chains
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_settings_address ON developer_settings(developer_address);

-- ========================================================================
-- 5. MATCH ABANDONMENT TRACKING - Handle browser closes & refunds
-- ========================================================================
CREATE TABLE IF NOT EXISTS match_abandonments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id TEXT NOT NULL UNIQUE REFERENCES public.matches(match_id) ON DELETE CASCADE,
  abandoned_by_address VARCHAR(255) NOT NULL,
  opponent_address VARCHAR(255),
  abandoned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refund_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, refunded, failed
  refund_amount_usdc DECIMAL(18, 6),
  chain_id INTEGER,
  tx_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abandonments_match_id ON match_abandonments(match_id);
CREATE INDEX IF NOT EXISTS idx_abandonments_refund_status ON match_abandonments(refund_status);

-- ========================================================================
-- 6. PLAYER BALANCE CACHE - Cache USDC balances by chain (refresh every 5 min)
-- ========================================================================
CREATE TABLE IF NOT EXISTS player_balance_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_address VARCHAR(255) NOT NULL,
  chain_id INTEGER NOT NULL,
  usdc_balance DECIMAL(18, 6) NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_address, chain_id)
);

CREATE INDEX IF NOT EXISTS idx_balance_cache_player ON player_balance_cache(player_address);
CREATE INDEX IF NOT EXISTS idx_balance_cache_chain ON player_balance_cache(chain_id);

-- ========================================================================
-- 7. REWARD DISTRIBUTION LOG - Audit trail for all reward payouts
-- ========================================================================
CREATE TABLE IF NOT EXISTS reward_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id TEXT NOT NULL REFERENCES public.matches(match_id) ON DELETE CASCADE,
  recipient_address VARCHAR(255) NOT NULL,
  reward_type VARCHAR(50) NOT NULL, -- winner, runner_up, refund
  amount_usdc DECIMAL(18, 6) NOT NULL,
  chain_id INTEGER NOT NULL,
  transaction_hash VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, failed
  distributed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rewards_match_id ON reward_distributions(match_id);
CREATE INDEX IF NOT EXISTS idx_rewards_recipient ON reward_distributions(recipient_address);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON reward_distributions(status);

-- ========================================================================
-- 8. INVITE LINKS TABLE - Store shareable private match invites
-- ========================================================================
CREATE TABLE IF NOT EXISTS invite_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id TEXT NOT NULL REFERENCES public.matches(match_id) ON DELETE CASCADE,
  invite_code VARCHAR(20) NOT NULL UNIQUE,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  used_by VARCHAR(255),
  used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_invites_match_id ON invite_links(match_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON invite_links(invite_code);
CREATE INDEX IF NOT EXISTS idx_invites_used_by ON invite_links(used_by);

-- ========================================================================
-- 9. TOURNAMENT CONFIGURATION TABLE - Per-tournament settings
-- ========================================================================
CREATE TABLE IF NOT EXISTS tournament_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id VARCHAR(255) NOT NULL UNIQUE,
  entry_fee_usdc DECIMAL(18, 6) NOT NULL,
  tournament_name VARCHAR(255) NOT NULL,
  description TEXT,
  max_players INTEGER DEFAULT 2,
  chain_ids INTEGER[] DEFAULT ARRAY[5042002, 11155111, 80002], -- Allowed chains
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournament_configs_id ON tournament_configs(tournament_id);

-- ========================================================================
-- 10. ENABLE ROW LEVEL SECURITY (RLS) - Secure database access
-- ========================================================================
-- Players can only see their own payment records
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can view their own payments" ON payments
  FOR SELECT USING (player_address = LOWER(current_user_id::text));

-- Players can only see rewards meant for them
ALTER TABLE escrow_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can view their rewards" ON escrow_rewards
  FOR SELECT USING (
    winner_address = LOWER(current_user_id::text) OR 
    runner_up_address = LOWER(current_user_id::text)
  );

-- Only developer can view/modify their settings
ALTER TABLE developer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Developers can manage their settings" ON developer_settings
  FOR ALL USING (developer_address = LOWER(current_user_id::text));
