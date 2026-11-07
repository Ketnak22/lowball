<script lang="ts">
  import type { RoomView } from '@lowball/shared';
  import Countdown from './Countdown.svelte';
  import { me } from './game';

  let { room }: { room: RoomView } = $props();
  const result = $derived(room.round?.result);
  const unit = $derived(room.round?.unit ?? '');
  const myChange = $derived(($me && result?.tokenChanges[$me.id]) ?? 0);
  const nameOf = (id: string) => room.players.find((p) => p.id === id)?.name ?? 'left the game';
</script>

<section class="card">
  <p class="label">Round {room.round?.number} of {room.totalRounds}</p>
  <p class="question">{room.round?.question}</p>

  {#if result}
    <p class="correct">Correct answer: <strong>{result.correctAnswer} {unit}</strong></p>

    <ul class="list">
      {#each room.round?.answers ?? [] as answer (answer.playerId)}
        <li
          class="row"
          class:exact={answer.value === result.correctAnswer}
          class:closest={answer.value === result.closestAnswer &&
            answer.value !== result.correctAnswer}
        >
          <span class="value">{answer.value} {unit}</span>
          <span class="who">{nameOf(answer.playerId)}</span>
        </li>
      {/each}
    </ul>

    <p class="tokens">
      Your tokens: {$me?.tokens} ({myChange >= 0 ? '+' : ''}{myChange})
    </p>
  {/if}

  <Countdown endsAt={room.phaseEndsAt} label="Ranking in" />
</section>

<style>
  .correct {
    font-size: 1.15rem;
  }
  .exact {
    background: #4caf50;
    color: #fff;
  }
  .closest {
    background: #ff9800;
    color: #fff;
  }
  .who {
    font-size: 0.9em;
    opacity: 0.8;
  }
</style>
