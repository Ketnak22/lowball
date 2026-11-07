import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  RANKING_DURATION_MS,
  RESULTS_DURATION_MS,
  ROUNDS_PER_GAME,
  STARTING_TOKENS,
  type Bet,
  type ErrorCode,
  type Result,
} from '@lowball/shared';
import { settleBets } from './scoring';
import type { Player, Question, Room, RoomSettings } from './types';

export const DEFAULT_SETTINGS: RoomSettings = {
  totalRounds: ROUNDS_PER_GAME,
  resultsDurationMs: RESULTS_DURATION_MS,
  rankingDurationMs: RANKING_DURATION_MS,
};

const ok = (value: Room): Result<Room> => ({ ok: true, value });
const fail = (error: ErrorCode): Result<Room> => ({ ok: false, error });

const newPlayer = (id: string, name: string): Player => ({
  id,
  name,
  tokens: STARTING_TOKENS,
  ready: false,
});

const sameName = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase();

export function totalRounds(room: Room): number {
  return Math.min(room.settings.totalRounds, room.questions.length);
}

export function createRoom(
  code: string,
  host: { id: string; name: string },
  questions: Question[],
  settings: RoomSettings = DEFAULT_SETTINGS,
): Room {
  return {
    code,
    hostId: host.id,
    phase: 'lobby',
    players: [newPlayer(host.id, host.name)],
    questions,
    roundIndex: 0,
    round: null,
    phaseEndsAt: null,
    settings,
  };
}

export function addPlayer(room: Room, player: { id: string; name: string }): Result<Room> {
  if (room.phase !== 'lobby') return fail('gameStarted');
  if (room.players.some((p) => p.id === player.id)) return fail('alreadyInRoom');
  if (room.players.length >= MAX_PLAYERS) return fail('roomFull');
  if (room.players.some((p) => sameName(p.name, player.name))) {
    return fail('nameTaken');
  }
  return ok({ ...room, players: [...room.players, newPlayer(player.id, player.name)] });
}

export function setReady(room: Room, playerId: string, ready: boolean): Result<Room> {
  if (room.phase !== 'lobby') return fail('gameStarted');
  if (!room.players.some((p) => p.id === playerId)) return fail('notInRoom');
  const players = room.players.map((p) => (p.id === playerId ? { ...p, ready } : p));
  return ok(startIfEveryoneReady({ ...room, players }));
}

function startIfEveryoneReady(room: Room): Room {
  const everyoneReady = room.players.every((p) => p.ready);
  if (room.phase !== 'lobby' || room.players.length < MIN_PLAYERS || !everyoneReady) return room;
  return startRound(room, 0);
}

function startRound(room: Room, roundIndex: number): Room {
  const question = room.questions[roundIndex];
  if (!question) return { ...room, phase: 'finished', phaseEndsAt: null };
  return {
    ...room,
    phase: 'answering',
    roundIndex,
    round: { question, answers: {}, bets: {}, result: null },
    phaseEndsAt: null,
    players: room.players.map((p) => ({ ...p, ready: false })),
  };
}

export function submitAnswer(room: Room, playerId: string, value: number): Result<Room> {
  if (room.phase !== 'answering' || !room.round) {
    return fail('answersClosed');
  }
  if (!room.players.some((p) => p.id === playerId)) return fail('notInRoom');
  if (playerId in room.round.answers) return fail('alreadyAnswered');
  const round = { ...room.round, answers: { ...room.round.answers, [playerId]: value } };
  return ok(startVotingIfEveryoneAnswered({ ...room, round }));
}

function startVotingIfEveryoneAnswered(room: Room): Room {
  if (room.phase !== 'answering' || !room.round) return room;
  const answers = room.round.answers;
  return room.players.every((p) => p.id in answers) ? { ...room, phase: 'voting' } : room;
}

export function submitBets(room: Room, playerId: string, bets: Bet[], now: number): Result<Room> {
  if (room.phase !== 'voting' || !room.round) return fail('votingClosed');
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return fail('notInRoom');
  if (playerId in room.round.bets) return fail('alreadyVoted');
  const answers = room.round.answers;
  if (bets.some((bet) => !(bet.playerId in answers))) {
    return fail('betTargetUnknown');
  }
  const total = bets.reduce((sum, bet) => sum + bet.amount, 0);
  if (total > player.tokens) return fail('notEnoughTokens');

  const round = { ...room.round, bets: { ...room.round.bets, [playerId]: bets } };
  return ok(finishRoundIfEveryoneVoted({ ...room, round }, now));
}

function finishRoundIfEveryoneVoted(room: Room, now: number): Room {
  if (room.phase !== 'voting' || !room.round) return room;
  const bets = room.round.bets;
  if (!room.players.every((p) => p.id in bets)) return room;

  const { players, result } = settleBets(
    room.players,
    room.round.answers,
    bets,
    room.round.question.answer,
  );
  return {
    ...room,
    players,
    phase: 'results',
    round: { ...room.round, result },
    phaseEndsAt: now + room.settings.resultsDurationMs,
  };
}

/** Moves a timed phase forward. Called when `phaseEndsAt` has passed. */
export function advancePhase(room: Room, now: number): Room {
  if (room.phase === 'results') {
    return { ...room, phase: 'ranking', phaseEndsAt: now + room.settings.rankingDurationMs };
  }
  if (room.phase === 'ranking') {
    const next = room.roundIndex + 1;
    if (next < totalRounds(room)) return startRound(room, next);
    return { ...room, phase: 'finished', phaseEndsAt: null };
  }
  return room;
}

const MID_GAME_PHASES = new Set(['answering', 'voting', 'results', 'ranking']);

/** Returns null when the last player leaves, so the caller can drop the room. */
export function removePlayer(room: Room, playerId: string, now: number): Room | null {
  const players = room.players.filter((p) => p.id !== playerId);
  if (players.length === room.players.length) return room;
  const [firstPlayer] = players;
  if (!firstPlayer) return null;

  const hostId = room.hostId === playerId ? firstPlayer.id : room.hostId;
  const next: Room = { ...room, players, hostId };

  if (MID_GAME_PHASES.has(next.phase) && players.length < MIN_PLAYERS) {
    return { ...next, phase: 'finished', phaseEndsAt: null };
  }

  if (next.phase === 'lobby') return startIfEveryoneReady(next);

  if (next.phase === 'answering' && next.round) {
    const answers = { ...next.round.answers };
    delete answers[playerId];
    return startVotingIfEveryoneAnswered({ ...next, round: { ...next.round, answers } });
  }

  if (next.phase === 'voting' && next.round) {
    const bets = { ...next.round.bets };
    delete bets[playerId];
    return finishRoundIfEveryoneVoted({ ...next, round: { ...next.round, bets } }, now);
  }

  return next;
}

export function restartGame(room: Room, playerId: string, questions: Question[]): Result<Room> {
  if (room.phase !== 'finished') return fail('gameNotFinished');
  if (room.hostId !== playerId) return fail('notHost');
  return ok({
    ...room,
    phase: 'lobby',
    questions,
    roundIndex: 0,
    round: null,
    phaseEndsAt: null,
    players: room.players.map((p) => ({ ...p, tokens: STARTING_TOKENS, ready: false })),
  });
}
