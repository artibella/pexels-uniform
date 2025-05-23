# Uniform Pexels Integration

This is an example integration to extend the Uniform asset library with Pexels images and videos.

⚠️ **Note:** This is an unofficial community integration, not supported by Uniform or Pexels. It serves as an example for extending Uniform's asset library with third-party providers like Pexels. The codebase was primarily AI-generated using [Cursor](https://www.cursor.com/), with manual review and editing.

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

1. Sign up for a Pexels account and get an API key on their [developer portal](https://www.pexels.com/api/)
2. [Add](#add-a-custom-integration-to-your-uniform-team) a custom integration to your Uniform team
3. [Install](#install-the-integration-to-your-uniform-project) the integration to your Uniform project

## Installation

### Add a custom integration to your Uniform team

First create a custom integration in your Uniform team:

Via the Uniform dashboard:
1. In your Uniform team, go to Settings > Custom Integrations
2. Click "Add Integration"
3. Copy the contents of `mesh-manifest-local.json` and paste it into the Mesh app manifest.
4. Click "Save"

Alternatively, you can use the Uniform CLI to register the integration (Team Admin API key required):

```bash
npm run register-to-team
```

### Install the integration to your Uniform project

The integration then can be installed as a custom integration in the projects of the Uniform team:

1. In your Uniform project, go to Settings > Integrations
2. Find the "Pexels" integration in the list and click on it
3. Follow the prompts to install the integration
4. Enter your Pexels API key and other [configuration options](#configuration-options)

Alternatively, you can use the Uniform CLI to install the integration (Team Admin API key required):

```bash
npm run install-to-project
```


## Configuration Options

- **API Key**: Your [Pexels API key](https://www.pexels.com/api/) (required)
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

## Deployment

The integration can be deployed to any provider that supports static Next.js applications such as Vercel or Netlify.

If you create your own deployment make sure to update the `mesh-manifest-production.json` file with the correct base URL. And copy the contents of the manifest into your custom integration.

## Architecture

The integration is built with:

- Cursor for AI assisted development
- Next.js for the frontend
- Uniform Mesh SDK for parameter handling
- Pexels API for image and video data
- TypeScript for type safety
- Tailwind CSS for styling

## Attribution

When using Pexels media in your projects, proper attribution is required according to [Pexels' terms of service](https://www.pexels.com/license/). This integration automatically includes attribution information with each asset.

## License

See the LICENSE file for details.

