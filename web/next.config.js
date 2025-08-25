/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Re-enabled for GitHub Pages
  trailingSlash: true,  // Re-enabled for GitHub Pages
  distDir: 'out',  // Re-enabled for GitHub Pages
  images: {
    unoptimized: true
  },
  basePath: '',
  assetPrefix: ''
}

module.exports = nextConfig
