try {
  process.loadEnvFile();
} catch {
  // A .env file is optional; hosting platforms set variables directly.
}

export function parseOrigins(value: string | undefined): string[] {
  return (value ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function parsePort(value: string | undefined): number {
  const port = Number(value ?? 3001);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid PORT: ${value}`);
  }
  return port;
}

// Matches http(s) origins on private network addresses (localhost, 10.x, 172.16-31.x, 192.168.x).
const LAN_ORIGIN =
  /^https?:\/\/(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/;

export function isLanOrigin(origin: string): boolean {
  return LAN_ORIGIN.test(origin);
}

export const config = {
  port: parsePort(process.env.PORT),
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  // `--host` (used by `npm run dev:host`) also accepts clients from the local network.
  allowLan: process.argv.includes('--host'),
};
