# API Routes Documentation

## Overview

All API routes in Lessgo follow Next.js 14 App Router conventions. Each route is defined in a `route.ts` file within its respective directory.

## API Endpoints

### 1. Field Inference & Validation

#### `/api/infer-fields`
**Method**: POST
**Purpose**: Infer business fields from user's startup description
**Request**:
```json
{
  "input": "I'm building a SaaS tool for developers...",
  "includeValidation": true
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "raw": { "marketCategory": "SaaS", ... },
    "validated": {
      "marketCategory": { "value": "SaaS", "confidence": 0.92 }
    }
  }
}
```
**Common Issues**:
- OpenAI API timeout (increase timeout to 30s)
- Invalid JSON from LLM (retry with better prompt)

#### `/api/validate-fields`
**Method**: POST
**Purpose**: Validate individual field values
**Request**:
```json
{
  "field": "marketCategory",
  "value": "SaaS"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "field": "marketCategory",
    "validated": "SaaS",
    "confidence": 0.95
  }
}
```

### 2. Content Generation

#### `/api/generate-landing`
**Method**: POST
**Purpose**: Generate complete landing page content
**Request**:
```json
{
  "prompt": "Full prompt with business context...",
  "sections": ["hero", "features", "pricing"],
  "stream": false
}
```
**Response**: Large JSON with all section content
**Timeout**: 60 seconds
**Common Issues**:
- Token limit exceeded (reduce sections)
- Incomplete generation (retry with simpler prompt)

#### `/api/regenerate-content`
**Method**: POST
**Purpose**: Regenerate content for specific sections
**Request**:
```json
{
  "sectionId": "hero",
  "context": { "validatedFields": {...} },
  "includeDesign": false
}
```

#### `/api/regenerate-element`
**Method**: POST
**Purpose**: Regenerate single element content
**Request**:
```json
{
  "sectionId": "hero",
  "elementKey": "headline",
  "currentContent": "Old headline",
  "context": {...}
}
```

#### `/api/market-insights`
**Method**: POST
**Purpose**: Generate features and hidden insights
**Request**:
```json
{
  "category": "SaaS",
  "subcategory": "Developer Tools",
  "problem": "...",
  "audience": "Developers"
}
```
**Response**:
```json
{
  "features": [
    { "feature": "API Integration", "benefit": "..." }
  ],
  "hiddenInferredFields": {
    "persona": "Technical Decision Maker",
    "painPoints": [...]
  }
}
```

### 3. Draft Management

#### `/api/saveDraft`
**Method**: POST
**Purpose**: Save draft state to database
**Request**:
```json
{
  "tokenId": "abc123",
  "state": {
    "inputText": "...",
    "confirmedFields": {...},
    "validatedFields": {...},
    "stepIndex": 3
  }
}
```
**Auto-save**: Triggered every 2 seconds of inactivity

#### `/api/loadDraft`
**Method**: GET
**Purpose**: Load saved draft
**Query**: `?tokenId=abc123`
**Response**: Complete draft state or 404 if not found

### 4. Publishing

#### `/api/publish`
**Method**: POST
**Purpose**: Publish landing page
**Request**:
```json
{
  "tokenId": "abc123",
  "slug": "my-product",
  "pageData": {...}
}
```
**Validation**:
- Slug uniqueness check
- Content validation
- User permissions

#### `/api/checkSlug`
**Method**: POST
**Purpose**: Check if slug is available
**Request**:
```json
{
  "slug": "my-product"
}
```
**Response**:
```json
{
  "available": true,
  "suggestions": ["my-product-1", "my-product-app"]
}
```

### 5. Other Endpoints

#### `/api/start`
**Method**: POST
**Purpose**: Initialize new project
**Request**:
```json
{
  "userId": "user_123"
}
```
**Response**: 
```json
{
  "tokenId": "generated_token",
  "projectId": "project_id"
}
```

#### `/api/subscribe`
**Method**: POST
**Purpose**: Newsletter subscription
**Request**:
```json
{
  "email": "user@example.com"
}
```

#### `/api/forms/submit`
**Method**: POST
**Purpose**: Handle form submissions from published pages
**Request**:
```json
{
  "formId": "form_123",
  "data": {...}
}
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional context"
}
```

### HTTP Status Codes
- `200`: Success
- `400`: Bad Request (invalid input)
- `401`: Unauthorized
- `404`: Not Found
- `429`: Rate Limited
- `500`: Internal Server Error
- `503`: Service Unavailable (OpenAI down)

## Rate Limiting

- OpenAI endpoints: 10 requests per minute
- Draft saves: No limit (but debounced client-side)
- Publishing: 5 per hour

## Authentication

Most endpoints require a valid `tokenId` that maps to a project. The token is validated against the database.

## Testing with cURL

### Test field inference
```bash
curl -X POST http://localhost:3000/api/infer-fields \
  -H "Content-Type: application/json" \
  -d '{"input": "SaaS for developers", "includeValidation": true}'
```

### Test draft loading
```bash
curl http://localhost:3000/api/loadDraft?tokenId=your_token_here
```

### Test slug availability
```bash
curl -X POST http://localhost:3000/api/checkSlug \
  -H "Content-Type: application/json" \
  -d '{"slug": "my-product"}'
```

## Common Issues & Solutions

### 1. OpenAI API Errors
**Issue**: `Request failed with status code 429`
**Solution**: Rate limited - implement exponential backoff

### 2. JSON Parse Errors
**Issue**: `Unexpected token in JSON`
**Solution**: LLM returned malformed JSON - add retry logic

### 3. Timeout Errors
**Issue**: `Request timeout`
**Solution**: Increase timeout or reduce payload size

### 4. Token Validation Failed
**Issue**: `Invalid token`
**Solution**: Check token exists in database and not expired

### 5. CORS Errors
**Issue**: `Access-Control-Allow-Origin`
**Solution**: Check Next.js CORS configuration

## Environment Variables

Required in `.env.local`:
```
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
```

## Performance Tips

1. **Use streaming** for large content generation
2. **Implement caching** for repeated requests
3. **Batch API calls** when possible
4. **Use database indexes** on tokenId and slug
5. **Add request queuing** for OpenAI calls

## Monitoring

Log these for debugging:
- Request/response payloads
- API latency
- Error rates
- Token usage (OpenAI)
- Database query time