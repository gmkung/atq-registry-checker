# ATQ Registry Viewer

A Next.js application for viewing and analyzing the ATQ (Address Tag Query) registry data from The Graph protocol.

## Features

- View ATQ registry entries in a paginated table
- Download registry data as JSON
- Generate compliance check prompts for repository analysis
- Responsive design with modern UI

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building for Production

To build the static site for deployment:

```bash
npm run build
```

The static files will be generated in the `out` directory.

## Deployment to GitHub Pages

This project is configured for automatic deployment to GitHub Pages:

1. **Automatic Deployment**: The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically builds and deploys the site when you push to the `main` branch.

2. **Manual Deployment**: You can also deploy manually:
   ```bash
   npm run deploy
   ```
   Then push the `out` directory to the `gh-pages` branch.

3. **GitHub Pages Settings**: Make sure GitHub Pages is enabled in your repository settings and set to deploy from the `gh-pages` branch.

## Configuration

The app fetches data directly from The Graph's public GraphQL endpoint. No API keys are required for the public endpoint, but you can configure a custom endpoint by modifying the `apiEndpoint` variable in `src/app/page.tsx`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports) - learn about static site generation.
