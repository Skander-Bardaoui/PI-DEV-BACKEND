# Google OAuth Configuration for Render

## Problem
Google OAuth callback is redirecting to `localhost:3001` instead of production URL.

## Solution

### Step 1: Configure Backend Environment Variables in Render

Go to your backend service on Render dashboard and add these environment variables:

```
GOOGLE_CALLBACK_URL=https://pi-dev-backend.onrender.com/auth/google/callback
FRONTEND_URL=https://novaentra.onrender.com
```

### Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://pi-dev-backend.onrender.com/auth/google/callback
   ```
5. Keep the localhost URL for development:
   ```
   http://localhost:3001/auth/google/callback
   ```
6. Click **Save**

### Step 3: Verify Backend CORS Configuration ✅

**Good news!** Your backend CORS is already correctly configured in `src/main.ts`:

```typescript
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,  // This will be https://pi-dev-front.onrender.com
].filter(Boolean);

app.enableCors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 3600,
});
```

**No changes needed!** Once you set `FRONTEND_URL` in Render, CORS will automatically work.

### Step 4: Redeploy Backend

After adding the environment variables in Render:
1. Go to your backend service dashboard
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait for deployment to complete

## Testing

1. Go to `https://pi-dev-front.onrender.com`
2. Click "Sign in with Google"
3. You should be redirected to Google login
4. After authentication, you should be redirected back to your app dashboard

## Environment Variables Summary

### Backend (Render Dashboard)
- `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret
- `GOOGLE_CALLBACK_URL` - `https://pi-dev-backend.onrender.com/auth/google/callback`
- `FRONTEND_URL` - `https://novaentra.onrender.com`
- `JWT_ACCESS_SECRET` - Your JWT secret
- `JWT_REFRESH_SECRET` - Your JWT refresh secret
- `DATABASE_URL` - Your database connection string

### Frontend (Already configured in render.yaml)
- `VITE_API_URL` - `https://pi-dev-backend.onrender.com`

## Troubleshooting

### Still redirecting to localhost?
- Clear browser cache and cookies
- Check that environment variables are set in Render
- Verify backend was redeployed after adding variables

### CORS errors?
- Check backend CORS configuration includes frontend URL
- Verify credentials: true is set

### Google OAuth error?
- Verify redirect URI in Google Console matches exactly
- Check that OAuth consent screen is configured
- Ensure OAuth client is not restricted
