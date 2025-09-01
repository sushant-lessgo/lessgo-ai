// services/pexelsApi.ts - Pexels API integration service
import type { ImageAsset } from '@/types/core/images';
import { logger } from '@/lib/logger';

// Pexels API types
export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

export interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
  prev_page?: string;
}

export interface PexelsCuratedResponse {
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
  prev_page?: string;
}

export interface PexelsSearchOptions {
  query: string;
  page?: number;
  per_page?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  color?: 'red' | 'orange' | 'yellow' | 'green' | 'turquoise' | 'blue' | 'violet' | 'pink' | 'brown' | 'black' | 'gray' | 'white';
  locale?: string;
}

export interface StockPhoto {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  author: string;
  authorUrl: string;
  downloadUrl: string;
  tags: string[];
  attribution: string;
  licensing: {
    license: 'pexels';
    details: {
      attribution: string;
      commercialUse: boolean;
      editingAllowed: boolean;
      distributionAllowed: boolean;
    };
  };
}

class PexelsApiService {
  private baseUrl = 'https://api.pexels.com/v1';
  private apiKey: string | null = null;

  constructor() {
    // Access key from environment variable (server-side only)
    this.apiKey = process.env.PEXELS_API_KEY || null;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private getHeaders(): HeadersInit {
    if (!this.apiKey) {
      throw new Error('Pexels API key not provided. Please configure your API key.');
    }

    return {
      'Authorization': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async searchPhotos(options: PexelsSearchOptions): Promise<StockPhoto[]> {
    try {
      const params = new URLSearchParams({
        query: options.query,
        page: (options.page || 1).toString(),
        per_page: (options.per_page || 20).toString(),
      });

      if (options.orientation) params.append('orientation', options.orientation);
      if (options.size) params.append('size', options.size);
      if (options.color) params.append('color', options.color);
      if (options.locale) params.append('locale', options.locale);

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      const data: PexelsSearchResponse = await response.json();
      
      return data.photos.map(this.convertToStockPhoto);
    } catch (error) {
      logger.error('Error searching Pexels photos:', error);
      throw error;
    }
  }

  async getCuratedPhotos(page: number = 1, perPage: number = 20): Promise<StockPhoto[]> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      const response = await fetch(`${this.baseUrl}/curated?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      const data: PexelsCuratedResponse = await response.json();
      return data.photos.map(this.convertToStockPhoto);
    } catch (error) {
      logger.error('Error fetching curated photos:', error);
      throw error;
    }
  }

  async getPhoto(id: number): Promise<StockPhoto | null> {
    try {
      const response = await fetch(`${this.baseUrl}/photos/${id}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      const data: PexelsPhoto = await response.json();
      return this.convertToStockPhoto(data);
    } catch (error) {
      logger.error('Error fetching photo:', error);
      throw error;
    }
  }

  private convertToStockPhoto = (photo: PexelsPhoto): StockPhoto => {
    const attribution = `Photo by ${photo.photographer} on Pexels`;
    
    return {
      id: photo.id.toString(),
      url: photo.src.medium,
      alt: photo.alt || `Photo by ${photo.photographer}`,
      width: photo.width,
      height: photo.height,
      author: photo.photographer,
      authorUrl: photo.photographer_url,
      downloadUrl: photo.src.large,
      tags: [], // Pexels doesn't provide tags in the API response
      attribution,
      licensing: {
        license: 'pexels',
        details: {
          attribution,
          commercialUse: true,
          editingAllowed: true,
          distributionAllowed: true,
        },
      },
    };
  };

  // Convert StockPhoto to ImageAsset for store
  convertToImageAsset(stockPhoto: StockPhoto, targetId: string): any {
    return {
      id: targetId,
      url: stockPhoto.url,
      alt: stockPhoto.alt,
      source: 'pexels' as any,
      urls: {
        original: stockPhoto.downloadUrl,
        large: stockPhoto.downloadUrl,
        medium: stockPhoto.url,
        small: stockPhoto.url,
      },
      metadata: {
        file: {
          originalName: `pexels-${stockPhoto.id}.jpg`,
          size: 0, // Unknown from API
          mimeType: 'image/jpeg',
          extension: 'jpg',
        },
        image: {
          width: stockPhoto.width,
          height: stockPhoto.height,
          aspectRatio: stockPhoto.width / stockPhoto.height,
          orientation: stockPhoto.width > stockPhoto.height ? 'landscape' : stockPhoto.height > stockPhoto.width ? 'portrait' : 'square',
          hasAlpha: false,
          isAnimated: false,
        },
      },
      tags: stockPhoto.tags,
      licensing: stockPhoto.licensing as any,
      timestamps: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  // Utility methods for common searches
  async searchBusinessPhotos(query: string = 'business'): Promise<StockPhoto[]> {
    return this.searchPhotos({
      query: `${query} business professional office`,
      per_page: 20,
      orientation: 'landscape',
    });
  }

  async searchTechPhotos(query: string = 'technology'): Promise<StockPhoto[]> {
    return this.searchPhotos({
      query: `${query} technology computer software`,
      per_page: 20,
      color: 'blue',
    });
  }

  async searchPeoplePhotos(query: string = 'people'): Promise<StockPhoto[]> {
    return this.searchPhotos({
      query: `${query} people person portrait`,
      per_page: 20,
      orientation: 'portrait',
    });
  }

  async searchAbstractPhotos(query: string = 'abstract'): Promise<StockPhoto[]> {
    return this.searchPhotos({
      query: `${query} abstract pattern background`,
      per_page: 20,
    });
  }

  async searchNaturePhotos(query: string = 'nature'): Promise<StockPhoto[]> {
    return this.searchPhotos({
      query: `${query} nature landscape outdoor`,
      per_page: 20,
      orientation: 'landscape',
    });
  }

  async searchLifestylePhotos(query: string = 'lifestyle'): Promise<StockPhoto[]> {
    return this.searchPhotos({
      query: `${query} lifestyle people daily life`,
      per_page: 20,
    });
  }

  // Collection-based searches (Pexels doesn't have collections like Unsplash, so we simulate with curated + search)
  async getFeaturedPhotos(count: number = 20): Promise<StockPhoto[]> {
    return this.getCuratedPhotos(1, count);
  }

  async getPopularPhotos(count: number = 20): Promise<StockPhoto[]> {
    // Get curated photos which are essentially popular/featured
    return this.getCuratedPhotos(1, count);
  }

  // Color-based searches
  async searchByColor(color: PexelsSearchOptions['color'], query: string = ''): Promise<StockPhoto[]> {
    return this.searchPhotos({
      query: query || 'background',
      color,
      per_page: 20,
    });
  }

  // Orientation-based searches
  async searchLandscapePhotos(query: string = 'landscape'): Promise<StockPhoto[]> {
    return this.searchPhotos({
      query,
      orientation: 'landscape',
      per_page: 20,
    });
  }

  async searchPortraitPhotos(query: string = 'portrait'): Promise<StockPhoto[]> {
    return this.searchPhotos({
      query,
      orientation: 'portrait',
      per_page: 20,
    });
  }

  async searchSquarePhotos(query: string = 'square'): Promise<StockPhoto[]> {
    return this.searchPhotos({
      query,
      orientation: 'square',
      per_page: 20,
    });
  }
}

// Export singleton instance
export const pexelsApi = new PexelsApiService();
export default pexelsApi;