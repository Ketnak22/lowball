<script lang="ts">
  import {
    MAX_PLAYERS,
    MIN_PLAYERS,
    type PlayerView,
    type RoomView,
    type ErrorCode,
  } from '@lowball/shared';
  import { t } from './i18n';
  import LanguageSwitch from './LanguageSwitch.svelte';
  import { initials } from './format';
  import { actions, me } from './game';

  let { room }: { room: RoomView } = $props();
  let error = $state<ErrorCode | null>(null);

  const tooFew = $derived(room.players.length < MIN_PLAYERS);

  function details(player: PlayerView): string {
    const parts: string[] = [];
    if (player.id === $me?.id) parts.push($t.lobby.you);
    if (player.id === room.hostId) parts.push($t.lobby.host);
    parts.push(player.ready ? $t.lobby.ready : $t.lobby.notReady);
    return parts.join(' · ');
  }

  async function toggleReady() {
    const response = await actions.setReady(!$me?.ready);
    error = response.ok ? null : response.error;
  }
</script>

<section class="screen">
  <header class="topbar ruled">
    <span class="hand">{$t.lobby.topbar}</span>
    <div class="topbar-actions">
      <LanguageSwitch />
      <button class="text-btn" onclick={actions.leave}>{$t.lobby.leave}</button>
    </div>
  </header>

  <div class="columns">
    <div class="column">
      <div class="paper code-card">
        <span class="label">{$t.lobby.code}</span>
        <span class="code hand pen">{room.code}</span>
        <span class="label">{$t.lobby.share}</span>
      </div>
    </div>

    <div class="column">
      <h2 class="players-title">{$t.lobby.players(room.players.length, MAX_PLAYERS)}</h2>
      <ul class="players" aria-label={$t.lobby.playersList}>
        {#each room.players as player (player.id)}
          <li>
            <span class="avatar" class:pending={!player.ready} aria-hidden="true">
              {initials(player.name)}
            </span>
            <span class="name">{player.name}</span>
            <span class="label">{details(player)}</span>
          </li>
        {/each}
      </ul>

      <div class="spacer"></div>

      <div class="stack actions">
        {#if tooFew}
          <p class="note">{$t.lobby.tooFew}</p>
        {/if}
        <button class="btn" class:secondary={$me?.ready} onclick={toggleReady}>
          {$me?.ready ? $t.lobby.notReadyButton : $t.lobby.readyButton}
        </button>
        <p class="label center">{$t.lobby.startHint}</p>
        <div class="error-slot" aria-live="polite">
          {#if error}<p class="error center">{$t.errors[error]}</p>{/if}
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .topbar {
    align-items: center;
  }
  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .code-card {
    margin: 8px 6px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    text-align: center;
  }
  .code {
    font-size: 80px;
    line-height: 1.05;
    letter-spacing: 0.1em;
  }
  .players-title {
    margin-top: 16px;
    font-size: 19px;
    font-weight: 600;
  }
  .players {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .players li {
    min-height: 52px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--grid);
  }
  .name {
    flex-grow: 1;
    min-width: 0;
    font-size: 18px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (min-width: 900px) {
    .code-card {
      margin: 8px 0 0;
      padding: 36px 32px;
      gap: 4px;
    }
    .code {
      font-size: 160px;
      line-height: 1;
      letter-spacing: 0.08em;
    }
    .code-card .label {
      font-size: 18px;
    }
    .players-title {
      margin-top: 0;
      font-size: 24px;
    }
    .players {
      max-height: 362px;
      overflow-y: auto;
    }
    .players li {
      min-height: 60px;
    }
    .name {
      font-size: 20px;
    }
    .actions {
      margin-top: 16px;
    }
  }
</style>
