import { defineConfig, loadEnv } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig(({ mode }) => {
  // On Vercel the server runs elsewhere, so the fallback to port 3001 on the page's host
  // would point at nothing. Fail the build instead of shipping a client that cannot connect.
  if (process.env.VERCEL && !loadEnv(mode, process.cwd()).VITE_SERVER_URL) {
    throw new Error('VITE_SERVER_URL must be set for Vercel builds');
  }
  return { plugins: [svelte()] };
});
