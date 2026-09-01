const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

// ---------------------------------------------------------------------------
// Immutable, deployment-ID-namespaced static hosting.
//
// deploymentId = the release version. When NEXT_PUBLIC_ASSET_CDN is set (web
// build only) every /_next/* asset URL is prefixed with the CDN host under
//   apps/<app>/<version>/
// so all builds' immutable assets coexist in one shared store (S3 + CloudFront)
// and node build skew can no longer cause ChunkLoadError. Unset → existing
// basePath behavior, i.e. a no-op until the CDN env is provided.
// ---------------------------------------------------------------------------
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'lms';
const deploymentId =
  process.env.DEPLOYMENT_ID || process.env.APP_VERSION || process.env.npm_package_version || 'dev';
// Accept the CDN host with OR without a scheme ("assets.ibl.ai" or
// "https://assets.ibl.ai") — Next requires assetPrefix to be an absolute URL,
// so default a bare host to https://.
let assetCdnBase = process.env.NEXT_PUBLIC_ASSET_CDN?.trim().replace(/\/+$/, '');
if (assetCdnBase && !/^https?:\/\//i.test(assetCdnBase)) {
  assetCdnBase = `https://${assetCdnBase}`;
}
const assetPrefix = assetCdnBase
  ? `${assetCdnBase}/apps/${appName}/${deploymentId}`
  : basePath
    ? `${basePath}/`
    : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  assetPrefix,
  // Deterministic build ID = release version (stable across rebuilds; lets
  // RSC/Server-Action version checks line up across a rolling fleet).
  generateBuildId: async () => deploymentId,
  // Assets are cross-origin once served from the CDN — emit crossorigin on the
  // injected <script>/<link> tags.
  crossOrigin: 'anonymous',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 's3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'base.manager.iblai.tech',
      },
      {
        protocol: 'https',
        hostname: 'base.manager.iblai.org',
      },
      {
        protocol: 'https',
        hostname: 'base.manager.iblai.app',
      },
      {
        protocol: 'https',
        hostname: 'api.iblai.app',
      },
      {
        protocol: 'https',
        hostname: 'api.iblai.org',
      },
    ],
  },
  transpilePackages: ['@tauri-apps/api'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
};

export default nextConfig;
