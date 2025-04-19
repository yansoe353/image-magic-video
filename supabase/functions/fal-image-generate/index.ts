
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { fal } from "@fal-ai/client";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const falApiKey = Deno.env.get('FAL_API_KEY')
    if (!falApiKey) {
      throw new Error('FAL_API_KEY not configured')
    }

    fal.credentials(falApiKey)
    
    const { input } = await req.json()
    
    const result = await fal.run("110602490-lcm-sd15-i2i/fast", input)
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      },
    )
  }
})
