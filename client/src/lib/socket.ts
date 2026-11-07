import type { ClientToServerEvents, ServerToClientEvents } from '@lowball/shared';
import { io, type Socket } from 'socket.io-client';

// In development the server runs on port 3001 of the same host, which also works when testing
// from a phone on the local network. A production build is served by the server itself, so it
// connects to the page's own origin. VITE_SERVER_URL overrides both.
const serverUrl =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.DEV
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : window.location.origin);

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl);
