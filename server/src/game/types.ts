import type { Bet, Phase } from '@lowball/shared';

export interface Question {
  question: string;
  answer: number;
  unit: string;
}

export interface Player {
  id: string;
  name: string;
  tokens: number;
  ready: boolean;
}

export interface RoundResult {
  correctAnswer: number;
  closestAnswer: number | null;
  tokenChanges: Record<string, number>;
}

export interface Round {
  question: Question;
  /** Player id to answer. Kept after a player leaves so bets on that answer still count. */
  answers: Record<string, number>;
  bets: Record<string, Bet[]>;
  result: RoundResult | null;
}

export interface RoomSettings {
  totalRounds: number;
  resultsDurationMs: number;
  rankingDurationMs: number;
}

export interface Room {
  code: string;
  hostId: string;
  phase: Phase;
  players: Player[];
  questions: Question[];
  roundIndex: number;
  round: Round | null;
  phaseEndsAt: number | null;
  settings: RoomSettings;
}
