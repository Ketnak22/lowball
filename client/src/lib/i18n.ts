import {
  LOCALES,
  MAX_ANSWER_LENGTH,
  MAX_NAME_LENGTH,
  MIN_PLAYERS,
  ROOM_CODE_LENGTH,
  type ErrorCode,
  type Locale,
} from '@lowball/shared';
import { derived, writable } from 'svelte/store';

/** Polish plural forms: 1 runda, 2-4 rundy, 5+ rund (12-14 also take the last form). */
function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const tens = n % 100;
  const units = n % 10;
  return units >= 2 && units <= 4 && (tens < 12 || tens > 14) ? few : many;
}

const en = {
  languageName: 'English',
  language: 'Language',
  common: {
    you: 'You',
    round: (n: number, total: number) => `round ${n} / ${total}`,
    seconds: 's',
  },
  home: {
    pitch:
      'Everyone writes a number on their own card. Then you bet tokens on the answer you think is closest without going over.',
    devices: 'Each player uses their own phone or computer.',
    sampleQuestion: "How long is the Earth's equator?",
    sampleValue: '40 075',
    sampleUnit: 'km',
    create: 'Create a room',
    join: 'Join a room',
    noInstall: 'Runs in the browser, nothing to install.',
    back: 'Back',
    joinHint: 'The code is on the screen of the person who created the room.',
    createHint: 'You will get a code to share with the other players.',
    name: 'Your name',
    code: 'Room code',
    codeHint: `${ROOM_CODE_LENGTH} digits, shown to whoever created the room.`,
    joinButton: 'Join',
    or: 'or',
    createNew: 'Create a new room',
    createButton: 'Create',
    connectionLost: 'Connection to the server was lost. You have left the room.',
  },
  connection: {
    heading: 'Connecting…',
    lost: 'The connection to the game server dropped, so you left the room. Once it is back you can create or join a room again.',
    trying: 'Trying to reach the game server.',
    retry: 'Try now',
  },
  lobby: {
    topbar: 'lobby',
    leave: 'Leave room',
    code: 'Room code',
    share: 'Share this code. Others enter it on the start screen.',
    players: (n: number, max: number) => `Players (${n}/${max})`,
    playersList: 'Players',
    you: 'you',
    host: 'host',
    ready: 'ready',
    notReady: 'not ready',
    tooFew: `Waiting for at least ${MIN_PLAYERS} players.`,
    readyButton: 'Ready',
    notReadyButton: 'Not ready yet',
    startHint: 'The game starts for everyone once all players are ready.',
  },
  waiting: {
    you: 'you',
    waitingFor: (names: string[]) => `waiting for: ${names.join(', ')}`,
    everyoneDone: 'everyone is done',
    stillThinking: 'still thinking',
  },
  question: {
    label: (n: number) => `Question ${n}`,
    hintWrite: 'Write down a number. Nobody sees it until everyone has handed in.',
    hintBet: 'Then everyone bets on the answer closest without going over.',
    myAnswer: 'My answer',
    handIn: 'Hand in',
    handedIn: 'Handed in',
    doneLabel: 'handed in',
  },
  voting: {
    topbar: 'bets',
    hint: 'Spread your tokens over the answers you trust, or skip this round. Answers are sorted from lowest to highest.',
    yourAnswer: 'Your answer',
    answer: 'Answer',
    bet: 'Bet',
    betOn: (value: string) => `Tokens on ${value}`,
    tokensLeft: 'Tokens left:',
    of: (total: number) => `of ${total}`,
    place: 'Place bets',
    skip: 'Skip betting',
    placed: 'Bets placed',
    doneLabel: 'placed bets',
  },
  results: {
    topbar: 'results',
    correct: 'Correct answer',
    leftGame: 'Left the game',
    exact: 'exact! 2x',
    closest: 'closest! 1.5x',
    near: 'within 25%: 1x',
    tooHigh: 'too high: lost',
    tooLow: 'too low: lost',
    offBy: (value: string, unit: string) => `off by ${value} ${unit}`,
    allOver: 'Every answer went over, so every bet was lost.',
    exactly: (names: string) => `${names} got it exactly right.`,
    closestShort: (names: string, off: string, unit: string) =>
      `Closest without going over: ${names}, ${off} ${unit} short.`,
    yourBets: 'Your bets:',
    tokensNow: (n: number) => `You have ${n} tokens.`,
    next: 'Ranking in',
  },
  ranking: {
    topbarAfter: (n: number, total: number) => `after round ${n} / ${total}`,
    topbarOver: 'game over',
    topbar: 'ranking',
    list: 'Ranking',
    tieFinal: 'It ends in a tie',
    tieLead: 'Tied for the lead',
    youWin: 'You win',
    youLead: 'You are in the lead',
    wins: (name: string) => `${name} wins`,
    leads: (name: string) => `${name} leads`,
    summary: (rounds: number, players: number) => `${rounds} rounds, ${players} players.`,
    left: (n: number) => (n === 1 ? 'One round left.' : `${n} rounds left.`),
    sticky: 'Your row stays visible while you scroll.',
    playAgain: 'Play again',
    hostNote: 'The host can start a new game with everyone still in the room.',
    leave: 'Leave game',
    next: 'Next round in',
  },
  errors: {
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
  } satisfies Record<ErrorCode, string>,
};

