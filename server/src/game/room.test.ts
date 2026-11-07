import { MAX_PLAYERS, STARTING_TOKENS, type ErrorCode, type Result } from '@lowball/shared';
import { describe, expect, it } from 'vitest';
import {
  addPlayer,
  advancePhase,
  createRoom,
  removePlayer,
  restartGame,
  setReady,
  submitAnswer,
  submitBets,
} from './room';
import type { Question, Room } from './types';
import { toRoomView } from './view';

const questions: Question[] = [
  { question: { pl: 'P1', en: 'Q1' }, answer: 100, unit: { pl: 'm', en: 'm' } },
  { question: { pl: 'P2', en: 'Q2' }, answer: 50, unit: { pl: 'kg', en: 'kg' } },
];
const settings = { totalRounds: 2, resultsDurationMs: 1000, rankingDurationMs: 2000 };
const NOW = 10_000;

function unwrap(result: Result<Room>): Room {
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

function expectError(result: Result<Room>, code: ErrorCode) {
  expect(result).toEqual({ ok: false, error: code });
}

function lobby(...names: string[]): Room {
  const [host, ...rest] = names;
  let room = createRoom('12345', { id: host!, name: host! }, questions, settings);
  for (const name of rest) room = unwrap(addPlayer(room, { id: name, name }));
  return room;
}

function readyAll(room: Room): Room {
  return room.players.reduce((r, p) => unwrap(setReady(r, p.id, true)), room);
}

function answerAll(room: Room, values: Record<string, number>): Room {
  return Object.entries(values).reduce((r, [id, v]) => unwrap(submitAnswer(r, id, v)), room);
}

function voteAll(room: Room): Room {
  return room.players.reduce((r, p) => unwrap(submitBets(r, p.id, [], NOW)), room);
}

describe('joining a room', () => {
  it('starts in the lobby with the creator as host', () => {
    const room = lobby('ala');
    expect(room.phase).toBe('lobby');
    expect(room.hostId).toBe('ala');
    expect(room.players[0]?.tokens).toBe(STARTING_TOKENS);
  });

  it('rejects duplicate names regardless of case', () => {
    expectError(addPlayer(lobby('Ala'), { id: 'x', name: 'ALA' }), 'nameTaken');
  });

  it('rejects players once the room is full', () => {
    const names = Array.from({ length: MAX_PLAYERS }, (_, i) => `p${i}`);
    expectError(addPlayer(lobby(...names), { id: 'late', name: 'late' }), 'roomFull');
  });

  it('rejects joining after the game started', () => {
    const room = readyAll(lobby('ala', 'ola'));
    expectError(addPlayer(room, { id: 'x', name: 'x' }), 'gameStarted');
  });
});

describe('phase transitions', () => {
  it('waits for at least two players before starting', () => {
    const room = unwrap(setReady(lobby('ala'), 'ala', true));
    expect(room.phase).toBe('lobby');
  });

  it('starts the first round when everyone is ready', () => {
    const room = unwrap(setReady(unwrap(setReady(lobby('ala', 'ola'), 'ala', true)), 'ola', true));
    expect(room.phase).toBe('answering');
    expect(room.round?.question.question.en).toBe('Q1');
    expect(room.players.every((p) => !p.ready)).toBe(true);
  });

  it('lets a player take back their ready state', () => {
    let room = unwrap(setReady(lobby('ala', 'ola'), 'ala', true));
    room = unwrap(setReady(room, 'ala', false));
    room = unwrap(setReady(room, 'ola', true));
    expect(room.phase).toBe('lobby');
  });

  it('moves to voting once everyone answered', () => {
    let room = readyAll(lobby('ala', 'ola'));
    room = unwrap(submitAnswer(room, 'ala', 90));
    expect(room.phase).toBe('answering');
    room = unwrap(submitAnswer(room, 'ola', 120));
    expect(room.phase).toBe('voting');
  });

  it('settles bets and shows results once everyone voted', () => {
    let room = answerAll(readyAll(lobby('ala', 'ola')), { ala: 90, ola: 120 });
    room = unwrap(submitBets(room, 'ala', [{ playerId: 'ala', amount: 20 }], NOW));
    expect(room.phase).toBe('voting');
    room = unwrap(submitBets(room, 'ola', [{ playerId: 'ola', amount: 20 }], NOW));

    expect(room.phase).toBe('results');
    expect(room.phaseEndsAt).toBe(NOW + settings.resultsDurationMs);
    // 90 is closest without going over 100 (1.5x), 120 went over and loses the stake.
    expect(room.round?.result?.tokenChanges).toEqual({ ala: 30, ola: -20 });
  });

  it('goes from results to ranking to the next round, then finishes', () => {
    let room = voteAll(answerAll(readyAll(lobby('ala', 'ola')), { ala: 1, ola: 2 }));
    room = advancePhase(room, NOW);
    expect(room.phase).toBe('ranking');
    expect(room.phaseEndsAt).toBe(NOW + settings.rankingDurationMs);

    room = advancePhase(room, NOW);
    expect(room.phase).toBe('answering');
    expect(room.round?.question.question.en).toBe('Q2');
    expect(room.round?.answers).toEqual({});

    room = voteAll(answerAll(room, { ala: 1, ola: 2 }));
    room = advancePhase(advancePhase(room, NOW), NOW);
    expect(room.phase).toBe('finished');
    expect(room.phaseEndsAt).toBeNull();
  });

  it('ignores the timer outside timed phases', () => {
    const room = lobby('ala');
    expect(advancePhase(room, NOW)).toBe(room);
  });
});

describe('actions in the wrong phase', () => {
  it('rejects answers outside the answering phase', () => {
    expectError(submitAnswer(lobby('ala', 'ola'), 'ala', 5), 'answersClosed');
  });

  it('rejects a second answer', () => {
    const room = unwrap(submitAnswer(readyAll(lobby('ala', 'ola')), 'ala', 5));
    expectError(submitAnswer(room, 'ala', 6), 'alreadyAnswered');
  });

  it('rejects bets outside voting', () => {
    expectError(submitBets(readyAll(lobby('ala', 'ola')), 'ala', [], NOW), 'votingClosed');
  });

  it('rejects ready changes during the game', () => {
    expectError(setReady(readyAll(lobby('ala', 'ola')), 'ala', true), 'gameStarted');
  });

  it('rejects actions from players not in the room', () => {
    expectError(submitAnswer(readyAll(lobby('ala', 'ola')), 'ghost', 5), 'notInRoom');
  });
});

describe('bet validation', () => {
  const voting = () => answerAll(readyAll(lobby('ala', 'ola')), { ala: 90, ola: 120 });

  it('rejects bets on answers that do not exist', () => {
    expectError(
      submitBets(voting(), 'ala', [{ playerId: 'nobody', amount: 5 }], NOW),
      'betTargetUnknown',
    );
  });

  it('rejects bets above the player balance', () => {
    const bets = [
      { playerId: 'ala', amount: 150 },
      { playerId: 'ola', amount: 51 },
    ];
    expectError(submitBets(voting(), 'ala', bets, NOW), 'notEnoughTokens');
  });

  it('rejects voting twice', () => {
    const room = unwrap(submitBets(voting(), 'ala', [], NOW));
    expectError(submitBets(room, 'ala', [], NOW), 'alreadyVoted');
  });
});

describe('players leaving', () => {
  it('drops the room when the last player leaves', () => {
    expect(removePlayer(lobby('ala'), 'ala', NOW)).toBeNull();
  });

  it('hands the host role to the next player', () => {
    const room = removePlayer(lobby('ala', 'ola', 'ela'), 'ala', NOW);
    expect(room?.hostId).toBe('ola');
  });

  it('starts the game if the only player who was not ready leaves the lobby', () => {
    let room = lobby('ala', 'ola', 'ela');
    room = unwrap(setReady(unwrap(setReady(room, 'ala', true)), 'ola', true));
    expect(removePlayer(room, 'ela', NOW)?.phase).toBe('answering');
  });

  it('moves to voting when the last player who had not answered leaves', () => {
    let room = readyAll(lobby('ala', 'ola', 'ela'));
    room = answerAll(room, { ala: 1, ola: 2 });
    room = removePlayer(room, 'ela', NOW)!;
    expect(room.phase).toBe('voting');
  });

  it('removes the answer of a player who leaves while answering', () => {
    let room = readyAll(lobby('ala', 'ola', 'ela'));
    room = unwrap(submitAnswer(room, 'ela', 7));
    room = removePlayer(room, 'ela', NOW)!;
    expect(room.round?.answers).toEqual({});
  });

  it('finishes the round when the last player who had not voted leaves', () => {
    let room = answerAll(readyAll(lobby('ala', 'ola', 'ela')), { ala: 1, ola: 2, ela: 3 });
    room = unwrap(submitBets(unwrap(submitBets(room, 'ala', [], NOW)), 'ola', [], NOW));
    room = removePlayer(room, 'ela', NOW)!;
    expect(room.phase).toBe('results');
    expect(room.round?.answers).toHaveProperty('ela');
  });

  it('ends the game when fewer than two players remain', () => {
    const room = removePlayer(readyAll(lobby('ala', 'ola')), 'ola', NOW);
    expect(room?.phase).toBe('finished');
  });

  it('ignores unknown player ids', () => {
    const room = lobby('ala');
    expect(removePlayer(room, 'ghost', NOW)).toBe(room);
  });
});

describe('restartGame', () => {
  /** Plays both rounds of a two-player game. */
  function finished(): Room {
    let room = readyAll(lobby('ala', 'ola'));
    for (let round = 0; round < settings.totalRounds; round++) {
      room = voteAll(answerAll(room, { ala: 1, ola: 2 }));
      room = advancePhase(advancePhase(room, NOW), NOW);
    }
    return room;
  }

  it('lets only the host restart a finished game', () => {
    const room = finished();
    expect(room.phase).toBe('finished');
    expectError(restartGame(room, 'ola', questions), 'notHost');

    const restarted = unwrap(restartGame(room, 'ala', questions));
    expect(restarted.phase).toBe('lobby');
    expect(restarted.round).toBeNull();
    expect(restarted.players.every((p) => p.tokens === STARTING_TOKENS && !p.ready)).toBe(true);
  });

  it('rejects restarting a game in progress', () => {
    expectError(restartGame(readyAll(lobby('ala', 'ola')), 'ala', questions), 'gameNotFinished');
  });
});

describe('toRoomView', () => {
  it('hides answers while players are still answering', () => {
    const room = unwrap(submitAnswer(readyAll(lobby('ala', 'ola')), 'ala', 42));
    const view = toRoomView(room);
    expect(view.round?.answers).toEqual([]);
    expect(view.players.find((p) => p.id === 'ala')?.answered).toBe(true);
    expect(JSON.stringify(view)).not.toContain('42');
  });

  it('never includes the correct answer before results', () => {
    const room = answerAll(readyAll(lobby('ala', 'ola')), { ala: 3, ola: 1 });
    const view = toRoomView(room);
    expect(view.round?.result).toBeNull();
    expect(view.round?.answers.map((a) => a.value)).toEqual([1, 3]);
  });
});
