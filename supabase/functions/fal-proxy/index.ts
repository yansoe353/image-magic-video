
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

    if (falApiKey.trim() === '') {
      throw new Error('FAL_API_KEY is set but empty')
    }

    // Get the request body from the client
    const requestData = await req.json()
    const { endpoint, input, method = 'POST' } = requestData

    if (!endpoint) {
      throw new Error('No endpoint specified')
    }

    console.log(`Proxying request to FAL.ai endpoint: ${endpoint}`)
    console.log(`Request method: ${method}`)
    console.log(`Request input: ${JSON.stringify(input, null, 2)}`)
    
    // Build the URL with proper encoding
    const url = new URL(`https://fal.run/${endpoint}`)
    
    // Set up headers for the FAL API request
    const headers = {
      'Authorization': `Key ${falApiKey}`,
      'Content-Type': 'application/json',
    }
    
    // Create request options
    const requestOptions = {
      method: method,
      headers: headers,
    }
    
    // Only add body for non-GET requests
    if (method !== 'GET') {
      requestOptions.body = JSON.stringify({ input })
    }
    
    // Forward the request to FAL API
    console.log(`Sending request to: ${url.toString()}`)
    console.log(`Using Authorization header: Key ${falApiKey.substring(0, 5)}...`)
    
    const falResponse = await fetch(url.toString(), requestOptions)

    // Check if the request was successful
    if (!falResponse.ok) {
      const errorText = await falResponse.text()
      console.error(`FAL API error (${falResponse.status}): ${errorText}`)
      
      // Special handling for auth errors
      if (falResponse.status === 401) {
        throw new Error(`API Key Authentication Failed: Your FAL API key appears to be invalid or has expired. Status: ${falResponse.status}, Details: ${errorText}`)
      }
      
      throw new Error(`FAL API returned ${falResponse.status}: ${errorText}`)
    }

    // Return the FAL response to the client
    const data = await falResponse.json()
    console.log(`Successfully received response from FAL.ai: ${JSON.stringify(data, null, 2).substring(0, 200)}...`)
    
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
    
    // Enhanced error reporting
    let errorMessage = error.message || 'Unknown error'
    let errorDetails = {}
    
    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
