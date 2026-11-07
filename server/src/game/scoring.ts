import { MIN_TOKENS, type Bet } from '@lowball/shared';
import type { Player, RoundResult } from './types';

/** Highest answer that does not exceed the correct one. */
export function closestWithoutGoingOver(values: number[], correct: number): number | null {
  const candidates = values.filter((value) => value <= correct);
  return candidates.length > 0 ? Math.max(...candidates) : null;
}

/**
 * Payout for a bet on `value`, as a multiple of the stake:
 * exact answer 2x, closest without going over 1.5x,
 * at most 25% below the correct answer 1x, anything else loses the stake.
 */
export function payoutMultiplier(value: number, correct: number, closest: number | null): number {
  if (value === correct) return 2;
  if (closest !== null && value === closest) return 1.5;
  if (correct > 0 && value < correct && (correct - value) / correct <= 0.25) return 1;
  return -1;
}

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
