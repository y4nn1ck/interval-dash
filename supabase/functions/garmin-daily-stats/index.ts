
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
    const { date } = await req.json()

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

    // First check if we have cached data
    const { data: cachedData } = await supabaseClient
      .from('garmin_daily_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .single()

    if (cachedData) {
      return new Response(
        JSON.stringify({
          date: cachedData.date,
          steps: cachedData.steps,
          distance: cachedData.distance,
          calories: cachedData.calories,
          activeMinutes: cachedData.active_minutes,
          restingHeartRate: cachedData.resting_heart_rate
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // If no cached data, fetch from Garmin API
    const { data: authData } = await supabaseClient
      .from('garmin_auth')
      .select('access_token, access_token_secret')
      .eq('user_id', user.id)
      .single()

    if (!authData) {
      throw new Error('Garmin not connected')
    }

    // Make authenticated request to Garmin API
    const garminUrl = `https://connectapi.garmin.com/wellness-api/rest/dailies/${date}`
    
    // Here you would implement the OAuth 1.0 signature for the API call
    // For now, returning sample data structure
    const sampleData = {
      date,
      steps: 8543,
      distance: 6.2,
      calories: 2240,
      activeMinutes: 45,
      restingHeartRate: 72
    }

    // Cache the data
    await supabaseClient
      .from('garmin_daily_stats')
      .upsert({
        user_id: user.id,
        date,
        steps: sampleData.steps,
        distance: sampleData.distance,
        calories: sampleData.calories,
        active_minutes: sampleData.activeMinutes,
        resting_heart_rate: sampleData.restingHeartRate
      })

    return new Response(
      JSON.stringify(sampleData),
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
