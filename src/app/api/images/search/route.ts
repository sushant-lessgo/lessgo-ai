// app/api/images/search/route.ts - Server-side Pexels API proxy
import { NextRequest, NextResponse } from 'next/server';
import { withFormRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

interface PexelsPhoto {
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

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
  prev_page?: string;
}

interface StockPhoto {
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

const convertToStockPhoto = (photo: PexelsPhoto): StockPhoto => {
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
    tags: [],
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

async function imageSearchHandler(req: NextRequest) {
  try {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      logger.error('Pexels API key not configured');
      return NextResponse.json(
        { error: 'Image search service not available' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { 
      query, 
      page = 1, 
      per_page = 20, 
      orientation, 
      size, 
      color, 
      locale,
      searchType = 'search' // 'search', 'curated', or specific method
    } = body;

    if (!query && searchType === 'search') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const baseUrl = 'https://api.pexels.com/v1';
    const headers = {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    };

    let url: string;
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
    });

    // Handle different search types
    if (searchType === 'curated') {
      url = `${baseUrl}/curated?${params}`;
    } else if (searchType === 'search') {
      params.append('query', query);
      if (orientation) params.append('orientation', orientation);
      if (size) params.append('size', size);
      if (color) params.append('color', color);
      if (locale) params.append('locale', locale);
      url = `${baseUrl}/search?${params}`;
    } else {
      // Handle specialized search methods
      const searchQuery = getSpecializedQuery(searchType, query);
      params.append('query', searchQuery);
      if (orientation) params.append('orientation', orientation);
      if (size) params.append('size', size);
      if (color) params.append('color', color);
      url = `${baseUrl}/search?${params}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      logger.error(`Pexels API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'Failed to fetch images from Pexels' },
        { status: response.status }
      );
    }

    const data: PexelsSearchResponse = await response.json();
    const stockPhotos = data.photos.map(convertToStockPhoto);

    return NextResponse.json({
      success: true,
      photos: stockPhotos,
      pagination: {
        total: data.total_results,
        page: data.page,
        perPage: data.per_page,
        hasNext: !!data.next_page,
        hasPrev: !!data.prev_page
      }
    });

  } catch (error) {
    logger.error('Image search error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Specialized search query builder
function getSpecializedQuery(searchType: string, query: string): string {
  switch (searchType) {
    case 'business':
      return `${query} business professional office`;
    case 'tech':
      return `${query} technology computer software`;
    case 'people':
      return `${query} people person portrait`;
    case 'abstract':
      return `${query} abstract pattern background`;
    case 'nature':
      return `${query} nature landscape outdoor`;
    case 'lifestyle':
      return `${query} lifestyle people daily life`;
    default:
      return query;
  }
}

// Apply rate limiting for image search requests
export const POST = withFormRateLimit(imageSearchHandler);