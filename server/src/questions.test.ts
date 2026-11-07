import { ROUNDS_PER_GAME } from '@lowball/shared';
import { describe, expect, it } from 'vitest';
import { questions } from './questions';

describe('questions.json', () => {
  it('has enough questions for a full game', () => {
    expect(questions.length).toBeGreaterThanOrEqual(ROUNDS_PER_GAME);
  });

  it.each(questions.map((q, i) => [i, q] as const))('question %i is complete', (_i, q) => {
    for (const text of [q.question.pl, q.question.en, q.unit.pl, q.unit.en]) {
      expect(text.trim()).not.toBe('');
    }
    expect(Number.isFinite(q.answer)).toBe(true);
    expect(q.answer).toBeGreaterThan(0);
  });

  it('has no repeated questions', () => {
    for (const lang of ['pl', 'en'] as const) {
      const texts = questions.map((q) => q.question[lang].trim().toLowerCase());
      expect(new Set(texts).size).toBe(texts.length);
    }
  });
});
