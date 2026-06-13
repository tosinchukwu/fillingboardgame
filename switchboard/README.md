# Switchboard On-Demand setup (no more "Functions")

Switchboard removed standalone TypeScript Functions. Everything is now a **Feed** = an Oracle Job of pre-defined Tasks (HttpTask, JsonParseTask, math). The oracle quorum runs the Tasks in a TEE and signs the resulting number — exactly the value our `Scoreboard.submitVerifiedResult(updates, winnerName)` call consumes via `ISwitchboard.updateFeeds` + `latestUpdate(feedId)`.

So we keep:
- `contracts/ScoreboardSwitchboard.sol`  (unchanged — already uses the new model)
- `src/lib/switchboard.ts`                (already calls Crossbar)

And we replace the old "upload scoreVerifier.ts to Switchboard" step with:
1. A Supabase edge function that runs the game-replay and returns the packed score as JSON.
2. A Switchboard Feed that hits that endpoint via HttpTask.

## 1. Deploy the edge function

The replay code lives at `supabase/functions/verify-game-result/index.ts`.

```bash
supabase functions deploy verify-game-result --no-verify-jwt
```

`--no-verify-jwt` is required because Switchboard's oracle nodes call it without a Supabase JWT.

Also run the new migration:

```bash
supabase db push
```

This creates `match_hits` (where the frontend POSTs the hit history before requesting verification) and the `verified_results` / `switchboard_function_runs` tables.

## 2. Create the Feed in the Bundle Builder

1. Open https://explorer.switchboardlabs.xyz/feed-builder
2. Click **New Feed → Custom Job**
3. Paste the JSON from `switchboard/FEED_JOB.json` (already templated with your Supabase project ref `owixuzehqiwfrfzitjoe`).
4. Hit **Simulate** with `MATCH_ID=test` after inserting a sample row into `match_hits`. You should see a 78-digit decimal — that's the packed `uint256` the contract expects.
5. Click **Deploy** and pick your chains: Avalanche Fuji, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia (Switchboard On-Demand is **not** live on BSC, Polygon Amoy, or Arc — those chains will fall back to unverified mode in the UI).
6. Copy the resulting **Feed ID** (`bytes32`). The same feed ID works on every EVM chain you selected.

## 3. Wire the Feed ID + Router into the frontend

Edit `src/lib/constants.ts`:

```ts
export const SWITCHBOARD_FEED_ID_MAP: Record<number, `0x${string}`> = {
  [avalancheFuji.id]:   '0x<your-feed-id>',
  [baseSepolia.id]:     '0x<your-feed-id>',
  [arbitrumSepolia.id]: '0x<your-feed-id>',
  [optimismSepolia.id]: '0x<your-feed-id>',
};

export const SWITCHBOARD_ROUTER_MAP: Record<number, `0x${string}`> = {
  // Get current router addresses from https://docs.switchboard.xyz/docs-by-chain/evm
  [avalancheFuji.id]:   '0x<router>',
  [baseSepolia.id]:     '0x<router>',
  [arbitrumSepolia.id]: '0x<router>',
  [optimismSepolia.id]: '0x<router>',
};
```

## 4. Deploy the Scoreboard contract per chain

In your `fillgame` repo:

```bash
forge install OpenZeppelin/openzeppelin-contracts --no-commit
export PRIVATE_KEY=0x...
export SWITCHBOARD_ROUTER=0x...   # per chain
export FEED_ID=0x...               # same on every chain
forge script script/DeployScoreboard.s.sol --rpc-url $RPC_URL --broadcast -vvvv
```

Paste each new address into `VERIFIER_ADDRESS_MAP` in `src/lib/constants.ts`.

## 5. End-to-end flow at runtime

```
Player ends game
     │
     ▼  POST /match_hits  (frontend → Supabase)
     │
     ▼  GET  /updates/evm/:chainId/:feedId?params={MATCH_ID}  (frontend → Crossbar)
     │       (Crossbar oracles call /verify-game-result?matchId=... and sign the result)
     ▼
submitVerifiedResult(encoded[], winnerName)  (frontend → contract, payable)
     │
     ▼ updateFeeds → latestUpdate(feedId) → record packed score
```

Gas: ~110–130k on the on-chain step (vs ~300k for the old Chainlink fulfillRequest).
