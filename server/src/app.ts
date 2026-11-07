import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';

// Both src/app.ts (dev) and dist/index.js (build) sit two levels below the repository root.
const defaultClientDir = fileURLToPath(new URL('../../client/dist', import.meta.url));

export function createApp(clientDir = defaultClientDir) {
  const app = express();
  app.disable('x-powered-by');

  // Used by hosting platforms for health checks and to wake a sleeping instance.
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // After `npm run build` the server also serves the client, so one service runs the whole game.
  if (existsSync(clientDir)) app.use(express.static(clientDir));

  return app;
}
