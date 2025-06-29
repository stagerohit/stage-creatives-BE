# Postman Setup Guide for Posters API

## 🚨 **Important: API Key Update**

**Runway API Key Format Changed!** The API key has been updated to use the new format:
- ✅ **Fixed:** `key_qMYAXNGNvSGLHDEqTY2WKQM7JWlCLDqiGLTGcTH0RKA`
- ❌ **Old:** `rml_qMYAXNGNvSGLHDEqTY2WKQM7JWlCLDqiGLTGcTH0RKA`

## 🧪 **Testing Options**

### Option 1: Mock Mode (Easiest)
For testing without Runway API calls:
1. Edit `src/posters/services/poster.service.ts`
2. Change: `private readonly useMockMode = false;` → `private readonly useMockMode = true;`
3. Restart server
4. AI generation will use placeholder images from picsum.photos

### Option 2: Real Runway API
For real AI generation:
1. Ensure `useMockMode = false` in service
2. Start ngrok: `ngrok http 3001`
3. Update `baseUrl` in service with ngrok URL
4. Test with real API calls

## 📥 **Import Collection**

### Method 1: Import JSON File
1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `Posters_API_Postman_Collection.json`
5. Click **Import**

### Method 2: Copy-Paste JSON
1. Open Postman
2. Click **Import** → **Raw text**
3. Copy the entire JSON content from `Posters_API_Postman_Collection.json`
4. Paste and click **Continue** → **Import**

## ⚙️ **Configure Variables**

### Collection Variables (Required)
1. Click on the imported collection
2. Go to **Variables** tab
3. Update these values:

| Variable | Current Value | Your Value |
|----------|---------------|------------|
| `baseUrl` | `http://localhost:3001` | Keep as is (or change port) |
| `contentId` | `your-existing-content-id` | **Replace with real Content ID** |
| `posterId` | _(empty)_ | Auto-populated from responses |

### How to Get Real IDs
```bash
# Get existing Content IDs
curl "http://localhost:3001/content" | grep content_id

# Get existing Image IDs  
curl "http://localhost:3001/images" | grep image_id

# Get existing AI Image IDs
curl "http://localhost:3001/ai-images" | grep ai_image_id
```

## 🧪 **Testing Workflow**

### Step 1: Test Server Health
**Request:** `4. Get All Posters`
- Should return: `{"data":[],"total":0,"page":1,"limit":10}`
- Confirms server is running

### Step 2: Update Request Bodies
Before testing generation/upload, update these fields in request bodies:

#### For AI Generation Requests:
```json
{
  "content_id": "your-real-content-id",
  "ai_image_id": ["your-real-ai-image-id"],
  "screenshot_ids": ["your-real-image-id"],
  "title_logo_id": ["your-real-title-logo-id"],
  "tagline_id": ["your-real-tagline-id"]
}
```

#### For Upload Requests:
- Update `content_id` in form data
- Select a real image file for the `poster` field

### Step 3: Test Basic Operations

#### 3a. Test Minimal AI Generation
**Request:** `1b. Generate AI Poster (Minimal)`
1. Update `content_id` in body
2. Update `ai_image_id` array with real ID
3. Send request
4. Check response for `poster_id` (auto-saved to variables)

#### 3b. Test File Upload
**Request:** `2b. Upload Human Poster (Minimal)`
1. Update `content_id` in form data
2. Select an image file (JPG, PNG, GIF, WebP)
3. Send request
4. Check response for `poster_id`

### Step 4: Test Query Operations
**Request:** `4. Get All Posters`
- Should now show your created posters

**Request:** `3. Get Poster by ID`
- Uses auto-populated `{{posterId}}` variable

## 📋 **Complete Request List**

### Creation Endpoints
1. **Generate AI Poster** - Full request with all fields
2. **Generate AI Poster (Minimal)** - Minimal required fields
3. **Upload Human Poster** - Full form data
4. **Upload Human Poster (Minimal)** - Minimal form data