export type Messages = typeof en;

const pl: Messages = {
  languageName: 'Polski',
  language: 'Język',
  common: {
    you: 'Ty',
    round: (n, total) => `runda ${n} / ${total}`,
    seconds: 's',
  },
  home: {
    pitch:
      'Każdy zapisuje liczbę na swojej kartce. Potem obstawiacie żetonami odpowiedź najbliższą prawdy, która jej nie przekracza.',
    devices: 'Grajcie na telefonach albo komputerach, każdy na swoim urządzeniu. Bez instalowania.',
    sampleQuestion: 'Ile kilometrów ma Wisła?',
    sampleValue: '1 047',
    sampleUnit: 'km',
    create: 'Utwórz pokój',
    join: 'Dołącz do pokoju',
    noInstall: 'Gra działa w przeglądarce, bez instalowania.',
    back: 'Wróć',
    joinHint: 'Kod zobaczysz na telefonie osoby, która utworzyła pokój.',
    createHint: 'Dostaniesz kod, który podasz pozostałym graczom.',
    name: 'Twoje imię',
    code: 'Kod pokoju',
    codeHint: `${ROOM_CODE_LENGTH} ${plural(ROOM_CODE_LENGTH, 'cyfra', 'cyfry', 'cyfr')}. Kod zobaczysz u osoby, która utworzyła pokój.`,
    joinButton: 'Dołącz',
    or: 'albo',
    createNew: 'Utwórz nowy pokój',
    createButton: 'Utwórz',
    connectionLost: 'Połączenie z serwerem zostało przerwane, więc nie jesteś już w pokoju.',
  },
  connection: {
    heading: 'Łączymy…',
    lost: 'Straciliśmy połączenie z grą, więc nie jesteś już w pokoju. Gdy wróci, możesz utworzyć pokój albo dołączyć do niego od nowa.',
    trying: 'Próbujemy połączyć się z serwerem gry.',
    retry: 'Spróbuj teraz',
  },
  lobby: {
    topbar: 'poczekalnia',
    leave: 'Wyjdź',
    code: 'Kod pokoju',
    share: 'Podaj ten kod znajomym. Wpiszą go na ekranie startowym.',
    players: (n, max) => `Gracze (${n}/${max})`,
    playersList: 'Lista graczy',
    you: 'ty',
    host: 'host',
    ready: 'gotowe',
    notReady: 'jeszcze nie',
    tooFew: `Czekamy na co najmniej ${MIN_PLAYERS} graczy.`,
    readyButton: 'Gotowe',
    notReadyButton: 'Jeszcze nie',
    startHint: 'Gra zacznie się u wszystkich naraz, gdy każdy będzie gotowy.',
  },
  waiting: {
    you: 'ty',
    waitingFor: (names) => `czekamy na: ${names.join(', ')}`,
    everyoneDone: 'wszyscy skończyli',
    stillThinking: 'jeszcze myśli',
  },
  question: {
    label: (n) => `Pytanie ${n}`,
    hintWrite: 'Zapisz liczbę. Nikt nie podejrzy, dopóki wszyscy nie oddadzą kartek.',
    hintBet: 'Potem każdy obstawia odpowiedź najbliższą prawdy, która jej nie przekracza.',
    myAnswer: 'Moja odpowiedź',
    handIn: 'Oddaj kartkę',
    handedIn: 'Kartka oddana',
    doneLabel: 'kartka oddana',
  },
  voting: {
    topbar: 'zakłady',
    hint: 'Rozłóż żetony na odpowiedzi, którym ufasz, albo pomiń tę rundę. Odpowiedzi są ułożone od najmniejszej do największej.',
    yourAnswer: 'Twoja odpowiedź',
    answer: 'Odpowiedź',
    bet: 'Zakład',
    betOn: (value) => `Żetony na ${value}`,
    tokensLeft: 'Zostało żetonów:',
    of: (total) => `z ${total}`,
    place: 'Postaw zakłady',
    skip: 'Pomiń zakłady',
    placed: 'Zakłady postawione',
    doneLabel: 'zakłady postawione',
  },
  results: {
    topbar: 'wyniki',
    correct: 'Prawidłowa odpowiedź',
    leftGame: 'Gracz wyszedł',
    exact: 'dokładnie! 2x',
    closest: 'najbliżej! 1,5x',
    near: 'do 25%: 1x',
    tooHigh: 'za dużo: przepada',
    tooLow: 'za mało: przepada',
    offBy: (value, unit) => `różnica ${value} ${unit}`,
    allOver: 'Każda odpowiedź przekroczyła prawdę, więc wszystkie zakłady przepadły.',
    exactly: (names) => `Dokładnie trafia: ${names}.`,
    closestShort: (names, off, unit) =>
      `Najbliżej bez przekroczenia: ${names}, zabrakło ${off} ${unit}.`,
    yourBets: 'Twoje zakłady:',
    tokensNow: (n) => `Masz ${n} ${plural(n, 'żeton', 'żetony', 'żetonów')}.`,
    next: 'Ranking za',
  },
  ranking: {
    topbarAfter: (n, total) => `po rundzie ${n} / ${total}`,
    topbarOver: 'koniec gry',
    topbar: 'ranking',
    list: 'Ranking graczy',
    tieFinal: 'Remis',
    tieLead: 'Remis na prowadzeniu',
    youWin: 'Wygrywasz',
    youLead: 'Prowadzisz',
    wins: (name) => `Wygrywa ${name}`,
    leads: (name) => `Prowadzi ${name}`,
    summary: (rounds, players) =>
      `${rounds} ${plural(rounds, 'runda', 'rundy', 'rund')}, ${players} ${plural(players, 'gracz', 'gracze', 'graczy')}.`,
    left: (n) =>
      n === 1
        ? 'Została jedna runda.'
        : `${plural(n, 'Została', 'Zostały', 'Zostało')} ${n} ${plural(n, 'runda', 'rundy', 'rund')}.`,
    sticky: 'Twój wiersz zostaje widoczny przy przewijaniu.',
    playAgain: 'Zagraj jeszcze raz',
    hostNote: 'Host może zacząć nową grę ze wszystkimi, którzy zostali w pokoju.',
    leave: 'Wyjdź z gry',
    next: 'Następna runda za',
  },
  errors: {
    nameEmpty: 'Wpisz swoje imię.',
    nameTooLong: `Imię może mieć najwyżej ${MAX_NAME_LENGTH} znaków.`,
    nameInvalid: 'Imię może zawierać tylko litery, cyfry, spacje, kropki, myślniki i podkreślenia.',
    codeInvalid: `Kod pokoju to ${ROOM_CODE_LENGTH} ${plural(ROOM_CODE_LENGTH, 'cyfra', 'cyfry', 'cyfr')}.`,
    answerEmpty: 'Najpierw zapisz liczbę.',
    answerTooLong: `Odpowiedź może mieć najwyżej ${MAX_ANSWER_LENGTH} znaków.`,
    answerInvalid: 'Odpowiedź musi być liczbą nieujemną.',
    answerTooLarge: 'Ta liczba jest za duża.',
    betsInvalid: 'Zakłady muszą być całymi liczbami żetonów.',
    betDuplicate: 'Na każdą odpowiedź możesz postawić tylko raz.',
    betTargetUnknown: 'Możesz obstawiać tylko odpowiedzi z tej rundy.',
    notEnoughTokens: 'Masz za mało żetonów na te zakłady.',
    gameStarted: 'Gra w tym pokoju już się zaczęła.',
    gameNotFinished: 'Obecna gra jeszcze się nie skończyła.',
    alreadyInRoom: 'Już jesteś w tym pokoju.',
    roomFull: 'Ten pokój jest pełny.',
    nameTaken: 'Ktoś w tym pokoju ma już takie imię.',
    notInRoom: 'Nie jesteś w tym pokoju.',
    answersClosed: 'Teraz nie zbieramy odpowiedzi.',
    alreadyAnswered: 'Twoja kartka jest już oddana.',
    votingClosed: 'Teraz nie można obstawiać.',
    alreadyVoted: 'Twoje zakłady są już postawione.',
    notHost: 'Tylko host może zacząć nową grę.',
    leaveRoomFirst: 'Najpierw wyjdź z obecnego pokoju.',
    noFreeCodes: 'Brak wolnych kodów pokoju, spróbuj za chwilę.',
    roomNotFound: 'Nie ma pokoju o takim kodzie.',
    readyInvalid: 'Nieprawidłowy stan gotowości.',
    notConnected: 'Brak połączenia z serwerem.',
  },
};

const dictionaries: Record<Locale, Messages> = { en, pl };
const STORAGE_KEY = 'lowball.locale';

const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // Storage can be blocked, e.g. in some private windows; fall back to the browser language.
  }
  return navigator.language.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

export const locale = writable<Locale>(initialLocale());

locale.subscribe((value) => {
  document.documentElement.lang = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // The choice then lasts only until the page is reloaded.
  }
});

export const t = derived(locale, ($locale) => dictionaries[$locale]);

export const languages = LOCALES.map((code) => ({ code, name: dictionaries[code].languageName }));
