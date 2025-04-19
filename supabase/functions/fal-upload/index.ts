
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

    // Forward the request body to FAL upload endpoint
    const formData = await req.formData()
    
    console.log("Proxying file upload to FAL.ai")
    
    const uploadResponse = await fetch('https://gateway.fal.ai/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`
      },
      body: formData
    })

    // Check if the request was successful
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error(`FAL upload error (${uploadResponse.status}): ${errorText}`)
      throw new Error(`FAL upload returned ${uploadResponse.status}: ${errorText}`)
    }

    // Return the upload response to the client
    const data = await uploadResponse.json()
    
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
    console.error('Error in fal-upload function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
