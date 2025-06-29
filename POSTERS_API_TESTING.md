# Posters API Testing Guide

## Overview
The Posters module provides both AI-generated and human-uploaded poster functionality with comprehensive CRUD operations.

## Prerequisites
1. **ngrok tunnel active**: `ngrok http 3001` (for AI generation)
2. **Server running**: `npm run start:dev`
3. **MongoDB connected**: Ensure database connection is active
4. **Sample data**: Need existing content_id and asset IDs for testing

## API Endpoints

### 1. Generate AI Poster
**POST** `/posters/generate`

Generates a poster using Runway API with reference images from existing assets.

**Request Body:**
```json
{
  "content_id": "your-content-uuid",
  "slug": "sample-movie-slug",
  "dimension": "1920:1080",
  "use_case": "title_marketing",
  "channel": "instagram",
  "ai_image_id": ["ai-image-uuid-1"],
  "screenshot_ids": ["image-uuid-1", "image-uuid-2"],
  "title_logo_id": ["title-logo-uuid-1"],
  "tagline_id": ["tagline-uuid-1"]
}
```

**Required Fields:**
- `content_id`: Must exist in Content collection
- `slug`: String identifier
- `dimension`: One of the AIDimension enum values
- At least one asset array must be non-empty

**Optional Fields:**
- `use_case`: One of the UseCase enum values
- `channel`: Channel enum value
- `ai_image_id`: Array of AI image UUIDs
- `screenshot_ids`: Array of image UUIDs
- `title_logo_id`: Array of title logo UUIDs
- `copy_id`: Array of copy UUIDs
- `tagline_id`: Array of tagline UUIDs

**Sample cURL:**
```bash
curl -X POST http://localhost:3001/posters/generate \
  -H "Content-Type: application/json" \
  -d '{
    "content_id": "sample-content-id",
    "slug": "test-movie",
    "dimension": "1920:1080",
    "ai_image_id": ["sample-ai-image-id"]
  }'
```

**Response:**
```json
{
  "poster_id": "generated-uuid",
  "content_id": "your-content-uuid",
  "slug": "sample-movie-slug",
  "channel": "instagram",
  "dimension": "1920:1080",
  "ai_image_id": ["ai-image-uuid-1"],
  "screenshot_ids": ["image-uuid-1", "image-uuid-2"],
  "title_logo_id": ["title-logo-uuid-1"],
  "copy_id": [],
  "tagline_id": ["tagline-uuid-1"],
  "use_case": "title_marketing",
  "poster_type": "ai_generated",
  "poster_url": "/uploads/posters/generated-uuid.png",
  "prompt_text": "Movie Title. Tagline text. Use case: title_marketing",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### 2. Upload Human Poster
**POST** `/posters/upload`

Uploads a human-created poster file.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `poster`: Image file (required)
- `content_id`: UUID string (required)
- `slug`: String (required)
- `use_case`: UseCase enum (optional)
- `channel`: Channel enum (optional)
- `dimension`: AIDimension enum (optional)
- `ai_image_id`: JSON array of UUIDs (optional)
- `screenshot_ids`: JSON array of UUIDs (optional)
- `title_logo_id`: JSON array of UUIDs (optional)
- `copy_id`: JSON array of UUIDs (optional)
- `tagline_id`: JSON array of UUIDs (optional)

**File Restrictions:**
- **Allowed types**: JPEG, PNG, GIF, WebP
- **Max size**: 10MB

**Sample cURL:**
```bash
curl -X POST http://localhost:3001/posters/upload \
  -F "poster=@/path/to/your/poster.jpg" \
  -F "content_id=sample-content-id" \
  -F "slug=test-movie" \
  -F "use_case=title_marketing" \
  -F "channel=instagram"
```

### 3. Get Poster by ID
**GET** `/posters/:poster_id`

**Sample cURL:**
```bash
curl http://localhost:3001/posters/your-poster-uuid
```

### 4. Get All Posters (with filtering)
**GET** `/posters`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Sort field (default: 'created_at')
- `order`: Sort order 'asc' or 'desc' (default: 'desc')
- `content_id`: Filter by content ID
- `slug`: Filter by slug (regex search)
- `channel`: Filter by channel
- `dimension`: Filter by dimension
- `use_case`: Filter by use case
- `poster_type`: Filter by type ('ai_generated' or 'human_uploaded')
- `prompt_text`: Filter by prompt text (regex search)

**Sample cURL:**
```bash
# Get all posters
curl "http://localhost:3001/posters"

# Get AI-generated posters only
curl "http://localhost:3001/posters?poster_type=ai_generated"

# Get posters for specific content with pagination
curl "http://localhost:3001/posters?content_id=sample-id&page=1&limit=5"
```

### 5. Get Posters by Content ID
**GET** `/posters/content/:content_id`

**Sample cURL:**
```bash
curl http://localhost:3001/posters/content/your-content-uuid
```

### 6. Get Posters by Channel
**GET** `/posters/channel/:channel`

**Sample cURL:**
```bash
curl http://localhost:3001/posters/channel/instagram
```

### 7. Get Posters by Use Case
**GET** `/posters/use-case/:use_case`

**Sample cURL:**
```bash
curl http://localhost:3001/posters/use-case/title_marketing
```

### 8. Get Posters by Type
**GET** `/posters/type/:poster_type`

**Sample cURL:**
```bash
# Get AI-generated posters
curl http://localhost:3001/posters/type/ai_generated

