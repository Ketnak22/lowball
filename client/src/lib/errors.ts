import {
  MAX_ANSWER_LENGTH,
  MAX_NAME_LENGTH,
  ROOM_CODE_LENGTH,
  type ErrorCode,
} from '@lowball/shared';

const messages: Record<ErrorCode, string> = {
  nameEmpty: 'Enter your name.',
  nameTooLong: `Name cannot be longer than ${MAX_NAME_LENGTH} characters.`,
  nameInvalid: 'Name can only contain letters, digits, spaces, dots, dashes and underscores.',
  codeInvalid: `Room code must be ${ROOM_CODE_LENGTH} digits.`,
  answerEmpty: 'Write down a number first.',
  answerTooLong: `Answer cannot be longer than ${MAX_ANSWER_LENGTH} characters.`,
  answerInvalid: 'Answer must be a non-negative number.',
  answerTooLarge: 'Answer is too large.',
  betsInvalid: 'Bets must be whole numbers of tokens.',
  betDuplicate: 'You can bet on each answer only once.',
  betTargetUnknown: 'You can only bet on answers from this round.',
  notEnoughTokens: 'You do not have enough tokens for these bets.',
  gameStarted: 'The game in this room has already started.',
  gameNotFinished: 'The current game has not finished yet.',
  alreadyInRoom: 'You are already in this room.',
  roomFull: 'This room is full.',
  nameTaken: 'Someone in this room already uses that name.',
  notInRoom: 'You are not in this room.',
  answersClosed: 'Answers are not being collected right now.',
  alreadyAnswered: 'You have already answered.',
  votingClosed: 'Voting is not open right now.',
  alreadyVoted: 'You have already placed your bets.',
  notHost: 'Only the host can start a new game.',
  leaveRoomFirst: 'Leave your current room first.',
  noFreeCodes: 'No free room codes right now, try again later.',
  roomNotFound: 'Room not found.',
  readyInvalid: 'Invalid ready state.',
  notConnected: 'Not connected to the server.',
};

export const errorMessage = (code: ErrorCode): string => messages[code];
