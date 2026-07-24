const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

// Static export is only needed for Capacitor (Android) and GitHub Pages
const isStaticExport = isGithubActions || isCapacitorBuild;

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },

  // Only use static export for Capacitor/GitHub Pages builds
  // Vercel handles server-side rendering natively
  ...(isStaticExport && {
    output: 'export',
    trailingSlash: false,
  }),

  // Dynamic basePath: Use repository name on GitHub Pages, empty elsewhere
  basePath: isGithubActions ? '/Medhometest' : '',
}

export default nextConfig