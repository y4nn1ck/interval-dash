
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
    const { oauthToken, oauthVerifier } = await req.json()

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

    const consumerKey = Deno.env.get('GARMIN_CONSUMER_KEY')
    const consumerSecret = Deno.env.get('GARMIN_CONSUMER_SECRET')

    // Exchange request token for access token
    const accessTokenUrl = 'https://connectapi.garmin.com/oauth-service/oauth/access_token'
    
    const oauthParams = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: crypto.randomUUID(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: oauthToken,
      oauth_verifier: oauthVerifier,
      oauth_version: '1.0'
    }

    // Generate signature (similar to auth-init)
    const baseString = `POST&${encodeURIComponent(accessTokenUrl)}&${encodeURIComponent(
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

    const response = await fetch(accessTokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`)
    }

    const responseText = await response.text()
    const params = new URLSearchParams(responseText)
    const accessToken = params.get('oauth_token')
    const accessTokenSecret = params.get('oauth_token_secret')

    if (!accessToken || !accessTokenSecret) {
      throw new Error('Failed to get access credentials')
    }

    return new Response(
      JSON.stringify({
        accessToken,
        accessTokenSecret,
        userId: user.id
      }),
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
