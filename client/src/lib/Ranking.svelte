<script lang="ts">
  import type { RoomView } from '@lowball/shared';
  import Countdown from './Countdown.svelte';
  import { actions, me } from './game';

  let { room }: { room: RoomView } = $props();
  let error = $state<string | null>(null);

  const finished = $derived(room.phase === 'finished');
  const ranking = $derived([...room.players].sort((a, b) => b.tokens - a.tokens));
  const isHost = $derived($me?.id === room.hostId);

  async function playAgain() {
    const response = await actions.restart();
    error = response.ok ? null : response.error;
  }
</script>

<section class="card">
  <h2 class="title">{finished ? 'Final ranking' : 'Ranking'}</h2>

  <ol class="list">
    {#each ranking as player, index (player.id)}
      <li class="row place-{index + 1}">
        <span class="value">{index + 1}. {player.name}</span>
        <span>{player.tokens} tokens</span>
      </li>
    {/each}
  </ol>

  {#if finished}
    <div class="actions">
      <button class="btn red-btn" onclick={actions.leave}>Leave</button>
      {#if isHost}
        <button class="btn green-btn" onclick={playAgain}>Play again</button>
      {/if}
    </div>
    {#if !isHost}
      <p>The host can start a new game with everyone still in the room.</p>
    {/if}
  {:else}
    <Countdown endsAt={room.phaseEndsAt} label="Next round in" />
  {/if}

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}
</section>

<style>
  .place-1 {
    background: #ffe082;
  }
  .place-2 {
    background: #e0e0e0;
  }
  .place-3 {
    background: #ffccbc;
  }
</style>
