/**
 * Reasons the server or the validators reject a request. The client turns them
 * into text in the player's language.
 */
export type ErrorCode =
  | 'nameEmpty'
  | 'nameTooLong'
  | 'nameInvalid'
  | 'codeInvalid'
  | 'answerEmpty'
  | 'answerTooLong'
  | 'answerInvalid'
  | 'answerTooLarge'
  | 'betsInvalid'
  | 'betDuplicate'
  | 'betTargetUnknown'
  | 'notEnoughTokens'
  | 'gameStarted'
  | 'gameNotFinished'
  | 'alreadyInRoom'
  | 'roomFull'
  | 'nameTaken'
  | 'notInRoom'
  | 'answersClosed'
  | 'alreadyAnswered'
  | 'votingClosed'
  | 'alreadyVoted'
  | 'notHost'
  | 'leaveRoomFirst'
  | 'noFreeCodes'
  | 'roomNotFound'
  | 'readyInvalid'
  | 'notConnected';
