import { describe, expect, it } from 'vitest';
import { closestWithoutGoingOver, payoutMultiplier } from './payout';

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
