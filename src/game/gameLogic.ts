// src/game/gameLogic.ts
import { TOTAL_NUMBERS, TARGET_SCORE, RING_NUMBERS } from './boardLayout';

export interface PlayerState {
  name: string;
  address: string;
  totalScore: number;
  hits: Record<number, number>;
  completed: Record<number, boolean>;
  bonusPoints: Record<number, number>;
  num1AwardedBatch1: boolean;
  num1AwardedBatch2: boolean;
}

export interface GameState {
  players: [PlayerState, PlayerState];
  currentPlayer: 0 | 1;
  dartsRemaining: number;
  closedNumbers: Set<number>;
  hitSequences: Record<number, number[]>;
  logMessages: string[];
  gameOver: boolean;
  winner: 0 | 1 | null;
  batch: 1 | 2;
  batch1Scores: [number, number] | null;
  isVsCPU: boolean;
  theme?: 'neon' | 'avalanche' | 'gold' | 'midnight' | 'royal' | 'ivory' | 'obsidian' | 'sapphire' | 'rosewood' | 'emerald' | 'platinum' | 'crimson';
  latestDart?: { x: number; y: number; angle: number; tilt: number; playerIdx: number } | null;
  lastAction?: string | null;
}

export interface TurnAction {
  player: 0 | 1;
  target: number | 'ring';
  ringIndex?: number;
  pointsEarned: number;
}

export function createInitialPlayer(name: string, address: string): PlayerState {
  const hits: Record<number, number> = {};
  const completed: Record<number, boolean> = {};
  const bonusPoints: Record<number, number> = {};
  for (let i = 1; i <= TOTAL_NUMBERS; i++) {
    hits[i] = 0;
    completed[i] = false;
    bonusPoints[i] = 0;
  }
  return {
    name,
    address,
    totalScore: 0,
    hits,
    completed,
    bonusPoints,
    num1AwardedBatch1: false,
    num1AwardedBatch2: false
  };
}

export function createInitialGameState(
  p1Name: string, 
  p1Addr: string, 
  p2Name: string, 
  p2Addr: string, 
  isVsCPU = false
): GameState {
  const hitSequences: Record<number, number[]> = {};
  for (let i = 1; i <= TOTAL_NUMBERS; i++) {
    hitSequences[i] = [];
  }
  return {
    players: [createInitialPlayer(p1Name, p1Addr), createInitialPlayer(p2Name, p2Addr)],
    currentPlayer: 0,
    dartsRemaining: 3,
    closedNumbers: new Set(),
    hitSequences,
    batch: 1,
    batch1Scores: null,
    gameOver: false,
    winner: null,
    logMessages: [],
    isVsCPU,
    theme: 'neon',
    latestDart: null,
    lastAction: null,
  };
}

function calculateHitPoints(state: GameState, playerIdx: 0 | 1, n: number): { points: number; breakdown: string } {
  if (n === 1) {
    return { points: 12, breakdown: "+2 Filler +10 Fill-Up" };
  }

  const player = state.players[playerIdx];
  const other = state.players[playerIdx === 0 ? 1 : 0];
  const myHits = player.hits[n] || 0;
  const otherHits = other.hits[n] || 0;
  const totalHits = myHits + otherHits;

  let points = 2;
  let breakdown = "+2 Filler";

  const threshold = n / 2;
  const prevMyHits = myHits - 1;
  const prevOtherHits = otherHits;

  const currentTriggered = myHits > threshold || otherHits > threshold;
  const prevTriggered = prevMyHits > threshold || prevOtherHits > threshold;

  if (currentTriggered && !prevTriggered) {
    if (myHits > otherHits) {
      points += 7;
      breakdown += " +7 Top-Filler (Lead)";
    }
  }

  if (totalHits >= n) {
    points += 10;
    breakdown += " +10 Fill-Up";
  }

  return { points, breakdown };
}

