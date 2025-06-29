# 🚀 ngrok Setup for Runway API Integration

## Quick Setup Steps

### 1. Sign up for ngrok account
- Go to: https://dashboard.ngrok.com/signup
- Create a free account

### 2. Get your authtoken
- Visit: https://dashboard.ngrok.com/get-started/your-authtoken
- Copy your authtoken

### 3. Configure ngrok
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

### 4. Start ngrok tunnel
```bash
# Start your NestJS server first
npm run start:dev

# In another terminal, start ngrok
ngrok http 3001
```

### 5. Update the service
Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok-free.app`) and update:

**File:** `src/ai-assets/services/ai-image.service.ts`
```typescript
// TODO: Update this URL when ngrok is set up or when switching to S3
private readonly baseUrl = 'https://your-actual-ngrok-url.ngrok-free.app';
```

### 6. Test the API
The AI Images API will now work with Runway API since it has proper HTTPS URLs!

## Alternative: Use S3 for Production
When ready for production, upload images to S3 and update the `baseUrl` to your S3 bucket URL.

## Current Status
✅ Service is configured to use hardcoded ngrok URL  
⏳ Replace `your-ngrok-url` with actual ngrok URL  
⏳ Later: Switch to S3 for production storage 