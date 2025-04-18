
export class AzureSpeechService {
  private apiKey: string = ""; // This will be set via initialize method
  private region: string = "eastus"; // Default region
  private baseUrl: string = "https://eastus.tts.speech.microsoft.com/cognitiveservices/v1";

  initialize(apiKey?: string, region?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
    if (region) {
      this.region = region;
      this.baseUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async textToSpeech(text: string, voice: string = "en-US-JennyNeural"): Promise<string> {
    try {
      console.log("Converting text to speech with Azure:", text.substring(0, 50) + "...");
      
      if (!this.apiKey) {
        throw new Error("Azure Speech API key not set");
      }
      
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
          <voice name="${voice}">
            ${text}
          </voice>
        </speak>
      `;
      
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": this.apiKey,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
          "User-Agent": "VideoShortsGenerator"
        },
        body: ssml
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Azure Speech API error:", response.status, response.statusText);
        console.error("Error details:", errorText);
        throw new Error(`Azure Speech API error: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      return `data:audio/mp3;base64,${base64Audio}`;
    } catch (error) {
      console.error("Error generating speech with Azure:", error);
      throw error;
    }
  }
}

export const azureSpeechService = new AzureSpeechService();
