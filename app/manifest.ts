import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Caskayd',
    short_name: 'Caskayd',
    description: 'Discover, hire, and manage top content creators.',
    start_url: '/launch', // <-- Updated to our new PWA entry point
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#10B981', 
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any', 
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}