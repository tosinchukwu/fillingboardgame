/**
 * Switchboard On-Demand client helper for fillingdartgame.
 *
 * Replaces Chainlink Functions for off-chain game-replay verification.
 *
 * Flow:
 *  1. Client builds a JSON payload (full hit history + winner address + name).
 *  2. We call Switchboard's Crossbar API to ask the oracle quorum to run our
 *     published Switchboard Function (game replay) and sign the packed result.
 *  3. Crossbar returns `encodedUpdates[]` — the verifiable bytes that the
 *     on-chain Scoreboard contract will hand to `ISwitchboard.updateFeeds`.
 *  4. The frontend submits those `encodedUpdates[]` together with the winner
 *     metadata to `Scoreboard.submitVerifiedResult` (payable, fee covers TEE).
 *
 * Gas profile vs Chainlink Functions:
 *   - No LINK subscription, no callback gas funding.
 *   - Single tx settlement (~80–120k gas) vs request+callback (~250–350k).
 */

import {
  SWITCHBOARD_FEED_ID_MAP,
  SWITCHBOARD_CROSSBAR_URL,
} from './constants';

export interface ReplayPayload {
  hitHistory: unknown[];
  winnerName: string;
  winnerAddress: string;
  /** Supabase match_id — substituted into {MATCH_ID} in the Feed's HttpTask URL. */
  matchId: string;
}

export interface SwitchboardUpdateBundle {
  /** Verifiable, signed update bytes to pass to `submitVerifiedResult`. */
  encodedUpdates: `0x${string}`[];
  /** The Switchboard feed id used (per chain). */
  feedId: `0x${string}`;
  /** Packed result the oracle attested to. Useful for UI before tx confirms. */
  packedResult?: bigint;
}

/**
 * Request a signed update from Switchboard for the given chain.
 *
 * Falls back to throwing a clear error so the caller can surface a toast.
 */
export async function fetchVerifiedUpdate(
  chainId: number,
  payload: ReplayPayload,
): Promise<SwitchboardUpdateBundle> {
  const feedId = SWITCHBOARD_FEED_ID_MAP[chainId];
  if (!feedId || feedId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error(
      `Switchboard feed not configured for chainId ${chainId}. ` +
      `Create a Function feed at app.switchboard.xyz and add its id to SWITCHBOARD_FEED_ID_MAP.`,
    );
  }

  // Crossbar v2 update endpoint — passes MATCH_ID as a query param so the
  // oracle nodes substitute it into {MATCH_ID} in the Feed's HttpTask URL.
  const base = SWITCHBOARD_CROSSBAR_URL.replace(/\/$/, '');
  const url = new URL(`${base}/v2/update/${feedId}`);
  url.searchParams.set('chain', 'evm');
  url.searchParams.set('network', chainId === 421614 ? 'testnet' : 'mainnet');
  url.searchParams.set('use_timestamp', 'true');
  url.searchParams.set('MATCH_ID', payload.matchId);

  const res = await fetch(url.toString());

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Switchboard Crossbar HTTP ${res.status}: ${body || res.statusText}`);
  }

  const json = (await res.json()) as {
    feeds?: Array<{
      encoded?: string[];
      results?: string[];
      receipts?: unknown;
    }>;
    error?: string;
  };

  if (json.error) {
    throw new Error(`Switchboard oracle error: ${json.error}`);
  }

  const feed = json.feeds?.[0];
  const rawEncoded = feed?.encoded;

  if (!rawEncoded || rawEncoded.length === 0) {
    throw new Error('Switchboard returned no signed updates — ensure the feed account is created on-chain at ondemand.switchboard.xyz.');
  }

  const encodedUpdates = rawEncoded.map((u) =>
    (u.startsWith('0x') ? u : `0x${u}`) as `0x${string}`,
  );

  // v2 API doesn't return a top-level result — packedResult comes back
  // after the on-chain updateFeeds + latestUpdate call instead.
  return {
    encodedUpdates,
    feedId,
    packedResult: undefined,
  };
}

/**
 * Decode the packed uint256 result the oracle signs.
 * Layout matches `switchboard/scoreVerifier.ts`:
 *   [248..255]: winner (0, 1, or 255 = none)
 *   [128..159]: score0 * 10
 *   [0..31]:    score1 * 10
 */
export function decodePackedResult(packed: bigint): {
  winner: 0 | 1 | null;
  score0: number;
  score1: number;
} {
  const winnerVal = Number((packed >> 248n) & 0xffn);
  const s0 = Number((packed >> 128n) & 0xffffffffn);
  const s1 = Number(packed & 0xffffffffn);
  return {
    winner: winnerVal === 0 ? 0 : winnerVal === 1 ? 1 : null,
    score0: s0 / 10,
    score1: s1 / 10,
  };
}
