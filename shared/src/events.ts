export type Phase = 'lobby' | 'answering' | 'voting' | 'results' | 'ranking' | 'finished';

export interface PlayerView {
  id: string;
  name: string;
  tokens: number;
  ready: boolean;
  answered: boolean;
  voted: boolean;
}

export interface AnswerView {
  playerId: string;
  value: number;
}

export interface Bet {
  playerId: string;
  amount: number;
}

export interface RoundResultView {
  correctAnswer: number;
  /** Highest answer that does not exceed the correct one, or null if all went over. */
  closestAnswer: number | null;
  /** Token change per player id for this round. */
  tokenChanges: Record<string, number>;
}

export interface RoundView {
  number: number;
  question: string;
  unit: string;
  /** Filled in once voting starts, sorted ascending. */
  answers: AnswerView[];
  result: RoundResultView | null;
}

export interface RoomView {
  code: string;
  hostId: string;
  phase: Phase;
  players: PlayerView[];
  totalRounds: number;
  round: RoundView | null;
  /** Epoch ms when a timed phase (results, ranking) moves on. */
  phaseEndsAt: number | null;
}

export type Ack<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
export type AckCallback<T = undefined> = (response: Ack<T>) => void;

export interface JoinedRoom {
  code: string;
  playerId: string;
}

export interface ClientToServerEvents {
  'room:create': (payload: { name: string }, ack: AckCallback<JoinedRoom>) => void;
  'room:join': (payload: { code: string; name: string }, ack: AckCallback<JoinedRoom>) => void;
  'room:leave': (ack: AckCallback) => void;
  'player:ready': (payload: { ready: boolean }, ack: AckCallback) => void;
  'round:answer': (payload: { answer: string }, ack: AckCallback) => void;
  'round:bets': (payload: { bets: Bet[] }, ack: AckCallback) => void;
  'game:restart': (ack: AckCallback) => void;
}

export interface ServerToClientEvents {
  'room:state': (room: RoomView) => void;
}
