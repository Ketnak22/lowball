import { describe, expect, it } from 'vitest';
import { parseAnswer, parseBets, validateName, validateRoomCode } from './validation';

describe('validateName', () => {
  it('trims and collapses whitespace', () => {
    expect(validateName('  Ala   Kot ')).toEqual({ ok: true, value: 'Ala Kot' });
  });

  it('accepts Polish letters, digits and simple punctuation', () => {
    expect(validateName('Łukasz_Żółć-2.0').ok).toBe(true);
  });

  it.each([
    ['empty', '   '],
    ['too long', 'a'.repeat(21)],
    ['html', '<b>x</b>'],
    ['emoji', 'cat 🐱'],
    ['not a string', 42],
    ['missing', undefined],
  ])('rejects %s names', (_label, input) => {
    expect(validateName(input).ok).toBe(false);
  });

  it('accepts a name of exactly the maximum length', () => {
    expect(validateName('a'.repeat(20)).ok).toBe(true);
  });
});

describe('validateRoomCode', () => {
  it('accepts five digits', () => {
    expect(validateRoomCode(' 12345 ')).toEqual({ ok: true, value: '12345' });
  });

  it.each(['1234', '123456', 'abcde', '12 45', ''])('rejects %j', (code) => {
    expect(validateRoomCode(code).ok).toBe(false);
  });
});

describe('parseAnswer', () => {
  it.each([
    ['1234', 1234],
    ['0', 0],
    ['0.5', 0.5],
    ['0,5', 0.5],
    [' 42 ', 42],
  ])('parses %j', (input, expected) => {
    expect(parseAnswer(input)).toEqual({ ok: true, value: expected });
  });

  it.each(['', 'abc', '-5', '1e5', '1.2.3', 'Infinity', '1'.repeat(16)])('rejects %j', (input) => {
    expect(parseAnswer(input).ok).toBe(false);
  });

  it('rejects values that are not strings', () => {
    expect(parseAnswer(5).ok).toBe(false);
  });
});

describe('parseBets', () => {
  it('accepts an empty list as skipping the vote', () => {
    expect(parseBets([])).toEqual({ ok: true, value: [] });
  });

  it('keeps only the expected fields', () => {
    const result = parseBets([{ playerId: 'a', amount: 10, extra: true }]);
    expect(result).toEqual({ ok: true, value: [{ playerId: 'a', amount: 10 }] });
  });

  it.each([
    ['not a list', { playerId: 'a', amount: 1 }],
    ['zero amount', [{ playerId: 'a', amount: 0 }]],
    ['fractional amount', [{ playerId: 'a', amount: 1.5 }]],
    ['string amount', [{ playerId: 'a', amount: '10' }]],
    ['missing target', [{ amount: 10 }]],
    ['duplicate target', [{ playerId: 'a', amount: 1 }, { playerId: 'a', amount: 2 }]],
    ['null entry', [null]],
  ])('rejects %s', (_label, input) => {
    expect(parseBets(input).ok).toBe(false);
  });
});
