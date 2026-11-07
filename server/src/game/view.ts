import type { RoomView } from '@lowball/shared';
import { totalRounds } from './room';
import type { Room } from './types';

/** What every player in the room may see: answers stay hidden until voting starts. */
export function toRoomView(room: Room): RoomView {
  const round = room.round;
  const inRound = round !== null && room.phase !== 'lobby' && room.phase !== 'finished';

  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    totalRounds: totalRounds(room),
    phaseEndsAt: room.phaseEndsAt,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      tokens: p.tokens,
      ready: p.ready,
      answered: inRound && p.id in round.answers,
      voted: inRound && p.id in round.bets,
    })),
    round: inRound
      ? {
          number: room.roundIndex + 1,
          question: round.question.question,
          unit: round.question.unit,
          answers:
            room.phase === 'answering'
              ? []
              : Object.entries(round.answers)
                  .map(([playerId, value]) => ({ playerId, value }))
                  .sort((a, b) => a.value - b.value),
          result: round.result,
        }
      : null,
  };
}
