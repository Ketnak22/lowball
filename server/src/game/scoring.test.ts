import { MIN_TOKENS } from '@lowball/shared';
import { describe, expect, it } from 'vitest';
import { closestWithoutGoingOver, payoutMultiplier, settleBets } from './scoring';
import type { Player } from './types';

const player = (id: string, tokens = 200): Player => ({ id, name: id, tokens, ready: false });

describe('closestWithoutGoingOver', () => {
  it('picks the highest answer that does not exceed the correct one', () => {
    expect(closestWithoutGoingOver([10, 90, 120, 50], 100)).toBe(90);
  });

  it('counts an exact answer as closest', () => {
    expect(closestWithoutGoingOver([100, 90], 100)).toBe(100);
  });

  it('returns null when every answer is too high', () => {
    expect(closestWithoutGoingOver([101, 200], 100)).toBeNull();
  });
});

describe('payoutMultiplier', () => {
  it('pays 2x for the exact answer', () => {
    expect(payoutMultiplier(100, 100, 100)).toBe(2);
  });

  it('pays 1.5x for the closest answer without going over', () => {
    expect(payoutMultiplier(60, 100, 60)).toBe(1.5);
  });

  it('pays 1x for answers at most 25% below the correct one', () => {
    expect(payoutMultiplier(75, 100, 90)).toBe(1);
    expect(payoutMultiplier(80, 100, 90)).toBe(1);
  });

  it('loses the stake for answers further below or above', () => {
    expect(payoutMultiplier(74, 100, 90)).toBe(-1);
    expect(payoutMultiplier(101, 100, 90)).toBe(-1);
  });

  it('handles a correct answer of 0 without dividing by zero', () => {
    expect(payoutMultiplier(0, 0, 0)).toBe(2);
    expect(payoutMultiplier(1, 0, 0)).toBe(-1);
  });
});

describe('settleBets', () => {
  const answers = { a: 100, b: 90, c: 150 };

  it('adds winnings and subtracts losses per player', () => {
    const { players, result } = settleBets(
      [player('a'), player('b'), player('c')],
      answers,
      {
        a: [{ playerId: 'a', amount: 50 }],
        b: [
          { playerId: 'b', amount: 30 },
          { playerId: 'c', amount: 20 },
        ],
        c: [],
      },
      90,
    );

    // a bet 50 on 100 (above 90): -50. b: 30 on 90 (exact) +60, 20 on 150 -20.
    expect(players.map((p) => p.tokens)).toEqual([150, 240, 200]);
    expect(result).toEqual({
      correctAnswer: 90,
      closestAnswer: 90,
      tokenChanges: { a: -50, b: 40, c: 0 },
    });
  });

  it('rounds 1.5x payouts down to whole tokens', () => {
    const { players } = settleBets(
      [player('a')],
      { a: 90 },
      { a: [{ playerId: 'a', amount: 15 }] },
      100,
    );
    expect(players[0]?.tokens).toBe(222);
  });

  it('never drops a player below the minimum', () => {
    const { players, result } = settleBets(
      [player('a', 40)],
      { a: 500 },
      { a: [{ playerId: 'a', amount: 40 }] },
      100,
    );
    expect(players[0]?.tokens).toBe(MIN_TOKENS);
    expect(result.tokenChanges.a).toBe(MIN_TOKENS - 40);
  });

  it('still pays out bets on the answer of a player who has left', () => {
    const { players } = settleBets(
      [player('a')],
      { a: 10, gone: 100 },
      { a: [{ playerId: 'gone', amount: 10 }] },
      100,
    );
    expect(players[0]?.tokens).toBe(220);
  });
});
