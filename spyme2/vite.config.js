import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,        // listen on all interfaces (0.0.0.0)
    port: 1920,        // numeric port
    strictPort: true,  // fail if port is taken
    // Allow access from specific domain or all origins
    origin: 'https://rtc.nuketerm.mlt',
    cors: {
      origin: [/\.nuketerm\.mlt$/], // allow subdomains like foo.nuketerm.mlt
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
  },
});