### Query Endpoints
5. **Get Poster by ID** - Single poster retrieval
6. **Get All Posters** - Basic pagination
7. **Get All Posters (with filters)** - Advanced filtering
8. **Get Posters by Content ID** - Content-specific posters
9. **Get Posters by Channel** - Channel-specific posters
10. **Get Posters by Use Case** - Use case filtering
11. **Get AI Generated Posters** - AI-only posters
12. **Get Human Uploaded Posters** - Upload-only posters
13. **Search Posters by Prompt Text** - Text search
14. **Filter by Multiple Criteria** - Complex filtering

## 🔧 **Request Examples**

### AI Generation (Full)
```json
{
  "content_id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "avengers-endgame",
  "dimension": "1920:1080",
  "use_case": "title_marketing",
  "channel": "instagram",
  "ai_image_id": ["ai-123-456"],
  "screenshot_ids": ["img-789-012"],
  "title_logo_id": ["logo-345-678"],
  "tagline_id": ["tag-901-234"]
}
```

### File Upload Form Data
```
poster: [SELECT FILE]
content_id: 550e8400-e29b-41d4-a716-446655440000
slug: avengers-endgame-upload
use_case: title_marketing
channel: instagram
```

### Query Parameters
```
GET /posters?page=1&limit=5&poster_type=ai_generated&channel=instagram
```

## ✅ **Auto-Testing Features**

### Global Test Scripts
The collection includes automatic tests:
- ✅ Status code validation (200/201)
- ✅ Auto-extraction of `poster_id` from responses
- ✅ Global variable updates

### Response Validation
Each request automatically checks:
```javascript
pm.test('Status code is successful', function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});
```

## 🎯 **Quick Start Checklist**

- [ ] Import collection to Postman
- [ ] Update `contentId` variable with real Content ID
- [ ] Test `4. Get All Posters` (should return empty array)
- [ ] **Choose testing mode:** Mock mode or Real API
- [ ] Update asset IDs in generation requests
- [ ] Test `1b. Generate AI Poster (Minimal)`
- [ ] Test `2b. Upload Human Poster (Minimal)` with real image
- [ ] Test `4. Get All Posters` (should show created posters)
- [ ] Test `3. Get Poster by ID` (uses auto-populated ID)

## 🚨 **Common Issues & Solutions**

### Issue: "Content not found"
**Solution:** Update `contentId` variable with existing Content ID

### Issue: "Asset not found" 
**Solution:** Update asset ID arrays with real IDs from your database

### Issue: "File upload fails"
**Solution:** 
- Check file type (JPEG, PNG, GIF, WebP only)
- Check file size (10MB max)
- Ensure file is selected in form data

### Issue: "Runway API Authentication Error"
**Solution:**
- ✅ **Fixed:** API key updated to new format (`key_` prefix)
- For testing: Enable mock mode in service

### Issue: "Runway API fails"
**Solution:**
- **Option 1:** Use mock mode for testing
- **Option 2:** Start ngrok: `ngrok http 3001`
- Update `baseUrl` in service with ngrok URL
- Ensure reference images are accessible

## 📊 **Expected Response Format**

### Successful Creation Response
```json
{
  "poster_id": "uuid-here",
  "content_id": "content-uuid",
  "slug": "test-movie",
  "poster_type": "ai_generated",
  "poster_url": "/uploads/posters/uuid.png",
  "prompt_text": "Generated prompt text",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Query Response Format
```json
{
  "data": [/* poster objects */],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

## 🎨 **File Access**

Generated/uploaded posters are accessible at:
```
http://localhost:3001/uploads/posters/filename.png
```

Copy the `poster_url` from any response and prepend with base URL to view the image.

## 🔧 **Mock Mode vs Real API**

### Mock Mode (Recommended for Testing)
- ✅ No API key issues
- ✅ No ngrok required  
- ✅ Fast responses
- ✅ Uses placeholder images from picsum.photos
- ❌ No real AI generation

### Real API Mode
- ✅ Real AI poster generation
- ✅ Uses actual Runway API
- ❌ Requires ngrok setup
- ❌ API key authentication needed
- ❌ Slower responses 