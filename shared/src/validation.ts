import type { ErrorCode } from './errors';
import type { Bet } from './events';
import { MAX_ANSWER_LENGTH, MAX_ANSWER_VALUE, MAX_NAME_LENGTH, ROOM_CODE_LENGTH } from './rules';

export type Result<T> = { ok: true; value: T } | { ok: false; error: ErrorCode };

const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = <T>(error: ErrorCode): Result<T> => ({ ok: false, error });

const NAME_PATTERN = /^[\p{L}\p{N} _.-]+$/u;
const ROOM_CODE_PATTERN = new RegExp(String.raw`^\d{${ROOM_CODE_LENGTH}}$`);

export function validateName(input: unknown): Result<string> {
  if (typeof input !== 'string') return fail('nameEmpty');
  const name = input.trim().replace(/\s+/g, ' ');
  if (name.length === 0) return fail('nameEmpty');
  if (name.length > MAX_NAME_LENGTH) {
    return fail('nameTooLong');
  }
  if (!NAME_PATTERN.test(name)) {
    return fail('nameInvalid');
  }
  return ok(name);
}

export function validateRoomCode(input: unknown): Result<string> {
  if (typeof input !== 'string') return fail('codeInvalid');
  const code = input.trim();
  if (!ROOM_CODE_PATTERN.test(code)) {
    return fail('codeInvalid');
  }
  return ok(code);
}

/** Accepts "1234", "0.5" and "0,5". Answers are non-negative numbers. */
export function parseAnswer(input: unknown): Result<number> {
  if (typeof input !== 'string') return fail('answerEmpty');
  const raw = input.trim();
  if (raw.length === 0) return fail('answerEmpty');
  if (raw.length > MAX_ANSWER_LENGTH) {
    return fail('answerTooLong');
  }
  const normalized = raw.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return fail('answerInvalid');
  const value = Number(normalized);
  if (!Number.isFinite(value) || value > MAX_ANSWER_VALUE) return fail('answerTooLarge');
  return ok(value);
}

/** Checks the shape of a bets payload. Game rules (targets, token limits) are checked by the server. */
export function parseBets(input: unknown): Result<Bet[]> {
  if (!Array.isArray(input)) return fail('betsInvalid');
  const bets: Bet[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    if (typeof item !== 'object' || item === null) return fail('betsInvalid');
    const { playerId, amount } = item as Record<string, unknown>;
    if (typeof playerId !== 'string' || playerId.length === 0 || playerId.length > 64) {
      return fail('betsInvalid');
    }
    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
      return fail('betsInvalid');
    }
    if (seen.has(playerId)) return fail('betDuplicate');
    seen.add(playerId);
    bets.push({ playerId, amount });
  }
  return ok(bets);
}
