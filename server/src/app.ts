import express from 'express';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  // Used by hosting platforms for health checks and to wake a sleeping instance.
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
