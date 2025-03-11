# Uniform Pexels Integration

This is an integration to extend the Uniform asset library with Pexels images and videos.

## Core Features

- Asset library view with search, filtering, and pagination
- Browse featured photos from Pexels
- Search for both photos and videos from Pexels
- Apply media-type specific filters (orientation, color, size, locale)
- Use Pexels media in Uniform assets
- Preserve Pexels metadata in the asset record
- Download images directly from the integration
- View image attribution information
- Support for various image sizes and formats

### ⚠️ Note: Asset hotlinking

This integration is currently hotlinking photos and videos from Pexels. This is not the recommended way to use Pexels media and is subject to change.

## Basic Usage

1. Sign up for a Pexels API key on their [developer portal](https://www.pexels.com/api/)
2. Install the integration via a custom integration
3. Enable the "Pexels" integration in your Uniform project
4. Add the Pexels API key to the integration settings

## Installation

The integration can be installed as a custom integration in Uniform:

1. In your Uniform project, go to Settings > Integrations
2. Click "Add Integration" > "Custom Integration"
3. Follow the prompts to configure the integration
4. Enter your Pexels API key and other configuration options

## Configuration Options

- **API Key**: Your Pexels API key (required)
- **Assets Per Page**: Number of assets to display per page (default: 15)
- **Add Author Credits**: Whether to include photo credits in asset descriptions (default: true)

## Media Support

This integration supports both photos and videos from the Pexels API. For detailed information about available formats, sizes, and options, please refer to the official Pexels API documentation:

- [Pexels API Documentation](https://www.pexels.com/api/documentation/)
- [Photos Search Documentation](https://www.pexels.com/api/documentation/#photos-search)
- [Videos Search Documentation](https://www.pexels.com/api/documentation/#videos-search)

## Development

1. Clone the repository
2. Create a `.env` file based on `.env.example`
3. Run `npm install` to install the dependencies
4. Run `npm run dev` to start the development server

## Architecture

The integration is built with:

- Next.js for the frontend
- Uniform Mesh SDK for parameter handling
- Pexels API for image and video data
- TypeScript for type safety
- Tailwind CSS for styling

## Attribution

When using Pexels media in your projects, proper attribution is required according to [Pexels' terms of service](https://www.pexels.com/license/). This integration automatically includes attribution information with each asset.

## License

See the LICENSE file for details.

