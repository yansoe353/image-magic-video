
export class PexelsService {
  private apiKey: string = ""; // This will be set via initialize method
  private baseUrl: string = "https://api.pexels.com/v1";

  initialize(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchImages(query: string, perPage: number = 10, page: number = 1): Promise<any> {
    try {
      console.log("Searching Pexels for images:", query);
      
      if (!this.apiKey) {
        throw new Error("Pexels API key not set");
      }
      
      const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;
      
      const response = await fetch(url, {
        headers: {
          "Authorization": this.apiKey
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Pexels API error:", response.status, response.statusText);
        console.error("Error details:", errorText);
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.photos;
    } catch (error) {
      console.error("Error searching Pexels images:", error);
      throw error;
    }
  }

  async getRandomImage(query: string): Promise<string> {
    const photos = await this.searchImages(query);
    if (!photos || photos.length === 0) {
      throw new Error("No images found for query: " + query);
    }
    
    const randomIndex = Math.floor(Math.random() * photos.length);
    return photos[randomIndex].src.large;
  }
}

export const pexelsService = new PexelsService();
