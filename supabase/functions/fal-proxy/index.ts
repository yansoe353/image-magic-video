
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const falApiKey = Deno.env.get('FAL_API_KEY')
    if (!falApiKey) {
      throw new Error('FAL_API_KEY environment variable is not set')
    }

    // Get the request body from the client
    const requestData = await req.json()
    const { endpoint, input, method = 'POST' } = requestData

    if (!endpoint) {
      throw new Error('No endpoint specified')
    }

    console.log(`Proxying request to FAL.ai endpoint: ${endpoint}`)
    
    // Forward the request to FAL API
    const falResponse = await fetch(`https://fal.run/${endpoint}`, {
      method: method,
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: method !== 'GET' ? JSON.stringify({ input }) : null,
    })

    // Check if the request was successful
    if (!falResponse.ok) {
      const errorText = await falResponse.text()
      console.error(`FAL API error (${falResponse.status}): ${errorText}`)
      throw new Error(`FAL API returned ${falResponse.status}: ${errorText}`)
    }

    // Return the FAL response to the client
    const data = await falResponse.json()
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in fal-proxy function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
