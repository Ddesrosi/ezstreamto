import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';

// Ensure .env file exists with required variables
const requiredEnvVars = {
  VITE_SUPABASE_URL: 'https://qmrtpqjngwvmukbfioga.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcnRwcWpuZ3d2bXVrYmZpb2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MTM4MzMsImV4cCI6MjA1Mzk4OTgzM30.jsp51PwTqRCNXfh3cPws6T0SoiyS2_6Sf2M4vih2SmY',
  VITE_TMDB_API_KEY: '413cd33f7c45b65014879caead72caba',
  VITE_BMC_SECRET: 'your_bmc_secret_here'
};

// Check if .env exists and create/update it if needed
try {
  let envContent = '';
  if (fs.existsSync('.env')) {
    envContent = fs.readFileSync('.env', 'utf-8');
  }

  const currentEnv = dotenv.parse(envContent);
  let needsUpdate = false;

  // Check for missing or empty variables
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!currentEnv[key] || currentEnv[key].trim() === '') {
      currentEnv[key] = value;
      needsUpdate = true;
    }
  }

  // Update .env if needed
  if (needsUpdate) {
    const newEnvContent = Object.entries(currentEnv)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    writeFileSync('.env', newEnvContent);
    console.log('✅ Environment variables restored successfully');
  }
} catch (error) {
  console.error('Error managing .env file:', error);
}

const envConfig = requiredEnvVars;

export default defineConfig({
  plugins: [react()],
  define: {
    // Ensure environment variables are always available
    ...Object.fromEntries(
      Object.entries(requiredEnvVars).map(([key, value]) => [
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
});