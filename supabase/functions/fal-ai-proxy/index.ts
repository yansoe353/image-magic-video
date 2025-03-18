
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
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the Fal.ai API key from the database
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('key_name', 'falApiKey')
      .single();

    if (apiKeyError) {
      console.error('Error fetching API key:', apiKeyError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve API key', details: apiKeyError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!apiKeyData || !apiKeyData.key_value) {
      console.error('API key not found or empty');
      return new Response(
        JSON.stringify({ error: 'Fal.ai API key not configured or empty' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const falApiKey = apiKeyData.key_value;
    
    // Get request data
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error('Error parsing request JSON:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { endpoint, params } = requestData;

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

    console.log(`Making request to Fal.ai endpoint: ${falUrl}`);

    // Prepare request options
    const options: any = {
      method: endpoint === 'upload' ? 'POST' : params.method || 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      }
    };

    // For uploads, we need to handle the file
    if (endpoint === 'upload') {
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
    console.log(`Sending request to Fal.ai with options:`, JSON.stringify({
      url: falUrl,
      method: options.method,
      hasBody: !!options.body
    }));
    
    const response = await fetch(falUrl, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Fal.ai error (${response.status}):`, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Fal.ai API returned ${response.status}`, 
          details: errorText 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const data = await response.json();
    console.log('Fal.ai response received successfully');

    // Return the response
    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in fal-ai-proxy function:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
