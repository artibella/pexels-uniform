# Uniform Pexels Integration

This is an integration to extend the Uniform asset library with Pexels images.

## Core Features

- Asset library view with search, filtering, and pagination
- Browse curated/featured images from Pexels
- Use Pexels images in Uniform assets
- Preserve Pexels metadata in the asset record
- Download images directly from the integration
- View image attribution information

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

## Configuration Options

- **API Key**: Your Pexels API key (required)
- **Assets Per Page**: Number of assets to display per page (default: 24)
- **Add Photo Credits**: Whether to include photo credits in asset descriptions (default: true)

## Development

1. Clone the repository
2. Run `npm install` to install the dependencies
3. Run `npm run dev` to start the development server

## Architecture

The integration is built with:

- Next.js for the frontend
- Uniform Mesh SDK for parameter handling
- Pexels API for image data
- TypeScript for type safety

## License

See the LICENSE file for details.

