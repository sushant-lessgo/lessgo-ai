# Pexels API Setup for Image Toolbar

The image toolbar now includes real Pexels integration for stock photos. Follow these steps to configure your API key:

## 1. Get Your Pexels API Key

1. Go to [Pexels API](https://www.pexels.com/api/)
2. Create an account or sign in
3. Request access to the API (it's free!)
4. Once approved, go to your [API dashboard](https://www.pexels.com/api/new/)
5. Copy your **API Key**

## 2. Configure the API Key

### Environment Variable (Recommended)
Add to your `.env.local` file:
```bash
NEXT_PUBLIC_PEXELS_API_KEY=your_api_key_here
```

### Runtime Configuration (Alternative)
If you need to set the key dynamically:
```javascript
import { pexelsApi } from '@/services/pexelsApi';

// Set the API key when user provides it
pexelsApi.setApiKey('your_api_key_here');
```

## 3. Testing the Integration

1. Start your development server: `npm run dev`
2. Go to any page with the image editor
3. Click on an image to open the toolbar
4. Click "Stock Photos" - you should see real Pexels photos

## 4. API Limits

### Free Tier Limits:
- **200 requests per hour**
- **20,000 requests per month**
- No attribution required (but appreciated)

### Rate Limits:
- More generous than Unsplash
- Suitable for most development and production needs

## 5. Attribution (Optional but Appreciated)

Unlike Unsplash, Pexels doesn't require attribution, but it's appreciated. The toolbar automatically:
- Shows photographer name in photo previews
- Includes attribution in image metadata
- Provides proper attribution footer

## 6. Features Included

✅ **Search functionality** - Search by keywords
✅ **Category browsing** - Business, Tech, People, Nature, Lifestyle, Featured
✅ **Curated photos** - High-quality featured photos
✅ **Color filtering** - Search by color
✅ **Orientation filtering** - Landscape, portrait, square
✅ **Proper attribution** - Automatic photographer credits
✅ **Error handling** - User-friendly error messages
✅ **Loading states** - Smooth user experience
✅ **Image metadata** - Proper width/height information

## 7. Available Categories

- **Featured** - Curated high-quality photos
- **Business** - Office, professional, corporate
- **Tech** - Technology, computers, software
- **People** - Portraits, lifestyle, human subjects
- **Nature** - Landscapes, outdoor, natural scenes
- **Lifestyle** - Daily life, activities, casual scenes

## 8. Advanced Search Options

The Pexels API supports:
- **Color filters**: red, orange, yellow, green, turquoise, blue, violet, pink, brown, black, gray, white
- **Orientation**: landscape, portrait, square
- **Size**: large, medium, small
- **Locale**: Different language support

## 9. Troubleshooting

### "Failed to load photos" Error:
- Check your API key is correct
- Verify the key is set in environment variables
- Ensure you haven't exceeded rate limits

### Photos not loading:
- Check network connectivity
- Verify API key is active on Pexels
- Check browser console for detailed errors

### Rate limit exceeded:
- Wait for the rate limit to reset (hourly)
- Pexels has generous limits (200/hour, 20k/month)
- Consider implementing client-side caching

## 10. API Differences from Unsplash

### Advantages:
- **Higher rate limits** (200/hour vs 50/hour)
- **No attribution required** (optional)
- **More monthly requests** (20k vs 5k)
- **Simpler licensing** - All photos free for commercial use

### Considerations:
- **No collections** - Uses curated photos instead
- **No tags in API** - Relies on search queries
- **Different photo styles** - Different aesthetic compared to Unsplash

## 11. Usage Examples

```javascript
// Search for business photos
const businessPhotos = await pexelsApi.searchBusinessPhotos('office');

// Search by color
const bluePhotos = await pexelsApi.searchByColor('blue', 'technology');

// Get curated photos
const featuredPhotos = await pexelsApi.getFeaturedPhotos(20);

// Search with specific orientation
const landscapePhotos = await pexelsApi.searchLandscapePhotos('mountain');
```

## 12. Next Steps

Consider implementing:
- **Image caching** to reduce API calls
- **User preferences** for image categories
- **Advanced search filters** (color, orientation, size)
- **Infinite scroll** for more photos
- **Favorites system** for users to save preferred photos

## 13. License Information

All Pexels photos are:
- ✅ **Free for commercial use**
- ✅ **No attribution required**
- ✅ **Can be modified**
- ✅ **Can be distributed**
- ❌ **Cannot be sold as-is**
- ❌ **Cannot be used to compete with Pexels**

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your API key is active on Pexels
3. Test the API key with a simple request: `https://api.pexels.com/v1/curated?per_page=1`
4. Check [Pexels API documentation](https://www.pexels.com/api/documentation/)
5. Check [Pexels API status](https://status.pexels.com/)