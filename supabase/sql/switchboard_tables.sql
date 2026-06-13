-- Switchboard migration tables
-- Apply via Supabase SQL editor or `supabase db push`.

-- ─── Off-chain cache of verified results ───────────────────────────
create table if not exists public.verified_results (
  id uuid primary key default gen_random_uuid(),
  chain_id integer not null,
  tx_hash text not null,
  winner_address text not null,
  winner_name text not null,
  score numeric not null,
  feed_id text not null,
  switchboard_timestamp bigint not null,
  raw_update jsonb,
  created_at timestamptz not null default now(),
  unique (chain_id, tx_hash)
);

create index if not exists verified_results_winner_idx
  on public.verified_results (winner_address);
create index if not exists verified_results_created_at_idx
  on public.verified_results (created_at desc);

grant select on public.verified_results to anon, authenticated;
grant all on public.verified_results to service_role;

alter table public.verified_results enable row level security;

create policy "verified_results readable by anyone"
  on public.verified_results for select
  to anon, authenticated
  using (true);

create policy "verified_results writable by service role only"
  on public.verified_results for insert
  to service_role
  with check (true);

-- ─── Debug log of Switchboard Function runs ────────────────────────
create table if not exists public.switchboard_function_runs (
  id uuid primary key default gen_random_uuid(),
  function_id text not null,
  feed_id text not null,
  args jsonb,
  result text,
  signature text,
  ok boolean not null default true,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists switchboard_runs_created_at_idx
  on public.switchboard_function_runs (created_at desc);

grant select on public.switchboard_function_runs to authenticated;
grant all on public.switchboard_function_runs to service_role;

alter table public.switchboard_function_runs enable row level security;

create policy "function runs readable by authenticated"
  on public.switchboard_function_runs for select
  to authenticated
  using (true);

create policy "function runs writable by service role only"
  on public.switchboard_function_runs for insert
  to service_role
  with check (true);
