# Google Drive Blocks Fetcher

Scripts to fetch garment block data from Google Drive and update the blocks.ts file.

## Files

- `fetch-drive-blocks.js` - Uses Google Drive API for public folders (no auth needed!)
- `fetch-drive-blocks-simple.js` - Simplified script with manual data

## Quick Start (No Setup Required!)

```bash
npm run fetch-blocks
```

This will automatically fall back to manual data if no API key is provided.

## Setup for Live Google Drive API (fetch-drive-blocks.js)

For real-time fetching from the public Google Drive folder:

1. **Get Google API Key** (Free!)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API" and enable it
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

2. **Set API Key**
   ```bash
   export GOOGLE_API_KEY="your_api_key_here"
   npm run fetch-blocks
   ```

   Or create a `.env` file:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ```

3. **Run the Script**
   ```bash
   npm run fetch-blocks
   ```

## Alternative: Simple Script (fetch-drive-blocks-simple.js)

If you don't want to set up Google Drive API, you can use the simplified script:

```bash
node scripts/fetch-drive-blocks-simple.js
```

This script uses manually defined folder structure based on the visible contents.

## Expected Folder Structure

The script expects the following structure in Google Drive:

```
Root Folder/
├── Full Body/
│   ├── file1.gltf
│   ├── file1.png
│   └── ...
├── Pants/
│   ├── file2.gltf
│   ├── file2.png
│   └── ...
├── Bodice/
│   ├── Bodice 228.gltf
│   ├── Bodice 228.png
│   └── ...
└── etc...
```

## Output

The script will update `public/consts/blocks.ts` with:
- All avatars set to 'Male'
- Category based on folder name
- Block name based on file name
- Only includes files that have both .gltf and .png versions

## Environment Variables

- `GOOGLE_CREDENTIALS_PATH` - Path to Google service account credentials (default: ./credentials.json)
