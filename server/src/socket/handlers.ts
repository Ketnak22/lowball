import {
  ROOM_CODE_LENGTH,
  parseAnswer,
  parseBets,
  validateName,
  validateRoomCode,
  type Ack,
  type ClientToServerEvents,
  type JoinedRoom,
  type Result,
  type ServerToClientEvents,
} from '@lowball/shared';
import type { Server, Socket } from 'socket.io';
import {
  DEFAULT_SETTINGS,
  addPlayer,
  advancePhase,
  createRoom,
  removePlayer,
  restartGame,
  setReady,
  submitAnswer,
  submitBets,
} from '../game/room';
import { shuffle } from '../game/shuffle';
import type { Question, Room, RoomSettings } from '../game/types';
import { toRoomView } from '../game/view';

export type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export interface GameOptions {
  questions: Question[];
  settings?: RoomSettings;
  now?: () => number;
  random?: () => number;
}

/** Calls the ack only if the client actually sent one, since payloads are untrusted. */
function reply<T>(ack: unknown, response: Ack<T>): void {
  if (typeof ack === 'function') ack(response);
}

const failure = (error: string): Ack<never> => ({ ok: false, error });

function field(payload: unknown, key: string): unknown {
  return typeof payload === 'object' && payload !== null
    ? (payload as Record<string, unknown>)[key]
    : undefined;
}

/**
 * Wires socket events to the pure game functions. All room state lives in the
 * `rooms` map below, so it is lost when the process restarts.
 */
export function attachGameHandlers(io: GameServer, options: GameOptions) {
  const rooms = new Map<string, Room>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  const settings = options.settings ?? DEFAULT_SETTINGS;
  const freshQuestions = () => shuffle(options.questions, random);

  function generateCode(): string | null {
    const min = 10 ** (ROOM_CODE_LENGTH - 1);
    for (let attempt = 0; attempt < 100; attempt++) {
      const code = String(min + Math.floor(random() * 9 * min));
      if (!rooms.has(code)) return code;
    }
    return null;
  }

  function clearTimer(code: string) {
    const timer = timers.get(code);
    if (timer) clearTimeout(timer);
    timers.delete(code);
  }

  function scheduleTimer(room: Room) {
    clearTimer(room.code);
    if (room.phaseEndsAt === null) return;
    const delay = Math.max(0, room.phaseEndsAt - now());
    const timer = setTimeout(() => {
      timers.delete(room.code);
      const current = rooms.get(room.code);
      if (current) commit(current, advancePhase(current, now()));
    }, delay);
    timers.set(room.code, timer);
  }

  /** Stores the new room state, keeps the phase timer in sync and broadcasts the result. */
  function commit(previous: Room | undefined, next: Room | null, code = previous?.code) {
    if (!code) return;
    if (!next) {
      rooms.delete(code);
      clearTimer(code);
      console.info(`Room ${code} is empty and was removed.`);
      return;
    }
    rooms.set(code, next);
    if (previous?.phaseEndsAt !== next.phaseEndsAt) scheduleTimer(next);
    io.to(code).emit('room:state', toRoomView(next));
  }

  io.on('connection', (socket: GameSocket) => {
    let roomCode: string | null = null;

    const currentRoom = (): Room | undefined => (roomCode ? rooms.get(roomCode) : undefined);

    /** Runs a game action for the player's room and broadcasts the new state on success. */
    function act(ack: unknown, action: (room: Room) => Result<Room>) {
      const room = currentRoom();
      if (!room) return reply(ack, failure('You are not in a room.'));
      const result = action(room);
      if (!result.ok) return reply(ack, failure(result.error));
      reply(ack, { ok: true, data: undefined });
      commit(room, result.value);
    }

    function enter(room: Room, previous: Room | undefined, ack: unknown) {
      roomCode = room.code;
      void socket.join(room.code);
      reply<JoinedRoom>(ack, { ok: true, data: { code: room.code, playerId: socket.id } });
      commit(previous, room, room.code);
    }

    function leave() {
      const room = currentRoom();
      if (room) commit(room, removePlayer(room, socket.id, now()));
      if (roomCode) void socket.leave(roomCode);
      roomCode = null;
    }

    socket.on('room:create', (payload, ack) => {
      if (roomCode) return reply(ack, failure('Leave your current room first.'));
      const name = validateName(field(payload, 'name'));
      if (!name.ok) return reply(ack, failure(name.error));
      const code = generateCode();
      if (!code) return reply(ack, failure('No free room codes right now, try again later.'));

      const room = createRoom(
        code,
        { id: socket.id, name: name.value },
        freshQuestions(),
        settings,
      );
      console.info(`Room ${code} created.`);
      enter(room, undefined, ack);
    });

    socket.on('room:join', (payload, ack) => {
      if (roomCode) return reply(ack, failure('Leave your current room first.'));
      const code = validateRoomCode(field(payload, 'code'));
      if (!code.ok) return reply(ack, failure(code.error));
      const name = validateName(field(payload, 'name'));
      if (!name.ok) return reply(ack, failure(name.error));
      const room = rooms.get(code.value);
      if (!room) return reply(ack, failure('Room not found.'));

      const result = addPlayer(room, { id: socket.id, name: name.value });
      if (!result.ok) return reply(ack, failure(result.error));
      enter(result.value, room, ack);
    });

    socket.on('room:leave', (ack) => {
      leave();
      reply(ack, { ok: true, data: undefined });
    });

    socket.on('player:ready', (payload, ack) => {
      const ready = field(payload, 'ready');
      if (typeof ready !== 'boolean') return reply(ack, failure('Invalid ready state.'));
      act(ack, (room) => setReady(room, socket.id, ready));
    });

    socket.on('round:answer', (payload, ack) => {
      const answer = parseAnswer(field(payload, 'answer'));
      if (!answer.ok) return reply(ack, failure(answer.error));
      act(ack, (room) => submitAnswer(room, socket.id, answer.value));
    });

    socket.on('round:bets', (payload, ack) => {
      const bets = parseBets(field(payload, 'bets'));
      if (!bets.ok) return reply(ack, failure(bets.error));
      act(ack, (room) => submitBets(room, socket.id, bets.value, now()));
    });

    socket.on('game:restart', (ack) => {
      act(ack, (room) => restartGame(room, socket.id, freshQuestions()));
    });

    socket.on('disconnect', leave);
  });

  return {
    rooms,
    close() {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    },
  };
}
