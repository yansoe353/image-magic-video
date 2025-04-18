
export class AssemblyAIService {
  private baseUrl: string = "https://rhbpeivthnmvzhblnvya.supabase.co/functions/v1/media-services";

  async generateSrtCaptions(audioUrl: string): Promise<string> {
    try {
      console.log("Generating SRT captions with AssemblyAI");
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service: 'assemblyai',
          action: 'transcribe',
          audioUrl
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AssemblyAI API error:", response.status, response.statusText);
        console.error("Error details:", errorText);
        throw new Error(`AssemblyAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.captions;
    } catch (error) {
      console.error("Error generating captions with AssemblyAI:", error);
      throw error;
    }
  }
}

export const assemblyAIService = new AssemblyAIService();
