
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

    // Get the Fal.ai API key
    let falApiKey = Deno.env.get('FAL_API_KEY') || '';
    
    if (!falApiKey) {
      // Try to get API key from database as fallback
      console.log('No API key in environment, checking database');
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('api_keys')
        .select('key_value')
        .eq('key_name', 'falApiKey')
        .single();
        
      if (apiKeyError || !apiKeyData) {
        console.error('No Fal.ai API key found');
        return new Response(
          JSON.stringify({ error: 'Fal.ai API key not configured' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      falApiKey = apiKeyData.key_value;
    }

    if (!falApiKey) {
      return new Response(
        JSON.stringify({ error: 'Fal.ai API key not configured or empty' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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

    // Map endpoints to appropriate Fal.ai URLs
    let falUrl;
    if (endpoint === 'upload') {
      falUrl = 'https://rest.fal.ai/storage/upload';
    } else if (endpoint === 'fal-ai/sdxl') {
      falUrl = 'https://rest.fal.ai/v1/fast-sdxl';
    } else if (endpoint === 'fal-ai/i2v') {
      falUrl = 'https://rest.fal.ai/v1/wan-i2v';
    } else {
      falUrl = `https://rest.fal.ai/v1/${endpoint}`;
    }

    console.log(`Making request to Fal.ai endpoint: ${falUrl}`);

    // Prepare request options with shorter timeout
    const options = {
      method: endpoint === 'upload' ? 'POST' : params.method || 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      }
    };

    // For uploads, we need to handle the file
    if (endpoint === 'upload') {
      if (params.file) {
        const fileContent = new Uint8Array(params.file);
        options.body = fileContent;
        options.headers['Content-Type'] = 'application/octet-stream';
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

    // Add timeout to prevent function from running too long
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout (Supabase Edge Functions have 30s limit)
    options.signal = controller.signal;
    
    // Make the request to Fal.ai with enhanced error handling
    try {
      const response = await fetch(falUrl, options);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorText = await response.text();
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
      
      return new Response(
        JSON.stringify(data),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      
      if (fetchError.name === "AbortError") {
        return new Response(
          JSON.stringify({ 
            error: "Request timed out", 
            details: "The request to Fal.ai took too long and was aborted to prevent function timeout"
          }),
          { 
            status: 504, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to connect to Fal.ai API', 
          details: fetchError.message || 'Unknown network error'
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error in fal-ai-proxy function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
