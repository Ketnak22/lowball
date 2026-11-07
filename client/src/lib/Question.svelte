<script lang="ts">
  import { MAX_ANSWER_LENGTH, parseAnswer, type RoomView, type ErrorCode } from '@lowball/shared';
  import { errorMessage } from './errors';
  import { actions, me } from './game';
  import Waiting from './Waiting.svelte';

  let { room }: { room: RoomView } = $props();
  let answer = $state('');
  let error = $state<ErrorCode | null>(null);
  let busy = $state(false);

  const handedIn = $derived($me?.answered ?? false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (handedIn || busy) return;
    const parsed = parseAnswer(answer);
    if (!parsed.ok) {
      error = parsed.error;
      return;
    }
    busy = true;
    const response = await actions.answer(answer);
    busy = false;
    error = response.ok ? null : response.error;
  }
</script>

<section class="screen">
  <header class="topbar">
    <span class="hand">round {room.round?.number} / {room.totalRounds}</span>
  </header>

  <div class="columns">
    <div class="column prompt">
      <span class="label">Question {room.round?.number}</span>
      <h1 class="title">{room.round?.question}</h1>
      <div class="stack hints">
        <p class="hint">Write down a number. Nobody sees it until everyone has handed in.</p>
        <p class="hint">Then everyone bets on the answer closest without going over.</p>
      </div>
    </div>

    <form class="column" onsubmit={submit} novalidate>
      <div class="paper answer" class:handed-in={handedIn}>
        <label for="answer" class="label">My answer</label>
        <div class="answer-line">
          <input
            id="answer"
            class="field"
            bind:value={answer}
            inputmode="decimal"
            autocomplete="off"
            maxlength={MAX_ANSWER_LENGTH}
            aria-describedby="answer-error"
            aria-invalid={error ? 'true' : 'false'}
            disabled={handedIn}
            oninput={() => (error = null)}
          />
          <span class="unit muted">{room.round?.unit}</span>
        </div>
      </div>

      <div id="answer-error" class="error-slot" aria-live="polite">
        {#if error}<p class="error">{errorMessage(error)}</p>{/if}
      </div>

      <div class="spacer"></div>

      <button class="btn" disabled={handedIn || busy}>
        {handedIn ? 'Handed in' : 'Hand in'}
      </button>

      <Waiting
        players={room.players}
        meId={$me?.id}
        done={(player) => player.answered}
        doneLabel="handed in"
      />
    </form>
  </div>
</section>

<style>
  .prompt {
    gap: 8px;
    margin-top: 12px;
  }
  .hints {
    gap: 4px;
  }
  .answer {
    margin: 10px 2px 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: transform 300ms ease-out;
  }
  .answer.handed-in {
    transform: translateY(-4px) scale(0.985);
  }
  .answer-line {
    display: flex;
    align-items: flex-end;
    gap: 10px;
  }
  .field {
    flex-grow: 1;
    height: 60px;
    font-size: 48px;
  }
  .unit {
    padding-bottom: 12px;
  }
  form .error-slot {
    margin-top: -4px;
  }

  @media (min-width: 900px) {
    .prompt {
      flex-basis: 480px;
      gap: 14px;
      margin-top: 0;
      padding-top: 8px;
    }
    .prompt .label {
      font-size: 18px;
    }
    .hints {
      max-width: 34rem;
      gap: 6px;
    }
    form {
      flex: 1 1 380px;
      max-width: 460px;
      gap: 14px;
    }
    .answer {
      margin: 0;
      padding: 24px 26px 20px;
    }
    .field {
      height: 76px;
      font-size: 64px;
    }
    .unit {
      padding-bottom: 16px;
      font-size: 20px;
    }
  }
</style>
