// api/cron/verify-results.ts
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(request: Request): Promise<Response> {
  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization');

  if (cronSecret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    console.log('[VerifyBot] Running...');

    // Check for pending verifications
    const { data: pending, error } = await supabase
      .from('bot_verifications')
      .select('match_id, verification_status, created_at')
      .eq('verification_status', 'pending')
      .limit(5);

    return new Response(JSON.stringify({
      status: "success",
      message: "Verify bot is working",
      timestamp: new Date().toISOString(),
      pending_verifications: pending?.length || 0,
      pending_data: pending || [],
      env_status: {
        supabase_url: !!process.env.SUPABASE_URL,
        service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        cron_secret: !!process.env.CRON_SECRET
      }
    }), { status: 200 });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ 
      error: err.message,
      type: "catch_error" 
    }), { status: 500 });
  }
}