export function hitNumber(state: GameState, targetNumber: number, isMultiHit = false): { state: GameState; message: string } {
  const newState = structuredClone(state) as GameState;
  const cp = newState.currentPlayer;
  const player = newState.players[cp];
  const other = newState.players[cp === 0 ? 1 : 0];
  let message = '';

  if (!isMultiHit) newState.dartsRemaining--;

  const totalHitsBefore = (player.hits[targetNumber] || 0) + (other.hits[targetNumber] || 0);

  if (newState.closedNumbers.has(targetNumber) || totalHitsBefore >= targetNumber) {
    message = `Number ${targetNumber} is already closed.`;
  } else {
    player.hits[targetNumber] = (player.hits[targetNumber] || 0) + 1;
    newState.hitSequences[targetNumber].push(cp);

    const { points, breakdown } = calculateHitPoints(newState, cp, targetNumber);
    player.totalScore += points;

    const currentTotalHits = player.hits[targetNumber] + other.hits[targetNumber];

    if (targetNumber === 1 || currentTotalHits >= targetNumber) {
      newState.closedNumbers.add(targetNumber);
      player.completed[targetNumber] = true;
      message = `Hit #${targetNumber}! ${breakdown}. ${targetNumber === 1 ? 'Closed!' : 'Fully closed!'}`;
      newState.logMessages.push(`NUMBER ${targetNumber} IS CLOSED`);
    } else {
      message = `Hit ${targetNumber}! ${breakdown}. (${currentTotalHits}/${targetNumber})`;
    }
  }

  const finalScore = player.totalScore;
  newState.lastAction = `[${player.name}]: 🎯 Dart landed on ${targetNumber}! (${message}) [Total: ${finalScore} pts]`;

  if (message.includes('+7 Top-Filler')) {
    newState.logMessages.push(`🔥 [${player.name}] claims the Top Filler Bonus (+7 pts) for Number ${targetNumber}!`);
  }

  if (!isMultiHit) {
    newState.logMessages.push(newState.lastAction);
  }

  if (!isMultiHit && newState.dartsRemaining <= 0) {
    checkBatchConditions(newState);
    if (!newState.gameOver && newState.dartsRemaining === 0) {
      newState.currentPlayer = cp === 0 ? 1 : 0;
      newState.dartsRemaining = 3;
    }
  }

  return { state: newState, message };
}

export function hitRing(state: GameState, ringIndex: number, ringNumbers: number[]): { state: GameState; messages: string[] } {
  let currentResult = { state, message: '' };
  const messages: string[] = [];

  const baseState = structuredClone(state) as GameState;
  baseState.dartsRemaining--;
  currentResult.state = baseState;

  for (const num of ringNumbers) {
    const result = hitNumber(currentResult.state, num, true);
    currentResult = { state: result.state, message: result.message };
    messages.push(result.message);
  }

  const cp = currentResult.state.currentPlayer;
  const player = currentResult.state.players[cp];
  const numsJoined = ringNumbers.join(', ');
  currentResult.state.lastAction = `[${player.name}]: ⭕ Direct hit on Ring ${ringIndex + 1}! (${numsJoined}) = Total: ${player.totalScore} pts`;
  currentResult.state.logMessages.push(currentResult.state.lastAction);

  if (currentResult.state.dartsRemaining <= 0) {
    checkBatchConditions(currentResult.state);
    if (!currentResult.state.gameOver && currentResult.state.dartsRemaining === 0) {
      currentResult.state.currentPlayer = cp === 0 ? 1 : 0;
      currentResult.state.dartsRemaining = 3;
    }
  }

  return { state: currentResult.state, messages };
}

export function passTurnTimeout(state: GameState): GameState {
  const newState = structuredClone(state) as GameState;
  if (newState.gameOver) return newState;
  const cp = newState.currentPlayer;
  const player = newState.players[cp];
  newState.lastAction = `[${player.name}]: ⏱ Time out! Turn passed to opponent.`;
  newState.logMessages.push(newState.lastAction);
  newState.currentPlayer = (cp === 0 ? 1 : 0) as 0 | 1;
  newState.dartsRemaining = 3;
  return newState;
}

