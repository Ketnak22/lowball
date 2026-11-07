import type { ClientToServerEvents, ServerToClientEvents } from '@lowball/shared';
import { io, type Socket } from 'socket.io-client';

// Without VITE_SERVER_URL the client expects the server on port 3001 of the same host,
// which also works when testing from a phone on the local network.
const serverUrl =
  import.meta.env.VITE_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:3001`;

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl);
