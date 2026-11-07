<script lang="ts">
  import type { Bet, RoomView } from '@lowball/shared';
  import { actions, me } from './game';

  let { room }: { room: RoomView } = $props();
  let stakes = $state<Record<string, number | null>>({});
  let error = $state<string | null>(null);

  const bets = $derived<Bet[]>(
    Object.entries(stakes)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0)
      .map(([playerId, amount]) => ({ playerId, amount })),
  );
  const staked = $derived(bets.reduce((sum, bet) => sum + bet.amount, 0));
  const left = $derived(($me?.tokens ?? 0) - staked);
  const votedCount = $derived(room.players.filter((p) => p.voted).length);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (bets.some((bet) => !Number.isInteger(bet.amount))) {
      error = 'Bets must be whole numbers.';
      return;
    }
    if (left < 0) {
      error = 'You do not have enough tokens for these bets.';
      return;
    }
    const response = await actions.placeBets(bets);
    error = response.ok ? null : response.error;
  }
</script>

<section class="card">
  <p class="label">Round {room.round?.number} of {room.totalRounds}</p>
  <p class="question">{room.round?.question}</p>

  {#if $me?.voted}
    <span class="spinner"></span>
    <p>Waiting for other players ({votedCount}/{room.players.length})</p>
  {:else}
    <h2>Place your bets</h2>
    <p>Spread tokens over the answers you trust. You can also skip.</p>
    <form onsubmit={submit}>
      <ul class="list">
        {#each room.round?.answers ?? [] as answer (answer.playerId)}
          <li class="row">
            <span class="value">
              {answer.value}
              {room.round?.unit}
              {#if answer.playerId === $me?.id}<span class="tag">yours</span>{/if}
            </span>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="0"
              bind:value={stakes[answer.playerId]}
              aria-label="Tokens on {answer.value}"
            />
          </li>
        {/each}
      </ul>
      <p class="tokens" class:over={left < 0}>Tokens left: {left}</p>
      <button class="btn green-btn">{bets.length > 0 ? 'Place bets' : 'Skip betting'}</button>
    </form>
  {/if}

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}
</section>

<style>
  form {
    width: 100%;
  }
  .row input {
    width: 90px;
  }
  .over {
    color: #c62828;
  }
</style>
