// api/cron/distribute-rewards.ts
export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization');

  if (cronSecret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    return new Response(JSON.stringify({
      status: "success",
      message: "Distribute rewards bot is working",
      timestamp: new Date().toISOString(),
      note: "Full logic can be added once this works"
    }), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
