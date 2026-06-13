import { Hono, Context } from 'https://deno.land/x/hono@v3.11.7/mod.ts'
import { cors } from 'https://deno.land/x/hono@v3.11.7/middleware.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { hitNumber, hitRing } from './gameLogic.ts'
import { RING_NUMBERS } from './boardLayout.ts'

const app = new Hono().basePath('/game-api')

app.use('*', cors())

// Global Error Handler
app.onError((err: Error, c: Context) => {
  console.error(`[API FATAL] ${err.message}`);
  return c.json({ 
    error: "Internal Server Error", 
    message: err.message 
  }, 500)
})

// Lazy Supabase Client Initialization
let _supabase: any = null;
function getSupabase() {
  if (_supabase) return _supabase;
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  // For edge functions, use SERVICE_ROLE_KEY for admin operations
  // Falls back to PUBLISHABLE_KEY if service role not available
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_PUBLISHABLE_KEY)");
  }

  _supabase = createClient(supabaseUrl, supabaseKey);
  return _supabase;
}

app.get('/', (c: Context) => {
  return c.json({
    name: "Filling Game Agent API",
    version: "1.0.2",
    description: "Live API for AI agents to play Filling Game darts.",
