import data from './questions.json' with { type: 'json' };
import type { Question } from './game/types';

export const questions: Question[] = data;
