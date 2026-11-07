<script lang="ts">
  import { MAX_ANSWER_LENGTH, parseAnswer, type RoomView } from '@lowball/shared';
  import { actions, me } from './game';

  let { room }: { room: RoomView } = $props();
  let answer = $state('');
  let error = $state<string | null>(null);

  const answeredCount = $derived(room.players.filter((p) => p.answered).length);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const parsed = parseAnswer(answer);
    if (!parsed.ok) {
      error = parsed.error;
      return;
    }
    const response = await actions.answer(answer);
    error = response.ok ? null : response.error;
  }
</script>

<section class="card">
  <p class="label">Round {room.round?.number} of {room.totalRounds}</p>
  <p class="question">{room.round?.question}</p>

  {#if $me?.answered}
    <span class="spinner"></span>
    <p>Waiting for other players ({answeredCount}/{room.players.length})</p>
  {:else}
    <form onsubmit={submit}>
      <input
        bind:value={answer}
        inputmode="decimal"
        maxlength={MAX_ANSWER_LENGTH}
        placeholder="Your answer ({room.round?.unit})"
        aria-label="Your answer"
      />
      <button class="btn green-btn">Answer</button>
    </form>
  {/if}

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}
</section>

<style>
  form {
    display: flex;
    gap: 10px;
    align-items: center;
  }
</style>
