import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
 
// Environment variables with fallbacks
const envVars = {
  VITE_SUPABASE_URL: 'https://acmpivmrokzblypxdxbu.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbXBpdm1yb2t6Ymx5cHhkeGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NDE1OTUsImV4cCI6MjA1NDUxNzU5NX0.nPs1MeO2vH7bh85tvLrH5-jFBCPk9Z1kQMGuZGKmY3s',
  VITE_TMDB_API_KEY: '413cd33f7c45b65014879caead72caba',
  VITE_TMDB_ACCESS_TOKEN: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0MTNjZDMzZjdjNDViNjUwMTQ4NzljYWVhZDcyY2FiYSIsIm5iZiI6MTczODAwNTE3Ni43MjMsInN1YiI6IjY3OTdkYWI4YTZlNDEyODNmMTJiNDU2NSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.dM4keiy2kA6XcUufnGGSnCDCUJGwFMg91pq4I5Bziq8',
  VITE_BMC_SECRET: 'your_bmc_secret_here'
};

// Create .env file if it doesn't exist
if (!fs.existsSync('.env')) {
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');
  fs.writeFileSync('.env', envContent);
}

// Load environment variables with fallbacks
const envConfig = {
  ...envVars,
  ...dotenv.parse(fs.readFileSync('.env'))
};

export default defineConfig({
  plugins: [react()],
  define: {
    // Ensure environment variables are always available
    ...Object.fromEntries(
      Object.entries(envConfig).map(([key, value]) => [
        `process.env.${key}`,
        JSON.stringify(value)
      ])
    )
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});