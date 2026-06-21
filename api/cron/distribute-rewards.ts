// api/cron/distribute-rewards.ts
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  try {
    const cronSecretFromHeader = request.headers.get('x-cron-secret') || 
                                 request.headers.get('authorization');

    // TEMPORARY relaxed check for testing
    if (cronSecretFromHeader && cronSecretFromHeader !== process.env.CRON_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    return new Response(JSON.stringify({
      status: "success",
      message: "Distribute Rewards bot is working!",
      timestamp: new Date().toISOString(),
      env_status: {
        CIRCLE_API_KEY: !!process.env.CIRCLE_API_KEY,
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        CRON_SECRET: !!process.env.CRON_SECRET,
      },
      note: "Full distribution logic will be added once this works"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("[Distributor Error]", err);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error",
      message: err.message 
    }), { status: 500 });
  }
}
