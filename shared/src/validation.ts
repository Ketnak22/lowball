import type { Bet } from './events';
import { MAX_ANSWER_LENGTH, MAX_ANSWER_VALUE, MAX_NAME_LENGTH, ROOM_CODE_LENGTH } from './rules';

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = <T>(error: string): Result<T> => ({ ok: false, error });

const NAME_PATTERN = /^[\p{L}\p{N} _.-]+$/u;

export function validateName(input: unknown): Result<string> {
  if (typeof input !== 'string') return fail('Name is required.');
  const name = input.trim().replace(/\s+/g, ' ');
  if (name.length === 0) return fail('Name cannot be empty.');
  if (name.length > MAX_NAME_LENGTH) {
    return fail(`Name cannot be longer than ${MAX_NAME_LENGTH} characters.`);
  }
  if (!NAME_PATTERN.test(name)) {
    return fail('Name can only contain letters, digits, spaces, dots, dashes and underscores.');
  }
  return ok(name);
}

export function validateRoomCode(input: unknown): Result<string> {
  if (typeof input !== 'string') return fail('Room code is required.');
  const code = input.trim();
  if (!new RegExp(`^\d{${ROOM_CODE_LENGTH}}$`).test(code)) {
    return fail(`Room code must be ${ROOM_CODE_LENGTH} digits.`);
  }
  return ok(code);
}

/** Accepts "1234", "0.5" and "0,5". Answers are non-negative numbers. */
export function parseAnswer(input: unknown): Result<number> {
  if (typeof input !== 'string') return fail('Answer is required.');
  const raw = input.trim();
  if (raw.length === 0) return fail('Answer cannot be empty.');
  if (raw.length > MAX_ANSWER_LENGTH) {
    return fail(`Answer cannot be longer than ${MAX_ANSWER_LENGTH} characters.`);
  }
  const normalized = raw.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return fail('Answer must be a non-negative number.');
  const value = Number(normalized);
  if (!Number.isFinite(value) || value > MAX_ANSWER_VALUE) return fail('Answer is too large.');
  return ok(value);
}

/** Checks the shape of a bets payload. Game rules (targets, token limits) are checked by the server. */
export function parseBets(input: unknown): Result<Bet[]> {
  if (!Array.isArray(input)) return fail('Bets must be a list.');
  const bets: Bet[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    if (typeof item !== 'object' || item === null) return fail('Invalid bet.');
    const { playerId, amount } = item as Record<string, unknown>;
    if (typeof playerId !== 'string' || playerId.length === 0 || playerId.length > 64) {
      return fail('Invalid bet target.');
    }
    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
      return fail('Each bet must be a positive whole number of tokens.');
    }
    if (seen.has(playerId)) return fail('You can bet on each answer only once.');
    seen.add(playerId);
    bets.push({ playerId, amount });
  }
  return ok(bets);
}
