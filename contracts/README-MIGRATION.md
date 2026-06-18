# Filling Game — Chainlink → Switchboard Migration

This folder is mirrored into your contracts repo
(`github.com/tosinchukwu/fillgame`). It contains everything needed to
replace the existing Chainlink-Functions-powered Scoreboard with a
Switchboard On-Demand version, while keeping the frontend ABI shape
backwards-compatible.

## What's in this folder

| File                         | Purpose                                                |
| ---------------------------- | ------------------------------------------------------ |
| `ScoreboardSwitchboard.sol`  | New verifier. Replaces `FillingGameScoreboard`.        |
| `script/DeployScoreboard.s.sol` | Foundry deploy script with per-chain router addrs.  |
| `README-MIGRATION.md`        | This document.                                         |

The off-chain Switchboard Function source lives in `switchboard/scoreVerifier.ts`
in the **frontend repo (`fillingdartgame`)** — upload it to Switchboard once and
reference the resulting feed id from every chain's deployment.

## Why this is cheaper than Chainlink Functions

| Cost source                      | Chainlink Functions          | Switchboard On-Demand          |
| -------------------------------- | ---------------------------- | ------------------------------ |
| Subscription / pre-fund          | LINK subscription per chain  | None — pull-based, pay per tx  |
| Callback gas (worst case)        | ~150k callback + ~250k req   | ~80–120k single tx             |
| Bytecode of base contract        | `FunctionsClient` (~1.2 KB)  | None — verifier reads a router |
| Off-chain compute settlement     | DON callback (async)         | TEE-signed pull (sync)         |

In practice this halves the gas cost of recording a verified score and
removes all LINK admin overhead from your ops.

## Step-by-step migration

> Run all of this from the `fillgame` contracts repo unless stated otherwise.

### 1. Add dependencies (Foundry)

```bash
forge install switchboard-xyz/evm-on-demand --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

Add the remapping to `remappings.txt`:

```text
@switchboard-xyz/on-demand-solidity/=lib/evm-on-demand/src/
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
```

> The new `ScoreboardSwitchboard.sol` inlines a minimal `ISwitchboard`
> interface, so the only hard dependency is OpenZeppelin. The remapping
> above is still recommended if you want to pull the official interface
> directly.

### 2. Drop in the new contract

Copy `contracts/ScoreboardSwitchboard.sol` into `src/` (or wherever your
Foundry sources live). Delete the old `FillingGameScoreboard.sol` that
imports `FunctionsClient`.

### 3. Publish the Switchboard Function

1. Sign in to https://app.switchboard.xyz.
2. Create a new **Function** (EVM) and upload
   `fillingdartgame/switchboard/scoreVerifier.ts` as the source.
3. Save the resulting **feed id** (`bytes32`). You'll use the SAME feed id
   on every chain you deploy to.
4. Note the **Switchboard router address** for each target chain — see
   https://docs.switchboard.xyz/docs-by-chain/evm for the current list.

### 4. Deploy per chain

`script/DeployScoreboard.s.sol` ships with placeholders. Edit the
`getConfig` function for each chain id, then:

```bash
export PRIVATE_KEY=0x...
forge script script/DeployScoreboard.s.sol \
  --rpc-url $RPC_URL \
  --broadcast --verify -vvvv
```

Record each deployed address — you'll paste them into
`fillingdartgame/src/lib/constants.ts` under `VERIFIER_ADDRESS_MAP`.

### 5. Wire the frontend

Inside `fillingdartgame`:

1. Update `VERIFIER_ADDRESS_MAP` with the new Scoreboard addresses.
2. Update `SWITCHBOARD_ROUTER_MAP` with the canonical router per chain.
3. Set `SWITCHBOARD_FEED_ID_MAP[chainId]` to the feed id from step 3.

Everything else in the frontend already uses the new code paths via
`src/lib/switchboard.ts`. No manual UI changes needed.

### 6. (Optional) Sunset the Tournament dependency

The Tournament contract never imported Chainlink, so it's unchanged. If
you want to also migrate it to consume Switchboard prices/randomness in
the future, the same `ISwitchboard` pattern applies.

## Verifying gas savings locally

```bash
forge test --gas-report --match-contract ScoreboardSwitchboardTest
```

Target: `submitVerifiedResult` < 120k gas (vs ~300k for the old
Chainlink `fulfillRequest`).

## Rollback plan

The old `VERIFIER_ADDRESS_MAP` values remain valid for reads. If a
deployed Switchboard Scoreboard misbehaves on any chain, you can:

1. Revert that chain's `VERIFIER_ADDRESS_MAP` entry to the previous
   Chainlink-era address.
2. The frontend will fall back to reading from the old contract.
3. Submissions are disabled because the Chainlink call site is gone —
   but the read-only `Verified History` panel keeps working.
