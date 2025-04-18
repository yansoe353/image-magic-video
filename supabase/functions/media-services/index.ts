
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { service, action, ...params } = await req.json();

    switch (service) {
      case 'pexels':
        return await handlePexelsRequest(action, params);
      case 'azure-speech':
        return await handleAzureSpeechRequest(action, params);
      case 'assemblyai':
        return await handleAssemblyAIRequest(action, params);
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  } catch (error) {
    console.error('Error in media-services function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handlePexelsRequest(action: string, params: any) {
  const apiKey = Deno.env.get('PEXELS_API_KEY');
  if (!apiKey) throw new Error('Pexels API key not configured');

  if (action === 'search') {
    const { query, perPage = 10, page = 1 } = params;
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;
    
    const response = await fetch(url, {
      headers: { Authorization: apiKey }
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ photos: data.photos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }

  throw new Error(`Unknown Pexels action: ${action}`);
}

async function handleAzureSpeechRequest(action: string, params: any) {
  const apiKey = Deno.env.get('AZURE_SPEECH_API_KEY');
  if (!apiKey) throw new Error('Azure Speech API key not configured');

  if (action === 'synthesize') {
    const { text, voice = "en-US-JennyNeural" } = params;
    const region = "eastus";
    const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${voice}">
          ${text}
        </voice>
      </speak>
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'VideoShortsGenerator'
      },
      body: ssml
    });

    if (!response.ok) {
      throw new Error(`Azure Speech API error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }

  throw new Error(`Unknown Azure Speech action: ${action}`);
}

async function handleAssemblyAIRequest(action: string, params: any) {
  const apiKey = Deno.env.get('ASSEMBLYAI_API_KEY');
  if (!apiKey) throw new Error('AssemblyAI API key not configured');

  if (action === 'transcribe') {
    const { audioUrl } = params;
    
    // First upload the audio file
    let uploadUrl = audioUrl;
    if (audioUrl.startsWith('data:')) {
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ audio_url: audioUrl })
      });

      if (!uploadResponse.ok) {
        throw new Error(`AssemblyAI upload error: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      uploadUrl = uploadData.upload_url;
    }

    // Start transcription
    const transcribeResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: uploadUrl,
        speaker_labels: false,
        format_text: true
      })
    });

    if (!transcribeResponse.ok) {
      throw new Error(`AssemblyAI transcription error: ${transcribeResponse.status}`);
    }

    const transcribeData = await transcribeResponse.json();
    
    // Poll for completion
    let status = 'processing';
    let attempts = 0;
    const maxAttempts = 30;
    
    while (status === 'processing' || status === 'queued') {
      if (attempts >= maxAttempts) {
        throw new Error('Transcription timed out');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pollResponse = await fetch(
        `https://api.assemblyai.com/v2/transcript/${transcribeData.id}`,
        { headers: { 'authorization': apiKey }}
      );

      if (!pollResponse.ok) {
        throw new Error(`AssemblyAI polling error: ${pollResponse.status}`);
      }

      const pollData = await pollResponse.json();
      status = pollData.status;

      if (status === 'completed') {
        // Get SRT format
        const srtResponse = await fetch(
          `https://api.assemblyai.com/v2/transcript/${transcribeData.id}/srt`,
          { headers: { 'authorization': apiKey }}
        );

        if (!srtResponse.ok) {
          throw new Error(`AssemblyAI SRT error: ${srtResponse.status}`);
        }

        const srtText = await srtResponse.text();
        return new Response(
          JSON.stringify({ captions: srtText }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      attempts++;
    }

    throw new Error(`Transcription failed with status: ${status}`);
  }

  throw new Error(`Unknown AssemblyAI action: ${action}`);
}
