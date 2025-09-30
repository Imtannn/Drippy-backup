# Space Deployment Guide

This guide covers the deployment process for spaces (brands), avatars, and garment blocks in the Drippy 3D application.

## Quick Start

```bash
# Set up environment variables
cp env.example .env
# Edit .env with your credentials

# Run the combined assets script
npm run combined-assets
```

## Environment Setup

### 1. Create Environment File

Copy the example environment file and configure your credentials:

```bash
cp scripts/env.example scripts/.env
```

### 2. Configure Environment Variables

Edit `scripts/.env` with your credentials:

```env
# Google Drive API Configuration
GOOGLE_API_KEY=your_google_drive_api_key_here

# AWS S3 Configuration
S3_BUCKET=drippy3d-prod-eu
S3_REGION=eu-west-3
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

### 3. Get Google Drive API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to "APIs & Services" > "Library"
4. Search for "Google Drive API" and enable it
5. Go to "APIs & Services" > "Credentials"
6. Click "Create Credentials" > "API Key"
7. Copy the API key to your `.env` file

### 4. Configure AWS Credentials

1. Get your AWS Access Key ID and Secret Access Key from AWS IAM
2. Ensure the credentials have read/write access to the S3 bucket
3. Add them to your `.env` file

## Automated Deployment

### Running the Combined Assets Script

The main deployment script handles:
- Fetching garment blocks from Google Drive
- Processing and optimizing assets
- Uploading to S3
- Updating configuration files

```bash
# Run the complete deployment process
npm run fetch-combined-assets
```

### Updating Brand Configurations

To add a new brand or update existing ones, edit the `BRAND_CONFIGS` array in `scripts/imports/fetch-combined-assets.ts`:

```typescript
const BRAND_CONFIGS = [
  {
    brand: 'your-brand-name',
    rootFolderId: 'google-drive-folder-id',
  },
  // ... other brands
]
```

The script will automatically:
1. Fetch all garment files from the Google Drive folder
2. Process and optimize them
3. Upload to S3 under `drippy-app/drippy-app-3D/brands/your-brand-name/`
4. Update the blocks configuration

## Manual Deployment

For spaces (brand scenes) and avatars that need manual deployment to S3.

### S3 Bucket Structure

All deployments should follow this structure in the S3 bucket:
**Base URL:** https://eu-west-3.console.aws.amazon.com/s3/buckets/drippy3d-prod-eu?prefix=drippy-app/drippy-app-3D/

```
drippy-app/drippy-app-3D/
├── brands/
│   ├── brand-name/
│   │   ├── scene-model.glb          # Main scene 3D model
│   │   ├── scene-thumbnail.webp     # Scene preview thumbnail
│   │   ├── logo.webp      # Brand logo (optional)
│   │   └── extras/
│   │       └── shoes.glb            # Additional models (shoes, accessories)
│   └── ...
└── models/
    ├── female/
    │   ├── avatar-name/
    │   │   ├── model.glb            # Avatar 3D model
    │   │   └── thumbnail.webp       # Avatar thumbnail
    │   └── ...
    └── male/
        ├── avatar-name/
        │   ├── model.glb
        │   └── thumbnail.webp
        └── ...
```

### Manual Space Deployment

#### 1. Prepare Space Assets

Ensure you have:
- `scene-model.glb` - The main 3D scene model
- `scene-thumbnail.webp` - Preview thumbnail (optimized)
- `logo_optimized.webp` - Brand logo (optional)
- Any additional models (shoes, accessories) in `extras/` folder

#### 2. Upload to S3

1. Navigate to the S3 bucket: [drippy3d-prod-eu](https://eu-west-3.console.aws.amazon.com/s3/buckets/drippy3d-prod-eu?prefix=drippy-app/drippy-app-3D/&region=eu-west-3&bucketType=general)
2. Create folder structure: `drippy-app/drippy-app-3D/brands/your-brand-name/`
3. Upload your assets to the appropriate folders
4. Set proper permissions (public read access)

#### 3. Update spaces.ts Configuration

Add your space configuration to `public/consts/spaces.ts`:

```typescript
{
  name: 'Your Brand Display Name',
  slug: 'your-brand-slug',
  description: 'Brand Description',
  logo: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/your-brand-name/logo_optimized.webp',
  env: '/images/envs/brown_photostudio_02.jpg',
  sceneThumbnail: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/your-brand-name/scene-thumbnail.webp',
  scene: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/your-brand-name/scene-model.glb',
  includedModelFiles: [
    'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/brands/your-brand-name/extras/shoes.glb',
  ],
  gender: 'female', // or 'male'
  garmentsCount: blocks.yourBrandName?.length ?? 0,
  collection: 'yourBrandName',
  isWholesale: false,
}
```

### Manual Avatar Deployment

#### 1. Prepare Avatar Assets

Ensure you have:
- `model.glb` - The avatar 3D model
- `thumbnail.webp` - Avatar preview thumbnail (optimized)

#### 2. Upload to S3

1. Navigate to the S3 bucket models section
2. Create folder structure: `drippy-app/drippy-app-3D/models/[gender]/avatar-name/`
3. Upload your avatar assets
4. Set proper permissions (public read access)

#### 3. Update avatars.ts Configuration

Add your avatar configuration to `public/consts/avatars.ts`:

```typescript
{
  thumbnail: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/[gender]/avatar-name/thumbnail.webp',
  src: 'https://drippy3d-prod-eu.s3.eu-west-3.amazonaws.com/drippy-app/drippy-app-3D/models/[gender]/avatar-name/model.glb',
  gender: 'female', // or 'male'
  value: 'avatar-name',
  default: false, // Set to true if this should be the default avatar
}
```

## File Optimization Guidelines

### Image Optimization
- Use WebP format for all images
- Compress thumbnails to reasonable file sizes (< 100KB)
- Optimize scene thumbnails for web display

### 3D Model Optimization
- Use GLB format for all 3D models
- Optimize polygon count for web performance
- Ensure proper UV mapping for textures
- Test models in the application before deployment

## Troubleshooting

### Common Issues

1. **Google Drive API Errors**
   - Verify API key is correct and has Drive API enabled
   - Check folder permissions (should be publicly accessible)

2. **S3 Upload Failures**
   - Verify AWS credentials have proper permissions
   - Check bucket name and region configuration
   - Ensure files don't exceed size limits

3. **Asset Loading Issues**
   - Verify S3 URLs are publicly accessible
   - Check file formats (GLB for models, WebP for images)
   - Test URLs directly in browser

### Support

For deployment issues:
1. Check the console logs for specific error messages
2. Verify all environment variables are set correctly
3. Test individual steps (Google Drive access, S3 upload, etc.)
4. Ensure proper file permissions and formats

## Security Notes

- Never commit `.env` files to version control
- Use IAM roles with minimal required permissions
- Regularly rotate API keys and access credentials
- Monitor S3 bucket access logs for unauthorized usage
