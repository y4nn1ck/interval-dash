
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

    // Get user from JWT
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const consumerKey = Deno.env.get('GARMIN_CONSUMER_KEY')
    const consumerSecret = Deno.env.get('GARMIN_CONSUMER_SECRET')
    
    if (!consumerKey || !consumerSecret) {
      throw new Error('Garmin API credentials not configured')
    }

    // Step 1: Get request token from Garmin
    const requestTokenUrl = 'https://connectapi.garmin.com/oauth-service/oauth/request_token'
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/garmin-auth-callback`
    
    const oauthParams = {
      oauth_callback: callbackUrl,
      oauth_consumer_key: consumerKey,
      oauth_nonce: crypto.randomUUID(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_version: '1.0'
    }

    // Generate OAuth signature
    const baseString = `POST&${encodeURIComponent(requestTokenUrl)}&${encodeURIComponent(
      Object.entries(oauthParams)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&')
    )}`

    const signingKey = `${encodeURIComponent(consumerSecret)}&`
    const signature = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(signingKey),
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      ),
      new TextEncoder().encode(baseString)
    )

    oauthParams.oauth_signature = btoa(String.fromCharCode(...new Uint8Array(signature)))

    const authHeader = `OAuth ${Object.entries(oauthParams)
      .map(([key, value]) => `${key}="${encodeURIComponent(value)}"`)
      .join(', ')}`

    const response = await fetch(requestTokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get request token: ${response.statusText}`)
    }

    const responseText = await response.text()
    const params = new URLSearchParams(responseText)
    const oauthToken = params.get('oauth_token')
    
    if (!oauthToken) {
      throw new Error('No oauth token received')
    }

    // Construct authorization URL
    const authUrl = `https://connect.garmin.com/oauthConfirm?oauth_token=${oauthToken}`

    return new Response(
      JSON.stringify({ authUrl }),
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
