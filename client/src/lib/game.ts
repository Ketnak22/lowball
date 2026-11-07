import type { Ack, AckCallback, Bet, JoinedRoom, RoomView } from '@lowball/shared';
import { derived, writable } from 'svelte/store';
import { socket } from './socket';

export const room = writable<RoomView | null>(null);
export const playerId = writable<string | null>(null);
export const connected = writable(socket.connected);
/** Shown on the home screen, e.g. after the connection drops. */
export const notice = writable<string | null>(null);

export const me = derived(
  [room, playerId],
  ([$room, $playerId]) => $room?.players.find((p) => p.id === $playerId) ?? null,
);

socket.on('connect', () => connected.set(true));
socket.on('disconnect', () => {
  connected.set(false);
  // The server removes disconnected players, so there is no room to return to.
  room.update((current) => {
    if (current) notice.set('Connection to the server was lost. You have left the room.');
    return null;
  });
  playerId.set(null);
});
socket.on('room:state', (state) => room.set(state));

function call<T>(send: (ack: AckCallback<T>) => void): Promise<Ack<T>> {
  if (!socket.connected) {
    return Promise.resolve({ ok: false, error: 'Not connected to the server.' });
  }
  return new Promise((resolve) => send(resolve));
}

async function enterRoom(request: Promise<Ack<JoinedRoom>>): Promise<Ack<JoinedRoom>> {
  const response = await request;
  if (response.ok) {
    playerId.set(response.data.playerId);
    notice.set(null);
  }
  return response;
}

export const actions = {
  createRoom: (name: string) =>
    enterRoom(call<JoinedRoom>((ack) => socket.emit('room:create', { name }, ack))),
  joinRoom: (code: string, name: string) =>
    enterRoom(call<JoinedRoom>((ack) => socket.emit('room:join', { code, name }, ack))),
  setReady: (ready: boolean) => call((ack) => socket.emit('player:ready', { ready }, ack)),
  answer: (answer: string) => call((ack) => socket.emit('round:answer', { answer }, ack)),
  placeBets: (bets: Bet[]) => call((ack) => socket.emit('round:bets', { bets }, ack)),
  restart: () => call((ack) => socket.emit('game:restart', ack)),
  async leave() {
    await call((ack) => socket.emit('room:leave', ack));
    room.set(null);
    playerId.set(null);
  },
};
