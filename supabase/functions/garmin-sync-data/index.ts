
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Check if user has Garmin auth
    const { data: authData } = await supabaseClient
      .from('garmin_auth')
      .select('access_token, access_token_secret')
      .eq('user_id', user.id)
      .single()

    if (!authData) {
      throw new Error('Garmin not connected')
    }

    // Sync last 30 days of data
    const syncPromises = []
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      // Call the daily stats function for each date
      syncPromises.push(
        supabaseClient.functions.invoke('garmin-daily-stats', {
          body: { date }
        })
      )
    }

    await Promise.all(syncPromises)

    return new Response(
      JSON.stringify({ success: true, message: 'Data synced successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