# Get human-uploaded posters
curl http://localhost:3001/posters/type/human_uploaded
```

## Schema Changes Notes

### Updated Field Requirements
- **`use_case`**: Now **optional** for both AI generation and human uploads
- **`prompt_text`**: Now **required** for all posters (auto-generated for uploads)

### Prompt Text Generation
- **AI Generated**: `"[Content.title]. [Tagline text]. Use case: [use_case]"` (if use_case provided)
- **Human Uploaded**: `"Human uploaded poster for [Content.title]"`
- **Fallback**: `"Generate a creative poster"` if no content available

## Enum Values

### Channel
- `facebook`
- `instagram`
- `youtube`
- `twitter`
- `linkedin`
- `tiktok`
- `whatsapp`
- `clevertap`

### UseCase (Optional)
- `app_thumbnail`
- `title_marketing`
- `social_media_organic`
- `reengagement`
- `performance_marketing`

### AIDimension (for ratio parameter)
- `1920:1080`
- `1080:1920`
- `1024:1024`
- `1360:768`
- `1080:1080`
- `1168:880`
- `1440:1080`
- `1080:1440`
- `1808:768`
- `2112:912`
- `1280:720`
- `720:1280`
- `720:720`
- `960:720`
- `720:960`
- `1680:720`

### PosterType
- `ai_generated`
- `human_uploaded`

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "At least one asset ID array must be provided and non-empty"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Content with ID sample-id not found"
}
```

### 413 File Too Large
```json
{
  "statusCode": 400,
  "message": "File size too large. Maximum 10MB allowed"
}
```

### 415 Unsupported Media Type
```json
{
  "statusCode": 400,
  "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP files are allowed"
}
```

### 503 Service Unavailable
```json
{
  "statusCode": 503,
  "message": "Runway API failed: [specific error message]"
}
```

## Testing Workflow

### 1. Prepare Test Data
```bash
# Ensure you have existing records:
# - At least one Content record
# - At least one Image, AIImage, TitleLogo, or Tagline record
```

### 2. Test AI Generation
```bash
# 1. Start ngrok
ngrok http 3001

# 2. Update baseUrl in poster.service.ts with your ngrok URL

# 3. Test AI poster generation (minimal request)
curl -X POST http://localhost:3001/posters/generate \
  -H "Content-Type: application/json" \
  -d '{
    "content_id": "your-existing-content-id",
    "slug": "test-movie",
    "dimension": "1920:1080",
    "ai_image_id": ["your-existing-ai-image-id"]
  }'
```

### 3. Test File Upload
```bash
# Create a test image file (minimal request)
curl -X POST http://localhost:3001/posters/upload \
  -F "poster=@test-poster.jpg" \
  -F "content_id=your-existing-content-id" \
  -F "slug=test-movie"
```

### 4. Test Query Operations
```bash
# Get all posters
curl "http://localhost:3001/posters"

# Get by specific filters
curl "http://localhost:3001/posters?poster_type=ai_generated&limit=5"
```
## File Storage
- **AI Generated**: `/uploads/posters/{uuid}.png`
- **Human Uploaded**: `/uploads/posters/{uuid}.{original-extension}`
- **Access URL**: `http://localhost:3001/uploads/posters/{filename}`

## AI Generation Flow
1. **Validation**: Content exists, at least one asset array provided
2. **Asset Collection**: Fetch URLs from AIImage, Image, TitleLogo collections
3. **Reference Building**: Create reference images with auto-generated tags
4. **Prompt Building**: Combine content title + tagline text + use case (if provided)
5. **Runway API**: Call with gen4_image model and reference images
6. **File Download**: Save generated image to local storage
7. **Database**: Create poster record with all relationships

## Human Upload Flow
1. **File Validation**: Type and size checks
2. **Content Fetch**: Get content data for prompt generation
3. **File Storage**: Save to uploads/posters directory
4. **Database**: Create poster record with uploaded file path and auto-generated prompt

## Notes
- **use_case is now optional** - you can create posters without specifying a use case
- **prompt_text is auto-generated** for both AI and human uploads
- **ngrok required** for AI generation (Runway API needs HTTPS URLs)
- **Mock mode available** in service for testing without Runway API
- **Comprehensive logging** for debugging
- **Proper error handling** with meaningful messages
- **File serving** automatically configured via main.ts 

## 🧪 **Test Comprehensive Assets Endpoint**

### **Quick Test Commands**

```bash
# Get all assets for a content (replace with your content_id)
curl "http://localhost:3001/content/YOUR_CONTENT_ID/assets"

# Pretty print with jq
curl "http://localhost:3001/content/YOUR_CONTENT_ID/assets" | jq '.'

# Get just the summary
curl "http://localhost:3001/content/YOUR_CONTENT_ID/assets" | jq '.summary'

# Count assets by type
curl "http://localhost:3001/content/YOUR_CONTENT_ID/assets" | jq '{
  images: (.images | length),
  posters: (.posters | length), 
  ai_images: (.ai_images | length),
  title_logos: (.title_logos | length),
  taglines: (.taglines | length),
  copies: (.copies | length)
}'
```

### **Expected Response Structure**
```json
{
  "content": {
    "content_id": "uuid",
    "title": "Content Title",
    "description": "Content Description", 
    "genre": "Genre",
    "language": "Language",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "images": [],
  "posters": [],
  "title_logos": [],
  "taglines": [],
  "copies": [],
  "ai_images": [],
  "summary": {
    "total_images": 0,
    "total_posters": 0,
    "total_title_logos": 0,
    "total_taglines": 0,
    "total_copies": 0,
    "total_ai_images": 0,
    "last_updated": "2024-01-01T00:00:00.000Z"
  }
}
```

## 📋 **All Available API Endpoints**
