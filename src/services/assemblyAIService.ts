export class AssemblyAIService {
  private apiKey: string = ""; // This will be set via initialize method
  private baseUrl: string = "https://api.assemblyai.com/v2";

  initialize(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async uploadAudio(audioUrl: string): Promise<string> {
    try {
      console.log("Uploading audio to AssemblyAI:", audioUrl.substring(0, 50) + "...");
      
      if (!this.apiKey) {
        throw new Error("AssemblyAI API key not set");
      }
      
      // If the audio is a base64 data URL, we need to fetch it first
      let audioBlob;
      if (audioUrl.startsWith('data:')) {
        const response = await fetch(audioUrl);
        audioBlob = await response.blob();
      } else {
        // Otherwise directly use the URL
        const response = await fetch(this.baseUrl + "/upload", {
          method: "POST",
          headers: {
            "authorization": this.apiKey,
            "content-type": "application/json"
          },
          body: JSON.stringify({
            audio_url: audioUrl
          })
        });
        
        if (!response.ok) {
          throw new Error(`AssemblyAI upload error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.upload_url;
      }
      
      // Create a FormData object to send the blob
      const formData = new FormData();
      formData.append("file", audioBlob);
      
      // Upload the audio file
      const response = await fetch(this.baseUrl + "/upload", {
        method: "POST",
        headers: {
          "authorization": this.apiKey
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`AssemblyAI upload error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.upload_url;
    } catch (error) {
      console.error("Error uploading audio to AssemblyAI:", error);
      throw error;
    }
  }

  async transcribeAudio(audioUrl: string): Promise<string> {
    try {
      console.log("Transcribing audio with AssemblyAI");
      
      if (!this.apiKey) {
        throw new Error("AssemblyAI API key not set");
      }
      
      // First, check if we need to upload the audio
      let uploadUrl = audioUrl;
      if (audioUrl.startsWith('data:')) {
        uploadUrl = await this.uploadAudio(audioUrl);
      }
      
      // Start the transcription
      const response = await fetch(this.baseUrl + "/transcript", {
        method: "POST",
        headers: {
          "authorization": this.apiKey,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          audio_url: uploadUrl,
          speaker_labels: false,
          format_text: true,
          auto_chapters: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`AssemblyAI transcription error: ${response.status}`);
      }
      
      const data = await response.json();
      const transcriptId = data.id;
      
      // Poll for the result
      return await this.pollTranscription(transcriptId);
    } catch (error) {
      console.error("Error transcribing audio with AssemblyAI:", error);
      throw error;
    }
  }

  private async pollTranscription(transcriptId: string): Promise<string> {
    let status = "processing";
    let attempts = 0;
    const maxAttempts = 30; // Maximum number of polling attempts
    
    while (status === "processing" || status === "queued") {
      if (attempts >= maxAttempts) {
        throw new Error("Transcription timed out");
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
      
      const response = await fetch(`${this.baseUrl}/transcript/${transcriptId}`, {
        headers: {
          "authorization": this.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`AssemblyAI poll error: ${response.status}`);
      }
      
      const data = await response.json();
      status = data.status;
      
      if (status === "completed") {
        return data.text;
      }
      
      attempts++;
    }
    
    throw new Error(`Transcription failed with status: ${status}`);
  }

  async generateSrtCaptions(audioUrl: string): Promise<string> {
    try {
      console.log("Generating SRT captions with AssemblyAI");
      
      if (!this.apiKey) {
        throw new Error("AssemblyAI API key not set");
      }
      
      // First, check if we need to upload the audio
      let uploadUrl = audioUrl;
      if (audioUrl.startsWith('data:')) {
        uploadUrl = await this.uploadAudio(audioUrl);
      }
      
      // Start the transcription
      const response = await fetch(this.baseUrl + "/transcript", {
        method: "POST",
        headers: {
          "authorization": this.apiKey,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          audio_url: uploadUrl,
          speaker_labels: false,
          format_text: true,
          auto_chapters: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`AssemblyAI transcription error: ${response.status}`);
      }
      
      const data = await response.json();
      const transcriptId = data.id;
      
      // Poll for the result
      let status = "processing";
      let attempts = 0;
      const maxAttempts = 30; // Maximum number of polling attempts
      
      while (status === "processing" || status === "queued") {
        if (attempts >= maxAttempts) {
          throw new Error("Captions generation timed out");
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
        
        const pollResponse = await fetch(`${this.baseUrl}/transcript/${transcriptId}`, {
          headers: {
            "authorization": this.apiKey
          }
        });
        
        if (!pollResponse.ok) {
          throw new Error(`AssemblyAI poll error: ${pollResponse.status}`);
        }
        
        const pollData = await pollResponse.json();
        status = pollData.status;
        
        if (status === "completed") {
          // Get SRT format
          const srtResponse = await fetch(`${this.baseUrl}/transcript/${transcriptId}/srt`, {
            headers: {
              "authorization": this.apiKey
            }
          });
          
          if (!srtResponse.ok) {
            throw new Error(`AssemblyAI SRT error: ${srtResponse.status}`);
          }
          
          return await srtResponse.text();
        }
        
        attempts++;
      }
      
      throw new Error(`Captions generation failed with status: ${status}`);
    } catch (error) {
      console.error("Error generating captions with AssemblyAI:", error);
      throw error;
    }
  }
}

export const assemblyAIService = new AssemblyAIService();
