
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'export', // Désactivé pour App Hosting (mode SSR requis pour Server Actions)
  trailingSlash: true,

  typescript: {
    ignoreBuildErrors: true, // Gardé pour la flexibilité de développement
  },

  eslint: {
    ignoreDuringBuilds: true, // Gardé pour la flexibilité de développement
  },

  images: {
    // unoptimized: true, // Supprimé pour permettre l'optimisation d'image Next.js
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      // Ajout du pattern pour les images Firebase Storage
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      // Ajout du pattern pour les images Picsum (utilisées pour les pubs)
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
