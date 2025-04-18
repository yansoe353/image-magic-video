
export class PexelsService {
  private baseUrl: string = "https://rhbpeivthnmvzhblnvya.supabase.co/functions/v1/media-services";

  async searchImages(query: string, perPage: number = 10, page: number = 1): Promise<any> {
    try {
      console.log("Searching Pexels for images:", query);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service: 'pexels',
          action: 'search',
          query,
          perPage,
          page
        })
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
