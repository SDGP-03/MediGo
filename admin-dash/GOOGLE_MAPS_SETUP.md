# Google Maps API Setup Guide

This guide will help you set up Google Maps API for the MediGo application.

## Step 1: Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Maps JavaScript API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Maps JavaScript API"
   - Click "Enable"

## Step 2: Create an API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy your API key
4. (Recommended) Restrict your API key:
   - Click on the API key to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose "Maps JavaScript API"
   - Under "Application restrictions", you can restrict by HTTP referrer for web apps

## Step 3: Add API Key to Your Project

1. Copy `.env.example` to `.env` in the `admin-dash` directory:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your API key:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

3. Restart your development server if it's running

## Step 4: Install Dependencies

If you haven't already, install the required package:
```bash
npm install @react-google-maps/api
```

## Step 5: Verify Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Hospital Dashboard
3. Click on the "Live Ambulance Locations" section
4. You should see an interactive Google Map with ambulance markers

## Troubleshooting

### Map not loading
- Check that your API key is correctly set in `.env`
- Verify that "Maps JavaScript API" is enabled in Google Cloud Console
- Check the browser console for any error messages
- Make sure you've restarted the dev server after adding the API key

### "This page can't load Google Maps correctly" error
- Verify your API key is valid
- Check that billing is enabled on your Google Cloud project (Google Maps requires billing)
- Ensure the API key restrictions allow your domain/localhost

### Markers not showing
- Check that ambulance data includes `lat` and `lng` coordinates
- Verify the coordinates are valid (between -90 to 90 for latitude, -180 to 180 for longitude)

## Cost Information

Google Maps JavaScript API has a free tier:
- $200 free credit per month
- After free tier: $7 per 1,000 map loads

For development and testing, the free tier should be sufficient. Monitor your usage in Google Cloud Console.

## Security Best Practices

1. **Restrict your API key** to only the necessary APIs
2. **Set HTTP referrer restrictions** to limit which domains can use your key
3. **Never commit your `.env` file** to version control
4. **Use different API keys** for development and production

## Support

For more information, visit:
- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [React Google Maps API Documentation](https://react-google-maps-api-docs.netlify.app/)
