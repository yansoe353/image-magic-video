
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
    console.log('Successfully retrieved Fal.ai API key');
    
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
    const options: RequestInit = {
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
        console.log(`Preparing to upload file, size: ${fileContent.length} bytes`);
        options.body = fileContent;
        // For file uploads, don't use application/json
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
      console.log(`Request body prepared for ${endpoint}`);
    }

    // Add network timeout and diagnosis
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    options.signal = controller.signal;

    // Attempt a DNS resolution check (simplified diagnosis)
    console.log(`Attempting to diagnose connectivity to Fal.ai...`);
    
    // Make the request to Fal.ai with enhanced error handling
    console.log(`Sending request to Fal.ai with options:`, JSON.stringify({
      url: falUrl,
      method: options.method,
      hasBody: !!options.body,
      contentType: options.headers['Content-Type']
    }));
    
    // Add a try/catch specifically for the fetch operation
    let response;
    try {
      response = await fetch(falUrl, options);
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error(`Fetch error when calling Fal.ai:`, fetchError);
      
      // Enhanced network error diagnostics
      let errorDetails = fetchError.message || "Unknown network error";
      let errorStatus = 500;
      
      if (fetchError.name === "AbortError") {
        errorDetails = "Request timed out after 60 seconds";
        errorStatus = 504; // Gateway Timeout
      } else if (errorDetails.includes("connection refused") || errorDetails.includes("ECONNREFUSED")) {
        errorDetails = "Connection refused - the Fal.ai service may be blocking requests from Supabase Edge Functions";
        errorStatus = 502; // Bad Gateway
      } else if (errorDetails.includes("getaddrinfo")) {
        errorDetails = "DNS resolution failed - unable to resolve Fal.ai domain";
        errorStatus = 502; // Bad Gateway
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to connect to Fal.ai API`, 
          details: errorDetails,
          recommendation: "Fal.ai may be restricting access from Supabase Edge Functions. Consider using a direct integration from your frontend."
        }),
        { 
          status: errorStatus, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`Received response from Fal.ai with status: ${response.status}`);
    
    if (!response.ok) {
      let errorDetails;
      try {
        errorDetails = await response.text();
        console.error(`Fal.ai error (${response.status}):`, errorDetails);
      } catch (e) {
        errorDetails = "Could not parse error response";
        console.error(`Fal.ai error (${response.status}), failed to read response body:`, e);
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Fal.ai API returned ${response.status}`, 
          details: errorDetails 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse Fal.ai response as JSON:', jsonError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse Fal.ai response', 
          details: jsonError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('Fal.ai response received successfully:', JSON.stringify({
      endpoint: endpoint,
      hasData: !!data,
      dataKeys: Object.keys(data)
    }));

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
      JSON.stringify({ 
        error: error.message || 'Unknown error', 
        stack: error.stack,
        name: error.name
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
