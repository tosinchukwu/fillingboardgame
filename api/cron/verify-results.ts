// api/cron/verify-results.ts
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(request: Request): Promise<Response> {
  try {
    const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization');
    
    if (cronSecret && cronSecret !== process.env.CRON_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    console.log('[VerifyBot] Starting verification cycle...');

    const { data: pending, error } = await supabase
      .from('bot_verifications')
      .select('*')
      .eq('verification_status', 'pending')
      .limit(15);

    if (error) throw error;

    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({
        status: "success",
        message: "No pending matches to verify",
        processed: 0
      }), { status: 200 });
    }

    let verified = 0;

    for (const item of pending) {
      try {
        const { data: match } = await supabase
          .from('matches')
          .select('*, game_state')
          .eq('match_id', item.match_id)
          .single();

        if (!match) continue;

        const winner = match.winner_address || match.game_state?.winner_address;
        const runnerUp = match.runner_up_address || match.game_state?.runner_up_address;

        if (!winner) continue;

        const entryFee = Number(match.entry_fee || 0);
        const totalPool = entryFee * (match.participants?.length || 2);

        await supabase.from('escrow_rewards').insert({
          match_id: item.match_id,
          winner_address: winner,
          runner_up_address: runnerUp,
          winner_reward_usdc: Math.floor(totalPool * 0.6),
          runner_up_reward_usdc: Math.floor(totalPool * 0.3),
          platform_fee_usdc: Math.floor(totalPool * 0.1),
          escrow_status: 'verified',
          verification_time: new Date().toISOString(),
        });

        await supabase
          .from('bot_verifications')
          .update({ verification_status: 'verified' })
          .eq('match_id', item.match_id);

        verified++;
        console.log(`✅ Verified match: ${item.match_id}`);

      } catch (err) {
        console.error(`Failed match ${item.match_id}:`, err);
        await supabase
          .from('bot_verifications')
          .update({ verification_status: 'failed' })
          .eq('match_id', item.match_id);
      }
    }

    return new Response(JSON.stringify({
      status: "success",
      message: "Verification cycle completed",
      processed: pending.length,
      verified
    }), { status: 200 });

  } catch (err: any) {
    console.error("[VerifyBot Critical Error]", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
