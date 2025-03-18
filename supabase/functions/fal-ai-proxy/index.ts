
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the Fal.ai API key from the database
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('key_name', 'falApiKey')
      .single();

    if (apiKeyError || !apiKeyData) {
      console.error('Error fetching API key:', apiKeyError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve API key' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const falApiKey = apiKeyData.key_value;
    
    if (!falApiKey || falApiKey === '') {
      return new Response(
        JSON.stringify({ error: 'Fal.ai API key not configured' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get request data
    const { endpoint, params } = await req.json();

    // Validate endpoint
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Endpoint is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare the base URL for different endpoints
    let falUrl;
    if (endpoint === 'upload') {
      falUrl = 'https://rest.fal.ai/storage/upload';
    } else {
      falUrl = `https://rest.fal.ai/v1/${endpoint}`;
    }

    // Prepare request options
    const options = {
      method: endpoint === 'upload' ? 'POST' : params.method || 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      }
    };

    // For uploads, we need to handle the file
    if (endpoint === 'upload') {
      // In a real implementation, you would need to handle file uploads differently
      // This is a simplified version
      if (params.file) {
        options.body = params.file;
      } else {
        return new Response(
          JSON.stringify({ error: 'File is required for upload endpoint' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else if (params.body) {
      options.body = JSON.stringify(params.body);
    }

    // Make the request to Fal.ai
    const response = await fetch(falUrl, options);
    const data = await response.json();

    // Return the response
    return new Response(
      JSON.stringify(data),
      { 
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in fal-ai-proxy function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
