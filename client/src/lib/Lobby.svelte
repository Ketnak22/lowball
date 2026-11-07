<script lang="ts">
  import { MIN_PLAYERS, type RoomView } from '@lowball/shared';
  import { actions, me } from './game';

  let { room }: { room: RoomView } = $props();
  let error = $state<string | null>(null);

  async function toggleReady() {
    const response = await actions.setReady(!$me?.ready);
    error = response.ok ? null : response.error;
  }
</script>

<section class="card wide-card">
  <p class="label">Room code</p>
  <h1 class="room-code">{room.code}</h1>
  <p>Share the code with other players. The game starts when everyone is ready.</p>

  <ul class="players">
    {#each room.players as player (player.id)}
      <li class:ready={player.ready}>
        <span class="name">{player.name}</span>
        {#if player.id === room.hostId}<span class="tag">host</span>{/if}
        {#if player.id === $me?.id}<span class="tag">you</span>{/if}
      </li>
    {/each}
  </ul>

  {#if room.players.length < MIN_PLAYERS}
    <p class="info">Waiting for at least {MIN_PLAYERS} players.</p>
  {/if}

  <div class="actions">
    <button class="btn red-btn" onclick={actions.leave}>Leave</button>
    <button class="btn green-btn" onclick={toggleReady}>
      {$me?.ready ? 'Not ready' : 'Ready'}
    </button>
  </div>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}
</section>

<style>
  .room-code {
    background: #4b3869;
    color: #fff;
    border-radius: 0.7em;
    padding: 12px 36px;
    margin: 0 0 12px;
    letter-spacing: 0.2em;
  }
  .players {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    list-style: none;
    padding: 0;
    margin: 16px 0;
  }
  .players li {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 120px;
    min-height: 56px;
    padding: 0 18px;
    justify-content: center;
    border-radius: 0.7em;
    color: #fff;
    font-weight: 600;
    background: #e57373;
  }
  .players li.ready {
    background: #4caf50;
  }
  .name {
    max-width: 15ch;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
