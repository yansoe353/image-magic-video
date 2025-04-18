
export class AzureSpeechService {
  private baseUrl: string = "https://rhbpeivthnmvzhblnvya.supabase.co/functions/v1/media-services";

  async textToSpeech(text: string, voice: string = "en-US-JennyNeural"): Promise<string> {
    try {
      console.log("Converting text to speech with Azure:", text.substring(0, 50) + "...");
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service: 'azure-speech',
          action: 'synthesize',
          text,
          voice
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Azure Speech API error:", response.status, response.statusText);
        console.error("Error details:", errorText);
        throw new Error(`Azure Speech API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return `data:audio/mp3;base64,${data.audioContent}`;
    } catch (error) {
      console.error("Error generating speech with Azure:", error);
      throw error;
    }
  }
}

export const azureSpeechService = new AzureSpeechService();