/** ====================== BOT VERIFICATION ====================== */
export async function triggerBotVerification(
  matchId: string,
  winnerAddress: string,
  runnerUpAddress: string,
  finalScore?: any
) {
  try {
    const { supabase } = await import('../lib/supabase');

    const { error } = await supabase.from('bot_verifications').insert({
      match_id: matchId,
      verification_status: 'pending',
      winner_address: winnerAddress,
      runner_up_address: runnerUpAddress,
      final_game_state: finalScore,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to queue bot verification:", error);
    } else {
      console.log(`✅ Match ${matchId} queued for automatic verification & payout`);
    }
  } catch (err) {
    console.error("Error triggering bot verification:", err);
  }
}

function checkBatchConditions(state: GameState) {
  const p1Score = state.players[0].totalScore;
  const p2Score = state.players[1].totalScore;

  if (state.batch === 1) {
    const allClosed = state.closedNumbers.size === TOTAL_NUMBERS;
    if (p1Score > TARGET_SCORE || p2Score > TARGET_SCORE || allClosed) {
      const b1w = p1Score > p2Score ? 0 : 1;
      const benchmark = p1Score > p2Score ? p1Score : p2Score;

      state.batch = 2;
      state.batch1Scores = [p1Score, p2Score];

      state.players.forEach(p => {
        p.totalScore = 0;
        for (let i = 1; i <= TOTAL_NUMBERS; i++) {
          p.hits[i] = 0;
          p.completed[i] = false;
          p.bonusPoints[i] = 0;
        }
        p.num1AwardedBatch1 = false;
      });
      state.closedNumbers = new Set();
      for (let i = 1; i <= TOTAL_NUMBERS; i++) {
        state.hitSequences[i] = [];
      }

      state.currentPlayer = (1 - b1w) as (0 | 1);
      state.dartsRemaining = 3;
      state.lastAction = `[SYSTEM]: 🚀 ${state.players[b1w].name} set the Bar at ${benchmark}! BATCH 2 START. ${state.players[1 - b1w].name}'s turn to beat it!`;
      state.logMessages.push(state.lastAction);
    }
  } 
  else if (state.batch === 2 && state.batch1Scores !== null) {
    const [p1Target, p2Target] = [state.batch1Scores[1], state.batch1Scores[0]];

    if (p1Score >= p1Target) {
      state.gameOver = true;
      state.winner = 0;
      state.lastAction = `[SYSTEM]: 🏆 ${state.players[0].name} reached the target of ${p1Target} and WINS!`;
      state.logMessages.push(state.lastAction);

      // 🔥 Trigger Automatic Verification
      triggerBotVerification(
        'TEMP_MATCH_ID', // Will be replaced with real matchId from component
        state.players[0].address,
        state.players[1].address,
        { finalScoreP1: p1Score, finalScoreP2: p2Score, batch: 2 }
      );

    } else if (p2Score >= p2Target) {
      state.gameOver = true;
      state.winner = 1;
      state.lastAction = `[SYSTEM]: 🏆 ${state.players[1].name} reached the target of ${p2Target} and WINS!`;
      state.logMessages.push(state.lastAction);

      // 🔥 Trigger Automatic Verification
      triggerBotVerification(
        'TEMP_MATCH_ID',
        state.players[1].address,
        state.players[0].address,
        { finalScoreP1: p1Score, finalScoreP2: p2Score, batch: 2 }
      );
    }
  }
}

export function computeCPUMove(state: GameState): { type: 'number' | 'ring'; index: number } {
  // ... your existing CPU logic (unchanged)
  const cpuIdx = 1;
  const player = state.players[cpuIdx];
  const opponent = state.players[0];
  const closed = state.closedNumbers;

  const candidates: { n: number; priority: number }[] = [];

  for (let n = 1; n <= TOTAL_NUMBERS; n++) {
    if (closed.has(n)) continue;
    const myHits = player.hits[n] || 0;
    const oppHits = opponent.hits[n] || 0;
    const totalHits = myHits + oppHits;
    const remaining = n - totalHits;

    let priority = 0;
    priority += (totalHits / n) * 40;
    if (myHits >= oppHits) priority += 10;
    if (oppHits > myHits && remaining <= 3) priority += 25;
    priority -= myHits * 8;
    priority += Math.random() * 20;

    candidates.push({ n, priority });
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.priority - a.priority);
    const topN = candidates.slice(0, Math.min(3, candidates.length));
    const pick = topN[Math.floor(Math.random() * topN.length)];
    return { type: 'number', index: pick.n };
  }

  return { type: 'number', index: 1 };
}
