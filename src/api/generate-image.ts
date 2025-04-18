
// Simple API proxy endpoint to handle FAL.AI requests and avoid CORS issues

export async function POST(req: Request) {
  try {
    const { model, input } = await req.json();
    const apiKey = req.headers.get('Authorization')?.split(' ')[1];

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Forward the request to FAL.AI
    const falResponse = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${apiKey}`
      },
      body: JSON.stringify({ input }),
    });

    if (!falResponse.ok) {
      const errorText = await falResponse.text();
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate image', 
          statusCode: falResponse.status,
          message: errorText
        }), 
        {
          status: falResponse.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await falResponse.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error proxying image generation request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : String(error)
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
