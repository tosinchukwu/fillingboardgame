## SUPABASE SCHEMA UPDATES REQUIRED

You mentioned you already have Supabase set up. Here are the tables and columns we need to ADD or MODIFY to support Circle Wallet + USDC Payments + Automated Bot:

### 1. MATCHES TABLE (Modify existing)
```sql
-- Add these columns to your existing matches table if not present:
ALTER TABLE matches ADD COLUMN IF NOT EXISTS (
  -- Entry fee configuration
  entry_fee_usdc NUMERIC(20, 6) DEFAULT 0,           -- Entry fee in USDC (e.g., 10.50)
  currency_chain INT DEFAULT 137,                     -- Which chain the fee is in (137 = Polygon)
  
  -- Payment tracking
  payment_status VARCHAR(20) DEFAULT 'pending',       -- pending, paid, failed, refunded
  payment_tx_hash VARCHAR(255),                       -- Transaction hash for payment
  payer_address VARCHAR(255),                         -- Address that paid the entry fee
  payment_timestamp TIMESTAMPTZ,                      -- When payment was made
  
  -- Match result & rewards
  match_result_status VARCHAR(20) DEFAULT 'pending',  -- pending, completed, disputed
  bot_verified_winner VARCHAR(255),                   -- Address verified by bot as winner
  bot_verification_timestamp TIMESTAMPTZ,             -- When bot verified result
  escrow_tx_hash VARCHAR(255),                        -- Smart contract escrow tx hash
  
  -- Game data for verification
  game_state JSONB,                                   -- Full game state JSON for verification
  player1_final_score INT,
  player2_final_score INT,
  match_duration_seconds INT,                        -- How long match took
  
  -- Webhook/Bot tracking
  bot_processed BOOLEAN DEFAULT FALSE,                -- Has bot processed this?
  bot_retry_count INT DEFAULT 0,                      -- Failed attempts
  bot_last_retry TIMESTAMPTZ,                         -- Last time bot tried
  bot_error_message TEXT                              -- If bot failed, why?
);

-- Create indexes for bot queries
CREATE INDEX IF NOT EXISTS idx_matches_bot_pending ON matches(match_result_status, bot_processed) 
  WHERE match_result_status = 'completed' AND bot_processed = FALSE;
```

### 2. NEW TABLE: TOURNAMENT_FEES (Developer-configurable fees)
```sql
CREATE TABLE IF NOT EXISTS tournament_fees (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Configuration
  tournament_id BIGINT NOT NULL,
  chain_id INT NOT NULL,
  entry_fee_usdc NUMERIC(20, 6) NOT NULL,            -- Entry fee per player (e.g., 10)
  winner_percentage NUMERIC(5, 2) DEFAULT 50,        -- % of entry fees winner gets (50 = 50%)
  escrow_contract_address VARCHAR(255),               -- Deployed escrow contract for this tournament
  enabled BOOLEAN DEFAULT TRUE,
  
  UNIQUE(tournament_id, chain_id)
);
```

### 3. NEW TABLE: PAYMENT_RECORDS (Audit trail)
```sql
CREATE TABLE IF NOT EXISTS payment_records (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Transaction info
  tx_hash VARCHAR(255) NOT NULL UNIQUE,
  chain_id INT NOT NULL,
  from_address VARCHAR(255) NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  amount_usdc NUMERIC(20, 6) NOT NULL,
  
  -- Context
  match_id BIGINT REFERENCES matches(id),
  transaction_type VARCHAR(50),                       -- 'entry_fee', 'reward_distribution', 'refund'
  status VARCHAR(20) DEFAULT 'pending',               -- pending, confirmed, failed
  
  -- Verification
  block_number BIGINT,
  confirmed_at TIMESTAMPTZ
);
```

### 4. NEW TABLE: BOT_VERIFICATION_LOGS (Debug & audit)
```sql
CREATE TABLE IF NOT EXISTS bot_verification_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Match info
  match_id BIGINT NOT NULL REFERENCES matches(id),
  
  -- Verification details
  verification_status VARCHAR(20),                    -- started, completed, failed, skipped
  game_data_received BOOLEAN,                         -- Did we get game state?
  winner_address_verified VARCHAR(255),               -- Address we verified as winner
  verification_method VARCHAR(50),                    -- 'on_chain_check', 'supabase_check'
  
  -- Result
  verification_passed BOOLEAN,
  error_message TEXT,
  retry_count INT,
  
  -- Reward distribution
  reward_amount USDC NUMERIC(20, 6),
  reward_tx_hash VARCHAR(255)
);
```

### 5. NEW TABLE: ESCROW_TRANSACTIONS (Smart contract tracking)
```sql
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Contract transaction
  contract_address VARCHAR(255) NOT NULL,
  tx_hash VARCHAR(255) NOT NULL UNIQUE,
  chain_id INT NOT NULL,
  
  -- Money movement
  from_address VARCHAR(255) NOT NULL,
  amount_usdc NUMERIC(20, 6) NOT NULL,
  recipient_address VARCHAR(255),                     -- Who receives the reward
  
  -- Match context
  match_id BIGINT REFERENCES matches(id),
  transaction_type VARCHAR(50),                       -- 'deposit', 'release', 'refund'
  status VARCHAR(20) DEFAULT 'pending',               -- pending, executed, failed
  
  -- Release info (for disputed matches)
  released_by_address VARCHAR(255),                   -- Dev wallet that released funds
  released_at TIMESTAMPTZ,
  release_reason TEXT
);

CREATE INDEX idx_escrow_status ON escrow_transactions(status, created_at DESC);
CREATE INDEX idx_escrow_match ON escrow_transactions(match_id);
```

---

## HOW TO APPLY THESE CHANGES

You have two options:

### Option 1: SQL Editor (Recommended)
1. Go to your Supabase project
2. Click "SQL Editor" → "New Query"
3. Copy each CREATE TABLE statement above
4. Run them one by one
5. Verify tables appear in "Table Editor"

### Option 2: Supabase CLI
```bash
# Create a migration file
supabase migration new add_circle_payment_tables

# Edit the generated file in migrations/
# Paste the SQL above

# Run migrations
supabase migration up
```

---

## IMPORTANT: Which tables do you already have?

Before I proceed with building Phase 2 & 3, please confirm:

1. Does your current Supabase have a `matches` table? ✓/✗
2. What columns does it currently have?
3. Do you have any existing payment/transaction tracking tables?
4. Can you access Supabase SQL editor to run the above queries?

Once you confirm, I'll continue with:
- Escrow Smart Contract (Phase 3)
- Vercel Cron Bot (Phase 4)
- NFT integration (Phase 5)

Show me the structure of your current `matches` table, and I'll tell you exactly which columns to add.
