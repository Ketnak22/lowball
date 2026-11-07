export interface User {
  id: string;
  username: string;
  ready: boolean;
}

export interface Question {
  question: string;
  answer: number;
  unit: string;
}

export interface UserAnswer {
  id: string;
  answer: number;
}

export interface Response {
  success: boolean;
  message?: string;
}