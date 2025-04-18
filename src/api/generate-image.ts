
// API proxy endpoint to handle FAL.AI requests and avoid CORS issues

export async function POST(req: Request) {
  try {
    const { model, input } = await req.json();
    const apiKey = req.headers.get('Authorization')?.split(' ')[1];

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
      });
    }

    console.log(`Proxying request to ${model} with input:`, JSON.stringify(input).substring(0, 100) + '...');

    // Forward the request to FAL.AI with proper headers
    const falResponse = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${apiKey}`,
      },
      body: JSON.stringify({ input }),
    });

    if (!falResponse.ok) {
      const errorText = await falResponse.text();
      console.error(`FAL API responded with status ${falResponse.status}:`, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Image generation failed with status ${falResponse.status}`, 
          statusCode: falResponse.status,
          message: errorText
        }), 
        {
          status: falResponse.status,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          },
        }
      );
    }

    const data = await falResponse.json();
    return new Response(JSON.stringify(data), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
    });
  } catch (parseError) {
    console.error('Error parsing request:', parseError);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        message: parseError instanceof Error ? parseError.message : String(parseError)
      }), 
      {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
      }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
