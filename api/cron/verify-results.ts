// api/cron/verify-results.ts
export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  try {
    const cronSecret = request.headers.get('x-cron-secret') || 
                      request.headers.get('authorization');

    // TEMPORARY: Allow request without secret during testing
    if (cronSecret && cronSecret !== process.env.CRON_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    return new Response(JSON.stringify({
      status: "success",
      message: "Verify bot is working correctly!",
      timestamp: new Date().toISOString(),
      env_check: {
        has_supabase_url: !!process.env.SUPABASE_URL,
        has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        has_cron_secret: !!process.env.CRON_SECRET,
      }
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
