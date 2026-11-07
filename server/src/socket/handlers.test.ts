import type {
  Ack,
  ClientToServerEvents,
  JoinedRoom,
  RoomView,
  ServerToClientEvents,
} from '@lowball/shared';
import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import { io as connect, type Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Question } from '../game/types';
import { attachGameHandlers, type GameServer } from './handlers';

type Client = Socket<ServerToClientEvents, ClientToServerEvents>;

const questions: Question[] = [
  { question: { pl: 'Jak wysoko?', en: 'How tall?' }, answer: 100, unit: { pl: 'm', en: 'm' } },
];

let httpServer: HttpServer;
let io: GameServer;
let game: ReturnType<typeof attachGameHandlers>;
let url: string;
const clients: Client[] = [];

beforeEach(async () => {
  httpServer = createServer();
  io = new Server(httpServer);
  game = attachGameHandlers(io, {
    questions,
    settings: { totalRounds: 1, resultsDurationMs: 20, rankingDurationMs: 20 },
  });
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  url = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
});

afterEach(async () => {
  for (const client of clients.splice(0)) client.disconnect();
  game.close();
  await io.close();
});

async function client(): Promise<Client> {
  const socket: Client = connect(url, { transports: ['websocket'], forceNew: true });
  clients.push(socket);
  await new Promise<void>((resolve) => socket.on('connect', resolve));
  return socket;
}

/** Resolves with the next room:state that matches the predicate. */
function nextState(socket: Client, predicate: (room: RoomView) => boolean): Promise<RoomView> {
  return new Promise((resolve) => {
    const listener = (room: RoomView) => {
      if (!predicate(room)) return;
      socket.off('room:state', listener);
      resolve(room);
    };
    socket.on('room:state', listener);
  });
}

function emit<T>(send: (ack: (response: Ack<T>) => void) => void): Promise<Ack<T>> {
  return new Promise((resolve) => send(resolve));
}

async function createAndJoin() {
  const host = await client();
  const guest = await client();
  const created = await emit<JoinedRoom>((ack) => host.emit('room:create', { name: 'Ala' }, ack));
  if (!created.ok) throw new Error(created.error);
  const joined = await emit<JoinedRoom>((ack) =>
    guest.emit('room:join', { code: created.data.code, name: 'Ola' }, ack),
  );
  if (!joined.ok) throw new Error(joined.error);
  return { host, guest, code: created.data.code };
}

describe('socket handlers', () => {
  it('plays a full one-round game', async () => {
    const { host, guest } = await createAndJoin();

    const answering = nextState(host, (r) => r.phase === 'answering');
    await emit((ack) => host.emit('player:ready', { ready: true }, ack));
    await emit((ack) => guest.emit('player:ready', { ready: true }, ack));
    expect((await answering).round?.question).toEqual({ pl: 'Jak wysoko?', en: 'How tall?' });

    const voting = nextState(host, (r) => r.phase === 'voting');
    await emit((ack) => host.emit('round:answer', { answer: '90' }, ack));
    await emit((ack) => guest.emit('round:answer', { answer: '120' }, ack));
    const votingState = await voting;
    expect(votingState.round?.answers.map((a) => a.value)).toEqual([90, 120]);

    const results = nextState(host, (r) => r.phase === 'results');
    const ninety = votingState.round!.answers[0]!.playerId;
    await emit((ack) => host.emit('round:bets', { bets: [{ playerId: ninety, amount: 20 }] }, ack));
    await emit((ack) => guest.emit('round:bets', { bets: [] }, ack));
    const resultState = await results;
    expect(resultState.round?.result?.correctAnswer).toBe(100);
    expect(resultState.players.find((p) => p.name === 'Ala')?.tokens).toBe(230);

    const finished = await nextState(guest, (r) => r.phase === 'finished');
    expect(finished.phaseEndsAt).toBeNull();

    const lobby = nextState(guest, (r) => r.phase === 'lobby');
    expect(await emit((ack) => guest.emit('game:restart', ack))).toMatchObject({ ok: false });
    expect(await emit((ack) => host.emit('game:restart', ack))).toEqual({ ok: true });
    expect((await lobby).players.every((p) => p.tokens === 200)).toBe(true);
  });

  it('rejects invalid payloads with an error instead of crashing', async () => {
    const socket = await client();
    const send = socket.emit.bind(socket) as unknown as (...args: unknown[]) => void;

    const badName = await emit((ack) => send('room:create', { name: '<script>' }, ack));
    expect(badName).toMatchObject({ ok: false });

    const noPayload = await emit((ack) => send('room:join', null, ack));
    expect(noPayload).toMatchObject({ ok: false });

    const badCode = await emit((ack) => send('room:join', { code: '99999', name: 'Ala' }, ack));
    expect(badCode).toEqual({ ok: false, error: 'roomNotFound' });

    const outsideRoom = await emit((ack) => send('round:answer', { answer: '5' }, ack));
    expect(outsideRoom).toEqual({ ok: false, error: 'notInRoom' });

    // An event without an ack callback must not throw on the server.
    send('player:ready', { ready: true });
    expect(socket.connected).toBe(true);
  });

  it('rejects a duplicate name in the same room', async () => {
    const { code } = await createAndJoin();
    const third = await client();
    const response = await emit((ack) => third.emit('room:join', { code, name: 'ala' }, ack));
    expect(response).toMatchObject({ ok: false });
  });

  it('passes the host role on and removes empty rooms when players disconnect', async () => {
    const { host, guest, code } = await createAndJoin();

    const afterLeave = nextState(guest, (r) => r.players.length === 1);
    host.disconnect();
    const state = await afterLeave;
    expect(state.hostId).toBe(guest.id);

    guest.disconnect();
    await expect.poll(() => game.rooms.has(code)).toBe(false);
  });

  it('ends the game when a player disconnects mid-round', async () => {
    const { host, guest } = await createAndJoin();
    const answering = nextState(guest, (r) => r.phase === 'answering');
    await emit((ack) => host.emit('player:ready', { ready: true }, ack));
    await emit((ack) => guest.emit('player:ready', { ready: true }, ack));
    await answering;

    const finished = nextState(guest, (r) => r.phase === 'finished');
    host.disconnect();
    expect((await finished).players).toHaveLength(1);
  });
});
