import { MIN_TOKENS, closestWithoutGoingOver, payoutMultiplier, type Bet } from '@lowball/shared';
import type { Player, RoundResult } from './types';

export function betPayout(amount: number, multiplier: number): number {
  return multiplier < 0 ? -amount : Math.floor(amount * multiplier);
}

export function settleBets(
  players: Player[],
  answers: Record<string, number>,
  bets: Record<string, Bet[]>,
  correctAnswer: number,
): { players: Player[]; result: RoundResult } {
  const closestAnswer = closestWithoutGoingOver(Object.values(answers), correctAnswer);
  const tokenChanges: Record<string, number> = {};

  const settled = players.map((player) => {
    let delta = 0;
    for (const bet of bets[player.id] ?? []) {
      const value = answers[bet.playerId];
      if (value === undefined) continue;
      delta += betPayout(bet.amount, payoutMultiplier(value, correctAnswer, closestAnswer));
    }
    const tokens = Math.max(MIN_TOKENS, player.tokens + delta);
    tokenChanges[player.id] = tokens - player.tokens;
    return { ...player, tokens };
  });

  return { players: settled, result: { correctAnswer, closestAnswer, tokenChanges } };
}
