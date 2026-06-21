// api/cron/distribute-rewards.ts
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  // Security Check
  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization');
  if (cronSecret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    console.log('[Distributor] Starting reward distribution...');

    return new Response(
      JSON.stringify({
        message: 'Reward distribution logic ready (placeholder)',
        status: 'ok',
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    console.error('[Distributor Error]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
