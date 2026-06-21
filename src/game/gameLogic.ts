// src/game/gameLogic.ts
import { TOTAL_NUMBERS, TARGET_SCORE, RING_NUMBERS } from './boardLayout';

export interface PlayerState { ... } // (keep all your existing interfaces)

export interface GameState { ... }   // (keep all your existing interfaces)

// ... (keep all your existing functions: createInitialPlayer, createInitialGameState, hitNumber, hitRing, etc.)

function checkBatchConditions(state: GameState) {
  const p1Score = state.players[0].totalScore;
  const p2Score = state.players[1].totalScore;

  if (state.batch === 1) {
    const allClosed = state.closedNumbers.size === TOTAL_NUMBERS;
    if (p1Score > TARGET_SCORE || p2Score > TARGET_SCORE || allClosed) {
      // ... your existing batch 1 logic
      const b1w = p1Score > p2Score ? 0 : 1;
      // ... rest of your code
    }
  } 
  else if (state.batch === 2 && state.batch1Scores !== null) {
    const [p1Target, p2Target] = [state.batch1Scores[1], state.batch1Scores[0]];

    if (p1Score >= p1Target) {
      state.gameOver = true;
      state.winner = 0;
      state.lastAction = `[SYSTEM]: 🏆 ${state.players[0].name} reached the target of ${p1Target} and WINS!`;
      state.logMessages.push(state.lastAction);

      // 🔥 AUTO TRIGGER BOT VERIFICATION
      triggerBotVerification(
        // You will pass matchId from the component
        'TEMP_MATCH_ID', // ← This will be replaced in the component
        state.players[0].address,
        state.players[1].address,
        { finalScoreP1: p1Score, finalScoreP2: p2Score, batch: state.batch }
      );

    } else if (p2Score >= p2Target) {
      state.gameOver = true;
      state.winner = 1;
      state.lastAction = `[SYSTEM]: 🏆 ${state.players[1].name} reached the target of ${p2Target} and WINS!`;
      state.logMessages.push(state.lastAction);

      // 🔥 AUTO TRIGGER BOT VERIFICATION
      triggerBotVerification(
        'TEMP_MATCH_ID',
        state.players[1].address,
        state.players[0].address,
        { finalScoreP1: p1Score, finalScoreP2: p2Score, batch: state.batch }
      );
    }
  }
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

    if (error) console.error("Failed to queue bot verification:", error);
    else console.log(`✅ Match ${matchId} queued for automatic verification & payout`);
  } catch (err) {
    console.error("Error triggering bot verification:", err);
  }
}
